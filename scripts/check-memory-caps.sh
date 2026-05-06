#!/usr/bin/env bash
# JARVIS Universal — memory file cap check
#
# Verifies each memory/*.md file is within its documented cap (CLAUDE.md
# memory file caps table). Warns at 80%, fails at 100%.
#
# Run on demand or wire into a scheduled task to alert before files
# silently grow past capacity and start losing recall fidelity.
#
# Usage:
#   bash scripts/check-memory-caps.sh           # human report
#   bash scripts/check-memory-caps.sh --json    # machine output

set -uo pipefail

SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
JARVIS_ROOT="$( cd "$SCRIPT_DIR/.." && pwd )"

MODE="human"
[[ "${1:-}" == "--json" ]] && MODE="json"

if [[ -t 1 && "$MODE" == "human" ]]; then
  RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'; DIM='\033[2m'; NC='\033[0m'
else
  RED=''; GREEN=''; YELLOW=''; DIM=''; NC=''
fi

# Caps in characters. Source: CLAUDE.md memory protocol.
declare -a CAPS=(
  "memory/L1-critical-facts.md:5000"
  "memory/core.md:8000"
  "memory/context.md:25000"
  "memory/decisions.md:15000"
  "memory/learnings.md:20000"
  "memory/relationships.md:15000"
  "memory/ai-intelligence.md:25000"
  "memory/soul.md:16000"
)

over=0; warn=0; ok=0
[[ "$MODE" == "json" ]] && printf '['
first=1

for entry in "${CAPS[@]}"; do
  file="${entry%:*}"; cap="${entry##*:}"
  path="$JARVIS_ROOT/$file"
  if [[ ! -f "$path" ]]; then
    if [[ "$MODE" == "json" ]]; then
      [[ $first -eq 0 ]] && printf ','
      first=0
      printf '{"file":"%s","status":"missing","size":0,"cap":%d}' "$file" "$cap"
    else
      printf "%-32s ${DIM}missing${NC}\n" "$file"
    fi
    continue
  fi
  size=$(wc -c < "$path" | tr -d ' ')
  pct=$(( size * 100 / cap ))
  status="ok"
  [[ $pct -ge 100 ]] && status="over" && over=$((over+1))
  [[ $pct -ge 80 && $pct -lt 100 ]] && status="warn" && warn=$((warn+1))
  [[ $pct -lt 80 ]] && ok=$((ok+1))

  if [[ "$MODE" == "json" ]]; then
    [[ $first -eq 0 ]] && printf ','
    first=0
    printf '{"file":"%s","status":"%s","size":%d,"cap":%d,"pct":%d}' "$file" "$status" "$size" "$cap" "$pct"
  else
    case "$status" in
      over) color="$RED";    icon="✗" ;;
      warn) color="$YELLOW"; icon="!" ;;
      ok)   color="$GREEN";  icon="✓" ;;
    esac
    printf "${color}%s %-32s${NC} %6d / %6d  ${color}%3d%%${NC}\n" "$icon" "$file" "$size" "$cap" "$pct"
  fi
done

if [[ "$MODE" == "json" ]]; then
  printf ']\n'
else
  echo ""
  echo -e "${GREEN}$ok ok${NC}  ${YELLOW}$warn near cap${NC}  ${RED}$over over cap${NC}"
fi

# Exit code: 0 clean, 1 over cap, 2 only warnings
[[ $over -gt 0 ]] && exit 1
[[ $warn -gt 0 ]] && exit 2
exit 0
