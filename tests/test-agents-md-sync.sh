#!/usr/bin/env bash
# test-agents-md-sync.sh — Drift guard for the CLAUDE.md → AGENTS.md mirror.
#
# AGENTS.md must equal exactly what scripts/sync-agents-md.py generates from
# CLAUDE.md. If this fails, either CLAUDE.md was edited without regenerating, or
# AGENTS.md was hand-edited. Fix:
#       python3 scripts/sync-agents-md.py
#
# Picked up automatically by tests/run-all.sh (globs test-*.sh).
# Exit 0 = in sync. Exit 1 = drift (or missing files / generator error).
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
GEN="$ROOT/scripts/sync-agents-md.py"
AGENTS="$ROOT/AGENTS.md"

if [ ! -f "$GEN" ]; then
  echo "FAIL: generator not found: $GEN"
  exit 1
fi
if [ ! -f "$AGENTS" ]; then
  echo "FAIL: AGENTS.md not found: $AGENTS"
  exit 1
fi

tmp="$(mktemp)"
trap 'rm -f "$tmp"' EXIT

if ! python3 "$GEN" --check > "$tmp" 2>/dev/null; then
  echo "FAIL: sync-agents-md.py errored (CLAUDE.md layout anchor changed?)."
  echo "      Fix the anchor, then run: python3 scripts/sync-agents-md.py"
  exit 1
fi

if diff -q "$AGENTS" "$tmp" > /dev/null 2>&1; then
  echo "PASS: AGENTS.md is in sync with CLAUDE.md"
  exit 0
fi

echo "FAIL: AGENTS.md is out of sync with CLAUDE.md."
echo "      Regenerate with: python3 scripts/sync-agents-md.py"
echo "----- diff (committed AGENTS.md  vs  expected) -----"
diff -u "$AGENTS" "$tmp" | head -40 || true
exit 1
