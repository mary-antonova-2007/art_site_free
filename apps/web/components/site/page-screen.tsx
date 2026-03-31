import { notFound } from "next/navigation";

import { EditorBar } from "@/components/editor/editor-bar";
import { EditorProvider } from "@/components/editor/editor-provider";
import { EditorSheet } from "@/components/editor/editor-sheet";
import { PageRenderer } from "@/components/site/page-renderer";
import { SiteHeader } from "@/components/site/site-header";
import { getPageForRequest } from "@/lib/content-service";
import { isEditorModeEnabled } from "@/lib/editor-mode";

export async function PageScreen({
  slug,
  edit
}: {
  slug: string;
  edit?: string;
}) {
  const requestedEdit = isEditorModeEnabled(edit);
  const { page, editorEnabled } = await getPageForRequest(slug, requestedEdit);

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

