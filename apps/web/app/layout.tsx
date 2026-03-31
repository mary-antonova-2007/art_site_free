import type { Metadata } from "next";
import { Cormorant_Garamond, Manrope } from "next/font/google";

import { AppShell } from "@/components/layout/app-shell";
import { LocaleProvider } from "@/lib/i18n/client";
import { getServerI18n } from "@/lib/i18n";

import "./globals.css";

const display = Cormorant_Garamond({
  variable: "--font-display",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"]
});

const body = Manrope({
  variable: "--font-body",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"]
});

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getServerI18n();

  return {
    title: t("app.title"),
    description: t("app.description")
  };
}

export default async function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  const { locale, messages, htmlLang } = await getServerI18n();

  return (
    <html lang={htmlLang} className={`${display.variable} ${body.variable}`}>
      <body>
        <LocaleProvider locale={locale} messages={messages}>
          <AppShell>{children}</AppShell>
        </LocaleProvider>
      </body>
    </html>
  );
}
