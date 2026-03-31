# Block System

This package owns the editorial block foundation for the site.

## Principles

- Blocks are typed data, not raw HTML.
- The renderer owns layout.
- The editor only mutates allowed block fields.
- Referential blocks point to domain entities, not embedded copies of those entities.

## Block Shape

Every block has:

- `type`
- `version`
- `label`
- `category`
- `schema`
- `createDefault()`
- `fields[]`

## Draft-Friendly Media

Media references are intentionally draft-friendly so an editor can insert an image block before the final asset is chosen.

Publish-time validation can later enforce stricter asset completeness in the app layer.

## Locale-Aware Fields

Blocks should stay visually stable across locales. Translation should change copy, not layout.

Treat these as locale-specific:

- titles
- subtitles
- body copy
- captions
- CTA labels
- link labels
- SEO text attached to the page

Treat these as shared by default:

- block type
- order
- columns
- alignment
- display mode
- visibility
- spacing rules

Media can be shared across locales unless the image itself contains language-specific text or local-market content.

## Recommended Split

- `hero`, `richText`, `image`, `imageText`, `gallery`, `quote`, `sectionHeader`, `divider`, `contact`
  - Core page composition blocks.
- `worksGrid`, `seriesGrid`
  - Referential blocks driven by domain entities.
- `linksList`, `cta`, `about`
  - Small utility/composition blocks that keep the editorial workflow simple.
