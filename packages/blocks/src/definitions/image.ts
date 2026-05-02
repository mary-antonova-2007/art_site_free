import { z } from "zod";

import { defineBlock } from "../lib/helpers";

const imageSchema = z.object({
  mediaAssetId: z.string().optional(),
  alt: z.string().optional(),
  caption: z.string().optional(),
  variants: z.record(z.string(), z.unknown()).optional()
});

const printFormatSchema = z.object({
  id: z.string().optional(),
  widthCm: z.coerce.number().positive().max(500),
  heightCm: z.coerce.number().positive().max(500),
  label: z.string().optional()
});

const schema = z.object({
  image: imageSchema.optional(),
  caption: z.string().optional(),
  alt: z.string().optional(),
  displayMode: z.enum(["fit", "cover", "original"]).default("cover"),
  printFormats: z.array(printFormatSchema).default([])
});

export const imageBlock = defineBlock({
  type: "image",
  version: 1,
  label: "Image",
  category: "media",
  schema,
  createDefault: () => ({
    caption: "Caption",
    displayMode: "cover",
    printFormats: []
  } satisfies z.infer<typeof schema>),
  fields: [
    { name: "image", label: "Image", kind: "image" },
    { name: "caption", label: "Caption", kind: "text" },
    { name: "alt", label: "Alt text", kind: "text" },
    {
      name: "displayMode",
      label: "Display mode",
      kind: "select",
      options: [
        { label: "Fit", value: "fit" },
        { label: "Cover", value: "cover" },
        { label: "Original", value: "original" }
      ]
    }
  ]
});
