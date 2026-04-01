import { z } from "zod";

import { contactBlock } from "./definitions/contact";
import { aboutBlock } from "./definitions/about";
import { ctaBlock } from "./definitions/cta";
import { dividerBlock } from "./definitions/divider";
import { galleryBlock } from "./definitions/gallery";
import { heroBlock } from "./definitions/hero";
import { imageBlock } from "./definitions/image";
import { imageTextBlock } from "./definitions/image-text";
import { linksListBlock } from "./definitions/links-list";
import { quoteBlock } from "./definitions/quote";
import { richTextBlock } from "./definitions/rich-text";
import { sectionHeaderBlock } from "./definitions/section-header";
import { seriesGridBlock } from "./definitions/series-grid";
import { worksGridBlock } from "./definitions/works-grid";

export * from "./lib/types";
export * from "./lib/helpers";

export const blockRegistry = [
  heroBlock,
  richTextBlock,
  imageBlock,
  imageTextBlock,
  galleryBlock,
  quoteBlock,
  sectionHeaderBlock,
  dividerBlock,
  aboutBlock,
  contactBlock,
  worksGridBlock,
  seriesGridBlock,
  linksListBlock,
  ctaBlock
] as const;

export type BlockRegistryEntry = (typeof blockRegistry)[number];
export type BlockType = BlockRegistryEntry["type"];
export type BlockDataMap = {
  [TType in BlockType]: z.infer<Extract<BlockRegistryEntry, { type: TType }>["schema"]>;
};

const blockMap = new Map(blockRegistry.map((block) => [block.type, block]));

export function getBlockDefinition<TType extends BlockType>(type: TType) {
  return blockMap.get(type) as Extract<BlockRegistryEntry, { type: TType }>;
}

export function listBlockDefinitions(): readonly BlockRegistryEntry[] {
  return blockRegistry;
}

export function createDefaultBlock<TType extends BlockType>(type: TType): BlockDataMap[TType] {
  return getBlockDefinition(type).createDefault() as BlockDataMap[TType];
}

export function validateBlock<TType extends BlockType>(type: TType, payload: unknown) {
  const schema = getBlockDefinition(type).schema;

  if (schema instanceof z.ZodObject) {
    return schema.passthrough().parse(payload);
  }

  return schema.parse(payload);
}
