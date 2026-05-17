import "server-only";

import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

import { createDefaultBlock, validateBlock, type BlockType } from "@artsite/blocks";
import { createDb, hasDatabaseUrl, mediaAssets, orders, pageBlocks, pageRevisions, pages, siteSettings } from "@artsite/db";
import { and, asc, desc, eq, sql } from "drizzle-orm";

import {
  DEFAULT_SITE_COMMERCE_SETTINGS,
  DEFAULT_MEDIA_CATEGORIES,
  createSeedMediaLibrary,
  createSeedPages,
  sanitizeSlug,
  toReadableMediaTitle,
  type MediaCategory,
  type MediaLibraryAsset,
  type SiteBlockRecord,
  type SitePageRecord,
  type SiteCommerceSettings
} from "./content";
import {
  IMAGE_VARIANT_SPECS,
  buildVariantFileName,
  buildVariantUrl,
  isRasterImageMimeType,
  type MediaVariant,
  type MediaVariantName,
  type MediaVariants
} from "./media";
import { canUseEditor, getEditorIdentity } from "./auth";
import { normalizeMediaCategoryName } from "./media-categories";
import { createAdminSupabaseClient, hasSupabaseEnv } from "./supabase/admin";

const PUBLIC_BUCKET = process.env.SUPABASE_PUBLIC_BUCKET ?? "site-public";
const DATA_DIR = process.env.DATA_DIR ?? path.join(process.cwd(), "data");
const LOCAL_UPLOADS_DIR = process.env.LOCAL_UPLOADS_DIR ?? path.join(DATA_DIR, "uploads");

type RawPageRow = {
  id: string;
  slug: string;
  title: string;
  published_revision_id: string | null;
  current_draft_revision_id: string | null;
};

type RawBlockRow = {
  id: string;
  block_type: BlockType;
  position: number;
  is_hidden: boolean;
  data: unknown;
};

type GeneratedImageVariant = {
  name: MediaVariantName;
  fileName: string;
  mimeType: "image/webp";
  data: Buffer;
  descriptor: MediaVariant;
};

async function generateImageVariants(
  fileBuffer: Buffer,
  fileName: string,
  fileType: string,
  sourceUrl: string
): Promise<{ width?: number; height?: number; variants: MediaVariants; files: GeneratedImageVariant[] }> {
  if (!isRasterImageMimeType(fileType)) {
    return { variants: {}, files: [] };
  }

  const sharp = await import("sharp")
    .then((module) => module.default)
    .catch(() => null);

  if (!sharp) {
    return { variants: {}, files: [] };
  }
  const metadata = await sharp(fileBuffer).metadata();
  const originalWidth = metadata.width;
  const originalHeight = metadata.height;

  if (!originalWidth || !originalHeight) {
    return { variants: {}, files: [] };
  }

  const variants = await Promise.all(
    Object.entries(IMAGE_VARIANT_SPECS).map(async ([name, spec]) => {
      const pipeline = sharp(fileBuffer)
        .rotate()
        .resize({
          width: spec.width,
          withoutEnlargement: true,
          fit: "inside"
        })
        .webp({ quality: spec.quality });

      const output = await pipeline.toBuffer({ resolveWithObject: true });

      if (!output.info.width || output.info.width >= originalWidth || output.info.width < 160) {
        return null;
      }

      return {
        name: name as MediaVariantName,
        fileName: buildVariantFileName(fileName, name as MediaVariantName),
        mimeType: "image/webp" as const,
        data: output.data,
        descriptor: {
          url: buildVariantUrl(sourceUrl, name as MediaVariantName),
          width: output.info.width,
          height: output.info.height,
          format: "webp"
        }
      } satisfies GeneratedImageVariant;
    })
  );

  const generatedFiles = variants.filter((variant): variant is GeneratedImageVariant => Boolean(variant));

  return {
    width: originalWidth,
    height: originalHeight,
    variants: Object.fromEntries(
      generatedFiles.map((variant) => [variant.name, variant.descriptor])
    ) satisfies MediaVariants,
    files: generatedFiles
  };
}

export async function getPageForRequest(slug: string, editorRequested: boolean) {
  const editorEnabled = await canUseEditor(editorRequested);

  if (hasSupabaseEnv()) {
    const page = await getSupabasePageBySlug(slug, editorEnabled);
    return { page, editorEnabled };
  }

  if (!hasDatabaseUrl()) {
    throw new Error("DATABASE_URL is not configured. Run the Docker dev stack or configure a database.");
  }

  await ensureLocalDatabaseReady();
  const normalizedSlug = slug === "/" ? "home" : slug;
  const page = await getLocalPageBySlug(normalizedSlug, editorEnabled);
  return { page, editorEnabled };
}

export async function listEditorPages(): Promise<Array<{ id: string; slug: string; title: string }>> {
  const editor = await getEditorIdentity();

  if (!editor) {
    throw new Error("Unauthorized");
  }

  if (hasSupabaseEnv()) {
    const admin = createAdminSupabaseClient();
    return await getSupabasePageList(admin);
  }

  await ensureLocalDatabaseReady();
  return await getLocalPageList();
}

export async function savePageDraft(input: {
  pageId: string;
  title: string;
  blocks: SiteBlockRecord[];
}) {
  const editor = await getEditorIdentity();

  if (!editor) {
    throw new Error("Unauthorized");
  }

  if (hasSupabaseEnv()) {
    return await saveSupabasePageDraft(input);
  }

  await ensureLocalDatabaseReady();
  return await saveLocalPageDraft(input);
}

export async function publishPageChanges(input: {
  pageId: string;
  title: string;
  blocks: SiteBlockRecord[];
}) {
  const editor = await getEditorIdentity();

  if (!editor) {
    throw new Error("Unauthorized");
  }

  if (hasSupabaseEnv()) {
    return await publishSupabasePageChanges(input);
  }

  await ensureLocalDatabaseReady();
  return await publishLocalPageChanges(input);
}

export async function createPageRecord(input: { title: string; slug: string }) {
  const editor = await getEditorIdentity();

  if (!editor) {
    throw new Error("Unauthorized");
  }

  if (hasSupabaseEnv()) {
    return await createSupabasePageRecord(input);
  }

  await ensureLocalDatabaseReady();
  return await createLocalPageRecord(input);
}

export async function renamePageRecord(input: { pageId: string; title: string }) {
  const editor = await getEditorIdentity();

  if (!editor) {
    throw new Error("Unauthorized");
  }

  if (hasSupabaseEnv()) {
    return await renameSupabasePageRecord(input);
  }

  await ensureLocalDatabaseReady();
  return await renameLocalPageRecord(input);
}

export async function deletePageRecord(input: { pageId: string }) {
  const editor = await getEditorIdentity();

  if (!editor) {
    throw new Error("Unauthorized");
  }

  if (hasSupabaseEnv()) {
    return await deleteSupabasePageRecord(input);
  }

  await ensureLocalDatabaseReady();
  return await deleteLocalPageRecord(input);
}

export async function reorderPageRecords(input: { pageIds: string[] }) {
  const editor = await getEditorIdentity();

  if (!editor) {
    throw new Error("Unauthorized");
  }

  if (hasSupabaseEnv()) {
    return await reorderSupabasePageRecords(input);
  }

  await ensureLocalDatabaseReady();
  return await reorderLocalPageRecords(input);
}

export async function uploadEditorImage(input: {
  pageId: string;
  fileName: string;
  fileType: string;
  data: ArrayBuffer;
  category?: MediaCategory;
}) {
  const editor = await getEditorIdentity();

  if (!editor) {
    throw new Error("Unauthorized");
  }

  if (hasSupabaseEnv()) {
    return await uploadSupabaseEditorImage(input);
  }

  await ensureLocalDatabaseReady();
  return await uploadLocalEditorImage(input);
}

