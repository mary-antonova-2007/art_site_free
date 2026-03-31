import { and, asc, desc, eq, inArray, isNotNull } from "drizzle-orm";
import type { z } from "zod";

import {
  appUsers,
  mediaAssets,
  mediaUsages,
  pageBlocks,
  pageDraftLocks,
  pageRevisions,
  pages,
  siteSettings,
  type MediaKind,
  type PageBlockData,
  type PageBlockSettings,
  type PageKind,
  type PageRevisionStatus,
} from "./schema";

export type Db = any;

export type PageBlockRecord = {
  id: string;
  revisionId: string;
  blockType: string;
  position: number;
  isHidden: boolean;
  data: PageBlockData;
  settings: PageBlockSettings;
};

export type PageRevisionRecord = {
  id: string;
  pageId: string;
  revisionNumber: number;
  status: PageRevisionStatus;
  title: string;
  seoTitle: string | null;
  seoDescription: string | null;
  canonicalPath: string | null;
  notes: string | null;
  publishedAt: Date | null;
};

export type PageRecord = {
  id: string;
  slug: string;
  title: string;
  pageKind: PageKind;
  seoTitle: string | null;
  seoDescription: string | null;
  currentDraftRevisionId: string | null;
  publishedRevisionId: string | null;
  isHomepage: boolean;
  isArchived: boolean;
};

export type PageWithBlocks = PageRecord & {
  blocks: PageBlockRecord[];
};

export type CreatePageInput = {
  slug: string;
  title: string;
  pageKind?: PageKind;
  createdBy?: string | null;
  isHomepage?: boolean;
};

export type CreateDraftRevisionInput = {
  pageId: string;
  title: string;
  createdBy?: string | null;
  seoTitle?: string | null;
  seoDescription?: string | null;
  canonicalPath?: string | null;
  notes?: string | null;
};

export type PublishResult = {
  pageId: string;
  publishedRevisionId: string;
  publishedAt: string;
};

export function sortBlocks<T extends { position: number }>(blocks: T[]) {
  return [...blocks].sort((left, right) => left.position - right.position);
}

export function createDraftFromPublished(page: PageWithBlocks): PageWithBlocks {
  return {
    ...page,
    currentDraftRevisionId: `${page.id}-draft`,
    blocks: page.blocks.map((block) => ({ ...block })),
  };
}

export function publishPage(page: PageWithBlocks): PublishResult {
  return {
    pageId: page.id,
    publishedRevisionId: page.currentDraftRevisionId ?? `${page.id}-published`,
    publishedAt: new Date().toISOString(),
  };
}

export function validateZodPayload<TSchema extends z.ZodTypeAny>(
  schema: TSchema,
  payload: unknown,
) {
  return schema.parse(payload);
}

export async function getSiteSettings(db: Db) {
  return db.query.siteSettings.findFirst();
}

export async function getHomepagePage(db: Db) {
  const settings = await getSiteSettings(db);
  if (!settings?.homepagePageId) {
    return null;
  }

  return db.query.pages.findFirst({
    where: and(
      eq(pages.id, settings.homepagePageId),
      eq(pages.isArchived, false),
      isNotNull(pages.publishedRevisionId),
    ),
    with: {
      publishedRevision: {
        with: {
          blocks: {
            orderBy: [asc(pageBlocks.position)],
          },
        },
      },
    },
  });
}

export async function getPublishedPageBySlug(db: Db, slug: string) {
  return db.query.pages.findFirst({
    where: and(
      eq(pages.slug, slug),
      eq(pages.isArchived, false),
      isNotNull(pages.publishedRevisionId),
    ),
    with: {
      publishedRevision: {
        with: {
          blocks: {
            orderBy: [asc(pageBlocks.position)],
          },
        },
      },
    },
  });
}

export async function getEditablePageBySlug(db: Db, slug: string) {
  return db.query.pages.findFirst({
    where: and(eq(pages.slug, slug), eq(pages.isArchived, false)),
    with: {
      currentDraftRevision: {
        with: {
          blocks: {
            orderBy: [asc(pageBlocks.position)],
          },
        },
      },
      publishedRevision: {
        with: {
          blocks: {
            orderBy: [asc(pageBlocks.position)],
          },
        },
      },
    },
  });
}

