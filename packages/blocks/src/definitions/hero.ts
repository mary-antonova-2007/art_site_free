import { z } from "zod";

import { defineBlock } from "../lib/helpers";

const imageSchema = z.object({
  mediaAssetId: z.string().optional(),
  alt: z.string().optional(),
  caption: z.string().optional()
});

const schema = z.object({
  eyebrow: z.string().default("Editorial art website"),
  title: z.string().default("A quiet system for bold visual stories."),
  subtitle: z
    .string()
    .default("Publish pages directly on the live site without the weight of a traditional admin."),
  image: imageSchema.optional(),
  buttonText: z.string().default("Enter the archive"),
  buttonLink: z.string().default("/about")
});

export const heroBlock = defineBlock({
  type: "hero",
  version: 1,
  label: "Hero",
  category: "intro",
  schema,
  createDefault: () => ({
    eyebrow: "Editorial art website",
    title: "A quiet system for bold visual stories.",
    subtitle:
      "Publish pages directly on the live site without the weight of a traditional admin.",
    buttonText: "Enter the archive",
    buttonLink: "/about"
  } satisfies z.infer<typeof schema>),
  fields: [
    { name: "eyebrow", label: "Eyebrow", kind: "text" },
    { name: "title", label: "Title", kind: "textarea" },
    { name: "subtitle", label: "Subtitle", kind: "textarea" },
    { name: "image", label: "Image", kind: "image" },
    { name: "buttonText", label: "Button text", kind: "text" },
    { name: "buttonLink", label: "Button link", kind: "link" }
  ]
});
