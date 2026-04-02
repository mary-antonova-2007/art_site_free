import { NextResponse } from "next/server";

import {
  createAdminSession,
  isAdminPasswordConfigured,
  validateAdminPassword
} from "@/lib/auth";
import { getRequestOrigin } from "@/lib/request-origin";

function normalizeNextPath(input: string | null) {
  if (!input || !input.startsWith("/") || input.startsWith("//")) {
    return "/?editor=1";
  }

  return input;
}

export async function POST(request: Request) {
  const formData = await request.formData();
  const password = String(formData.get("password") ?? "");
  const next = normalizeNextPath(String(formData.get("next") ?? "/?editor=1"));
  const origin = getRequestOrigin(request);

  if (!isAdminPasswordConfigured()) {
    return NextResponse.redirect(new URL("/auth/sign-in?error=missing-password", origin));
  }

  if (!password) {
    return NextResponse.redirect(
      new URL(`/auth/sign-in?error=password&next=${encodeURIComponent(next)}`, origin)
    );
  }

  if (!validateAdminPassword(password)) {
    return NextResponse.redirect(
      new URL(`/auth/sign-in?error=invalid-password&next=${encodeURIComponent(next)}`, origin)
    );
  }

  await createAdminSession();
  return NextResponse.redirect(new URL(next, origin));
}
