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
  create type page_kind as enum ('content', 'landing', 'journal', 'collection', 'system');
exception
  when duplicate_object then null;
end $$;

do $$
begin
  create type media_kind as enum ('image');
exception
  when duplicate_object then null;
end $$;

create table if not exists app_users (
  id uuid primary key default gen_random_uuid(),
  auth_user_id uuid unique,
  email text not null unique,
  display_name text,
  role app_role not null default 'editor',
  is_active boolean not null default true,
  last_seen_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists site_settings (
  id uuid primary key default gen_random_uuid(),
  site_name text not null,
  default_locale text not null default 'ru',
  homepage_page_id uuid,
  social_links jsonb not null default '[]'::jsonb,
  contact_email text,
  contact_phone text,
  metadata jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create table if not exists pages (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  title text not null,
  page_kind page_kind not null default 'content',
  parent_id uuid references pages(id) on delete set null,
  seo_title text,
  seo_description text,
  og_image_asset_id uuid,
  published_revision_id uuid,
  current_draft_revision_id uuid,
  is_homepage boolean not null default false,
  is_archived boolean not null default false,
  created_by uuid references app_users(id) on delete set null,
  updated_by uuid references app_users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  archived_at timestamptz
);

create table if not exists page_revisions (
  id uuid primary key default gen_random_uuid(),
  page_id uuid not null references pages(id) on delete cascade,
  revision_number integer not null,
  status page_revision_status not null default 'draft',
  title text not null,
  seo_title text,
  seo_description text,
  canonical_path text,
  notes text,
  published_at timestamptz,
  created_by uuid references app_users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (page_id, revision_number)
);

create table if not exists page_blocks (
  id uuid primary key default gen_random_uuid(),
  revision_id uuid not null references page_revisions(id) on delete cascade,
  block_type text not null,
  position integer not null,
  is_hidden boolean not null default false,
  data jsonb not null default '{}'::jsonb,
  settings jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (revision_id, position)
);

create table if not exists media_assets (
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
  uploaded_by uuid references app_users(id) on delete set null,
  is_public boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table site_settings
  drop constraint if exists site_settings_homepage_page_id_fkey;
alter table site_settings
  add constraint site_settings_homepage_page_id_fkey
  foreign key (homepage_page_id)
  references pages(id)
  on delete set null;

alter table pages
  drop constraint if exists pages_og_image_asset_id_fkey;
alter table pages
  add constraint pages_og_image_asset_id_fkey
  foreign key (og_image_asset_id)
  references media_assets(id)
  on delete set null;

alter table pages
  drop constraint if exists pages_published_revision_id_fkey;
alter table pages
  add constraint pages_published_revision_id_fkey
  foreign key (published_revision_id)
  references page_revisions(id)
  on delete set null;

alter table pages
  drop constraint if exists pages_current_draft_revision_id_fkey;
alter table pages
  add constraint pages_current_draft_revision_id_fkey
  foreign key (current_draft_revision_id)
  references page_revisions(id)
  on delete set null;

create or replace function set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_app_users_updated_at on app_users;
create trigger set_app_users_updated_at before update on app_users
for each row execute function set_updated_at();

drop trigger if exists set_site_settings_updated_at on site_settings;
create trigger set_site_settings_updated_at before update on site_settings
for each row execute function set_updated_at();

drop trigger if exists set_pages_updated_at on pages;
create trigger set_pages_updated_at before update on pages
for each row execute function set_updated_at();

drop trigger if exists set_page_revisions_updated_at on page_revisions;
create trigger set_page_revisions_updated_at before update on page_revisions
for each row execute function set_updated_at();

drop trigger if exists set_page_blocks_updated_at on page_blocks;
create trigger set_page_blocks_updated_at before update on page_blocks
for each row execute function set_updated_at();

drop trigger if exists set_media_assets_updated_at on media_assets;
create trigger set_media_assets_updated_at before update on media_assets
for each row execute function set_updated_at();
