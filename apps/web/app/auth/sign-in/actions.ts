"use server";

import { redirect } from "next/navigation";

import { createServerSupabaseClient } from "@/lib/supabase/server";
import { hasSupabaseEnv } from "@/lib/supabase/admin";

export async function requestMagicLink(formData: FormData): Promise<void> {
  const email = String(formData.get("email") ?? "").trim();

  if (!email) {
    redirect("/auth/sign-in?error=email");
  }

  if (!hasSupabaseEnv()) {
    redirect("/?editor=1");
  }

  const supabase = await createServerSupabaseClient();

  if (!supabase) {
    redirect("/auth/sign-in?error=supabase");
  }

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost";
  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: {
      emailRedirectTo: `${siteUrl}/auth/callback?next=/home?editor=1`
    }
  });

  if (error) {
    redirect(`/auth/sign-in?error=${encodeURIComponent(error.message)}`);
  }

  redirect("/auth/sign-in?sent=1");
}
