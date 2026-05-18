import { NextResponse } from "next/server";

import { apiErrorResponse } from "@/lib/api-auth";
import { deleteEditorMediaAsset, updateEditorMediaAssetCommerceSettings } from "@/lib/content-service";

export async function PATCH(
  request: Request,
  context: { params: Promise<{ assetId: string }> }
) {
  try {
    const { assetId } = await context.params;
    const body = (await request.json()) as {
      isProduct?: boolean;
      printFormats?: Array<{ id: string; widthCm: number; heightCm: number; label?: string; price?: number; priceOverride?: number }>;
    };

    const result = await updateEditorMediaAssetCommerceSettings({
      mediaAssetId: assetId,
      isProduct: Boolean(body.isProduct),
      printFormats: Array.isArray(body.printFormats) ? body.printFormats : []
    });

    return NextResponse.json({ asset: result });
  } catch (error) {
    return apiErrorResponse(error, "Failed to update media asset");
  }
}

export async function DELETE(
  _request: Request,
  context: { params: Promise<{ assetId: string }> }
) {
  try {
    const { assetId } = await context.params;
    const result = await deleteEditorMediaAsset(assetId);

    return NextResponse.json(result);
  } catch (error) {
    return apiErrorResponse(error, "Failed to delete media asset");
  }
}
