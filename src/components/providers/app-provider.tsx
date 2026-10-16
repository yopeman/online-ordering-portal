"use client";

import {
  createContext,
  useContext,
  useMemo,
  type ReactNode,
} from "react";

import { createTranslator, type Dictionary, type Translator } from "@/lib/i18n";
import type { Locale, Theme } from "@/lib/i18n/config";

interface AppContextValue {
  locale: Locale;
  theme: Theme;
  dict: Dictionary;
  t: Translator;
}

const AppContext = createContext<AppContextValue | null>(null);

/**
 * Client side access to the server resolved preferences. The root layout reads
 * the locale/theme cookies and renders the matching data-theme attribute, so
 * everything here is already in sync on first paint.
 */
export function AppProvider({
  locale,
  theme,
  dict,
  children,
}: {
  locale: Locale;
  theme: Theme;
  dict: Dictionary;
  children: ReactNode;
}) {
  const value = useMemo<AppContextValue>(
    () => ({ locale, theme, dict, t: createTranslator(dict) }),
    [locale, theme, dict],
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp(): AppContextValue {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be used inside <AppProvider>");
  return ctx;
}

/** Convenience hook for components that only need the translator. */
export function useTranslation(): { t: Translator; locale: Locale; dict: Dictionary } {
  const { t, locale, dict } = useApp();
  return { t, locale, dict };
}

export function useLocale(): Locale {
  return useApp().locale;
}