export async function listPages(db: Db) {
  return db
    .select({
      id: pages.id,
      slug: pages.slug,
      title: pages.title,
      pageKind: pages.pageKind,
      isHomepage: pages.isHomepage,
      isArchived: pages.isArchived,
      updatedAt: pages.updatedAt,
      publishedRevisionId: pages.publishedRevisionId,
      currentDraftRevisionId: pages.currentDraftRevisionId,
    })
    .from(pages)
    .orderBy(desc(pages.updatedAt));
}

export async function getLatestRevisionNumber(db: Db, pageId: string) {
  const rows = await db
    .select({ revisionNumber: pageRevisions.revisionNumber })
    .from(pageRevisions)
    .where(eq(pageRevisions.pageId, pageId))
    .orderBy(desc(pageRevisions.revisionNumber))
    .limit(1);

  return rows[0]?.revisionNumber ?? 0;
}

export async function getRevisionWithBlocks(db: Db, revisionId: string) {
  return db.query.pageRevisions.findFirst({
    where: eq(pageRevisions.id, revisionId),
    with: {
      blocks: {
        orderBy: [asc(pageBlocks.position)],
      },
    },
  });
}

export async function getPageRevisions(db: Db, pageId: string) {
  return db
    .select()
    .from(pageRevisions)
    .where(eq(pageRevisions.pageId, pageId))
    .orderBy(desc(pageRevisions.revisionNumber));
}

export async function createPageSkeleton(db: Db, input: CreatePageInput) {
  const [page] = await db
    .insert(pages)
    .values({
      slug: input.slug,
      title: input.title,
      pageKind: input.pageKind ?? "content",
      createdBy: input.createdBy ?? null,
      isHomepage: input.isHomepage ?? false,
    })
    .returning();

  return page;
}

export async function createDraftRevision(db: Db, input: CreateDraftRevisionInput) {
  const nextRevisionNumber = (await getLatestRevisionNumber(db, input.pageId)) + 1;

  const [revision] = await db
    .insert(pageRevisions)
    .values({
      pageId: input.pageId,
      revisionNumber: nextRevisionNumber,
      status: "draft",
      title: input.title,
      seoTitle: input.seoTitle ?? null,
      seoDescription: input.seoDescription ?? null,
      canonicalPath: input.canonicalPath ?? null,
      notes: input.notes ?? null,
      createdBy: input.createdBy ?? null,
    })
    .returning();

  return revision;
}

export async function setCurrentDraftRevision(db: Db, pageId: string, revisionId: string) {
  await db
    .update(pages)
    .set({
      currentDraftRevisionId: revisionId,
      updatedAt: new Date(),
    })
    .where(eq(pages.id, pageId));
}

export async function setPublishedRevision(db: Db, pageId: string, revisionId: string) {
  await db
    .update(pageRevisions)
    .set({
      status: "published",
      publishedAt: new Date(),
      updatedAt: new Date(),
    })
    .where(eq(pageRevisions.id, revisionId));

  await db
    .update(pages)
    .set({
      publishedRevisionId: revisionId,
      currentDraftRevisionId: null,
      updatedAt: new Date(),
    })
    .where(eq(pages.id, pageId));
}

export async function insertPageBlock(
  db: Db,
  input: {
    revisionId: string;
    blockType: string;
    position: number;
    data?: PageBlockData;
    settings?: PageBlockSettings;
    isHidden?: boolean;
  },
) {
  const [block] = await db
    .insert(pageBlocks)
    .values({
      revisionId: input.revisionId,
      blockType: input.blockType,
      position: input.position,
      data: input.data ?? {},
      settings: input.settings ?? {},
      isHidden: input.isHidden ?? false,
    })
    .returning();

  return block;
}

export async function duplicatePageBlock(db: Db, blockId: string) {
  const source = await db.query.pageBlocks.findFirst({
    where: eq(pageBlocks.id, blockId),
  });

  if (!source) {
    return null;
  }

  const [copy] = await db
    .insert(pageBlocks)
    .values({
      revisionId: source.revisionId,
      blockType: source.blockType,
      position: source.position + 1,
      data: source.data,
      settings: source.settings,
      isHidden: source.isHidden,
    })
    .returning();

  return copy;
}

