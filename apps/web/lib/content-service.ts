import "server-only";

import { createDefaultBlock, validateBlock, type BlockType } from "@artsite/blocks";

import {
  createDemoMediaAsset,
  createDemoPage,
  getDemoPageBySlug,
  listDemoMediaLibrary,
  listDemoPages,
  type MediaCategory,
  type MediaLibraryAsset,
  publishDemoPage,
  sanitizeSlug,
  saveDemoPage,
  type SiteBlockRecord,
  type SitePageRecord
} from "./content";
import { canUseEditor, getEditorIdentity } from "./auth";
import { createAdminSupabaseClient, hasSupabaseEnv } from "./supabase/admin";

const PUBLIC_BUCKET = process.env.SUPABASE_PUBLIC_BUCKET ?? "site-public";

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

export async function getPageForRequest(slug: string, editorRequested: boolean) {
  const editorEnabled = await canUseEditor(editorRequested);

  if (!hasSupabaseEnv()) {
    const page = getDemoPageBySlug(slug);
    return {
      page,
      editorEnabled
    };
  }

  const page = await getSupabasePageBySlug(slug, editorEnabled);

  return {
    page,
    editorEnabled
  };
}

export async function savePageDraft(input: {
  pageId: string;
  title: string;
  blocks: SiteBlockRecord[];
}) {
  if (!hasSupabaseEnv()) {
    return saveDemoPage(input);
  }

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
    (await createDraftRevisionFromCurrent(admin, {
      pageId: page.id,
      title: input.title || page.title,
      sourceRevisionId: page.published_revision_id
    }));

  const { error: revisionUpdateError } = await admin
    .from("page_revisions")
    .update({
      title: input.title || page.title,
      updated_at: new Date().toISOString()
    })
    .eq("id", revisionId);

  if (revisionUpdateError) {
    throw revisionUpdateError;
  }

  const { error: deleteError } = await admin.from("page_blocks").delete().eq("revision_id", revisionId);

  if (deleteError) {
    throw deleteError;
  }

  const { error: insertError } = await admin.from("page_blocks").insert(
    blocks.map((block, index) => ({
      revision_id: revisionId,
      block_type: block.blockType,
      position: index,
      is_hidden: block.isHidden,
      data: block.data,
      settings: {}
    }))
  );

  if (insertError) {
    throw insertError;
  }

  const { error: pageUpdateError } = await admin
    .from("pages")
    .update({
      title: input.title || page.title,
      current_draft_revision_id: revisionId,
      updated_at: new Date().toISOString()
    })
    .eq("id", page.id);

  if (pageUpdateError) {
    throw pageUpdateError;
  }

  return await getSupabasePageById(page.id, true);
}

export async function publishPageChanges(input: {
  pageId: string;
  title: string;
  blocks: SiteBlockRecord[];
}) {
  if (!hasSupabaseEnv()) {
    saveDemoPage(input);
    return publishDemoPage(input.pageId);
  }

  const savedPage = await savePageDraft(input);

  if (!savedPage) {
    throw new Error("Draft save failed");
  }

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

  const { error: publishError } = await admin
    .from("page_revisions")
    .update({
      status: "published",
      published_at: now,
      updated_at: now
    })
    .eq("id", page.current_draft_revision_id);

  if (publishError) {
    throw publishError;
  }

  const { error: pageUpdateError } = await admin
    .from("pages")
    .update({
      published_revision_id: page.current_draft_revision_id,
      current_draft_revision_id: null,
      updated_at: now
    })
    .eq("id", input.pageId);

  if (pageUpdateError) {
    throw pageUpdateError;
  }

  return await getSupabasePageById(input.pageId, false);
}

export async function createPageRecord(input: { title: string; slug: string }) {
  if (!hasSupabaseEnv()) {
    return createDemoPage(input);
  }

  const editor = await getEditorIdentity();

  if (!editor) {
    throw new Error("Unauthorized");
  }

  const admin = createAdminSupabaseClient();
  const safeSlug = sanitizeSlug(input.slug || input.title);
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
    .select("id, slug, title")
    .single();

  if (pageError || !page) {
    throw pageError ?? new Error("Page create failed");
  }

  const { data: maxRevisionRows } = await admin
    .from("page_revisions")
    .select("revision_number")
    .eq("page_id", page.id)
    .order("revision_number", { ascending: false })
    .limit(1);

  const revisionNumber = (maxRevisionRows?.[0]?.revision_number ?? 0) + 1;

  const { data: revision, error: revisionError } = await admin
    .from("page_revisions")
    .insert({
      page_id: page.id,
      revision_number: revisionNumber,
      status: "draft",
      title: page.title,
      created_at: now,
      updated_at: now
    })
    .select("id")
    .single();

  if (revisionError || !revision) {
    throw revisionError ?? new Error("Revision create failed");
  }

  const starterBlocks = [block("hero", 0), block("richText", 1), block("cta", 2)];

  await admin.from("page_blocks").insert(
    starterBlocks.map((item, index) => ({
      revision_id: revision.id,
      block_type: item.blockType,
      position: index,
      is_hidden: item.isHidden,
      data: item.data,
      settings: {}
    }))
  );

  await admin
    .from("pages")
    .update({
      current_draft_revision_id: revision.id,
      updated_at: now
    })
    .eq("id", page.id);

  return await getSupabasePageById(page.id, true);
}

