"use client";

import { type BlockDataMap, getBlockDefinition, type BlockType } from "@artsite/blocks";
import { cn } from "@artsite/ui";

import { EditableBlockFrame } from "@/components/editor/editable-block-frame";
import { InlineEditableText } from "@/components/editor/inline-editing";
import { useEditor } from "@/components/editor/editor-provider";
import { useTranslations } from "@/lib/i18n/client";
import { testIds } from "@/lib/test-ids";
import type { SitePageRecord } from "@/lib/content";

export function PageRenderer({ page }: { page: SitePageRecord }) {
  const { blocks } = useEditor();

  return (
    <main className="site-grid" data-testid={testIds.pageShell} data-page-shell data-page-slug={page.slug}>
      {blocks.map((block, index) => (
        <EditableBlockFrame key={block.id} block={block} index={index}>
          <RenderedBlock blockId={block.id} type={block.blockType} data={block.data} />
        </EditableBlockFrame>
      ))}
    </main>
  );
}

function assetPath(assetId: string, fallback: string) {
  if (assetId.startsWith("http://") || assetId.startsWith("https://") || assetId.startsWith("/")) {
    return assetId;
  }

  if (assetId.includes("hero")) {
    return "/art-hero.svg";
  }

  if (assetId.includes("portrait")) {
    return "/portrait.svg";
  }

  if (assetId.includes("gallery-1")) {
    return "/art-01.svg";
  }

  if (assetId.includes("gallery-2")) {
    return "/art-02.svg";
  }

  if (assetId.includes("sample-image-text")) {
    return "/portrait.svg";
  }

  if (assetId.includes("sample-image")) {
    return "/art-03.svg";
  }

  return fallback;
}

