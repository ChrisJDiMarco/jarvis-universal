#!/usr/bin/env bash
# Test: every skill file (skills/*.md, top-level only) declares a trigger so
# JARVIS knows when to invoke it. Excludes index/template/reference docs that
# aren't themselves skills.
set -uo pipefail
JARVIS_ROOT="${1:-$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)}"

SKILLS_DIR="$JARVIS_ROOT/skills"

# Files in skills/ that are reference docs, not skills themselves
EXCLUDE=(
  "INDEX.md"
  "app-studio-templates.md"     # template reference doc for app-studio skill
)

is_excluded() {
  local name="$1"
  for ex in "${EXCLUDE[@]}"; do
    [[ "$name" == "$ex" ]] && return 0
  done
  return 1
}

failures=0
checked=0
skipped=0

for skill in "$SKILLS_DIR"/*.md; do
  [[ ! -f "$skill" ]] && continue
  base=$(basename "$skill")
  if is_excluded "$base"; then
    skipped=$((skipped+1))
    continue
  fi
  checked=$((checked+1))
  # JARVIS skills declare triggers in any of three styles:
  #   - YAML frontmatter:  trigger:
  #   - Markdown section:  ## Trigger
  #   - Bold inline:       **Trigger:** or **Trigger phrases:**
  if ! grep -qE "^(## Trigger|trigger:|\*\*Trigger)" "$skill"; then
    echo "FAIL: skills/$base missing Trigger declaration (## Trigger / trigger: / **Trigger:**)"
    failures=$((failures+1))
  fi
done

if [[ $failures -gt 0 ]]; then
  echo "$failures of $checked skill files have no trigger declaration (skipped $skipped reference docs)"
  exit 1
fi

echo "OK: all $checked top-level skills declare triggers (skipped $skipped reference docs)"
exit 0
