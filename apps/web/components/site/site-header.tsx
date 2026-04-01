import { SiteHeaderClient } from "@/components/site/site-header-client";
import { getBlockNavigationLabel } from "@/lib/block-navigation";
import { getServerI18n } from "@/lib/i18n";
import type { SiteBlockRecord } from "@/lib/content";

export async function SiteHeader({
  currentSlug,
  pages,
  currentPath,
  editorEnabled,
  blocks
}: {
  currentSlug: string;
  pages: Array<{ id: string; slug: string; title: string }>;
  currentPath: string;
  editorEnabled: boolean;
  blocks: SiteBlockRecord[];
}) {
  const { t } = await getServerI18n();
  const blockItems = blocks
    .map((block) => ({
      id: block.id,
      label: getBlockNavigationLabel(block)
    }))
    .filter((item): item is { id: string; label: string } => Boolean(item.label));

  return (
    <SiteHeaderClient
      currentSlug={currentSlug}
      pages={pages}
      currentPath={currentPath}
      editorEnabled={editorEnabled}
      kicker={t("header.kicker")}
      primaryNavLabel={t("header.primaryNav")}
      blockItems={blockItems}
    />
  );
}
