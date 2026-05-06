#!/usr/bin/env bash
# Test: every shell script in the repo passes `bash -n` syntax check
set -uo pipefail
JARVIS_ROOT="${1:-$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)}"

failures=0
checked=0

while IFS= read -r -d '' script; do
  checked=$((checked+1))
  if ! bash -n "$script" 2>/dev/null; then
    echo "FAIL: bash -n $script"
    bash -n "$script" 2>&1 | head -3
    failures=$((failures+1))
  fi
done < <(find "$JARVIS_ROOT" \
  -type f -name "*.sh" \
  -not -path "*/node_modules/*" \
  -not -path "*/.git/*" \
  -not -path "*/.venv/*" \
  -not -path "*/owners-inbox/archive/*" \
  -print0)

if [[ $failures -gt 0 ]]; then
  echo "$failures of $checked shell scripts have syntax errors"
  exit 1
fi

echo "OK: all $checked shell scripts pass bash -n"
exit 0
