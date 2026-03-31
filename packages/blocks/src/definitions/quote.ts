import { z } from "zod";

import { defineBlock } from "../lib/helpers";

const schema = z.object({
  quote: z.string().default("The frame is not the work, but it teaches the eye how to arrive."),
  author: z.string().default("Studio note")
});

export const quoteBlock = defineBlock({
  type: "quote",
  version: 1,
  label: "Quote",
  category: "text",
  schema,
  createDefault: () => ({
    quote: "The frame is not the work, but it teaches the eye how to arrive.",
    author: "Studio note"
  } satisfies z.infer<typeof schema>),
  fields: [
    { name: "quote", label: "Quote", kind: "textarea" },
    { name: "author", label: "Author", kind: "text" }
  ]
});
