import { NextResponse } from "next/server";

import { clearAdminSession } from "@/lib/auth";

export async function GET(request: Request) {
  const url = new URL(request.url);
  await clearAdminSession();
  return NextResponse.redirect(new URL("/", url.origin));
}
