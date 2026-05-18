import { NextResponse } from "next/server";

import { apiErrorResponse } from "@/lib/api-auth";
import { deletePageRecord, renamePageRecord } from "@/lib/content-service";

export async function PATCH(
  request: Request,
  context: { params: Promise<{ pageId: string }> }
) {
  try {
    const { pageId } = await context.params;
    const body = (await request.json()) as { title?: string };

    if (!body.title?.trim()) {
      return NextResponse.json({ error: "Title is required." }, { status: 400 });
    }

    const pages = await renamePageRecord({
      pageId,
      title: body.title
    });

    return NextResponse.json({ pages });
  } catch (error) {
    return apiErrorResponse(error, "Rename failed");
  }
}

export async function DELETE(
  _request: Request,
  context: { params: Promise<{ pageId: string }> }
) {
  try {
    const { pageId } = await context.params;
    const pages = await deletePageRecord({ pageId });
    return NextResponse.json({ pages });
  } catch (error) {
    return apiErrorResponse(error, "Delete failed");
  }
}
