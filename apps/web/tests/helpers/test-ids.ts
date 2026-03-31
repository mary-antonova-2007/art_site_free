export const testIds = {
  editorRoot: 'editor-root',
  pageShell: 'page-shell',
  publishBar: 'publish-bar',
  saveStatus: 'save-status',
  pageTitle: 'page-title',
  blockFrame: 'block-frame',
  blockType: 'block-type',
  blockField: 'block-field',
  addBlockSlot: 'add-block-slot',
  editorAction: 'editor-action',
  mediaReplace: 'media-replace',
} as const;

export type TestId = (typeof testIds)[keyof typeof testIds];
