import "server-only";

import { createDb, hasDatabaseUrl, mediaAssets } from "@artsite/db";
import { inArray } from "drizzle-orm";

import type { PrintFormat, SiteCommerceSettings } from "./content";
import { createAdminSupabaseClient, hasSupabaseEnv } from "./supabase/admin";

export type CheckoutLineInput = {
  mediaAssetId?: unknown;
  formatId?: unknown;
  quantity?: unknown;
};

export type PricedCheckoutItem = {
  mediaAssetId: string;
  title: string;
  format: PrintFormat;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
};

type ProductAsset = {
  mediaAssetId: string;
  title: string;
  isProduct: boolean;
  printFormats: PrintFormat[];
};

export async function priceCheckoutItems(
  items: CheckoutLineInput[] | undefined,
  commerceSettings: SiteCommerceSettings
) {
  if (!Array.isArray(items)) {
    return [];
  }

  const priced: PricedCheckoutItem[] = [];

  for (const item of items) {
    const mediaAssetId = typeof item.mediaAssetId === "string" ? item.mediaAssetId.trim() : "";
    const formatId = typeof item.formatId === "string" ? item.formatId.trim() : "";
    const quantity = Math.min(99, Math.max(1, Math.floor(Number(item.quantity) || 1)));

    if (!mediaAssetId || !formatId) {
      continue;
    }

    const asset = await findProductAsset(mediaAssetId);
    if (!asset?.isProduct) {
      continue;
    }

    const allowedFormats = asset.printFormats.length ? asset.printFormats : commerceSettings.printFormats;
    const format = allowedFormats.find((candidate) => candidate.id === formatId);
    const unitPrice = getEffectivePriceValue(format);

    if (!format || unitPrice <= 0) {
      continue;
    }

    priced.push({
      mediaAssetId: asset.mediaAssetId,
      title: asset.title,
      format,
      quantity,
      unitPrice,
      lineTotal: unitPrice * quantity
    });
  }

  return priced;
}

export function getCheckoutAmount(items: PricedCheckoutItem[]) {
  return items.reduce((sum, item) => sum + item.lineTotal, 0);
}

function getEffectivePriceValue(format: PrintFormat | undefined) {
  const price = Number(format?.priceOverride ?? format?.price);
  return Number.isFinite(price) && price > 0 ? price : 0;
}

async function findProductAsset(mediaAssetId: string): Promise<ProductAsset | null> {
  if (hasSupabaseEnv()) {
    return await findSupabaseProductAsset(mediaAssetId);
  }

  if (!hasDatabaseUrl()) {
    return null;
  }

  const db = createDb();
  const candidates = getMediaAssetLookupCandidates(mediaAssetId);
  const row = await db.query.mediaAssets.findFirst({
    where: inArray(mediaAssets.storagePath, candidates)
  });

  if (!row) {
    return null;
  }

  return {
    mediaAssetId: row.storagePath,
    title: row.caption ?? row.fileName ?? "Artwork",
    isProduct: row.isPublic && row.isProduct,
    printFormats: Array.isArray(row.printFormats) ? row.printFormats : []
  };
}

async function findSupabaseProductAsset(mediaAssetId: string): Promise<ProductAsset | null> {
  const admin = createAdminSupabaseClient();
  const candidates = getMediaAssetLookupCandidates(mediaAssetId);

  try {
    const url = new URL(mediaAssetId);
    const publicMarker = "/object/public/";
    const markerIndex = url.pathname.indexOf(publicMarker);
    if (markerIndex >= 0) {
      const storagePath = decodeURIComponent(url.pathname.slice(markerIndex + publicMarker.length).split("/").slice(1).join("/"));
      if (storagePath) {
        candidates.push(...getMediaAssetLookupCandidates(storagePath));
      }
    }
  } catch {
    // mediaAssetId may already be a storage path.
  }

  const { data, error } = await admin
    .from("media_assets")
    .select("storage_path, file_name, caption, is_public, is_product, print_formats")
    .in("storage_path", Array.from(new Set(candidates)))
    .limit(1);

  if (error) {
    throw error;
  }

  const row = data?.[0];
  if (!row) {
    return null;
  }

  return {
    mediaAssetId: String(row.storage_path),
    title: String(row.caption ?? row.file_name ?? "Artwork"),
    isProduct: Boolean(row.is_public && row.is_product),
    printFormats: Array.isArray(row.print_formats) ? row.print_formats : []
  };
}

function getMediaAssetLookupCandidates(mediaAssetId: string) {
  const candidates = new Set([mediaAssetId]);
  const normalized = mediaAssetId.replace(/--(thumb|card|panel|hero)\.webp($|[?#])/i, ".webp$2");
  candidates.add(normalized);

  const withoutExtension = normalized.replace(/\.(webp|png|jpe?g|avif)($|[?#]).*$/i, "");
  [".jpg", ".jpeg", ".png", ".webp", ".avif"].forEach((extension) => {
    candidates.add(`${withoutExtension}${extension}`);
  });

  return Array.from(candidates);
}
