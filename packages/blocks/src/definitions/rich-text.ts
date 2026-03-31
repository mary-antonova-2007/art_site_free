import { z } from "zod";

import { defineBlock } from "../lib/helpers";

const schema = z.object({
  title: z.string().default("A living page, not a dashboard."),
  text: z
    .string()
    .default(
      "The editor changes words, rhythm, alignment, and imagery within designed templates, keeping the site coherent while remaining easy to update."
    ),
  align: z.enum(["left", "center", "right"]).default("left"),
  width: z.enum(["content", "wide"]).default("content")
});

export const richTextBlock = defineBlock({
  type: "richText",
  version: 1,
  label: "Rich Text",
  category: "text",
  schema,
  createDefault: () => ({
    title: "A living page, not a dashboard.",
    text:
      "The editor changes words, rhythm, alignment, and imagery within designed templates, keeping the site coherent while remaining easy to update.",
    align: "left",
    width: "content"
  } satisfies z.infer<typeof schema>),
  fields: [
    { name: "title", label: "Title", kind: "text" },
    { name: "text", label: "Text", kind: "richtext" },
    {
      name: "align",
      label: "Align",
      kind: "select",
      options: [
        { label: "Left", value: "left" },
        { label: "Center", value: "center" },
        { label: "Right", value: "right" }
      ]
    },
    {
      name: "width",
      label: "Width",
      kind: "select",
      options: [
        { label: "Content", value: "content" },
        { label: "Wide", value: "wide" }
      ]
    }
  ]
});