export async function movePageBlock(
  db: Db,
  blockId: string,
  nextPosition: number,
) {
  const [block] = await db
    .update(pageBlocks)
    .set({
      position: nextPosition,
      updatedAt: new Date(),
    })
    .where(eq(pageBlocks.id, blockId))
    .returning();

  return block;
}

export async function togglePageBlockVisibility(db: Db, blockId: string, hidden: boolean) {
  const [block] = await db
    .update(pageBlocks)
    .set({
      isHidden: hidden,
      updatedAt: new Date(),
    })
    .where(eq(pageBlocks.id, blockId))
    .returning();

  return block;
}

export async function deletePageBlock(db: Db, blockId: string) {
  const [block] = await db.delete(pageBlocks).where(eq(pageBlocks.id, blockId)).returning();
  return block ?? null;
}

export async function getMediaAssetById(db: Db, assetId: string) {
  return db.query.mediaAssets.findFirst({
    where: eq(mediaAssets.id, assetId),
  });
}

export async function listPublicMediaAssets(db: Db) {
  return db
    .select()
    .from(mediaAssets)
    .where(eq(mediaAssets.isPublic, true))
    .orderBy(desc(mediaAssets.createdAt));
}

export async function createMediaUsage(
  db: Db,
  input: {
    mediaAssetId: string;
    entityType: string;
    entityId: string;
    fieldName: string;
    usageContext?: string | null;
  },
) {
  const [usage] = await db
    .insert(mediaUsages)
    .values({
      mediaAssetId: input.mediaAssetId,
      entityType: input.entityType,
      entityId: input.entityId,
      fieldName: input.fieldName,
      usageContext: input.usageContext ?? null,
    })
    .returning();

  return usage;
}

export async function removeMediaUsage(
  db: Db,
  mediaAssetId: string,
  entityType: string,
  entityId: string,
  fieldName: string,
) {
  const [usage] = await db
    .delete(mediaUsages)
    .where(
      and(
        eq(mediaUsages.mediaAssetId, mediaAssetId),
        eq(mediaUsages.entityType, entityType),
        eq(mediaUsages.entityId, entityId),
        eq(mediaUsages.fieldName, fieldName),
      ),
    )
    .returning();

  return usage ?? null;
}

export async function acquireDraftLock(
  db: Db,
  input: {
    pageId: string;
    lockedBy: string;
    expiresAt: Date;
  },
) {
  const [lock] = await db
    .insert(pageDraftLocks)
    .values({
      pageId: input.pageId,
      lockedBy: input.lockedBy,
      expiresAt: input.expiresAt,
    })
    .onConflictDoUpdate({
      target: pageDraftLocks.pageId,
      set: {
        lockedBy: input.lockedBy,
        expiresAt: input.expiresAt,
        lockedAt: new Date(),
      },
    })
    .returning();

  return lock;
}

export async function releaseDraftLock(db: Db, pageId: string) {
  const [lock] = await db.delete(pageDraftLocks).where(eq(pageDraftLocks.pageId, pageId)).returning();
  return lock ?? null;
}

export async function listEditableEditors(db: Db) {
  return db
    .select()
    .from(appUsers)
    .where(and(eq(appUsers.isActive, true), inArray(appUsers.role, ["owner", "editor"])));
}

export async function listPageBlocks(db: Db, revisionId: string) {
  return db
    .select()
    .from(pageBlocks)
    .where(eq(pageBlocks.revisionId, revisionId))
    .orderBy(asc(pageBlocks.position));
}

export async function nextBlockPosition(db: Db, revisionId: string) {
  const rows = await db
    .select({ position: pageBlocks.position })
    .from(pageBlocks)
    .where(eq(pageBlocks.revisionId, revisionId))
    .orderBy(desc(pageBlocks.position))
    .limit(1);

  return (rows[0]?.position ?? 0) + 1;
}

export async function lockDraftForEditor(
  db: Db,
  pageId: string,
  lockedBy: string,
  durationMinutes = 30,
) {
  return acquireDraftLock(db, {
    pageId,
    lockedBy,
    expiresAt: new Date(Date.now() + durationMinutes * 60_000),
  });
}

export function isPublishedRevisionStatus(status: PageRevisionStatus) {
  return status === "published";
}

export function isPublicMediaKind(kind: MediaKind) {
  return kind === "image";
}
