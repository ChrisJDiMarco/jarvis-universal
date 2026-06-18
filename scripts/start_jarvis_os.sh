#!/usr/bin/env bash
# Launch JARVIS OS — the desktop command center for JARVIS Universal.
# JARVIS OS is an Electron app (apps/jarvis-os). First run installs Electron
# (~200MB, one time); after that it launches instantly.
set -euo pipefail

APP_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../apps/jarvis-os" && pwd)"
cd "$APP_DIR"

if ! command -v npm >/dev/null 2>&1; then
  echo "JARVIS OS needs Node.js (npm). Install Node 18+ and re-run." >&2
  exit 1
fi

if [[ ! -d node_modules ]]; then
  echo "First run: installing JARVIS OS dependencies (downloads Electron, ~200MB)…"
  npm install
fi

echo "Launching JARVIS OS…"
exec npm start
