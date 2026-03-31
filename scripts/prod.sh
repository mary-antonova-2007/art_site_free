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

case "$ACTION" in
  build)
    "${COMPOSE_CMD[@]}" -f docker-compose.prod.yml build
    ;;
  up)
    if [[ ! -f .env && -f .env.example ]]; then
      cp .env.example .env
      echo "Created .env from .env.example"
    fi
    "${COMPOSE_CMD[@]}" -f docker-compose.prod.yml up --build -d
    ;;
  down)
    "${COMPOSE_CMD[@]}" -f docker-compose.prod.yml down
    ;;
  restart)
    "${COMPOSE_CMD[@]}" -f docker-compose.prod.yml down
    "${COMPOSE_CMD[@]}" -f docker-compose.prod.yml up --build -d
    ;;
  logs)
    "${COMPOSE_CMD[@]}" -f docker-compose.prod.yml logs -f "${2:-web}"
    ;;
  *)
    echo "Usage: ./scripts/prod.sh [build|up|down|restart|logs [service]]"
    exit 1
    ;;
esac
