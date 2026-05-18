import { NextResponse } from "next/server";

import { apiErrorResponse } from "@/lib/api-auth";
import { createPageRecord } from "@/lib/content-service";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { title?: string; slug?: string };

    if (!body.title) {
      return NextResponse.json({ error: "Title is required." }, { status: 400 });
    }

    const page = await createPageRecord({
      title: body.title,
      slug: body.slug ?? body.title
    });

    return NextResponse.json({ page });
  } catch (error) {
    return apiErrorResponse(error, "Failed to create page");
  }
}
