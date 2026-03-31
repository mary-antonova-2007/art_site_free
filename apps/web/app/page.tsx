import { notFound } from "next/navigation";

import { EditorBar } from "@/components/editor/editor-bar";
import { EditorProvider } from "@/components/editor/editor-provider";
import { EditorSheet } from "@/components/editor/editor-sheet";
import { PageRenderer } from "@/components/site/page-renderer";
import { SiteHeader } from "@/components/site/site-header";
import { getPageForRequest } from "@/lib/content-service";
import { isEditorModeEnabled } from "@/lib/editor-mode";

type HomePageProps = {
  searchParams: Promise<{ edit?: string; editor?: string }>;
};

export default async function HomePage({ searchParams }: HomePageProps) {
  const resolvedSearch = await searchParams;
  const requestedEdit = isEditorModeEnabled(resolvedSearch.edit ?? resolvedSearch.editor);
  const { page, editorEnabled } = await getPageForRequest("home", requestedEdit);

  if (!page) {
    notFound();
  }

  return (
    <EditorProvider page={page} enabled={editorEnabled}>
      <div className="site-frame">
        <SiteHeader currentSlug={page.slug} pages={page.availablePages} />
        {editorEnabled ? <EditorBar /> : null}
        <PageRenderer page={page} />
        {editorEnabled ? <EditorSheet /> : null}
      </div>
    </EditorProvider>
  );
}
