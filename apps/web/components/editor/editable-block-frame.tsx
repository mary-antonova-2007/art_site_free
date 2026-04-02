"use client";

import { useDroppable } from "@dnd-kit/core";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import type { ReactNode } from "react";
import { ChevronDown, ChevronUp, GripVertical, Pencil, Trash2 } from "lucide-react";

import { useTranslations } from "@/lib/i18n/client";
import { testIds } from "@/lib/test-ids";
import { useEditor } from "./editor-provider";
import type { SiteBlockRecord } from "@/lib/content";

export function EditableBlockFrame({
  children,
  block,
  anchorId
}: {
  children: ReactNode;
  block: SiteBlockRecord;
  anchorId?: string;
}) {
  const t = useTranslations();
  const {
    enabled,
    activeBlockId,
    setActiveBlockId,
    openPanel,
    moveBlock,
    removeBlock
  } = useEditor();
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({
    id: block.id,
    data: {
      kind: "block"
    },
    disabled: !enabled
  });
  const { setNodeRef: setDropRef, isOver } = useDroppable({
    id: block.id,
    data: {
      kind: "canvas-slot"
    },
    disabled: !enabled
  });

  if (!enabled) {
    if (block.isHidden) {
      return null;
    }

    return (
      <section id={anchorId} className="editable-frame editable-frame--view" data-testid={testIds.blockFrame}>
        <div className="editable-frame__content">{children}</div>
      </section>
    );
  }

  const style = {
    transform: CSS.Transform.toString(transform),
    transition
  };

  return (
    <section
      ref={(node) => {
        setNodeRef(node);
        setDropRef(node);
      }}
      id={anchorId}
      className="editable-frame"
      style={style}
      data-active={activeBlockId === block.id}
      data-over={isOver}
      data-dragging={isDragging}
      data-testid={testIds.blockFrame}
    >
      <div className="editable-frame__chrome">
        <div className="block-actions">
          <button
            className="action-button"
            type="button"
            title={t("blockActions.edit")}
            data-testid={testIds.editorAction}
            onClick={() => {
              setActiveBlockId(block.id);
              openPanel();
            }}
          >
            <Pencil size={15} />
          </button>
          <button
            className="action-button"
            type="button"
            title={t("blockActions.moveUp")}
            data-testid={testIds.editorAction}
            onClick={() => moveBlock(block.id, "up")}
          >
            <ChevronUp size={15} />
          </button>
          <button
            className="action-button"
            type="button"
            title={t("blockActions.moveDown")}
            data-testid={testIds.editorAction}
            onClick={() => moveBlock(block.id, "down")}
          >
            <ChevronDown size={15} />
          </button>
          <button
            className="action-button"
            type="button"
            title={t("blockActions.remove")}
            data-testid={testIds.editorAction}
            onClick={() => removeBlock(block.id)}
          >
            <Trash2 size={15} />
          </button>
          <button
            className="action-button action-button-drag"
            type="button"
            title={t("blockActions.drag")}
            data-testid={testIds.editorAction}
            {...attributes}
            {...listeners}
          >
            <GripVertical size={15} />
          </button>
        </div>
      </div>
      <div className="editable-frame__content">{children}</div>
    </section>
  );
}
