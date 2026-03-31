"use client";

import { ChevronDown, ChevronUp, Plus, Trash2, X } from "lucide-react";

import { getBlockDefinition } from "@artsite/blocks";

import type { SiteBlockRecord } from "@/lib/content";
import { getBlockLabel, getFieldLabel, getFieldOptionLabel } from "@/lib/i18n/blocks";
import { useLocaleMessages, useTranslations } from "@/lib/i18n/client";
import { testIds } from "@/lib/test-ids";
import { useEditor } from "./editor-provider";

export function EditorSheet() {
  const t = useTranslations();
  const localeMessages = useLocaleMessages();
  const {
    activeBlockId,
    blocks,
    updateBlockField,
    pages,
    panelOpen,
    closePanel,
    openMediaLibrary,
    moveBlockMediaItem,
    removeBlockMediaItem
  } = useEditor();
  const activeBlock = blocks.find((block) => block.id === activeBlockId);

  if (!panelOpen) {
    return null;
  }

  if (!activeBlock) {
    return (
      <aside className="editor-panel">
        <div className="editor-panel-header">
          <h3>{t("editorPanel.title")}</h3>
          <button className="editor-panel-close" type="button" onClick={closePanel} aria-label={t("editor.closePanel")}>
            <X size={18} />
          </button>
        </div>
        <p className="mini-note">{t("editorPanel.emptyDescription")}</p>
        <div className="section-stack">
          <span className="eyebrow">{t("editorPanel.pages")}</span>
          <div className="page-list">
            {pages.map((page) => (
              <span key={page.id} className="page-chip">
                {page.title}
              </span>
            ))}
          </div>
        </div>
      </aside>
    );
  }

  const definition = getBlockDefinition(activeBlock.blockType);
  const mediaAction =
    activeBlock.blockType === "gallery" ||
    activeBlock.blockType === "worksGrid" ||
    activeBlock.blockType === "seriesGrid"
      ? ("append" as const)
      : ("replace" as const);
  const mediaButtonLabel =
    mediaAction === "append" ? t("media.addImages") : t("media.manageImages");

  return (
    <aside className="editor-panel">
      <div className="editor-panel-header">
        <h3>{getBlockLabel(localeMessages, activeBlock.blockType, definition.label)}</h3>
        <button className="editor-panel-close" type="button" onClick={closePanel} aria-label={t("editor.closePanel")}>
          <X size={18} />
        </button>
      </div>
      <p className="mini-note">{t("editorPanel.dataOnly")}</p>
      {hasMediaSupport(activeBlock.blockType) ? (
        <button
          className="editor-button editor-button-primary editor-panel-media-button"
          type="button"
          onClick={() => void openMediaLibrary(activeBlock.id, mediaAction)}
        >
          {mediaButtonLabel}
        </button>
      ) : null}
      {hasMediaCollection(activeBlock) ? (
        <div className="editor-media-list">
          <div className="editor-media-list__header">
            <span className="eyebrow">{t("media.currentImages")}</span>
            <button
              className="editor-button"
              type="button"
              onClick={() =>
                void openMediaLibrary(
                  activeBlock.id,
                  activeBlock.blockType === "gallery" ||
                    activeBlock.blockType === "worksGrid" ||
                    activeBlock.blockType === "seriesGrid"
                    ? "append"
                    : "replace"
                )
              }
            >
              <Plus size={14} />
              {t("media.addImages")}
            </button>
          </div>
          <div className="editor-media-list__items">
            {getMediaCollectionItems(activeBlock).map((item, index) => (
              <div className="editor-media-item" key={`${item.id}-${index}`}>
                <img src={item.previewUrl} alt={item.label} />
                <div className="editor-media-item__body">
                  <strong>{item.label}</strong>
                  <span>{item.id}</span>
                </div>
                <div className="editor-media-item__actions">
                  <button type="button" className="action-button" onClick={() => moveBlockMediaItem(activeBlock.id, index, "up")}>
                    <ChevronUp size={14} />
                  </button>
                  <button type="button" className="action-button" onClick={() => moveBlockMediaItem(activeBlock.id, index, "down")}>
                    <ChevronDown size={14} />
                  </button>
                  <button type="button" className="action-button" onClick={() => removeBlockMediaItem(activeBlock.id, index)}>
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : null}
      {definition.fields.map((field) => {
        const value = activeBlock.data[field.name as keyof typeof activeBlock.data];

        if (
          field.kind === "reference" ||
          (field.kind === "list" && ["gallery", "worksGrid", "seriesGrid"].includes(activeBlock.blockType))
        ) {
          return null;
        }

        if (field.kind === "image") {
          return (
            <div className="editor-field" key={field.name} data-testid={testIds.blockField}>
              <span>{getFieldLabel(localeMessages, field.name, field.label)}</span>
              <button
                className="editor-button"
                type="button"
                onClick={() => void openMediaLibrary(activeBlock.id, "replace")}
              >
                {t("media.manageImages")}
              </button>
            </div>
          );
        }

        if (field.kind === "select") {
          return (
            <label className="editor-field" key={field.name} data-testid={testIds.blockField}>
              <span>{getFieldLabel(localeMessages, field.name, field.label)}</span>
              <select
                id={field.name}
                value={String(value ?? "")}
                onChange={(event) =>
                  updateBlockField(activeBlock.id, field.name, event.currentTarget.value)
                }
              >
                {(field.options ?? []).map((option) => (
                  <option key={option.value} value={option.value}>
                    {getFieldOptionLabel(localeMessages, option.value, option.label)}
                  </option>
                ))}
              </select>
            </label>
          );
        }

        if (field.kind === "textarea" || field.kind === "richtext") {
          return (
            <label className="editor-field" key={field.name} data-testid={testIds.blockField}>
              <span>{getFieldLabel(localeMessages, field.name, field.label)}</span>
              <textarea
                id={field.name}
                value={typeof value === "string" ? value : JSON.stringify(value, null, 2)}
                onChange={(event) =>
                  updateBlockField(activeBlock.id, field.name, event.currentTarget.value)
                }
              />
            </label>
          );
        }

        return (
          <label className="editor-field" key={field.name} data-testid={testIds.blockField}>
            <span>{getFieldLabel(localeMessages, field.name, field.label)}</span>
            <input
              id={field.name}
              value={typeof value === "string" ? value : JSON.stringify(value)}
              onChange={(event) =>
                updateBlockField(activeBlock.id, field.name, event.currentTarget.value)
              }
            />
          </label>
        );
      })}
    </aside>
  );
}

function hasMediaSupport(blockType: string) {
  return ["hero", "image", "imageText", "gallery", "worksGrid", "seriesGrid"].includes(blockType);
}

function hasMediaCollection(block: SiteBlockRecord) {
  return (
    ("items" in block.data && Array.isArray(block.data.items)) ||
    ("itemIds" in block.data && Array.isArray(block.data.itemIds))
  );
}

function getMediaCollectionItems(block: SiteBlockRecord) {
  if ("items" in block.data && Array.isArray(block.data.items)) {
    return block.data.items.map((item: { mediaAssetId?: string; caption?: string; alt?: string }, index: number) => ({
      id: item.mediaAssetId ?? `item-${index}`,
      label: item.caption ?? item.alt ?? `Изображение ${index + 1}`,
      previewUrl: item.mediaAssetId?.startsWith("/") ? item.mediaAssetId : fallbackPreview(item.mediaAssetId)
    }));
  }

  if ("itemIds" in block.data && Array.isArray(block.data.itemIds)) {
    return block.data.itemIds.map((itemId: string, index: number) => ({
      id: itemId,
      label: itemId,
      previewUrl: itemId.startsWith("/") ? itemId : fallbackPreview(itemId)
    }));
  }

  return [];
}

function fallbackPreview(assetId?: string) {
  if (!assetId) {
    return "/art-04.svg";
  }

  if (assetId.includes("hero")) return "/art-hero.svg";
  if (assetId.includes("portrait")) return "/portrait.svg";
  if (assetId.includes("gallery-1")) return "/art-01.svg";
  if (assetId.includes("gallery-2")) return "/art-02.svg";
  if (assetId.includes("sample-image")) return "/art-03.svg";
  return "/art-04.svg";
}
