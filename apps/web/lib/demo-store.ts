import "server-only";

import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

import {
  createDemoMediaAsset,
  createDemoPage,
  getDemoPageBySlug,
  getDemoSnapshot,
  hydrateDemoSnapshot,
  listDemoMediaLibrary,
  listDemoPages,
  publishDemoPage,
  saveDemoPage,
  type MediaCategory,
  type SiteBlockRecord
} from "./content";

const DEMO_STORE_PATH = process.env.DEMO_STORE_PATH ?? path.join(process.cwd(), "data", "demo-store.json");

async function ensureLoaded() {
  try {
    const raw = await readFile(DEMO_STORE_PATH, "utf8");
    hydrateDemoSnapshot(JSON.parse(raw) as Parameters<typeof hydrateDemoSnapshot>[0]);
  } catch {
    await persist();
  }
}

async function persist() {
  await mkdir(path.dirname(DEMO_STORE_PATH), { recursive: true });
  await writeFile(DEMO_STORE_PATH, JSON.stringify(getDemoSnapshot(), null, 2), "utf8");
}

export async function getStoredDemoPageBySlug(slug: string) {
  await ensureLoaded();
  return getDemoPageBySlug(slug);
}

export async function listStoredDemoPages() {
  await ensureLoaded();
  return listDemoPages();
}

export async function saveStoredDemoPage(input: {
  pageId: string;
  title: string;
  blocks: SiteBlockRecord[];
}) {
  await ensureLoaded();
  const page = saveDemoPage(input);
  await persist();
  return page;
}

export async function createStoredDemoPage(input: { title: string; slug: string }) {
  await ensureLoaded();
  const page = createDemoPage(input);
  await persist();
  return page;
}

export async function publishStoredDemoPage(pageId: string) {
  await ensureLoaded();
  const page = publishDemoPage(pageId);
  await persist();
  return page;
}

export async function listStoredDemoMediaLibrary() {
  await ensureLoaded();
  return listDemoMediaLibrary();
}

export async function createStoredDemoMediaAsset(input: {
  fileName: string;
  category?: MediaCategory;
  previewUrl?: string;
}) {
  await ensureLoaded();
  const asset = createDemoMediaAsset(input);
  await persist();
  return asset;
}