export async function listEditorMediaLibrary(): Promise<MediaLibraryAsset[]> {
  const editor = await getEditorIdentity();

  if (!editor) {
    throw new Error("Unauthorized");
  }

  if (hasSupabaseEnv()) {
    return await listSupabaseMediaLibrary();
  }

  await ensureLocalDatabaseReady();
  return await listLocalMediaLibrary();
}

export async function listPublicMediaLibrary(): Promise<MediaLibraryAsset[]> {
  if (hasSupabaseEnv()) {
    return await listSupabaseMediaLibrary();
  }

  await ensureLocalDatabaseReady();
  return await listLocalMediaLibrary();
}

export async function listEditorMediaCategories(): Promise<MediaCategory[]> {
  const editor = await getEditorIdentity();

  if (!editor) {
    throw new Error("Unauthorized");
  }

  if (hasSupabaseEnv()) {
    const assets = await listSupabaseMediaLibrary();
    return uniqueMediaCategories([...DEFAULT_MEDIA_CATEGORIES, ...assets.map((asset) => asset.category)]);
  }

  await ensureLocalDatabaseReady();
  return await listLocalMediaCategories();
}

export async function getCommerceSettings(): Promise<SiteCommerceSettings> {
  if (hasSupabaseEnv()) {
    const admin = createAdminSupabaseClient();
    const { data } = await admin.from("site_settings").select("metadata").limit(1).maybeSingle();
    const normalized = normalizeCommerceSettings(data?.metadata ?? null);

    return {
      ...normalized,
      printFormats: mergePrintFormats(await listSupabaseMediaPrintFormats(admin), normalized.printFormats)
    };
  }

  await ensureLocalDatabaseReady();
  const db = createDb();
  const settings = await db.query.siteSettings.findFirst();
  const normalized = normalizeCommerceSettings(settings?.metadata ?? null);
  return {
    ...normalized,
    printFormats: mergePrintFormats(await listLocalMediaPrintFormats(db), normalized.printFormats)
  };
}

export async function saveCommerceSettings(input: SiteCommerceSettings) {
  const normalized = normalizeCommerceSettings(input);

  if (hasSupabaseEnv()) {
    const admin = createAdminSupabaseClient();
    const { data: settings } = await admin.from("site_settings").select("id, metadata").limit(1).maybeSingle();
    if (!settings) {
      throw new Error("Site settings not found.");
    }

    await admin
      .from("site_settings")
      .update({
        metadata: {
          ...(settings.metadata ?? {}),
          ...normalized
        },
        updated_at: new Date().toISOString()
      })
      .eq("id", settings.id);

    return normalized;
  }

  await ensureLocalDatabaseReady();
  const db = createDb();
  const settings = await db.query.siteSettings.findFirst();
  if (!settings) {
    throw new Error("Site settings not found.");
  }

  await db
    .update(siteSettings)
    .set({
      metadata: {
        ...(settings.metadata ?? {}),
        ...normalized
      },
      updatedAt: new Date()
    })
    .where(eq(siteSettings.id, settings.id));

  return normalized;
}

export type StoredOrderInput = {
  orderNumber: string;
  paymentProvider: string;
  paymentId?: string | null;
  status?: "pending" | "paid" | "failed" | "cancelled";
  currency: string;
  amount: number;
  customer: Record<string, unknown>;
  items: Array<Record<string, unknown>>;
  metadata?: Record<string, unknown>;
};

export type StoredOrder = StoredOrderInput & {
  id: string;
  paymentId: string | null;
  status: "pending" | "paid" | "failed" | "cancelled";
  paidAt?: Date | null;
  notifiedAt?: Date | null;
};

export async function createPendingOrder(input: StoredOrderInput): Promise<StoredOrder> {
  await ensureLocalDatabaseReady();
  const db = createDb();
  const [row] = await db
    .insert(orders)
    .values({
      orderNumber: input.orderNumber,
      paymentProvider: input.paymentProvider,
      paymentId: input.paymentId ?? null,
      status: input.status ?? "pending",
      currency: input.currency,
      amount: Math.max(0, Math.round(input.amount)),
      customer: input.customer,
      items: input.items,
      metadata: input.metadata ?? {}
    })
    .returning();

  return mapOrderRow(row);
}

export async function attachOrderPaymentId(orderNumber: string, paymentId: string): Promise<void> {
  await ensureLocalDatabaseReady();
  const db = createDb();
  await db
    .update(orders)
    .set({ paymentId, updatedAt: new Date() })
    .where(eq(orders.orderNumber, orderNumber));
}

export async function findOrderByPaymentId(paymentId: string): Promise<StoredOrder | null> {
  await ensureLocalDatabaseReady();
  const db = createDb();
  const row = await db.query.orders.findFirst({ where: eq(orders.paymentId, paymentId) });
  return row ? mapOrderRow(row) : null;
}

export async function markOrderPaid(paymentId: string): Promise<StoredOrder | null> {
  await ensureLocalDatabaseReady();
  const db = createDb();
  const [row] = await db
    .update(orders)
    .set({ status: "paid", paidAt: new Date(), updatedAt: new Date() })
    .where(eq(orders.paymentId, paymentId))
    .returning();

  return row ? mapOrderRow(row) : null;
}

export async function markOrderNotified(orderId: string): Promise<void> {
  await ensureLocalDatabaseReady();
  const db = createDb();
  await db
    .update(orders)
    .set({ notifiedAt: new Date(), updatedAt: new Date() })
    .where(eq(orders.id, orderId));
}

export async function updateEditorMediaAssetCommerceSettings(input: {
  mediaAssetId: string;
  isProduct: boolean;
  printFormats: Array<{ id: string; widthCm: number; heightCm: number; label?: string; price?: number; priceOverride?: number }>;
}) {
  const normalizedFormats = normalizePrintFormats(input.printFormats);

  if (hasSupabaseEnv()) {
    const admin = createAdminSupabaseClient();
    const { error } = await admin
      .from("media_assets")
      .update({
        is_product: input.isProduct,
        print_formats: normalizedFormats,
        updated_at: new Date().toISOString()
      })
      .eq("id", input.mediaAssetId);

    if (error) {
      throw error;
    }

    return { isProduct: input.isProduct, printFormats: normalizedFormats };
  }

  await ensureLocalDatabaseReady();
  const db = createDb();
  await db
    .update(mediaAssets)
    .set({
      isProduct: input.isProduct,
      printFormats: normalizedFormats,
      updatedAt: new Date()
    })
    .where(eq(mediaAssets.id, input.mediaAssetId));

  return { isProduct: input.isProduct, printFormats: normalizedFormats };
}

export async function getEditorCommerceFormats() {
  const settings = await getCommerceSettings();
  return settings.printFormats;
}

export async function deleteEditorMediaAsset(mediaAssetId: string) {
  if (hasSupabaseEnv()) {
    const admin = createAdminSupabaseClient();
    const { error } = await admin.from("media_assets").delete().eq("id", mediaAssetId);

    if (error) {
      throw error;
    }

    return { deleted: true };
  }

  await ensureLocalDatabaseReady();
  const db = createDb();
  await db.delete(mediaAssets).where(eq(mediaAssets.id, mediaAssetId));
  return { deleted: true };
}

export async function createEditorMediaCategory(name: string) {
  const normalizedName = normalizeMediaCategoryName(name);

  if (!normalizedName) {
    throw new Error("Category name is required.");
  }

  if (hasSupabaseEnv()) {
    throw new Error("Custom media categories are not available in hosted mode yet.");
  }

  await ensureLocalDatabaseReady();
  await updateLocalMediaCategories((current) => [...current, normalizedName]);
  return await listLocalMediaCategories();
}

