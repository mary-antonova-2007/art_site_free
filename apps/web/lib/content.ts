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
  source: "database" | "supabase";
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

export type SeedPageDefinition = Omit<SitePageRecord, "availablePages" | "source">;

export function sanitizeSlug(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function toReadableMediaTitle(fileName: string) {
  return fileName
    .replace(/\.[^.]+$/, "")
    .replace(/[-_]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function createSeedMediaLibrary(): MediaLibraryAsset[] {
  return [
    {
      id: "media-hero",
      mediaAssetId: "/art-hero.svg",
      previewUrl: "/art-hero.svg",
      title: "Главный кадр",
      alt: "Главное изображение",
      category: "featured"
    },
    {
      id: "media-gallery-1",
      mediaAssetId: "/art-01.svg",
      previewUrl: "/art-01.svg",
      title: "Этюд инсталляции",
      alt: "Этюд инсталляции",
      category: "works"
    },
    {
      id: "media-gallery-2",
      mediaAssetId: "/art-02.svg",
      previewUrl: "/art-02.svg",
      title: "Световая композиция",
      alt: "Световая композиция",
      category: "works"
    },
    {
      id: "media-sample",
      mediaAssetId: "/art-03.svg",
      previewUrl: "/art-03.svg",
      title: "Фрагмент серии",
      alt: "Фрагмент серии",
      category: "details"
    },
    {
      id: "media-portrait",
      mediaAssetId: "/portrait.svg",
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

export function createSeedPages(): SeedPageDefinition[] {
  return [
    {
      id: "page-home",
      slug: "home",
      title: "Главная",
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
              mediaAssetId: "/art-hero.svg",
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
              { mediaAssetId: "/art-01.svg", caption: "Этюд инсталляции", alt: "Этюд инсталляции" },
              { mediaAssetId: "/art-02.svg", caption: "Световая композиция", alt: "Световая композиция" }
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
              mediaAssetId: "/portrait.svg",
              alt: "Портрет"
            }
          }
        },
        {
          ...block("quote", 5),
          data: {
            ...createDefaultBlock("quote"),
            quote: "Рамка не заменяет произведение, но она учит зрителя, как к нему подойти.",
            author: "Заметка студии"
          }
        },
        {
          ...block("worksGrid", 6),
          data: {
            ...createDefaultBlock("worksGrid"),
            title: "Подборка работ",
            itemIds: ["/art-01.svg", "/art-02.svg", "/art-03.svg"]
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
              mediaAssetId: "/portrait.svg",
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
