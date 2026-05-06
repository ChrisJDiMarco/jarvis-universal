#!/usr/bin/env bash
# Test: every JARVIS top-level agent file has the required sections per the
# JARVIS agent template. ECC sub-agents follow a different convention (YAML
# frontmatter style) so we skip them — identified by NOT starting with
# "# Agent:".
set -uo pipefail
JARVIS_ROOT="${1:-$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)}"

AGENTS_DIR="$JARVIS_ROOT/.claude/agents"
# Minimum convention: every JARVIS agent declares its Role and Behavioral Rules.
# Additional sections (Capabilities, Tools Available, Output Format, etc.) vary
# by agent type — content-creator has Voice Calibration, researcher has Research
# Methodology, scout has Hunting Grounds. Don't force a uniform structure where
# the convention is "Role + Rules + whatever-this-agent-needs".
REQUIRED_SECTIONS=("## Role" "## Behavioral Rules")

failures=0
checked=0
skipped=0

for agent in "$AGENTS_DIR"/*.md; do
  [[ ! -f "$agent" ]] && continue
  name=$(basename "$agent" .md)

  # JARVIS agents start with "# Agent: <Name>". ECC sub-agents start with
  # YAML frontmatter or a different header. Skip non-JARVIS agents.
  first_line=$(head -1 "$agent")
  if [[ "$first_line" != "# Agent:"* ]]; then
    skipped=$((skipped+1))
    continue
  fi

  checked=$((checked+1))
  missing=()
  for section in "${REQUIRED_SECTIONS[@]}"; do
    if ! grep -qF "$section" "$agent"; then
      missing+=("$section")
    fi
  done
  if [[ ${#missing[@]} -gt 0 ]]; then
    echo "FAIL: $name missing sections: ${missing[*]}"
    failures=$((failures+1))
  fi
done

if [[ $failures -gt 0 ]]; then
  echo "$failures of $checked JARVIS agent files are missing required sections (skipped $skipped non-JARVIS agents)"
  exit 1
fi

echo "OK: all $checked JARVIS agent files have required sections (skipped $skipped non-JARVIS agents)"
exit 0
