"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { logActivity } from "@/lib/activity";
import { requireUser } from "@/lib/auth/guards";
import { connectDB } from "@/lib/db";
import { Activity, Attachment, Business, Catalog, Order } from "@/lib/models";
import type { BusinessDetails, OrderFormField } from "@/lib/models";
import { countBusinesses } from "@/lib/queries";
import { uniqueSlug } from "@/lib/slug";
import { getTranslator } from "@/lib/i18n-server";

export interface ActionState {
  ok: boolean;
  error?: string;
  message?: string;
}

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

/** `[{ key, value }]` rows from the Details table. */
function parseDetails(value: string): BusinessDetails {
  const rows = parseJson(value);
  if (!Array.isArray(rows)) return {};

  const details: BusinessDetails = {};
  for (const row of rows) {
    const raw = row as Record<string, unknown>;
    const key = typeof raw.key === "string" ? raw.key.trim() : "";
    const value = typeof raw.value === "string" ? raw.value.trim() : "";
    if (key) details[key] = value;
  }
  return details;
}

/** `[{ phone }]` rows from the Contact Persons table. */
function parseContacts(value: string): string[] {
  const rows = parseJson(value);
  if (!Array.isArray(rows)) return [];

  return rows
    .map((row) =>
      typeof row === "string"
        ? row
        : String((row as Record<string, unknown>)?.phone ?? ""),
    )
    .map((phone) => phone.trim())
    .filter(Boolean)
    .slice(0, 10);
}

export interface UploadedRow {
  url: string;
  name?: string;
  size?: number;
  type?: string;
  order?: number;
}

export interface BusinessFile {
  url: string;
  name: string;
  type: "image" | "file";
  order: number;
}

/** Files uploaded through the drop zone. */
function parseFiles(value: string): BusinessFile[] {
  const rows = parseJson(value);
  if (!Array.isArray(rows)) return [];

  return rows
    .map((row) => row as UploadedRow)
    .filter((row) => typeof row.url === "string" && row.url.startsWith("/uploads/"))
    .map((row, index) => ({
      url: row.url,
      name: row.name ?? row.url.split("/").pop() ?? "",
      type: row.type === "file" ? ("file" as const) : ("image" as const),
      order: index,
    }))
    .slice(0, 20);
}

const ORDER_FIELD_TYPES = ["text", "textarea", "tel", "email", "select"] as const;

/** `[{ name, type }]` rows from the Order Forms table. */
function parseOrderFormTemplates(value: string): OrderFormField[] {
  const rows = parseJson(value);
  if (!Array.isArray(rows)) return [];

  const usedKeys = new Set<string>();

  return rows
    .map((row, index) => {
      const raw = row as Record<string, unknown>;
      const label = typeof raw.name === "string" ? raw.name.trim() : "";
      const type = ORDER_FIELD_TYPES.includes(
        raw.type as (typeof ORDER_FIELD_TYPES)[number],
      )
        ? (raw.type as OrderFormField["type"])
        : "text";

      const baseKey =
        label
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, "_")
          .replace(/^_+|_+$/g, "")
          .slice(0, 24) || `field_${index + 1}`;

      let key = baseKey;
      let suffix = 2;
      while (usedKeys.has(key)) key = `${baseKey}_${suffix++}`;
      usedKeys.add(key);

      return { key, label, type, required: index < 2 } satisfies OrderFormField;
    })
    .filter((field) => field.label.length > 0)
    .slice(0, 20);
}

/** Replaces the business attachments with the ones currently in the form. */
async function syncAttachments(
  businessId: string,
  files: UploadedRow[],
): Promise<string> {
  await Attachment.deleteMany({ parentEntity: "business", parentId: businessId });

  if (files.length === 0) return "";

  await Attachment.insertMany(
    files.map((file) => ({
      parentEntity: "business",
      parentId: businessId,
      url: file.url,
      alt: file.name,
      kind: file.type === "file" ? "file" : "image",
      order: file.order,
    })),
  );

  return files[0]?.url ?? "";
}

export async function createBusinessAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const user = await requireUser();
  const t = await getTranslator();

  const name = str(formData.get("name"));
  const details = parseDetails(str(formData.get("details")));
  const orderFormTemplates = parseOrderFormTemplates(str(formData.get("orderForms")));
  const contactPhones = parseContacts(str(formData.get("contacts")));
  const files = parseFiles(str(formData.get("files")));

  if (name.length < 2) return { ok: false, error: t("errors.validation") };

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
    contactPhones,
    details,
    orderFormTemplates,
    status: "visible",
    isActive: true,
  });

  const image = await syncAttachments(business._id.toString(), files);
  if (image) {
    business.image = image;
    await business.save();
  }

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
  const details = parseDetails(str(formData.get("details")));
  const orderFormTemplates = parseOrderFormTemplates(str(formData.get("orderForms")));
  const contactPhones = parseContacts(str(formData.get("contacts")));
  const files = parseFiles(str(formData.get("files")));
  const statusInput = str(formData.get("status"));
  const isActiveInput = str(formData.get("isActive"));
  const status: "visible" | "hide" =
    statusInput === "hide" || isActiveInput === "false" || isActiveInput === "off"
      ? "hide"
      : "visible";
  const isActive = status === "visible";

  if (name.length < 2) return { ok: false, error: t("errors.validation") };

  await connectDB();

  const business = await Business.findOne({ _id: businessId, owner: user.id });
  if (!business) return { ok: false, error: t("errors.notFound") };

  const slug = await uniqueSlug(
    name,
    async (candidate) =>
      Boolean(await Business.exists({ slug: candidate, _id: { $ne: businessId } })),
  );

  business.name = name;
  business.slug = slug;
  business.contactPhones = contactPhones;
  business.details = details;
  business.orderFormTemplates = orderFormTemplates;
  business.status = status;
  business.isActive = isActive;
  await business.save();

  const image = await syncAttachments(businessId, files);
  business.image = image;
  await business.save();

  await logActivity({
    businessId,
    action: "business.updated",
    detail: `**${user.name}** updated the business details.`,
    actorId: user.id,
    isRead: true,
  });

  revalidatePath(`/businesses/${businessId}`, "layout");
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