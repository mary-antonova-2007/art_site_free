import type { Metadata } from "next";
import { redirect } from "next/navigation";
import type { Route } from "next";

type SitePageProps = {
  params: Promise<{ slug?: string[] }>;
  searchParams: Promise<{ edit?: string; editor?: string }>;
};

export async function generateMetadata(): Promise<Metadata> {
  return {};
}

export default async function SitePage({ params, searchParams }: SitePageProps) {
  const resolvedParams = await params;
  const resolvedSearch = await searchParams;
  const slug = resolvedParams.slug?.join("/") ?? "home";
  const editorParam = resolvedSearch.edit ?? resolvedSearch.editor;
  const path = slug === "home" ? "/en" : `/en/${slug}`;
  redirect((editorParam ? `${path}?editor=${encodeURIComponent(editorParam)}` : path) as Route);
}
