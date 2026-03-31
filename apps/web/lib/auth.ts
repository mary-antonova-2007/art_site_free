import "server-only";

import { createAdminSupabaseClient, hasSupabaseEnv } from "./supabase/admin";
import { createServerSupabaseClient } from "./supabase/server";

export type EditorIdentity = {
  authUserId: string;
  email: string | null;
  role: string;
};

export async function getEditorIdentity() {
  if (!hasSupabaseEnv()) {
    return {
      authUserId: "demo-editor",
      email: "demo@example.com",
      role: "owner"
    } satisfies EditorIdentity;
  }

  const supabase = await createServerSupabaseClient();

  if (!supabase) {
    return null;
  }

  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    return null;
  }

  const admin = createAdminSupabaseClient();
  const { data: appUser } = await admin
    .from("app_users")
    .select("auth_user_id, email, role, is_active")
    .eq("auth_user_id", user.id)
    .maybeSingle();

  if (!appUser || !appUser.is_active) {
    return null;
  }

  if (appUser.role !== "owner" && appUser.role !== "editor") {
    return null;
  }

  return {
    authUserId: appUser.auth_user_id,
    email: appUser.email,
    role: appUser.role
  } satisfies EditorIdentity;
}

export async function canUseEditor(editorRequested: boolean) {
  if (!editorRequested) {
    return false;
  }

  const editor = await getEditorIdentity();
  return Boolean(editor);
}

