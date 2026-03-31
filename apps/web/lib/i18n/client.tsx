"use client";

import { createContext, useContext } from "react";
import type { ReactNode } from "react";

import { createTranslator, type MessageKey, type Messages } from "./shared";
import type { Locale } from "./config";

type LocaleContextValue = {
  locale: Locale;
  messages: Messages;
};

const LocaleContext = createContext<LocaleContextValue | null>(null);

export function LocaleProvider({
  children,
  locale,
  messages
}: {
  children: ReactNode;
  locale: Locale;
  messages: Messages;
}) {
  return <LocaleContext.Provider value={{ locale, messages }}>{children}</LocaleContext.Provider>;
}

export function useLocale() {
  const context = useContext(LocaleContext);

  if (!context) {
    throw new Error("useLocale must be used inside LocaleProvider.");
  }

  return context.locale;
}

export function useTranslations() {
  const context = useContext(LocaleContext);

  if (!context) {
    throw new Error("useTranslations must be used inside LocaleProvider.");
  }

  const translator = createTranslator(context.messages);

  return (key: MessageKey, values?: Record<string, string | number>) => translator(key, values);
}

export function useLocaleMessages() {
  const context = useContext(LocaleContext);

  if (!context) {
    throw new Error("useLocaleMessages must be used inside LocaleProvider.");
  }

  return context.messages;
}
