import { NextResponse } from "next/server";

import { getRequestOrigin } from "@/lib/request-origin";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { hasSupabaseEnv } from "@/lib/supabase/admin";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const origin = getRequestOrigin(request);
  const code = url.searchParams.get("code");
  const next = url.searchParams.get("next") ?? "/home?editor=1";

  if (!hasSupabaseEnv()) {
    return NextResponse.redirect(new URL(next, origin));
  }

  const supabase = await createServerSupabaseClient();

  if (supabase && code) {
    await supabase.auth.exchangeCodeForSession(code);
  }

  return NextResponse.redirect(new URL(next, origin));
}
