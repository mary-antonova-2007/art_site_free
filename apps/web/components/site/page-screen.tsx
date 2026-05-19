import { notFound, redirect } from "next/navigation";

import { EditorBar } from "@/components/editor/editor-bar";
import { EditorBlockNav } from "@/components/editor/editor-block-nav";
import { EditorProvider } from "@/components/editor/editor-provider";
import { SeoEditorPanel } from "@/components/editor/seo-editor-panel";
import { EditorSheet } from "@/components/editor/editor-sheet";
import { MediaLibraryDialog } from "@/components/editor/media-library-dialog";
import { PageRenderer } from "@/components/site/page-renderer";
import { SiteHeader } from "@/components/site/site-header";
import { getCommerceSettings, getPageForRequest, listPublicMediaLibrary } from "@/lib/content-service";
import { toPublicCommerceSettings } from "@/lib/content";
import { isEditorModeEnabled } from "@/lib/editor-mode";

export async function PageScreen({
  slug,
  edit,
  currentPath
}: {
  slug: string;
  edit?: string;
  currentPath: string;
}) {
  const requestedEdit = isEditorModeEnabled(edit);
  const { page, editorEnabled } = await getPageForRequest(slug, requestedEdit);
  const commerceSettings = await getCommerceSettings();
  const mediaAssets = await listPublicMediaLibrary();
  const mediaAssetsById = Object.fromEntries(mediaAssets.map((asset) => [asset.mediaAssetId, asset]));
  const currentViewPath = requestedEdit ? `${currentPath}?editor=1` : currentPath;

  if (!page) {
    notFound();
  }

  if (requestedEdit && !editorEnabled) {
    const next = `${currentPath}?editor=1`;
    redirect(`/auth/sign-in?next=${encodeURIComponent(next)}`);
  }

  return (
    <EditorProvider page={page} enabled={editorEnabled}>
      <div className="site-frame">
        <SiteHeader
          currentSlug={page.slug}
          pages={page.availablePages}
          currentPath={currentViewPath}
          editorEnabled={editorEnabled}
          blocks={page.blocks}
        />
        <EditorBlockNav />
        {editorEnabled ? <EditorBar /> : null}
        <PageRenderer page={page} commerceSettings={toPublicCommerceSettings(commerceSettings)} mediaAssetsById={mediaAssetsById} />
        {editorEnabled ? <EditorSheet /> : null}
        {editorEnabled ? <SeoEditorPanel /> : null}
        {editorEnabled ? <MediaLibraryDialog /> : null}
      </div>
    </EditorProvider>
  );
}
