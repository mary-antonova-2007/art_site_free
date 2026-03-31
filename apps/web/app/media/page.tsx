import { redirect } from "next/navigation";

import { MediaManager } from "@/components/editor/media-manager";
import { SiteHeader } from "@/components/site/site-header";
import { getEditorIdentity } from "@/lib/auth";
import { listDemoPages } from "@/lib/content";

export default async function MediaPage() {
  const editor = await getEditorIdentity();

  if (!editor) {
    redirect("/auth/sign-in?next=%2Fmedia%3Feditor%3D1");
  }

  return (
    <div className="site-frame">
      <SiteHeader currentSlug="media" pages={listDemoPages()} currentPath="/media?editor=1" />
      <MediaManager />
    </div>
  );
}
