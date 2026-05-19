import "server-only";

import { headers } from "next/headers";

import { getLocalizationSettings } from "@/lib/content-service";
import { defaultLocale, type Locale } from "@/lib/i18n/config";

const RU_REGION_COUNTRIES = new Set([
  "AM",
  "AZ",
  "BY",
  "KZ",
  "KG",
  "MD",
  "RU",
  "TJ",
  "TM",
  "UZ"
]);

export async function getEntryLocale(): Promise<Locale> {
  const settings = await getLocalizationSettings();
  if (settings.detectionMode !== "auto") {
    return settings.defaultLocale;
  }

  const country = getRequestCountry(await headers());
  return country && RU_REGION_COUNTRIES.has(country) ? "ru" : defaultLocale;
}

function getRequestCountry(requestHeaders: Headers) {
  const value =
    requestHeaders.get("cf-ipcountry") ??
    requestHeaders.get("x-vercel-ip-country") ??
    requestHeaders.get("x-country-code") ??
    requestHeaders.get("x-geo-country") ??
    requestHeaders.get("x-forwarded-country");

  return value?.slice(0, 2).toUpperCase() ?? null;
}
