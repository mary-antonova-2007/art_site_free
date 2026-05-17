"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Pencil, Plus, Search, Trash2, Upload } from "lucide-react";

import type { MediaCategory, MediaLibraryAsset, PrintFormat } from "@/lib/content";
import { useTranslations } from "@/lib/i18n/client";
import { getMediaCategoryLabel, normalizeMediaCategoryName } from "@/lib/media-categories";

type MediaDraft = {
  isProduct: boolean;
  printFormats: PrintFormat[];
};

export function MediaManager({ printFormats }: { printFormats: PrintFormat[] }) {
  const t = useTranslations();
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [assets, setAssets] = useState<MediaLibraryAsset[]>([]);
  const [categories, setCategories] = useState<MediaCategory[]>([]);
  const [category, setCategory] = useState<MediaCategory | "all">("all");
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<string | null>(null);
  const [drafts, setDrafts] = useState<Record<string, MediaDraft>>({});

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
        setStatus(payload.error ?? t("media.loadFailed"));
        return;
      }

      const nextAssets = payload.assets ?? [];
      setAssets(nextAssets);
      setCategories(payload.categories ?? []);
      setDrafts(
        Object.fromEntries(
          nextAssets.map((asset) => [
            asset.id,
            {
              isProduct: Boolean(asset.isProduct),
              printFormats: normalizeDraftFormats(asset.printFormats ?? [], printFormats)
            }
          ])
        )
      );
      setStatus(null);
    })();
  }, [printFormats]);

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
      <p className="section-description">
        {t("media.libraryHint")} {t("media.extendedLibraryHint")}
      </p>

      <div className="media-manager-toolbar">
        <a className="editor-button" href="/?editor=1">
          {t("media.home")}
        </a>
        <a className="editor-button" href="/settings?editor=1">
          {t("media.formatsAndPrices")}
        </a>
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
              setDrafts((current) => ({
                ...current,
                [payload.asset!.id]: {
                  isProduct: Boolean(payload.asset!.isProduct),
                  printFormats: normalizeDraftFormats(payload.asset!.printFormats ?? [], printFormats)
                }
              }));
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
              aria-label={t("media.renameCategory", { name: item })}
            >
              <Pencil size={14} />
            </button>
            <button
              className="action-button"
              type="button"
              onClick={() => void deleteCategory(item)}
              aria-label={t("media.deleteCategory", { name: item })}
            >
              <Trash2 size={14} />
            </button>
          </div>
        ))}
        <button className="editor-button" type="button" onClick={() => void createCategory()}>
          <Plus size={14} />
          {t("media.category")}
        </button>
      </div>

      {status ? <p className="mini-note">{status}</p> : null}

      <div className="media-library__grid">
        {filteredAssets.map((asset) => {
          const draft = drafts[asset.id] ?? {
            isProduct: Boolean(asset.isProduct),
            printFormats: normalizeDraftFormats(asset.printFormats ?? [], printFormats)
          };

          return (
            <article key={asset.id} className="media-library__card media-library__card--editor">
              <img src={asset.previewUrl} alt={asset.alt} />
              <div className="media-library__meta">
                <strong>{asset.title}</strong>
                <span>{asset.alt}</span>
              </div>
              <div className="media-asset-commerce">
                <div className="editor-media-item__actions">
                  <button
                    className="action-button"
                    type="button"
                    aria-label={t("media.deleteImage", { name: asset.title })}
                    onClick={() => void deleteAsset(asset)}
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
                <label className="editor-field editor-field-checkbox">
                  <span>{t("media.availableForPurchase")}</span>
                  <input
                    type="checkbox"
                    checked={draft.isProduct}
                    onChange={(event) => {
                      const isProduct = event.currentTarget.checked;
                      setDrafts((current) => ({
                        ...current,
                        [asset.id]: { ...draft, isProduct }
                      }));
                    }}
                  />
                </label>
                {draft.isProduct ? (
                  <div className="section-stack">
                    <span className="eyebrow">{t("media.formats")}</span>
                    {draft.printFormats.map((format, index) => (
                      <div className="editor-media-item" key={`${asset.id}-${format.id}-${index}`}>
                        <div className="editor-media-item__body">
                          <strong>{getFormatName(format, t)}</strong>
                          <span>
                            {t("media.standard")}: {formatPrice(format.price, t)} · {t("media.imagePrice")}:{" "}
                            {formatPrice(getEffectivePrice(format), t)}
                          </span>
                          <div className="editor-media-item__meta">
                            <select
                              value={format.id}
                              onChange={(event) =>
                                updateDraftFormat(asset.id, index, {
                                  ...formatFromOptions(event.currentTarget.value, printFormats)
                                })
                              }
                            >
                              {printFormats.map((option) => (
                                <option key={option.id} value={option.id}>
                                  {getFormatName(option, t)} · {formatPrice(option.price, t)}
                                </option>
                              ))}
                            </select>
                            <select
                              value={format.priceOverride == null ? "standard" : "override"}
                              onChange={(event) => {
                                const value = event.currentTarget.value;
                                updateDraftFormat(asset.id, index, {
                                  priceOverride:
                                    value === "standard"
                                      ? undefined
                                      : (getEffectivePrice(format) ?? 0)
                                });
                              }}
                            >
                              <option value="standard">{t("media.standardPrice")}</option>
                              <option value="override">{t("media.customPrice")}</option>
                            </select>
                            {format.priceOverride == null ? null : (
                              <input
                                type="number"
                                min={0}
                                value={format.priceOverride}
                                placeholder={t("media.customPrice")}
                                onChange={(event) => {
                                  const value = Number(event.currentTarget.value);
                                  updateDraftFormat(asset.id, index, { priceOverride: value });
                                }}
                              />
                            )}
                          </div>
                        </div>
                        <div className="editor-media-item__actions">
                          <button
                            className="action-button"
                            type="button"
                            onClick={() => removeDraftFormat(asset.id, index)}
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>
                    ))}
                    <button
                      className="editor-button"
                      type="button"
                      onClick={() => addDraftFormat(asset.id, printFormats)}
                    >
                      {t("shop.addFormat")}
                    </button>
                  </div>
                ) : null}
                <button
                  className="editor-button editor-button-primary"
                  type="button"
                  onClick={() => void saveAssetCommerce(asset.id)}
                >
                  {t("shop.save")}
                </button>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );

  async function saveAssetCommerce(assetId: string) {
    const draft = drafts[assetId];
    if (!draft) {
      return;
    }

    setStatus(t("media.saving"));
    const response = await fetch(`/api/editor/media/${assetId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(draft)
    });
    const payload = (await response.json()) as {
      asset?: {
        isProduct: boolean;
        printFormats: PrintFormat[];
      };
      error?: string;
    };

    if (!response.ok || !payload.asset) {
      setStatus(payload.error ?? t("media.saveFailed"));
      return;
    }

    setAssets((current) =>
      current.map((asset) =>
        asset.id === assetId && payload.asset
          ? { ...asset, isProduct: payload.asset.isProduct, printFormats: payload.asset.printFormats }
          : asset
      )
    );
    setDrafts((current) => ({
      ...current,
      [assetId]: {
        isProduct: payload.asset?.isProduct ?? false,
        printFormats: payload.asset?.printFormats ?? []
      }
    }));
    setStatus(t("media.saved"));
  }

  async function createCategory() {
    const value = typeof window !== "undefined" ? window.prompt(t("media.categoryNamePrompt")) : null;
    const nextName = normalizeMediaCategoryName(value ?? "");

    if (!nextName) {
      return;
    }

    setStatus(t("media.creatingCategory"));
    const response = await fetch("/api/editor/media/categories", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: nextName })
    });
    const payload = (await response.json()) as { categories?: MediaCategory[]; error?: string };

    if (!response.ok || !payload.categories) {
      setStatus(payload.error ?? t("media.categoryCreateFailed"));
      return;
    }

    setCategories(payload.categories);
    setCategory(nextName);
    setStatus(null);
  }

  async function renameCategory(currentName: string) {
    const value = typeof window !== "undefined" ? window.prompt(t("media.newCategoryNamePrompt"), currentName) : null;
    const nextName = normalizeMediaCategoryName(value ?? "");

    if (!nextName || nextName === currentName) {
      return;
    }

    setStatus(t("media.renamingCategory"));
    const response = await fetch("/api/editor/media/categories", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ from: currentName, to: nextName })
    });
    const payload = (await response.json()) as { categories?: MediaCategory[]; error?: string };

    if (!response.ok || !payload.categories) {
      setStatus(payload.error ?? t("media.categoryRenameFailed"));
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
    if (typeof window !== "undefined" && !window.confirm(t("media.deleteCategoryConfirm", { name: currentName }))) {
      return;
    }

    setStatus(t("media.deletingCategory"));
    const response = await fetch("/api/editor/media/categories", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: currentName })
    });
    const payload = (await response.json()) as { categories?: MediaCategory[]; error?: string };

    if (!response.ok || !payload.categories) {
      setStatus(payload.error ?? t("media.categoryDeleteFailed"));
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

  async function deleteAsset(asset: MediaLibraryAsset) {
    if (typeof window !== "undefined" && !window.confirm(t("media.deleteImageConfirm", { name: asset.title }))) {
      return;
    }

    setStatus(t("media.deletingImage"));
    const response = await fetch(`/api/editor/media/${asset.id}`, {
      method: "DELETE"
    });
    const payload = (await response.json()) as { deleted?: boolean; error?: string };

    if (!response.ok || !payload.deleted) {
      setStatus(payload.error ?? t("media.imageDeleteFailed"));
      return;
    }

    setAssets((current) => current.filter((item) => item.id !== asset.id));
    setDrafts((current) => {
      const next = { ...current };
      delete next[asset.id];
      return next;
    });
    setStatus(null);
  }

  function addDraftFormat(assetId: string, options: PrintFormat[]) {
    const current = drafts[assetId] ?? { isProduct: false, printFormats: [] };
    const nextFormat = normalizeDraftFormats(current.printFormats, options)[0] ?? options[0];

    if (!nextFormat) {
      return;
    }

    setDrafts((state) => ({
      ...state,
      [assetId]: {
        ...current,
        isProduct: true,
        printFormats: [
          ...current.printFormats,
          { ...nextFormat, id: nextFormat.id, label: nextFormat.label ?? nextFormat.id }
        ]
      }
    }));
  }

  function removeDraftFormat(assetId: string, index: number) {
    const current = drafts[assetId];
    if (!current) {
      return;
    }

    setDrafts((state) => ({
      ...state,
      [assetId]: {
        ...current,
        printFormats: current.printFormats.filter((_, itemIndex) => itemIndex !== index)
      }
    }));
  }

  function updateDraftFormat(assetId: string, index: number, patch: Partial<PrintFormat>) {
    const current = drafts[assetId];
    if (!current) {
      return;
    }

    setDrafts((state) => ({
      ...state,
      [assetId]: {
        ...current,
        printFormats: current.printFormats.map((item, itemIndex) =>
          itemIndex === index ? { ...item, ...patch } : item
        )
      }
    }));
  }
}

function normalizeDraftFormats(value: PrintFormat[], options: PrintFormat[]) {
  if (!value.length) {
    return [];
  }

  const optionMap = new Map(options.map((option) => [option.id, option]));

  return value
    .map((item, index) => {
      const option = optionMap.get(item.id);
      if (!option) {
        return {
          id: item.id || options[0]?.id || `format-${index}`,
          widthCm: item.widthCm,
          heightCm: item.heightCm,
          label: item.label,
          price: item.price,
          priceOverride: item.priceOverride
        };
      }

      const migratedOverride =
        item.priceOverride ??
        (item.price != null && option.price != null && item.price !== option.price ? item.price : undefined);

      return {
        id: option.id,
        widthCm: option.widthCm,
        heightCm: option.heightCm,
        label: item.label ?? option.label,
        price: option.price,
        priceOverride: migratedOverride
      };
    })
    .filter((item) => Boolean(item.id));
}

function formatFromOptions(id: string, options: PrintFormat[]): Partial<PrintFormat> {
  const option = options.find((item) => item.id === id);
  if (!option) {
    return {};
  }

  return {
    id: option.id,
    widthCm: option.widthCm,
    heightCm: option.heightCm,
    label: option.label,
    price: option.price,
    priceOverride: undefined
  };
}

function formatPrice(value: unknown, t: ReturnType<typeof useTranslations>) {
  if (value == null || value === "") {
    return t("media.notSet");
  }

  const price = Number(value);
  return Number.isFinite(price) && price >= 0 ? `${price.toLocaleString("en-US")} ₽` : t("media.notSet");
}

function getEffectivePrice(format: PrintFormat) {
  return format.priceOverride ?? format.price;
}

function getFormatName(format: PrintFormat, t: (key: "commerce.unitCm") => string) {
  const width = Math.max(1, Number(format.widthCm) || 1);
  const height = Math.max(1, Number(format.heightCm) || 1);
  return `${width} × ${height} ${t("commerce.unitCm")}`;
}
