#!/usr/bin/env bash
# check-staleness.sh — flag memory files whose "current" claims have gone stale.
#
# Catches the failure mode where a memory file says "CURRENT FOCUS" or
# "Last updated: <date>" but nobody has touched it in weeks, so JARVIS
# keeps acting on a world that no longer exists.
#
# Checks:
#   1. Any memory/*.md "Last updated: YYYY-MM-DD" line older than $MAX_AGE_DAYS
#   2. Any memory/*.md line containing CURRENT (e.g. "CURRENT FOCUS") in a file
#      whose newest dated marker is older than $MAX_AGE_DAYS
#   3. memory/hot.md untouched for > $HOT_MAX_AGE_DAYS (hot cache should evaporate)
#
# Exit codes: 0 = clean, 2 = stale items found
# Usage: scripts/check-staleness.sh [--quiet]

set -uo pipefail
JARVIS_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
MEM="$JARVIS_ROOT/memory"
MAX_AGE_DAYS=14
HOT_MAX_AGE_DAYS=3
QUIET="${1:-}"
NOW_EPOCH=$(date +%s)
stale=0

say() { [[ "$QUIET" == "--quiet" ]] || echo "$@"; }

date_to_epoch() {
  # GNU and BSD date compatibility
  date -d "$1" +%s 2>/dev/null || date -j -f "%Y-%m-%d" "$1" +%s 2>/dev/null
}

age_days() {
  local epoch="$1"
  echo $(( (NOW_EPOCH - epoch) / 86400 ))
}

say "JARVIS Memory Staleness Check ($(date +%Y-%m-%d), threshold ${MAX_AGE_DAYS}d)"
say "================================================================"

for f in "$MEM"/*.md; do
  [[ -f "$f" ]] || continue
  base=$(basename "$f")

  # Newest YYYY-MM-DD anywhere in the file = the file's freshness signal
  newest_date=$(grep -oE '20[0-9]{2}-[0-9]{2}-[0-9]{2}' "$f" | sort | tail -1)

  # Check 1: explicit "Last updated:" lines
  last_updated=$(grep -oiE 'last updated:? *20[0-9]{2}-[0-9]{2}-[0-9]{2}' "$f" \
    | grep -oE '20[0-9]{2}-[0-9]{2}-[0-9]{2}' | sort | tail -1)
  if [[ -n "${last_updated:-}" ]]; then
    epoch=$(date_to_epoch "$last_updated")
    if [[ -n "$epoch" ]]; then
      days=$(age_days "$epoch")
      if (( days > MAX_AGE_DAYS )); then
        say "! $base — 'Last updated: $last_updated' is ${days}d old"
        stale=$((stale+1))
      fi
    fi
  fi

  # Check 2: CURRENT claims in files whose newest date marker is old
  if grep -q 'CURRENT' "$f" && [[ -n "${newest_date:-}" ]]; then
    epoch=$(date_to_epoch "$newest_date")
    if [[ -n "$epoch" ]]; then
      days=$(age_days "$epoch")
      if (( days > MAX_AGE_DAYS )); then
        say "! $base — contains a CURRENT claim but newest date marker ($newest_date) is ${days}d old"
        stale=$((stale+1))
      fi
    fi
  fi
done

# Check 3: hot cache should be recent or empty
HOT="$MEM/hot.md"
if [[ -f "$HOT" ]]; then
  mtime=$(stat -c %Y "$HOT" 2>/dev/null || stat -f %m "$HOT" 2>/dev/null)
  if [[ "${mtime:-}" =~ ^[0-9]+$ ]]; then
    days=$(( (NOW_EPOCH - mtime) / 86400 ))
    if (( days > HOT_MAX_AGE_DAYS )); then
      say "! hot.md — untouched for ${days}d (hot cache is meant to evaporate; clear or refresh it)"
      stale=$((stale+1))
    fi
  fi
fi

say "================================================================"
if (( stale > 0 )); then
  say "$stale stale item(s). Ask the operator what's actually current, then update the file(s)."
  exit 2
fi
say "All memory freshness claims check out."
exit 0
