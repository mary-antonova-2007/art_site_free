"use client";

import { createContext, useContext, useEffect, useMemo, useRef, useState } from "react";
import type { ReactNode } from "react";
import type { Dispatch, SetStateAction } from "react";
import { useRouter } from "next/navigation";

import { getBlockDefinition, type BlockType } from "@artsite/blocks";

import { getBlockAnchorId } from "@/lib/block-navigation";
import { useTranslations } from "@/lib/i18n/client";
import type { MediaCategory, MediaLibraryAsset, PageSeo, SiteBlockRecord, SitePageRecord } from "@/lib/content";

type EditorContextValue = {
  enabled: boolean;
  page: SitePageRecord;
  blocks: SiteBlockRecord[];
  pageSeo: PageSeo;
  compactNavigation: boolean;
  setCompactNavigation: Dispatch<SetStateAction<boolean>>;
  activeBlockId: string | null;
  setActiveBlockId: (id: string | null) => void;
  updateBlockField: (blockId: string, field: string, value: unknown) => void;
  updatePageSeo: (seo: PageSeo) => void;
  insertBlockAt: (index: number, type: BlockType) => void;
  moveBlock: (blockId: string, direction: "up" | "down") => void;
  moveBlockToIndex: (blockId: string, index: number) => void;
  duplicateBlock: (blockId: string) => void;
  removeBlock: (blockId: string) => void;
  toggleHidden: (blockId: string) => void;
  createPage: (input: { title: string; slug: string }) => Promise<boolean>;
  renamePage: (input: { pageId: string; title: string }) => Promise<boolean>;
  deletePage: (pageId: string) => Promise<boolean>;
  reorderPages: (pageIds: string[]) => Promise<boolean>;
  pages: Array<{ id: string; slug: string; title: string }>;
  draftState: "published" | "dirty";
  statusMessage: string | null;
  lastSavedAt: string | null;
  saveDraft: () => Promise<void>;
  publish: () => Promise<void>;
  replaceBlockMedia: (blockId: string, file: File) => Promise<void>;
  moveBlockMediaItem: (blockId: string, index: number, direction: "up" | "down") => void;
  removeBlockMediaItem: (blockId: string, index: number) => void;
  updateBlockMediaItemMeta: (
    blockId: string,
    index: number,
    patch: { caption?: string; alt?: string }
  ) => void;
  mediaLibraryMode: "replace" | "append";
  selectMediaAsset: (blockId: string, asset: MediaLibraryAsset) => void;
  mediaLibraryAssets: MediaLibraryAsset[];
  mediaLibraryCategories: MediaCategory[];
  mediaLibraryOpenForBlockId: string | null;
  mediaLibraryCategory: MediaCategory;
  openMediaLibrary: (blockId: string, mode?: "replace" | "append") => Promise<void>;
  closeMediaLibrary: () => void;
  setMediaLibraryCategory: (category: MediaCategory) => void;
  panelOpen: boolean;
  seoPanelOpen: boolean;
  openPanel: () => void;
  closePanel: () => void;
  togglePanel: () => void;
  openSeoPanel: () => void;
  closeSeoPanel: () => void;
  blockLibraryOpen: boolean;
  openBlockLibrary: () => void;
  closeBlockLibrary: () => void;
  toggleBlockLibrary: () => void;
  createPageOpen: boolean;
  openCreatePage: () => void;
  closeCreatePage: () => void;
};

const EditorContext = createContext<EditorContextValue | null>(null);

