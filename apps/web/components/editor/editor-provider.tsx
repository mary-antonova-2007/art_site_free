"use client";

import { createContext, useContext, useMemo, useState } from "react";
import type { ReactNode } from "react";

import { createDefaultBlock, getBlockDefinition, type BlockType } from "@artsite/blocks";

import type { SiteBlockRecord, SitePageRecord } from "@/lib/content";

type EditorContextValue = {
  enabled: boolean;
  page: SitePageRecord;
  blocks: SiteBlockRecord[];
  activeBlockId: string | null;
  setActiveBlockId: (id: string | null) => void;
  updateBlockField: (blockId: string, field: string, value: unknown) => void;
  insertBlockAfter: (index: number, type: BlockType) => void;
  moveBlock: (blockId: string, direction: "up" | "down") => void;
  duplicateBlock: (blockId: string) => void;
  removeBlock: (blockId: string) => void;
  toggleHidden: (blockId: string) => void;
  createPage: (input: { title: string; slug: string }) => void;
  pages: Array<{ id: string; slug: string; title: string }>;
  draftState: "published" | "dirty";
  statusMessage: string | null;
  lastSavedAt: string | null;
  saveDraft: () => Promise<void>;
  publish: () => Promise<void>;
  replaceBlockMedia: (blockId: string, file: File) => Promise<void>;
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
  const [blocks, setBlocks] = useState(page.blocks);
  const [activeBlockId, setActiveBlockId] = useState<string | null>(null);
  const [pages, setPages] = useState(page.availablePages);
  const [draftState, setDraftState] = useState<"published" | "dirty">(
    enabled ? "dirty" : "published"
  );
  const [statusMessage, setStatusMessage] = useState<string | null>(
    enabled ? "Draft ready." : null
  );
  const [lastSavedAt, setLastSavedAt] = useState<string | null>(null);
  const [createPageOpen, setCreatePageOpen] = useState(false);

  const value = useMemo<EditorContextValue>(
    () => ({
      enabled,
      page,
      blocks,
      activeBlockId,
      setActiveBlockId,
      pages,
      draftState,
      statusMessage,
      lastSavedAt,
      createPageOpen,
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
        setStatusMessage("Unpublished changes");
      },
      insertBlockAfter(index, type) {
        const definition = getBlockDefinition(type);
        const nextBlock: SiteBlockRecord = {
          id: `${type}-${crypto.randomUUID()}`,
          blockType: type,
          isHidden: false,
          position: index + 1,
          data: definition.createDefault()
        };

        setBlocks((current) => {
          const cloned = [...current];
          cloned.splice(index + 1, 0, nextBlock);
          return cloned.map((item, itemIndex) => ({ ...item, position: itemIndex }));
        });
        setActiveBlockId(nextBlock.id);
        setDraftState("dirty");
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
        setDraftState("dirty");
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
        setActiveBlockId(duplicateId);
      },
      removeBlock(blockId) {
        setBlocks((current) =>
          current
            .filter((block) => block.id !== blockId)
            .map((block, itemIndex) => ({ ...block, position: itemIndex }))
        );
        setActiveBlockId((current) => (current === blockId ? null : current));
        setDraftState("dirty");
        setStatusMessage("Unpublished changes");
      },
      toggleHidden(blockId) {
        setBlocks((current) =>
          current.map((block) =>
            block.id === blockId ? { ...block, isHidden: !block.isHidden } : block
          )
        );
        setDraftState("dirty");
        setStatusMessage("Unpublished changes");
      },
      createPage(input) {
        void (async () => {
          setStatusMessage("Creating page...");

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
            setStatusMessage(payload.error ?? "Page create failed.");
            return;
          }

          setPages((current) => [
            ...current,
            {
              id: payload.page!.id,
              title: payload.page!.title,
              slug: payload.page!.slug
            }
          ]);
          setDraftState("dirty");
          setCreatePageOpen(false);
          setStatusMessage(`Created page "${payload.page.title}".`);
        })();
      },
      async saveDraft() {
        setStatusMessage("Saving draft...");

        const response = await fetch(`/api/editor/pages/${page.id}/draft`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            title: page.title,
            blocks
          })
        });

        const payload = (await response.json()) as { savedAt?: string; error?: string };

        if (!response.ok) {
          setStatusMessage(payload.error ?? "Draft save failed.");
          return;
        }

        setLastSavedAt(payload.savedAt ?? new Date().toISOString());
        setStatusMessage("Draft saved.");
      },
      async publish() {
        setStatusMessage("Publishing...");

        const response = await fetch(`/api/editor/pages/${page.id}/publish`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            title: page.title,
            blocks
          })
        });

        const payload = (await response.json()) as { publishedAt?: string; error?: string };

        if (!response.ok) {
          setStatusMessage(payload.error ?? "Publish failed.");
          return;
        }

        setDraftState("published");
        setStatusMessage("Published.");
        setLastSavedAt(payload.publishedAt ?? new Date().toISOString());
      },
      async replaceBlockMedia(blockId, file) {
        setStatusMessage("Uploading image...");

        const formData = new FormData();
        formData.append("file", file);
        formData.append("pageId", page.id);

        const response = await fetch("/api/editor/media", {
          method: "POST",
          body: formData
        });

        const payload = (await response.json()) as {
          mediaAssetId?: string;
          publicUrl?: string;
          error?: string;
        };

        if (!response.ok || !payload.mediaAssetId) {
          setStatusMessage(payload.error ?? "Upload failed.");
          return;
        }

        setBlocks((current) =>
          current.map((block) => {
            if (block.id !== blockId) {
              return block;
            }

            if ("image" in block.data) {
              return {
                ...block,
                data: {
                  ...block.data,
                  image: {
                    ...(block.data.image ?? {}),
                    mediaAssetId: payload.mediaAssetId,
                    alt: file.name
                  }
                }
              };
            }

            if ("items" in block.data && Array.isArray(block.data.items)) {
              return {
                ...block,
                data: {
                  ...block.data,
                  items: block.data.items.map((item, index) =>
                    index === 0
                      ? {
                          ...item,
                          mediaAssetId: payload.mediaAssetId,
                          alt: file.name
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
        setStatusMessage("Image uploaded. Save draft to persist.");
      }
    }),
    [activeBlockId, blocks, createPageOpen, draftState, enabled, lastSavedAt, page, pages, statusMessage]
  );

  return <EditorContext.Provider value={value}>{children}</EditorContext.Provider>;
}

export function useEditor() {
  const context = useContext(EditorContext);

  if (!context) {
    throw new Error("useEditor must be used inside EditorProvider.");
  }

  return context;
}
