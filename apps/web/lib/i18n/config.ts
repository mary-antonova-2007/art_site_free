export const locales = ["en", "ru", "hy", "de-CH", "fr", "es"] as const;

export type Locale = (typeof locales)[number];

export const defaultLocale: Locale = "ru";
export const localeCookieName = "artsite_locale";

export const localeLabels: Record<Locale, string> = {
  en: "English",
  ru: "Русский",
  hy: "Հայերեն",
  "de-CH": "Schwiizerdütsch",
  fr: "Français",
  es: "Español"
};

export function isLocale(value: string | undefined | null): value is Locale {
  return Boolean(value && locales.includes(value as Locale));
}

export function normalizeLocale(value: string | undefined | null): Locale {
  return isLocale(value) ? value : defaultLocale;
}

export function htmlLang(locale: Locale) {
  return locale;
}