export function EditorProvider({
  children,
  page,
  enabled
}: {
  children: ReactNode;
  page: SitePageRecord;
  enabled: boolean;
}) {
  const t = useTranslations();
  const router = useRouter();
  const [blocks, setBlocks] = useState(page.blocks);
  const [pageSeo, setPageSeo] = useState(page.seo);
  const [compactNavigation, setCompactNavigation] = useState(false);
  const [activeBlockId, setActiveBlockId] = useState<string | null>(null);
  const [pages, setPages] = useState(page.availablePages);
  const [draftState, setDraftState] = useState<"published" | "dirty">(
    enabled ? "dirty" : "published"
  );
  const [statusMessage, setStatusMessage] = useState<string | null>(
    enabled ? t("editor.draftReady") : null
  );
  const [lastSavedAt, setLastSavedAt] = useState<string | null>(null);
  const [mediaLibraryAssets, setMediaLibraryAssets] = useState<MediaLibraryAsset[]>([]);
  const [mediaLibraryCategories, setMediaLibraryCategories] = useState<MediaCategory[]>([]);
  const [mediaLibraryOpenForBlockId, setMediaLibraryOpenForBlockId] = useState<string | null>(null);
  const [mediaLibraryMode, setMediaLibraryMode] = useState<"replace" | "append">("replace");
  const [mediaLibraryCategory, setMediaLibraryCategoryState] = useState<MediaCategory>("featured");
  const [panelOpen, setPanelOpen] = useState(false);
  const [seoPanelOpen, setSeoPanelOpen] = useState(false);
  const [blockLibraryOpen, setBlockLibraryOpen] = useState(false);
  const [createPageOpen, setCreatePageOpen] = useState(false);
  const mediaLibraryRequestRef = useRef<Promise<void> | null>(null);
  const pendingScrollBlockIdRef = useRef<string | null>(null);

  useEffect(() => {
    setBlocks(page.blocks);
    setPageSeo(page.seo);
    setPages(page.availablePages);
    setActiveBlockId(null);
  }, [page.id, page.blocks, page.seo, page.availablePages]);

  useEffect(() => {
    if (!pendingScrollBlockIdRef.current || typeof window === "undefined") {
      return;
    }

    const targetBlockId = pendingScrollBlockIdRef.current;
    const frame = window.requestAnimationFrame(() => {
      document
        .getElementById(getBlockAnchorId(targetBlockId))
        ?.scrollIntoView({ behavior: "smooth", block: "center" });
      pendingScrollBlockIdRef.current = null;
    });

    return () => window.cancelAnimationFrame(frame);
  }, [blocks]);

  const value = useMemo<EditorContextValue>(
    () => ({
      enabled,
      page,
      blocks,
      pageSeo,
      compactNavigation,
      setCompactNavigation,
      activeBlockId,
      setActiveBlockId,
      pages,
      draftState,
      statusMessage,
      lastSavedAt,
      mediaLibraryAssets,
      mediaLibraryCategories,
      mediaLibraryOpenForBlockId,
      mediaLibraryMode,
      mediaLibraryCategory,
      panelOpen,
      seoPanelOpen,
      blockLibraryOpen,
      createPageOpen,
      async openMediaLibrary(blockId, mode = "replace") {
        setMediaLibraryOpenForBlockId(blockId);
        setMediaLibraryMode(mode);

        if (mediaLibraryAssets.length > 0) {
          setStatusMessage(t("media.libraryReady"));
          return;
        }

        if (mediaLibraryRequestRef.current) {
          await mediaLibraryRequestRef.current;
          return;
        }

        setStatusMessage(t("media.libraryLoading"));

        mediaLibraryRequestRef.current = (async () => {
          const response = await fetch("/api/editor/media");
          const payload = (await response.json()) as {
            assets?: MediaLibraryAsset[];
            categories?: MediaCategory[];
            error?: string;
          };

          if (!response.ok) {
            setStatusMessage(payload.error ?? t("media.libraryLoadFailed"));
            return;
          }

          setMediaLibraryAssets(payload.assets ?? []);
          setMediaLibraryCategories(payload.categories ?? []);
          setStatusMessage(t("media.libraryReady"));
        })();

        try {
          await mediaLibraryRequestRef.current;
        } finally {
          mediaLibraryRequestRef.current = null;
        }
      },
      closeMediaLibrary() {
        setMediaLibraryOpenForBlockId(null);
      },
      setMediaLibraryCategory(category) {
        setMediaLibraryCategoryState(category);
      },
      openPanel() {
        setPanelOpen(true);
        setSeoPanelOpen(false);
      },
      closePanel() {
        setPanelOpen(false);
      },
      togglePanel() {
        setPanelOpen((current) => {
          const next = !current;
          if (next) setSeoPanelOpen(false);
          return next;
        });
      },
      openSeoPanel() {
        setSeoPanelOpen(true);
        setPanelOpen(false);
      },
      closeSeoPanel() {
        setSeoPanelOpen(false);
      },
      openBlockLibrary() {
        setBlockLibraryOpen(true);
      },
      closeBlockLibrary() {
        setBlockLibraryOpen(false);
      },
      toggleBlockLibrary() {
        setBlockLibraryOpen((current) => !current);
      },
      openCreatePage() {
        setCreatePageOpen(true);
      },
      closeCreatePage() {
        setCreatePageOpen(false);
      },
      updateBlockField(blockId, field, value) {
        setBlocks((current) =>
          current.map((block) =>
            block.id === blockId
              ? {
                  ...block,
                  data: {
                    ...block.data,
                    [field]:
                      Array.isArray((block.data as Record<string, unknown>)[field]) &&
                      typeof value === "string"
                        ? value
                            .split("\n")
                            .map((entry) => entry.trim())
                            .filter(Boolean)
                        : value
                  }
                }
              : block
          )
        );
        setDraftState("dirty");
        setStatusMessage(t("editor.unpublishedChanges"));
      },
      updatePageSeo(seo) {
        setPageSeo(seo);
        setDraftState("dirty");
        setStatusMessage(t("editor.unpublishedChanges"));
      },
      insertBlockAt(index, type) {
        const definition = getBlockDefinition(type);
        const nextBlock: SiteBlockRecord = {
          id: `${type}-${crypto.randomUUID()}`,
          blockType: type,
          isHidden: false,
          position: index,
          data: definition.createDefault()
        };

        setBlocks((current) => {
          const cloned = [...current];
          const safeIndex = Math.max(0, Math.min(index, cloned.length));
          cloned.splice(safeIndex, 0, nextBlock);
          return cloned.map((item, itemIndex) => ({ ...item, position: itemIndex }));
        });
        pendingScrollBlockIdRef.current = nextBlock.id;
        setActiveBlockId(nextBlock.id);
        setPanelOpen(true);
        setBlockLibraryOpen(false);
        setDraftState("dirty");
        setStatusMessage(t("editor.unpublishedChanges"));
      },
      moveBlock(blockId, direction) {
        setBlocks((current) => {
          const index = current.findIndex((block) => block.id === blockId);

          if (index === -1) {
            return current;
          }

          const targetIndex = direction === "up" ? index - 1 : index + 1;

          if (targetIndex < 0 || targetIndex >= current.length) {
            return current;
          }

          const cloned = [...current];
          const [item] = cloned.splice(index, 1);
          cloned.splice(targetIndex, 0, item);
          return cloned.map((block, itemIndex) => ({ ...block, position: itemIndex }));
        });
        pendingScrollBlockIdRef.current = blockId;
        setActiveBlockId(blockId);
        setDraftState("dirty");
        setStatusMessage(t("editor.unpublishedChanges"));
      },
      moveBlockToIndex(blockId, index) {
        setBlocks((current) => {
          const currentIndex = current.findIndex((block) => block.id === blockId);

          if (currentIndex === -1) {
            return current;
          }

          const safeIndex = Math.max(0, Math.min(index, current.length - 1));

          if (safeIndex === currentIndex) {
            return current;
          }

          const cloned = [...current];
          const [item] = cloned.splice(currentIndex, 1);
          cloned.splice(safeIndex, 0, item);
          return cloned.map((block, itemIndex) => ({ ...block, position: itemIndex }));
        });
        pendingScrollBlockIdRef.current = blockId;
        setActiveBlockId(blockId);
        setDraftState("dirty");
        setStatusMessage(t("editor.unpublishedChanges"));
      },
      duplicateBlock(blockId) {
        const duplicateId = `${blockId}-copy-${crypto.randomUUID()}`;
        setBlocks((current) => {
          const index = current.findIndex((block) => block.id === blockId);

          if (index === -1) {
            return current;
          }

          const next = [...current];
          const original = next[index];
          next.splice(index + 1, 0, {
            ...original,
            id: duplicateId
          });
          return next.map((block, itemIndex) => ({ ...block, position: itemIndex }));
        });
        setDraftState("dirty");
        setStatusMessage(t("editor.unpublishedChanges"));
        pendingScrollBlockIdRef.current = duplicateId;
        setActiveBlockId(duplicateId);
        setPanelOpen(true);
      },
      removeBlock(blockId) {
        setBlocks((current) =>
          current
            .filter((block) => block.id !== blockId)
            .map((block, itemIndex) => ({ ...block, position: itemIndex }))
        );
        setActiveBlockId((current) => (current === blockId ? null : current));
        setDraftState("dirty");
        setStatusMessage(t("editor.unpublishedChanges"));
      },
      toggleHidden(blockId) {
        setBlocks((current) =>
          current.map((block) =>
            block.id === blockId ? { ...block, isHidden: !block.isHidden } : block
          )
        );
        setDraftState("dirty");
        setStatusMessage(t("editor.unpublishedChanges"));
      },
      async createPage(input) {
        setStatusMessage(t("editor.creatingPage"));

        const response = await fetch("/api/editor/pages", {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify(input)
        });

        const payload = (await response.json()) as {
          page?: { id: string; title: string; slug: string };
          error?: string;
        };

        if (!response.ok || !payload.page) {
          setStatusMessage(payload.error ?? t("editor.pageCreateFailed"));
          return false;
        }

        const createdPage = payload.page;

        setPages((current) => [
          ...current,
          {
            id: createdPage.id,
            title: createdPage.title,
            slug: createdPage.slug
          }
        ]);
        setDraftState("dirty");
        setCreatePageOpen(false);
        setStatusMessage(t("editor.pageCreated", { title: createdPage.title }));

        if (typeof window !== "undefined") {
          window.location.assign(`/${createdPage.slug}?editor=1`);
        }

        return true;
      },
      async renamePage(input) {
        setStatusMessage(t("editor.renamingPage"));

        const response = await fetch(`/api/editor/pages/${input.pageId}`, {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            title: input.title
          })
        });

        const payload = (await response.json()) as {
          pages?: Array<{ id: string; slug: string; title: string }>;
          error?: string;
        };

        if (!response.ok || !payload.pages) {
          setStatusMessage(payload.error ?? t("editor.pageRenameFailed"));
          return false;
        }

        setPages(payload.pages);
        setStatusMessage(t("editor.pageRenamed"));
        router.refresh();
        return true;
      },
      async deletePage(pageId) {
        setStatusMessage(t("editor.deletingPage"));

        const response = await fetch(`/api/editor/pages/${pageId}`, {
          method: "DELETE"
        });

        const payload = (await response.json()) as {
          pages?: Array<{ id: string; slug: string; title: string }>;
          error?: string;
        };

        if (!response.ok || !payload.pages) {
          setStatusMessage(payload.error ?? t("editor.pageDeleteFailed"));
          return false;
        }

        setPages(payload.pages);
        setStatusMessage(t("editor.pageDeleted"));

        if (pageId === page.id) {
          const fallback = payload.pages[0];

          if (fallback) {
            router.push(`/${fallback.slug}?editor=1`);
            return true;
          }
        }

        router.refresh();
        return true;
      },
      async reorderPages(pageIds) {
        setPages((current) => {
          const byId = new Map(current.map((pageItem) => [pageItem.id, pageItem]));
          return pageIds.map((id) => byId.get(id)).filter(Boolean) as Array<{ id: string; slug: string; title: string }>;
        });

        const response = await fetch("/api/editor/pages/order", {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({ pageIds })
        });

        const payload = (await response.json()) as {
          pages?: Array<{ id: string; slug: string; title: string }>;
          error?: string;
        };

        if (!response.ok || !payload.pages) {
          setStatusMessage(payload.error ?? t("editor.pageReorderFailed"));
          router.refresh();
          return false;
        }

        setPages(payload.pages);
        setStatusMessage(t("editor.pageReordered"));
        router.refresh();
        return true;
      },
      async saveDraft() {
        setStatusMessage(t("editor.savingDraft"));

        const response = await fetch(`/api/editor/pages/${page.id}/draft`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            title: page.title,
            seo: pageSeo,
            blocks
          })
        });

        const payload = (await response.json()) as {
          savedAt?: string;
          page?: SitePageRecord;
          error?: string;
        };

        if (!response.ok) {
          setStatusMessage(payload.error ?? t("editor.draftSaveFailed"));
          return;
        }

        if (payload.page) {
          setBlocks(payload.page.blocks);
          setPageSeo(payload.page.seo);
          setPages(payload.page.availablePages);
        }
        setLastSavedAt(payload.savedAt ?? new Date().toISOString());
        setStatusMessage(t("editor.draftSaved"));
        router.refresh();
      },
      async publish() {
        setStatusMessage(t("editor.publishing"));

        const response = await fetch(`/api/editor/pages/${page.id}/publish`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            title: page.title,
            seo: pageSeo,
            blocks
          })
        });

        const payload = (await response.json()) as {
          publishedAt?: string;
          page?: SitePageRecord;
          error?: string;
        };

        if (!response.ok) {
          setStatusMessage(payload.error ?? t("editor.publishFailed"));
          return;
        }

        if (payload.page) {
          setBlocks(payload.page.blocks);
          setPageSeo(payload.page.seo);
          setPages(payload.page.availablePages);
        }
        setDraftState("published");
        setStatusMessage(t("editor.publishedDone"));
        setLastSavedAt(payload.publishedAt ?? new Date().toISOString());
        router.refresh();
      },
      async replaceBlockMedia(blockId, file) {
        setStatusMessage(t("editor.uploadingImage"));

        const formData = new FormData();
        formData.append("file", file);
        formData.append("pageId", page.id);
        formData.append("category", mediaLibraryCategory);

        const response = await fetch("/api/editor/media", {
          method: "POST",
          body: formData
        });

        const payload = (await response.json()) as {
          mediaAssetId?: string;
          publicUrl?: string;
          asset?: MediaLibraryAsset;
          error?: string;
        };

        if (!response.ok || !payload.mediaAssetId) {
          setStatusMessage(payload.error ?? t("editor.uploadFailed"));
          return;
        }

        const uploadedAsset =
          payload.asset ??
          ({
            id: payload.mediaAssetId,
            mediaAssetId: payload.mediaAssetId,
            previewUrl: payload.publicUrl ?? payload.mediaAssetId,
            title: file.name,
            alt: file.name,
            category: mediaLibraryCategory
          } satisfies MediaLibraryAsset);

        setMediaLibraryAssets((current) => [uploadedAsset, ...current]);
        setMediaLibraryCategories((current) =>
          current.includes(uploadedAsset.category) ? current : [...current, uploadedAsset.category]
        );
        setBlocks((current) =>
          applyMediaAssetToBlocks(current, blockId, uploadedAsset, "replace")
        );
        setDraftState("dirty");
        setStatusMessage(t("editor.imageUploaded"));
      },
      moveBlockMediaItem(blockId, index, direction) {
        setBlocks((current) =>
          current.map((block) => {
            if (block.id !== blockId) {
              return block;
            }

            if ("items" in block.data && Array.isArray(block.data.items)) {
              const nextItems = [...block.data.items];
              const targetIndex = direction === "up" ? index - 1 : index + 1;

              if (targetIndex < 0 || targetIndex >= nextItems.length) {
                return block;
              }

              const [item] = nextItems.splice(index, 1);
              nextItems.splice(targetIndex, 0, item);

              return {
                ...block,
                data: {
                  ...block.data,
                  items: nextItems
                }
              };
            }

            if ("itemIds" in block.data && Array.isArray(block.data.itemIds)) {
              const nextIds = [...block.data.itemIds];
              const targetIndex = direction === "up" ? index - 1 : index + 1;

              if (targetIndex < 0 || targetIndex >= nextIds.length) {
                return block;
              }

              const [item] = nextIds.splice(index, 1);
              nextIds.splice(targetIndex, 0, item);

              return {
                ...block,
                data: {
                  ...block.data,
                  itemIds: nextIds
                }
              };
            }

            return block;
          })
        );
        setDraftState("dirty");
        setStatusMessage(t("editor.unpublishedChanges"));
      },
      removeBlockMediaItem(blockId, index) {
        setBlocks((current) =>
          current.map((block) => {
            if (block.id !== blockId) {
              return block;
            }

            if ("items" in block.data && Array.isArray(block.data.items)) {
              return {
                ...block,
                data: {
                  ...block.data,
                  items: block.data.items.filter((_, itemIndex) => itemIndex !== index)
                }
              };
            }

            if ("itemIds" in block.data && Array.isArray(block.data.itemIds)) {
              return {
                ...block,
                data: {
                  ...block.data,
                  itemIds: block.data.itemIds.filter((_, itemIndex) => itemIndex !== index)
                }
              };
            }

            return block;
          })
        );
        setDraftState("dirty");
        setStatusMessage(t("editor.unpublishedChanges"));
      },
      updateBlockMediaItemMeta(blockId, index, patch) {
        setBlocks((current) =>
          current.map((block) => {
            if (block.id !== blockId) {
              return block;
            }

            if ("items" in block.data && Array.isArray(block.data.items)) {
              return {
                ...block,
                data: {
                  ...block.data,
                  items: block.data.items.map((item: Record<string, unknown>, itemIndex: number) =>
                    itemIndex === index
                      ? {
                          ...item,
                          ...patch
                        }
                      : item
                  )
                }
              };
            }

            return block;
          })
        );
        setDraftState("dirty");
        setStatusMessage(t("editor.unpublishedChanges"));
      },
      selectMediaAsset(blockId, asset) {
        setBlocks((current) =>
          applyMediaAssetToBlocks(current, blockId, asset, mediaLibraryMode)
        );
        setDraftState("dirty");
        setStatusMessage(t("media.assetInserted", { title: asset.title }));
        setMediaLibraryOpenForBlockId(null);
      }
    }),
    [
      activeBlockId,
      blockLibraryOpen,
      blocks,
      compactNavigation,
      createPageOpen,
      draftState,
      enabled,
      lastSavedAt,
      mediaLibraryAssets,
      mediaLibraryCategories,
      mediaLibraryCategory,
      mediaLibraryMode,
      mediaLibraryOpenForBlockId,
      page,
      pageSeo,
      pages,
      panelOpen,
      router,
      seoPanelOpen,
      statusMessage,
      t
    ]
  );

  return <EditorContext.Provider value={value}>{children}</EditorContext.Provider>;
}

