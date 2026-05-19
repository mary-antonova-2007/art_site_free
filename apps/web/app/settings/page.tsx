import { redirect } from "next/navigation";

import { ShopSettingsPage } from "@/components/editor/shop-settings-page";
import { SiteHeader } from "@/components/site/site-header";
import { getEditorIdentity } from "@/lib/auth";
import { toEditorCommerceSettings } from "@/lib/content";
import { getCommerceSettings, getLocalizationSettings, getSeoSettings, listEditorPages } from "@/lib/content-service";

export default async function SettingsRoutePage() {
  const editor = await getEditorIdentity();
  if (!editor) {
    redirect("/auth/sign-in?next=%2Fsettings%3Feditor%3D1");
  }

  const [commerceSettings, initialSeoSettings, initialLocalizationSettings, pages] = await Promise.all([
    getCommerceSettings(),
    getSeoSettings(),
    getLocalizationSettings(),
    listEditorPages()
  ]);
  const initialSettings = toEditorCommerceSettings(commerceSettings);

  return (
    <div className="site-frame">
      <SiteHeader currentSlug="settings" pages={pages} currentPath="/settings?editor=1" editorEnabled blocks={[]} />
      <ShopSettingsPage
        initialSettings={initialSettings}
        initialSeoSettings={initialSeoSettings}
        initialLocalizationSettings={initialLocalizationSettings}
      />
    </div>
  );
}
