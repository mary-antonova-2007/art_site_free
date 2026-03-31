import { z } from "zod";

import { defineBlock } from "../lib/helpers";

const schema = z.object({
  title: z.string().optional(),
  items: z
    .array(
      z.object({
        mediaAssetId: z.string().optional(),
        caption: z.string().optional(),
        alt: z.string().optional()
      })
    )
    .default([]),
  layout: z.enum(["grid", "masonry", "carousel"]).default("grid")
});

export const galleryBlock = defineBlock({
  type: "gallery",
  version: 1,
  label: "Gallery",
  category: "media",
  schema,
  createDefault: () => ({
    title: "Gallery",
    items: [],
    layout: "grid"
  } satisfies z.infer<typeof schema>),
  fields: [
    { name: "title", label: "Title", kind: "text" },
    { name: "items", label: "Items", kind: "list" },
    {
      name: "layout",
      label: "Layout",
      kind: "select",
      options: [
        { label: "Grid", value: "grid" },
        { label: "Masonry", value: "masonry" },
        { label: "Carousel", value: "carousel" }
      ]
    }
  ]
});
