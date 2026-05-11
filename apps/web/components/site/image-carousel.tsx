"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

import { cn } from "@artsite/ui";
import { readCart, writeCart } from "@/lib/cart";
import type { PrintFormat } from "@/lib/content";
import { useTranslations } from "@/lib/i18n/client";

type CarouselItem = {
  id: string;
  src: string;
  fullSrc?: string;
  alt: string;
  caption?: string;
  srcSet?: string;
  sizes?: string;
  formats?: PrintFormat[];
  isProduct?: boolean;
  mediaAssetId?: string;
};

export function ImageCarousel({
  items,
  variant
}: {
  items: CarouselItem[];
  variant: "gallery" | "collection";
}) {
  const repeatCount = items.length > 1 ? 9 : 1;
  const t = useTranslations();
  const viewportRef = useRef<HTMLDivElement | null>(null);
  const autoScrollRef = useRef<number | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const resumeTimeoutRef = useRef<number | null>(null);
  const interactionPauseRef = useRef(false);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const [selectedFormatId, setSelectedFormatId] = useState("");
  const [quantity, setQuantity] = useState(1);
  const repeatedItems =
    items.length > 1
      ? Array.from({ length: repeatCount }, () => items).flat()
      : items;

  function clearAutoScroll() {
    if (autoScrollRef.current != null) {
      window.clearInterval(autoScrollRef.current);
      autoScrollRef.current = null;
    }
  }

  function clearAnimation() {
    if (animationFrameRef.current != null) {
      window.cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
  }

  function pauseAutoScrollTemporarily() {
    interactionPauseRef.current = true;
    clearAutoScroll();
    clearAnimation();

    if (resumeTimeoutRef.current != null) {
      window.clearTimeout(resumeTimeoutRef.current);
    }

    resumeTimeoutRef.current = window.setTimeout(() => {
      interactionPauseRef.current = false;
    }, 1800);
  }

  function animateScrollBy(viewport: HTMLDivElement, delta: number) {
    clearAnimation();

    const startedAt = performance.now();
    const startLeft = viewport.scrollLeft;
    const duration = 720;

    const tick = (timestamp: number) => {
      const progress = Math.min((timestamp - startedAt) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      viewport.scrollLeft = startLeft + delta * eased;

      if (progress < 1) {
        animationFrameRef.current = window.requestAnimationFrame(tick);
      } else {
        animationFrameRef.current = null;
      }
    };

    animationFrameRef.current = window.requestAnimationFrame(tick);
  }

  function animateScrollTo(viewport: HTMLDivElement, targetLeft: number) {
    animateScrollBy(viewport, targetLeft - viewport.scrollLeft);
  }

  function getCarouselCards(viewport: HTMLDivElement) {
    return Array.from(viewport.querySelectorAll<HTMLElement>("[data-carousel-card]"));
  }

  function getCardCenterScrollLeft(viewport: HTMLDivElement, card: HTMLElement) {
    return card.offsetLeft + card.offsetWidth / 2 - viewport.clientWidth / 2;
  }

  function getCenteredCardIndex(viewport: HTMLDivElement) {
    const cards = getCarouselCards(viewport);

    if (!cards.length) {
      return -1;
    }

    const viewportCenter = viewport.scrollLeft + viewport.clientWidth / 2;
    let nearestIndex = 0;
    let nearestDistance = Number.POSITIVE_INFINITY;

    cards.forEach((card, index) => {
      const cardCenter = card.offsetLeft + card.offsetWidth / 2;
      const distance = Math.abs(cardCenter - viewportCenter);

      if (distance < nearestDistance) {
        nearestDistance = distance;
        nearestIndex = index;
      }
    });

    return nearestIndex;
  }

  function centerCardAtIndex(viewport: HTMLDivElement, index: number, behavior: "auto" | "smooth") {
    const cards = getCarouselCards(viewport);

    if (!cards.length) {
      return;
    }

    const safeIndex = Math.max(0, Math.min(index, cards.length - 1));
    const targetLeft = getCardCenterScrollLeft(viewport, cards[safeIndex]);

    if (behavior === "smooth") {
      animateScrollTo(viewport, targetLeft);
      return;
    }

    viewport.scrollLeft = targetLeft;
  }

  useEffect(() => {
    const viewportElement = viewportRef.current;

    if (!viewportElement || items.length <= 1) {
      return;
    }

    const viewport = viewportElement;

    function setMiddlePosition() {
      const cards = getCarouselCards(viewport);

      if (!cards.length) {
        return;
      }

      const middleIndex = Math.floor(cards.length / 2);
      viewport.scrollLeft = getCardCenterScrollLeft(viewport, cards[middleIndex]);
    }

    const frameId = window.requestAnimationFrame(setMiddlePosition);

    function handleResize() {
      setMiddlePosition();
    }

    window.addEventListener("resize", handleResize);

    return () => {
      window.cancelAnimationFrame(frameId);
      window.removeEventListener("resize", handleResize);
    };
  }, [items.length]);

  useEffect(() => {
    const viewportElement = viewportRef.current;

    if (!viewportElement) {
      return;
    }

    const viewport = viewportElement;

    function normalizeLoopPosition() {
      if (items.length <= 1) {
        return;
      }

      const loopWidth = viewport.scrollWidth / repeatCount;

      if (loopWidth <= 0) {
        return;
      }

      if (viewport.scrollLeft < loopWidth * 2) {
        viewport.scrollLeft += loopWidth * 3;
      } else if (viewport.scrollLeft > loopWidth * 6) {
        viewport.scrollLeft -= loopWidth * 3;
      }
    }

    function handleWheel(event: WheelEvent) {
      const canScroll = viewport.scrollWidth > viewport.clientWidth + 4;

      if (!canScroll) {
        return;
      }

      const delta = Math.abs(event.deltaY) > Math.abs(event.deltaX) ? event.deltaY : event.deltaX;

      if (delta === 0) {
        return;
      }

      event.preventDefault();
      pauseAutoScrollTemporarily();

      const currentIndex = getCenteredCardIndex(viewport);
      const direction = delta > 0 ? 1 : -1;
      const targetIndex = currentIndex + direction;

      centerCardAtIndex(viewport, targetIndex, "smooth");
    }

    viewport.addEventListener("scroll", normalizeLoopPosition);
    viewport.addEventListener("wheel", handleWheel, { passive: false });

    return () => {
      viewport.removeEventListener("scroll", normalizeLoopPosition);
      viewport.removeEventListener("wheel", handleWheel);
    };
  }, [items.length]);

  useEffect(() => {
    const viewportElement = viewportRef.current;

    if (!viewportElement || items.length <= 1) {
      return;
    }

    const viewport = viewportElement;

    function startAutoScroll() {
      clearAutoScroll();

      const canScroll = viewport.scrollWidth > viewport.clientWidth + 4;

      if (!canScroll || lightboxIndex != null || interactionPauseRef.current) {
        return;
      }

      autoScrollRef.current = window.setInterval(() => {
        if (interactionPauseRef.current || lightboxIndex != null) {
          return;
        }

        const currentIndex = getCenteredCardIndex(viewport);
        centerCardAtIndex(viewport, currentIndex + 1, "smooth");
      }, 5000);
    }

    startAutoScroll();

    function handleInteractionStart() {
      pauseAutoScrollTemporarily();
    }

    function handleInteractionEnd() {
      if (resumeTimeoutRef.current != null) {
        window.clearTimeout(resumeTimeoutRef.current);
      }

      resumeTimeoutRef.current = window.setTimeout(() => {
        interactionPauseRef.current = false;
        startAutoScroll();
      }, 1200);
    }

    viewport.addEventListener("pointerdown", handleInteractionStart);
    viewport.addEventListener("touchstart", handleInteractionStart, { passive: true });
    viewport.addEventListener("pointerup", handleInteractionEnd);
    viewport.addEventListener("touchend", handleInteractionEnd);

    return () => {
      clearAutoScroll();
      clearAnimation();
      if (resumeTimeoutRef.current != null) {
        window.clearTimeout(resumeTimeoutRef.current);
        resumeTimeoutRef.current = null;
      }
      viewport.removeEventListener("pointerdown", handleInteractionStart);
      viewport.removeEventListener("touchstart", handleInteractionStart);
      viewport.removeEventListener("pointerup", handleInteractionEnd);
      viewport.removeEventListener("touchend", handleInteractionEnd);
    };
  }, [items.length, lightboxIndex]);

  useEffect(() => {
    if (lightboxIndex == null || typeof document === "undefined") {
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
  }, [lightboxIndex]);

  useEffect(() => {
    const item = lightboxIndex == null ? undefined : items[lightboxIndex];
    const firstFormat = item?.formats?.[0];
    setSelectedFormatId(firstFormat?.id ?? "");
    setQuantity(1);
  }, [items, lightboxIndex]);

  function addProductToCart(item: CarouselItem) {
    const format = item.formats?.find((candidate) => candidate.id === selectedFormatId) ?? item.formats?.[0];
    const imageSrc = item.fullSrc ?? item.src;

    if (!format) {
      return;
    }

    const key = `${imageSrc}:${format.id}`;
    const current = readCart();
    const next = current.find((cartItem) => cartItem.id === key)
      ? current.map((cartItem) =>
          cartItem.id === key ? { ...cartItem, quantity: cartItem.quantity + quantity } : cartItem
        )
      : [
          {
            id: key,
            imageSrc,
            title: item.caption ?? item.alt,
            alt: item.alt,
            format,
            availableFormats: item.formats,
            quantity
          },
          ...current
        ];

    writeCart(next);
    setLightboxIndex(null);
  }

  return (
    <>
      <div
        ref={viewportRef}
        className={cn("image-carousel", variant === "gallery" ? "image-carousel--gallery" : "image-carousel--collection")}
      >
        <div className="image-carousel__track">
          {repeatedItems.map((item, index) => {
            const sourceIndex = items.length > 0 ? index % items.length : index;

            return (
              <button
                key={`${item.id}-${index}`}
                className={cn(
                  "image-carousel__card",
                  variant === "gallery" ? "gallery-card" : "collection-card"
                )}
                type="button"
                data-carousel-card
                onMouseDown={(event) => event.preventDefault()}
                onClick={() =>
                  setLightboxIndex((current) => (current === sourceIndex ? null : sourceIndex))
                }
              >
                <img
                  src={item.src}
                  srcSet={item.srcSet}
                  sizes={item.sizes}
                  alt={item.alt}
                  className="site-image site-image--carousel"
                  loading="lazy"
                  decoding="async"
                />
                {variant === "gallery" && item.caption ? <div className="media-label">{item.caption}</div> : null}
              </button>
            );
          })}
        </div>
      </div>
      {lightboxIndex != null && typeof document !== "undefined"
        ? (() => {
            const item = items[lightboxIndex];
            const hasProductPanel = Boolean(item?.isProduct && item.formats?.length);
            const selectedFormat = item?.formats?.find((format) => format.id === selectedFormatId) ?? item?.formats?.[0];

            return item
              ? createPortal(
                  <div
                    className="image-lightbox"
                    role="dialog"
                    aria-modal="true"
                    aria-label="Image preview"
                    onClick={() => setLightboxIndex(null)}
                  >
                    <div
                      className="image-lightbox__stage"
                      data-product={hasProductPanel ? "true" : "false"}
                      onClick={(event) => event.stopPropagation()}
                    >
                      <img
                        className="image-lightbox__image"
                        src={item.fullSrc ?? item.src}
                        alt={item.alt}
                        onClick={() => setLightboxIndex(null)}
                      />
                      {hasProductPanel ? (
                        <div className="product-modal__panel image-lightbox__product-panel">
                          <div className="product-modal__content">
                            <h3>{item.caption ?? item.alt}</h3>
                            <p className="product-modal__note">
                              Выберите формат печати и количество перед добавлением в корзину.
                            </p>
                            <label className="editor-field">
                              <span>Формат печати</span>
                              <select
                                value={selectedFormatId}
                                onChange={(event) => setSelectedFormatId(event.currentTarget.value)}
                              >
                                {(item.formats ?? []).map((format) => (
                                  <option key={format.id} value={format.id}>
                                    {getFormatName(format)} ·{" "}
                                    {formatPrice(getEffectivePrice(format))}
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
                            {selectedFormat ? (
                              <div className="product-modal__format-card">
                                <div className="product-modal__format-preview" aria-hidden="true">
                                  <div
                                    className="product-modal__format-preview-inner"
                                    style={getPreviewStyle(selectedFormat.widthCm, selectedFormat.heightCm)}
                                  />
                                </div>
                                <div className="product-modal__format-info">
                                  <strong>
                                    {getFormatName(selectedFormat)}
                                  </strong>
                                  <span>
                                    {selectedFormat.widthCm} × {selectedFormat.heightCm} {t("commerce.unitCm")}
                                  </span>
                                  <span>{formatPrice(getEffectivePrice(selectedFormat))}</span>
                                </div>
                              </div>
                            ) : null}
                            <div className="product-modal__actions">
                              <button className="editor-button" type="button" onClick={() => addProductToCart(item)}>
                                Добавить в корзину
                              </button>
                              <button
                                className="editor-button editor-button-primary"
                                type="button"
                                onClick={() => {
                                  addProductToCart(item);
                                  window.location.assign("/cart");
                                }}
                              >
                                Купить
                              </button>
                            </div>
                          </div>
                        </div>
                      ) : null}
                    </div>
                  </div>,
                  document.body
                )
              : null;
          })()
        : null}
    </>
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

function getEffectivePrice(format: PrintFormat) {
  return format.priceOverride ?? format.price;
}

function formatPrice(value: unknown) {
  if (value == null || value === "") {
    return "Цена не задана";
  }

  const price = Number(value);
  return Number.isFinite(price) && price >= 0 ? `${price.toLocaleString("ru-RU")} ₽` : "Цена не задана";
}

function getFormatName(format: PrintFormat) {
  const width = Math.max(1, Number(format.widthCm) || 1);
  const height = Math.max(1, Number(format.heightCm) || 1);
  return `${width} × ${height} cm`;
}
