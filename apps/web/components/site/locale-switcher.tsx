"use client";

import { localeLabels, locales, type Locale } from "@/lib/i18n/config";
import { useLocale, useTranslations } from "@/lib/i18n/client";

export function LocaleSwitcher({ currentPath }: { currentPath: string }) {
  const locale = useLocale();
  const t = useTranslations();

  return (
    <label className="locale-switcher">
      <span className="sr-only">{t("locale.label")}</span>
      <select
        value={locale}
        aria-label={t("locale.label")}
        onChange={(event) => {
          const nextLocale = event.currentTarget.value as Locale;
          window.location.assign(
            `/api/locale?locale=${encodeURIComponent(nextLocale)}&next=${encodeURIComponent(currentPath)}`
          );
        }}
      >
        {locales.map((option) => (
          <option key={option} value={option}>
            {localeLabels[option]}
          </option>
        ))}
      </select>
    </label>
  );
}
