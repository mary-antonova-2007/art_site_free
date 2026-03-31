"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Search, Upload } from "lucide-react";

import type { MediaCategory, MediaLibraryAsset } from "@/lib/content";
import { useTranslations } from "@/lib/i18n/client";

const mediaCategories: Array<MediaCategory | "all"> = [
  "all",
  "featured",
  "works",
  "portraits",
  "details",
  "spaces",
  "uploaded"
];

export function MediaManager() {
  const t = useTranslations();
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [assets, setAssets] = useState<MediaLibraryAsset[]>([]);
  const [category, setCategory] = useState<MediaCategory | "all">("all");
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<string | null>(null);

  useEffect(() => {
    void (async () => {
      setStatus(t("media.libraryLoading"));
      const response = await fetch("/api/editor/media");
      const payload = (await response.json()) as { assets?: MediaLibraryAsset[]; error?: string };

      if (!response.ok) {
        setStatus(payload.error ?? t("media.libraryLoadFailed"));
        return;
      }

      setAssets(payload.assets ?? []);
      setStatus(null);
    })();
  }, [t]);

  const filteredAssets = useMemo(() => {
    return assets.filter((asset) => {
      const matchesCategory = category === "all" ? true : asset.category === category;
      const normalized = query.trim().toLowerCase();
      const matchesQuery =
        !normalized ||
        asset.title.toLowerCase().includes(normalized) ||
        asset.alt.toLowerCase().includes(normalized);

      return matchesCategory && matchesQuery;
    });
  }, [assets, category, query]);

  return (
    <section className="site-section section-stack">
      <span className="eyebrow">{t("media.libraryEyebrow")}</span>
      <h1 className="section-title">{t("media.libraryTitle")}</h1>
      <p className="section-description">{t("media.libraryHint")}</p>

      <div className="media-manager-toolbar">
        <label className="media-search">
          <Search size={16} />
          <input
            value={query}
            onChange={(event) => setQuery(event.currentTarget.value)}
            placeholder={t("media.searchPlaceholder")}
          />
        </label>
        <button className="editor-button editor-button-primary" type="button" onClick={() => inputRef.current?.click()}>
          <Upload size={16} />
          {t("media.uploadNew")}
        </button>
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

            void (async () => {
              setStatus(t("editor.uploadingImage"));
              const formData = new FormData();
              formData.append("file", file);
              formData.append("pageId", "media-library");
              formData.append("category", category === "all" ? "uploaded" : category);

              const response = await fetch("/api/editor/media", {
                method: "POST",
                body: formData
              });

              const payload = (await response.json()) as { asset?: MediaLibraryAsset; error?: string };

              if (!response.ok || !payload.asset) {
                setStatus(payload.error ?? t("editor.uploadFailed"));
                return;
              }

              setAssets((current) => [payload.asset!, ...current]);
              setStatus(t("editor.imageUploaded"));
            })();

            event.currentTarget.value = "";
          }}
        />
      </div>

      <div className="page-list">
        {mediaCategories.map((item) => (
          <button
            key={item}
            className="page-chip media-category-chip"
            type="button"
            data-active={item === category}
            onClick={() => setCategory(item)}
          >
            {item === "all" ? t("media.categories.all") : t(`media.categories.${item}`)}
          </button>
        ))}
      </div>

      {status ? <p className="mini-note">{status}</p> : null}

      <div className="media-library__grid">
        {filteredAssets.map((asset) => (
          <article key={asset.id} className="media-library__card">
            <img src={asset.previewUrl} alt={asset.alt} />
            <div className="media-library__meta">
              <strong>{asset.title}</strong>
              <span>{asset.alt}</span>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
