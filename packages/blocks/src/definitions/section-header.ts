import { z } from "zod";

import { defineBlock } from "../lib/helpers";

const schema = z.object({
  eyebrow: z.string().default("Series"),
  title: z.string().default("A measured set of recurring gestures."),
  description: z.string().default("Use section headers to anchor a transition between visual chapters.")
});

export const sectionHeaderBlock = defineBlock({
  type: "sectionHeader",
  version: 1,
  label: "Section Header",
  category: "intro",
  schema,
  createDefault: () => ({
    eyebrow: "Series",
    title: "A measured set of recurring gestures.",
    description: "Use section headers to anchor a transition between visual chapters."
  } satisfies z.infer<typeof schema>),
  fields: [
    { name: "eyebrow", label: "Eyebrow", kind: "text" },
    { name: "title", label: "Title", kind: "text" },
    { name: "description", label: "Description", kind: "textarea" }
  ]
});
