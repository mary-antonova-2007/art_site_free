import { NextResponse } from "next/server";

import { uploadEditorImage } from "@/lib/content-service";

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get("file");
    const pageId = String(formData.get("pageId") ?? "");

    if (!(file instanceof File) || !pageId) {
      return NextResponse.json({ error: "File and pageId are required." }, { status: 400 });
    }

    const uploaded = await uploadEditorImage({
      pageId,
      fileName: file.name,
      fileType: file.type,
      data: await file.arrayBuffer()
    });

    return NextResponse.json(uploaded);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Upload failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
