import { createDefaultBlock, type BlockDataMap, type BlockType } from "@artsite/blocks";

export type SiteBlockRecord<TType extends BlockType = BlockType> = {
  id: string;
  blockType: TType;
  position: number;
  isHidden: boolean;
  data: BlockDataMap[TType];
};

export type SitePageRecord = {
  id: string;
  slug: string;
  title: string;
  source: "demo" | "supabase";
  availablePages: Array<{ id: string; slug: string; title: string }>;
  blocks: SiteBlockRecord[];
};

type CreateDemoPageInput = {
  title: string;
  slug: string;
};

let demoPages = createSeedPages();

export function getDemoPageBySlug(slug: string) {
  const page = demoPages.find((entry) => entry.slug === slug);
  return page ? clonePage(page) : undefined;
}

export function listDemoPages() {
  return demoPages.map(({ id, slug, title }) => ({ id, slug, title }));
}

export function saveDemoPage(input: {
  pageId: string;
  title: string;
  blocks: SiteBlockRecord[];
}) {
  demoPages = demoPages.map((page) =>
    page.id === input.pageId
      ? {
          ...page,
          title: input.title,
          blocks: input.blocks.map((block, index) => ({
            ...block,
            position: index
          }))
        }
      : page
  );

  syncAvailablePages();

  const savedPage = demoPages.find((page) => page.id === input.pageId);
  return savedPage ? clonePage(savedPage) : undefined;
}

export function createDemoPage(input: CreateDemoPageInput) {
  const nextPage: SitePageRecord = {
    id: `page-${crypto.randomUUID()}`,
    slug: sanitizeSlug(input.slug),
    title: input.title,
    source: "demo",
    availablePages: [],
    blocks: [block("hero", 0), block("richText", 1), block("cta", 2)]
  };

  demoPages = [...demoPages, nextPage];
  syncAvailablePages();

  return clonePage(nextPage);
}

export function publishDemoPage(pageId: string) {
  const page = demoPages.find((entry) => entry.id === pageId);
  return page ? clonePage(page) : undefined;
}

export function sanitizeSlug(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function createSeedPages(): SitePageRecord[] {
  const pages: SitePageRecord[] = [
    {
      id: "page-home",
      slug: "home",
      title: "Home",
      source: "demo",
      availablePages: [],
      blocks: [
        {
          ...block("hero", 0),
          data: {
            ...createDefaultBlock("hero"),
            image: {
              mediaAssetId: "hero",
              alt: "Hero artwork"
            }
          }
        },
        {
          ...block("sectionHeader", 1),
          data: {
            ...createDefaultBlock("sectionHeader"),
            eyebrow: "Featured",
            title: "A controlled system for visual publishing."
          }
        },
        {
          ...block("gallery", 2),
          data: {
            ...createDefaultBlock("gallery"),
            title: "Selected works",
            items: [
              { mediaAssetId: "gallery-1", caption: "Installation study" },
              { mediaAssetId: "gallery-2", caption: "Light composition" }
            ]
          }
        },
        {
          ...block("richText", 3),
          data: {
            ...createDefaultBlock("richText"),
            title: "Edit directly on the live site.",
            text: "The owner changes text and imagery in context, while the composition stays disciplined."
          }
        },
        {
          ...block("imageText", 4),
          data: {
            ...createDefaultBlock("imageText"),
            image: {
              mediaAssetId: "portrait",
              alt: "Portrait"
            }
          }
        },
        block("quote", 5),
        {
          ...block("worksGrid", 6),
          data: {
            ...createDefaultBlock("worksGrid"),
            itemIds: ["gallery-1", "gallery-2", "sample-image"]
          }
        },
        block("cta", 7),
        block("contact", 8)
      ]
    },
    {
      id: "page-about",
      slug: "about",
      title: "About",
      source: "demo",
      availablePages: [],
      blocks: [
        block("sectionHeader", 0),
        block("richText", 1),
        {
          ...block("imageText", 2),
          data: {
            ...createDefaultBlock("imageText"),
            image: {
              mediaAssetId: "portrait",
              alt: "Portrait"
            }
          }
        },
        block("linksList", 3)
      ]
    },
    {
      id: "page-contact",
      slug: "contact",
      title: "Contact",
      source: "demo",
      availablePages: [],
      blocks: [block("sectionHeader", 0), block("contact", 1)]
    }
  ];

  return withAvailablePages(pages);
}

function syncAvailablePages() {
  demoPages = withAvailablePages(demoPages);
}

function withAvailablePages(pages: SitePageRecord[]) {
  const availablePages = pages.map(({ id, slug, title }) => ({ id, slug, title }));
  return pages.map((page) => ({
    ...page,
    availablePages
  }));
}

function clonePage(page: SitePageRecord): SitePageRecord {
  return JSON.parse(JSON.stringify(page)) as SitePageRecord;
}

function block<TType extends BlockType>(type: TType, position: number): SiteBlockRecord<TType> {
  return {
    id: `${type}-${position}-${Math.random().toString(36).slice(2, 8)}`,
    blockType: type,
    position,
    isHidden: false,
    data: createDefaultBlock(type)
  };
}
