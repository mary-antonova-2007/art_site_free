"use client";

import { useRef } from "react";
import { ImagePlus, Upload, X } from "lucide-react";

import type { MediaCategory } from "@/lib/content";
import { useTranslations } from "@/lib/i18n/client";
import { useEditor } from "./editor-provider";

const mediaCategories: MediaCategory[] = [
  "featured",
  "works",
  "portraits",
  "details",
  "spaces",
  "uploaded"
];

export function MediaLibraryDialog() {
  const t = useTranslations();
  const inputRef = useRef<HTMLInputElement | null>(null);
  const {
    mediaLibraryAssets,
    mediaLibraryOpenForBlockId,
    mediaLibraryCategory,
    setMediaLibraryCategory,
    closeMediaLibrary,
    replaceBlockMedia,
    selectMediaAsset
  } = useEditor();

  if (!mediaLibraryOpenForBlockId) {
    return null;
  }

  const visibleAssets = mediaLibraryAssets.filter((asset) => asset.category === mediaLibraryCategory);

  return (
    <div className="media-library-backdrop" onClick={closeMediaLibrary}>
      <aside className="media-library" onClick={(event) => event.stopPropagation()}>
        <div className="media-library__header">
          <div className="section-stack">
            <span className="eyebrow">{t("media.libraryEyebrow")}</span>
            <h3>{t("media.libraryTitle")}</h3>
          </div>
          <button
            className="editor-panel-close"
            type="button"
            onClick={closeMediaLibrary}
            aria-label={t("editor.closePanel")}
          >
            <X size={18} />
          </button>
        </div>

        <div className="page-list">
          {mediaCategories.map((category) => (
            <button
              key={category}
              className="page-chip media-category-chip"
              type="button"
              data-active={category === mediaLibraryCategory}
              onClick={() => setMediaLibraryCategory(category)}
            >
              {t(`media.categories.${category}`)}
            </button>
          ))}
        </div>

        <div className="media-library__toolbar">
          <button className="editor-button editor-button-primary" type="button" onClick={() => inputRef.current?.click()}>
            <Upload size={16} />
            {t("media.uploadNew")}
          </button>
          <p className="mini-note">{t("media.libraryHint")}</p>
        </div>

        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          hidden
          onChange={(event) => {
            const file = event.currentTarget.files?.[0];

            if (!file) {
              return;
            }

            void replaceBlockMedia(mediaLibraryOpenForBlockId, file);
            event.currentTarget.value = "";
          }}
        />

        <div className="media-library__grid">
          {visibleAssets.map((asset) => (
            <button
              key={asset.id}
              className="media-library__card"
              type="button"
              onClick={() => selectMediaAsset(mediaLibraryOpenForBlockId, asset)}
            >
              <img src={asset.previewUrl} alt={asset.alt} />
              <div className="media-library__meta">
                <strong>{asset.title}</strong>
                <span>{asset.alt}</span>
              </div>
            </button>
          ))}

          {!visibleAssets.length ? (
            <div className="media-library__empty">
              <ImagePlus size={18} />
              <span>{t("media.emptyCategory")}</span>
            </div>
          ) : null}
        </div>
      </aside>
    </div>
  );
}