export async function renameEditorMediaCategory(previousName: string, nextName: string) {
  const from = normalizeMediaCategoryName(previousName);
  const to = normalizeMediaCategoryName(nextName);

  if (!from || !to) {
    throw new Error("Category names are required.");
  }

  if (hasSupabaseEnv()) {
    throw new Error("Custom media categories are not available in hosted mode yet.");
  }

  await ensureLocalDatabaseReady();
  const db = createDb();
  await db.update(mediaAssets).set({ category: to, updatedAt: new Date() }).where(eq(mediaAssets.category, from));
  await updateLocalMediaCategories((current) => current.map((item) => (item === from ? to : item)));
  return await listLocalMediaCategories();
}

export async function deleteEditorMediaCategory(name: string) {
  const normalizedName = normalizeMediaCategoryName(name);

  if (!normalizedName) {
    throw new Error("Category name is required.");
  }

  if (hasSupabaseEnv()) {
    throw new Error("Custom media categories are not available in hosted mode yet.");
  }

  await ensureLocalDatabaseReady();
  const db = createDb();
  await db
    .update(mediaAssets)
    .set({ category: "uploaded", updatedAt: new Date() })
    .where(eq(mediaAssets.category, normalizedName));
  await updateLocalMediaCategories((current) => current.filter((item) => item !== normalizedName));
  return await listLocalMediaCategories();
}

async function ensureLocalDatabaseReady() {
  const db = createDb();
  await ensureLocalSchemaCompatibility();
  const existingPages = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(pages);

  if ((existingPages[0]?.count ?? 0) > 0) {
    return;
  }

  const seededMedia = createSeedMediaLibrary();

  if (seededMedia.length) {
    await db.insert(mediaAssets).values(
      seededMedia.map((asset) => ({
        storageBucket: "public",
        storagePath: asset.previewUrl,
        kind: "image" as const,
        mimeType: guessMimeType(asset.previewUrl),
        fileName: asset.title,
        alt: asset.alt,
        caption: asset.title,
        category: asset.category,
        isProduct: asset.isProduct ?? false,
        printFormats: asset.printFormats ?? [],
        isPublic: true
      }))
    );
  }

  const seedPages = createSeedPages();

  for (const pageDef of seedPages) {
    const [pageRow] = await db
      .insert(pages)
      .values({
        slug: pageDef.slug,
        title: pageDef.title,
        pageKind: "content",
        isHomepage: pageDef.slug === "home"
      })
      .returning();

    const [revision] = await db
      .insert(pageRevisions)
      .values({
        pageId: pageRow.id,
        revisionNumber: 1,
        status: "published",
        title: pageDef.title,
        publishedAt: new Date()
      })
      .returning();

    await db.insert(pageBlocks).values(
      normalizeBlocks(pageDef.blocks).map((block, index) => ({
        revisionId: revision.id,
        blockType: block.blockType,
        position: index,
        isHidden: block.isHidden,
        data: block.data,
        settings: {}
      }))
    );

    await db
      .update(pages)
      .set({
        publishedRevisionId: revision.id,
        updatedAt: new Date()
      })
      .where(eq(pages.id, pageRow.id));
  }

  const homepage = await db.query.pages.findFirst({
    where: eq(pages.slug, "home")
  });

  await db.insert(siteSettings).values({
    siteName: "Olga Schmid",
    defaultLocale: "en",
    homepagePageId: homepage?.id ?? null,
    metadata: {
      ...DEFAULT_SITE_COMMERCE_SETTINGS
    }
  });
}

function normalizeCommerceSettings(metadata: Record<string, unknown> | null | undefined): SiteCommerceSettings {
  const base = DEFAULT_SITE_COMMERCE_SETTINGS;
  const hasPrintFormats = Array.isArray(metadata?.printFormats);
  const rawPrintFormats = hasPrintFormats ? (metadata.printFormats as unknown[]) : [];
  const printFormats = rawPrintFormats
    .map((item, index) => {
      if (!item || typeof item !== "object") {
        return null;
      }

      const candidate = item as Record<string, unknown>;
      const widthCm = Number(candidate.widthCm);
      const heightCm = Number(candidate.heightCm);

      if (!Number.isFinite(widthCm) || !Number.isFinite(heightCm) || widthCm <= 0 || heightCm <= 0) {
        return null;
      }

      return {
        id: typeof candidate.id === "string" && candidate.id.trim() ? candidate.id : `format-${index}`,
        widthCm,
        heightCm,
        label: typeof candidate.label === "string" ? candidate.label : undefined,
        price: normalizePrice(candidate.price),
        priceOverride: normalizePrice(candidate.priceOverride)
      };
    })
    .filter((item): item is NonNullable<typeof item> => Boolean(item));

  const rawProviders = metadata?.paymentProviders && typeof metadata.paymentProviders === "object"
    ? (metadata.paymentProviders as Record<string, unknown>)
    : {};

  const paymentProviders = Object.fromEntries(
    Object.entries({ ...base.paymentProviders, ...rawProviders }).map(([key, value]) => {
      const candidate = value && typeof value === "object" ? (value as Record<string, unknown>) : {};
      return [key, {
        enabled: Boolean(candidate.enabled),
        title: typeof candidate.title === "string" && candidate.title.trim() ? candidate.title : key,
        description: typeof candidate.description === "string" ? candidate.description : "",
        kind: candidate.kind === "yoomoney" || candidate.kind === "sbp" || candidate.kind === "paypal" || candidate.kind === "cards"
          ? candidate.kind
          : key === "yoomoney"
            ? "yoomoney"
            : key === "sbp"
              ? "sbp"
              : key === "paypal"
                ? "paypal"
                : key === "cards"
                  ? "cards"
                  : undefined,
        settings: candidate.settings && typeof candidate.settings === "object"
          ? (candidate.settings as Record<string, string>)
          : {}
      }];
    })
  );

  return {
    cartEnabled: metadata?.cartEnabled === false ? false : true,
    printFormats: hasPrintFormats ? printFormats : base.printFormats,
    paymentProviders: paymentProviders as SiteCommerceSettings["paymentProviders"],
    emailNotifications: normalizeEmailNotificationSettings(metadata?.emailNotifications)
  };
}

function normalizeEmailNotificationSettings(value: unknown): SiteCommerceSettings["emailNotifications"] {
  const base = DEFAULT_SITE_COMMERCE_SETTINGS.emailNotifications;
  const candidate = value && typeof value === "object" ? (value as Record<string, unknown>) : {};

  return {
    enabled: candidate.enabled === true,
    adminEmail: normalizeString(candidate.adminEmail) || base.adminEmail,
    fromEmail: normalizeString(candidate.fromEmail),
    fromName: normalizeString(candidate.fromName) || base.fromName,
    smtpHost: normalizeString(candidate.smtpHost),
    smtpPort: normalizeString(candidate.smtpPort) || base.smtpPort,
    smtpSecure: typeof candidate.smtpSecure === "boolean" ? candidate.smtpSecure : base.smtpSecure,
    smtpUser: normalizeString(candidate.smtpUser),
    smtpPassword: normalizeString(candidate.smtpPassword)
  };
}

