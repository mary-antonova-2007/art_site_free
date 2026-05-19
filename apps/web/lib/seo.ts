import type { Metadata } from "next";

import { locales, type Locale } from "@/lib/i18n/config";
import type { MediaLibraryAsset, PageSeo, SiteBlockRecord, SitePageRecord, SiteSeoSettings } from "./content";

type SeoLanguage = "ru" | "en";

export function getSiteUrl() {
  return process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/+$/, "") || "http://localhost:3000";
}

export function normalizeCanonicalPath(slug: string, canonicalPath?: string) {
  const fallback = slug === "home" ? "/" : `/${slug.replace(/^\/+/, "")}`;
  const raw = canonicalPath?.trim() || fallback;

  if (/^https?:\/\//i.test(raw)) {
    return new URL(raw).pathname || "/";
  }

  return raw.startsWith("/") ? raw : `/${raw}`;
}

export function resolveSeoLanguage(locale: Locale | string): SeoLanguage {
  return locale === "ru" ? "ru" : "en";
}

export function buildPageMetadata(input: {
  page: SitePageRecord;
  locale: Locale | string;
  settings: SiteSeoSettings;
  mediaAssets?: MediaLibraryAsset[];
  siteUrl?: string;
}): Metadata {
  const siteUrl = input.siteUrl ?? getSiteUrl();
  const language = resolveSeoLanguage(input.locale);
  const title = pickSeoTitle(input.page, language, input.settings);
  const description = pickSeoDescription(input.page, language);
  const canonicalPath = getLocalizedCanonicalPath(input.page.slug, language);
  const canonicalUrl = new URL(canonicalPath, siteUrl).toString();
  const image = resolveOgImage(input.page, input.settings, input.mediaAssets ?? [], siteUrl);
  const noIndex = input.page.seo.noIndex === true || input.settings.defaultRobots === "noindex";

  return {
    metadataBase: new URL(siteUrl),
    title,
    description,
    alternates: {
      canonical: canonicalPath,
      languages: Object.fromEntries(
        locales.map((locale) => [locale, getLocalizedCanonicalPath(input.page.slug, locale)])
      )
    },
    robots: {
      index: !noIndex,
      follow: !noIndex
    },
    openGraph: {
      title,
      description,
      url: canonicalUrl,
      siteName: input.settings.siteName,
      type: "website",
      images: image ? [{ url: image }] : undefined
    },
    twitter: {
      card: image ? "summary_large_image" : "summary",
      title,
      description,
      images: image ? [image] : undefined
    }
  };
}

export function getLocalizedCanonicalPath(slug: string, locale: Locale | SeoLanguage) {
  const normalizedSlug = slug === "home" ? "" : `/${slug.replace(/^\/+/, "")}`;
  return `/${locale}${normalizedSlug}`;
}

export function pageShouldBeInSitemap(page: SitePageRecord, settings: SiteSeoSettings) {
  return page.seo.noIndex !== true && settings.defaultRobots !== "noindex";
}

export function pickSeoTitle(page: SitePageRecord, language: SeoLanguage, settings: SiteSeoSettings) {
  return page.seo.title[language]?.trim() || page.title || settings.siteName;
}

export function pickSeoDescription(page: SitePageRecord, language: SeoLanguage) {
  return page.seo.description[language]?.trim() || extractTextFromBlocks(page.blocks) || "";
}

export function resolveOgImage(
  page: SitePageRecord,
  settings: SiteSeoSettings,
  mediaAssets: MediaLibraryAsset[],
  siteUrl = getSiteUrl()
) {
  const byId = new Map(mediaAssets.map((asset) => [asset.mediaAssetId, asset]));
  const pageImageId = page.seo.ogImageAssetId?.trim();
  const globalImageId = settings.defaultOgImageAssetId?.trim();
  const selected = (pageImageId ? byId.get(pageImageId) : undefined) || (globalImageId ? byId.get(globalImageId) : undefined);
  const fallback = selected?.previewUrl || pageImageId || globalImageId || findFirstImage(page.blocks);

  if (!fallback) {
    return undefined;
  }

  return /^https?:\/\//i.test(fallback) ? fallback : new URL(fallback, siteUrl).toString();
}

function extractTextFromBlocks(blocks: SiteBlockRecord[]) {
  const fragments: string[] = [];

  for (const block of blocks) {
    if (block.isHidden) continue;
    const data = block.data as Record<string, unknown>;
    for (const key of ["subtitle", "description", "text", "quote"]) {
      const value = data[key];
      if (typeof value === "string" && value.trim()) {
        fragments.push(value.trim());
      }
    }
    if (fragments.join(" ").length > 180) break;
  }

  return truncate(fragments.join(" "), 160);
}

function findFirstImage(blocks: SiteBlockRecord[]) {
  for (const block of blocks) {
    if (block.isHidden) continue;
    const image = (block.data as Record<string, unknown>).image;
    if (image && typeof image === "object") {
      const mediaAssetId = (image as Record<string, unknown>).mediaAssetId;
      if (typeof mediaAssetId === "string" && mediaAssetId.trim()) return mediaAssetId;
    }
    const items = (block.data as Record<string, unknown>).items;
    if (Array.isArray(items)) {
      const item = items.find((candidate) => {
        return candidate && typeof candidate === "object" && typeof (candidate as Record<string, unknown>).mediaAssetId === "string";
      }) as Record<string, unknown> | undefined;
      if (typeof item?.mediaAssetId === "string") return item.mediaAssetId;
    }
  }

  return undefined;
}

function truncate(value: string, maxLength: number) {
  if (value.length <= maxLength) return value;
  return `${value.slice(0, maxLength - 1).trim()}...`;
}
