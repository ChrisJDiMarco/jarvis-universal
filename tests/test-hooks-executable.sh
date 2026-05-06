#!/usr/bin/env bash
# Test: every script that's expected to run is executable
set -uo pipefail
JARVIS_ROOT="${1:-$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)}"

EXPECTED_EXECUTABLE=(
  "hooks/stop_hook.sh"
  "hooks/precompact_hook.sh"
  "setup/install.sh"
  "setup/check.sh"
  "setup/install-semantic-search.sh"
  "scripts/cleanup-inbox.sh"
  "scripts/check-memory-caps.sh"
  "scripts/dashboard.sh"
  "tests/run-all.sh"
)

failures=0
checked=0

for f in "${EXPECTED_EXECUTABLE[@]}"; do
  path="$JARVIS_ROOT/$f"
  if [[ ! -f "$path" ]]; then
    echo "WARN: expected file missing: $f"
    continue
  fi
  checked=$((checked+1))
  if [[ ! -x "$path" ]]; then
    echo "FAIL: not executable: $f"
    failures=$((failures+1))
  fi
done

if [[ $failures -gt 0 ]]; then
  echo "$failures of $checked scripts are not executable — run setup/install.sh"
  exit 1
fi

echo "OK: all $checked expected scripts are executable"
exit 0
