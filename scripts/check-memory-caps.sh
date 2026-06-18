#!/usr/bin/env bash
# JARVIS Universal — context-budget cap check
#
# Verifies each capped path (memory files, CLAUDE.md, the .claude/rules/ dir)
# is within its documented cap (config/memory-caps.conf). Warns at 80%, flags
# over-cap with exit 1 — ADVISORY ONLY: this never blocks or truncates a write.
#
# Caps are a budget/anti-bloat signal, not a liveness measure. Dead content is
# found by check-staleness.sh (age) and reachability-gc.py (reachability).
#
# A cap path ending in '/' sums the *.md files directly under that directory.
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

# Caps loaded from the SINGLE SOURCE OF TRUTH — config/memory-caps.conf.
# Do NOT hardcode caps here; edit the conf. (tests/test-caps-single-source.sh enforces this.)
CAPS_CONF="$JARVIS_ROOT/config/memory-caps.conf"
declare -a CAPS=()
if [[ -f "$CAPS_CONF" ]]; then
  while IFS= read -r raw; do
    line="${raw%%#*}"; line="$(printf '%s' "$line" | xargs)"
    [[ -n "$line" ]] && CAPS+=("$line")
  done < "$CAPS_CONF"
else
  echo "ERROR: $CAPS_CONF missing (single source of truth for caps)" >&2
  exit 3
fi

over=0; warn=0; ok=0
[[ "$MODE" == "json" ]] && printf '['
first=1

for entry in "${CAPS[@]}"; do
  file="${entry%:*}"; cap="${entry##*:}"
  path="$JARVIS_ROOT/$file"
  if [[ "$file" == */ ]]; then
    # Directory entry: cap the SUM of *.md directly under it.
    if [[ ! -d "$path" ]]; then
      if [[ "$MODE" == "json" ]]; then
        [[ $first -eq 0 ]] && printf ','
        first=0
        printf '{"file":"%s","status":"missing","size":0,"cap":%d}' "$file" "$cap"
      else
        printf "%-32s ${DIM}missing${NC}\n" "$file"
      fi
      continue
    fi
    size=$(cat "$path"*.md 2>/dev/null | wc -c | tr -d ' ')
  elif [[ ! -f "$path" ]]; then
    if [[ "$MODE" == "json" ]]; then
      [[ $first -eq 0 ]] && printf ','
      first=0
      printf '{"file":"%s","status":"missing","size":0,"cap":%d}' "$file" "$cap"
    else
      printf "%-32s ${DIM}missing${NC}\n" "$file"
    fi
    continue
  else
    size=$(wc -c < "$path" | tr -d ' ')
  fi
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
