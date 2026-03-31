# Supabase Setup

## 1. Create Project And Env

Add these values to `.env.local` for dev and `.env` for production:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...
NEXT_PUBLIC_SITE_URL=http://localhost:3000
SUPABASE_PUBLIC_BUCKET=site-public
SUPABASE_DRAFTS_BUCKET=site-drafts
SITE_EDITOR_EMAIL=owner@example.com
```

## 2. Run Schema

Apply:

- [0001_initial.sql](/mnt/d/ArtSite/supabase/migrations/0001_initial.sql)

This creates:

- `app_users`
- `pages`
- `page_revisions`
- `page_blocks`
- `media_assets`
- `media_usages`
- `page_draft_locks`

## 3. Create Storage Buckets

Create buckets:

- `site-public`
- `site-drafts`

Recommended:

- `site-public`: public
- `site-drafts`: private

## 4. Create Owner User

1. Sign in once through `/auth/sign-in`
2. Find the new `auth.users.id` in Supabase
3. Insert matching owner row:

```sql
insert into public.app_users (auth_user_id, email, role, is_active)
values ('YOUR_AUTH_USER_ID', 'owner@example.com', 'owner', true);
```

## 5. Seed First Page

Create first page row and draft revision, or just open the app in demo mode first and mirror the starter content manually.

## 6. Expected Runtime

- Without env: app uses demo fallback content.
- With env + valid owner user: editor routes use real Supabase draft/publish flow.
