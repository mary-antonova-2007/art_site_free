"use client";

import {
  closestCenter,
  DndContext,
  DragOverlay,
  PointerSensor,
  pointerWithin,
  useDroppable,
  useSensor,
  useSensors,
  type CollisionDetection,
  type DragEndEvent,
  type DragStartEvent
} from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { type BlockDataMap, getBlockDefinition, type BlockType } from "@artsite/blocks";
import { cn } from "@artsite/ui";
import { Instagram, Mail, Phone } from "lucide-react";
import { useEffect, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";

import { BlockLibraryTray } from "@/components/editor/block-library-tray";
import { EditableBlockFrame } from "@/components/editor/editable-block-frame";
import { useEditor } from "@/components/editor/editor-provider";
import { ImageCarousel } from "@/components/site/image-carousel";
import { getBlockAnchorId } from "@/lib/block-navigation";
import { readCart, writeCart } from "@/lib/cart";
import { useTranslations } from "@/lib/i18n/client";
import type { MediaLibraryAsset, PrintFormat, SiteCommerceSettings } from "@/lib/content";
import {
  buildResponsiveImageSource,
  getPreferredImageUrl,
  type MediaVariants,
  type MediaVariantName
} from "@/lib/media";
import { testIds } from "@/lib/test-ids";
import type { SitePageRecord } from "@/lib/content";

export function PageRenderer({
  page,
  commerceSettings,
  mediaAssetsById
}: {
  page: SitePageRecord;
  commerceSettings: SiteCommerceSettings;
  mediaAssetsById: Record<string, MediaLibraryAsset>;
}) {
  const t = useTranslations();
  const { blocks, insertBlockAt, moveBlockToIndex } = useEditor();
  const [activeDragId, setActiveDragId] = useState<string | null>(null);
  const [previewImage, setPreviewImage] = useState<{
    src: string;
    alt: string;
    title: string;
    formats: PrintFormat[];
    isProduct: boolean;
    mediaAssetId?: string;
  } | null>(null);
  const [selectedFormatId, setSelectedFormatId] = useState("");
  const [quantity, setQuantity] = useState(1);
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 8 } }));

  useEffect(() => {
    if (!previewImage || typeof document === "undefined") {
      return;
    }

    const { body, documentElement } = document;
    const previousBodyOverflow = body.style.overflow;
    const previousBodyTouchAction = body.style.touchAction;
    const previousHtmlOverflow = documentElement.style.overflow;

    body.style.overflow = "hidden";
    body.style.touchAction = "none";
    documentElement.style.overflow = "hidden";

    return () => {
      body.style.overflow = previousBodyOverflow;
      body.style.touchAction = previousBodyTouchAction;
      documentElement.style.overflow = previousHtmlOverflow;
    };
  }, [previewImage]);

  useEffect(() => {
    const firstFormat = previewImage?.formats[0];
    setSelectedFormatId((current) => current || firstFormat?.id || "");
    setQuantity((current) => Math.max(1, current));
  }, [previewImage]);

  const collisionDetection: CollisionDetection = (args) => {
    const activeKind = args.active.data.current?.kind;
    const pointer = args.pointerCoordinates;

    if (pointer && typeof document !== "undefined") {
      const blockLibrarySheet = document.querySelector<HTMLElement>(".block-library__sheet");
      const blockLibraryToggle = document.querySelector<HTMLElement>(".block-library__toggle");

      const isInsideRect = (element: HTMLElement | null) => {
        if (!element) {
          return false;
        }

        const rect = element.getBoundingClientRect();
        return (
          pointer.x >= rect.left &&
          pointer.x <= rect.right &&
          pointer.y >= rect.top &&
          pointer.y <= rect.bottom
        );
      };

      if (isInsideRect(blockLibrarySheet) || isInsideRect(blockLibraryToggle)) {
        return [];
      }
    }

    if (activeKind === "palette") {
      const insertContainers = args.droppableContainers.filter((container) =>
        String(container.id).startsWith("__insert__:")
      );

      return pointerWithin({
        ...args,
        droppableContainers: insertContainers
      });
    }

    const moveContainers = args.droppableContainers.filter((container) =>
      String(container.id).startsWith("__insert__:")
    );

    return closestCenter({
      ...args,
      droppableContainers: moveContainers
    });
  };

  function handleDragStart(event: DragStartEvent) {
    setActiveDragId(String(event.active.id));
  }

  function handleDragEnd(event: DragEndEvent) {
    setActiveDragId(null);

    if (!event.over) {
      return;
    }

    const overId = String(event.over.id);
    const activeId = String(event.active.id);
    const activeData = event.active.data.current;

    if (activeData?.kind === "palette") {
      const blockType = activeData.blockType as BlockType;

      if (overId.startsWith("__insert__:")) {
        const insertIndex = Number(overId.replace("__insert__:", ""));

        if (Number.isFinite(insertIndex)) {
          insertBlockAt(insertIndex, blockType);
        }

        return;
      }

      return;
    }

    if (activeData?.kind !== "block") {
      return;
    }

    if (overId.startsWith("__insert__:")) {
      const insertIndex = Number(overId.replace("__insert__:", ""));
      const currentIndex = blocks.findIndex((block) => block.id === activeId);

      if (!Number.isFinite(insertIndex) || currentIndex === -1) {
        return;
      }

      const adjustedIndex = currentIndex < insertIndex ? insertIndex - 1 : insertIndex;
      moveBlockToIndex(activeId, adjustedIndex);
    }
  }

  function addProductToCart() {
    if (!previewImage) {
      return;
    }

    const format = previewImage.formats.find((item) => item.id === selectedFormatId) ?? previewImage.formats[0];
    if (!format) {
      return;
    }

    const current = readCart();
    const key = `${previewImage.src}:${format.id}`;
    const next = current.find((item) => item.id === key)
      ? current.map((item) => (item.id === key ? { ...item, quantity: item.quantity + quantity } : item))
      : [
          {
            id: key,
            imageSrc: previewImage.src,
            title: previewImage.title,
            alt: previewImage.alt,
            format,
            availableFormats: previewImage.formats,
            quantity
          },
          ...current
        ];

    writeCart(next);
    setPreviewImage(null);
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={collisionDetection}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <SortableContext items={blocks.map((block) => block.id)} strategy={verticalListSortingStrategy}>
        <main
          className="site-grid"
          data-testid={testIds.pageShell}
          data-page-shell
          data-page-slug={page.slug}
        >
          {blocks.map((block, index) => (
            <InsertDropTarget key={`insert-${block.id}`} index={index}>
              <EditableBlockFrame block={block} anchorId={getBlockAnchorId(block.id)}>
                <RenderedBlock
                  blockId={block.id}
                  type={block.blockType}
                  data={block.data}
                  onOpenImagePreview={setPreviewImage}
                  commerceSettings={commerceSettings}
                  mediaAssetsById={mediaAssetsById}
                />
              </EditableBlockFrame>
            </InsertDropTarget>
          ))}
          <InsertDropTarget index={blocks.length}>
            <PageEndDropTarget />
          </InsertDropTarget>
        </main>
      </SortableContext>
      <BlockLibraryTray />
      <DragOverlay>{activeDragId ? <div className="block-drag-ghost" /> : null}</DragOverlay>
      {previewImage && typeof document !== "undefined"
        ? createPortal(
            <div
              className="image-lightbox"
              role="dialog"
              aria-modal="true"
              aria-label={t("header.imagePreview")}
              onClick={() => setPreviewImage(null)}
            >
              <div
                className="image-lightbox__stage"
                data-product={
                  previewImage.isProduct && commerceSettings.cartEnabled && previewImage.formats.length ? "true" : "false"
                }
                onClick={(event) => event.stopPropagation()}
              >
                <img
                  className="image-lightbox__image"
                  src={previewImage.src}
                  alt={previewImage.alt}
                  onClick={() => setPreviewImage(null)}
                />
                {previewImage.isProduct && commerceSettings.cartEnabled && previewImage.formats.length ? (
                  <div className="product-modal__panel image-lightbox__product-panel">
                    <div className="product-modal__content">
                      <h3>{previewImage.title}</h3>
                      <p className="product-modal__note">{t("commerce.productModalNote")}</p>
                      <label className="editor-field">
                        <span>{t("commerce.printFormat")}</span>
                        <select
                          value={selectedFormatId}
                          onChange={(event) => setSelectedFormatId(event.currentTarget.value)}
                        >
                          {previewImage.formats.map((format) => (
                            <option key={format.id} value={format.id}>
                              {getFormatName(format, t)} · {formatPrice(getEffectivePrice(format), t)}
                            </option>
                          ))}
                        </select>
                      </label>
                      <label className="editor-field">
                        <span>{t("commerce.quantity")}</span>
                        <input
                          type="number"
                          min={1}
                          value={quantity}
                          onChange={(event) => setQuantity(Math.max(1, Number(event.currentTarget.value) || 1))}
                        />
                      </label>
                      {(() => {
                        const selectedFormat =
                          previewImage.formats.find((item) => item.id === selectedFormatId) ?? previewImage.formats[0];
                        return selectedFormat ? (
                          <div className="product-modal__format-card">
                            <div className="product-modal__format-preview" aria-hidden="true">
                              <div
                                className="product-modal__format-preview-inner"
                                style={getPreviewStyle(selectedFormat.widthCm, selectedFormat.heightCm)}
                              />
                            </div>
                            <div className="product-modal__format-info">
                              <strong>{getFormatName(selectedFormat, t)}</strong>
                              <span>
                                {selectedFormat.widthCm} × {selectedFormat.heightCm} {t("commerce.unitCm")}
                              </span>
                              <span>{formatPrice(getEffectivePrice(selectedFormat), t)}</span>
                            </div>
                          </div>
                        ) : null;
                      })()}
                      <div className="product-modal__actions">
                        <button className="editor-button" type="button" onClick={addProductToCart}>
                          {t("commerce.addToCart")}
                        </button>
                        <button
                          className="editor-button editor-button-primary"
                          type="button"
                          onClick={() => {
                            addProductToCart();
                            window.location.assign("/cart");
                          }}
                        >
                          {t("commerce.buy")}
                        </button>
                      </div>
                    </div>
                  </div>
                ) : null}
              </div>
            </div>,
            document.body
          )
        : null}
    </DndContext>
  );
}

