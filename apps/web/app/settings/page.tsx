import { redirect } from "next/navigation";

import { ShopSettingsPage } from "@/components/editor/shop-settings-page";
import { getEditorIdentity } from "@/lib/auth";
import { getCommerceSettings } from "@/lib/content-service";

export default async function SettingsRoutePage() {
  const editor = await getEditorIdentity();
  if (!editor) {
    redirect("/auth/sign-in?next=%2Fsettings%3Feditor%3D1");
  }

  const initialSettings = await getCommerceSettings();
  return <ShopSettingsPage initialSettings={initialSettings} />;
}
