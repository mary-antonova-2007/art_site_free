"use client";

import {
  closestCenter,
  DndContext,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent
} from "@dnd-kit/core";
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { ChevronDown, GripVertical, Pencil, Plus, Trash2, X } from "lucide-react";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import { useTranslations } from "@/lib/i18n/client";
import { useEditor } from "./editor-provider";

type ModalState =
  | { type: "rename"; pageId: string; title: string }
  | { type: "create"; title: string }
  | { type: "delete"; pageId: string; title: string; pin: string; value: string }
  | null;

export function EditorPageMenu() {
  const t = useTranslations();
  const router = useRouter();
  const { page, pages, renamePage, createPage, deletePage, reorderPages } = useEditor();
  const [open, setOpen] = useState(false);
  const [modal, setModal] = useState<ModalState>(null);
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }));
  const currentPage = pages.find((item) => item.id === page.id) ?? page;

  function openCreateModal() {
    setOpen(false);
    setModal({
      type: "create",
      title: ""
    });
  }

  async function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;

    if (!over || active.id === over.id) {
      return;
    }

    const currentIds = pages.map((item) => item.id);
    const oldIndex = currentIds.indexOf(String(active.id));
    const newIndex = currentIds.indexOf(String(over.id));

    if (oldIndex === -1 || newIndex === -1) {
      return;
    }

    const nextIds = [...currentIds];
    const [moved] = nextIds.splice(oldIndex, 1);
    nextIds.splice(newIndex, 0, moved);
    await reorderPages(nextIds);
  }

  return (
    <>
      <div className="page-menu">
        <div className="page-menu__controls">
          <button
            className="editor-button page-menu__rename"
            type="button"
            onClick={() => {
              setOpen(false);
              setModal({
                type: "rename",
                pageId: currentPage.id,
                title: currentPage.title
              });
            }}
            title={t("editor.renamePage")}
          >
            <Pencil size={16} />
          </button>
          <button className="editor-button page-menu__trigger" type="button" onClick={() => setOpen((current) => !current)}>
            <span>{currentPage.title}</span>
            <ChevronDown size={16} />
          </button>
        </div>
        {open ? (
          <div className="page-menu__popover">
            <div className="page-menu__header">
              <span className="eyebrow">{t("editor.pagesLabel")}</span>
              <button className="editor-panel-close" type="button" onClick={() => setOpen(false)} aria-label={t("editor.cancel")}>
                <X size={16} />
              </button>
            </div>
            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={(event) => void handleDragEnd(event)}>
              <SortableContext items={pages.map((item) => item.id)} strategy={verticalListSortingStrategy}>
                <div className="page-menu__list">
                  {pages.map((pageItem) => (
                    <SortablePageRow
                      key={pageItem.id}
                      pageId={pageItem.id}
                      title={pageItem.title}
                      current={pageItem.id === page.id}
                      deletable={pageItem.slug !== "home"}
                      onOpen={() => {
                        router.push(`/${pageItem.slug}?editor=1`);
                        setOpen(false);
                      }}
                      onDelete={() => {
                        setOpen(false);
                        setModal({
                          type: "delete",
                          pageId: pageItem.id,
                          title: pageItem.title,
                          pin: createDeletePin(),
                          value: ""
                        });
                      }}
                    />
                  ))}
                </div>
              </SortableContext>
            </DndContext>
            <button className="page-menu__add" type="button" onClick={openCreateModal}>
              <Plus size={16} />
              {t("editor.addPage")}
            </button>
          </div>
        ) : null}
      </div>
      {modal?.type === "rename" ? (
        <TextModal
          title={t("editor.renamePageTitle")}
          label={t("editor.pageNameLabel")}
          value={modal.title}
          confirmLabel={t("editor.renamePage")}
          onChange={(value) => setModal({ ...modal, title: value })}
          onClose={() => setModal(null)}
          onConfirm={async () => {
            const didRename = await renamePage({ pageId: modal.pageId, title: modal.title });

            if (didRename) {
              setModal(null);
              setOpen(false);
            }
          }}
        />
      ) : null}
      {modal?.type === "create" ? (
        <TextModal
          title={t("editor.createPageTitle")}
          label={t("editor.pageNameLabel")}
          value={modal.title}
          confirmLabel={t("editor.addPage")}
          onChange={(value) => setModal({ ...modal, title: value })}
          onClose={() => setModal(null)}
          onConfirm={async () => {
            const didCreate = await createPage({
              title: modal.title.trim(),
              slug: modal.title.trim()
            });

            if (didCreate) {
              setModal(null);
              setOpen(false);
            }
          }}
        />
      ) : null}
      {modal?.type === "delete" ? (
        <DeleteModal
          pageTitle={modal.title}
          pin={modal.pin}
          value={modal.value}
          onChange={(value) => setModal({ ...modal, value })}
          onClose={() => setModal(null)}
          onConfirm={async () => {
            const didDelete = await deletePage(modal.pageId);

            if (didDelete) {
              setModal(null);
              setOpen(false);
            }
          }}
        />
      ) : null}
    </>
  );
}

