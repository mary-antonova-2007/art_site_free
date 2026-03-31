import { PageScreen } from "@/components/site/page-screen";

type HomeAliasPageProps = {
  searchParams: Promise<{ edit?: string; editor?: string }>;
};

export default async function HomeAliasPage({ searchParams }: HomeAliasPageProps) {
  const resolvedSearch = await searchParams;
  return <PageScreen slug="home" edit={resolvedSearch.edit ?? resolvedSearch.editor} />;
}

