import "server-only";

import { createTranslator, getDictionary, type Translator } from "@/lib/i18n";
import { getLocale } from "@/lib/preferences";
import {
  formatDate,
  formatNumber,
  formatPrice,
  type Locale,
} from "@/lib/i18n/config";

/** Translator bound to the locale stored in the request cookies. */
export async function getTranslator(): Promise<Translator> {
  return createTranslator(getDictionary(await getLocale()));
}

export async function getActiveLocale(): Promise<Locale> {
  return getLocale();
}

/** Formatting helpers bound to the active locale. */
export async function getFormatters() {
  const locale = await getLocale();
  return {
    locale,
    price: (amount: number, currency = "ETB") => formatPrice(amount, locale, currency),
    date: (value: Date | string | null | undefined) => formatDate(value, locale),
    number: (value: number) => formatNumber(value, locale),
  };
}