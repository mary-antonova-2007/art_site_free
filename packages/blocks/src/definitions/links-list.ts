import { z } from "zod";

import { defineBlock } from "../lib/helpers";

const schema = z.object({
  title: z.string().default("Links"),
  items: z
    .array(
      z.object({
        label: z.string(),
        href: z.string(),
        external: z.boolean().optional()
      })
    )
    .default([
      { label: "Visit archive", href: "/archive" },
      { label: "Read journal", href: "/journal" }
    ])
});

export const linksListBlock = defineBlock({
  type: "linksList",
  version: 1,
  label: "Links List",
  category: "utility",
  schema,
  createDefault: () => ({
    title: "Links",
    items: [
      { label: "Visit archive", href: "/archive" },
      { label: "Read journal", href: "/journal" }
    ]
  } satisfies z.infer<typeof schema>),
  fields: [
    { name: "title", label: "Title", kind: "text" },
    { name: "items", label: "Items", kind: "list" }
  ]
});
