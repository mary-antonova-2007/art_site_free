export type EditorAuthContract = {
  storageStatePath?: string;
  loginHint?: string;
};

export function getEditorAuthContract(): EditorAuthContract {
  return {
    storageStatePath: process.env.E2E_STORAGE_STATE,
    loginHint: 'Set E2E_STORAGE_STATE to a Playwright storage state file for authenticated flows.',
  };
}
