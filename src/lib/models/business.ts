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
    contactPhones: { type: [String], default: [] },
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
  return raw.filter(
    (field): field is OrderFormField =>
      Boolean(field) &&
      typeof field === "object" &&
      typeof (field as OrderFormField).key === "string" &&
      typeof (field as OrderFormField).label === "string",
  );
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