-- Revisioned page SEO settings.

alter table if exists public.pages
  add column if not exists seo jsonb not null default '{}'::jsonb;

alter table if exists public.page_revisions
  add column if not exists seo jsonb not null default '{}'::jsonb;
