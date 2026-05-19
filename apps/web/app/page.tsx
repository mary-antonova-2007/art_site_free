import type { Metadata } from "next";

import { PageScreen } from "@/components/site/page-screen";
import { getPageForRequest, getSeoSettings, listPublicMediaLibrary } from "@/lib/content-service";
import { getServerLocale } from "@/lib/i18n";
import { buildPageMetadata } from "@/lib/seo";

type HomePageProps = {
  searchParams: Promise<{ edit?: string; editor?: string }>;
};

export async function generateMetadata(): Promise<Metadata> {
  const [{ page }, locale, settings, mediaAssets] = await Promise.all([
    getPageForRequest("home", false),
    getServerLocale(),
    getSeoSettings(),
    listPublicMediaLibrary()
  ]);

  if (!page) {
    return {};
  }

  return buildPageMetadata({ page, locale, settings, mediaAssets });
}

export default async function HomePage({ searchParams }: HomePageProps) {
  const resolvedSearch = await searchParams;
  return <PageScreen slug="home" edit={resolvedSearch.edit ?? resolvedSearch.editor} currentPath="/" />;
}
