import type { Metadata } from "next";
import { redirect } from "next/navigation";

type HomePageProps = {
  searchParams: Promise<{ edit?: string; editor?: string }>;
};

export async function generateMetadata(): Promise<Metadata> {
  return {};
}

export default async function HomePage({ searchParams }: HomePageProps) {
  const resolvedSearch = await searchParams;
  const editorParam = resolvedSearch.edit ?? resolvedSearch.editor;
  redirect(editorParam ? `/en?editor=${encodeURIComponent(editorParam)}` : "/en");
}
