#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

ACTION="${1:-up}"

if docker compose version >/dev/null 2>&1; then
  COMPOSE_CMD=(docker compose)
elif command -v docker-compose >/dev/null 2>&1; then
  COMPOSE_CMD=(docker-compose)
else
  echo "Docker Compose is not available."
  exit 1
fi

if [[ ! -f .env.local && -f .env.example ]]; then
  cp .env.example .env.local
  echo "Created .env.local from .env.example"
fi

case "$ACTION" in
  build)
    "${COMPOSE_CMD[@]}" -f docker-compose.dev.yml build
    ;;
  up)
    "${COMPOSE_CMD[@]}" -f docker-compose.dev.yml up --build
    ;;
  down)
    "${COMPOSE_CMD[@]}" -f docker-compose.dev.yml down
    ;;
  restart)
    "${COMPOSE_CMD[@]}" -f docker-compose.dev.yml down
    "${COMPOSE_CMD[@]}" -f docker-compose.dev.yml up --build
    ;;
  logs)
    "${COMPOSE_CMD[@]}" -f docker-compose.dev.yml logs -f "${2:-web}"
    ;;
  *)
    echo "Usage: ./scripts/dev.sh [build|up|down|restart|logs [service]]"
    exit 1
    ;;
esac
