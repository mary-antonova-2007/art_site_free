import { NextResponse, type NextRequest } from "next/server";

import { defaultLocale, getLocaleFromPath, localeCookieName } from "@/lib/i18n/config";

export function middleware(request: NextRequest) {
  const requestHeaders = new Headers(request.headers);
  const pathLocale = getLocaleFromPath(request.nextUrl.pathname) ?? defaultLocale;
  requestHeaders.set("x-artsite-locale", pathLocale);

  const response = NextResponse.next({
    request: {
      headers: requestHeaders
    }
  });

  response.cookies.set(localeCookieName, pathLocale, {
    path: "/",
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: 60 * 60 * 24 * 365
  });

  return response;
}

export const config = {
  matcher: ["/((?!api|_next|media-files|.*\\..*).*)"]
};
