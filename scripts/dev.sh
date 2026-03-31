#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

if ! command -v corepack >/dev/null 2>&1; then
  echo "corepack is required. Install Node.js 22+ with corepack enabled."
  exit 1
fi

corepack enable >/dev/null 2>&1 || true
corepack prepare pnpm@10.8.0 --activate >/dev/null 2>&1 || true

if [[ ! -f .env.local && -f .env.example ]]; then
  cp .env.example .env.local
  echo "Created .env.local from .env.example"
fi

if [[ ! -d node_modules ]]; then
  pnpm install
fi

pnpm dev

