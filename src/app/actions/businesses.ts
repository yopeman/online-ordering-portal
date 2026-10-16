"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { logActivity } from "@/lib/activity";
import { requireUser } from "@/lib/auth/guards";
import { connectDB } from "@/lib/db";
import { Activity, Attachment, Business, Catalog, Order, readDetails } from "@/lib/models";
import type { OrderFormField } from "@/lib/models";
import { uniqueSlug } from "@/lib/slug";
import { countBusinesses } from "@/lib/queries";
import { getTranslator } from "@/lib/i18n-server";

export interface ActionState {
  ok: boolean;
  error?: string;
  message?: string;
}

function str(value: FormDataEntryValue | null): string {
  return typeof value === "string" ? value.trim() : "";
}

function parsePhones(value: string): string[] {
  return value
    .split(/[\n,]/)
    .map((phone) => phone.trim())
    .filter(Boolean)
    .slice(0, 10);
}

const ORDER_FIELD_TYPES = ["text", "textarea", "tel", "email", "select"] as const;

/** Validates the order form template JSON produced by the settings form. */
function parseOrderFormTemplates(value: string): OrderFormField[] {
  if (!value) return [];

  let parsed: unknown;
  try {
    parsed = JSON.parse(value);
  } catch {
    return [];
  }

  if (!Array.isArray(parsed)) return [];

  return parsed
    .map((field, index) => {
      const raw = field as Record<string, unknown>;
      const label = typeof raw.label === "string" ? raw.label.trim() : "";
      const key =
        typeof raw.key === "string" && raw.key.trim()
          ? raw.key.trim().replace(/[^a-zA-Z0-9_]/g, "_")
          : `field_${index + 1}`;
      const type = ORDER_FIELD_TYPES.includes(raw.type as (typeof ORDER_FIELD_TYPES)[number])
        ? (raw.type as OrderFormField["type"])
        : "text";

      return {
        key,
        label: label || key,
        type,
        required: Boolean(raw.required),
        options: Array.isArray(raw.options)
          ? raw.options.filter((option): option is string => typeof option === "string")
          : [],
      };
    })
    .filter((field) => field.label.length > 0)
    .slice(0, 20);
}

export async function createBusinessAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const user = await requireUser();
  const t = await getTranslator();

  const name = str(formData.get("name"));
  const description = str(formData.get("description"));
  const category = str(formData.get("category"));
  const location = str(formData.get("location"));
  const image = str(formData.get("image"));
  const contactPhones = parsePhones(str(formData.get("contactPhones")));

  if (name.length < 2) {
    return { ok: false, error: t("errors.validation") };
  }

  await connectDB();

  const owned = await countBusinesses(user.id);
  if (owned >= user.maxBusinesses) {
    return {
      ok: false,
      error: t("dashboard.limitReached", { max: user.maxBusinesses }),
    };
  }

  const slug = await uniqueSlug(
    name,
    async (candidate) => Boolean(await Business.exists({ slug: candidate })),
  );

  const business = await Business.create({
    name,
    slug,
    owner: user.id,
    image,
    contactPhones,
    details: { description, category, location },
    orderFormTemplates: [],
  });

  await logActivity({
    businessId: business._id.toString(),
    action: "business.created",
    detail: `**${user.name}** created the business **${business.name}**.`,
    actorId: user.id,
    isRead: true,
  });

  revalidatePath("/businesses");
  revalidatePath("/marketplace");
  redirect(`/businesses/${business._id.toString()}/catalog`);
}

export async function updateBusinessAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const user = await requireUser();
  const t = await getTranslator();

  const businessId = str(formData.get("businessId"));
  const name = str(formData.get("name"));
  const description = str(formData.get("description"));
  const category = str(formData.get("category"));
  const location = str(formData.get("location"));
  const image = str(formData.get("image"));
  const isActive = formData.get("isActive") === "on";
  const contactPhones = parsePhones(str(formData.get("contactPhones")));
  const orderFormTemplates = parseOrderFormTemplates(
    str(formData.get("orderFormTemplates")),
  );

  if (name.length < 2) return { ok: false, error: t("errors.validation") };

  await connectDB();

  const business = await Business.findOne({ _id: businessId, owner: user.id });
  if (!business) return { ok: false, error: t("errors.notFound") };

  const previousDetails = readDetails(business.details);
  const slug = await uniqueSlug(
    name,
    async (candidate) =>
      Boolean(await Business.exists({ slug: candidate, _id: { $ne: businessId } })),
  );

  business.name = name;
  business.slug = slug;
  business.image = image;
  business.contactPhones = contactPhones;
  business.isActive = isActive;
  business.details = { ...previousDetails, description, category, location };
  business.orderFormTemplates = orderFormTemplates;
  await business.save();

  await logActivity({
    businessId: businessId,
    action: "business.updated",
    detail: `**${user.name}** updated the business details.`,
    actorId: user.id,
    isRead: true,
  });

  revalidatePath(`/businesses/${businessId}/settings`);
  revalidatePath(`/businesses/${businessId}`);
  revalidatePath("/businesses");
  revalidatePath("/marketplace");
  revalidatePath(`/store/${slug}`);

  return { ok: true, message: t("settings.saved") };
}

export async function deleteBusinessAction(formData: FormData): Promise<void> {
  const user = await requireUser();
  const businessId = str(formData.get("businessId"));
  const confirmation = str(formData.get("confirmation"));

  await connectDB();

  const business = await Business.findOne({ _id: businessId, owner: user.id }).lean();
  if (!business || business.name !== confirmation) return;

  const productIds = await Catalog.find({ business: businessId })
    .distinct("_id")
    .then((ids) => ids.map((id) => id.toString()));

  await Promise.all([
    Catalog.deleteMany({ business: businessId }),
    Order.deleteMany({ business: businessId }),
    Activity.deleteMany({ business: businessId }),
    Attachment.deleteMany({
      $or: [
        { parentId: businessId, parentEntity: "business" },
        { parentId: { $in: productIds }, parentEntity: "catalog" },
      ],
    }),
  ]);
  await Business.deleteOne({ _id: businessId });

  revalidatePath("/businesses");
  revalidatePath("/marketplace");
  redirect("/businesses");
}

export async function loadOwnedBusiness(businessId: string) {
  const user = await requireUser();
  await connectDB();
  const business = await Business.findOne({ _id: businessId, owner: user.id }).lean();
  return { user, business: business as Awaited<ReturnType<typeof Business.findOne>> };
}
