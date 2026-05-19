export const locales = ["en", "ru"] as const;

export type Locale = (typeof locales)[number];

export const defaultLocale: Locale = "en";
export const localeCookieName = "artsite_locale";

export const localeLabels: Record<Locale, string> = {
  en: "English",
  ru: "Русский"
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

export function getLocaleFromPath(pathname: string) {
  const [, segment] = pathname.split("/");
  return isLocale(segment) ? segment : null;
}

export function stripLocaleFromPath(pathname: string) {
  const locale = getLocaleFromPath(pathname);
  if (!locale) return pathname || "/";
  const stripped = pathname.slice(locale.length + 1);
  return stripped.startsWith("/") && stripped !== "" ? stripped : "/";
}

export function localizePath(pathname: string, locale: Locale) {
  const [pathPart, queryPart = ""] = pathname.split("?");
  const stripped = stripLocaleFromPath(pathPart || "/");
  const localized = stripped === "/" ? `/${locale}` : `/${locale}${stripped}`;
  return queryPart ? `${localized}?${queryPart}` : localized;
}