function SortablePageRow({
  pageId,
  title,
  current,
  deletable,
  onOpen,
  onDelete
}: {
  pageId: string;
  title: string;
  current: boolean;
  deletable: boolean;
  onOpen: () => void;
  onDelete: () => void;
}) {
  const t = useTranslations();
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: pageId });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition
  };

  return (
    <div ref={setNodeRef} className="page-row" style={style} data-current={current}>
      <button className="page-row__main" type="button" onClick={onOpen}>
        <span>{title}</span>
      </button>
      <div className="page-row__actions">
        {deletable ? (
          <button className="action-button" type="button" title={t("editor.deletePage")} onClick={onDelete}>
            <Trash2 size={14} />
          </button>
        ) : null}
        <button className="action-button action-button-drag" type="button" title={t("editor.reorderPages")} {...attributes} {...listeners}>
          <GripVertical size={14} />
        </button>
      </div>
    </div>
  );
}

function TextModal({
  title,
  label,
  value,
  confirmLabel,
  onChange,
  onClose,
  onConfirm
}: {
  title: string;
  label: string;
  value: string;
  confirmLabel: string;
  onChange: (value: string) => void;
  onClose: () => void;
  onConfirm: () => void;
}) {
  const t = useTranslations();

  return (
    <div className="editor-modal-backdrop" onClick={onClose}>
      <div className="editor-modal" onClick={(event) => event.stopPropagation()}>
        <div className="editor-modal__header">
          <h3>{title}</h3>
          <button className="editor-panel-close" type="button" onClick={onClose} aria-label={t("editor.cancel")}>
            <X size={16} />
          </button>
        </div>
        <label className="editor-field">
          <span>{label}</span>
          <input value={value} onChange={(event) => onChange(event.currentTarget.value)} autoFocus />
        </label>
        <div className="editor-modal__actions">
          <button className="editor-button" type="button" onClick={onClose}>
            {t("editor.cancel")}
          </button>
          <button className="editor-button editor-button-primary" type="button" onClick={onConfirm} disabled={!value.trim()}>
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

function DeleteModal({
  pageTitle,
  pin,
  value,
  onChange,
  onClose,
  onConfirm
}: {
  pageTitle: string;
  pin: string;
  value: string;
  onChange: (value: string) => void;
  onClose: () => void;
  onConfirm: () => Promise<void>;
}) {
  const t = useTranslations();
  const matches = useMemo(() => value.trim() === pin, [pin, value]);

  return (
    <div className="editor-modal-backdrop" onClick={onClose}>
      <div className="editor-modal" onClick={(event) => event.stopPropagation()}>
        <div className="editor-modal__header">
          <h3>{t("editor.deletePageTitle")}</h3>
          <button className="editor-panel-close" type="button" onClick={onClose} aria-label={t("editor.cancel")}>
            <X size={16} />
          </button>
        </div>
        <p className="mini-note">{t("editor.deletePagePrompt", { title: pageTitle })}</p>
        <p className="editor-delete-pin">{pin}</p>
        <label className="editor-field">
          <span>{t("editor.deletePagePinLabel")}</span>
          <input value={value} onChange={(event) => onChange(event.currentTarget.value)} inputMode="numeric" autoFocus />
        </label>
        <div className="editor-modal__actions">
          <button className="editor-button" type="button" onClick={onClose}>
            {t("editor.cancel")}
          </button>
          <button className="editor-button editor-button-primary" type="button" onClick={() => void onConfirm()} disabled={!matches}>
            {t("editor.deletePage")}
          </button>
        </div>
      </div>
    </div>
  );
}

function createDeletePin() {
  return String(Math.floor(100 + Math.random() * 900));
}
