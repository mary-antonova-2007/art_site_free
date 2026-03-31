# QA Testing Scaffold

This folder is the first source of truth for browser and contract tests for the editorial site.

## Test Layers

- `apps/web/tests/e2e`: Playwright flows for public pages, inline editor, and publish behavior.
- `apps/web/tests/contracts`: Vitest TODO contracts that lock the shape of the block registry and revision lifecycle.
- `apps/web/tests/helpers`: Shared selector names, fixtures, and auth/state helpers.

## Required UI Contract

The app should expose stable `data-*` hooks so the editor can be tested without brittle CSS selectors.

- `data-editor-root`
- `data-page-shell`
- `data-block-id`
- `data-block-type`
- `data-block-field`
- `data-add-block-slot`
- `data-editor-action`
- `data-publish-bar`
- `data-save-status`

## Environment Variables

- `E2E_BASE_URL`: Browser base URL, defaults to `http://127.0.0.1:3000`.
- `E2E_WEB_SERVER_COMMAND`: Optional local start command used by Playwright.
- `E2E_STORAGE_STATE`: Optional Playwright storage state file for authenticated editor flows.

## Commands

- `pnpm test`: runs Vitest contracts from the web package.
- `pnpm test:e2e`: runs Playwright browser flows from the web package.
- `pnpm --filter web test`: same as `pnpm test` from the repository root.
- `pnpm --filter web test:e2e`: same as `pnpm test:e2e` from the repository root.

## First Acceptance Scenarios

- Public users see a clean page with no editor overlay.
- An authenticated editor sees the overlay, can edit text, replace media, add a block, and publish.
- Draft changes stay hidden from public pages until publish completes.
- Revision contracts keep previous published content immutable.

## Notes For Implementers

- Keep e2e selectors aligned to block registry IDs, not visual class names.
- Prefer serial tests for publish-critical flows.
- Use deterministic fixtures for a homepage, one article page, and at least one media asset.
