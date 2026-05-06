#!/usr/bin/env bash
# Test: every script CLAUDE.md claims exists actually exists. Prevents
# documentation drift where a script gets renamed/deleted but docs don't update.
set -uo pipefail
JARVIS_ROOT="${1:-$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)}"

CLAIMED_SCRIPTS=(
  "setup/install.sh"
  "setup/check.sh"
  "setup/install-semantic-search.sh"
  "setup/first-run.md"
  "setup/connect-tools.md"
  "setup/archetypes.md"
  "setup/models.yaml"
  "scripts/cleanup-inbox.sh"
  "scripts/check-memory-caps.sh"
  "scripts/dashboard.sh"
  "scripts/claude_context_indexer.py"
  "hooks/stop_hook.sh"
  "hooks/precompact_hook.sh"
  "memory/memory_indexer.py"
  "memory/memory_search.py"
  "tests/run-all.sh"
)

failures=0
for path in "${CLAIMED_SCRIPTS[@]}"; do
  if [[ ! -f "$JARVIS_ROOT/$path" ]]; then
    echo "FAIL: $path claimed in docs but missing"
    failures=$((failures+1))
  fi
done

if [[ $failures -gt 0 ]]; then
  echo "$failures referenced scripts are missing"
  exit 1
fi

echo "OK: all ${#CLAIMED_SCRIPTS[@]} referenced scripts exist"
exit 0
