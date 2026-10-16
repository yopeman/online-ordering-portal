"use server";

import { refresh } from "next/cache";

import { setLocale, setTheme } from "@/lib/preferences";
import type { Locale, Theme } from "@/lib/i18n/config";

/**
 * The locale and theme are stored in cookies and read by the root layout, so
 * refreshing the client router is what makes the change visible everywhere —
 * there is no data cache entry to invalidate.
 */
export async function changeLocaleAction(locale: Locale): Promise<void> {
  await setLocale(locale);
  refresh();
}

export async function changeThemeAction(theme: Theme): Promise<void> {
  await setTheme(theme);
  refresh();
}