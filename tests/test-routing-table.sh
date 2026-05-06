#!/usr/bin/env bash
# Test: every agent referenced in CLAUDE.md's "Context Auto-Detection" routing
# table actually exists in .claude/agents/ as a .md file. Catches drift between
# routing docs and the actual agent roster.
#
# Parser scope: ONLY the table under "## Context Auto-Detection". Other tables
# in CLAUDE.md (skills index, ECC sub-team table, etc.) are not validated here.
set -uo pipefail
JARVIS_ROOT="${1:-$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)}"

CLAUDE_MD="$JARVIS_ROOT/CLAUDE.md"
AGENTS_DIR="$JARVIS_ROOT/.claude/agents"

if [[ ! -f "$CLAUDE_MD" ]]; then
  echo "FAIL: CLAUDE.md not found"
  exit 1
fi

# Extract just the lines between "## Context Auto-Detection" and the next
# "## " heading. Then parse the agent column from each table row.
section=$(awk '
  /^## Context Auto-Detection/ { in_section=1; next }
  /^## / { in_section=0 }
  in_section && /^\| / { print }
' "$CLAUDE_MD")

# From each row's last cell ("Active Agent"), extract the bare agent name —
# it's the first whitespace-separated token before "→" or "agent" or "skill".
mentioned_agents=$(echo "$section" | awk -F'|' '
  {
    # Last meaningful column (NF-1 since trailing | makes NF empty)
    cell = $(NF-1)
    gsub(/^[ \t]+|[ \t]+$/, "", cell)
    # Skip headers / separators / empty
    if (cell == "" || cell == "Active Agent" || cell ~ /^---/) next
    # Take the first token before any " → " or " agent" or " skill"
    sub(/ →.*/, "", cell)
    sub(/ agent$/, "", cell)
    sub(/ skill$/, "", cell)
    gsub(/^[ \t]+|[ \t]+$/, "", cell)
    # Agent names are lowercase with hyphens — filter out anything else
    if (cell ~ /^[a-z][a-z0-9-]*$/) print cell
  }
' | sort -u)

failures=0
checked=0
for agent in $mentioned_agents; do
  checked=$((checked+1))
  if [[ ! -f "$AGENTS_DIR/$agent.md" ]]; then
    echo "FAIL: routing table references '$agent' but $AGENTS_DIR/$agent.md does not exist"
    failures=$((failures+1))
  fi
done

if [[ $failures -gt 0 ]]; then
  echo "$failures of $checked routing-table agents are missing"
  exit 1
fi

echo "OK: all $checked Context Auto-Detection agents exist"
exit 0
