import { NextResponse } from "next/server";

import { clearAdminSession } from "@/lib/auth";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? url.origin;
  await clearAdminSession();
  return NextResponse.redirect(new URL("/", siteUrl));
}
