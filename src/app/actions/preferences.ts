"use server";

import { revalidatePath } from "next/cache";

import { setLocale, setTheme } from "@/lib/preferences";
import type { Locale, Theme } from "@/lib/i18n/config";

export async function changeLocaleAction(locale: Locale): Promise<void> {
  await setLocale(locale);
  revalidatePath("/", "layout");
}

export async function changeThemeAction(theme: Theme): Promise<void> {
  await setTheme(theme);
  revalidatePath("/", "layout");
}