import { NextResponse } from "next/server";

import { readLocalMediaFile } from "@/lib/content-service";

export async function GET(
  _request: Request,
  context: { params: Promise<{ path: string[] }> }
) {
  try {
    const { path } = await context.params;
    const file = await readLocalMediaFile(path);

    return new NextResponse(file, {
      status: 200,
      headers: {
        "Cache-Control": "public, max-age=31536000, immutable"
      }
    });
  } catch {
    return NextResponse.json({ error: "File not found" }, { status: 404 });
  }
}
