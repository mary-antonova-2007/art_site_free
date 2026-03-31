import { z } from "zod";

import { defineBlock } from "../lib/helpers";

const socialLinkSchema = z.object({
  label: z.string(),
  href: z.string(),
  external: z.boolean().optional()
});

const schema = z.object({
  title: z.string().default("Contact"),
  text: z.string().default("For commissions, exhibitions, and studio visits."),
  email: z.string().default("studio@example.com"),
  phone: z.string().default("+1 000 000 0000"),
  socialLinks: z
    .array(socialLinkSchema)
    .default([{ label: "Instagram", href: "https://instagram.com", external: true }])
});

export const contactBlock = defineBlock({
  type: "contact",
  version: 1,
  label: "Contact",
  category: "contact",
  schema,
  createDefault: () => ({
    title: "Contact",
    text: "For commissions, exhibitions, and studio visits.",
    email: "studio@example.com",
    phone: "+1 000 000 0000",
    socialLinks: [{ label: "Instagram", href: "https://instagram.com", external: true }]
  } satisfies z.infer<typeof schema>),
  fields: [
    { name: "title", label: "Title", kind: "text" },
    { name: "text", label: "Text", kind: "textarea" },
    { name: "email", label: "Email", kind: "text" },
    { name: "phone", label: "Phone", kind: "text" },
    { name: "socialLinks", label: "Social links", kind: "list" }
  ]
});
