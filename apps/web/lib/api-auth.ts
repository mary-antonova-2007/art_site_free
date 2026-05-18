import { NextResponse } from "next/server";

import { getEditorIdentity } from "./auth";

export async function requireEditorApi() {
  const editor = await getEditorIdentity();

  if (!editor) {
    return {
      editor: null,
      response: NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    };
  }

  return { editor, response: null };
}

export function apiErrorResponse(error: unknown, fallback: string) {
  const message = error instanceof Error ? error.message : fallback;
  const status = message === "Unauthorized" ? 401 : 500;
  return NextResponse.json({ error: message }, { status });
}
