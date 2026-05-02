#!/usr/bin/env bash
set -euo pipefail

MODE="${1:-restart}"
shift || true

"$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)/rebuild.sh" dev "$MODE" "$@"
