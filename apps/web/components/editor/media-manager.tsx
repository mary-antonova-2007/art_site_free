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
      setStatus("Загрузка медиатеки...");
      const response = await fetch("/api/editor/media");
      const payload = (await response.json()) as {
        assets?: MediaLibraryAsset[];
        categories?: MediaCategory[];
        error?: string;
      };

      if (!response.ok) {
        setStatus(payload.error ?? "Не удалось загрузить медиатеку.");
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
        {t("media.libraryHint")} Форматы и стандартные цены создаются в настройках магазина, а здесь для каждого
        изображения включается продажа, выбираются доступные форматы и задаётся индивидуальная цена.
      </p>

      <div className="media-manager-toolbar">
        <a className="editor-button" href="/?editor=1">
          На главную
        </a>
        <a className="editor-button" href="/settings?editor=1">
          Форматы и цены
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
                <label className="editor-field editor-field-checkbox">
                  <span>Доступно для покупки</span>
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
                    <span className="eyebrow">Форматы</span>
                    {draft.printFormats.map((format, index) => (
                      <div className="editor-media-item" key={`${asset.id}-${format.id}-${index}`}>
                        <div className="editor-media-item__body">
                          <strong>{getFormatName(format, t)}</strong>
                          <span>
                            Стандарт: {formatPrice(format.price)} · Для изображения: {formatPrice(getEffectivePrice(format))}
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
                                  {getFormatName(option, t)} · {formatPrice(option.price)}
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
                              <option value="standard">Стандартная цена</option>
                              <option value="override">Своя цена</option>
                            </select>
                            {format.priceOverride == null ? null : (
                              <input
                                type="number"
                                min={0}
                                value={format.priceOverride}
                                placeholder="Своя цена"
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
                      Добавить формат
                    </button>
                  </div>
                ) : null}
                <button
                  className="editor-button editor-button-primary"
                  type="button"
                  onClick={() => void saveAssetCommerce(asset.id)}
                >
                  Сохранить
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

    setStatus("Сохранение...");
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
      setStatus(payload.error ?? "Не удалось сохранить настройки изображения.");
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
    setStatus("Сохранено");
  }

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

function formatPrice(value: unknown) {
  if (value == null || value === "") {
    return "Не задана";
  }

  const price = Number(value);
  return Number.isFinite(price) && price >= 0 ? `${price.toLocaleString("ru-RU")} ₽` : "Не задана";
}

function getEffectivePrice(format: PrintFormat) {
  return format.priceOverride ?? format.price;
}

function getFormatName(format: PrintFormat, t: (key: "commerce.unitCm") => string) {
  const width = Math.max(1, Number(format.widthCm) || 1);
  const height = Math.max(1, Number(format.heightCm) || 1);
  return `${width} × ${height} ${t("commerce.unitCm")}`;
}
