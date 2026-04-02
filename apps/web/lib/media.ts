export const IMAGE_VARIANT_SPECS = {
  thumb: { width: 480, quality: 68 },
  card: { width: 960, quality: 74 },
  panel: { width: 1440, quality: 80 },
  hero: { width: 1920, quality: 84 }
} as const;

export type MediaVariantName = keyof typeof IMAGE_VARIANT_SPECS;

export type MediaVariant = {
  url: string;
  width: number;
  height: number;
  format: "webp";
};

export type MediaVariants = Partial<Record<MediaVariantName, MediaVariant>>;

export type ResponsiveImageSource = {
  src: string;
  srcSet?: string;
  sizes?: string;
};

const VARIANT_SUFFIX_PATTERN = /--(thumb|card|panel|hero)$/;

export function isRasterImageMimeType(mimeType: string) {
  return ["image/jpeg", "image/png", "image/webp", "image/avif"].includes(mimeType.toLowerCase());
}

export function isRasterImageUrl(url: string) {
  const normalized = url.split("?")[0]?.toLowerCase() ?? "";
  return [".jpg", ".jpeg", ".png", ".webp", ".avif"].some((extension) => normalized.endsWith(extension));
}

export function buildVariantFileName(fileName: string, variant: MediaVariantName) {
  const extensionIndex = fileName.lastIndexOf(".");
  const baseName = extensionIndex >= 0 ? fileName.slice(0, extensionIndex) : fileName;
  const normalizedBaseName = baseName.replace(VARIANT_SUFFIX_PATTERN, "");
  return `${normalizedBaseName}--${variant}.webp`;
}

export function buildVariantUrl(sourceUrl: string, variant: MediaVariantName) {
  if (!sourceUrl) {
    return sourceUrl;
  }

  const isAbsolute = /^https?:\/\//i.test(sourceUrl);
  const target = isAbsolute ? new URL(sourceUrl) : new URL(sourceUrl, "https://media.local");
  const pathParts = target.pathname.split("/");
  const fileName = pathParts[pathParts.length - 1];

  if (!fileName) {
    return sourceUrl;
  }

  pathParts[pathParts.length - 1] = buildVariantFileName(fileName, variant);
  target.pathname = pathParts.join("/");

  if (isAbsolute) {
    return target.toString();
  }

  return `${target.pathname}${target.search}${target.hash}`;
}

function getLargestVariant(variants?: MediaVariants) {
  return Object.values(variants ?? {}).sort((left, right) => right.width - left.width)[0];
}

export function getPreferredImageUrl(
  sourceUrl: string,
  variants: MediaVariants | undefined,
  preferredVariant: MediaVariantName
) {
  return variants?.[preferredVariant]?.url ?? getLargestVariant(variants)?.url ?? sourceUrl;
}

export function buildResponsiveImageSource(
  sourceUrl: string,
  variants: MediaVariants | undefined,
  preferredVariant: MediaVariantName,
  sizes?: string
): ResponsiveImageSource {
  const orderedVariants = Object.values(variants ?? {}).sort((left, right) => left.width - right.width);

  if (!orderedVariants.length) {
    return { src: sourceUrl, sizes };
  }

  return {
    src: getPreferredImageUrl(sourceUrl, variants, preferredVariant),
    srcSet: orderedVariants.map((variant) => `${variant.url} ${variant.width}w`).join(", "),
    sizes
  };
}
