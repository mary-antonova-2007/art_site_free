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
    { id: "50x50", widthCm: 50, heightCm: 50, label: "50 × 50", price: 4200 },
    { id: "50x60", widthCm: 50, heightCm: 60, label: "50 × 60", price: 4200 },
    { id: "50x80", widthCm: 50, heightCm: 80, label: "50 × 80", price: 5000 },
    { id: "52x80", widthCm: 52, heightCm: 80, label: "52 × 80", price: 5200 },
    { id: "55x80", widthCm: 55, heightCm: 80, label: "55 × 80", price: 5500 },
    { id: "60x60", widthCm: 60, heightCm: 60, label: "60 × 60", price: 4500 },
    { id: "60x65", widthCm: 60, heightCm: 65, label: "60 × 65", price: 4900 },
    { id: "60x80", widthCm: 60, heightCm: 80, label: "60 × 80", price: 6000 },
    { id: "60x85", widthCm: 60, heightCm: 85, label: "60 × 85", price: 6400 }
  ],
  paymentProviders: {
    yoomoney: { enabled: false, title: "YooKassa", kind: "yoomoney", settings: { currency: "RUB" } },
    sbp: { enabled: false, title: "SBP", kind: "sbp", settings: {} },
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

type ArtworkSeed = {
  fileName: string;
  size: string;
  title: string;
  alt: string;
  category: MediaCategory;
  collection: string;
  caption: string;
};

const ARTWORKS: ArtworkSeed[] = [
  {
    fileName: "001_60x60.jpg",
    size: "60x60",
    title: "Solar Fracture",
    alt: "Geometric crystalline abstraction in blue, gold, coral, and white.",
    category: "featured",
    collection: "Crystalline Geometry",
    caption: "Light gathers a shattered field into a new constellation."
  },
  {
    fileName: "002_60x60.jpg",
    size: "60x60",
    title: "Paleontology of a Dream",
    alt: "Shell, coral, mineral, and botanical forms arranged like an ancient marine map.",
    category: "works",
    collection: "Organic Memory",
    caption: "A shell becomes an archive of water, stone, and time."
  },
  {
    fileName: "003_60x80.jpg",
    size: "60x80",
    title: "Tree Among Ice",
    alt: "A golden tree rises from a deep blue crystalline ice field.",
    category: "featured",
    collection: "Blue Silence",
    caption: "A living axis holds its warmth inside a frozen world."
  },
  {
    fileName: "004_60x80.jpg",
    size: "60x80",
    title: "Blue Garden of Shadow",
    alt: "Layered blue floral and ice-like forms with red accents.",
    category: "details",
    collection: "Hidden Flowers",
    caption: "A flower appears through cold mist, almost refusing to be named."
  },
  {
    fileName: "005_50x80.jpg",
    size: "50x80",
    title: "Bird in a Winter Field",
    alt: "A slender bird stands among pale winter reeds.",
    category: "works",
    collection: "Organic Memory",
    caption: "A small creature keeps its balance inside the quiet of winter."
  },
  {
    fileName: "005_60x80.jpg",
    size: "60x80",
    title: "Antique Soul of a Mineral",
    alt: "An antique face is surrounded by shells, crystals, and deep blue minerals.",
    category: "featured",
    collection: "Mythic Figures",
    caption: "The human face returns as a mineral memory."
  },
  {
    fileName: "006_60x60.jpg",
    size: "60x60",
    title: "Blue Rose of the Deep",
    alt: "A dark blue rose-like form opens inside a nocturnal field.",
    category: "details",
    collection: "Blue Silence",
    caption: "The center of night opens like a cold flower."
  },
  {
    fileName: "007_50x50.jpg",
    size: "50x50",
    title: "Stone Split by Light",
    alt: "A dark stone is cut by a vertical golden-white line of light.",
    category: "works",
    collection: "Fire and Transformation",
    caption: "A closed stone becomes a threshold when light passes through it."
  },
  {
    fileName: "008_52x80.jpg",
    size: "52x80",
    title: "White Flower of Ice",
    alt: "A white flower-like ice form rises from blue mineral depth.",
    category: "works",
    collection: "Blue Silence",
    caption: "Tenderness learns to bloom inside the cold."
  },
  {
    fileName: "009_60x65.jpg",
    size: "60x65",
    title: "Crystalline Animal",
    alt: "A blue geometric animal-like form emerges from a dark textured field.",
    category: "works",
    collection: "Crystalline Geometry",
    caption: "Instinct takes the shape of architecture."
  },
  {
    fileName: "010_60x60.jpg",
    size: "60x60",
    title: "Spiral of Water and Sun",
    alt: "A large blue spiral turns inward toward a warm yellow and red center.",
    category: "works",
    collection: "Cycles of Time",
    caption: "The sea turns toward a small sun at its center."
  },
  {
    fileName: "011_60x80.jpg",
    size: "60x80",
    title: "Solar Whirlpool",
    alt: "A blue and yellow spiral made of many small petal-like shapes.",
    category: "featured",
    collection: "Cycles of Time",
    caption: "Many small currents gather into one luminous motion."
  },
  {
    fileName: "012_60x80.jpg",
    size: "60x80",
    title: "Waterfall of Silence",
    alt: "A white vertical flow descends through blue icy textures.",
    category: "works",
    collection: "Blue Silence",
    caption: "Silence falls through cold matter as a cleansing light."
  },
  {
    fileName: "013_60x80.jpg",
    size: "60x80",
    title: "Fire Figure in Blue Water",
    alt: "A mythic golden-orange figure radiates inside deep blue water.",
    category: "featured",
    collection: "Mythic Figures",
    caption: "Fire does not defeat water; it remembers how to move through it."
  },
  {
    fileName: "014_60x80.jpg",
    size: "60x80",
    title: "Cave of the First Fire",
    alt: "Warm ochre and orange cave-like forms surround a bright central light.",
    category: "works",
    collection: "Fire and Transformation",
    caption: "The first fire turns a cavern into a place of ritual."
  },
  {
    fileName: "015_60x80.jpg",
    size: "60x80",
    title: "Sphinx of Blue Crystal",
    alt: "A stone female figure emerges from an explosion of blue crystalline fragments.",
    category: "featured",
    collection: "Mythic Figures",
    caption: "An ancient figure wakes inside a blue future."
  },
  {
    fileName: "016_50x60.jpg",
    size: "50x60",
    title: "Window of the Inner Path",
    alt: "A small boat faces a warm square spiral inside a blue chamber.",
    category: "works",
    collection: "Thresholds",
    caption: "A solitary traveler approaches the geometry of inner light."
  },
  {
    fileName: "017_55x80.jpg",
    size: "55x80",
    title: "Figure at the Entrance of Light",
    alt: "A small human figure stands before a glowing opening inside dark stone.",
    category: "works",
    collection: "Thresholds",
    caption: "The passage begins before the first step."
  },
  {
    fileName: "018_60x85.jpg",
    size: "60x85",
    title: "Green Density of Life",
    alt: "A dense green botanical and underwater collage fills the picture plane.",
    category: "works",
    collection: "Organic Memory",
    caption: "Life appears as a deep green network without a single center."
  }
];

function artworkPath(fileName: string) {
  return `/works/${fileName}`;
}

function artworkPrintFormat(artwork: ArtworkSeed): PrintFormat {
  const [widthCm = 60, heightCm = 80] = artwork.size.split("x").map((value) => Number(value) || 0);
  const area = widthCm * heightCm;
  const price = Math.max(4200, Math.round(area * 1.25 / 100) * 100);

  return {
    id: artwork.size,
    widthCm,
    heightCm,
    label: artwork.size.replace("x", " × "),
    price
  };
}

function imageField(fileName: string, alt: string) {
  return {
    mediaAssetId: artworkPath(fileName),
    alt
  };
}

function galleryItem(fileName: string, caption: string, alt: string) {
  return {
    mediaAssetId: artworkPath(fileName),
    caption,
    alt
  };
}

export function createSeedMediaLibrary(): MediaLibraryAsset[] {
  return ARTWORKS.map((artwork) => ({
    id: `media-${artwork.fileName.replace(/\.[^.]+$/, "")}`,
    mediaAssetId: artworkPath(artwork.fileName),
    previewUrl: artworkPath(artwork.fileName),
    title: artwork.title,
    alt: artwork.alt,
    category: artwork.category,
    isProduct: true,
    printFormats: [artworkPrintFormat(artwork)]
  }));
}

export function createSeedPages(): SeedPageDefinition[] {
  return [
    {
      id: "page-home",
      slug: "home",
      title: "Home",
      blocks: [
        {
          ...block("hero", 0),
          data: {
            ...createDefaultBlock("hero"),
            eyebrow: "",
            title: "Olga Schmid",
            subtitle:
              "A body of work where fragments become thresholds: ancient figures, icy gardens, spirals of light, and dense organic worlds.",
            buttonText: "Read the artist statement",
            buttonLink: "/about",
            image: imageField("015_60x80.jpg", "Sphinx of Blue Crystal")
          }
        },
        {
          ...block("sectionHeader", 1),
          data: {
            ...createDefaultBlock("sectionHeader"),
            eyebrow: "Artist's method",
            title: "Collage as an archaeology of inner nature.",
            description:
              "The works combine cut paper, mineral textures, botanical memory, water, ice, and mythic bodies. Each image feels discovered rather than invented, as if a private cosmology had surfaced through fragments."
          }
        },
        {
          ...block("imageText", 2),
          data: {
            ...createDefaultBlock("imageText"),
            title: "The image becomes a place of passage.",
            text:
              "These compositions are not illustrations of nature. They are thresholds inside it: a stone opening to light, a figure waking in blue crystal, a small boat moving toward the geometry of consciousness. The surface is tactile and fragmented, yet the emotional movement is precise.",
            caption: "Fire Figure in Blue Water, 60 × 80 cm",
            imagePosition: "left",
            image: imageField("013_60x80.jpg", "Fire Figure in Blue Water")
          }
        },
        {
          ...block("gallery", 3),
          data: {
            ...createDefaultBlock("gallery"),
            title: "Six ways into the work",
            layout: "grid",
            items: [
              galleryItem("001_60x60.jpg", "Crystalline Geometry", "Solar Fracture"),
              galleryItem("008_52x80.jpg", "Blue Silence", "White Flower of Ice"),
              galleryItem("005_60x80.jpg", "Mythic Figures", "Antique Soul of a Mineral"),
              galleryItem("014_60x80.jpg", "Fire and Transformation", "Cave of the First Fire"),
              galleryItem("002_60x60.jpg", "Organic Memory", "Paleontology of a Dream"),
              galleryItem("017_55x80.jpg", "Thresholds", "Figure at the Entrance of Light")
            ]
          }
        },
        {
          ...block("quote", 4),
          data: {
            ...createDefaultBlock("quote"),
            quote:
              "A fragment is never merely broken. In these works it becomes a witness, a mineral, a wing, a gate.",
            author: "Studio note"
          }
        },
        {
          ...block("sectionHeader", 5),
          data: {
            ...createDefaultBlock("sectionHeader"),
            eyebrow: "Selected works",
            title: "A visual archive of cold light and living matter.",
            description:
              "The homepage begins with a focused selection. The full media library is already seeded with all available works and print dimensions."
          }
        },
        {
          ...block("worksGrid", 6),
          data: {
            ...createDefaultBlock("worksGrid"),
            title: "Selected works",
            itemIds: [
              artworkPath("015_60x80.jpg"),
              artworkPath("013_60x80.jpg"),
              artworkPath("003_60x80.jpg"),
              artworkPath("011_60x80.jpg"),
              artworkPath("001_60x60.jpg"),
              artworkPath("018_60x85.jpg")
            ],
            columns: "3",
            layout: "grid"
          }
        },
        {
          ...block("cta", 7),
          data: {
            ...createDefaultBlock("cta"),
            title: "For commissions, acquisitions, and exhibition conversations.",
            text: "The works are available as original pieces and print-format entries can be refined in the editor.",
            buttonText: "Contact the studio",
            buttonLink: "/contact"
          }
        },
        {
          ...block("contact", 8),
          data: {
            ...createDefaultBlock("contact"),
            title: "Studio contact",
            text: "For available works, commissions, exhibitions, and private viewings.",
            email: "studio@example.com",
            phone: "+1 000 000 0000",
            socialLinks: [{ label: "Instagram", href: "https://instagram.com", external: true }]
          }
        }
      ]
    },
    {
      id: "page-about",
      slug: "about",
      title: "About",
      blocks: [
        {
          ...block("sectionHeader", 0),
          data: {
            ...createDefaultBlock("sectionHeader"),
            eyebrow: "About the practice",
            title: "A poetic system of fragments, thresholds, and elemental memory.",
            description:
              "This page is prepared in English first. The site already keeps its language switcher, so the same structure can later be translated into Russian, Armenian, French, Spanish, or Swiss German."
          }
        },
        {
          ...block("richText", 1),
          data: {
            ...createDefaultBlock("richText"),
            title: "Artist statement",
            text:
              "The work moves between collage, symbolic abstraction, and mythic landscape. It treats nature not as scenery, but as a thinking substance: water remembers, stone opens, flowers hide inside ice, and figures return from mineral depth."
          }
        },
        {
          ...block("imageText", 2),
          data: {
            ...createDefaultBlock("imageText"),
            title: "Materials become a language.",
            text:
              "Cut forms, crystalline textures, botanical fragments, and saturated color are arranged as if they were geological layers of feeling. The image is built from pieces, but it asks to be read as one continuous inner landscape.",
            caption: "Paleontology of a Dream, 60 × 60 cm",
            image: imageField("002_60x60.jpg", "Paleontology of a Dream")
          }
        },
        {
          ...block("linksList", 3),
          data: {
            ...createDefaultBlock("linksList"),
            title: "Explore",
            items: [
              { label: "Home", href: "/" },
              { label: "Contact", href: "/contact" }
            ]
          }
        }
      ]
    },
    {
      id: "page-contact",
      slug: "contact",
      title: "Contact",
      blocks: [
        {
          ...block("sectionHeader", 0),
          data: {
            ...createDefaultBlock("sectionHeader"),
            eyebrow: "Contact",
            title: "Speak with the studio.",
            description: "For acquisitions, commissions, exhibitions, publications, and private viewings."
          }
        },
        {
          ...block("contact", 1),
          data: {
            ...createDefaultBlock("contact"),
            title: "Studio contact",
            text: "Write to discuss an artwork, a commission, or a future collaboration.",
            email: "studio@example.com",
            phone: "+1 000 000 0000",
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
