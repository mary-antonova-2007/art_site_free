# Database And Domain Foundation

## Principles
- `pages` is identity only.
- `page_revisions` is the published/draft snapshot boundary.
- `page_blocks` stores typed structured content, not HTML.
- `media_assets` owns media metadata and storage references.
- Domain entities like `works`, `series`, `exhibitions`, and `journal_posts` should live outside block JSON when they become first-class content.

## Recommended Runtime Boundaries
- Frontend reads published page revisions.
- Editor writes draft revisions and media metadata.
- Publish promotes a draft revision to the page's published pointer.

## Storage Notes
- Use `site-media-public` for assets that can be served directly to the public site.
- Use `site-media-private` for draft uploads or temporary replacements.
- Keep canonical metadata in `public.media_assets`, and use signed URLs for private delivery.

## Localization Notes
- Today only interface chrome is localized through a locale cookie.
- The page/content data model is still single-locale.
- If multilingual content is added later, keep one canonical page identity and add locale variants for slugs, SEO, and translated block payloads.
- Block structure should stay stable across locales unless a page is intentionally re-authored for a specific market.
- If translations need their own publish state, store the publish pointer per locale variant rather than on the base page row.

## RLS Notes
- Public read access should only expose published content and public media.
- Editor write access should require an authenticated `app_users` record with `owner` or `editor` role.
- `service_role` may bypass RLS for migration and server-side maintenance jobs.
