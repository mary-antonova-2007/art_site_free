"use client";

import type { PrintFormat } from "./content";

export type CartItem = {
  id: string;
  imageSrc: string;
  title: string;
  alt: string;
  format: PrintFormat;
  quantity: number;
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
    const parsed = JSON.parse(stored) as CartItem[];
    return Array.isArray(parsed) ? parsed.filter(isCartItem) : [];
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
    typeof candidate.imageSrc === "string" &&
    typeof candidate.title === "string" &&
    typeof candidate.alt === "string" &&
    Boolean(candidate.format) &&
    typeof candidate.format === "object" &&
    typeof (candidate.format as Record<string, unknown>).widthCm === "number" &&
    typeof (candidate.format as Record<string, unknown>).heightCm === "number" &&
    typeof candidate.quantity === "number"
  );
}
