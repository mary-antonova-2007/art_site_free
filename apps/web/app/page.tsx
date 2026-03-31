import { PageScreen } from "@/components/site/page-screen";

type HomePageProps = {
  searchParams: Promise<{ edit?: string; editor?: string }>;
};

export default async function HomePage({ searchParams }: HomePageProps) {
  const resolvedSearch = await searchParams;
  return <PageScreen slug="home" edit={resolvedSearch.edit ?? resolvedSearch.editor} currentPath="/" />;
}
