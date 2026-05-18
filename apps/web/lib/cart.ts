"use client";

import type { PrintFormat } from "./content";

export type CartItem = {
  id: string;
  mediaAssetId: string;
  formatId: string;
  imageSrc: string;
  title: string;
  alt: string;
  format: PrintFormat;
  availableFormats?: PrintFormat[];
  quantity: number;
  unavailable?: boolean;
};

const CART_STORAGE_KEY = "artsite-cart";

export function readCart(): CartItem[] {
  if (typeof window === "undefined") {
    return [];
  }

  const stored = window.localStorage.getItem(CART_STORAGE_KEY);
  if (!stored) {
    return [];
  }

  try {
    const parsed = JSON.parse(stored) as unknown[];
    return Array.isArray(parsed) ? parsed.map(normalizeCartItem).filter((item): item is CartItem => Boolean(item)) : [];
  } catch {
    return [];
  }
}

export function writeCart(items: CartItem[]) {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items));
  window.dispatchEvent(new Event("storage"));
}

export function clearCart() {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.removeItem(CART_STORAGE_KEY);
  window.dispatchEvent(new Event("storage"));
}

function isCartItem(value: unknown): value is CartItem {
  if (!value || typeof value !== "object") {
    return false;
  }

  const candidate = value as Record<string, unknown>;
  return (
    typeof candidate.id === "string" &&
    typeof candidate.mediaAssetId === "string" &&
    typeof candidate.formatId === "string" &&
    typeof candidate.imageSrc === "string" &&
    typeof candidate.title === "string" &&
    typeof candidate.alt === "string" &&
    Boolean(candidate.format) &&
    typeof candidate.format === "object" &&
    typeof (candidate.format as Record<string, unknown>).widthCm === "number" &&
    typeof (candidate.format as Record<string, unknown>).heightCm === "number" &&
    (candidate.availableFormats === undefined || Array.isArray(candidate.availableFormats)) &&
    typeof candidate.quantity === "number"
  );
}

function normalizeCartItem(value: unknown): CartItem | null {
  if (!value || typeof value !== "object") {
    return null;
  }

  const candidate = value as Record<string, unknown>;
  const format = candidate.format as Record<string, unknown> | undefined;
  const mediaAssetId =
    typeof candidate.mediaAssetId === "string" && candidate.mediaAssetId.trim()
      ? candidate.mediaAssetId
      : typeof candidate.imageSrc === "string"
        ? stripVariantSuffix(candidate.imageSrc)
        : "";
  const formatId =
    typeof candidate.formatId === "string" && candidate.formatId.trim()
      ? candidate.formatId
      : typeof format?.id === "string"
        ? format.id
        : "";

  const migrated = {
    ...candidate,
    id: typeof candidate.id === "string" ? candidate.id : `${mediaAssetId}:${formatId}`,
    mediaAssetId,
    formatId,
    unavailable: !mediaAssetId || !formatId,
    quantity: Math.max(1, Number(candidate.quantity) || 1)
  };

  return isCartItem(migrated) ? migrated : null;
}

function stripVariantSuffix(value: string) {
  return value.replace(/--(thumb|card|panel|hero)\.webp($|[?#])/i, (match, _variant: string, suffix: string) => {
    return `.webp${suffix}`;
  });
}
