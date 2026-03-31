import { z } from "zod";

import { defineBlock } from "../lib/helpers";

const schema = z.object({
  title: z.string().default("Start a conversation."),
  text: z.string().default("Invite the visitor toward a focused next step."),
  buttonText: z.string().default("Contact"),
  buttonLink: z.string().default("/contact")
});

export const ctaBlock = defineBlock({
  type: "cta",
  version: 1,
  label: "CTA",
  category: "utility",
  schema,
  createDefault: () => ({
    title: "Start a conversation.",
    text: "Invite the visitor toward a focused next step.",
    buttonText: "Contact",
    buttonLink: "/contact"
  } satisfies z.infer<typeof schema>),
  fields: [
    { name: "title", label: "Title", kind: "text" },
    { name: "text", label: "Text", kind: "textarea" },
    { name: "buttonText", label: "Button text", kind: "text" },
    { name: "buttonLink", label: "Button link", kind: "link" }
  ]
});