function normalizeString(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function mapOrderRow(row: typeof orders.$inferSelect): StoredOrder {
  return {
    id: row.id,
    orderNumber: row.orderNumber,
    paymentProvider: row.paymentProvider,
    paymentId: row.paymentId,
    status: row.status,
    currency: row.currency,
    amount: row.amount,
    customer: row.customer ?? {},
    items: Array.isArray(row.items) ? row.items : [],
    metadata: row.metadata ?? {},
    paidAt: row.paidAt,
    notifiedAt: row.notifiedAt
  };
}

function normalizePrintFormats(value: Array<{ id: string; widthCm: number; heightCm: number; label?: string; price?: number; priceOverride?: number }>) {
  const normalized: Array<{ id: string; widthCm: number; heightCm: number; label?: string; price?: number; priceOverride?: number }> = [];

  value.forEach((item, index) => {
    if (!item || typeof item !== "object") {
      return;
    }

    const widthCm = Number(item.widthCm);
    const heightCm = Number(item.heightCm);

    if (!Number.isFinite(widthCm) || !Number.isFinite(heightCm) || widthCm <= 0 || heightCm <= 0) {
      return;
    }

    normalized.push({
      id: typeof item.id === "string" && item.id.trim() ? item.id : `format-${index}`,
      widthCm,
      heightCm,
      label: typeof item.label === "string" && item.label.trim() ? item.label : undefined,
      price: normalizePrice(item.price),
      priceOverride: normalizePrice(item.priceOverride)
    });
  });

  return normalized;
}

function mergePrintFormats(...groups: Array<Array<{ id: string; widthCm: number; heightCm: number; label?: string; price?: number; priceOverride?: number }>>) {
  const merged = new Map<string, { id: string; widthCm: number; heightCm: number; label?: string; price?: number; priceOverride?: number }>();

  groups.flat().forEach((format) => {
    const [normalized] = normalizePrintFormats([format]);

    if (!normalized) {
      return;
    }

    const key = `${normalized.widthCm}x${normalized.heightCm}`;
    const existing = merged.get(key);

    merged.set(key, {
      ...existing,
      ...normalized,
      id: existing?.id ?? normalized.id,
      label: normalized.label ?? existing?.label,
      price: normalized.price ?? existing?.price,
      priceOverride: normalized.priceOverride ?? existing?.priceOverride
    });
  });

  return Array.from(merged.values()).sort((left, right) => left.widthCm - right.widthCm || left.heightCm - right.heightCm);
}

async function listLocalMediaPrintFormats(db: ReturnType<typeof createDb>) {
  const rows = await db.select({ printFormats: mediaAssets.printFormats }).from(mediaAssets);
  return rows.flatMap((row) => normalizePrintFormats(Array.isArray(row.printFormats) ? row.printFormats : []));
}

async function listSupabaseMediaPrintFormats(admin: ReturnType<typeof createAdminSupabaseClient>) {
  const { data, error } = await admin.from("media_assets").select("print_formats").limit(500);

  if (error) {
    throw error;
  }

  return (data ?? []).flatMap((row) =>
    normalizePrintFormats(
      Array.isArray((row as { print_formats?: unknown }).print_formats)
        ? ((row as { print_formats?: Array<{ id: string; widthCm: number; heightCm: number; label?: string; price?: number; priceOverride?: number }> }).print_formats ?? [])
        : []
    )
  );
}

function normalizePrice(value: unknown) {
  const price = Number(value);
  return Number.isFinite(price) && price >= 0 ? price : undefined;
}

async function ensureLocalSchemaCompatibility() {
  const db = createDb();

  await db.execute(sql.raw(`
    do $$
    begin
      create type order_status as enum ('pending', 'paid', 'failed', 'cancelled');
    exception
      when duplicate_object then null;
    end $$;
    alter table if exists media_assets add column if not exists focal_x integer;
    alter table if exists media_assets add column if not exists focal_y integer;
    alter table if exists media_assets add column if not exists checksum text;
    alter table if exists media_assets add column if not exists category text;
    alter table if exists media_assets add column if not exists is_product boolean not null default false;
    alter table if exists media_assets add column if not exists print_formats jsonb not null default '[]'::jsonb;
    alter table if exists pages add column if not exists created_by uuid;
    alter table if exists pages add column if not exists updated_by uuid;
    alter table if exists page_revisions add column if not exists created_by uuid;
    alter table if exists media_assets add column if not exists uploaded_by uuid;
    create table if not exists orders (
      id uuid primary key default gen_random_uuid(),
      order_number text not null unique,
      payment_provider text not null default 'yoomoney',
      payment_id text unique,
      status order_status not null default 'pending',
      currency text not null default 'RUB',
      amount integer not null default 0,
      customer jsonb not null default '{}'::jsonb,
      items jsonb not null default '[]'::jsonb,
      metadata jsonb not null default '{}'::jsonb,
      paid_at timestamptz,
      notified_at timestamptz,
      created_at timestamptz not null default now(),
      updated_at timestamptz not null default now()
    );
  `));
}

async function getLocalPageBySlug(slug: string, includeDraft: boolean) {
  const db = createDb();
  const page = await db.query.pages.findFirst({
    where: and(eq(pages.slug, slug), eq(pages.isArchived, false))
  });

  if (!page) {
    return undefined;
  }

  return await hydrateLocalPage(page.id, includeDraft);
}

async function getLocalPageById(pageId: string, includeDraft: boolean) {
  const db = createDb();
  const page = await db.query.pages.findFirst({
    where: eq(pages.id, pageId)
  });

  if (!page) {
    return undefined;
  }

  return await hydrateLocalPage(page.id, includeDraft);
}

async function hydrateLocalPage(pageId: string, includeDraft: boolean) {
  const db = createDb();
  const page = await db.query.pages.findFirst({
    where: eq(pages.id, pageId)
  });

  if (!page) {
    return undefined;
  }

  const revisionId =
    includeDraft && page.currentDraftRevisionId
      ? page.currentDraftRevisionId
      : page.publishedRevisionId ?? page.currentDraftRevisionId;

  const blocks = revisionId
    ? await db
        .select({
          id: pageBlocks.id,
          block_type: pageBlocks.blockType,
          position: pageBlocks.position,
          is_hidden: pageBlocks.isHidden,
          data: pageBlocks.data
        })
        .from(pageBlocks)
        .where(eq(pageBlocks.revisionId, revisionId))
        .orderBy(asc(pageBlocks.position))
    : [];

  return {
    id: page.id,
    slug: page.slug,
    title: page.title,
    source: "database",
    availablePages: await getLocalPageList(),
    blocks: blocks.map((block) =>
      mapBlockRow({
        id: block.id,
        block_type: block.block_type as BlockType,
        position: block.position,
        is_hidden: block.is_hidden,
        data: block.data
      })
    )
  } satisfies SitePageRecord;
}

async function getLocalPageList(): Promise<Array<{ id: string; slug: string; title: string }>> {
  const db = createDb();
  const rows = await db
    .select({
      id: pages.id,
      slug: pages.slug,
      title: pages.title
    })
    .from(pages)
    .where(eq(pages.isArchived, false))
    .orderBy(asc(pages.slug));

  const settings = await db.query.siteSettings.findFirst();
  return sortPagesByStoredOrder(rows, settings?.metadata);
}

async function saveLocalPageDraft(input: {
  pageId: string;
  title: string;
  blocks: SiteBlockRecord[];
}) {
  const db = createDb();
  const page = await db.query.pages.findFirst({
    where: eq(pages.id, input.pageId)
  });

  if (!page) {
    throw new Error("Page not found");
  }

  const blocks = normalizeBlocks(input.blocks);
  const revisionId =
    page.currentDraftRevisionId ??
    (await createLocalDraftRevisionFromCurrent({
      pageId: page.id,
      title: input.title || page.title,
      sourceRevisionId: page.publishedRevisionId
    }));

  await db
    .update(pageRevisions)
    .set({
      title: input.title || page.title,
      updatedAt: new Date()
    })
    .where(eq(pageRevisions.id, revisionId));

  await db.delete(pageBlocks).where(eq(pageBlocks.revisionId, revisionId));

  if (blocks.length) {
    await db.insert(pageBlocks).values(
      blocks.map((block, index) => ({
        revisionId,
        blockType: block.blockType,
        position: index,
        isHidden: block.isHidden,
        data: block.data,
        settings: {}
      }))
    );
  }

  await db
    .update(pages)
    .set({
      title: input.title || page.title,
      currentDraftRevisionId: revisionId,
      updatedAt: new Date()
    })
    .where(eq(pages.id, page.id));

  return await getLocalPageById(page.id, true);
}

async function publishLocalPageChanges(input: {
  pageId: string;
  title: string;
  blocks: SiteBlockRecord[];
}) {
  await saveLocalPageDraft(input);

  const db = createDb();
  const page = await db.query.pages.findFirst({
    where: eq(pages.id, input.pageId)
  });

  if (!page?.currentDraftRevisionId) {
    throw new Error("No draft revision to publish");
  }

  if (page.publishedRevisionId) {
    await db
      .update(pageRevisions)
      .set({
        status: "archived",
        updatedAt: new Date()
      })
      .where(eq(pageRevisions.id, page.publishedRevisionId));
  }

  await db
    .update(pageRevisions)
    .set({
      status: "published",
      publishedAt: new Date(),
      updatedAt: new Date()
    })
    .where(eq(pageRevisions.id, page.currentDraftRevisionId));

  await db
    .update(pages)
    .set({
      publishedRevisionId: page.currentDraftRevisionId,
      currentDraftRevisionId: null,
      updatedAt: new Date()
    })
    .where(eq(pages.id, page.id));

  return await getLocalPageById(page.id, false);
}

async function createLocalPageRecord(input: { title: string; slug: string }) {
  const db = createDb();
  const safeSlug = await createUniqueLocalPageSlug(input.slug || input.title);

  const [page] = await db
    .insert(pages)
    .values({
      slug: safeSlug,
      title: input.title,
      pageKind: "content"
    })
    .returning();

  const [revision] = await db
    .insert(pageRevisions)
    .values({
      pageId: page.id,
      revisionNumber: 1,
      status: "draft",
      title: input.title
    })
    .returning();

  const starterBlocks = [block("hero", 0), block("richText", 1), block("cta", 2)];

  await db.insert(pageBlocks).values(
    starterBlocks.map((item, index) => ({
      revisionId: revision.id,
      blockType: item.blockType,
      position: index,
      isHidden: item.isHidden,
      data: item.data,
      settings: {}
    }))
  );

  await db
    .update(pages)
    .set({
      currentDraftRevisionId: revision.id,
      updatedAt: new Date()
    })
    .where(eq(pages.id, page.id));

  await appendPageToLocalOrder(page.id);

  return await getLocalPageById(page.id, true);
}

async function renameLocalPageRecord(input: { pageId: string; title: string }) {
  const db = createDb();
  const page = await db.query.pages.findFirst({
    where: and(eq(pages.id, input.pageId), eq(pages.isArchived, false))
  });

  if (!page) {
    throw new Error("Page not found");
  }

  const nextTitle = input.title.trim();

  if (!nextTitle) {
    throw new Error("Title is required");
  }

  await db
    .update(pages)
    .set({
      title: nextTitle,
      updatedAt: new Date()
    })
    .where(eq(pages.id, page.id));

  await db
    .update(pageRevisions)
    .set({
      title: nextTitle,
      updatedAt: new Date()
    })
    .where(eq(pageRevisions.pageId, page.id));

  return await getLocalPageList();
}

async function deleteLocalPageRecord(input: { pageId: string }) {
  const db = createDb();
  const page = await db.query.pages.findFirst({
    where: and(eq(pages.id, input.pageId), eq(pages.isArchived, false))
  });

  if (!page) {
    throw new Error("Page not found");
  }

  if (page.isHomepage) {
    throw new Error("Homepage cannot be deleted");
  }

  await db
    .update(pages)
    .set({
      isArchived: true,
      archivedAt: new Date(),
      updatedAt: new Date()
    })
    .where(eq(pages.id, page.id));

  await removePageFromLocalOrder(page.id);

  return await getLocalPageList();
}

async function reorderLocalPageRecords(input: { pageIds: string[] }) {
  await updateLocalPageOrder(input.pageIds);
  return await getLocalPageList();
}

async function uploadLocalEditorImage(input: {
  pageId: string;
  fileName: string;
  fileType: string;
  data: ArrayBuffer;
  category?: MediaCategory;
}) {
  const db = createDb();
  const safeName = `${Date.now()}-${input.fileName.replace(/[^a-zA-Z0-9.\-_]/g, "-")}`;
  const pageDir = path.join(LOCAL_UPLOADS_DIR, input.pageId);
  const filePath = path.join(pageDir, safeName);
  const publicUrl = `/media-files/${input.pageId}/${safeName}`;
  const readableTitle = toReadableMediaTitle(input.fileName);
  const fileBuffer = Buffer.from(input.data);
  const generated = await generateImageVariants(fileBuffer, safeName, input.fileType, publicUrl);

  await mkdir(pageDir, { recursive: true });
  await writeFile(filePath, fileBuffer);
  await Promise.all(
    generated.files.map((variant) => writeFile(path.join(pageDir, variant.fileName), variant.data))
  );

  const [mediaAsset] = await db
    .insert(mediaAssets)
    .values({
      storageBucket: "local",
      storagePath: publicUrl,
      kind: "image" as const,
      mimeType: input.fileType,
      fileName: input.fileName,
      width: generated.width,
      height: generated.height,
      sizeBytes: fileBuffer.byteLength,
      alt: "",
      caption: readableTitle,
      category: input.category ?? "uploaded",
      isProduct: false,
      printFormats: [],
      isPublic: true
    })
    .returning();

  return {
    mediaAssetId: publicUrl,
    publicUrl,
    recordId: mediaAsset.id,
    asset: {
      id: mediaAsset.id,
      mediaAssetId: publicUrl,
      previewUrl: generated.variants.thumb?.url ?? publicUrl,
      title: readableTitle,
      alt: "",
      category: input.category ?? "uploaded",
      variants: generated.variants,
      isProduct: false,
      printFormats: []
    } satisfies MediaLibraryAsset
  };
}

async function listLocalMediaLibrary(): Promise<MediaLibraryAsset[]> {
  const db = createDb();
  const rows = await db
    .select({
      id: mediaAssets.id,
      storagePath: mediaAssets.storagePath,
      mimeType: mediaAssets.mimeType,
      width: mediaAssets.width,
      fileName: mediaAssets.fileName,
      alt: mediaAssets.alt,
      caption: mediaAssets.caption,
      category: mediaAssets.category,
      isProduct: mediaAssets.isProduct,
      printFormats: mediaAssets.printFormats
    })
    .from(mediaAssets)
    .orderBy(desc(mediaAssets.createdAt));

  return rows.map((asset) => ({
    id: asset.id,
    mediaAssetId: asset.storagePath,
    previewUrl:
      asset.width && isRasterImageMimeType(asset.mimeType)
        ? buildVariantUrl(asset.storagePath, "thumb")
        : asset.storagePath,
    title: asset.caption ?? asset.fileName ?? "Image",
    alt: asset.alt ?? "",
    category: asset.category ?? inferMediaCategory(asset.storagePath),
    isProduct: asset.isProduct,
    printFormats: normalizePrintFormats(Array.isArray(asset.printFormats) ? asset.printFormats : [])
  }));
}

export async function readLocalMediaFile(pathSegments: string[]) {
  const filePath = path.join(LOCAL_UPLOADS_DIR, ...pathSegments);

  try {
    return {
      file: await readFile(filePath),
      fileName: pathSegments[pathSegments.length - 1] ?? ""
    };
  } catch (error) {
    const requestedFile = pathSegments[pathSegments.length - 1] ?? "";
    const match = requestedFile.match(/^(.*)--(thumb|card|panel|hero)\.webp$/i);

    if (!match) {
      throw error;
    }

    const baseName = match[1];
    const candidateExtensions = [".jpg", ".jpeg", ".png", ".webp", ".avif"];

    for (const extension of candidateExtensions) {
      const fallbackFileName = `${baseName}${extension}`;
      const fallbackPath = path.join(
        LOCAL_UPLOADS_DIR,
        ...pathSegments.slice(0, -1),
        fallbackFileName
      );

      try {
        return {
          file: await readFile(fallbackPath),
          fileName: fallbackFileName
        };
      } catch {
        continue;
      }
    }

    throw error;
  }
}

function inferMediaCategory(storagePath: string): MediaCategory {
  const normalizedPath = storagePath.toLowerCase();

  if (normalizedPath.includes("portrait")) return "portraits";
  if (normalizedPath.includes("detail")) return "details";
  if (normalizedPath.includes("space")) return "spaces";
  if (normalizedPath.includes("hero") || normalizedPath.includes("cover")) return "featured";
  if (normalizedPath.includes("/media-files/")) return "uploaded";
  return "works";
}

async function listLocalMediaCategories() {
  const db = createDb();
  const settings = await db.query.siteSettings.findFirst();
  const rows = await db.select({ category: mediaAssets.category }).from(mediaAssets);
  const metadataCategories = Array.isArray(settings?.metadata?.mediaCategories)
    ? settings.metadata.mediaCategories.filter((item): item is string => typeof item === "string")
    : [];
  const assetCategories = rows
    .map((row) => normalizeMediaCategoryName(row.category ?? ""))
    .filter(Boolean);

  return uniqueMediaCategories([...DEFAULT_MEDIA_CATEGORIES, ...metadataCategories, ...assetCategories]);
}

async function updateLocalMediaCategories(updater: (current: string[]) => string[]) {
  const db = createDb();
  const settings = await db.query.siteSettings.findFirst();

  if (!settings) {
    return;
  }

  const current = Array.isArray(settings.metadata?.mediaCategories)
    ? settings.metadata.mediaCategories.filter((item): item is string => typeof item === "string")
    : [];

  await db
    .update(siteSettings)
    .set({
      metadata: {
        ...(settings.metadata ?? {}),
        mediaCategories: uniqueMediaCategories(updater(current))
      },
      updatedAt: new Date()
    })
    .where(eq(siteSettings.id, settings.id));
}

function uniqueMediaCategories(input: string[]) {
  return [...new Set(input.map(normalizeMediaCategoryName).filter(Boolean))];
}

function guessMimeType(filePath: string) {
  if (filePath.endsWith(".svg")) return "image/svg+xml";
  if (filePath.endsWith(".png")) return "image/png";
  if (filePath.endsWith(".jpg") || filePath.endsWith(".jpeg")) return "image/jpeg";
  if (filePath.endsWith(".webp")) return "image/webp";
  return "application/octet-stream";
}

async function createLocalDraftRevisionFromCurrent(input: {
  pageId: string;
  title: string;
  sourceRevisionId: string | null;
}) {
  const db = createDb();
  const latestRevision = await db
    .select({ revisionNumber: pageRevisions.revisionNumber })
    .from(pageRevisions)
    .where(eq(pageRevisions.pageId, input.pageId))
    .orderBy(desc(pageRevisions.revisionNumber))
    .limit(1);

  const [revision] = await db
    .insert(pageRevisions)
    .values({
      pageId: input.pageId,
      revisionNumber: (latestRevision[0]?.revisionNumber ?? 0) + 1,
      status: "draft",
      title: input.title
    })
    .returning();

  if (input.sourceRevisionId) {
    const sourceBlocks = await db
      .select({
        blockType: pageBlocks.blockType,
        position: pageBlocks.position,
        isHidden: pageBlocks.isHidden,
        data: pageBlocks.data,
        settings: pageBlocks.settings
      })
      .from(pageBlocks)
      .where(eq(pageBlocks.revisionId, input.sourceRevisionId))
      .orderBy(asc(pageBlocks.position));

    if (sourceBlocks.length) {
      await db.insert(pageBlocks).values(
        sourceBlocks.map((block) => ({
          revisionId: revision.id,
          blockType: block.blockType,
          position: block.position,
          isHidden: block.isHidden,
          data: block.data,
          settings: block.settings ?? {}
        }))
      );
    }
  }

  await db
    .update(pages)
    .set({
      currentDraftRevisionId: revision.id,
      updatedAt: new Date()
    })
    .where(eq(pages.id, input.pageId));

  return revision.id;
}

async function saveSupabasePageDraft(input: {
  pageId: string;
  title: string;
  blocks: SiteBlockRecord[];
}) {
  const editor = await getEditorIdentity();

  if (!editor) {
    throw new Error("Unauthorized");
  }

  const admin = createAdminSupabaseClient();
  const { data: page, error: pageError } = await admin
    .from("pages")
    .select("id, title, published_revision_id, current_draft_revision_id")
    .eq("id", input.pageId)
    .single();

  if (pageError || !page) {
    throw new Error("Page not found");
  }

  const blocks = normalizeBlocks(input.blocks);
  const revisionId =
    page.current_draft_revision_id ??
    (await createSupabaseDraftRevisionFromCurrent(admin, {
      pageId: page.id,
      title: input.title || page.title,
      sourceRevisionId: page.published_revision_id
    }));

  await admin
    .from("page_revisions")
    .update({
      title: input.title || page.title,
      updated_at: new Date().toISOString()
    })
    .eq("id", revisionId);

  await admin.from("page_blocks").delete().eq("revision_id", revisionId);

  if (blocks.length) {
    await admin.from("page_blocks").insert(
      blocks.map((block, index) => ({
        revision_id: revisionId,
        block_type: block.blockType,
        position: index,
        is_hidden: block.isHidden,
        data: block.data,
        settings: {}
      }))
    );
  }

  await admin
    .from("pages")
    .update({
      title: input.title || page.title,
      current_draft_revision_id: revisionId,
      updated_at: new Date().toISOString()
    })
    .eq("id", page.id);

  return await getSupabasePageById(page.id, true);
}

async function publishSupabasePageChanges(input: {
  pageId: string;
  title: string;
  blocks: SiteBlockRecord[];
}) {
  await saveSupabasePageDraft(input);

  const admin = createAdminSupabaseClient();
  const { data: page } = await admin
    .from("pages")
    .select("id, published_revision_id, current_draft_revision_id")
    .eq("id", input.pageId)
    .single();

  if (!page?.current_draft_revision_id) {
    throw new Error("No draft revision to publish");
  }

  const now = new Date().toISOString();

  if (page.published_revision_id) {
    await admin
      .from("page_revisions")
      .update({
        status: "archived",
        updated_at: now
      })
      .eq("id", page.published_revision_id);
  }

  await admin
    .from("page_revisions")
    .update({
      status: "published",
      published_at: now,
      updated_at: now
    })
    .eq("id", page.current_draft_revision_id);

  await admin
    .from("pages")
    .update({
      published_revision_id: page.current_draft_revision_id,
      current_draft_revision_id: null,
      updated_at: now
    })
    .eq("id", input.pageId);

  return await getSupabasePageById(input.pageId, false);
}

async function createSupabasePageRecord(input: { title: string; slug: string }) {
  const editor = await getEditorIdentity();

  if (!editor) {
    throw new Error("Unauthorized");
  }

  const admin = createAdminSupabaseClient();
  const safeSlug = await createUniqueSupabasePageSlug(admin, input.slug || input.title);
  const now = new Date().toISOString();

  const { data: page, error: pageError } = await admin
    .from("pages")
    .insert({
      slug: safeSlug,
      title: input.title,
      page_kind: "content",
      created_at: now,
      updated_at: now
    })
    .select("id")
    .single();

  if (pageError || !page) {
    throw pageError ?? new Error("Page create failed");
  }

  const revisionId = await createSupabaseDraftRevisionFromCurrent(admin, {
    pageId: page.id,
    title: input.title,
    sourceRevisionId: null
  });

  const starterBlocks = [block("hero", 0), block("richText", 1), block("cta", 2)];

  await admin.from("page_blocks").insert(
    starterBlocks.map((item, index) => ({
      revision_id: revisionId,
      block_type: item.blockType,
      position: index,
      is_hidden: item.isHidden,
      data: item.data,
      settings: {}
    }))
  );

  return await getSupabasePageById(page.id, true);
}

async function uploadSupabaseEditorImage(input: {
  pageId: string;
  fileName: string;
  fileType: string;
  data: ArrayBuffer;
  category?: MediaCategory;
}) {
  const editor = await getEditorIdentity();

  if (!editor) {
    throw new Error("Unauthorized");
  }

  const admin = createAdminSupabaseClient();
  const safeName = `${Date.now()}-${input.fileName.replace(/[^a-zA-Z0-9.\-_]/g, "-")}`;
  const filePath = `${input.pageId}/${safeName}`;
  const readableTitle = toReadableMediaTitle(input.fileName);

  const { error: uploadError } = await admin.storage
    .from(PUBLIC_BUCKET)
    .upload(filePath, input.data, {
      contentType: input.fileType,
      upsert: false
    });

  if (uploadError) {
    throw uploadError;
  }

  const {
    data: { publicUrl }
  } = admin.storage.from(PUBLIC_BUCKET).getPublicUrl(filePath);
  const fileBuffer = Buffer.from(input.data);
  const generated = await generateImageVariants(fileBuffer, safeName, input.fileType, publicUrl);

  await Promise.all(
    generated.files.map(async (variant) => {
      const variantPath = `${input.pageId}/${variant.fileName}`;
      const { error } = await admin.storage.from(PUBLIC_BUCKET).upload(variantPath, variant.data, {
        contentType: variant.mimeType,
        upsert: false
      });

      if (error) {
        throw error;
      }
    })
  );

  const { data: mediaAsset, error: assetError } = await admin
    .from("media_assets")
    .insert({
      storage_bucket: PUBLIC_BUCKET,
      storage_path: filePath,
      kind: "image",
      mime_type: input.fileType,
      file_name: input.fileName,
      width: generated.width,
      height: generated.height,
      size_bytes: fileBuffer.byteLength,
      caption: readableTitle,
      category: input.category ?? "uploaded",
      is_public: true
    })
    .select("id")
    .single();

  if (assetError || !mediaAsset) {
    throw assetError ?? new Error("Asset create failed");
  }

  return {
    mediaAssetId: publicUrl,
    publicUrl,
    recordId: mediaAsset.id,
    asset: {
      id: mediaAsset.id,
      mediaAssetId: publicUrl,
      previewUrl: generated.variants.thumb?.url ?? publicUrl,
      title: readableTitle,
      alt: "",
      category: input.category ?? "uploaded",
      variants: generated.variants
    } satisfies MediaLibraryAsset
  };
}

async function listSupabaseMediaLibrary(): Promise<MediaLibraryAsset[]> {
  const editor = await getEditorIdentity();

  if (!editor) {
    throw new Error("Unauthorized");
  }

  const admin = createAdminSupabaseClient();
  const { data, error } = await admin
    .from("media_assets")
    .select("id, storage_bucket, storage_path, file_name, mime_type, width, alt, caption, is_product, print_formats")
    .order("created_at", { ascending: false })
    .limit(200);

  if (error) {
    throw error;
  }

  return (data ?? []).map((asset) => {
    const {
      data: { publicUrl }
    } = admin.storage.from(String(asset.storage_bucket)).getPublicUrl(String(asset.storage_path));

    return {
      id: String(asset.id),
      mediaAssetId: publicUrl,
      previewUrl: publicUrl,
      title: String(asset.caption ?? asset.file_name ?? "Image"),
      alt: String(asset.alt ?? ""),
      category: inferMediaCategory(String(asset.storage_path)),
      isProduct: Boolean((asset as { is_product?: boolean }).is_product),
      printFormats: normalizePrintFormats(
        Array.isArray((asset as { print_formats?: unknown }).print_formats)
          ? ((asset as { print_formats?: Array<{ id: string; widthCm: number; heightCm: number; label?: string; price?: number; priceOverride?: number }> }).print_formats ?? [])
          : []
      )
    } satisfies MediaLibraryAsset;
  });
}

async function getSupabasePageBySlug(slug: string, includeDraft: boolean) {
  const admin = createAdminSupabaseClient();
  const { data: page, error } = await admin
    .from("pages")
    .select("id, slug, title, published_revision_id, current_draft_revision_id")
    .eq("slug", slug)
    .maybeSingle();

  if (error || !page) {
    return undefined;
  }

  return await hydrateSupabasePage(admin, page, includeDraft);
}

async function getSupabasePageById(pageId: string, includeDraft: boolean) {
  const admin = createAdminSupabaseClient();
  const { data: page, error } = await admin
    .from("pages")
    .select("id, slug, title, published_revision_id, current_draft_revision_id")
    .eq("id", pageId)
    .single();

  if (error || !page) {
    return undefined;
  }

  return await hydrateSupabasePage(admin, page, includeDraft);
}

async function hydrateSupabasePage(
  admin: ReturnType<typeof createAdminSupabaseClient>,
  page: RawPageRow,
  includeDraft: boolean
) {
  const revisionId =
    includeDraft && page.current_draft_revision_id
      ? page.current_draft_revision_id
      : page.published_revision_id ?? page.current_draft_revision_id;

  const { data: blocks } = revisionId
    ? await admin
        .from("page_blocks")
        .select("id, block_type, position, is_hidden, data")
        .eq("revision_id", revisionId)
        .order("position", { ascending: true })
    : { data: [] as RawBlockRow[] };

  return {
    id: page.id,
    slug: page.slug,
    title: page.title,
    source: "supabase",
    availablePages: await getSupabasePageList(admin),
    blocks: (blocks ?? []).map(mapBlockRow)
  } satisfies SitePageRecord;
}

async function getSupabasePageList(admin: ReturnType<typeof createAdminSupabaseClient>) {
  const { data } = await admin
    .from("pages")
    .select("id, slug, title")
    .eq("is_archived", false)
    .order("slug");
  const { data: settings } = await admin.from("site_settings").select("metadata").limit(1).maybeSingle();
  return sortPagesByStoredOrder(
    ((data ?? []) as Array<{ id: string; slug: string; title: string }>),
    settings?.metadata ?? null
  );
}

async function renameSupabasePageRecord(input: { pageId: string; title: string }) {
  const admin = createAdminSupabaseClient();
  const nextTitle = input.title.trim();

  if (!nextTitle) {
    throw new Error("Title is required");
  }

  await admin
    .from("pages")
    .update({
      title: nextTitle,
      updated_at: new Date().toISOString()
    })
    .eq("id", input.pageId)
    .eq("is_archived", false);

  await admin
    .from("page_revisions")
    .update({
      title: nextTitle,
      updated_at: new Date().toISOString()
    })
    .eq("page_id", input.pageId);

  return await getSupabasePageList(admin);
}

async function deleteSupabasePageRecord(input: { pageId: string }) {
  const admin = createAdminSupabaseClient();
  const { data: page } = await admin
    .from("pages")
    .select("id, is_homepage")
    .eq("id", input.pageId)
    .eq("is_archived", false)
    .single();

  if (!page) {
    throw new Error("Page not found");
  }

  if (page.is_homepage) {
    throw new Error("Homepage cannot be deleted");
  }

  await admin
    .from("pages")
    .update({
      is_archived: true,
      archived_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    })
    .eq("id", input.pageId);

  await removePageFromSupabaseOrder(input.pageId);

  return await getSupabasePageList(admin);
}

async function reorderSupabasePageRecords(input: { pageIds: string[] }) {
  await updateSupabasePageOrder(input.pageIds);
  return await getSupabasePageList(createAdminSupabaseClient());
}

async function createUniqueLocalPageSlug(value: string) {
  const db = createDb();
  const baseSlug = sanitizeSlug(value) || "page";
  let candidate = baseSlug;
  let suffix = 2;

  for (;;) {
    const existingPage = await db.query.pages.findFirst({
      where: eq(pages.slug, candidate)
    });

    if (!existingPage) {
      return candidate;
    }

    candidate = `${baseSlug}-${suffix}`;
    suffix += 1;
  }
}

async function createUniqueSupabasePageSlug(
  admin: ReturnType<typeof createAdminSupabaseClient>,
  value: string
) {
  const baseSlug = sanitizeSlug(value) || "page";
  let candidate = baseSlug;
  let suffix = 2;

  for (;;) {
    const { data: existingPage } = await admin
      .from("pages")
      .select("id")
      .eq("slug", candidate)
      .maybeSingle();

    if (!existingPage) {
      return candidate;
    }

    candidate = `${baseSlug}-${suffix}`;
    suffix += 1;
  }
}

function sortPagesByStoredOrder<TPage extends { id: string; slug: string }>(
  pagesList: TPage[],
  metadata: Record<string, unknown> | null | undefined
) {
  const storedOrder = Array.isArray(metadata?.pageOrder)
    ? metadata.pageOrder.filter((item): item is string => typeof item === "string")
    : [];
  const orderMap = new Map(storedOrder.map((id, index) => [id, index]));

  return [...pagesList].sort((left, right) => {
    const leftIndex = orderMap.get(left.id);
    const rightIndex = orderMap.get(right.id);

    if (leftIndex != null && rightIndex != null) {
      return leftIndex - rightIndex;
    }

    if (leftIndex != null) {
      return -1;
    }

    if (rightIndex != null) {
      return 1;
    }

    return left.slug.localeCompare(right.slug);
  });
}

async function updateLocalPageOrder(pageIds: string[]) {
  const db = createDb();
  const settings = await db.query.siteSettings.findFirst();

  if (!settings) {
    return;
  }

  const pagesList = await db
    .select({ id: pages.id })
    .from(pages)
    .where(eq(pages.isArchived, false));
  const existingIds = new Set(pagesList.map((page) => page.id));
  const normalizedOrder = [
    ...pageIds.filter((id) => existingIds.has(id)),
    ...pagesList.map((page) => page.id).filter((id) => !pageIds.includes(id))
  ];

  await db
    .update(siteSettings)
    .set({
      metadata: {
        ...(settings.metadata ?? {}),
        pageOrder: normalizedOrder
      },
      updatedAt: new Date()
    })
    .where(eq(siteSettings.id, settings.id));
}

async function appendPageToLocalOrder(pageId: string) {
  const pagesList = await getLocalPageList();
  await updateLocalPageOrder([...pagesList.map((page) => page.id), pageId]);
}

async function removePageFromLocalOrder(pageId: string) {
  const pagesList = await getLocalPageList();
  await updateLocalPageOrder(pagesList.map((page) => page.id).filter((id) => id !== pageId));
}

async function updateSupabasePageOrder(pageIds: string[]) {
  const admin = createAdminSupabaseClient();
  const { data: settings } = await admin.from("site_settings").select("id, metadata").limit(1).single();
  const { data: pagesList } = await admin.from("pages").select("id").eq("is_archived", false);

  if (!settings) {
    return;
  }

  const existingIds = new Set((pagesList ?? []).map((page) => page.id));
  const normalizedOrder = [
    ...pageIds.filter((id) => existingIds.has(id)),
    ...(pagesList ?? []).map((page) => page.id).filter((id) => !pageIds.includes(id))
  ];

  await admin
    .from("site_settings")
    .update({
      metadata: {
        ...(settings.metadata ?? {}),
        pageOrder: normalizedOrder
      },
      updated_at: new Date().toISOString()
    })
    .eq("id", settings.id);
}

async function removePageFromSupabaseOrder(pageId: string) {
  const admin = createAdminSupabaseClient();
  const pagesList = await getSupabasePageList(admin);
  await updateSupabasePageOrder(pagesList.map((page) => page.id).filter((id) => id !== pageId));
}

async function createSupabaseDraftRevisionFromCurrent(
  admin: ReturnType<typeof createAdminSupabaseClient>,
  input: { pageId: string; title: string; sourceRevisionId: string | null }
) {
  const { data: revisionRows } = await admin
    .from("page_revisions")
    .select("revision_number")
    .eq("page_id", input.pageId)
    .order("revision_number", { ascending: false })
    .limit(1);

  const revisionNumber = (revisionRows?.[0]?.revision_number ?? 0) + 1;
  const now = new Date().toISOString();

  const { data: revision, error: revisionError } = await admin
    .from("page_revisions")
    .insert({
      page_id: input.pageId,
      revision_number: revisionNumber,
      status: "draft",
      title: input.title,
      created_at: now,
      updated_at: now
    })
    .select("id")
    .single();

  if (revisionError || !revision) {
    throw revisionError ?? new Error("Draft revision create failed");
  }

  if (input.sourceRevisionId) {
    const { data: sourceBlocks } = await admin
      .from("page_blocks")
      .select("block_type, position, is_hidden, data, settings")
      .eq("revision_id", input.sourceRevisionId)
      .order("position", { ascending: true });

    if (sourceBlocks?.length) {
      await admin.from("page_blocks").insert(
        sourceBlocks.map((block) => ({
          revision_id: revision.id,
          block_type: block.block_type,
          position: block.position,
          is_hidden: block.is_hidden,
          data: block.data,
          settings: block.settings ?? {}
        }))
      );
    }
  }

  await admin
    .from("pages")
    .update({
      current_draft_revision_id: revision.id,
      updated_at: now
    })
    .eq("id", input.pageId);

  return revision.id;
}

function mapBlockRow(row: RawBlockRow): SiteBlockRecord {
  return {
    id: row.id,
    blockType: row.block_type,
    position: row.position,
    isHidden: row.is_hidden,
    data: validateBlock(row.block_type, row.data)
  };
}

function normalizeBlocks(blocks: SiteBlockRecord[]) {
  return blocks
    .map((block, index) => ({
      ...block,
      position: index,
      data: validateBlock(block.blockType, block.data)
    }))
    .sort((left, right) => left.position - right.position);
}

function block<TType extends BlockType>(type: TType, position: number): SiteBlockRecord<TType> {
  return {
    id: `${type}-${position}-${Math.random().toString(36).slice(2, 8)}`,
    blockType: type,
    position,
    isHidden: false,
    data: createDefaultBlock(type)
  };
}
