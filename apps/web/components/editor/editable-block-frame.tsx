"use client";

import { useRef } from "react";
import type { ReactNode } from "react";
import { Copy, Eye, EyeOff, Pencil, Plus, Trash2, ChevronUp, ChevronDown } from "lucide-react";

import { testIds } from "@/lib/test-ids";
import { useEditor } from "./editor-provider";
import type { SiteBlockRecord } from "@/lib/content";

const quickInsertTypes = [
  { label: "Section", type: "sectionHeader" },
  { label: "Text", type: "richText" },
  { label: "Image", type: "image" },
  { label: "Image + text", type: "imageText" },
  { label: "Gallery", type: "gallery" },
  { label: "Works", type: "worksGrid" },
  { label: "Series", type: "seriesGrid" },
  { label: "Quote", type: "quote" },
  { label: "Links", type: "linksList" },
  { label: "CTA", type: "cta" },
  { label: "Contact", type: "contact" },
  { label: "Divider", type: "divider" }
] as const;

export function EditableBlockFrame({
  children,
  block,
  index
}: {
  children: ReactNode;
  block: SiteBlockRecord;
  index: number;
}) {
  const {
    enabled,
    activeBlockId,
    setActiveBlockId,
    replaceBlockMedia,
    duplicateBlock,
    moveBlock,
    removeBlock,
    toggleHidden,
    insertBlockAfter
  } = useEditor();
  const hasMedia =
    "image" in block.data ||
    "items" in block.data ||
    "socialLinks" in block.data ||
    block.blockType === "gallery";
  const mediaInputRef = useRef<HTMLInputElement | null>(null);

  if (!enabled) {
    return block.isHidden ? null : <>{children}</>;
  }

  return (
    <>
      <div className="insert-zone" data-testid={testIds.addBlockSlot}>
        <button
          className="insert-button"
          type="button"
          onClick={() => insertBlockAfter(index - 1, "sectionHeader")}
        >
          <Plus size={14} />
          Add block above
        </button>
      </div>
      <section
        className="editable-frame"
        data-active={activeBlockId === block.id}
        data-testid={testIds.blockFrame}
        onClick={() => setActiveBlockId(block.id)}
      >
        <div className="block-actions">
          <button className="action-button" type="button" title="Edit" data-testid={testIds.editorAction}>
            <Pencil size={15} />
          </button>
          <button
            className="action-button"
            type="button"
            title="Move up"
            data-testid={testIds.editorAction}
            onClick={() => moveBlock(block.id, "up")}
          >
            <ChevronUp size={15} />
          </button>
          <button
            className="action-button"
            type="button"
            title="Move down"
            data-testid={testIds.editorAction}
            onClick={() => moveBlock(block.id, "down")}
          >
            <ChevronDown size={15} />
          </button>
          <button
            className="action-button"
            type="button"
            title="Duplicate"
            data-testid={testIds.editorAction}
            onClick={() => duplicateBlock(block.id)}
          >
            <Copy size={15} />
          </button>
          <button
            className="action-button"
            type="button"
            title="Hide"
            data-testid={testIds.editorAction}
            onClick={() => toggleHidden(block.id)}
          >
            {block.isHidden ? <Eye size={15} /> : <EyeOff size={15} />}
          </button>
          <button
            className="action-button"
            type="button"
            title="Delete"
            data-testid={testIds.editorAction}
            onClick={() => removeBlock(block.id)}
          >
            <Trash2 size={15} />
          </button>
          {hasMedia ? (
            <button
              className="action-button"
              type="button"
              title="Replace image"
              data-testid={testIds.mediaReplace}
              onClick={() => mediaInputRef.current?.click()}
            >
              <Pencil size={15} />
            </button>
          ) : null}
        </div>
        <div className="mini-note" data-testid={testIds.blockType}>
          {block.blockType}
        </div>
        {block.isHidden ? <div className="mini-note">This block is hidden in the published view.</div> : null}
        {children}
      </section>
      {hasMedia ? (
        <input
          ref={mediaInputRef}
          type="file"
          accept="image/*"
          hidden
          onChange={(event) => {
            const file = event.currentTarget.files?.[0];

            if (!file) {
              return;
            }

            void replaceBlockMedia(block.id, file);
            event.currentTarget.value = "";
          }}
        />
      ) : null}
      <div className="insert-zone" data-testid={testIds.addBlockSlot}>
        {quickInsertTypes.map((item) => (
          <button
            key={`${block.id}-${item.type}`}
            className="insert-button"
            type="button"
            onClick={() => insertBlockAfter(index, item.type)}
          >
            <Plus size={14} />
            {item.label}
          </button>
        ))}
      </div>
    </>
  );
}
