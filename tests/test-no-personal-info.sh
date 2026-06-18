#!/usr/bin/env bash
# Test: no personal info leaked in tracked files
# (the public ChrisJDiMarco GitHub URL is intentional and excluded)
set -uo pipefail
JARVIS_ROOT="${1:-$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)}"
cd "$JARVIS_ROOT"

failures=0

check_pattern() {
  local pattern="$1" desc="$2"
  # Search tracked files only — exclude:
  #   - .git, node_modules, archives
  #   - tests/ (this test script contains the patterns it searches for)
  #   - CHANGELOG.md (release notes mention historical scrub work)
  local matches
  matches=$(git ls-files \
    '*.md' '*.json' '*.sh' '*.py' '*.yaml' '*.yml' '*.ts' '*.js' '*.html' '*.txt' \
    | grep -v '^tests/' \
    | grep -v '^CHANGELOG.md$' \
    | xargs grep -i -n "$pattern" 2>/dev/null \
    | grep -v "ChrisJDiMarco" || true)
  if [[ -n "$matches" ]]; then
    echo "FAIL: found references to '$desc'"
    echo "$matches" | head -5
    failures=$((failures+1))
  fi
}

check_pattern "\bchris\b" "chris (whole word)"
check_pattern "dimarco" "dimarco"
check_pattern "logicoutloud" "logicoutloud"
check_pattern "@gmail" "@gmail"
check_pattern "/Users/chris" "/Users/chris"

if [[ $failures -gt 0 ]]; then
  echo "$failures personal-info checks failed"
  exit 1
fi

echo "OK: no personal info detected in tracked files"
exit 0
