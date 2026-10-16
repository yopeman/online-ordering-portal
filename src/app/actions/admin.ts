"use server";

import { revalidatePath } from "next/cache";

import { requireAdmin } from "@/lib/auth/guards";
import { connectDB } from "@/lib/db";
import { Business, User, USER_ROLES, USER_STATUSES, MAX_LIMIT } from "@/lib/models";
import { getTranslator } from "@/lib/i18n-server";

import type { ActionState } from "./businesses";

function str(value: FormDataEntryValue | null): string {
  return typeof value === "string" ? value.trim() : "";
}

function parseLimit(value: string): number | null {
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed < 1 || parsed > MAX_LIMIT) return null;
  return parsed;
}

export async function createUserAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  await requireAdmin("/admin");
  const t = await getTranslator();

  const name = str(formData.get("name"));
  const email = str(formData.get("email")).toLowerCase();
  const role = str(formData.get("role"));
  const status = str(formData.get("status"));
  const maxBusinesses = parseLimit(str(formData.get("maxBusinesses")));
  const maxCatalogs = parseLimit(str(formData.get("maxCatalogs")));

  if (!name || !email.includes("@") || !maxBusinesses || !maxCatalogs) {
    return { ok: false, error: t("errors.validation") };
  }
  if (!USER_ROLES.includes(role as (typeof USER_ROLES)[number])) {
    return { ok: false, error: t("errors.validation") };
  }
  if (!USER_STATUSES.includes(status as (typeof USER_STATUSES)[number])) {
    return { ok: false, error: t("errors.validation") };
  }

  await connectDB();

  if (await User.exists({ email })) {
    return { ok: false, error: t("errors.generic") };
  }

  // Accounts are normally created through Google sign-in; admin created
  // accounts use a placeholder provider id that must be claimed on first login.
  await User.create({
    name,
    email,
    role,
    status,
    maxBusinesses,
    maxCatalogs,
    provider: "admin",
    providerId: `pending:${crypto.randomUUID()}`,
    image: "",
  });

  revalidatePath("/admin");
  return { ok: true, message: t("settings.saved") };
}

export async function updateUserAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const admin = await requireAdmin("/admin");
  const t = await getTranslator();

  const userId = str(formData.get("userId"));
  const name = str(formData.get("name"));
  const role = str(formData.get("role"));
  const status = str(formData.get("status"));
  const maxBusinesses = parseLimit(str(formData.get("maxBusinesses")));
  const maxCatalogs = parseLimit(str(formData.get("maxCatalogs")));

  if (!name || !maxBusinesses || !maxCatalogs) {
    return { ok: false, error: t("errors.validation") };
  }
  if (!USER_ROLES.includes(role as (typeof USER_ROLES)[number])) {
    return { ok: false, error: t("errors.validation") };
  }
  if (!USER_STATUSES.includes(status as (typeof USER_STATUSES)[number])) {
    return { ok: false, error: t("errors.validation") };
  }

  await connectDB();

  const user = await User.findById(userId);
  if (!user) return { ok: false, error: t("errors.notFound") };

  if (userId === admin.id && (role !== user.role || status !== user.status)) {
    return { ok: false, error: t("admin.cannotEditSelf") };
  }

  // Keep at least one active admin on the platform.
  if (user.role === "admin" && (role !== "admin" || status !== "active")) {
    const activeAdmins = await User.countDocuments({ role: "admin", status: "active" });
    if (activeAdmins <= 1) {
      return { ok: false, error: t("admin.lastAdmin") };
    }
  }

  user.name = name;
  user.role = role as (typeof USER_ROLES)[number];
  user.status = status as (typeof USER_STATUSES)[number];
  user.maxBusinesses = maxBusinesses;
  user.maxCatalogs = maxCatalogs;
  await user.save();

  revalidatePath("/admin");
  return { ok: true, message: t("settings.saved") };
}

export async function deleteUserAction(formData: FormData): Promise<void> {
  const admin = await requireAdmin("/admin");
  const userId = str(formData.get("userId"));

  if (userId === admin.id) return;

  await connectDB();

  const user = await User.findById(userId).lean();
  if (!user) return;

  if (user.role === "admin") {
    const activeAdmins = await User.countDocuments({ role: "admin", status: "active" });
    if (activeAdmins <= 1) return;
  }

  await Promise.all([
    User.deleteOne({ _id: userId }),
    Business.updateMany({ owner: userId }, { $set: { isActive: false } }),
  ]);

  revalidatePath("/admin");
  revalidatePath("/admin/businesses");
}