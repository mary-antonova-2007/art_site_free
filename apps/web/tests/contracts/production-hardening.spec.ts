import { afterEach, describe, expect, test, vi } from "vitest";

import { buildAdminCookieValue, verifyAdminCookieValue } from "@/lib/auth";
import { getCheckoutAmount, type PricedCheckoutItem } from "@/lib/checkout-pricing";
import { readCart } from "@/lib/cart";
import { assertUploadLooksSafe, resolveSafeLocalMediaPath } from "@/lib/media-safety";

describe("production hardening contracts", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  test("rejects expired admin session payloads", () => {
    const cookie = buildAdminCookieValue(1_000);

    expect(verifyAdminCookieValue(cookie, 1_100)).toBe(true);
    expect(verifyAdminCookieValue(cookie, 1_000 + 60 * 60 * 12 + 1)).toBe(false);
  });

  test("rejects media paths outside the upload root", () => {
    expect(resolveSafeLocalMediaPath("/app/data/uploads", ["page", "image.webp"])).toBe(
      "/app/data/uploads/page/image.webp"
    );

    expect(() => resolveSafeLocalMediaPath("/app/data/uploads", ["..", ".env"])).toThrow(
      "Invalid media path."
    );
  });

  test("allows only raster uploads with matching extensions and size limits", () => {
    expect(() =>
      assertUploadLooksSafe({ fileName: "work.svg", fileType: "image/svg+xml", sizeBytes: 128 })
    ).toThrow("Only JPEG, PNG, WebP, and AVIF uploads are allowed.");

    expect(() =>
      assertUploadLooksSafe({ fileName: "work.png", fileType: "image/jpeg", sizeBytes: 128 })
    ).toThrow("File extension does not match the uploaded image type.");

    expect(() =>
      assertUploadLooksSafe({ fileName: "work.webp", fileType: "image/webp", sizeBytes: 128 })
    ).not.toThrow();
  });

  test("migrates legacy cart rows into server-priced checkout rows", () => {
    const stored = JSON.stringify([
      {
        id: "/media-files/page/work.webp:60x80",
        imageSrc: "/media-files/page/work.webp",
        title: "Work",
        alt: "Work",
        format: { id: "60x80", widthCm: 60, heightCm: 80, price: 1 },
        quantity: 2
      }
    ]);
    vi.stubGlobal("window", {
      localStorage: {
        getItem: () => stored
      },
      dispatchEvent: () => undefined
    });

    expect(readCart()).toEqual([
      expect.objectContaining({
        mediaAssetId: "/media-files/page/work.webp",
        formatId: "60x80",
        quantity: 2
      })
    ]);
  });

  test("checkout totals come from normalized server-priced items", () => {
    const items: PricedCheckoutItem[] = [
      {
        mediaAssetId: "/media-files/page/work.webp",
        title: "Work",
        format: { id: "60x80", widthCm: 60, heightCm: 80, price: 6000 },
        quantity: 2,
        unitPrice: 6000,
        lineTotal: 12000
      }
    ];

    expect(getCheckoutAmount(items)).toBe(12000);
  });
});
