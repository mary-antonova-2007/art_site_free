"use client";

import { useEffect, useState } from "react";
import { ChevronDown, ChevronUp, Plus, Trash2, X } from "lucide-react";

import { getBlockDefinition } from "@artsite/blocks";

import type { SiteBlockRecord } from "@/lib/content";
import { getBlockLabel, getFieldLabel, getFieldOptionLabel } from "@/lib/i18n/blocks";
import { useLocaleMessages, useTranslations } from "@/lib/i18n/client";
import type { MediaVariants } from "@/lib/media";
import { testIds } from "@/lib/test-ids";
import { useTheme } from "@/components/layout/theme-provider";
import { getThemeTokenValues, themeColorTokens, themePresets } from "@/lib/theme-presets";
import { useEditor } from "./editor-provider";

type SavedThemePalette = {
  id: string;
  name: string;
  colors: Record<string, string>;
};

const savedPalettesStorageKey = "artsite-saved-theme-palettes";

export function EditorSheet() {
  const t = useTranslations();
  const localeMessages = useLocaleMessages();
  const { themeId: globalThemeId } = useTheme();
  const {
    activeBlockId,
    blocks,
    updateBlockField,
    pages,
    panelOpen,
    closePanel,
    openMediaLibrary,
    moveBlockMediaItem,
    removeBlockMediaItem,
    updateBlockMediaItemMeta
  } = useEditor();
  const activeBlock = blocks.find((block) => block.id === activeBlockId);
  const [savedPalettes, setSavedPalettes] = useState<SavedThemePalette[]>([]);
  const [paletteName, setPaletteName] = useState("");

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const stored = window.localStorage.getItem(savedPalettesStorageKey);

    if (!stored) {
      setSavedPalettes([]);
      return;
    }

    try {
      const parsed = JSON.parse(stored) as SavedThemePalette[];
      setSavedPalettes(Array.isArray(parsed) ? parsed : []);
    } catch {
      setSavedPalettes([]);
    }
  }, []);

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
  const pageLinkOptions = pages.map((page) => ({
    value: page.slug === "home" ? "/" : `/${page.slug}`,
    label: page.title
  }));
  const showInNavigation = Boolean((activeBlock.data as Record<string, unknown>).showInNavigation);
  const themeOverride =
    typeof (activeBlock.data as Record<string, unknown>).themeOverride === "string"
      ? String((activeBlock.data as Record<string, unknown>).themeOverride)
      : "";
  const useCustomThemeColors = Boolean((activeBlock.data as Record<string, unknown>).useCustomThemeColors);
  const customThemeColors =
    (activeBlock.data as Record<string, unknown>).customThemeColors &&
    typeof (activeBlock.data as Record<string, unknown>).customThemeColors === "object"
      ? ((activeBlock.data as Record<string, unknown>).customThemeColors as Record<string, unknown>)
      : {};
  const resolvedThemeId = themeOverride || globalThemeId;
  const resolvedThemeColors = getThemeTokenValues(resolvedThemeId);
  const themesByGroup = themePresets.reduce<Record<string, typeof themePresets>>((groups, theme) => {
    if (!groups[theme.group]) {
      groups[theme.group] = [];
    }

      groups[theme.group].push(theme);
      return groups;
    }, {});

  const applyResolvedThemeColors = () =>
    updateBlockField(activeBlock.id, "customThemeColors", {
      ...resolvedThemeColors
    });

  const activePaletteColors = themeColorTokens.reduce<Record<string, string>>((colors, token) => {
    const rawValue = customThemeColors[token.field];
    const resolvedValue =
      typeof rawValue === "string" && rawValue.trim()
        ? rawValue
        : resolvedThemeColors[token.field] ?? "";

    if (resolvedValue) {
      colors[token.field] = resolvedValue;
    }

    return colors;
  }, {});

  const persistSavedPalettes = (nextPalettes: SavedThemePalette[]) => {
    setSavedPalettes(nextPalettes);

    if (typeof window !== "undefined") {
      window.localStorage.setItem(savedPalettesStorageKey, JSON.stringify(nextPalettes));
    }
  };

  const saveCurrentPalette = () => {
    const trimmedName = paletteName.trim();

    if (!trimmedName) {
      return;
    }

    const nextPalette: SavedThemePalette = {
      id: crypto.randomUUID(),
      name: trimmedName,
      colors: activePaletteColors
    };

    persistSavedPalettes([nextPalette, ...savedPalettes]);
    setPaletteName("");
  };

  const applySavedPalette = (palette: SavedThemePalette) => {
    updateBlockField(activeBlock.id, "useCustomThemeColors", true);
    updateBlockField(activeBlock.id, "customThemeColors", palette.colors);
  };

  const removeSavedPalette = (paletteId: string) => {
    persistSavedPalettes(savedPalettes.filter((palette) => palette.id !== paletteId));
  };

  return (
    <aside className="editor-panel">
      <div className="editor-panel-header">
        <h3>{getBlockLabel(localeMessages, activeBlock.blockType, definition.label)}</h3>
        <button className="editor-panel-close" type="button" onClick={closePanel} aria-label={t("editor.closePanel")}>
          <X size={18} />
        </button>
      </div>
      <p className="mini-note">{t("editorPanel.dataOnly")}</p>
      <label className="editor-field editor-field-checkbox" data-testid={testIds.blockField}>
        <span>{getFieldLabel(localeMessages, "showInNavigation", "Показывать в навигации")}</span>
        <input
          id="showInNavigation"
          type="checkbox"
          checked={showInNavigation}
          onChange={(event) =>
            updateBlockField(activeBlock.id, "showInNavigation", event.currentTarget.checked)
          }
        />
      </label>
      <label className="editor-field" data-testid={testIds.blockField}>
        <span>Цветовая схема блока</span>
        <select
          value={themeOverride}
          onChange={(event) =>
            updateBlockField(
              activeBlock.id,
              "themeOverride",
              event.currentTarget.value ? event.currentTarget.value : undefined
            )
          }
        >
          <option value="">По умолчанию</option>
          {Object.entries(themesByGroup).map(([group, themes]) => (
            <optgroup key={group} label={group}>
              {themes.map((theme) => (
                <option key={theme.id} value={theme.id}>
                  {theme.name}
                </option>
              ))}
            </optgroup>
          ))}
        </select>
      </label>
      <label className="editor-field editor-field-checkbox" data-testid={testIds.blockField}>
        <span>Свои цвета</span>
        <input
          type="checkbox"
          checked={useCustomThemeColors}
          onChange={(event) => {
            const nextChecked = event.currentTarget.checked;
            updateBlockField(activeBlock.id, "useCustomThemeColors", nextChecked);

            if (nextChecked) {
              const hasAnyCustomColor = themeColorTokens.some(
                (token) =>
                  typeof customThemeColors[token.field] === "string" &&
                  String(customThemeColors[token.field]).trim()
              );

              if (!hasAnyCustomColor) {
                applyResolvedThemeColors();
              }
            }
          }}
        />
      </label>
      {useCustomThemeColors ? (
        <div className="editor-theme-grid" data-testid={testIds.blockField}>
          <div className="editor-theme-actions">
            <button
              className="editor-button"
              type="button"
              onClick={applyResolvedThemeColors}
            >
              Сбросить цвета
            </button>
            <div className="editor-theme-save">
              <input
                value={paletteName}
                placeholder="Имя палитры"
                onChange={(event) => setPaletteName(event.currentTarget.value)}
              />
              <button
                className="editor-button"
                type="button"
                onClick={saveCurrentPalette}
                disabled={!paletteName.trim()}
              >
                Сохранить палитру
              </button>
            </div>
          </div>
          {savedPalettes.length ? (
            <div className="editor-theme-library">
              {savedPalettes.map((palette) => (
                <div className="editor-theme-library__item" key={palette.id}>
                  <div className="editor-theme-library__meta">
                    <strong>{palette.name}</strong>
                    <div className="editor-theme-library__swatches">
                      {themeColorTokens.slice(0, 5).map((token) => (
                        <span
                          key={`${palette.id}-${token.field}`}
                          className="editor-theme-library__swatch"
                          style={{ background: palette.colors[token.field] ?? resolvedThemeColors[token.field] }}
                        />
                      ))}
                    </div>
                  </div>
                  <div className="editor-theme-library__actions">
                    <button className="editor-button" type="button" onClick={() => applySavedPalette(palette)}>
                      Применить
                    </button>
                    <button className="editor-button" type="button" onClick={() => removeSavedPalette(palette.id)}>
                      Удалить
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : null}
          {themeColorTokens.map((token) => {
            const rawValue = customThemeColors[token.field];
            const resolvedValue =
              typeof rawValue === "string" && rawValue.trim()
                ? rawValue
                : resolvedThemeColors[token.field] ?? "";
            const colorValue =
              /^#[0-9a-fA-F]{6}$/.test(resolvedValue) ? resolvedValue : "#000000";

            return (
              <label className="editor-theme-color" key={token.field}>
                <span>{token.label}</span>
                <div className="editor-theme-color__controls">
                  <input
                    type="color"
                    value={colorValue}
                    onChange={(event) =>
                      updateBlockField(activeBlock.id, "customThemeColors", {
                        ...customThemeColors,
                        [token.field]: event.currentTarget.value
                      })
                    }
                  />
                  <input
                    type="text"
                    value={resolvedValue}
                    placeholder="#000000"
                    onChange={(event) =>
                      updateBlockField(activeBlock.id, "customThemeColors", {
                        ...customThemeColors,
                        [token.field]: event.currentTarget.value
                      })
                    }
                  />
                </div>
              </label>
            );
          })}
        </div>
      ) : null}
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
            {getMediaCollectionItems(activeBlock).map((item, index) => {
              const mediaItem = item as {
                id: string;
                label: string;
                previewUrl: string;
                caption?: string;
                alt?: string;
              };

              return (
              <div className="editor-media-item" key={`${mediaItem.id}-${index}`}>
                <img src={mediaItem.previewUrl} alt={mediaItem.label} />
                <div className="editor-media-item__body">
                  <strong>{mediaItem.label}</strong>
                  {typeof mediaItem.caption === "string" || typeof mediaItem.alt === "string" ? (
                    <div className="editor-media-item__meta">
                      {typeof mediaItem.caption === "string" ? (
                        <input
                          value={mediaItem.caption}
                          placeholder="Подпись"
                          onChange={(event) =>
                            updateBlockMediaItemMeta(activeBlock.id, index, {
                              caption: event.currentTarget.value
                            })
                          }
                        />
                      ) : null}
                      {typeof mediaItem.alt === "string" ? (
                        <input
                          value={mediaItem.alt}
                          placeholder="Alt-текст"
                          onChange={(event) =>
                            updateBlockMediaItemMeta(activeBlock.id, index, {
                              alt: event.currentTarget.value
                            })
                          }
                        />
                      ) : null}
                    </div>
                  ) : null}
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
            )})}
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

        if (field.name === "buttonLink") {
          const currentValue = typeof value === "string" ? value : "";
          const knownValues = new Set(pageLinkOptions.map((option) => option.value));
          const options = knownValues.has(currentValue) || !currentValue
            ? pageLinkOptions
            : [{ value: currentValue, label: currentValue }, ...pageLinkOptions];

          return (
            <label className="editor-field" key={field.name} data-testid={testIds.blockField}>
              <span>{getFieldLabel(localeMessages, field.name, field.label)}</span>
              <select
                id={field.name}
                value={currentValue}
                onChange={(event) =>
                  updateBlockField(activeBlock.id, field.name, event.currentTarget.value)
                }
              >
                <option value="">Выберите ссылку</option>
                {options.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
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
  return ["hero", "image", "imageText", "about", "gallery", "worksGrid", "seriesGrid"].includes(blockType);
}

function hasMediaCollection(block: SiteBlockRecord) {
  return (
    ("items" in block.data && Array.isArray(block.data.items)) ||
    ("itemIds" in block.data && Array.isArray(block.data.itemIds))
  );
}

function getMediaCollectionItems(block: SiteBlockRecord) {
  if ("items" in block.data && Array.isArray(block.data.items)) {
    return block.data.items.map((item: {
      mediaAssetId?: string;
      caption?: string;
      alt?: string;
      variants?: MediaVariants;
    }, index: number): {
      id: string;
      label: string;
      caption: string;
      alt: string;
      previewUrl: string;
    } => ({
      id: item.mediaAssetId ?? `item-${index}`,
      label: item.caption || item.alt || `Изображение ${index + 1}`,
      caption: item.caption ?? "",
      alt: item.alt ?? "",
      previewUrl:
        item.variants?.thumb?.url ??
        (item.mediaAssetId?.startsWith("/") || item.mediaAssetId?.startsWith("data:")
          ? item.mediaAssetId
          : fallbackPreview(item.mediaAssetId))
    }));
  }

  if ("itemIds" in block.data && Array.isArray(block.data.itemIds)) {
    return block.data.itemIds.map((itemId: string, index: number): {
      id: string;
      label: string;
      previewUrl: string;
    } => ({
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
