"use client";

import type { Route } from "next";
import { useRouter } from "next/navigation";

import { localeLabels, locales, type Locale } from "@/lib/i18n/config";
import { useLocale, useTranslations } from "@/lib/i18n/client";

export function LocaleSwitcher({ currentPath }: { currentPath: string }) {
  const router = useRouter();
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
          router.push(`/api/locale?locale=${encodeURIComponent(nextLocale)}&next=${encodeURIComponent(currentPath)}` as Route);
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
