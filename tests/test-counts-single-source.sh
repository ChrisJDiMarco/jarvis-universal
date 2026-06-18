#!/usr/bin/env bash
# Regression guard: hand-typed inventory COUNTS in always-loaded docs must match
# the filesystem. scripts/system-stats.sh is the SINGLE SOURCE OF TRUTH for counts;
# this catches the drift where an agent/skill is added but a prose number goes
# stale (the count analogue of test-caps-single-source.sh).
#
# Scope: CLAUDE.md + .claude/rules/*.md (the prose paid on every turn). Checks the
# two stable, high-drift counts: "<N> active agents" and "<N> ECC".
set -uo pipefail
cd "$(dirname "${BASH_SOURCE[0]}")/.." || exit 1

# Ground truth from the SSOT.
eval "$(bash scripts/system-stats.sh)"   # sets active_agents, ecc_skills, ...

fail=0

# Always-loaded prose: counts here must be live.
DOCS=(CLAUDE.md)
for f in .claude/rules/*.md; do [[ -f "$f" ]] && DOCS+=("$f"); done

# $1 = real value, $2 = regex (number then phrase), $3 = human label
check_phrase() {
  local real="$1" regex="$2" label="$3" f n
  for f in "${DOCS[@]}"; do
    [[ -f "$f" ]] || continue
    while IFS= read -r n; do
      [[ -z "$n" ]] && continue
      if [[ "$n" != "$real" ]]; then
        echo "FAIL: $f says '$n $label' but filesystem has $real (run scripts/system-stats.sh)"
        fail=1
      fi
    done < <(grep -oE "$regex" "$f" 2>/dev/null | grep -oE '^[0-9]+')
  done
}

check_phrase "$active_agents" '[0-9]+ active agents' 'active agents'
check_phrase "$ecc_skills"    '[0-9]+ ECC'           'ECC (skills)'

if [[ $fail -eq 0 ]]; then
  echo "PASS: inventory counts in always-loaded docs match scripts/system-stats.sh (agents=$active_agents, ecc=$ecc_skills)"
fi
exit $fail
