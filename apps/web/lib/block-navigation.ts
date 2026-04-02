import { getBlockDefinition } from "@artsite/blocks";

import type { SiteBlockRecord } from "@/lib/content";

export function getBlockAnchorId(blockId: string) {
  return `site-block-${blockId}`;
}

export function getBlockNavigationLabel(block: SiteBlockRecord) {
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
