import mongoose, { Schema, type InferSchemaType } from "mongoose";

export const ATTACHMENT_PARENTS = ["catalog", "business"] as const;
export type AttachmentParent = (typeof ATTACHMENT_PARENTS)[number];

export const ATTACHMENT_KINDS = ["image", "file", "link"] as const;
export type AttachmentKind = (typeof ATTACHMENT_KINDS)[number];

const AttachmentSchema = new Schema(
  {
    parentEntity: {
      type: String,
      enum: ATTACHMENT_PARENTS,
      required: true,
    },
    parentId: {
      type: Schema.Types.ObjectId,
      required: true,
      index: true,
    },
    url: { type: String, required: true, trim: true },
    kind: { type: String, enum: ATTACHMENT_KINDS, default: "image" },
    alt: { type: String, default: "" },
    /** Sort position of the attachment inside its parent. */
    order: { type: Number, default: 0 },
  },
  { timestamps: true, collection: "attachments" },
);

AttachmentSchema.index({ parentEntity: 1, parentId: 1, order: 1 });

export type AttachmentDoc = InferSchemaType<typeof AttachmentSchema> & {
  _id: mongoose.Types.ObjectId;
};

export const Attachment =
  mongoose.models.Attachment ?? mongoose.model("Attachment", AttachmentSchema);