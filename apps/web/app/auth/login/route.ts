import { NextResponse } from "next/server";

import {
  createAdminSession,
  isAdminPasswordConfigured,
  validateAdminPassword
} from "@/lib/auth";

function normalizeNextPath(input: string | null) {
  if (!input || !input.startsWith("/") || input.startsWith("//")) {
    return "/?editor=1";
  }

  return input;
}

export async function POST(request: Request) {
  const url = new URL(request.url);
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? url.origin;
  const formData = await request.formData();
  const password = String(formData.get("password") ?? "");
  const next = normalizeNextPath(String(formData.get("next") ?? "/?editor=1"));

  if (!isAdminPasswordConfigured()) {
    return NextResponse.redirect(new URL("/auth/sign-in?error=missing-password", siteUrl));
  }

  if (!password) {
    return NextResponse.redirect(
      new URL(`/auth/sign-in?error=password&next=${encodeURIComponent(next)}`, siteUrl)
    );
  }

  if (!validateAdminPassword(password)) {
    return NextResponse.redirect(
      new URL(`/auth/sign-in?error=invalid-password&next=${encodeURIComponent(next)}`, siteUrl)
    );
  }

  await createAdminSession();
  return NextResponse.redirect(new URL(next, siteUrl));
}
