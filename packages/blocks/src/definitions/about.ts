import { z } from "zod";

import { defineBlock } from "../lib/helpers";

const imageSchema = z.object({
  mediaAssetId: z.string().optional(),
  alt: z.string().optional(),
  caption: z.string().optional()
});

const linkSchema = z.object({
  label: z.string(),
  href: z.string(),
  external: z.boolean().optional()
});

const schema = z.object({
  title: z.string().default("About"),
  text: z.string().default("A short editorial biography or artist statement."),
  image: imageSchema.optional(),
  links: z.array(linkSchema).default([])
});

export const aboutBlock = defineBlock({
  type: "about",
  version: 1,
  label: "About",
  category: "intro",
  schema,
  createDefault: () => ({
    title: "About",
    text: "A short editorial biography or artist statement.",
    links: []
  } satisfies z.infer<typeof schema>),
  fields: [
    { name: "title", label: "Title", kind: "text" },
    { name: "text", label: "Text", kind: "textarea" },
    { name: "image", label: "Image", kind: "image" },
    { name: "links", label: "Links", kind: "list" }
  ]
});
