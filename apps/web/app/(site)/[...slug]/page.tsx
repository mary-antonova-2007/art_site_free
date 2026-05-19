import type { Metadata } from "next";

import { PageScreen } from "@/components/site/page-screen";
import { getPageForRequest, getSeoSettings, listPublicMediaLibrary } from "@/lib/content-service";
import { getServerLocale } from "@/lib/i18n";
import { buildPageMetadata } from "@/lib/seo";

type SitePageProps = {
  params: Promise<{ slug?: string[] }>;
  searchParams: Promise<{ edit?: string; editor?: string }>;
};

export async function generateMetadata({ params }: Pick<SitePageProps, "params">): Promise<Metadata> {
  const resolvedParams = await params;
  const slug = resolvedParams.slug?.join("/") ?? "home";
  const [{ page }, locale, settings, mediaAssets] = await Promise.all([
    getPageForRequest(slug, false),
    getServerLocale(),
    getSeoSettings(),
    listPublicMediaLibrary()
  ]);

  if (!page) {
    return {};
  }

  return buildPageMetadata({ page, locale, settings, mediaAssets });
}

export default async function SitePage({ params, searchParams }: SitePageProps) {
  const resolvedParams = await params;
  const resolvedSearch = await searchParams;
  const slug = resolvedParams.slug?.join("/") ?? "home";
  return (
    <PageScreen
      slug={slug}
      edit={resolvedSearch.edit ?? resolvedSearch.editor}
      currentPath={`/${slug}`}
    />
  );
}
