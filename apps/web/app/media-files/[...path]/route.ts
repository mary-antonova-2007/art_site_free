import { NextResponse } from "next/server";

import { readLocalMediaFile } from "@/lib/content-service";
import { getSafeMediaMimeType } from "@/lib/media-safety";

function guessMimeType(filePath: string) {
  return getSafeMediaMimeType(filePath) ?? "application/octet-stream";
}

export async function GET(
  _request: Request,
  context: { params: Promise<{ path: string[] }> }
) {
  try {
    const { path } = await context.params;
    const { file, fileName } = await readLocalMediaFile(path);

    return new NextResponse(file, {
      status: 200,
      headers: {
        "Content-Type": guessMimeType(fileName),
        "Cache-Control": "public, max-age=31536000, immutable"
      }
    });
  } catch {
    return NextResponse.json({ error: "File not found" }, { status: 404 });
  }
}
