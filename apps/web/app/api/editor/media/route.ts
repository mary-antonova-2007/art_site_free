import { NextResponse } from "next/server";

import { listEditorMediaLibrary, uploadEditorImage } from "@/lib/content-service";

export async function GET() {
  try {
    const assets = await listEditorMediaLibrary();
    return NextResponse.json({ assets });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to load media library";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get("file");
    const pageId = String(formData.get("pageId") ?? "");
    const category = String(formData.get("category") ?? "uploaded");

    if (!(file instanceof File) || !pageId) {
      return NextResponse.json({ error: "File and pageId are required." }, { status: 400 });
    }

    const uploaded = await uploadEditorImage({
      pageId,
      fileName: file.name,
      fileType: file.type,
      data: await file.arrayBuffer(),
      category: category as
        | "featured"
        | "portraits"
        | "works"
        | "details"
        | "spaces"
        | "uploaded"
    });

    return NextResponse.json(uploaded);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Upload failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
