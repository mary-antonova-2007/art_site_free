# ArtSite

Production-ready editorial art website with inline visual editing on the live page.

## Stack

- Next.js 15
- React 19
- TypeScript
- Supabase Auth / Postgres / Storage
- Drizzle ORM
- Zod
- Docker + Nginx

## Workspace

- `apps/web`: public site and inline editor
- `packages/blocks`: typed block registry, schemas, default factories
- `packages/db`: database schema, queries, publish helpers
- `packages/ui`: shared UI primitives and theme tokens
- `infra/nginx`: production reverse proxy config
- `supabase`: SQL bootstrap and policies
- `docs/architecture`: implementation notes

## Local development

This repository is pinned to `pnpm` and Node 22.

```bash
corepack enable
corepack prepare pnpm@10.8.0 --activate
pnpm install
cp .env.example .env
pnpm dev
```

Or use:

```bash
./scripts/dev.sh up
```

This dev container uses polling-based file watching so edits from Windows/WSL bind mounts trigger hot reload reliably.

## Production deployment

- Build the Next app into a standalone server container
- Put Nginx in front for proxying, compression, and static caching
- Keep Supabase managed outside Docker

Helper commands:

```bash
./scripts/dev.sh build
./scripts/dev.sh up
./scripts/dev.sh down

./scripts/prod.sh build
./scripts/prod.sh up
./scripts/prod.sh logs nginx
./scripts/prod.sh down
```
