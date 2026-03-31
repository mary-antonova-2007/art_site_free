"use client";

import { useRef } from "react";

import { useEditor } from "./editor-provider";

export function InlineEditableText({
  blockId,
  field,
  value,
  multiline = false,
  placeholder
}: {
  blockId: string;
  field: string;
  value: string;
  multiline?: boolean;
  placeholder?: string;
}) {
  const { enabled, updateBlockField } = useEditor();

  if (!enabled) {
    return <>{value}</>;
  }

  if (multiline) {
    return (
      <textarea
        className="inline-editable inline-editable--textarea"
        value={value}
        placeholder={placeholder}
        onChange={(event) => updateBlockField(blockId, field, event.currentTarget.value)}
      />
    );
  }

  return (
    <input
      className="inline-editable inline-editable--input"
      value={value}
      placeholder={placeholder}
      onChange={(event) => updateBlockField(blockId, field, event.currentTarget.value)}
    />
  );
}

export function InlineEditableImage({
  blockId,
  field,
  src,
  alt
}: {
  blockId: string;
  field: string;
  src: string;
  alt: string;
}) {
  const { enabled, updateBlockField } = useEditor();
  const inputRef = useRef<HTMLInputElement | null>(null);

  if (!enabled) {
    return <img src={src} alt={alt} />;
  }

  return (
    <div className="inline-image-shell">
      <img src={src} alt={alt} />
      <button className="inline-image-shell__button" type="button" onClick={() => inputRef.current?.click()}>
        Replace image
      </button>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        hidden
        onChange={(event) => {
          const file = event.currentTarget.files?.[0];

          if (!file) {
            return;
          }

          const preview = URL.createObjectURL(file);
          updateBlockField(blockId, field, preview);
          event.currentTarget.value = "";
        }}
      />
    </div>
  );
}
