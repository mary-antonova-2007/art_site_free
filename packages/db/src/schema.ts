import { relations, sql } from "drizzle-orm";
import {
  boolean,
  index,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";

export const appRoleEnum = pgEnum("app_role", ["owner", "editor", "viewer"]);
export const pageRevisionStatusEnum = pgEnum("page_revision_status", [
  "draft",
  "published",
  "archived",
]);
export const pageKindEnum = pgEnum("page_kind", [
  "content",
  "landing",
  "journal",
  "collection",
  "system",
]);
export const mediaKindEnum = pgEnum("media_kind", ["image"]);

export const appUsers = pgTable(
  "app_users",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    authUserId: uuid("auth_user_id").notNull().unique(),
    email: varchar("email", { length: 320 }).notNull().unique(),
    displayName: varchar("display_name", { length: 160 }),
    role: appRoleEnum("role").notNull().default("editor"),
    isActive: boolean("is_active").notNull().default(true),
    lastSeenAt: timestamp("last_seen_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    authUserIdIdx: uniqueIndex("app_users_auth_user_id_idx").on(table.authUserId),
    emailIdx: uniqueIndex("app_users_email_idx").on(table.email),
  }),
);

export const pages = pgTable(
  "pages",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    slug: varchar("slug", { length: 180 }).notNull(),
    title: varchar("title", { length: 240 }).notNull(),
    pageKind: pageKindEnum("page_kind").notNull().default("content"),
    parentId: uuid("parent_id"),
    seoTitle: varchar("seo_title", { length: 240 }),
    seoDescription: varchar("seo_description", { length: 500 }),
    ogImageAssetId: uuid("og_image_asset_id"),
    publishedRevisionId: uuid("published_revision_id"),
    currentDraftRevisionId: uuid("current_draft_revision_id"),
    isHomepage: boolean("is_homepage").notNull().default(false),
    isArchived: boolean("is_archived").notNull().default(false),
    createdBy: uuid("created_by").references(() => appUsers.id, { onDelete: "set null" }),
    updatedBy: uuid("updated_by").references(() => appUsers.id, { onDelete: "set null" }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
    archivedAt: timestamp("archived_at", { withTimezone: true }),
  },
  (table) => ({
    slugIdx: uniqueIndex("pages_slug_idx").on(table.slug),
    parentIdx: index("pages_parent_id_idx").on(table.parentId),
    homepageIdx: uniqueIndex("pages_homepage_true_idx")
      .on(table.isHomepage)
      .where(sql`${table.isHomepage} = true`),
  }),
);

export const siteSettings = pgTable("site_settings", {
  id: uuid("id").defaultRandom().primaryKey(),
  siteName: varchar("site_name", { length: 200 }).notNull(),
  defaultLocale: varchar("default_locale", { length: 12 }).notNull().default("en"),
  homepagePageId: uuid("homepage_page_id").references(() => pages.id, { onDelete: "set null" }),
  socialLinks: jsonb("social_links")
    .$type<Array<{ label: string; url: string }>>()
    .notNull()
    .default([]),
  contactEmail: varchar("contact_email", { length: 320 }),
  contactPhone: varchar("contact_phone", { length: 40 }),
  metadata: jsonb("metadata").$type<Record<string, unknown>>().notNull().default({}),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const pageRevisions = pgTable(
  "page_revisions",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    pageId: uuid("page_id")
      .notNull()
      .references(() => pages.id, { onDelete: "cascade" }),
    revisionNumber: integer("revision_number").notNull(),
    status: pageRevisionStatusEnum("status").notNull().default("draft"),
    title: varchar("title", { length: 240 }).notNull(),
    seoTitle: varchar("seo_title", { length: 240 }),
    seoDescription: varchar("seo_description", { length: 500 }),
    canonicalPath: varchar("canonical_path", { length: 200 }),
    notes: text("notes"),
    publishedAt: timestamp("published_at", { withTimezone: true }),
    createdBy: uuid("created_by").references(() => appUsers.id, { onDelete: "set null" }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    revisionNumberIdx: uniqueIndex("page_revisions_page_id_revision_number_idx").on(
      table.pageId,
      table.revisionNumber,
    ),
    pageStatusIdx: index("page_revisions_page_id_status_idx").on(table.pageId, table.status),
  }),
);

export const pageBlocks = pgTable(
  "page_blocks",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    revisionId: uuid("revision_id")
      .notNull()
      .references(() => pageRevisions.id, { onDelete: "cascade" }),
    blockType: varchar("block_type", { length: 80 }).notNull(),
    position: integer("position").notNull(),
    isHidden: boolean("is_hidden").notNull().default(false),
    data: jsonb("data").$type<Record<string, unknown>>().notNull().default({}),
    settings: jsonb("settings").$type<Record<string, unknown>>().notNull().default({}),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    revisionPositionIdx: uniqueIndex("page_blocks_revision_id_position_idx").on(
      table.revisionId,
      table.position,
    ),
    revisionIdx: index("page_blocks_revision_id_idx").on(table.revisionId),
    typeIdx: index("page_blocks_block_type_idx").on(table.blockType),
  }),
);

