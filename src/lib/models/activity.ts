import mongoose, { Schema, type InferSchemaType } from "mongoose";

/** Well known activity actions, free form strings are also allowed. */
export const ACTIVITY_ACTIONS = [
  "business.created",
  "business.updated",
  "business.deleted",
  "catalog.created",
  "catalog.updated",
  "catalog.deleted",
  "order.received",
  "order.read",
  "user.registered",
] as const;

export type ActivityAction = (typeof ACTIVITY_ACTIONS)[number] | (string & {});

const ActivitySchema = new Schema(
  {
    business: {
      type: Schema.Types.ObjectId,
      ref: "Business",
      required: true,
      index: true,
    },
    isRead: { type: Boolean, default: false, index: true },
    action: { type: String, required: true, trim: true },
    /** Detail rendered as markdown. */
    detail: { type: String, default: "" },
    /** Who triggered the activity, when known. */
    actor: { type: Schema.Types.ObjectId, ref: "User", default: null },
  },
  { timestamps: true, collection: "activities" },
);

ActivitySchema.index({ business: 1, isRead: 1, createdAt: -1 });

export type ActivityDoc = InferSchemaType<typeof ActivitySchema> & {
  _id: mongoose.Types.ObjectId;
};

export const Activity =
  mongoose.models.Activity ?? mongoose.model("Activity", ActivitySchema);