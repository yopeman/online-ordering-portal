import mongoose, { Schema, type InferSchemaType } from "mongoose";

/** Customer supplied answers for an order (order form template output). */
export interface OrderDetails {
  quantity?: number;
  customerName?: string;
  phone?: string;
  email?: string;
  note?: string;
  /** Extra fields coming from custom business order form templates. */
  custom?: Record<string, string>;
  [key: string]: unknown;
}

const OrderSchema = new Schema(
  {
    product: {
      type: Schema.Types.ObjectId,
      ref: "Catalog",
      required: true,
      index: true,
    },
    /** Denormalised from the product for fast per-business queries. */
    business: {
      type: Schema.Types.ObjectId,
      ref: "Business",
      required: true,
      index: true,
    },
    isRead: { type: Boolean, default: false, index: true },
    details: { type: Schema.Types.Mixed, default: () => ({}) },
  },
  { timestamps: true, collection: "orders" },
);

OrderSchema.index({ business: 1, isRead: 1, createdAt: -1 });

export type OrderDoc = InferSchemaType<typeof OrderSchema> & {
  _id: mongoose.Types.ObjectId;
};

export const Order = mongoose.models.Order ?? mongoose.model("Order", OrderSchema);

export function readOrderDetails(raw: unknown): OrderDetails {
  if (!raw || typeof raw !== "object") return {};
  return raw as OrderDetails;
}