function RenderedBlock<TType extends BlockType>({
  blockId,
  type,
  data
}: {
  blockId: string;
  type: TType;
  data: BlockDataMap[TType];
}) {
  const { enabled, updateBlockField, openMediaLibrary } = useEditor();
  const t = useTranslations();
  const definition = getBlockDefinition(type);

  switch (type) {
    case "hero": {
      const heroData = data as BlockDataMap["hero"];
      return (
        <section className="site-section poster-hero">
          <div className="hero-copy">
            <span className="eyebrow">
              <InlineEditableText blockId={blockId} field="eyebrow" value={heroData.eyebrow ?? ""} />
            </span>
            <h1 className="hero-title">
              <InlineEditableText blockId={blockId} field="title" value={heroData.title ?? ""} />
            </h1>
            <p className="hero-subtitle">
              <InlineEditableText blockId={blockId} field="subtitle" value={heroData.subtitle ?? ""} multiline />
            </p>
            <div className="hero-block__actions">
              {enabled ? (
                <span className="pill-link">
                  <InlineEditableText blockId={blockId} field="buttonText" value={heroData.buttonText ?? ""} />
                </span>
              ) : (
                <a className="pill-link" href={heroData.buttonLink}>
                  <InlineEditableText blockId={blockId} field="buttonText" value={heroData.buttonText ?? ""} />
                </a>
              )}
            </div>
          </div>
          <div className="hero-media">
            <img
              src={assetPath(heroData.image?.mediaAssetId ?? "hero", "/art-hero.svg")}
              alt={heroData.image?.alt ?? ""}
              style={{ width: "100%", height: "100%", objectFit: "cover" }}
              onClick={enabled ? () => void openMediaLibrary(blockId, "replace") : undefined}
            />
            <div className="media-label">{heroData.image?.alt ?? t("media.heroImage")}</div>
          </div>
        </section>
      );
    }
    case "richText": {
      const richTextData = data as BlockDataMap["richText"];
      return (
        <section
          className={cn(
            "site-section section-stack",
            richTextData.width === "wide" ? "width-wide" : "width-medium",
            richTextData.align === "center" ? "align-center" : "align-left"
          )}
        >
          <h2 className="rich-title">
            <InlineEditableText blockId={blockId} field="title" value={richTextData.title ?? ""} />
          </h2>
          {enabled ? (
            <textarea
              className="rich-body inline-editable inline-editable--textarea"
              value={richTextData.text}
              onChange={(event) => updateBlockField(blockId, "text", event.currentTarget.value)}
            />
          ) : (
            <p className="rich-body">{richTextData.text}</p>
          )}
        </section>
      );
    }
    case "image": {
      const imageData = data as BlockDataMap["image"];
      return (
        <section className="site-section width-wide">
          <div className="image-panel">
            <img
              src={assetPath(imageData.image?.mediaAssetId ?? "sample-image", "/art-03.svg")}
              alt={imageData.alt ?? imageData.image?.alt ?? ""}
              style={{ width: "100%", height: "100%", objectFit: "cover" }}
              onClick={enabled ? () => void openMediaLibrary(blockId, "replace") : undefined}
            />
            <div className="media-label">{imageData.alt ?? imageData.image?.alt ?? t("media.image")}</div>
          </div>
          <p className="image-caption">
            <InlineEditableText blockId={blockId} field="caption" value={imageData.caption ?? ""} />
          </p>
        </section>
      );
    }
    case "imageText": {
      const imageTextData = data as BlockDataMap["imageText"];
      return (
        <section className="site-section image-text-grid">
          {imageTextData.imagePosition === "left" ? (
            <ImagePanel
              caption={imageTextData.caption ?? ""}
              alt={imageTextData.image?.alt ?? t("media.image")}
              src={imageTextData.image?.mediaAssetId ?? "portrait"}
              onClick={enabled ? () => void openMediaLibrary(blockId, "replace") : undefined}
            />
          ) : null}
          <div className="section-stack">
            <h2 className="section-title">
              <InlineEditableText blockId={blockId} field="title" value={imageTextData.title ?? ""} />
            </h2>
            {enabled ? (
              <textarea
                className="image-text-body inline-editable inline-editable--textarea"
                value={imageTextData.text ?? ""}
                onChange={(event) => updateBlockField(blockId, "text", event.currentTarget.value)}
              />
            ) : (
              <p className="image-text-body">{imageTextData.text ?? ""}</p>
            )}
            <p className="caption">
              <InlineEditableText blockId={blockId} field="caption" value={imageTextData.caption ?? ""} />
            </p>
          </div>
          {imageTextData.imagePosition === "right" ? (
            <ImagePanel
              caption={imageTextData.caption ?? ""}
              alt={imageTextData.image?.alt ?? t("media.image")}
              src={imageTextData.image?.mediaAssetId ?? "portrait"}
              onClick={enabled ? () => void openMediaLibrary(blockId, "replace") : undefined}
            />
          ) : null}
        </section>
      );
    }
    case "gallery": {
      const galleryData = data as BlockDataMap["gallery"];
      return (
        <section className="site-section section-stack">
          <h2 className="section-title">
            <InlineEditableText blockId={blockId} field="title" value={galleryData.title ?? ""} />
          </h2>
          <div className="gallery-grid">
            {(galleryData.items ?? []).map((item: { mediaAssetId?: string; caption?: string; alt?: string }) => (
              <article key={item.mediaAssetId ?? item.caption ?? "item"} className="gallery-card">
                <img
                  src={assetPath(item.mediaAssetId ?? item.caption ?? "gallery-1", "/art-04.svg")}
                  alt={item.caption ?? item.mediaAssetId ?? t("media.galleryItem")}
                  style={{ width: "100%", height: "100%", objectFit: "cover" }}
                />
                <div className="media-label">{item.caption ?? item.mediaAssetId}</div>
              </article>
            ))}
          </div>
          {enabled ? (
            <button className="insert-button" type="button" onClick={() => void openMediaLibrary(blockId, "append")}>
              {t("media.addImages")}
            </button>
          ) : null}
        </section>
      );
    }
    case "quote": {
      const quoteData = data as BlockDataMap["quote"];
      return (
        <section className="site-section quote-wrap">
          <blockquote className="quote-text">
            <InlineEditableText blockId={blockId} field="quote" value={quoteData.quote ?? ""} multiline />
          </blockquote>
          <div className="quote-author">
            <InlineEditableText blockId={blockId} field="author" value={quoteData.author ?? ""} />
          </div>
        </section>
      );
    }
    case "sectionHeader": {
      const sectionHeaderData = data as BlockDataMap["sectionHeader"];
      return (
        <section className="site-section section-stack width-medium">
          <span className="eyebrow">
            <InlineEditableText blockId={blockId} field="eyebrow" value={sectionHeaderData.eyebrow ?? ""} />
          </span>
          <h2 className="section-title">
            <InlineEditableText blockId={blockId} field="title" value={sectionHeaderData.title ?? ""} />
          </h2>
          <p className="section-description">
            <InlineEditableText blockId={blockId} field="description" value={sectionHeaderData.description ?? ""} multiline />
          </p>
        </section>
      );
    }
    case "divider": {
      const dividerData = data as BlockDataMap["divider"];
      return (
        <section
          className={cn(
            "site-section",
            dividerData.spacing === "compact"
              ? "divider-space-s"
              : dividerData.spacing === "loose"
                ? "divider-space-l"
                : "divider-space-m"
          )}
        >
          {dividerData.style === "line" ? <div className="divider-line" /> : null}
        </section>
      );
    }
    case "contact": {
      const contactData = data as BlockDataMap["contact"];
      return (
        <section className="site-section contact-grid">
          <div className="section-stack">
            <h2 className="section-title">
              <InlineEditableText blockId={blockId} field="title" value={contactData.title ?? ""} />
            </h2>
            <p className="contact-text">
              <InlineEditableText blockId={blockId} field="text" value={contactData.text ?? ""} multiline />
            </p>
          </div>
          <div className="links-grid">
            {enabled ? (
              <span className="page-chip">
                <InlineEditableText blockId={blockId} field="email" value={contactData.email ?? ""} />
              </span>
            ) : (
              <a className="page-chip" href={`mailto:${contactData.email ?? ""}`}>
                <InlineEditableText blockId={blockId} field="email" value={contactData.email ?? ""} />
              </a>
            )}
            {enabled ? (
              <span className="page-chip">
                <InlineEditableText blockId={blockId} field="phone" value={contactData.phone ?? ""} />
              </span>
            ) : (
              <a className="page-chip" href={`tel:${contactData.phone ?? ""}`}>
                <InlineEditableText blockId={blockId} field="phone" value={contactData.phone ?? ""} />
              </a>
            )}
            {(contactData.socialLinks ?? []).map((item: { href: string; label: string; external?: boolean }) => (
              <a className="page-chip" key={item.href} href={item.href}>
                {item.label}
              </a>
            ))}
          </div>
        </section>
      );
    }
    case "worksGrid":
    case "seriesGrid": {
      const collectionData = data as BlockDataMap["worksGrid"] | BlockDataMap["seriesGrid"];
      return (
        <section className="site-section section-stack">
          <h2 className="section-title">
            <InlineEditableText blockId={blockId} field="title" value={collectionData.title ?? ""} />
          </h2>
          <div
            className={cn(
              "collection-grid",
              collectionData.layout === "carousel" ? "collection-grid--carousel" : undefined
            )}
            style={
              collectionData.layout === "carousel"
                ? undefined
                : { gridTemplateColumns: `repeat(${collectionData.columns}, minmax(0, 1fr))` }
            }
          >
            {((collectionData.itemIds ?? []).length ? collectionData.itemIds ?? [] : ["alpha", "beta", "gamma"]).map(
              (itemId: string) => (
                <article key={itemId} className="collection-card">
                  <img
                    src={assetPath(itemId, "/art-04.svg")}
                    alt={itemId}
                    style={{ width: "100%", height: "100%", objectFit: "cover" }}
                  />
                  <div className="media-label">{itemId}</div>
                </article>
              )
            )}
          </div>
          {enabled ? (
            <button className="insert-button" type="button" onClick={() => void openMediaLibrary(blockId, "append")}>
              {t("media.addImages")}
            </button>
          ) : null}
        </section>
      );
    }
    case "linksList": {
      const linksListData = data as BlockDataMap["linksList"];
      return (
        <section className="site-section section-stack width-medium">
          <h2 className="section-title">
            <InlineEditableText blockId={blockId} field="title" value={linksListData.title ?? ""} />
          </h2>
          <div className="page-list">
            {(linksListData.items ?? []).map((item: { href: string; label: string; external?: boolean }) => (
              <a key={item.href} className="page-chip" href={item.href}>
                {item.label}
              </a>
            ))}
          </div>
        </section>
      );
    }
    case "cta": {
      const ctaData = data as BlockDataMap["cta"];
      return (
        <section className="site-section">
          <div className="cta-panel">
            <h2 className="cta-title">
              <InlineEditableText blockId={blockId} field="title" value={ctaData.title ?? ""} />
            </h2>
            <p className="hero-subtitle">
              <InlineEditableText blockId={blockId} field="text" value={ctaData.text ?? ""} multiline />
            </p>
            {enabled ? (
              <span className="pill-link">
                <InlineEditableText blockId={blockId} field="buttonText" value={ctaData.buttonText ?? ""} />
              </span>
            ) : (
              <a className="pill-link" href={ctaData.buttonLink ?? "#"}>
                <InlineEditableText blockId={blockId} field="buttonText" value={ctaData.buttonText ?? ""} />
              </a>
            )}
          </div>
        </section>
      );
    }
    default:
      return (
        <section className="site-section">
          <pre>{definition.label}</pre>
        </section>
      );
  }
}

function ImagePanel({
  alt,
  caption,
  src,
  onClick
}: {
  alt: string;
  caption: string;
  src: string;
  onClick?: () => void;
}) {
  return (
    <div className="section-stack">
      <div className="image-panel">
        <img
          src={assetPath(src, "/portrait.svg")}
          alt={alt}
          style={{ width: "100%", height: "100%", objectFit: "cover" }}
          onClick={onClick}
        />
        <div className="media-label">{alt}</div>
      </div>
      <p className="caption">{caption}</p>
    </div>
  );
}
