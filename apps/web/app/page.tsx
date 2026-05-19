import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { getEntryLocale } from "@/lib/locale-routing";

type HomePageProps = {
  searchParams: Promise<{ edit?: string; editor?: string }>;
};

export async function generateMetadata(): Promise<Metadata> {
  return {};
}

export default async function HomePage({ searchParams }: HomePageProps) {
  const resolvedSearch = await searchParams;
  const editorParam = resolvedSearch.edit ?? resolvedSearch.editor;
  const locale = await getEntryLocale();
  redirect(editorParam ? `/${locale}?editor=${encodeURIComponent(editorParam)}` : `/${locale}`);
}
