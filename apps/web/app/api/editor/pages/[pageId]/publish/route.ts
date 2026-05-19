import { NextResponse } from "next/server";

import { apiErrorResponse } from "@/lib/api-auth";
import { publishPageChanges } from "@/lib/content-service";
import type { PageSeo, SiteBlockRecord } from "@/lib/content";

export async function POST(
  request: Request,
  context: { params: Promise<{ pageId: string }> }
) {
  try {
    const { pageId } = await context.params;
    const body = (await request.json()) as { title?: string; seo?: PageSeo; blocks?: SiteBlockRecord[] };

    if (!body.title || !body.blocks) {
      return NextResponse.json({ error: "Invalid publish payload." }, { status: 400 });
    }

    const page = await publishPageChanges({
      pageId,
      title: body.title,
      seo: body.seo,
      blocks: body.blocks
    });

    return NextResponse.json({
      page,
      publishedAt: new Date().toISOString()
    });
  } catch (error) {
    return apiErrorResponse(error, "Publish failed");
  }
}
