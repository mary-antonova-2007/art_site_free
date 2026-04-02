import { NextResponse } from "next/server";

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
    const message = error instanceof Error ? error.message : "Rename failed";
    return NextResponse.json({ error: message }, { status: 500 });
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
    const message = error instanceof Error ? error.message : "Delete failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
