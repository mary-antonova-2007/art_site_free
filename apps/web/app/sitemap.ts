import type { MetadataRoute } from "next";

import { getSeoSettings, listPublishedPagesForSeo } from "@/lib/content-service";
import { getSiteUrl, normalizeCanonicalPath, pageShouldBeInSitemap } from "@/lib/seo";

export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [pages, settings] = await Promise.all([listPublishedPagesForSeo(), getSeoSettings()]);
  const siteUrl = getSiteUrl();

  return pages
    .filter((page) => pageShouldBeInSitemap(page, settings))
    .map((page) => ({
      url: new URL(normalizeCanonicalPath(page.slug, page.seo.canonicalPath), siteUrl).toString(),
      lastModified: new Date()
    }));
}
