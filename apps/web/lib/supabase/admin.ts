import "server-only";

import { createClient } from "@supabase/supabase-js";

export function hasSupabaseEnv() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  const hasRealUrl = Boolean(url && !url.includes("your-project.supabase.co"));
  const hasRealServiceRole = Boolean(
    serviceRoleKey && serviceRoleKey !== "your-service-role-key"
  );
  const hasRealAnonKey = Boolean(anonKey && anonKey !== "your-anon-key");

  return hasRealUrl && hasRealServiceRole && hasRealAnonKey;
}

export function createAdminSupabaseClient() {
  if (!hasSupabaseEnv()) {
    throw new Error("Supabase environment variables are not configured.");
  }

  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        persistSession: false,
        autoRefreshToken: false
      }
    }
  );
}
