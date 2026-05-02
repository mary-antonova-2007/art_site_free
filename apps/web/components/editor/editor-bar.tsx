"use client";

import Link from "next/link";

import { useTranslations } from "@/lib/i18n/client";
import { testIds } from "@/lib/test-ids";

import { EditorPageMenu } from "./editor-page-menu";
import { useEditor } from "./editor-provider";

export function EditorBar() {
  const t = useTranslations();
  const { publish, draftState, page } = useEditor();

  return (
    <div className="editor-bar editor-bar--compact" data-testid={testIds.publishBar}>
      <EditorPageMenu />
      <button
        className="editor-button editor-button-primary"
        type="button"
        data-testid={testIds.editorAction}
        onClick={() => void publish()}
        disabled={draftState !== "dirty"}
      >
        {t("editor.publish")}
      </button>
      <Link className="editor-button" href="/media?editor=1">
        {t("media.libraryTitle")}
      </Link>
      <Link className="editor-button" href="/settings?editor=1">
        Настройки
      </Link>
      <Link className="editor-button" href={page.slug === "home" ? "/" : `/${page.slug}`}>
        {t("editor.leaveEditor")}
      </Link>
    </div>
  );
}
