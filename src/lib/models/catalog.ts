import mongoose, { Schema, type InferSchemaType } from "mongoose";

export interface CatalogDetails {
  description?: string;
  ingredients?: string[];
  preparationTime?: string;
  available?: boolean;
  [key: string]: unknown;
}

const CatalogSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, lowercase: true, index: true },
    business: {
      type: Schema.Types.ObjectId,
      ref: "Business",
      required: true,
      index: true,
    },
    category: { type: String, default: "", trim: true, index: true },
    details: { type: Schema.Types.Mixed, default: () => ({}) },
    /** Price is an additive extension of schema.md, ordering needs it. */
    price: { type: Number, default: 0, min: 0 },
    currency: { type: String, default: "ETB", trim: true },
    image: { type: String, default: "" },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true, collection: "catalogs" },
);

CatalogSchema.index({ business: 1, category: 1 });

export type CatalogDoc = InferSchemaType<typeof CatalogSchema> & {
  _id: mongoose.Types.ObjectId;
};

export const Catalog =
  mongoose.models.Catalog ?? mongoose.model("Catalog", CatalogSchema);

export function readCatalogDetails(raw: unknown): CatalogDetails {
  if (!raw || typeof raw !== "object") return {};
  return raw as CatalogDetails;
}