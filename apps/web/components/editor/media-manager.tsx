"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Pencil, Plus, Search, Trash2, Upload } from "lucide-react";

import type { MediaCategory, MediaLibraryAsset } from "@/lib/content";
import { useTranslations } from "@/lib/i18n/client";
import { getMediaCategoryLabel, normalizeMediaCategoryName } from "@/lib/media-categories";

export function MediaManager() {
  const t = useTranslations();
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [assets, setAssets] = useState<MediaLibraryAsset[]>([]);
  const [categories, setCategories] = useState<MediaCategory[]>([]);
  const [category, setCategory] = useState<MediaCategory | "all">("all");
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<string | null>(null);

  useEffect(() => {
    void (async () => {
      setStatus(t("media.libraryLoading"));
      const response = await fetch("/api/editor/media");
      const payload = (await response.json()) as {
        assets?: MediaLibraryAsset[];
        categories?: MediaCategory[];
        error?: string;
      };

      if (!response.ok) {
        setStatus(payload.error ?? t("media.libraryLoadFailed"));
        return;
      }

      setAssets(payload.assets ?? []);
      setCategories(payload.categories ?? []);
      setStatus(null);
    })();
  }, []);

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
              setCategories((current) =>
                current.includes(payload.asset!.category) ? current : [...current, payload.asset!.category]
              );
              setStatus(t("editor.imageUploaded"));
            })();

            event.currentTarget.value = "";
          }}
        />
      </div>

      <div className="page-list">
        <button
          className="page-chip media-category-chip"
          type="button"
          data-active={category === "all"}
          onClick={() => setCategory("all")}
        >
          {getMediaCategoryLabel("all", (key) => t(key as never))}
        </button>
        {categories.map((item) => (
          <div key={item} className="media-category-row" data-active={item === category}>
            <button
              className="page-chip media-category-chip"
              type="button"
              data-active={item === category}
              onClick={() => setCategory(item)}
            >
              {getMediaCategoryLabel(item, (key) => t(key as never))}
            </button>
            <button
              className="action-button"
              type="button"
              onClick={() => void renameCategory(item)}
              aria-label={`Переименовать категорию ${item}`}
            >
              <Pencil size={14} />
            </button>
            <button
              className="action-button"
              type="button"
              onClick={() => void deleteCategory(item)}
              aria-label={`Удалить категорию ${item}`}
            >
              <Trash2 size={14} />
            </button>
          </div>
        ))}
        <button className="editor-button" type="button" onClick={() => void createCategory()}>
          <Plus size={14} />
          Категория
        </button>
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

  async function createCategory() {
    const value = typeof window !== "undefined" ? window.prompt("Название категории") : null;
    const nextName = normalizeMediaCategoryName(value ?? "");

    if (!nextName) {
      return;
    }

    setStatus("Создание категории...");
    const response = await fetch("/api/editor/media/categories", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: nextName })
    });
    const payload = (await response.json()) as { categories?: MediaCategory[]; error?: string };

    if (!response.ok || !payload.categories) {
      setStatus(payload.error ?? "Не удалось создать категорию.");
      return;
    }

    setCategories(payload.categories);
    setCategory(nextName);
    setStatus(null);
  }

  async function renameCategory(currentName: string) {
    const value = typeof window !== "undefined" ? window.prompt("Новое имя категории", currentName) : null;
    const nextName = normalizeMediaCategoryName(value ?? "");

    if (!nextName || nextName === currentName) {
      return;
    }

    setStatus("Переименование категории...");
    const response = await fetch("/api/editor/media/categories", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ from: currentName, to: nextName })
    });
    const payload = (await response.json()) as { categories?: MediaCategory[]; error?: string };

    if (!response.ok || !payload.categories) {
      setStatus(payload.error ?? "Не удалось переименовать категорию.");
      return;
    }

    setAssets((current) =>
      current.map((asset) => (asset.category === currentName ? { ...asset, category: nextName } : asset))
    );
    setCategories(payload.categories);
    if (category === currentName) {
      setCategory(nextName);
    }
    setStatus(null);
  }

  async function deleteCategory(currentName: string) {
    if (typeof window !== "undefined" && !window.confirm(`Удалить категорию "${currentName}"?`)) {
      return;
    }

    setStatus("Удаление категории...");
    const response = await fetch("/api/editor/media/categories", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: currentName })
    });
    const payload = (await response.json()) as { categories?: MediaCategory[]; error?: string };

    if (!response.ok || !payload.categories) {
      setStatus(payload.error ?? "Не удалось удалить категорию.");
      return;
    }

    setAssets((current) =>
      current.map((asset) => (asset.category === currentName ? { ...asset, category: "uploaded" } : asset))
    );
    setCategories(payload.categories);
    if (category === currentName) {
      setCategory("all");
    }
    setStatus(null);
  }
}
