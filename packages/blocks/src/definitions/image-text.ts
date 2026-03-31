import { z } from "zod";

import { defineBlock } from "../lib/helpers";

const imageSchema = z.object({
  mediaAssetId: z.string().optional(),
  alt: z.string().optional(),
  caption: z.string().optional()
});

const schema = z.object({
  title: z.string().default("Built for pages that stay composed."),
  text: z
    .string()
    .default("Templates keep balance and proportion in place while the editor changes the narrative."),
  image: imageSchema.optional(),
  imagePosition: z.enum(["left", "right"]).default("right"),
  caption: z.string().default("Portrait, 2026")
});

export const imageTextBlock = defineBlock({
  type: "imageText",
  version: 1,
  label: "Image + Text",
  category: "media",
  schema,
  createDefault: () => ({
    title: "Built for pages that stay composed.",
    text: "Templates keep balance and proportion in place while the editor changes the narrative.",
    imagePosition: "right",
    caption: "Portrait, 2026"
  } satisfies z.infer<typeof schema>),
  fields: [
    { name: "title", label: "Title", kind: "text" },
    { name: "text", label: "Text", kind: "richtext" },
    { name: "image", label: "Image", kind: "image" },
    {
      name: "imagePosition",
      label: "Image position",
      kind: "select",
      options: [
        { label: "Left", value: "left" },
        { label: "Right", value: "right" }
      ]
    },
    { name: "caption", label: "Caption", kind: "text" }
  ]
});
