import "server-only";

import { redirect } from "next/navigation";

import { isAdmin, getCurrentUser } from "@/lib/auth/session";
import type { UserDTO } from "@/lib/models/user";

/** Redirects to the login page when signed out. */
export async function requireUser(nextPath?: string): Promise<UserDTO> {
  const user = await getCurrentUser();
  if (!user) {
    redirect(`/login${nextPath ? `?next=${encodeURIComponent(nextPath)}` : ""}`);
  }
  return user;
}

/** Redirects non-admin users back to their businesses dashboard. */
export async function requireAdmin(nextPath?: string): Promise<UserDTO> {
  const user = await requireUser(nextPath);
  if (!isAdmin(user)) redirect("/businesses");
  return user;
}