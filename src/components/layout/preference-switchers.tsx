"use client";

import { useTransition } from "react";
import {
  Check,
  Languages,
  Monitor,
  Moon,
  MoonStar,
  Sun,
} from "lucide-react";

import { changeLocaleAction, changeThemeAction } from "@/app/actions/preferences";
import { Dropdown } from "@/components/ui/dropdown";
import { useApp } from "@/components/providers/app-provider";
import {
  LOCALES,
  LOCALE_META,
  THEMES,
  type Theme,
} from "@/lib/i18n/config";

const THEME_ICONS: Record<Theme, typeof Sun> = {
  light: Sun,
  dark: Moon,
  night: MoonStar,
  system: Monitor,
};

export function ThemeSwitcher() {
  const { t, theme } = useApp();
  const [, startTransition] = useTransition();

  const CurrentIcon = THEME_ICONS[theme];

  return (
    <Dropdown
      label={t("nav.theme")}
      trigger={
        <>
          <CurrentIcon className="h-4 w-4" />
          <span className="hidden sm:inline">{t(`nav.${theme}`)}</span>
        </>
      }
      items={THEMES.map((option) => ({
        key: option,
        label: t(`nav.${option}`),
        icon: THEME_ICONS[option],
        active: option === theme,
        onSelect: () =>
          startTransition(() => {
            void changeThemeAction(option);
          }),
      }))}
    />
  );
}

export function LocaleSwitcher() {
  const { t, locale } = useApp();
  const [, startTransition] = useTransition();

  return (
    <Dropdown
      label={t("nav.language")}
      trigger={
        <>
          <Languages className="h-4 w-4" />
          <span className="hidden sm:inline">{LOCALE_META[locale].native}</span>
        </>
      }
      items={LOCALES.map((code) => ({
        key: code,
        label: (
          <span className="flex items-center gap-2">
            <span aria-hidden="true">{LOCALE_META[code].flag}</span>
            <span>{LOCALE_META[code].native}</span>
          </span>
        ),
        icon: locale === code ? Check : undefined,
        active: locale === code,
        onSelect: () =>
          startTransition(() => {
            void changeLocaleAction(code);
          }),
      }))}
    />
  );
}