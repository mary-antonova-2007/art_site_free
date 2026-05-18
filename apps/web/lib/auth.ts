import "server-only";

import { cookies } from "next/headers";
import { createHmac, timingSafeEqual } from "node:crypto";

import { createAdminSupabaseClient, hasSupabaseEnv } from "./supabase/admin";
import { createServerSupabaseClient } from "./supabase/server";

export type EditorIdentity = {
  authUserId: string;
  email: string | null;
  role: string;
};

const ADMIN_COOKIE_NAME = "artsite_admin_session";
const ADMIN_SESSION_TTL_SECONDS = 60 * 60 * 12;

type AdminCookiePayload = {
  role: "admin";
  iat: number;
  exp: number;
};

function hasAdminPasswordEnv() {
  const password = process.env.ADMIN_PASSWORD;
  return Boolean(password && password !== "change-me-admin-password");
}

function getSessionSecret() {
  return process.env.ADMIN_SESSION_SECRET || process.env.ADMIN_PASSWORD || "artsite-dev-secret";
}

export function signAdminPayload(payload: string) {
  return createHmac("sha256", getSessionSecret()).update(payload).digest("hex");
}

function encodeAdminPayload(payload: AdminCookiePayload) {
  return Buffer.from(JSON.stringify(payload), "utf8").toString("base64url");
}

export function buildAdminCookieValue(nowSeconds = Math.floor(Date.now() / 1000)) {
  const payload = encodeAdminPayload({
    role: "admin",
    iat: nowSeconds,
    exp: nowSeconds + ADMIN_SESSION_TTL_SECONDS
  });
  return `${payload}.${signAdminPayload(payload)}`;
}

export function verifyAdminCookieValue(value: string | undefined, nowSeconds = Math.floor(Date.now() / 1000)) {
  if (!value) {
    return false;
  }

  const [payload, signature] = value.split(".");

  if (!payload || !signature) {
    return false;
  }

  const expected = signAdminPayload(payload);

  try {
    if (!timingSafeEqual(Buffer.from(signature), Buffer.from(expected))) {
      return false;
    }

    const decoded = JSON.parse(Buffer.from(payload, "base64url").toString("utf8")) as Partial<AdminCookiePayload>;
    return decoded.role === "admin" && typeof decoded.exp === "number" && decoded.exp > nowSeconds;
  } catch {
    return false;
  }
}

export async function createAdminSession() {
  const cookieStore = await cookies();
  cookieStore.set(ADMIN_COOKIE_NAME, buildAdminCookieValue(), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: ADMIN_SESSION_TTL_SECONDS
  });
}

export async function clearAdminSession() {
  const cookieStore = await cookies();
  cookieStore.delete(ADMIN_COOKIE_NAME);
}

export async function isAdminSessionAuthenticated() {
  if (!hasAdminPasswordEnv()) {
    return false;
  }

  const cookieStore = await cookies();
  const value = cookieStore.get(ADMIN_COOKIE_NAME)?.value;
  return verifyAdminCookieValue(value);
}

export function validateAdminPassword(password: string) {
  const envPassword = process.env.ADMIN_PASSWORD;

  if (!envPassword || !hasAdminPasswordEnv()) {
    return false;
  }

  try {
    return timingSafeEqual(Buffer.from(password), Buffer.from(envPassword));
  } catch {
    return false;
  }
}

export async function getEditorIdentity() {
  if (await isAdminSessionAuthenticated()) {
    return {
      authUserId: "admin-env",
      email: process.env.SITE_EDITOR_EMAIL ?? "admin@example.com",
      role: "owner"
    } satisfies EditorIdentity;
  }

  if (hasAdminPasswordEnv()) {
    return null;
  }

  if (!hasSupabaseEnv()) {
    return null;
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

export function isAdminPasswordConfigured() {
  return hasAdminPasswordEnv();
}
