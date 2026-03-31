import type { BlockType } from "@artsite/blocks";

import type { Messages } from "./shared";

export function getBlockLabel(messages: Messages, type: BlockType, fallback: string) {
  return messages.blockLabels[type] ?? fallback;
}

export function getFieldLabel(messages: Messages, fieldName: string, fallback: string) {
  const key = fieldName as keyof Messages["fieldLabels"];
  return messages.fieldLabels[key] ?? fallback;
}

export function getFieldOptionLabel(messages: Messages, value: string, fallback: string) {
  const key = value as keyof Messages["fieldOptions"];
  return messages.fieldOptions[key] ?? fallback;
}
