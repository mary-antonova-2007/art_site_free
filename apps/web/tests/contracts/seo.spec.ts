import { describe, expect, test } from "vitest";

import type { SitePageRecord, SiteSeoSettings } from "@/lib/content";
import { buildPageMetadata, normalizeCanonicalPath, pageShouldBeInSitemap, resolveOgImage } from "@/lib/seo";

const settings: SiteSeoSettings = {
  siteName: "Olga Schmid",
  defaultOgImageAssetId: "/default-og.jpg",
  socialProfileUrls: [],
  defaultRobots: "index"
};

function page(overrides: Partial<SitePageRecord> = {}): SitePageRecord {
  return {
    id: "page-home",
    slug: "home",
    title: "Home",
    seo: {
      title: { ru: "Русский SEO", en: "English SEO" },
      description: { ru: "Русское описание страницы", en: "English page description" },
      canonicalPath: "",
      ogImageAssetId: "",
      noIndex: false
    },
    source: "database",
    availablePages: [],
    blocks: [
      {
        id: "hero",
        blockType: "hero",
        position: 0,
        isHidden: false,
        data: {
          subtitle: "Fallback text from the first meaningful block.",
          image: { mediaAssetId: "/hero.jpg" }
        }
      }
    ],
    ...overrides
  };
}

describe("SEO helper", () => {
  test("selects RU and EN metadata text", () => {
    expect(buildPageMetadata({ page: page(), locale: "ru", settings }).title).toBe("Русский SEO");
    expect(buildPageMetadata({ page: page(), locale: "en", settings }).title).toBe("English SEO");
  });

  test("falls back to page title and block text", () => {
    const metadata = buildPageMetadata({
      page: page({ seo: { title: {}, description: {}, noIndex: false } }),
      locale: "en",
      settings
    });

    expect(metadata.title).toBe("Home");
    expect(metadata.description).toContain("Fallback text");
  });

  test("normalizes canonical paths for home and content pages", () => {
    expect(normalizeCanonicalPath("home")).toBe("/");
    expect(normalizeCanonicalPath("about")).toBe("/about");
    expect(normalizeCanonicalPath("about", "artist")).toBe("/artist");
  });

  test("excludes noindex pages from sitemap", () => {
    expect(pageShouldBeInSitemap(page(), settings)).toBe(true);
    expect(pageShouldBeInSitemap(page({ seo: { title: {}, description: {}, noIndex: true } }), settings)).toBe(false);
  });

  test("resolves page, global, and block OG images", () => {
    const mediaAssets = [
      { id: "page", mediaAssetId: "/page-og.jpg", previewUrl: "/page-card.jpg", title: "Page", alt: "", category: "featured" },
      { id: "global", mediaAssetId: "/default-og.jpg", previewUrl: "/default-card.jpg", title: "Default", alt: "", category: "featured" }
    ];

    expect(resolveOgImage(page({ seo: { title: {}, description: {}, ogImageAssetId: "/page-og.jpg" } }), settings, mediaAssets, "https://example.com")).toBe("https://example.com/page-card.jpg");
    expect(resolveOgImage(page({ seo: { title: {}, description: {} } }), settings, mediaAssets, "https://example.com")).toBe("https://example.com/default-card.jpg");
    expect(resolveOgImage(page({ seo: { title: {}, description: {} } }), { ...settings, defaultOgImageAssetId: "" }, [], "https://example.com")).toBe("https://example.com/hero.jpg");
  });
});