function applyMediaAssetToBlocks(
  blocks: SiteBlockRecord[],
  blockId: string,
  asset: MediaLibraryAsset,
  mode: "replace" | "append"
) {
  const resolvedMediaUrl = asset.mediaAssetId;
  const singleImageBlockTypes = new Set(["hero", "image", "imageText", "about"]);

  return blocks.map((block) => {
    if (block.id !== blockId) {
      return block;
    }

    if (singleImageBlockTypes.has(block.blockType)) {
      const currentImage =
        "image" in block.data && typeof block.data.image === "object" && block.data.image
          ? block.data.image
          : {};

      return {
        ...block,
        data: {
          ...block.data,
          image: {
            ...currentImage,
            mediaAssetId: resolvedMediaUrl,
            alt: asset.alt || ("alt" in currentImage && typeof currentImage.alt === "string" ? currentImage.alt : ""),
            variants: asset.variants
          }
        }
      };
    }

    if ("items" in block.data && Array.isArray(block.data.items)) {
      if (mode === "append") {
        if ("layout" in block.data) {
          return {
            ...block,
            data: {
              ...block.data,
              items: [
                ...block.data.items,
                {
                  mediaAssetId: resolvedMediaUrl,
                  alt: asset.alt ?? "",
                  caption: "",
                  variants: asset.variants
                }
              ]
            }
          };
        }

        if ("itemIds" in block.data) {
          return {
            ...block,
            data: {
              ...block.data,
              itemIds: [...((block.data.itemIds as string[] | undefined) ?? []), asset.mediaAssetId]
            }
          };
        }
      }

      return {
        ...block,
        data: {
          ...block.data,
          items: block.data.items.map((item: Record<string, unknown>, index: number) =>
            index === 0
              ? {
                  ...item,
                  mediaAssetId: resolvedMediaUrl,
                  alt: asset.alt || (typeof item.alt === "string" ? item.alt : ""),
                  caption: typeof item.caption === "string" ? item.caption : "",
                  variants: asset.variants
                }
              : item
          )
        }
      };
    }

    if ("itemIds" in block.data) {
      const currentIds = ((block.data.itemIds as string[] | undefined) ?? []);

      return {
        ...block,
        data: {
          ...block.data,
          itemIds:
            mode === "append"
              ? [...currentIds, resolvedMediaUrl]
              : [resolvedMediaUrl, ...currentIds.slice(1)]
        }
      };
    }

    return block;
  });
}

export function useEditor() {
  const context = useContext(EditorContext);

  if (!context) {
    throw new Error("useEditor must be used inside EditorProvider.");
  }

  return context;
}
