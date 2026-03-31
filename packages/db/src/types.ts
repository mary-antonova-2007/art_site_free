export type AppRole = "owner" | "editor" | "viewer";

export type PageRevisionStatus = "draft" | "published" | "archived";

export type PageKind = "content" | "landing" | "journal" | "collection" | "system";

export type MediaKind = "image";

export type DraftPublishState = "draft" | "published" | "archived";

export type ContentEntityType =
  | "page"
  | "page_revision"
  | "page_block"
  | "media_asset"
  | "work"
  | "series"
  | "exhibition"
  | "journal_post";

