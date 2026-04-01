"use client";

import { useDraggable } from "@dnd-kit/core";
import { listBlockDefinitions, type BlockType } from "@artsite/blocks";
import { CSS } from "@dnd-kit/utilities";
import { ChevronDown, GripHorizontal, Plus } from "lucide-react";
import { useEffect, useRef } from "react";

import { getBlockLabel } from "@/lib/i18n/blocks";
import { useLocaleMessages, useTranslations } from "@/lib/i18n/client";
import { useEditor } from "./editor-provider";

export function BlockLibraryTray() {
  const t = useTranslations();
  const localeMessages = useLocaleMessages();
  const { enabled, blockLibraryOpen, toggleBlockLibrary } = useEditor();
  const definitions = listBlockDefinitions();
  const gridRef = useRef<HTMLDivElement | null>(null);

  if (!enabled) {
    return null;
  }

  useEffect(() => {
    const gridElement = gridRef.current;

    if (!gridElement || !blockLibraryOpen) {
      return;
    }

    const grid = gridElement;

    function handleWheel(event: WheelEvent) {
      const delta = Math.abs(event.deltaY) > Math.abs(event.deltaX) ? event.deltaY : event.deltaX;

      if (delta === 0 || grid.scrollWidth <= grid.clientWidth + 4) {
        return;
      }

      event.preventDefault();
      grid.scrollBy({
        left: delta,
        behavior: "smooth"
      });
    }

    grid.addEventListener("wheel", handleWheel, { passive: false });

    return () => {
      grid.removeEventListener("wheel", handleWheel);
    };
  }, [blockLibraryOpen]);

  return (
    <aside className="block-library" data-open={blockLibraryOpen}>
      <button className="block-library__toggle" type="button" onClick={toggleBlockLibrary}>
        {blockLibraryOpen ? <ChevronDown size={16} /> : <Plus size={16} />}
        {blockLibraryOpen ? t("editor.closeBlockLibrary") : t("editor.openBlockLibrary")}
      </button>
      <div className="block-library__sheet">
        <div className="block-library__header">
          <div>
            <span className="eyebrow">{t("editor.blockLibraryEyebrow")}</span>
            <h3>{t("editor.blockLibraryTitle")}</h3>
          </div>
          <span className="mini-note">{t("editor.blockLibraryHint")}</span>
        </div>
        <div ref={gridRef} className="block-library__grid">
          {definitions.map((definition) => (
            <BlockLibraryCard
              key={definition.type}
              type={definition.type}
              title={getBlockLabel(localeMessages, definition.type, definition.label)}
            />
          ))}
        </div>
      </div>
    </aside>
  );
}

function BlockLibraryCard({
  type,
  title
}: {
  type: BlockType;
  title: string;
}) {
  const { blocks, insertBlockAt } = useEditor();
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: `palette:${type}`,
    data: {
      kind: "palette",
      blockType: type
    }
  });
  const style = {
    transform: CSS.Translate.toString(transform)
  };

  return (
    <div
      ref={setNodeRef}
      className="block-library-card"
      style={style}
      data-dragging={isDragging}
      {...attributes}
      {...listeners}
    >
      <div className="block-library-card__preview" data-type={type}>
        <BlockPreview type={type} />
      </div>
      <div className="block-library-card__footer">
        <strong>{title}</strong>
        <div className="block-library-card__actions">
          <button
            className="block-library-card__add"
            type="button"
            onClick={() => insertBlockAt(blocks.length, type)}
            aria-label={`Добавить блок ${title}`}
          >
            <Plus size={14} />
          </button>
          <span className="block-library-card__drag-hint">
            <GripHorizontal size={14} />
          </span>
        </div>
      </div>
    </div>
  );
}

function BlockPreview({ type }: { type: BlockType }) {
  if (type === "hero") {
    return (
      <>
        <span className="preview-line preview-line--tiny" />
        <span className="preview-line preview-line--hero" />
        <span className="preview-line preview-line--medium" />
        <span className="preview-media preview-media--tall" />
      </>
    );
  }

  if (type === "gallery" || type === "worksGrid" || type === "seriesGrid") {
    return (
      <div className="preview-grid">
        <span className="preview-media" />
        <span className="preview-media" />
        <span className="preview-media" />
        <span className="preview-media" />
      </div>
    );
  }

  if (type === "image" || type === "imageText") {
    return (
      <>
        <span className="preview-media preview-media--wide" />
        <span className="preview-line preview-line--medium" />
        <span className="preview-line preview-line--small" />
      </>
    );
  }

  if (type === "quote") {
    return (
      <>
        <span className="preview-quote" />
        <span className="preview-line preview-line--medium" />
        <span className="preview-line preview-line--tiny" />
      </>
    );
  }

  if (type === "divider") {
    return <span className="preview-divider" />;
  }

  return (
    <>
      <span className="preview-line preview-line--tiny" />
      <span className="preview-line preview-line--large" />
      <span className="preview-line preview-line--medium" />
      <span className="preview-line preview-line--small" />
    </>
  );
}
