#!/usr/bin/env bash
# measure-context-surface.sh — report the always-loaded context surface: the
# prose paid in tokens + attention on EVERY turn (CLAUDE.md, .claude/rules/*,
# L0 = core.md above the marker, L1-critical-facts.md).
#
# Complements check-memory-caps.sh: that script reports cap compliance; this one
# surfaces the per-turn TOKEN cost specifically (the "instrument" half of the
# trim-the-surface work). Report-only, exit 0 always. Token estimate ~4 chars/token.
#
# Usage: bash scripts/measure-context-surface.sh [JARVIS_ROOT]
set -uo pipefail
ROOT="${1:-$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)}"
cd "$ROOT" || exit 0

chars() { wc -c < "$1" 2>/dev/null | tr -d ' ' || echo 0; }
tok() { echo $(( ${1:-0} / 4 )); }

claude=$(chars CLAUDE.md)
l1=$(chars memory/L1-critical-facts.md)

# L0 = core.md content above the "L0 END" marker (only that part is always-loaded)
if grep -q 'L0 END' memory/core.md 2>/dev/null; then
  l0=$(awk '/L0 END/{exit} {print}' memory/core.md | wc -c | tr -d ' ')
else
  l0=$(chars memory/core.md)
fi

rules=0
for f in .claude/rules/*.md; do
  [ -f "$f" ] && rules=$(( rules + $(chars "$f") ))
done

total=$(( claude + rules + l0 + l1 ))

echo "Always-loaded context surface (paid every turn)"
printf "  %-24s %7d chars  ~%5d tok   (cap %s)\n" "CLAUDE.md"            "$claude" "$(tok "$claude")" "38000"
printf "  %-24s %7d chars  ~%5d tok   (cap %s)\n" ".claude/rules/ (sum)" "$rules"  "$(tok "$rules")"  "44000"
printf "  %-24s %7d chars  ~%5d tok   (cap %s)\n" "core.md L0"           "$l0"     "$(tok "$l0")"     "8000"
printf "  %-24s %7d chars  ~%5d tok   (cap %s)\n" "L1-critical-facts.md" "$l1"     "$(tok "$l1")"     "5000"
echo "  ----------------------------------------------------------"
printf "  %-24s %7d chars  ~%5d tok\n" "TOTAL" "$total" "$(tok "$total")"
exit 0
