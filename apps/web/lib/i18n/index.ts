import "server-only";

import { cookies } from "next/headers";
import { headers } from "next/headers";

import { defaultLocale, htmlLang, isLocale, localeCookieName, localeLabels, locales, normalizeLocale, type Locale } from "./config";
import { enMessages } from "./messages/en";
import { ruMessages } from "./messages/ru";
import { createTranslator, type Messages } from "./shared";

export const messagesByLocale = {
  en: enMessages,
  ru: ruMessages
} as const;

export async function getServerLocale(): Promise<Locale> {
  const headerStore = await headers();
  const routeLocale = headerStore.get("x-artsite-locale");
  if (isLocale(routeLocale)) {
    return routeLocale;
  }

  const cookieStore = await cookies();
  return normalizeLocale(cookieStore.get(localeCookieName)?.value);
}

export async function getServerMessages(): Promise<Messages> {
  const locale = await getServerLocale();
  return messagesByLocale[locale];
}

export async function getServerI18n() {
  const locale = await getServerLocale();
  const messages = messagesByLocale[locale];

  return {
    locale,
    messages,
    locales,
    localeLabels,
    defaultLocale,
    htmlLang: htmlLang(locale),
    t: createTranslator(messages)
  };
}

export function getMessagesForLocale(locale: Locale): Messages {
  return messagesByLocale[locale];
}