export async function uploadEditorImage(input: {
  pageId: string;
  fileName: string;
  fileType: string;
  data: ArrayBuffer;
  category?: MediaCategory;
}) {
  if (!hasSupabaseEnv()) {
    const mimeType = input.fileType || "image/png";
    const base64 = Buffer.from(input.data).toString("base64");
    const dataUrl = `data:${mimeType};base64,${base64}`;

    const asset = createDemoMediaAsset({
      fileName: input.fileName,
      category: input.category,
      previewUrl: dataUrl
    });

    return {
      mediaAssetId: asset.mediaAssetId,
      publicUrl: asset.previewUrl,
      recordId: asset.id,
      asset
    };
  }

  const editor = await getEditorIdentity();

  if (!editor) {
    throw new Error("Unauthorized");
  }

  const admin = createAdminSupabaseClient();
  const safeName = `${Date.now()}-${input.fileName.replace(/[^a-zA-Z0-9.\-_]/g, "-")}`;
  const path = `${input.pageId}/${safeName}`;

  const { error: uploadError } = await admin.storage
    .from(PUBLIC_BUCKET)
    .upload(path, input.data, {
      contentType: input.fileType,
      upsert: false
    });

  if (uploadError) {
    throw uploadError;
  }

  const {
    data: { publicUrl }
  } = admin.storage.from(PUBLIC_BUCKET).getPublicUrl(path);

  const { data: mediaAsset, error: assetError } = await admin
    .from("media_assets")
    .insert({
      storage_bucket: PUBLIC_BUCKET,
      storage_path: path,
      kind: "image",
      mime_type: input.fileType,
      file_name: input.fileName,
      is_public: true
    })
    .select("id")
    .single();

  if (assetError) {
    throw assetError;
  }

  return {
    mediaAssetId: publicUrl,
    publicUrl,
    recordId: mediaAsset.id,
    asset: {
      id: mediaAsset.id,
      mediaAssetId: publicUrl,
      previewUrl: publicUrl,
      title: input.fileName,
      alt: input.fileName,
      category: input.category ?? "uploaded"
    } satisfies MediaLibraryAsset
  };
}

export async function listEditorMediaLibrary(): Promise<MediaLibraryAsset[]> {
  if (!hasSupabaseEnv()) {
    return listDemoMediaLibrary();
  }

  const editor = await getEditorIdentity();

  if (!editor) {
    throw new Error("Unauthorized");
  }

  const admin = createAdminSupabaseClient();
  const { data, error } = await admin
    .from("media_assets")
    .select("id, storage_bucket, storage_path, file_name, alt, caption, is_public")
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
      title: String(asset.file_name ?? asset.alt ?? asset.caption ?? "Untitled image"),
      alt: String(asset.alt ?? asset.file_name ?? "Image"),
      category: inferMediaCategory(String(asset.storage_path))
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

  return await hydratePage(admin, page, includeDraft);
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

  return await hydratePage(admin, page, includeDraft);
}

async function hydratePage(admin: ReturnType<typeof createAdminSupabaseClient>, page: RawPageRow, includeDraft: boolean) {
  const revisionId =
    includeDraft && page.current_draft_revision_id
      ? page.current_draft_revision_id
      : page.published_revision_id ?? page.current_draft_revision_id;

  if (!revisionId) {
    return {
      id: page.id,
      slug: page.slug,
      title: page.title,
      source: "supabase",
      availablePages: await getSupabasePageList(admin),
      blocks: []
    } satisfies SitePageRecord;
  }

  const { data: blocks, error: blocksError } = await admin
    .from("page_blocks")
    .select("id, block_type, position, is_hidden, data")
    .eq("revision_id", revisionId)
    .order("position", { ascending: true });

  if (blocksError) {
    throw blocksError;
  }

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
  const { data } = await admin.from("pages").select("id, slug, title").order("slug");
  return (data ?? []) as Array<{ id: string; slug: string; title: string }>;
}

function inferMediaCategory(storagePath: string): MediaCategory {
  const path = storagePath.toLowerCase();

  if (path.includes("portrait")) {
    return "portraits";
  }

  if (path.includes("detail")) {
    return "details";
  }

  if (path.includes("space")) {
    return "spaces";
  }

  if (path.includes("hero") || path.includes("cover")) {
    return "featured";
  }

  if (path.includes("upload")) {
    return "uploaded";
  }

  return "works";
}

async function createDraftRevisionFromCurrent(
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
