import { NextResponse } from "next/server";

import { clearAdminSession } from "@/lib/auth";
import { getRequestOrigin } from "@/lib/request-origin";

export async function GET(request: Request) {
  await clearAdminSession();
  return NextResponse.redirect(new URL("/", getRequestOrigin(request)));
}