function InsertDropTarget({
  index,
  children
}: {
  index: number;
  children: ReactNode;
}) {
  const { setNodeRef, isOver } = useDroppable({
    id: `__insert__:${index}`,
    data: {
      kind: "insert-slot",
      index
    }
  });

  return (
    <div className="insert-drop-target" ref={setNodeRef} data-over={isOver}>
      <div className="insert-drop-target__preview" />
      {children}
    </div>
  );
}

function PageEndDropTarget() {
  const { setNodeRef, isOver } = useDroppable({
    id: "__page-end__",
    data: {
      kind: "canvas-end"
    }
  });

  return <div ref={setNodeRef} className="block-drop-target" data-over={isOver} data-drop-target="page-end" />;
}

function assetPath(assetId: string, fallback: string) {
  if (
    assetId.startsWith("http://") ||
    assetId.startsWith("https://") ||
    assetId.startsWith("/") ||
    assetId.startsWith("data:") ||
    assetId.startsWith("blob:")
  ) {
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

function getFieldVariants(field: unknown): MediaVariants | undefined {
  if (!field || typeof field !== "object" || !("variants" in field)) {
    return undefined;
  }

  return (field as { variants?: MediaVariants }).variants;
}

function getResponsiveAssetSource(
  assetId: string | undefined,
  fallback: string,
  variants: MediaVariants | undefined,
  preferredVariant: MediaVariantName,
  sizes?: string
) {
  const resolvedSource = assetPath(assetId ?? "", fallback);
  return {
    fullSrc: resolvedSource,
    ...buildResponsiveImageSource(resolvedSource, variants, preferredVariant, sizes)
  };
}

function hasEditorialCaption(value?: string | null) {
  if (!value) {
    return false;
  }

  const normalized = value.trim();

  if (!normalized) {
    return false;
  }

  return !/\.(png|jpe?g|webp|gif|svg|avif)$/i.test(normalized);
}

function RenderedBlock<TType extends BlockType>({
  blockId,
  type,
  data,
  onOpenImagePreview,
  commerceSettings,
  mediaAssetsById
}: {
  blockId: string;
  type: TType;
  data: BlockDataMap[TType];
  onOpenImagePreview: (input: {
    src: string;
    alt: string;
    title: string;
    formats: PrintFormat[];
    isProduct: boolean;
    mediaAssetId?: string;
  }) => void;
  commerceSettings: SiteCommerceSettings;
  mediaAssetsById: Record<string, MediaLibraryAsset>;
}) {
  const t = useTranslations();
  const definition = getBlockDefinition(type);

  switch (type) {
    case "hero": {
      const heroData = data as BlockDataMap["hero"];
      const heroAsset = heroData.image?.mediaAssetId ? mediaAssetsById[heroData.image.mediaAssetId] : undefined;
      const heroImage = getResponsiveAssetSource(
        heroData.image?.mediaAssetId,
        "/art-hero.svg",
        getFieldVariants(heroData.image),
        "hero",
        "(max-width: 920px) 100vw, 55vw"
      );
      return (
        <section className="site-section poster-hero">
          <div className="hero-copy">
            {heroData.eyebrow ? <span className="eyebrow">{heroData.eyebrow}</span> : null}
            <h1 className="hero-title">{heroData.title ?? ""}</h1>
            <p className="hero-subtitle">{heroData.subtitle ?? ""}</p>
            <div className="hero-block__actions">
              <a className="pill-link" href={heroData.buttonLink}>
                {heroData.buttonText ?? ""}
              </a>
            </div>
          </div>
          <div className="hero-media">
            <EditableSingleImage
              blockId={blockId}
              src={heroImage.src}
              fullSrc={heroImage.fullSrc}
              srcSet={heroImage.srcSet}
              sizes={heroImage.sizes}
              alt={heroData.image?.alt ?? ""}
              className="site-image site-image--contain"
              onOpenImagePreview={onOpenImagePreview}
              productTitle={heroData.title ?? heroData.image?.alt ?? t("media.image")}
              formats={heroAsset?.isProduct && commerceSettings.cartEnabled ? getMediaAssetPrintFormats(heroAsset, commerceSettings) : []}
              isProduct={Boolean(heroAsset?.isProduct)}
              mediaAssetId={heroData.image?.mediaAssetId}
              loading="eager"
            />
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
          <h2 className="rich-title">{richTextData.title ?? ""}</h2>
          <p className="rich-body">{richTextData.text}</p>
        </section>
      );
    }
    case "image": {
      const imageData = data as BlockDataMap["image"];
      const productAsset = imageData.image?.mediaAssetId ? mediaAssetsById[imageData.image.mediaAssetId] : undefined;
      const blockImage = getResponsiveAssetSource(
        imageData.image?.mediaAssetId,
        "/art-03.svg",
        getFieldVariants(imageData.image),
        "panel",
        "(max-width: 920px) 100vw, min(1280px, 92vw)"
      );
      const blockFormats = imageData.printFormats?.length
        ? imageData.printFormats.map((format, index) => ({
            id: format.id ?? `${blockId}-format-${index}`,
            widthCm: format.widthCm,
            heightCm: format.heightCm,
            label: format.label,
            price: format.price,
            priceOverride: format.priceOverride
          }))
        : commerceSettings.printFormats;
      const formats = productAsset?.printFormats?.length ? productAsset.printFormats : blockFormats;
      const purchasableFormats = commerceSettings.cartEnabled && productAsset?.isProduct ? formats : [];
      const isPurchasable = commerceSettings.cartEnabled && (productAsset?.isProduct || purchasableFormats.length > 0);
      return (
        <section className="site-section width-wide">
          <div className="image-panel">
            <EditableSingleImage
              blockId={blockId}
              src={blockImage.src}
              fullSrc={blockImage.fullSrc}
              srcSet={blockImage.srcSet}
              sizes={blockImage.sizes}
              alt={imageData.alt ?? imageData.image?.alt ?? ""}
              className="site-image site-image--contain"
              onOpenImagePreview={onOpenImagePreview}
              productTitle={imageData.caption ?? imageData.alt ?? imageData.image?.alt ?? t("media.image")}
              formats={purchasableFormats}
              isProduct={isPurchasable}
              mediaAssetId={imageData.image?.mediaAssetId}
            />
          </div>
          <p className="image-caption">{imageData.caption ?? ""}</p>
        </section>
      );
    }
    case "imageText": {
      const imageTextData = data as BlockDataMap["imageText"];
      return (
        <section className="site-section image-text-grid">
          {imageTextData.imagePosition === "left" ? (
            <ImagePanel
              blockId={blockId}
              caption={imageTextData.caption ?? ""}
              alt={imageTextData.image?.alt ?? t("media.image")}
              src={imageTextData.image?.mediaAssetId ?? "portrait"}
              variants={getFieldVariants(imageTextData.image)}
              onOpenImagePreview={onOpenImagePreview}
              productTitle={imageTextData.title ?? imageTextData.image?.alt ?? t("media.image")}
              formats={
                imageTextData.image?.mediaAssetId &&
                mediaAssetsById[imageTextData.image.mediaAssetId]?.isProduct &&
                commerceSettings.cartEnabled
                  ? getMediaAssetPrintFormats(mediaAssetsById[imageTextData.image.mediaAssetId], commerceSettings)
                  : []
              }
              isProduct={Boolean(imageTextData.image?.mediaAssetId && mediaAssetsById[imageTextData.image.mediaAssetId]?.isProduct)}
              mediaAssetId={imageTextData.image?.mediaAssetId}
            />
          ) : null}
          <div className="section-stack">
            <h2 className="section-title">{imageTextData.title ?? ""}</h2>
            <p className="image-text-body">{imageTextData.text ?? ""}</p>
            <p className="caption">{imageTextData.caption ?? ""}</p>
          </div>
          {imageTextData.imagePosition === "right" ? (
            <ImagePanel
              blockId={blockId}
              caption={imageTextData.caption ?? ""}
              alt={imageTextData.image?.alt ?? t("media.image")}
              src={imageTextData.image?.mediaAssetId ?? "portrait"}
              variants={getFieldVariants(imageTextData.image)}
              onOpenImagePreview={onOpenImagePreview}
              productTitle={imageTextData.title ?? imageTextData.image?.alt ?? t("media.image")}
              formats={
                imageTextData.image?.mediaAssetId &&
                mediaAssetsById[imageTextData.image.mediaAssetId]?.isProduct &&
                commerceSettings.cartEnabled
                  ? getMediaAssetPrintFormats(mediaAssetsById[imageTextData.image.mediaAssetId], commerceSettings)
                  : []
              }
              isProduct={Boolean(imageTextData.image?.mediaAssetId && mediaAssetsById[imageTextData.image.mediaAssetId]?.isProduct)}
              mediaAssetId={imageTextData.image?.mediaAssetId}
            />
          ) : null}
        </section>
      );
    }
    case "about": {
      const aboutData = data as BlockDataMap["about"];
      const aboutLinks = aboutData.links ?? [];
      return (
        <section className="site-section image-text-grid">
          <div className="section-stack">
            <h2 className="section-title">{aboutData.title ?? ""}</h2>
            <p className="image-text-body">{aboutData.text ?? ""}</p>
            {aboutLinks.length ? (
              <div className="page-list">
                {aboutLinks.map((item: { href: string; label: string; external?: boolean }) => (
                  <a
                    key={`${item.href}-${item.label}`}
                    className="page-chip"
                    href={item.href}
                    target={item.external ? "_blank" : undefined}
                    rel={item.external ? "noreferrer" : undefined}
                  >
                    {item.label}
                  </a>
                ))}
              </div>
            ) : null}
          </div>
          <ImagePanel
            blockId={blockId}
            caption={aboutData.image?.caption ?? ""}
            alt={aboutData.image?.alt ?? t("media.image")}
            src={aboutData.image?.mediaAssetId ?? "portrait"}
            variants={getFieldVariants(aboutData.image)}
            onOpenImagePreview={onOpenImagePreview}
            productTitle={aboutData.title ?? aboutData.image?.alt ?? t("media.image")}
            formats={
              aboutData.image?.mediaAssetId &&
              mediaAssetsById[aboutData.image.mediaAssetId]?.isProduct &&
              commerceSettings.cartEnabled
                ? getMediaAssetPrintFormats(mediaAssetsById[aboutData.image.mediaAssetId], commerceSettings)
                : []
            }
            isProduct={Boolean(aboutData.image?.mediaAssetId && mediaAssetsById[aboutData.image.mediaAssetId]?.isProduct)}
            mediaAssetId={aboutData.image?.mediaAssetId}
          />
        </section>
      );
    }
    case "gallery": {
      const galleryData = data as BlockDataMap["gallery"];
      const galleryItems = (galleryData.items ?? []).map(
        (
          item: { mediaAssetId?: string; caption?: string; alt?: string; variants?: MediaVariants },
          index: number
        ) => {
          const source = getResponsiveAssetSource(
            item.mediaAssetId,
            "/art-04.svg",
            item.variants,
            "card",
            "(max-width: 920px) 100vw, (max-width: 1280px) 50vw, 33vw"
          );

          return {
            id: `${item.mediaAssetId ?? item.caption ?? "item"}-${index}`,
            src: source.src,
            fullSrc: source.fullSrc,
            srcSet: source.srcSet,
            sizes: source.sizes,
            alt: item.alt ?? item.caption ?? item.mediaAssetId ?? t("media.galleryItem"),
            caption: hasEditorialCaption(item.caption) ? item.caption : undefined,
            mediaAssetId: item.mediaAssetId,
            isProduct: Boolean(item.mediaAssetId && mediaAssetsById[item.mediaAssetId]?.isProduct),
            formats:
              item.mediaAssetId && mediaAssetsById[item.mediaAssetId]?.isProduct && commerceSettings.cartEnabled
                ? mediaAssetsById[item.mediaAssetId]?.printFormats?.length
                  ? mediaAssetsById[item.mediaAssetId]!.printFormats!
                  : commerceSettings.printFormats
                : []
          };
        }
      );

      return (
        <section className="site-section section-stack">
          <h2 className="section-title">{galleryData.title ?? ""}</h2>
          {galleryData.layout === "carousel" ? (
            <ImageCarousel items={galleryItems} variant="gallery" />
          ) : (
            <div className="gallery-grid">
              {galleryItems.map((item) => (
                <article key={item.id} className="gallery-card">
                  <button
                    type="button"
                    className="page-image-button"
                    onClick={() =>
                      onOpenImagePreview({
                        src: item.fullSrc,
                        alt: item.alt,
                        title: item.alt,
                        formats: item.formats,
                        isProduct: item.isProduct,
                        mediaAssetId: item.mediaAssetId
                      })
                    }
                  >
                    <img
                      src={item.src}
                      srcSet={item.srcSet}
                      sizes={item.sizes}
                      alt={item.alt}
                      className="site-image site-image--gallery"
                      loading="lazy"
                      decoding="async"
                    />
                  </button>
                  {item.caption ? <div className="media-label">{item.caption}</div> : null}
                </article>
              ))}
            </div>
          )}
        </section>
      );
    }
    case "quote": {
      const quoteData = data as BlockDataMap["quote"];
      return (
        <section className="site-section quote-wrap">
          <blockquote className="quote-text">{quoteData.quote ?? ""}</blockquote>
          <div className="quote-author">{quoteData.author ?? ""}</div>
        </section>
      );
    }
    case "sectionHeader": {
      const sectionHeaderData = data as BlockDataMap["sectionHeader"];
      return (
        <section className="site-section section-stack width-medium">
          <span className="eyebrow">{sectionHeaderData.eyebrow ?? ""}</span>
          <h2 className="section-title">{sectionHeaderData.title ?? ""}</h2>
          <p className="section-description">{sectionHeaderData.description ?? ""}</p>
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
      const email = contactData.email?.trim();
      const phone = contactData.phone?.trim();
      return (
        <section className="site-section contact-grid">
          <div className="section-stack contact-copy">
            <h2 className="section-title">{contactData.title ?? ""}</h2>
            <p className="contact-text">{contactData.text ?? ""}</p>
          </div>
          <div className="links-grid contact-links">
            {email ? (
              <a className="page-chip contact-chip" href={`mailto:${email}`}>
                <Mail size={18} />
                {email}
              </a>
            ) : null}
            {phone ? (
              <a className="page-chip contact-chip" href={`tel:${phone}`}>
                <Phone size={18} />
                {phone}
              </a>
            ) : null}
            {(contactData.socialLinks ?? []).map((item: { href: string; label: string; external?: boolean }) => (
              <a className="page-chip contact-chip" key={item.href} href={item.href}>
                <Instagram size={18} />
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
      const collectionItems = ((collectionData.itemIds ?? []).length ? collectionData.itemIds ?? [] : ["alpha", "beta", "gamma"]).map(
        (itemId: string, index: number) => {
          const asset = mediaAssetsById[itemId];
          const source = getResponsiveAssetSource(
            itemId,
            "/art-04.svg",
            asset?.variants,
            "card",
            "(max-width: 920px) 82vw, (max-width: 1280px) 42vw, 28vw"
          );
          const formats = asset?.isProduct && commerceSettings.cartEnabled
            ? getMediaAssetPrintFormats(asset, commerceSettings)
            : [];

          return {
            id: `${itemId}-${index}`,
            src: source.src,
            fullSrc: source.fullSrc,
            srcSet: source.srcSet,
            sizes: source.sizes,
            alt: asset?.alt || asset?.title || itemId,
            caption: asset?.title,
            mediaAssetId: asset?.mediaAssetId ?? itemId,
            formats,
            isProduct: Boolean(asset?.isProduct && formats.length)
          };
        }
      );

      return (
        <section className="site-section section-stack">
          <h2 className="section-title">{collectionData.title ?? ""}</h2>
          {collectionData.layout === "carousel" ? (
            <ImageCarousel items={collectionItems} variant="collection" />
          ) : (
            <div
              className="collection-grid"
              style={{ gridTemplateColumns: `repeat(${collectionData.columns}, minmax(0, 1fr))` }}
            >
              {collectionItems.map((item) => (
                <article key={item.id} className="collection-card">
                  <button
                    type="button"
                    className="page-image-button"
                    onClick={() =>
                      onOpenImagePreview({
                        src: item.fullSrc,
                        alt: item.alt,
                        title: item.caption ?? item.alt,
                        formats: item.formats,
                        isProduct: item.isProduct,
                        mediaAssetId: item.mediaAssetId
                      })
                    }
                  >
                    <img
                      src={item.src}
                      srcSet={item.srcSet}
                      sizes={item.sizes}
                      alt={item.alt}
                      className="site-image site-image--gallery"
                      loading="lazy"
                      decoding="async"
                    />
                  </button>
                </article>
              ))}
            </div>
          )}
        </section>
      );
    }
    case "linksList": {
      const linksListData = data as BlockDataMap["linksList"];
      return (
        <section className="site-section section-stack width-medium">
          <h2 className="section-title">{linksListData.title ?? ""}</h2>
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
            <h2 className="cta-title">{ctaData.title ?? ""}</h2>
            <p className="hero-subtitle">{ctaData.text ?? ""}</p>
            <a className="pill-link" href={ctaData.buttonLink ?? "#"}>
              {ctaData.buttonText ?? ""}
            </a>
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
  blockId,
  alt,
  caption,
  src,
  variants,
  onOpenImagePreview,
  productTitle,
  formats,
  isProduct,
  mediaAssetId
}: {
  blockId: string;
  alt: string;
  caption: string;
  src: string;
  variants?: MediaVariants;
  onOpenImagePreview: (input: {
    src: string;
    alt: string;
    title: string;
    formats: PrintFormat[];
    isProduct: boolean;
    mediaAssetId?: string;
  }) => void;
  productTitle: string;
  formats: PrintFormat[];
  isProduct?: boolean;
  mediaAssetId?: string;
}) {
  const panelImage = getResponsiveAssetSource(
    src,
    "/portrait.svg",
    variants,
    "panel",
    "(max-width: 920px) 100vw, 50vw"
  );

  return (
    <div className="section-stack">
      <div className="image-panel">
        <EditableSingleImage
          blockId={blockId}
          src={panelImage.src}
          fullSrc={panelImage.fullSrc}
          srcSet={panelImage.srcSet}
          sizes={panelImage.sizes}
          alt={alt}
          className="site-image site-image--contain"
          onOpenImagePreview={onOpenImagePreview}
          productTitle={productTitle}
          formats={formats}
          isProduct={isProduct}
          mediaAssetId={mediaAssetId}
        />
      </div>
      <p className="caption">{caption}</p>
    </div>
  );
}

function EditableSingleImage({
  blockId,
  src,
  fullSrc,
  srcSet,
  sizes,
  alt,
  className,
  onOpenImagePreview,
  productTitle,
  formats,
  isProduct,
  mediaAssetId,
  loading = "lazy"
}: {
  blockId: string;
  src: string;
  fullSrc: string;
  srcSet?: string;
  sizes?: string;
  alt: string;
  className?: string;
  onOpenImagePreview: (input: {
    src: string;
    alt: string;
    title: string;
    formats: PrintFormat[];
    isProduct: boolean;
    mediaAssetId?: string;
  }) => void;
  productTitle: string;
  formats: PrintFormat[];
  isProduct?: boolean;
  mediaAssetId?: string;
  loading?: "eager" | "lazy";
}) {
  const { enabled, setActiveBlockId, openPanel, openMediaLibrary } = useEditor();

  if (!enabled) {
    return (
      <button
      type="button"
      className="page-image-button"
      onClick={() => {
        onOpenImagePreview({
          src: fullSrc,
          alt,
          title: productTitle,
          formats: isProduct ? formats : [],
          isProduct: Boolean(isProduct),
          mediaAssetId
        });
        }}
      >
        <img
          src={src}
          srcSet={srcSet}
          sizes={sizes}
          alt={alt}
          className={className}
          loading={loading}
          decoding="async"
        />
      </button>
    );
  }

  return (
    <button
      type="button"
      className="editable-image-hit"
      onMouseDown={(event) => event.stopPropagation()}
      onClick={(event) => {
        event.stopPropagation();
        setActiveBlockId(blockId);
        openPanel();
        void openMediaLibrary(blockId, "replace");
      }}
    >
      <img
        src={src}
        srcSet={srcSet}
        sizes={sizes}
        alt={alt}
        className={className}
        loading={loading}
        decoding="async"
      />
    </button>
  );
}

function getPreviewStyle(widthCm: number, heightCm: number) {
  const width = Math.max(1, Number(widthCm) || 1);
  const height = Math.max(1, Number(heightCm) || 1);
  const ratio = width / height;

  return ratio >= 1
    ? { aspectRatio: `${ratio}`, width: "100%" }
    : { aspectRatio: `${ratio}`, height: "100%" };
}

function getMediaAssetPrintFormats(asset: MediaLibraryAsset | undefined, commerceSettings: SiteCommerceSettings) {
  if (!asset?.isProduct) {
    return [];
  }

  return asset.printFormats?.length ? asset.printFormats : commerceSettings.printFormats;
}

function formatPrice(value: unknown, t: ReturnType<typeof useTranslations>) {
  if (value == null || value === "") {
    return t("commerce.priceNotSet");
  }

  const price = Number(value);
  return Number.isFinite(price) && price >= 0 ? `${price.toLocaleString("en-US")} ₽` : t("commerce.priceNotSet");
}

function getEffectivePrice(format: PrintFormat) {
  return format.priceOverride ?? format.price;
}

function getFormatName(format: PrintFormat, t: (key: "commerce.unitCm") => string) {
  const width = Math.max(1, Number(format.widthCm) || 1);
  const height = Math.max(1, Number(format.heightCm) || 1);
  return `${width} × ${height} ${t("commerce.unitCm")}`;
}
