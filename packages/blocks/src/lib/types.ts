import type { ZodType } from "zod";

export type EditorFieldKind =
  | "text"
  | "textarea"
  | "richtext"
  | "select"
  | "image"
  | "link"
  | "list"
  | "reference";

export type EditorFieldConfig = {
  name: string;
  label: string;
  kind: EditorFieldKind;
  options?: Array<{ label: string; value: string }>;
};

export type BlockDefinition<TType extends string, TData> = {
  type: TType;
  version: number;
  label: string;
  category: "intro" | "text" | "media" | "collection" | "utility" | "contact" | "referential";
  schema: ZodType<TData>;
  createDefault: () => TData;
  fields: EditorFieldConfig[];
};

export type MediaField = {
  mediaAssetId?: string;
  alt?: string;
  caption?: string;
  focalX?: number;
  focalY?: number;
};

export type ReferenceField = {
  id: string;
  label?: string;
};
