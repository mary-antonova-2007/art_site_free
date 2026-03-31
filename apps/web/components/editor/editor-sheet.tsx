"use client";

import { getBlockDefinition } from "@artsite/blocks";

import { getBlockLabel, getFieldLabel, getFieldOptionLabel } from "@/lib/i18n/blocks";
import { useLocaleMessages, useTranslations } from "@/lib/i18n/client";
import { testIds } from "@/lib/test-ids";
import { useEditor } from "./editor-provider";

export function EditorSheet() {
  const t = useTranslations();
  const localeMessages = useLocaleMessages();
  const { activeBlockId, blocks, updateBlockField, pages } = useEditor();
  const activeBlock = blocks.find((block) => block.id === activeBlockId);

  if (!activeBlock) {
    return (
      <aside className="editor-panel">
        <h3>{t("editorPanel.title")}</h3>
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

  return (
    <aside className="editor-panel">
      <h3>{getBlockLabel(localeMessages, activeBlock.blockType, definition.label)}</h3>
      <p className="mini-note">{t("editorPanel.dataOnly")}</p>
      {definition.fields.map((field) => {
        const value = activeBlock.data[field.name as keyof typeof activeBlock.data];

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
