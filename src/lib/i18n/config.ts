export const LOCALES = ["en", "am", "om", "ti", "aa"] as const;
export type Locale = (typeof LOCALES)[number];

export const DEFAULT_LOCALE: Locale = "en";

export const LOCALE_COOKIE = "yope_locale";

export interface LocaleMeta {
  code: Locale;
  /** Name written in the language itself. */
  native: string;
  /** Name in English. */
  english: string;
  /** Intl locale used for dates, numbers and currency. */
  intl: string;
  flag: string;
}

export const LOCALE_META: Record<Locale, LocaleMeta> = {
  en: { code: "en", native: "English", english: "English", intl: "en-ET", flag: "🇬🇧" },
  am: { code: "am", native: "አማርኛ", english: "Amharic", intl: "am-ET", flag: "🇪🇹" },
  om: { code: "om", native: "Afaan Oromoo", english: "Afaan Oromoo", intl: "om-ET", flag: "🇪🇹" },
  ti: { code: "ti", native: "ትግርኛ", english: "Tigrinya", intl: "ti-ET", flag: "🇪🇹" },
  aa: { code: "aa", native: "Qafár af", english: "Afar", intl: "aa-ET", flag: "🇪🇹" },
};

export const THEMES = ["light", "dark", "night", "system"] as const;
export type Theme = (typeof THEMES)[number];

export const THEME_COOKIE = "yope_theme";

export function isLocale(value: unknown): value is Locale {
  return typeof value === "string" && (LOCALES as readonly string[]).includes(value);
}

export function isTheme(value: unknown): value is Theme {
  return typeof value === "string" && (THEMES as readonly string[]).includes(value);
}

/** Formats a price using the active locale. */
export function formatPrice(
  amount: number,
  locale: Locale,
  currency = "ETB",
): string {
  try {
    return new Intl.NumberFormat(LOCALE_META[locale].intl, {
      style: "currency",
      currency,
      maximumFractionDigits: 2,
    }).format(amount);
  } catch {
    return `${amount.toFixed(2)} ${currency}`;
  }
}

export function formatDate(date: Date | string | null | undefined, locale: Locale): string {
  if (!date) return "";
  const value = typeof date === "string" ? new Date(date) : date;
  if (Number.isNaN(value.getTime())) return "";
  try {
    return new Intl.DateTimeFormat(LOCALE_META[locale].intl, {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(value);
  } catch {
    return value.toISOString();
  }
}

export function formatNumber(value: number, locale: Locale): string {
  try {
    return new Intl.NumberFormat(LOCALE_META[locale].intl).format(value);
  } catch {
    return String(value);
  }
}