import { z } from "zod";

import { defineBlock } from "../lib/helpers";

const schema = z.object({
  style: z.enum(["line", "space", "ornament"]).default("line"),
  spacing: z.enum(["compact", "normal", "loose"]).default("normal")
});

export const dividerBlock = defineBlock({
  type: "divider",
  version: 1,
  label: "Divider",
  category: "utility",
  schema,
  createDefault: () => ({
    style: "line",
    spacing: "normal"
  } satisfies z.infer<typeof schema>),
  fields: [
    {
      name: "style",
      label: "Style",
      kind: "select",
      options: [
        { label: "Line", value: "line" },
        { label: "Space", value: "space" },
        { label: "Ornament", value: "ornament" }
      ]
    },
    {
      name: "spacing",
      label: "Spacing",
      kind: "select",
      options: [
        { label: "Compact", value: "compact" },
        { label: "Normal", value: "normal" },
        { label: "Loose", value: "loose" }
      ]
    }
  ]
});
