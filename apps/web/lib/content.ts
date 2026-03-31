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

export type MediaCategory =
  | "featured"
  | "portraits"
  | "works"
  | "details"
  | "spaces"
  | "uploaded";

export type MediaLibraryAsset = {
  id: string;
  mediaAssetId: string;
  previewUrl: string;
  title: string;
  alt: string;
  category: MediaCategory;
};

export type DemoSnapshot = {
  pages: SitePageRecord[];
  mediaLibrary: MediaLibraryAsset[];
};

type CreateDemoPageInput = {
  title: string;
  slug: string;
};

let demoPages = createSeedPages();
let demoMediaLibrary = createDemoMediaLibrary();

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

export function listDemoMediaLibrary() {
  return JSON.parse(JSON.stringify(demoMediaLibrary)) as MediaLibraryAsset[];
}

export function createDemoMediaAsset(input: {
  fileName: string;
  category?: MediaCategory;
  previewUrl?: string;
}) {
  const category = input.category ?? "uploaded";
  const readableTitle = toReadableMediaTitle(input.fileName);
  const nextAsset: MediaLibraryAsset = {
    id: `media-${crypto.randomUUID()}`,
    mediaAssetId: input.previewUrl ?? `/art-04.svg`,
    previewUrl: input.previewUrl ?? "/art-04.svg",
    title: readableTitle,
    alt: "",
    category
  };

  demoMediaLibrary = [nextAsset, ...demoMediaLibrary];

  return JSON.parse(JSON.stringify(nextAsset)) as MediaLibraryAsset;
}

export function getDemoSnapshot(): DemoSnapshot {
  return {
    pages: JSON.parse(JSON.stringify(demoPages)) as SitePageRecord[],
    mediaLibrary: JSON.parse(JSON.stringify(demoMediaLibrary)) as MediaLibraryAsset[]
  };
}

export function hydrateDemoSnapshot(snapshot?: Partial<DemoSnapshot>) {
  demoPages = snapshot?.pages
    ? withAvailablePages(JSON.parse(JSON.stringify(snapshot.pages)) as SitePageRecord[])
    : createSeedPages();
  demoMediaLibrary = snapshot?.mediaLibrary
    ? (JSON.parse(JSON.stringify(snapshot.mediaLibrary)) as MediaLibraryAsset[])
    : createDemoMediaLibrary();
  syncAvailablePages();
}

