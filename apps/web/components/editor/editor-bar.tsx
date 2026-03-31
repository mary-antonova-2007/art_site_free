"use client";

import Link from "next/link";

import { useTranslations } from "@/lib/i18n/client";
import { testIds } from "@/lib/test-ids";

import { useEditor } from "./editor-provider";

export function EditorBar() {
  const t = useTranslations();
  const { draftState, page, pages, createPage, saveDraft, publish, statusMessage, lastSavedAt } =
    useEditor();

  return (
    <div className="editor-bar" data-testid={testIds.publishBar}>
      <div className="editor-bar-group">
        <span className="editor-chip" data-testid={testIds.editorRoot}>
          {t("editor.mode")}
        </span>
        <span className="editor-chip" data-testid={testIds.saveStatus}>
          {draftState === "dirty" ? t("editor.dirty") : t("editor.published")}
        </span>
        <span className="editor-chip" data-testid={testIds.pageTitle}>
          {t("editor.pageLabel", { title: page.title })}
        </span>
        <span className="editor-chip">{statusMessage ?? t("editor.ready")}</span>
        {lastSavedAt ? (
          <span className="editor-chip">
            {t("editor.savedAt", {
              time: new Date(lastSavedAt).toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit"
              })
            })}
          </span>
        ) : null}
      </div>
      <div className="editor-bar-group">
        <button
          className="editor-button"
          type="button"
          onClick={() =>
            createPage({
              title: t("editor.newPageTitle"),
              slug: `page-${pages.length + 1}`
            })
          }
        >
          {t("editor.createPage")}
        </button>
        <button
          className="editor-button"
          type="button"
          data-testid={testIds.editorAction}
          onClick={() => void saveDraft()}
          disabled={draftState !== "dirty"}
        >
          {t("editor.saveDraft")}
        </button>
        <button
          className="editor-button editor-button-primary"
          type="button"
          data-testid={testIds.editorAction}
          onClick={() => void publish()}
        >
          {t("editor.publish")}
        </button>
        <Link className="editor-button" href="/auth/sign-out">
          {t("editor.signOut")}
        </Link>
        <Link className="editor-button" href={`/${page.slug}`}>
          {t("editor.leaveEditor")}
        </Link>
      </div>
    </div>
  );
}
