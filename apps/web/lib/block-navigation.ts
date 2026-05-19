import { getBlockDefinition } from "@artsite/blocks";

import type { SiteBlockRecord } from "@/lib/content";
import type { Locale } from "@/lib/i18n/config";
import { getLocalizedBlockNavigationLabel } from "@/lib/localized-content";

export function getBlockAnchorId(blockId: string) {
  return `site-block-${blockId}`;
}

export function getBlockNavigationLabel(block: SiteBlockRecord, locale?: Locale) {
  if (locale) {
    const localizedLabel = getLocalizedBlockNavigationLabel(block, locale);
    if (localizedLabel) {
      return localizedLabel;
    }
  }

  const data = block.data as Record<string, unknown>;
  if (!data.showInNavigation) {
    return null;
  }

  const candidates = [data.title, data.eyebrow, data.caption, data.quote, data.author, data.buttonText];

  for (const value of candidates) {
    if (typeof value === "string" && value.trim()) {
      return value.trim();
    }
  }

  return getBlockDefinition(block.blockType).label;
}
