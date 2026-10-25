import mongoose, { Schema, type InferSchemaType } from "mongoose";

export const USER_STATUSES = ["active", "inactive"] as const;
export const USER_ROLES = ["admin", "business_owner"] as const;

export type UserStatus = (typeof USER_STATUSES)[number];
export type UserRole = (typeof USER_ROLES)[number];

/** Hard ceiling documented in schema.md. */
export const MAX_LIMIT = 1000;

const UserSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    provider: { type: String, required: true, default: "google", trim: true },
    providerId: { type: String, required: true, trim: true, index: true },
    telegramChatId: { type: String, default: "", trim: true, index: true },
    status: {
      type: String,
      enum: USER_STATUSES,
      default: "active",
      index: true,
    },
    role: { type: String, enum: USER_ROLES, default: "business_owner" },
    maxBusinesses: { type: Number, default: 3, min: 1, max: MAX_LIMIT },
    maxCatalogs: { type: Number, default: 50, min: 1, max: MAX_LIMIT },
    image: { type: String, default: "" },
  },
  { timestamps: true, collection: "users" },
);

export type UserDoc = InferSchemaType<typeof UserSchema> & { _id: mongoose.Types.ObjectId };

export const User = mongoose.models.User ?? mongoose.model("User", UserSchema);

export function toUserDTO(doc: {
  _id: mongoose.Types.ObjectId;
  name: string;
  email: string;
  provider: string;
  providerId: string;
  telegramChatId?: string | null;
  status?: UserStatus | null;
  role?: UserRole | null;
  maxBusinesses?: number | null;
  maxCatalogs?: number | null;
  image?: string | null;
  createdAt?: Date;
  updatedAt?: Date;
}) {
  // Older documents may predate these fields, so every value is normalised.
  const maxBusinesses = clampLimit(doc.maxBusinesses, 3);
  const maxCatalogs = clampLimit(doc.maxCatalogs, 50);

  return {
    id: doc._id.toString(),
    name: doc.name ?? doc.email ?? "Unknown user",
    email: doc.email,
    provider: doc.provider ?? "unknown",
    providerId: doc.providerId ?? "",
    telegramChatId: doc.telegramChatId ?? "",
    status: doc.status ?? "active",
    role: doc.role ?? "business_owner",
    maxBusinesses,
    maxCatalogs,
    image: doc.image ?? "",
    createdAt: doc.createdAt ?? null,
    updatedAt: doc.updatedAt ?? null,
  };
}

function clampLimit(value: number | null | undefined, fallback: number): number {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return fallback;
  return Math.min(MAX_LIMIT, Math.max(1, Math.round(parsed)));
}

export type UserDTO = ReturnType<typeof toUserDTO>;