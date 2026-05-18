import "server-only";

import path from "node:path";

export const MAX_UPLOAD_SIZE_BYTES = 25 * 1024 * 1024;

export const ALLOWED_RASTER_MIME_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/avif"
] as const;

const EXTENSION_BY_MIME: Record<string, string[]> = {
  "image/jpeg": [".jpg", ".jpeg"],
  "image/png": [".png"],
  "image/webp": [".webp"],
  "image/avif": [".avif"]
};

export function isAllowedRasterMimeType(mimeType: string) {
  return ALLOWED_RASTER_MIME_TYPES.includes(mimeType.toLowerCase() as (typeof ALLOWED_RASTER_MIME_TYPES)[number]);
}

export function getSafeMediaMimeType(fileName: string) {
  const normalized = fileName.toLowerCase();
  if (normalized.endsWith(".png")) return "image/png";
  if (normalized.endsWith(".jpg") || normalized.endsWith(".jpeg")) return "image/jpeg";
  if (normalized.endsWith(".webp")) return "image/webp";
  if (normalized.endsWith(".avif")) return "image/avif";
  return null;
}

export function assertUploadLooksSafe(input: {
  fileName: string;
  fileType: string;
  sizeBytes: number;
}) {
  const fileType = input.fileType.toLowerCase();

  if (!isAllowedRasterMimeType(fileType)) {
    throw new Error("Only JPEG, PNG, WebP, and AVIF uploads are allowed.");
  }

  if (input.sizeBytes <= 0 || input.sizeBytes > MAX_UPLOAD_SIZE_BYTES) {
    throw new Error("Upload must be between 1 byte and 25 MB.");
  }

  const extension = path.extname(input.fileName).toLowerCase();
  if (!EXTENSION_BY_MIME[fileType]?.includes(extension)) {
    throw new Error("File extension does not match the uploaded image type.");
  }
}

export function resolveSafeLocalMediaPath(rootDir: string, pathSegments: string[]) {
  if (!pathSegments.length || pathSegments.some((segment) => !segment || segment === "." || segment === ".." || path.isAbsolute(segment))) {
    throw new Error("Invalid media path.");
  }

  const root = path.resolve(rootDir);
  const target = path.resolve(root, ...pathSegments);
  const relative = path.relative(root, target);

  if (relative.startsWith("..") || path.isAbsolute(relative)) {
    throw new Error("Invalid media path.");
  }

  return target;
}

export async function validateRasterImageBuffer(fileBuffer: Buffer, fileType: string) {
  if (!isAllowedRasterMimeType(fileType)) {
    throw new Error("Only JPEG, PNG, WebP, and AVIF uploads are allowed.");
  }

  const sharp = await import("sharp").then((module) => module.default);
  const metadata = await sharp(fileBuffer).metadata();

  if (!metadata.width || !metadata.height || !metadata.format) {
    throw new Error("Uploaded file is not a readable raster image.");
  }

  return metadata;
}
