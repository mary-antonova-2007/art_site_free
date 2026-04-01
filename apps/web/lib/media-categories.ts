import type { MediaCategory } from "@/lib/content";

const builtInCategoryKeys = new Set([
  "featured",
  "works",
  "portraits",
  "details",
  "spaces",
  "uploaded",
  "all"
]);

export function getMediaCategoryLabel(
  category: MediaCategory | "all",
  translate: (key: unknown) => string
) {
  if (builtInCategoryKeys.has(category)) {
    return translate(`media.categories.${category}`);
  }

  return humanizeCategory(category);
}

export function normalizeMediaCategoryName(value: string) {
  return value.trim().replace(/\s+/g, " ");
}

function humanizeCategory(value: string) {
  return value
    .trim()
    .split(/[-_\s]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}
