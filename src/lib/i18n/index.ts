import type { Dictionary } from "./dictionaries/en";
import { DEFAULT_LOCALE, type Locale } from "./config";
import { en } from "./dictionaries/en";
import { am } from "./dictionaries/am";
import { om } from "./dictionaries/om";
import { ti } from "./dictionaries/ti";
import { aa } from "./dictionaries/aa";

/** Fills missing keys from `base`, leaving translated values untouched. */
function merge(base: object, override: object): Record<string, unknown> {
  const result: Record<string, unknown> = { ...base };

  for (const key of Object.keys(override)) {
    const baseValue = result[key as string];
    const overrideValue = (override as Record<string, unknown>)[key];

    if (
      overrideValue &&
      typeof overrideValue === "object" &&
      !Array.isArray(overrideValue) &&
      baseValue &&
      typeof baseValue === "object"
    ) {
      result[key] = merge(
        baseValue as object,
        overrideValue as object,
      );
    } else if (overrideValue !== undefined) {
      result[key] = overrideValue;
    }
  }

  return result;
}

const dictionaries: Record<Locale, Dictionary> = {
  en,
  am,
  om,
  ti,
  aa: merge(en, aa) as unknown as Dictionary,
};

export function getDictionary(locale: Locale): Dictionary {
  return dictionaries[locale] ?? dictionaries[DEFAULT_LOCALE];
}

type Path = string;

function resolve(dict: Dictionary, path: Path): string | undefined {
  const value = path
    .split(".")
    .reduce<unknown>(
      (acc, key) =>
        acc && typeof acc === "object"
          ? (acc as Record<string, unknown>)[key]
          : undefined,
      dict,
    );
  return typeof value === "string" ? value : undefined;
}

export type TranslateValues = Record<string, string | number>;

/** Replaces `{name}` placeholders with the given values. */
export function interpolate(
  template: string,
  values?: TranslateValues,
): string {
  if (!values) return template;
  return template.replace(/\{(\w+)\}/g, (match, key: string) =>
    key in values ? String(values[key]) : match,
  );
}

export type Translator = (path: Path, values?: TranslateValues) => string;

/**
 * Builds a translator bound to a dictionary. Unknown keys return the key path
 * itself so missing strings are obvious instead of silently blank.
 */
export function createTranslator(dict: Dictionary): Translator {
  return (path, values) => {
    const template = resolve(dict, path) ?? resolve(en, path);
    if (!template) return path;
    return interpolate(template, values);
  };
}

export type { Dictionary } from "./dictionaries/en";