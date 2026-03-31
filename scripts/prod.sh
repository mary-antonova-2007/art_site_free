#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

ACTION="${1:-up}"

case "$ACTION" in
  build)
    docker build -f infra/docker/web/Dockerfile -t artsite-web .
    ;;
  up)
    docker compose up --build -d
    ;;
  down)
    docker compose down
    ;;
  restart)
    docker compose down
    docker compose up --build -d
    ;;
  logs)
    docker compose logs -f "${2:-web}"
    ;;
  *)
    echo "Usage: ./scripts/prod.sh [build|up|down|restart|logs [service]]"
    exit 1
    ;;
esac

