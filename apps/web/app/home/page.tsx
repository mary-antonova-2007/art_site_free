import { redirect } from "next/navigation";
import type { Route } from "next";

import { getEntryLocale } from "@/lib/locale-routing";

type HomeAliasPageProps = {
  searchParams: Promise<{ edit?: string; editor?: string }>;
};

export default async function HomeAliasPage({ searchParams }: HomeAliasPageProps) {
  const resolvedSearch = await searchParams;
  const editorParam = resolvedSearch.edit ?? resolvedSearch.editor;
  const locale = await getEntryLocale();
  redirect((editorParam ? `/${locale}?editor=${encodeURIComponent(editorParam)}` : `/${locale}`) as Route);
}
