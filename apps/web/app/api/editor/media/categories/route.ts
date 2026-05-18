import { NextResponse } from "next/server";

import { apiErrorResponse } from "@/lib/api-auth";
import {
  createEditorMediaCategory,
  deleteEditorMediaCategory,
  listEditorMediaCategories,
  renameEditorMediaCategory
} from "@/lib/content-service";

export async function GET() {
  try {
    const categories = await listEditorMediaCategories();
    return NextResponse.json({ categories });
  } catch (error) {
    return apiErrorResponse(error, "Failed to load media categories");
  }
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { name?: string };
    const categories = await createEditorMediaCategory(String(body.name ?? ""));
    return NextResponse.json({ categories });
  } catch (error) {
    return apiErrorResponse(error, "Failed to create media category");
  }
}

export async function PATCH(request: Request) {
  try {
    const body = (await request.json()) as { from?: string; to?: string };
    const categories = await renameEditorMediaCategory(String(body.from ?? ""), String(body.to ?? ""));
    return NextResponse.json({ categories });
  } catch (error) {
    return apiErrorResponse(error, "Failed to rename media category");
  }
}

export async function DELETE(request: Request) {
  try {
    const body = (await request.json()) as { name?: string };
    const categories = await deleteEditorMediaCategory(String(body.name ?? ""));
    return NextResponse.json({ categories });
  } catch (error) {
    return apiErrorResponse(error, "Failed to delete media category");
  }
}
