import { NextResponse } from "next/server";

import { defaultLocale, isLocale, localeCookieName } from "@/lib/i18n/config";
import { getRequestOrigin } from "@/lib/request-origin";

function normalizeNextPath(input: string | null) {
  if (!input || !input.startsWith("/") || input.startsWith("//")) {
    return "/";
  }

  return input;
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const locale = url.searchParams.get("locale");
  const next = normalizeNextPath(url.searchParams.get("next"));

  const response = NextResponse.redirect(new URL(next, getRequestOrigin(request)));

  response.cookies.set(localeCookieName, isLocale(locale) ? locale : defaultLocale, {
    path: "/",
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: 60 * 60 * 24 * 365
  });

  return response;
}
