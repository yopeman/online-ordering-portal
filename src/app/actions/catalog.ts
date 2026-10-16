"use server";

import { revalidatePath } from "next/cache";

import { logActivity } from "@/lib/activity";
import { requireUser } from "@/lib/auth/guards";
import { connectDB } from "@/lib/db";
import { Attachment, Business, Catalog, User, readCatalogDetails } from "@/lib/models";
import { countProducts } from "@/lib/queries";
import { uniqueSlug } from "@/lib/slug";
import { getTranslator } from "@/lib/i18n-server";

import type { ActionState } from "./businesses";

function str(value: FormDataEntryValue | null): string {
  return typeof value === "string" ? value.trim() : "";
}

/** Parses the dynamic `attachment_url_*` inputs rendered by the product form. */
function parseAttachments(formData: FormData) {
  const urls = formData.getAll("attachmentUrl").map((value) =>
    typeof value === "string" ? value.trim() : "",
  );
  const alts = formData.getAll("attachmentAlt").map((value) =>
    typeof value === "string" ? value.trim() : "",
  );
  const kinds = formData.getAll("attachmentKind").map((value) =>
    typeof value === "string" ? value.trim() : "",
  );

  return urls
    .map((url, index) => ({ url, alt: alts[index] ?? "", kind: kinds[index] ?? "image" }))
    .filter((item) => item.url.startsWith("http://") || item.url.startsWith("https://"))
    .map((item, index) => ({
      url: item.url,
      alt: item.alt,
      kind: item.kind === "file" || item.kind === "link" ? item.kind : "image",
      order: index,
    }));
}

async function ownedBusiness(businessId: string) {
  const user = await requireUser();
  await connectDB();
  const business = await Business.findOne({ _id: businessId, owner: user.id });
  return { user, business };
}

export async function createProductAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const t = await getTranslator();
  const businessId = str(formData.get("businessId"));
  const { user, business } = await ownedBusiness(businessId);

  if (!business) return { ok: false, error: t("errors.notFound") };

  const name = str(formData.get("name"));
  const category = str(formData.get("category"));
  const description = str(formData.get("description"));
  const price = Number(str(formData.get("price")) || 0);
  const currency = str(formData.get("currency")) || "ETB";
  const image = str(formData.get("image"));

  if (name.length < 2) return { ok: false, error: t("errors.validation") };
  if (!Number.isFinite(price) || price < 0) {
    return { ok: false, error: t("errors.validation") };
  }

  const existing = await countProducts(businessId);
  const owner = await User.findById(business.owner).select("maxCatalogs").lean();
  const maxCatalogs = owner?.maxCatalogs ?? 50;

  if (existing >= maxCatalogs) {
    return { ok: false, error: t("dashboard.catalogLimit", { max: maxCatalogs }) };
  }

  const slug = await uniqueSlug(
    name,
    async (candidate) => Boolean(await Catalog.exists({ slug: candidate })),
  );

  const product = await Catalog.create({
    name,
    slug,
    business: businessId,
    category,
    price,
    currency,
    image,
    isActive: formData.get("isActive") !== "off",
    details: { description },
  });

  await Attachment.insertMany(
    parseAttachments(formData).map((attachment) => ({
      ...attachment,
      parentEntity: "catalog",
      parentId: product._id,
    })),
  );

  await logActivity({
    businessId,
    action: "catalog.created",
    detail: `**${user.name}** added the product **${product.name}** (${currency} ${price}).`,
    actorId: user.id,
  });

  revalidatePath(`/businesses/${businessId}/catalog`);
  revalidatePath(`/products/${slug}`);
  revalidatePath(`/store/${business.slug}`);
  revalidatePath("/marketplace");

  return { ok: true, message: t("settings.saved") };
}

export async function updateProductAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const t = await getTranslator();
  const businessId = str(formData.get("businessId"));
  const productId = str(formData.get("productId"));
  const { user, business } = await ownedBusiness(businessId);

  if (!business) return { ok: false, error: t("errors.notFound") };

  const product = await Catalog.findOne({ _id: productId, business: businessId });
  if (!product) return { ok: false, error: t("errors.notFound") };

  const name = str(formData.get("name"));
  const category = str(formData.get("category"));
  const description = str(formData.get("description"));
  const price = Number(str(formData.get("price")) || 0);
  const currency = str(formData.get("currency")) || "ETB";
  const image = str(formData.get("image"));

  if (name.length < 2) return { ok: false, error: t("errors.validation") };
  if (!Number.isFinite(price) || price < 0) {
    return { ok: false, error: t("errors.validation") };
  }

  const slug = await uniqueSlug(
    str(formData.get("slug")) || name,
    async (candidate) =>
      Boolean(await Catalog.exists({ slug: candidate, _id: { $ne: productId } })),
  );

  const previousDetails = readCatalogDetails(product.details);

  product.name = name;
  product.slug = slug;
  product.category = category;
  product.price = price;
  product.currency = currency;
  product.image = image;
  product.isActive = formData.get("isActive") !== "off";
  product.details = { ...previousDetails, description };
  await product.save();

  await Attachment.deleteMany({ parentEntity: "catalog", parentId: product._id });
  const attachments = parseAttachments(formData);
  if (attachments.length > 0) {
    await Attachment.insertMany(
      attachments.map((attachment) => ({
        ...attachment,
        parentEntity: "catalog",
        parentId: product._id,
      })),
    );
  }

  await logActivity({
    businessId,
    action: "catalog.updated",
    detail: `**${user.name}** updated the product **${product.name}**.`,
    actorId: user.id,
  });

  revalidatePath(`/businesses/${businessId}/catalog`);
  revalidatePath(`/businesses/${businessId}/catalog/${productId}`);
  revalidatePath(`/products/${slug}`);
  revalidatePath(`/store/${business.slug}`);
  revalidatePath("/marketplace");

  return { ok: true, message: t("settings.saved") };
}

export async function deleteProductAction(formData: FormData): Promise<void> {
  const businessId = str(formData.get("businessId"));
  const productId = str(formData.get("productId"));
  const { user, business } = await ownedBusiness(businessId);

  if (!business) return;

  await connectDB();
  const product = await Catalog.findOne({ _id: productId, business: businessId });
  if (!product) return;

  await Promise.all([
    Catalog.deleteOne({ _id: productId }),
    Attachment.deleteMany({ parentEntity: "catalog", parentId: productId }),
  ]);

  await logActivity({
    businessId,
    action: "catalog.deleted",
    detail: `**${user.name}** deleted the product **${product.name}**.`,
    actorId: user.id,
  });

  revalidatePath(`/businesses/${businessId}/catalog`);
  revalidatePath(`/store/${business.slug}`);
  revalidatePath("/marketplace");
}
