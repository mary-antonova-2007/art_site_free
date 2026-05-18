import { NextResponse } from "next/server";

import { apiErrorResponse } from "@/lib/api-auth";
import { savePageDraft } from "@/lib/content-service";
import type { SiteBlockRecord } from "@/lib/content";

export async function POST(
  request: Request,
  context: { params: Promise<{ pageId: string }> }
) {
  try {
    const { pageId } = await context.params;
    const body = (await request.json()) as { title?: string; blocks?: SiteBlockRecord[] };

    if (!body.title || !body.blocks) {
      return NextResponse.json({ error: "Invalid draft payload." }, { status: 400 });
    }

    const page = await savePageDraft({
      pageId,
      title: body.title,
      blocks: body.blocks
    });

    return NextResponse.json({
      page,
      savedAt: new Date().toISOString()
    });
  } catch (error) {
    return apiErrorResponse(error, "Draft save failed");
  }
}
