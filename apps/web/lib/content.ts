import { createDefaultBlock, type BlockDataMap, type BlockType } from "@artsite/blocks";

import type { MediaVariants } from "./media";

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

export type MediaCategory = string;

export const DEFAULT_MEDIA_CATEGORIES = [
  "featured",
  "works",
  "portraits",
  "details",
  "spaces",
  "uploaded"
] as const;

export type MediaLibraryAsset = {
  id: string;
  mediaAssetId: string;
  previewUrl: string;
  title: string;
  alt: string;
  category: MediaCategory;
  variants?: MediaVariants;
  isProduct?: boolean;
  printFormats?: PrintFormat[];
};

export type PrintFormat = {
  id: string;
  widthCm: number;
  heightCm: number;
  label?: string;
  price?: number;
  priceOverride?: number;
};

export type PaymentProviderConfig = {
  enabled?: boolean;
  title?: string;
  description?: string;
  kind?: "yoomoney" | "sbp" | "paypal" | "cards";
  settings?: Record<string, string>;
};

export type SiteCommerceSettings = {
  cartEnabled: boolean;
  printFormats: PrintFormat[];
  paymentProviders: Record<string, PaymentProviderConfig>;
};

export const DEFAULT_SITE_COMMERCE_SETTINGS: SiteCommerceSettings = {
  cartEnabled: true,
  printFormats: [
    { id: "30x40", widthCm: 30, heightCm: 40, label: "30 × 40", price: 2500 },
    { id: "40x50", widthCm: 40, heightCm: 50, label: "40 × 50", price: 3500 },
    { id: "50x70", widthCm: 50, heightCm: 70, label: "50 × 70", price: 5200 }
  ],
  paymentProviders: {
    yoomoney: { enabled: false, title: "ЮKassa", kind: "yoomoney", settings: { currency: "RUB" } },
    sbp: { enabled: false, title: "СБП", kind: "sbp", settings: {} },
    paypal: { enabled: false, title: "PayPal", kind: "paypal", settings: {} },
    cards: { enabled: false, title: "Visa / Mastercard", kind: "cards", settings: {} }
  }
};

const PUBLIC_PAYMENT_SETTING_KEYS = new Set(["currency", "returnUrl", "descriptionTemplate"]);

export function toPublicCommerceSettings(settings: SiteCommerceSettings): SiteCommerceSettings {
  return {
    ...settings,
    paymentProviders: Object.fromEntries(
      Object.entries(settings.paymentProviders).map(([key, provider]) => [
        key,
        {
          ...provider,
          settings: Object.fromEntries(
            Object.entries(provider.settings ?? {}).filter(([settingKey]) => PUBLIC_PAYMENT_SETTING_KEYS.has(settingKey))
          )
        }
      ])
    )
  };
}

export type SeedPageDefinition = Omit<SitePageRecord, "availablePages" | "source">;

const cyrillicToLatinMap: Record<string, string> = {
  а: "a",
  б: "b",
  в: "v",
  г: "g",
  д: "d",
  е: "e",
  ё: "e",
  ж: "zh",
  з: "z",
  и: "i",
  й: "y",
  к: "k",
  л: "l",
  м: "m",
  н: "n",
  о: "o",
  п: "p",
  р: "r",
  с: "s",
  т: "t",
  у: "u",
  ф: "f",
  х: "h",
  ц: "ts",
  ч: "ch",
  ш: "sh",
  щ: "sch",
  ъ: "",
  ы: "y",
  ь: "",
  э: "e",
  ю: "yu",
  я: "ya"
};

export function sanitizeSlug(value: string) {
  const transliterated = value
    .trim()
    .toLowerCase()
    .split("")
    .map((character) => cyrillicToLatinMap[character] ?? character)
    .join("");

  return transliterated
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
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
