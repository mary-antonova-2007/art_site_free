import { NextResponse } from "next/server";

import { apiErrorResponse } from "@/lib/api-auth";
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
    return apiErrorResponse(error, "Reorder failed");
  }
}
