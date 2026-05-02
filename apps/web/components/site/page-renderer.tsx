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
import type { PrintFormat, SiteCommerceSettings } from "@/lib/content";
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
  commerceSettings
}: {
  page: SitePageRecord;
  commerceSettings: SiteCommerceSettings;
}) {
  const { blocks, insertBlockAt, moveBlockToIndex } = useEditor();
  const [activeDragId, setActiveDragId] = useState<string | null>(null);
  const [lightboxImage, setLightboxImage] = useState<{ src: string; alt: string } | null>(null);
  const [productImage, setProductImage] = useState<{
    src: string;
    alt: string;
    title: string;
    formats: PrintFormat[];
  } | null>(null);
  const [selectedFormatId, setSelectedFormatId] = useState("");
  const [quantity, setQuantity] = useState(1);
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 8 } }));

  useEffect(() => {
    if (!lightboxImage || typeof document === "undefined") {
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
  }, [lightboxImage]);

  useEffect(() => {
    const firstFormat = productImage?.formats[0];
    setSelectedFormatId((current) => current || firstFormat?.id || "");
    setQuantity((current) => Math.max(1, current));
  }, [productImage]);

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
    if (!productImage) {
      return;
    }

    const format = productImage.formats.find((item) => item.id === selectedFormatId) ?? productImage.formats[0];
    if (!format) {
      return;
    }

    const current = readCart();
    const key = `${productImage.src}:${format.id}`;
    const next = current.find((item) => item.id === key)
      ? current.map((item) => (item.id === key ? { ...item, quantity: item.quantity + quantity } : item))
      : [
          {
            id: key,
            imageSrc: productImage.src,
            title: productImage.title,
            alt: productImage.alt,
            format,
            quantity
          },
          ...current
        ];

    writeCart(next);
    setProductImage(null);
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
                  onOpenImagePreview={(src, alt) => setLightboxImage({ src, alt })}
                  onOpenProductPreview={setProductImage}
                  commerceSettings={commerceSettings}
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
      {lightboxImage && typeof document !== "undefined"
        ? createPortal(
            <button
              className="image-lightbox"
              type="button"
              onClick={() => setLightboxImage(null)}
              aria-label="Close image preview"
            >
              <img className="image-lightbox__image" src={lightboxImage.src} alt={lightboxImage.alt} />
            </button>,
            document.body
          )
        : null}
      {productImage && typeof document !== "undefined"
        ? createPortal(
            <div className="product-modal" role="dialog" aria-modal="true">
              <button
                className="product-modal__backdrop"
                type="button"
                onClick={() => setProductImage(null)}
                aria-label="Close product dialog"
              />
              <div className="product-modal__panel">
                <img className="product-modal__image" src={productImage.src} alt={productImage.alt} />
                <div className="product-modal__content">
                  <h3>{productImage.title}</h3>
                  <label className="editor-field">
                    <span>Формат печати</span>
                    <select
                      value={selectedFormatId}
                      onChange={(event) => setSelectedFormatId(event.currentTarget.value)}
                    >
                      {productImage.formats.map((format) => (
                        <option key={format.id} value={format.id}>
                          {format.label ?? `${format.widthCm} × ${format.heightCm} см`}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="editor-field">
                    <span>Количество</span>
                    <input
                      type="number"
                      min={1}
                      value={quantity}
                      onChange={(event) => setQuantity(Math.max(1, Number(event.currentTarget.value) || 1))}
                    />
                  </label>
                  <div className="product-modal__actions">
                    <button className="editor-button" type="button" onClick={addProductToCart}>
                      Добавить в корзину
                    </button>
                    <button
                      className="editor-button editor-button-primary"
                      type="button"
                      onClick={() => {
                        addProductToCart();
                        window.location.assign("/cart");
                      }}
                    >
                      Купить
                    </button>
                  </div>
                </div>
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
  onOpenProductPreview,
  commerceSettings
}: {
  blockId: string;
  type: TType;
  data: BlockDataMap[TType];
  onOpenImagePreview: (src: string, alt: string) => void;
  onOpenProductPreview: (input: {
    src: string;
    alt: string;
    title: string;
    formats: PrintFormat[];
  }) => void;
  commerceSettings: SiteCommerceSettings;
}) {
  const t = useTranslations();
  const definition = getBlockDefinition(type);

  switch (type) {
    case "hero": {
      const heroData = data as BlockDataMap["hero"];
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
            <span className="eyebrow">{heroData.eyebrow ?? ""}</span>
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
              onOpenProductPreview={onOpenProductPreview}
              productTitle={heroData.title ?? heroData.image?.alt ?? t("media.image")}
              formats={[]}
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
      const blockImage = getResponsiveAssetSource(
        imageData.image?.mediaAssetId,
        "/art-03.svg",
        getFieldVariants(imageData.image),
        "panel",
        "(max-width: 920px) 100vw, min(1280px, 92vw)"
      );
      const formats = imageData.printFormats?.length
        ? imageData.printFormats.map((format, index) => ({
            id: format.id ?? `${blockId}-format-${index}`,
            widthCm: format.widthCm,
            heightCm: format.heightCm,
            label: format.label
          }))
        : commerceSettings.printFormats;
      const purchasableFormats = commerceSettings.cartEnabled ? formats : [];
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
              onOpenProductPreview={onOpenProductPreview}
              productTitle={imageData.caption ?? imageData.alt ?? imageData.image?.alt ?? t("media.image")}
              formats={purchasableFormats}
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
              onOpenProductPreview={onOpenProductPreview}
              productTitle={imageTextData.title ?? imageTextData.image?.alt ?? t("media.image")}
              formats={[]}
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
              onOpenProductPreview={onOpenProductPreview}
              productTitle={imageTextData.title ?? imageTextData.image?.alt ?? t("media.image")}
              formats={[]}
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
            onOpenProductPreview={onOpenProductPreview}
            productTitle={aboutData.title ?? aboutData.image?.alt ?? t("media.image")}
            formats={[]}
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
            caption: hasEditorialCaption(item.caption) ? item.caption : undefined
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
                    onClick={() => onOpenImagePreview(item.fullSrc, item.alt)}
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
      return (
        <section className="site-section contact-grid">
          <div className="section-stack contact-copy">
            <h2 className="section-title">{contactData.title ?? ""}</h2>
            <p className="contact-text">{contactData.text ?? ""}</p>
          </div>
          <div className="links-grid contact-links">
            <a className="page-chip contact-chip" href={`mailto:${contactData.email ?? ""}`}>
              <Mail size={18} />
              {contactData.email ?? ""}
            </a>
            <a className="page-chip contact-chip" href={`tel:${contactData.phone ?? ""}`}>
              <Phone size={18} />
              {contactData.phone ?? ""}
            </a>
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
          const originalSrc = assetPath(itemId, "/art-04.svg");
          const displaySrc = getPreferredImageUrl(originalSrc, undefined, "card");

          return {
            id: `${itemId}-${index}`,
            src: displaySrc,
            fullSrc: originalSrc,
            alt: itemId
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
                    onClick={() => onOpenImagePreview(item.fullSrc, item.alt)}
                  >
                    <img
                      src={item.src}
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
  onOpenProductPreview,
  productTitle,
  formats
}: {
  blockId: string;
  alt: string;
  caption: string;
  src: string;
  variants?: MediaVariants;
  onOpenImagePreview: (src: string, alt: string) => void;
  onOpenProductPreview: (input: {
    src: string;
    alt: string;
    title: string;
    formats: PrintFormat[];
  }) => void;
  productTitle: string;
  formats: PrintFormat[];
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
          onOpenProductPreview={onOpenProductPreview}
          productTitle={productTitle}
          formats={formats}
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
  onOpenProductPreview,
  productTitle,
  formats,
  loading = "lazy"
}: {
  blockId: string;
  src: string;
  fullSrc: string;
  srcSet?: string;
  sizes?: string;
  alt: string;
  className?: string;
  onOpenImagePreview: (src: string, alt: string) => void;
  onOpenProductPreview: (input: {
    src: string;
    alt: string;
    title: string;
    formats: PrintFormat[];
  }) => void;
  productTitle: string;
  formats: PrintFormat[];
  loading?: "eager" | "lazy";
}) {
  const { enabled, setActiveBlockId, openPanel, openMediaLibrary } = useEditor();

  if (!enabled) {
    return (
      <button
        type="button"
        className="page-image-button"
        onClick={() => {
          if (formats.length) {
            onOpenProductPreview({
              src: fullSrc,
              alt,
              title: productTitle,
              formats
            });
            return;
          }

          onOpenImagePreview(fullSrc, alt);
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
