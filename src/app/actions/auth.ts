"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { clearSessionCookie } from "@/lib/auth/session";

export async function logoutAction(): Promise<void> {
  await clearSessionCookie();
  try {
    revalidatePath("/", "layout");
  } catch {
    // ignore revalidate errors
  }
  redirect("/login");
}