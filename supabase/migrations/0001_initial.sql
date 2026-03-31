-- Editorial art site foundation.
-- Assumes Supabase auth/storage schemas are available.

create extension if not exists "pgcrypto";

do $$
begin
  create type app_role as enum ('owner', 'editor', 'viewer');
exception
  when duplicate_object then null;
end $$;

do $$
begin
  create type page_revision_status as enum ('draft', 'published', 'archived');
exception
  when duplicate_object then null;
end $$;

do $$
begin
  create type media_kind as enum ('image');
exception
  when duplicate_object then null;
end $$;

do $$
begin
  create type page_kind as enum ('content', 'landing', 'journal', 'collection', 'system');
exception
  when duplicate_object then null;
end $$;

create table if not exists public.app_users (
  id uuid primary key default gen_random_uuid(),
  auth_user_id uuid not null unique references auth.users(id) on delete cascade,
  email text not null unique,
  display_name text,
  role app_role not null default 'editor',
  is_active boolean not null default true,
  last_seen_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.site_settings (
  id uuid primary key default gen_random_uuid(),
  site_name text not null,
  default_locale text not null default 'en',
  homepage_page_id uuid,
  social_links jsonb not null default '[]'::jsonb,
  contact_email text,
  contact_phone text,
  metadata jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create table if not exists public.pages (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  title text not null,
  page_kind page_kind not null default 'content',
  parent_id uuid references public.pages(id) on delete set null,
  seo_title text,
  seo_description text,
  og_image_asset_id uuid,
  published_revision_id uuid,
  current_draft_revision_id uuid,
  is_homepage boolean not null default false,
  is_archived boolean not null default false,
  created_by uuid references public.app_users(id) on delete set null,
  updated_by uuid references public.app_users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  archived_at timestamptz
);

create table if not exists public.page_revisions (
  id uuid primary key default gen_random_uuid(),
  page_id uuid not null references public.pages(id) on delete cascade,
  revision_number integer not null,
  status page_revision_status not null default 'draft',
  title text not null,
  seo_title text,
  seo_description text,
  canonical_path text,
  notes text,
  published_at timestamptz,
  created_by uuid references public.app_users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (page_id, revision_number)
);

create table if not exists public.page_blocks (
  id uuid primary key default gen_random_uuid(),
  revision_id uuid not null references public.page_revisions(id) on delete cascade,
  block_type text not null,
  position integer not null,
  is_hidden boolean not null default false,
  data jsonb not null default '{}'::jsonb,
  settings jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (revision_id, position)
);

create table if not exists public.media_assets (
  id uuid primary key default gen_random_uuid(),
  storage_bucket text not null,
  storage_path text not null unique,
  kind media_kind not null default 'image',
  mime_type text not null,
  file_name text,
  width integer,
  height integer,
  size_bytes integer,
  alt text,
  caption text,
  focal_x integer,
  focal_y integer,
  checksum text,
  uploaded_by uuid references public.app_users(id) on delete set null,
  is_public boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.site_settings
  add constraint site_settings_homepage_page_id_fkey
  foreign key (homepage_page_id)
  references public.pages(id)
  on delete set null;

alter table public.pages
  add constraint pages_og_image_asset_id_fkey
  foreign key (og_image_asset_id)
  references public.media_assets(id)
  on delete set null;

alter table public.pages
  add constraint pages_published_revision_id_fkey
  foreign key (published_revision_id)
  references public.page_revisions(id)
  on delete set null;

alter table public.pages
  add constraint pages_current_draft_revision_id_fkey
  foreign key (current_draft_revision_id)
  references public.page_revisions(id)
  on delete set null;

create table if not exists public.media_usages (
  id uuid primary key default gen_random_uuid(),
  media_asset_id uuid not null references public.media_assets(id) on delete cascade,
  entity_type text not null,
  entity_id uuid not null,
  field_name text not null,
  usage_context text,
  created_at timestamptz not null default now(),
  unique (media_asset_id, entity_type, entity_id, field_name)
);

create table if not exists public.page_draft_locks (
  page_id uuid primary key references public.pages(id) on delete cascade,
  locked_by uuid not null references public.app_users(id) on delete cascade,
  locked_at timestamptz not null default now(),
  expires_at timestamptz not null
);

create index if not exists app_users_auth_user_id_idx on public.app_users (auth_user_id);
create index if not exists app_users_email_idx on public.app_users (email);
create index if not exists pages_parent_id_idx on public.pages (parent_id);
create unique index if not exists pages_homepage_true_idx on public.pages (is_homepage) where is_homepage = true;
create index if not exists page_revisions_page_id_status_idx on public.page_revisions (page_id, status);
create index if not exists page_blocks_revision_id_idx on public.page_blocks (revision_id);
create index if not exists page_blocks_block_type_idx on public.page_blocks (block_type);
create index if not exists media_assets_storage_bucket_idx on public.media_assets (storage_bucket);
create index if not exists media_assets_is_public_idx on public.media_assets (is_public);
create index if not exists media_usages_media_asset_id_idx on public.media_usages (media_asset_id);
create index if not exists media_usages_entity_idx on public.media_usages (entity_type, entity_id);
create index if not exists page_draft_locks_locked_by_idx on public.page_draft_locks (locked_by);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_app_users_updated_at on public.app_users;
create trigger set_app_users_updated_at
before update on public.app_users
for each row execute function public.set_updated_at();

drop trigger if exists set_site_settings_updated_at on public.site_settings;
create trigger set_site_settings_updated_at
before update on public.site_settings
for each row execute function public.set_updated_at();

drop trigger if exists set_pages_updated_at on public.pages;
create trigger set_pages_updated_at
before update on public.pages
for each row execute function public.set_updated_at();

drop trigger if exists set_page_revisions_updated_at on public.page_revisions;
create trigger set_page_revisions_updated_at
before update on public.page_revisions
for each row execute function public.set_updated_at();

drop trigger if exists set_page_blocks_updated_at on public.page_blocks;
create trigger set_page_blocks_updated_at
before update on public.page_blocks
for each row execute function public.set_updated_at();

drop trigger if exists set_media_assets_updated_at on public.media_assets;
create trigger set_media_assets_updated_at
before update on public.media_assets
for each row execute function public.set_updated_at();

-- RLS skeleton.
alter table public.app_users enable row level security;
alter table public.site_settings enable row level security;
alter table public.pages enable row level security;
alter table public.page_revisions enable row level security;
alter table public.page_blocks enable row level security;
alter table public.media_assets enable row level security;
alter table public.media_usages enable row level security;
alter table public.page_draft_locks enable row level security;

create policy "public can read published pages"
on public.pages
for select
using (is_archived = false and published_revision_id is not null);

create policy "public can read published revisions"
on public.page_revisions
for select
using (status = 'published');

create policy "public can read blocks from published revisions"
on public.page_blocks
for select
using (exists (
  select 1
  from public.page_revisions pr
  where pr.id = revision_id
    and pr.status = 'published'
));

create policy "public can read public assets"
on public.media_assets
for select
using (is_public = true);

create policy "public can read site settings"
on public.site_settings
for select
using (true);

create policy "app user can read own row"
on public.app_users
for select
using (auth_user_id = auth.uid());

create policy "editor can manage app users"
on public.app_users
for all
using (exists (
  select 1
  from public.app_users au
  where au.auth_user_id = auth.uid()
    and au.is_active = true
    and au.role = 'owner'
))
with check (exists (
  select 1
  from public.app_users au
  where au.auth_user_id = auth.uid()
    and au.is_active = true
    and au.role = 'owner'
));

create policy "editor can manage pages"
on public.pages
for all
using (exists (
  select 1
  from public.app_users au
  where au.auth_user_id = auth.uid()
    and au.is_active = true
    and au.role in ('owner', 'editor')
))
with check (exists (
  select 1
  from public.app_users au
  where au.auth_user_id = auth.uid()
    and au.is_active = true
    and au.role in ('owner', 'editor')
));

create policy "editor can manage revisions"
on public.page_revisions
for all
using (exists (
  select 1
  from public.app_users au
  where au.auth_user_id = auth.uid()
    and au.is_active = true
    and au.role in ('owner', 'editor')
))
with check (exists (
  select 1
  from public.app_users au
  where au.auth_user_id = auth.uid()
    and au.is_active = true
    and au.role in ('owner', 'editor')
));

create policy "editor can manage blocks"
on public.page_blocks
for all
using (exists (
  select 1
  from public.app_users au
  where au.auth_user_id = auth.uid()
    and au.is_active = true
    and au.role in ('owner', 'editor')
))
with check (exists (
  select 1
  from public.app_users au
  where au.auth_user_id = auth.uid()
    and au.is_active = true
    and au.role in ('owner', 'editor')
));

create policy "editor can manage assets"
on public.media_assets
for all
using (exists (
  select 1
  from public.app_users au
  where au.auth_user_id = auth.uid()
    and au.is_active = true
    and au.role in ('owner', 'editor')
))
with check (exists (
  select 1
  from public.app_users au
  where au.auth_user_id = auth.uid()
    and au.is_active = true
    and au.role in ('owner', 'editor')
));

create policy "editor can manage usages"
on public.media_usages
for all
using (exists (
  select 1
  from public.app_users au
  where au.auth_user_id = auth.uid()
    and au.is_active = true
    and au.role in ('owner', 'editor')
))
with check (exists (
  select 1
  from public.app_users au
  where au.auth_user_id = auth.uid()
    and au.is_active = true
    and au.role in ('owner', 'editor')
));

create policy "editor can manage locks"
on public.page_draft_locks
for all
using (exists (
  select 1
  from public.app_users au
  where au.auth_user_id = auth.uid()
    and au.is_active = true
    and au.role in ('owner', 'editor')
))
with check (exists (
  select 1
  from public.app_users au
  where au.auth_user_id = auth.uid()
    and au.is_active = true
    and au.role in ('owner', 'editor')
));

-- Storage notes:
-- Recommended buckets:
-- 1. site-media-public: public bucket for published assets.
-- 2. site-media-private: private bucket for draft-only uploads or temporary replacements.
-- 3. Prefer storing the canonical asset record in media_assets and using signed URLs for private media.
-- 4. Public site should read only from published assets or public bucket entries.

insert into storage.buckets (id, name, public)
values
  ('site-media-public', 'site-media-public', true),
  ('site-media-private', 'site-media-private', false)
on conflict (id) do update
set name = excluded.name,
    public = excluded.public;