function toReadableMediaTitle(fileName: string) {
  return fileName
    .replace(/\.[^.]+$/, "")
    .replace(/[-_]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
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
      title: "Главная",
      source: "demo",
      availablePages: [],
      blocks: [
        {
          ...block("hero", 0),
          data: {
            ...createDefaultBlock("hero"),
            eyebrow: "Редакционный арт-сайт",
            title: "Спокойная система для сильных визуальных историй.",
            subtitle:
              "Публикуйте и редактируйте страницы прямо на живом сайте без тяжёлой админки и лишней сложности.",
            buttonText: "Открыть архив",
            buttonLink: "/about",
            image: {
              mediaAssetId: "hero",
              alt: "Главное изображение"
            }
          }
        },
        {
          ...block("sectionHeader", 1),
          data: {
            ...createDefaultBlock("sectionHeader"),
            eyebrow: "Избранное",
            title: "Управляемая система для визуальной публикации.",
            description:
              "Блоки сохраняют ритм, масштаб и композицию, а редактор меняет только содержимое."
          }
        },
        {
          ...block("gallery", 2),
          data: {
            ...createDefaultBlock("gallery"),
            title: "Избранные работы",
            items: [
              { mediaAssetId: "gallery-1", caption: "Этюд инсталляции" },
              { mediaAssetId: "gallery-2", caption: "Световая композиция" }
            ]
          }
        },
        {
          ...block("richText", 3),
          data: {
            ...createDefaultBlock("richText"),
            title: "Редактирование прямо на живом сайте.",
            text:
              "Владелец меняет тексты и изображения в контексте страницы, а продуманный шаблон удерживает композицию в порядке."
          }
        },
        {
          ...block("imageText", 4),
          data: {
            ...createDefaultBlock("imageText"),
            title: "Сайт для спокойной и точной работы с контентом.",
            text:
              "Шаблоны удерживают баланс, пропорции и типографику, пока редактор меняет историю, изображения и акценты.",
            caption: "Портрет, 2026",
            image: {
              mediaAssetId: "portrait",
              alt: "Портрет"
            }
          }
        },
        {
          ...block("quote", 5),
          data: {
            ...createDefaultBlock("quote"),
            quote:
              "Рамка не заменяет произведение, но она учит зрителя, как к нему подойти.",
            author: "Заметка студии"
          }
        },
        {
          ...block("worksGrid", 6),
          data: {
            ...createDefaultBlock("worksGrid"),
            title: "Подборка работ",
            itemIds: ["gallery-1", "gallery-2", "sample-image"]
          }
        },
        {
          ...block("cta", 7),
          data: {
            ...createDefaultBlock("cta"),
            title: "Начнем разговор.",
            text: "Пригласите посетителя к следующему точному шагу без лишнего шума.",
            buttonText: "Связаться",
            buttonLink: "/contact"
          }
        },
        {
          ...block("contact", 8),
          data: {
            ...createDefaultBlock("contact"),
            title: "Контакты",
            text: "Для заказов, выставок и визитов в студию.",
            email: "studio@example.com",
            phone: "+7 000 000 0000",
            socialLinks: [{ label: "Instagram", href: "https://instagram.com", external: true }]
          }
        }
      ]
    },
    {
      id: "page-about",
      slug: "about",
      title: "О проекте",
      source: "demo",
      availablePages: [],
      blocks: [
        {
          ...block("sectionHeader", 0),
          data: {
            ...createDefaultBlock("sectionHeader"),
            eyebrow: "О проекте",
            title: "Продуманная система вместо хаотичного конструктора.",
            description:
              "Редактор меняет данные блоков прямо на странице, а визуальная логика остается под контролем шаблонов."
          }
        },
        {
          ...block("richText", 1),
          data: {
            ...createDefaultBlock("richText"),
            title: "Редактирование без тяжелой админки.",
            text:
              "Этот сайт создан для владельца, который хочет просто нажать на текст или изображение, внести изменение и сразу увидеть результат на живой странице."
          }
        },
        {
          ...block("imageText", 2),
          data: {
            ...createDefaultBlock("imageText"),
            title: "Дизайн остается собранным.",
            text:
              "Даже когда контент меняется часто, блоковая система сохраняет ритм, иерархию и характер сайта.",
            caption: "Студийный портрет, 2026",
            image: {
              mediaAssetId: "portrait",
              alt: "Портрет"
            }
          }
        },
        {
          ...block("linksList", 3),
          data: {
            ...createDefaultBlock("linksList"),
            title: "Разделы",
            items: [
              { label: "Главная", href: "/" },
              { label: "Контакты", href: "/contact" }
            ]
          }
        }
      ]
    },
    {
      id: "page-contact",
      slug: "contact",
      title: "Контакты",
      source: "demo",
      availablePages: [],
      blocks: [
        {
          ...block("sectionHeader", 0),
          data: {
            ...createDefaultBlock("sectionHeader"),
            eyebrow: "Контакты",
            title: "Свяжитесь со студией.",
            description: "Для заказов, выставок, публикаций и личных визитов."
          }
        },
        {
          ...block("contact", 1),
          data: {
            ...createDefaultBlock("contact"),
            title: "Контакты",
            text: "Напишите, если хотите обсудить проект, выставку или сотрудничество.",
            email: "studio@example.com",
            phone: "+7 000 000 0000",
            socialLinks: [{ label: "Instagram", href: "https://instagram.com", external: true }]
          }
        }
      ]
    }
  ];

  return withAvailablePages(pages);
}

function createDemoMediaLibrary(): MediaLibraryAsset[] {
  return [
    {
      id: "media-hero",
      mediaAssetId: "hero",
      previewUrl: "/art-hero.svg",
      title: "Главный кадр",
      alt: "Главное изображение",
      category: "featured"
    },
    {
      id: "media-gallery-1",
      mediaAssetId: "gallery-1",
      previewUrl: "/art-01.svg",
      title: "Этюд инсталляции",
      alt: "Этюд инсталляции",
      category: "works"
    },
    {
      id: "media-gallery-2",
      mediaAssetId: "gallery-2",
      previewUrl: "/art-02.svg",
      title: "Световая композиция",
      alt: "Световая композиция",
      category: "works"
    },
    {
      id: "media-sample",
      mediaAssetId: "sample-image",
      previewUrl: "/art-03.svg",
      title: "Фрагмент серии",
      alt: "Фрагмент серии",
      category: "details"
    },
    {
      id: "media-portrait",
      mediaAssetId: "portrait",
      previewUrl: "/portrait.svg",
      title: "Портрет",
      alt: "Портрет",
      category: "portraits"
    },
    {
      id: "media-space",
      mediaAssetId: "/art-04.svg",
      previewUrl: "/art-04.svg",
      title: "Пространство",
      alt: "Вид пространства",
      category: "spaces"
    }
  ];
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
