import { PageScreen } from "@/components/site/page-screen";

type SitePageProps = {
  params: Promise<{ slug?: string[] }>;
  searchParams: Promise<{ edit?: string; editor?: string }>;
};

export default async function SitePage({ params, searchParams }: SitePageProps) {
  const resolvedParams = await params;
  const resolvedSearch = await searchParams;
  const slug = resolvedParams.slug?.join("/") ?? "home";
  return <PageScreen slug={slug} edit={resolvedSearch.edit ?? resolvedSearch.editor} />;
}
