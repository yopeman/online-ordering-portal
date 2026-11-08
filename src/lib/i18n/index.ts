import type { Dictionary } from "./dictionaries/en";
import { DEFAULT_LOCALE, type Locale } from "./config";
import { en } from "./dictionaries/en";
import { am } from "./dictionaries/am";
import { om } from "./dictionaries/om";
import { ti } from "./dictionaries/ti";
import { aa } from "./dictionaries/aa";

const dictionaries: Record<Locale, Dictionary> = {
  en,
  am,
  om,
  ti,
  aa,
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
  if (typeof value === "string") return value;

  // Handle keys that contain dots, e.g. `activityActions.business.created`
  const firstDot = path.indexOf(".");
  if (firstDot !== -1) {
    const section = path.slice(0, firstDot);
    const rest = path.slice(firstDot + 1);
    const sectionObj = (dict as Record<string, unknown>)[section];
    if (sectionObj && typeof sectionObj === "object") {
      const restValue = (sectionObj as Record<string, unknown>)[rest];
      if (typeof restValue === "string") return restValue;
    }
  }

  return undefined;
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