import { NextResponse } from "next/server";

import { reorderPageRecords } from "@/lib/content-service";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { pageIds?: string[] };

    if (!Array.isArray(body.pageIds) || !body.pageIds.length) {
      return NextResponse.json({ error: "Page ids are required." }, { status: 400 });
    }

    const pages = await reorderPageRecords({ pageIds: body.pageIds });
    return NextResponse.json({ pages });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Reorder failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
