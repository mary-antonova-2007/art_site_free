import type { MetadataRoute } from "next";

import { getSeoSettings, listPublishedPagesForSeo } from "@/lib/content-service";
import { locales } from "@/lib/i18n/config";
import { getLocalizedCanonicalPath, getSiteUrl, pageShouldBeInSitemap } from "@/lib/seo";

export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [pages, settings] = await Promise.all([listPublishedPagesForSeo(), getSeoSettings()]);
  const siteUrl = getSiteUrl();

  return pages
    .filter((page) => pageShouldBeInSitemap(page, settings))
    .flatMap((page) =>
      locales.map((locale) => ({
        url: new URL(getLocalizedCanonicalPath(page.slug, locale), siteUrl).toString(),
        lastModified: new Date()
      }))
    );
}
