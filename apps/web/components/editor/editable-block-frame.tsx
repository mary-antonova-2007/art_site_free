"use client";

import { useRef } from "react";
import type { ReactNode } from "react";
import { Copy, Eye, EyeOff, Pencil, Plus, Trash2, ChevronUp, ChevronDown } from "lucide-react";

import { getBlockLabel } from "@/lib/i18n/blocks";
import { useLocaleMessages, useTranslations } from "@/lib/i18n/client";
import { testIds } from "@/lib/test-ids";
import { useEditor } from "./editor-provider";
import type { SiteBlockRecord } from "@/lib/content";

const quickInsertTypes = [
  { key: "sectionHeader", type: "sectionHeader" },
  { key: "richText", type: "richText" },
  { key: "image", type: "image" },
  { key: "imageText", type: "imageText" },
  { key: "gallery", type: "gallery" },
  { key: "worksGrid", type: "worksGrid" },
  { key: "seriesGrid", type: "seriesGrid" },
  { key: "quote", type: "quote" },
  { key: "linksList", type: "linksList" },
  { key: "cta", type: "cta" },
  { key: "contact", type: "contact" },
  { key: "divider", type: "divider" }
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
  const t = useTranslations();
  const localeMessages = useLocaleMessages();
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
          {t("insert.addAbove")}
        </button>
      </div>
      <section
        className="editable-frame"
        data-active={activeBlockId === block.id}
        data-testid={testIds.blockFrame}
        onClick={() => setActiveBlockId(block.id)}
      >
        <div className="block-actions">
          <button className="action-button" type="button" title={t("blockActions.edit")} data-testid={testIds.editorAction}>
            <Pencil size={15} />
          </button>
          <button
            className="action-button"
            type="button"
            title={t("blockActions.moveUp")}
            data-testid={testIds.editorAction}
            onClick={() => moveBlock(block.id, "up")}
          >
            <ChevronUp size={15} />
          </button>
          <button
            className="action-button"
            type="button"
            title={t("blockActions.moveDown")}
            data-testid={testIds.editorAction}
            onClick={() => moveBlock(block.id, "down")}
          >
            <ChevronDown size={15} />
          </button>
          <button
            className="action-button"
            type="button"
            title={t("blockActions.duplicate")}
            data-testid={testIds.editorAction}
            onClick={() => duplicateBlock(block.id)}
          >
            <Copy size={15} />
          </button>
          <button
            className="action-button"
            type="button"
            title={block.isHidden ? t("blockActions.show") : t("blockActions.hide")}
            data-testid={testIds.editorAction}
            onClick={() => toggleHidden(block.id)}
          >
            {block.isHidden ? <Eye size={15} /> : <EyeOff size={15} />}
          </button>
          <button
            className="action-button"
            type="button"
            title={t("blockActions.remove")}
            data-testid={testIds.editorAction}
            onClick={() => removeBlock(block.id)}
          >
            <Trash2 size={15} />
          </button>
          {hasMedia ? (
            <button
              className="action-button"
              type="button"
              title={t("blockActions.replaceImage")}
              data-testid={testIds.mediaReplace}
              onClick={() => mediaInputRef.current?.click()}
            >
              <Pencil size={15} />
            </button>
          ) : null}
        </div>
        <div className="mini-note" data-testid={testIds.blockType}>
          {getBlockLabel(localeMessages, block.blockType, block.blockType)}
        </div>
        {block.isHidden ? <div className="mini-note">{t("blockActions.hiddenInPublishedView")}</div> : null}
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
            {t(`quickInsert.${item.key}`)}
          </button>
        ))}
      </div>
    </>
  );
}
