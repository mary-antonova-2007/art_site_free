# Localization

The current implementation localizes the site and editor interface through a locale cookie, not locale-prefixed routes.

## Current Scope

Localized today:

- editor chrome
- sign-in screen
- 404 page
- site header chrome
- quick block insert labels
- block action labels
- editor panel labels
- media fallback labels

Not localized yet:

- authored page content
- block payload text
- slugs
- SEO fields per language

This is intentional. The first step is a stable multilingual interface layer that does not disturb the content model or the live editing flow.

## Supported Locales

- `en`
- `ru`
- `hy`
- `de-CH`
- `fr`
- `es`

## Runtime Model

- The active locale is stored in the `artsite_locale` cookie.
- The header language switcher calls `/api/locale?locale=...&next=...`.
- After switching locale, the user returns to the same page, including editor mode when `?editor=1` is present.
- `/api`, `/auth`, content routes, and editor routes stay locale-neutral.

## Why Cookie-Based First

- No route explosion.
- No breakage in editor return URLs.
- No locale prefix bugs in auth or API endpoints.
- Easy to extend toward per-locale content later.

## Where The Dictionaries Live

- [config.ts](/mnt/d/ArtSite/apps/web/lib/i18n/config.ts)
- [index.ts](/mnt/d/ArtSite/apps/web/lib/i18n/index.ts)
- [shared.ts](/mnt/d/ArtSite/apps/web/lib/i18n/shared.ts)
- [client.tsx](/mnt/d/ArtSite/apps/web/lib/i18n/client.tsx)
- [en.ts](/mnt/d/ArtSite/apps/web/lib/i18n/messages/en.ts)
- [ru.ts](/mnt/d/ArtSite/apps/web/lib/i18n/messages/ru.ts)
- [hy.ts](/mnt/d/ArtSite/apps/web/lib/i18n/messages/hy.ts)
- [de-CH.ts](/mnt/d/ArtSite/apps/web/lib/i18n/messages/de-CH.ts)
- [fr.ts](/mnt/d/ArtSite/apps/web/lib/i18n/messages/fr.ts)
- [es.ts](/mnt/d/ArtSite/apps/web/lib/i18n/messages/es.ts)

## Adding Or Editing A Translation

1. Add or edit keys in [en.ts](/mnt/d/ArtSite/apps/web/lib/i18n/messages/en.ts) first.
2. Mirror the same keys in every locale file.
3. Keep content and UI strings separate.
4. Use the translation hooks/helpers instead of hard-coded strings in components.

## Next Phase

If we later want true multilingual content, the next layer should add:

- locale-aware page variants
- localized slugs
- translated block payload fields
- locale-specific SEO fields
- per-locale draft/publish state

That can be added on top of the current UI i18n layer without rewriting the editor.
