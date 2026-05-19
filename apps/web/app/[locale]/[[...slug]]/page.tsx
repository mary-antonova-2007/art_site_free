import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { PageScreen } from "@/components/site/page-screen";
import { getPageForRequest, getSeoSettings, listPublicMediaLibrary } from "@/lib/content-service";
import { isLocale, type Locale } from "@/lib/i18n/config";
import { buildPageMetadata } from "@/lib/seo";

type LocalizedSitePageProps = {
  params: Promise<{ locale: string; slug?: string[] }>;
  searchParams: Promise<{ edit?: string; editor?: string }>;
};

function resolveSlug(slug?: string[]) {
  return slug?.join("/") ?? "home";
}

export async function generateMetadata({ params }: Pick<LocalizedSitePageProps, "params">): Promise<Metadata> {
  const resolvedParams = await params;
  if (!isLocale(resolvedParams.locale)) {
    return {};
  }

  const locale = resolvedParams.locale;
  const slug = resolveSlug(resolvedParams.slug);
  const [{ page }, settings, mediaAssets] = await Promise.all([
    getPageForRequest(slug, false),
    getSeoSettings(),
    listPublicMediaLibrary()
  ]);

  if (!page) {
    return {};
  }

  return buildPageMetadata({ page, locale, settings, mediaAssets });
}

export default async function LocalizedSitePage({ params, searchParams }: LocalizedSitePageProps) {
  const resolvedParams = await params;
  if (!isLocale(resolvedParams.locale)) {
    notFound();
  }

  const locale = resolvedParams.locale as Locale;
  const resolvedSearch = await searchParams;
  const slug = resolveSlug(resolvedParams.slug);
  const currentPath = slug === "home" ? `/${locale}` : `/${locale}/${slug}`;

  return (
    <PageScreen
      slug={slug}
      locale={locale}
      edit={resolvedSearch.edit ?? resolvedSearch.editor}
      currentPath={currentPath}
    />
  );
}