export const mediaAssets = pgTable(
  "media_assets",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    storageBucket: varchar("storage_bucket", { length: 120 }).notNull(),
    storagePath: text("storage_path").notNull().unique(),
    kind: mediaKindEnum("kind").notNull().default("image"),
    mimeType: varchar("mime_type", { length: 120 }).notNull(),
    fileName: varchar("file_name", { length: 255 }),
    width: integer("width"),
    height: integer("height"),
    sizeBytes: integer("size_bytes"),
    alt: varchar("alt", { length: 500 }),
    caption: text("caption"),
    category: varchar("category", { length: 120 }),
    focalX: integer("focal_x"),
    focalY: integer("focal_y"),
    checksum: varchar("checksum", { length: 128 }),
    uploadedBy: uuid("uploaded_by").references(() => appUsers.id, { onDelete: "set null" }),
    isPublic: boolean("is_public").notNull().default(false),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    bucketIdx: index("media_assets_storage_bucket_idx").on(table.storageBucket),
    publicIdx: index("media_assets_is_public_idx").on(table.isPublic),
  }),
);

export const mediaUsages = pgTable(
  "media_usages",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    mediaAssetId: uuid("media_asset_id")
      .notNull()
      .references(() => mediaAssets.id, { onDelete: "cascade" }),
    entityType: varchar("entity_type", { length: 80 }).notNull(),
    entityId: uuid("entity_id").notNull(),
    fieldName: varchar("field_name", { length: 80 }).notNull(),
    usageContext: varchar("usage_context", { length: 80 }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    mediaEntityFieldIdx: uniqueIndex("media_usages_entity_field_idx").on(
      table.mediaAssetId,
      table.entityType,
      table.entityId,
      table.fieldName,
    ),
    mediaIdx: index("media_usages_media_asset_id_idx").on(table.mediaAssetId),
    entityIdx: index("media_usages_entity_idx").on(table.entityType, table.entityId),
  }),
);

export const pageDraftLocks = pgTable(
  "page_draft_locks",
  {
    pageId: uuid("page_id")
      .primaryKey()
      .references(() => pages.id, { onDelete: "cascade" }),
    lockedBy: uuid("locked_by")
      .notNull()
      .references(() => appUsers.id, { onDelete: "cascade" }),
    lockedAt: timestamp("locked_at", { withTimezone: true }).notNull().defaultNow(),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  },
  (table) => ({
    lockedByIdx: index("page_draft_locks_locked_by_idx").on(table.lockedBy),
  }),
);

export const pagesRelations = relations(pages, ({ one, many }) => ({
  parent: one(pages, {
    fields: [pages.parentId],
    references: [pages.id],
    relationName: "pageParent",
  }),
  createdByUser: one(appUsers, {
    fields: [pages.createdBy],
    references: [appUsers.id],
    relationName: "pageCreatedBy",
  }),
  updatedByUser: one(appUsers, {
    fields: [pages.updatedBy],
    references: [appUsers.id],
    relationName: "pageUpdatedBy",
  }),
  revisions: many(pageRevisions),
  publishedRevision: one(pageRevisions, {
    fields: [pages.publishedRevisionId],
    references: [pageRevisions.id],
    relationName: "pagePublishedRevision",
  }),
  currentDraftRevision: one(pageRevisions, {
    fields: [pages.currentDraftRevisionId],
    references: [pageRevisions.id],
    relationName: "pageCurrentDraftRevision",
  }),
}));

export const pageRevisionsRelations = relations(pageRevisions, ({ one, many }) => ({
  page: one(pages, {
    fields: [pageRevisions.pageId],
    references: [pages.id],
  }),
  createdByUser: one(appUsers, {
    fields: [pageRevisions.createdBy],
    references: [appUsers.id],
  }),
  blocks: many(pageBlocks),
}));

export const pageBlocksRelations = relations(pageBlocks, ({ one }) => ({
  revision: one(pageRevisions, {
    fields: [pageBlocks.revisionId],
    references: [pageRevisions.id],
  }),
}));

export const mediaAssetsRelations = relations(mediaAssets, ({ one, many }) => ({
  uploadedByUser: one(appUsers, {
    fields: [mediaAssets.uploadedBy],
    references: [appUsers.id],
  }),
  usages: many(mediaUsages),
}));

export const mediaUsagesRelations = relations(mediaUsages, ({ one }) => ({
  mediaAsset: one(mediaAssets, {
    fields: [mediaUsages.mediaAssetId],
    references: [mediaAssets.id],
  }),
}));

export type AppRole = (typeof appRoleEnum.enumValues)[number];
export type PageRevisionStatus = (typeof pageRevisionStatusEnum.enumValues)[number];
export type PageKind = (typeof pageKindEnum.enumValues)[number];
export type MediaKind = (typeof mediaKindEnum.enumValues)[number];

export type PageBlockData = Record<string, unknown>;
export type PageBlockSettings = Record<string, unknown>;
