import mongoose, { Schema, type InferSchemaType } from "mongoose";

/**
 * A single field of a business defined order form template. Templates live in
 * `orderFormTemplates` as a free form `Mixed` array so businesses can shape
 * their own checkout questions.
 */
export interface OrderFormField {
  key: string;
  label: string;
  type: "text" | "textarea" | "tel" | "email" | "select";
  required?: boolean;
  placeholder?: string;
  options?: string[];
}

export interface BusinessDetails {
  description?: string;
  category?: string;
  location?: string;
  delivery?: boolean;
  openingHours?: string;
  social?: Record<string, string>;
  [key: string]: unknown;
}

export type BusinessContactType = "sms" | "telegram" | "wa" | "email";

export interface BusinessContact {
  type: BusinessContactType | string;
  target: string;
}

export const BUSINESS_CONTACT_TYPES: { value: BusinessContactType; label: string }[] = [
  { value: "sms", label: "SMS / Phone" },
  { value: "telegram", label: "Telegram" },
  { value: "wa", label: "WhatsApp" },
  { value: "email", label: "Email" },
];

export type BusinessStatus = "visible" | "hide";

const BusinessSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, lowercase: true, index: true },
    owner: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    details: { type: Schema.Types.Mixed, default: () => ({}) },
    orderFormTemplates: {
      type: [Schema.Types.Mixed],
      default: () => [] as OrderFormField[],
    },
    contactPhones: {
      type: Schema.Types.Mixed,
      default: () => [] as BusinessContact[],
    },
    /** Logo / cover image URL shown on the public storefront. */
    image: { type: String, default: "" },
    status: {
      type: String,
      enum: ["visible", "hide"] as const,
      default: "visible" as const,
      index: true,
    },
    isActive: { type: Boolean, default: true, index: true },
  },
  { timestamps: true, collection: "businesses" },
);

BusinessSchema.pre("save", function () {
  if (this.isModified("status")) {
    this.isActive = this.status === "visible";
  } else if (this.isModified("isActive")) {
    this.status = this.isActive ? "visible" : "hide";
  } else if (!this.status) {
    this.status = this.isActive !== false ? "visible" : "hide";
  }
});

export type BusinessDoc = InferSchemaType<typeof BusinessSchema> & {
  _id: mongoose.Types.ObjectId;
};

if (process.env.NODE_ENV !== "production" && mongoose.models.Business) {
  delete mongoose.models.Business;
}

export const Business =
  mongoose.models.Business ?? mongoose.model("Business", BusinessSchema);

/** Normalises the `Mixed` details bag into a typed object. */
export function readDetails(raw: unknown): BusinessDetails {
  if (!raw || typeof raw !== "object") return {};
  return raw as BusinessDetails;
}

/** Normalises the `Mixed` order form templates into typed fields. */
export function readOrderFormTemplates(raw: unknown): OrderFormField[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .filter(
      (field): field is OrderFormField =>
        Boolean(field) &&
        typeof field === "object" &&
        typeof (field as OrderFormField).key === "string" &&
        typeof (field as OrderFormField).label === "string",
    )
    .map((field) => ({
      ...field,
      options: Array.isArray(field.options)
        ? field.options
            .map((opt) => (typeof opt === "string" ? opt.trim() : ""))
            .filter((opt) => opt.length > 0)
        : [],
    }));
}

/** Default fields used when a business has not customised its order form. */
export const DEFAULT_ORDER_FORM_FIELDS: OrderFormField[] = [
  { key: "customerName", label: "Full name", type: "text", required: true },
  { key: "phone", label: "Phone number", type: "tel", required: true },
  {
    key: "note",
    label: "Order note",
    type: "textarea",
    required: false,
    placeholder: "Anything the business should know?",
  },
];

/** Normalises the `Mixed` contact phones into typed contact channels. */
export function readContacts(raw: unknown): BusinessContact[] {
  if (!Array.isArray(raw)) return [];
  const contacts: BusinessContact[] = [];

  for (const item of raw) {
    if (!item) continue;
    if (typeof item === "string") {
      const trimmed = item.trim();
      if (trimmed) {
        contacts.push({ type: "sms", target: trimmed });
      }
    } else if (typeof item === "object") {
      const row = item as Record<string, unknown>;
      const rawType = typeof row.type === "string" ? row.type.trim() : "";
      const type = rawType || "sms";
      const target =
        typeof row.target === "string"
          ? row.target.trim()
          : typeof row.phone === "string"
            ? row.phone.trim()
            : "";
      if (target) {
        contacts.push({ type, target });
      }
    }
  }

  return contacts;
}

export function getContactHref(contact: BusinessContact): string {
  const type = contact.type || "sms";
  const target = (contact.target || "").trim();
  if (type === "email") {
    return `mailto:${target}`;
  }
  if (type === "telegram") {
    return target.startsWith("http")
      ? target
      : `https://t.me/${target.replace(/^@/, "")}`;
  }
  if (type === "wa") {
    return target.startsWith("http")
      ? target
      : `https://wa.me/${target.replace(/[^0-9]/g, "")}`;
  }
  return `tel:${target}`;
}

export function getContactDisplayLabel(contact: BusinessContact): string {
  const type = contact.type || "sms";
  const target = (contact.target || "").trim();
  if (type === "telegram" && target.startsWith("http")) {
    return "Telegram";
  }
  return target;
}