#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

MODE="${1:-prod}"
ACTION="${2:-restart}"

if docker compose version >/dev/null 2>&1; then
  COMPOSE_CMD=(docker compose)
elif command -v docker-compose >/dev/null 2>&1; then
  COMPOSE_CMD=(docker-compose)
else
  echo "Docker Compose is not available."
  exit 1
fi

case "$MODE" in
  dev)
    FILE="-f docker-compose.dev.yml"
    ENV_FILE=".env.local"
    DEFAULT_ENV_SOURCE=".env.example"
    ;;
  prod)
    FILE="-f docker-compose.prod.yml"
    ENV_FILE=".env"
    DEFAULT_ENV_SOURCE=".env.example"
    ;;
  *)
    echo "Usage: ./scripts/rebuild.sh [dev|prod] [restart|up|down|build|logs [service]]"
    exit 1
    ;;
esac

if [[ ! -f "$ENV_FILE" && -f "$DEFAULT_ENV_SOURCE" ]]; then
  cp "$DEFAULT_ENV_SOURCE" "$ENV_FILE"
  echo "Created $ENV_FILE from $DEFAULT_ENV_SOURCE"
fi

run_compose() {
  "${COMPOSE_CMD[@]}" $FILE "$@"
}

case "$ACTION" in
  build)
    run_compose build
    ;;
  up)
    run_compose up --build
    ;;
  down)
    run_compose down
    ;;
  restart)
    run_compose down
    run_compose up --build
    ;;
  logs)
    run_compose logs -f "${3:-web}"
    ;;
  *)
    echo "Usage: ./scripts/rebuild.sh [dev|prod] [restart|up|down|build|logs [service]]"
    exit 1
    ;;
esac
