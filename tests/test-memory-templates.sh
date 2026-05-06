#!/usr/bin/env bash
# Test: memory template files have the markers the system depends on.
# - core.md must have the "JARVIS Universal — Setup Needed" heading (so the
#   first-run wizard fires) AND the L0 END marker (so lazy load works).
# - L1-critical-facts.md must exist as template.
set -uo pipefail
JARVIS_ROOT="${1:-$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)}"

failures=0

CORE="$JARVIS_ROOT/memory/core.md"
if [[ ! -f "$CORE" ]]; then
  echo "FAIL: memory/core.md missing"
  failures=$((failures+1))
else
  if ! head -1 "$CORE" | grep -q "JARVIS Universal — Setup Needed"; then
    echo "FAIL: memory/core.md is not the template (first-run wizard won't fire)"
    failures=$((failures+1))
  fi
  if ! grep -q "L0 END" "$CORE"; then
    echo "FAIL: memory/core.md missing 'L0 END' marker — lazy memory loader will misbehave"
    failures=$((failures+1))
  fi
fi

L1="$JARVIS_ROOT/memory/L1-critical-facts.md"
if [[ ! -f "$L1" ]]; then
  echo "FAIL: memory/L1-critical-facts.md missing"
  failures=$((failures+1))
fi

if [[ $failures -gt 0 ]]; then
  echo "$failures memory template checks failed"
  exit 1
fi

echo "OK: memory templates have required markers"
exit 0
