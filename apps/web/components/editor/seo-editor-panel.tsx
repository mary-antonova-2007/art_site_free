"use client";

import { useEffect, useState } from "react";
import { ImagePlus, X } from "lucide-react";

import type { MediaLibraryAsset, PageSeo, SeoLocale } from "@/lib/content";
import { useTranslations } from "@/lib/i18n/client";
import { useEditor } from "./editor-provider";

const seoLocales: SeoLocale[] = ["ru", "en"];

export function SeoEditorPanel() {
  const t = useTranslations();
  const { page, pageSeo, updatePageSeo, seoPanelOpen, closeSeoPanel } = useEditor();
  const [activeLocale, setActiveLocale] = useState<SeoLocale>("ru");
  const [mediaAssets, setMediaAssets] = useState<MediaLibraryAsset[]>([]);

  useEffect(() => {
    if (!seoPanelOpen) return;

    void fetch("/api/editor/media")
      .then((response) => response.json())
      .then((payload: { assets?: MediaLibraryAsset[] }) => setMediaAssets(payload.assets ?? []))
      .catch(() => setMediaAssets([]));
  }, [seoPanelOpen]);

  if (!seoPanelOpen) {
    return null;
  }

  const selectedImage = mediaAssets.find((asset) => asset.mediaAssetId === pageSeo.ogImageAssetId);
  const previewTitle = pageSeo.title[activeLocale]?.trim() || page.title;
  const previewDescription =
    pageSeo.description[activeLocale]?.trim() || t("seo.previewDescriptionFallback");
  const canonicalPath = pageSeo.canonicalPath?.trim() || (page.slug === "home" ? "/" : `/${page.slug}`);

  const updateSeo = (patch: Partial<PageSeo>) => updatePageSeo({ ...pageSeo, ...patch });
  const updateLocalized = (field: "title" | "description", value: string) =>
    updateSeo({
      [field]: {
        ...pageSeo[field],
        [activeLocale]: value
      }
    });

  return (
    <aside className="editor-panel seo-editor-panel">
      <div className="editor-panel-header">
        <h3>{t("seo.panelTitle")}</h3>
        <button className="editor-panel-close" type="button" onClick={closeSeoPanel} aria-label={t("editor.closePanel")}>
          <X size={18} />
        </button>
      </div>
      <div className="seo-locale-tabs" role="tablist" aria-label={t("seo.languageTabs")}>
        {seoLocales.map((locale) => (
          <button
            key={locale}
            className={locale === activeLocale ? "seo-locale-tab seo-locale-tab--active" : "seo-locale-tab"}
            type="button"
            onClick={() => setActiveLocale(locale)}
          >
            {locale.toUpperCase()}
          </button>
        ))}
      </div>
      <label className="editor-field">
        <span>{t("seo.metaTitle")}</span>
        <input
          value={pageSeo.title[activeLocale] ?? ""}
          onChange={(event) => updateLocalized("title", event.currentTarget.value)}
          maxLength={90}
        />
        <small className={getLengthClass(previewTitle.length, 30, 60)}>
          {previewTitle.length} / 30-60
        </small>
      </label>
      <label className="editor-field">
        <span>{t("seo.metaDescription")}</span>
        <textarea
          value={pageSeo.description[activeLocale] ?? ""}
          onChange={(event) => updateLocalized("description", event.currentTarget.value)}
          maxLength={220}
          rows={4}
        />
        <small className={getLengthClass(previewDescription.length, 70, 160)}>
          {previewDescription.length} / 70-160
        </small>
      </label>
      <label className="editor-field">
        <span>{t("seo.canonicalPath")}</span>
        <input
          value={pageSeo.canonicalPath ?? ""}
          placeholder={canonicalPath}
          onChange={(event) => updateSeo({ canonicalPath: event.currentTarget.value })}
        />
      </label>
      <label className="editor-field editor-field-checkbox">
        <span>{t("seo.noindex")}</span>
        <input
          type="checkbox"
          checked={pageSeo.noIndex === true}
          onChange={(event) => updateSeo({ noIndex: event.currentTarget.checked })}
        />
      </label>
      <label className="editor-field">
        <span>{t("seo.ogImage")}</span>
        <select
          value={pageSeo.ogImageAssetId ?? ""}
          onChange={(event) => updateSeo({ ogImageAssetId: event.currentTarget.value })}
        >
          <option value="">{t("seo.noImage")}</option>
          {mediaAssets.map((asset) => (
            <option key={asset.mediaAssetId} value={asset.mediaAssetId}>{asset.title}</option>
          ))}
        </select>
      </label>
      <div className="seo-preview-card">
        <span className="seo-preview-url">{canonicalPath}</span>
        <strong>{previewTitle}</strong>
        <p>{previewDescription}</p>
      </div>
      <div className="seo-social-preview">
        <div className="seo-social-preview__media">
          {selectedImage ? <img src={selectedImage.previewUrl} alt="" /> : <ImagePlus size={28} />}
        </div>
        <div>
          <span>{canonicalPath}</span>
          <strong>{previewTitle}</strong>
          <p>{previewDescription}</p>
        </div>
      </div>
    </aside>
  );
}

function getLengthClass(length: number, min: number, max: number) {
  return length >= min && length <= max ? "seo-length seo-length--ok" : "seo-length";
}
