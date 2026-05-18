import { NextResponse } from "next/server";

import { apiErrorResponse, requireEditorApi } from "@/lib/api-auth";
import { listEditorMediaCategories, listEditorMediaLibrary, uploadEditorImage } from "@/lib/content-service";

export async function GET() {
  try {
    const auth = await requireEditorApi();
    if (auth.response) return auth.response;

    const [assets, categories] = await Promise.all([
      listEditorMediaLibrary(),
      listEditorMediaCategories()
    ]);
    return NextResponse.json({ assets, categories });
  } catch (error) {
    return apiErrorResponse(error, "Failed to load media library");
  }
}

export async function POST(request: Request) {
  try {
    const auth = await requireEditorApi();
    if (auth.response) return auth.response;

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
      category
    });

    return NextResponse.json(uploaded);
  } catch (error) {
    return apiErrorResponse(error, "Upload failed");
  }
}
