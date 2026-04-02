import { NextResponse } from "next/server";

import { readLocalMediaFile } from "@/lib/content-service";

function guessMimeType(filePath: string) {
  if (filePath.endsWith(".svg")) return "image/svg+xml";
  if (filePath.endsWith(".png")) return "image/png";
  if (filePath.endsWith(".jpg") || filePath.endsWith(".jpeg")) return "image/jpeg";
  if (filePath.endsWith(".webp")) return "image/webp";
  if (filePath.endsWith(".avif")) return "image/avif";
  return "application/octet-stream";
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
