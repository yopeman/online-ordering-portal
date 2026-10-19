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

function parseJson(value: string): unknown {
  if (!value) return [];
  try {
    return JSON.parse(value);
  } catch {
    return [];
  }
}

/** `[{ key, value }]` rows from the product Details table. */
function parseDetails(value: string): Record<string, unknown> {
  const rows = parseJson(value);
  if (!Array.isArray(rows)) return {};

  const details: Record<string, unknown> = {};
  for (const row of rows) {
    const raw = row as Record<string, unknown>;
    const key = typeof raw.key === "string" ? raw.key.trim() : "";
    const value = typeof raw.value === "string" ? raw.value.trim() : "";
    if (key) details[key] = value;
  }
  return details;
}

export interface ProductFile {
  url: string;
  name: string;
  type: "image" | "file";
  order: number;
}

/** Files uploaded through the product drop zone. */
function parseFiles(value: string): ProductFile[] {
  const rows = parseJson(value);
  if (!Array.isArray(rows)) return [];

  return rows
    .map((row) => row as Record<string, unknown>)
    .filter(
      (row) =>
        typeof row.url === "string" &&
        (row.url.startsWith("data:") ||
          row.url.startsWith("/uploads/") ||
          row.url.startsWith("http://") ||
          row.url.startsWith("https://")),
    )
    .map((row, index) => {
      const url = row.url as string;
      const rawName = typeof row.name === "string" ? row.name.trim() : "";
      const name =
        rawName || (url.startsWith("data:") ? "Attachment" : url.split("/").pop() ?? "Attachment");

      return {
        url,
        name,
        type: row.type === "file" ? ("file" as const) : ("image" as const),
        order: index,
      };
    })
    .slice(0, 20);
}

async function syncAttachments(
  productId: string,
  files: ProductFile[],
): Promise<string> {
  await Attachment.deleteMany({ parentEntity: "catalog", parentId: productId });

  if (files.length > 0) {
    await Attachment.insertMany(
      files.map((file) => ({
        parentEntity: "catalog",
        parentId: productId,
        url: file.url,
        alt: file.name,
        kind: file.type,
        order: file.order,
      })),
    );
  }

  return files.find((file) => file.type === "image")?.url ?? "";
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
  const details = parseDetails(str(formData.get("details")));
  const price = Number(str(formData.get("price")) || 0);
  const currency = str(formData.get("currency")) || "ETB";
  const files = parseFiles(str(formData.get("files")));
  const isActive = str(formData.get("isActive")) !== "false";

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
    isActive,
    details,
  });

  const image = await syncAttachments(product._id.toString(), files);
  if (image) {
    product.image = image;
    await product.save();
  }

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
  const details = parseDetails(str(formData.get("details")));
  const price = Number(str(formData.get("price")) || 0);
  const currency = str(formData.get("currency")) || "ETB";
  const files = parseFiles(str(formData.get("files")));
  const isActive = str(formData.get("isActive")) !== "false";

  if (name.length < 2) return { ok: false, error: t("errors.validation") };
  if (!Number.isFinite(price) || price < 0) {
    return { ok: false, error: t("errors.validation") };
  }

  const slug = await uniqueSlug(
    name,
    async (candidate) =>
      Boolean(await Catalog.exists({ slug: candidate, _id: { $ne: productId } })),
  );

  product.name = name;
  product.slug = slug;
  product.category = category;
  product.price = price;
  product.currency = currency;
  product.isActive = isActive;
  product.details = { ...readCatalogDetails(product.details), ...details };
  await product.save();

  const image = await syncAttachments(productId, files);
  product.image = image;
  await product.save();

  await logActivity({
    businessId,
    action: "catalog.updated",
    detail: `**${user.name}** updated the product **${product.name}**.`,
    actorId: user.id,
  });

  revalidatePath(`/businesses/${businessId}/catalog`);
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