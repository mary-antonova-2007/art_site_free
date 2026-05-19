import { redirect } from "next/navigation";
import type { Route } from "next";

type HomeAliasPageProps = {
  searchParams: Promise<{ edit?: string; editor?: string }>;
};

export default async function HomeAliasPage({ searchParams }: HomeAliasPageProps) {
  const resolvedSearch = await searchParams;
  const editorParam = resolvedSearch.edit ?? resolvedSearch.editor;
  redirect((editorParam ? `/en?editor=${encodeURIComponent(editorParam)}` : "/en") as Route);
}
