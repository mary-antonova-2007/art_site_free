import { z } from "zod";

import { defineBlock } from "../lib/helpers";

const schema = z.object({
  title: z.string().optional(),
  sourceMode: z.enum(["manual", "query"]).default("manual"),
  itemIds: z.array(z.string()).default([]),
  query: z
    .object({
      collection: z.enum(["all", "featured", "latest"]).default("all"),
      limit: z.number().int().positive().max(24).default(6)
    })
    .default({
      collection: "all",
      limit: 6
    }),
  columns: z.enum(["2", "3", "4"]).default("3"),
  layout: z.enum(["grid", "carousel"]).default("grid")
});

export const seriesGridBlock = defineBlock({
  type: "seriesGrid",
  version: 1,
  label: "Series Grid",
  category: "referential",
  schema,
  createDefault: () => ({
    title: "Series",
    sourceMode: "manual",
    itemIds: [],
    query: {
      collection: "all",
      limit: 6
    },
    columns: "3",
    layout: "grid"
  } satisfies z.infer<typeof schema>),
  fields: [
    { name: "title", label: "Title", kind: "text" },
    {
      name: "sourceMode",
      label: "Source",
      kind: "select",
      options: [
        { label: "Manual", value: "manual" },
        { label: "Query", value: "query" }
      ]
    },
    { name: "itemIds", label: "Series", kind: "reference" },
    {
      name: "columns",
      label: "Columns",
      kind: "select",
      options: [
        { label: "2", value: "2" },
        { label: "3", value: "3" },
        { label: "4", value: "4" }
      ]
    },
    {
      name: "layout",
      label: "Layout",
      kind: "select",
      options: [
        { label: "Grid", value: "grid" },
        { label: "Carousel", value: "carousel" }
      ]
    }
  ]
});
