import { redirect } from "next/navigation";

import { MediaManager } from "@/components/editor/media-manager";
import { SiteHeader } from "@/components/site/site-header";
import { getEditorIdentity } from "@/lib/auth";
import { listEditorPages } from "@/lib/content-service";

export default async function MediaPage() {
  const editor = await getEditorIdentity();

  if (!editor) {
    redirect("/auth/sign-in?next=%2Fmedia%3Feditor%3D1");
  }

  const pages = await listEditorPages();

  return (
    <div className="site-frame">
      <SiteHeader currentSlug="media" pages={pages} currentPath="/media?editor=1" editorEnabled blocks={[]} />
      <MediaManager />
    </div>
  );
}
