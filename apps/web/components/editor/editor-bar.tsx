"use client";

import Link from "next/link";

import { testIds } from "@/lib/test-ids";

import { useEditor } from "./editor-provider";

export function EditorBar() {
  const { draftState, page, pages, createPage, saveDraft, publish, statusMessage, lastSavedAt } =
    useEditor();

  return (
    <div className="editor-bar" data-testid={testIds.publishBar}>
      <div className="editor-bar-group">
        <span className="editor-chip" data-testid={testIds.editorRoot}>
          Editor mode
        </span>
        <span className="editor-chip" data-testid={testIds.saveStatus}>
          {draftState === "dirty" ? "Draft changes not published" : "Published"}
        </span>
        <span className="editor-chip" data-testid={testIds.pageTitle}>
          Page: {page.title}
        </span>
        <span className="editor-chip">{statusMessage ?? "Ready to edit"}</span>
        {lastSavedAt ? (
          <span className="editor-chip">
            Saved at{" "}
            {new Date(lastSavedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
          </span>
        ) : null}
      </div>
      <div className="editor-bar-group">
        <button
          className="editor-button"
          type="button"
          onClick={() =>
            createPage({
              title: "New Page",
              slug: `page-${pages.length + 1}`,
            })
          }
        >
          Create page
        </button>
        <button
          className="editor-button"
          type="button"
          data-testid={testIds.editorAction}
          onClick={() => void saveDraft()}
          disabled={draftState !== "dirty"}
        >
          Save draft
        </button>
        <button
          className="editor-button editor-button-primary"
          type="button"
          data-testid={testIds.editorAction}
          onClick={() => void publish()}
        >
          Publish
        </button>
        <Link className="editor-button" href="/auth/sign-out">
          Sign out
        </Link>
        <Link className="editor-button" href={`/${page.slug}`}>
          Leave editor
        </Link>
      </div>
    </div>
  );
}
