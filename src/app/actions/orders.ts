"use server";

import { revalidatePath } from "next/cache";

import { logActivity } from "@/lib/activity";
import { requireUser } from "@/lib/auth/guards";
import { connectDB } from "@/lib/db";
import {
  Activity,
  Business,
  Catalog,
  Order,
  readContacts,
  readOrderFormTemplates,
  type OrderFormField,
} from "@/lib/models";
import { DEFAULT_ORDER_FORM_FIELDS } from "@/lib/models";
import { getTranslator } from "@/lib/i18n-server";
import { dispatchOrderNotification } from "@/lib/notifications";

import type { ActionState } from "./businesses";

function str(value: FormDataEntryValue | null): string {
  return typeof value === "string" ? value.trim() : "";
}

/**
 * Places a public order for a product. Answers are validated against the
 * business order form template and stored in `details`.
 */
export async function placeOrderAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const t = await getTranslator();
  const slug = str(formData.get("slug"));

  await connectDB();

  const product = await Catalog.findOne({ slug, isActive: true }).lean();
  if (!product) return { ok: false, error: t("errors.notFound") };

  const business = await Business.findById(product.business).lean();
  if (!business || !business.isActive || business.status === "hide") {
    return { ok: false, error: t("errors.notFound") };
  }

  const fields: OrderFormField[] = (() => {
    const configured = readOrderFormTemplates(business.orderFormTemplates);
    return configured.length > 0 ? configured : DEFAULT_ORDER_FORM_FIELDS;
  })();

  const answers: Record<string, string> = {};
  const custom: Record<string, string> = {};

  // Which of the business contact channels should handle this order.
  const contacts = readContacts(business.contactPhones);
  const requestedContact = str(formData.get("contactPhone"));
  const matched = contacts.find((c) => c.target === requestedContact);
  const contactPhone = matched ? matched.target : contacts[0]?.target ?? "";

  for (const field of fields) {
    const value = str(formData.get(`field_${field.key}`));
    if (field.required && !value) {
      return { ok: false, error: `${field.label}, ${t("common.required")}` };
    }
    if (["customerName", "phone", "email", "note"].includes(field.key)) {
      answers[field.key] = value;
    } else {
      custom[field.key] = value;
    }
  }

  const quantity = Math.min(100, Math.max(1, Number(str(formData.get("quantity"))) || 1));
  const price = product.price ?? 0;

  const details = {
    ...answers,
    custom,
    contactPhone,
    quantity,
    unitPrice: price,
    currency: product.currency ?? "ETB",
    total: price * quantity,
  };

  await Order.create({
    product: product._id,
    business: product.business,
    isRead: false,
    details,
  });

  await logActivity({
    businessId: product.business.toString(),
    action: "order.received",
    detail:
      `New order for **${product.name}** ×${quantity} from **${answers.customerName || t("orders.unknownCustomer")}**` +
      `${answers.phone ? ` (${answers.phone})` : ""}` +
      `${contactPhone ? `, ${t("product.contactNumber")}: ${contactPhone}` : ""}` +
      `, ${t("common.total")} ${price * quantity} ${product.currency ?? "ETB"}.`,
  });

  // Asynchronously dispatch notifications (Telegram via neogram, and logger for other channels)
  dispatchOrderNotification(contacts, {
    businessName: business.name,
    productName: product.name,
    quantity,
    price,
    currency: product.currency ?? "ETB",
    customerName: answers.customerName,
    customerPhone: answers.phone,
    note: answers.note,
    custom,
    contactPhone,
  }).catch((err) => {
    console.error("[Notifications] Failed to dispatch order notification:", err);
  });

  revalidatePath(`/businesses/${product.business.toString()}/orders`);
  revalidatePath(`/businesses/${product.business.toString()}/activities`);
  revalidatePath(`/products/${slug}`);
  revalidatePath("/businesses");

  return { ok: true, message: t("product.orderSuccess") };
}

/** Toggles the read flag of an order (business owners only). */
export async function setOrderReadAction(formData: FormData): Promise<void> {
  const user = await requireUser();
  const orderId = str(formData.get("orderId"));
  const isRead = str(formData.get("isRead")) === "true";

  await connectDB();

  const order = await Order.findById(orderId).lean();
  if (!order) return;

  const business = await Business.findOne({ _id: order.business, owner: user.id }).lean();
  if (!business) return;

  await Order.updateOne({ _id: orderId }, { $set: { isRead } });

  if (isRead) {
    await logActivity({
      businessId: order.business.toString(),
      action: "order.read",
      detail: `**${user.name}** marked an order as read.`,
      actorId: user.id,
      isRead: true,
    });
  }

  revalidatePath(`/businesses/${order.business.toString()}/orders`);
  revalidatePath(`/businesses/${order.business.toString()}/activities`);
  revalidatePath("/businesses");
}

/** Bulk mark-as-read for the activity feed. */
export async function markAllActivitiesReadAction(formData: FormData): Promise<void> {
  const user = await requireUser();
  const businessId = str(formData.get("businessId"));

  await connectDB();
  const business = await Business.findOne({ _id: businessId, owner: user.id }).lean();
  if (!business) return;

  await Activity.updateMany(
    { business: businessId, isRead: false },
    { $set: { isRead: true } },
  );

  revalidatePath(`/businesses/${businessId}/activities`);
  revalidatePath(`/businesses/${businessId}`);
  revalidatePath("/businesses");
}

export async function setActivityReadAction(formData: FormData): Promise<void> {
  const user = await requireUser();
  const activityId = str(formData.get("activityId"));
  const isRead = str(formData.get("isRead")) === "true";

  await connectDB();
  const activity = await Activity.findById(activityId).lean();
  if (!activity) return;

  const business = await Business.findOne({
    _id: activity.business,
    owner: user.id,
  }).lean();
  if (!business) return;

  await Activity.updateOne({ _id: activityId }, { $set: { isRead } });
  revalidatePath(`/businesses/${activity.business.toString()}/activities`);
}
