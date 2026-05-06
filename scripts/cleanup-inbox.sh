#!/usr/bin/env bash
# JARVIS Universal — owners-inbox lifecycle enforcement
#
# Implements the policy from CLAUDE.md:
#   "Files older than 7 days with no action move to owners-inbox/archive/.
#    Never let inbox exceed 20 files — a full inbox has zero signal value."
#
# Run manually, or schedule via scheduled-tasks MCP / cron.
#
# Usage:
#   bash scripts/cleanup-inbox.sh           # archive >7d files
#   bash scripts/cleanup-inbox.sh --dry-run # report what would happen
#   bash scripts/cleanup-inbox.sh --days 14 # custom age threshold

set -euo pipefail

SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
JARVIS_ROOT="$( cd "$SCRIPT_DIR/.." && pwd )"

INBOX="$JARVIS_ROOT/owners-inbox"
ARCHIVE="$INBOX/archive"
LOG="$JARVIS_ROOT/logs/cleanup.log"
DAYS=7
DRY=0

while [[ $# -gt 0 ]]; do
  case "$1" in
    --dry-run) DRY=1; shift ;;
    --days)    DAYS="$2"; shift 2 ;;
    *) echo "Unknown arg: $1" >&2; exit 1 ;;
  esac
done

mkdir -p "$ARCHIVE"
mkdir -p "$(dirname "$LOG")"

if [[ ! -d "$INBOX" ]]; then
  echo "owners-inbox/ does not exist — nothing to do"
  exit 0
fi

echo "Cleanup pass — $(date -u +%Y-%m-%dT%H:%M:%SZ)"
echo "Threshold: files older than $DAYS days"
[[ $DRY -eq 1 ]] && echo "Mode: dry-run (no files will move)"

archived=0
# Find files (not dirs, not in archive/, not .gitkeep) older than $DAYS days
while IFS= read -r -d '' f; do
  rel="${f#$INBOX/}"
  if [[ $DRY -eq 1 ]]; then
    echo "  WOULD ARCHIVE: $rel"
  else
    target="$ARCHIVE/$rel"
    mkdir -p "$(dirname "$target")"
    mv "$f" "$target"
    echo "$(date -u +%Y-%m-%dT%H:%M:%SZ) archived $rel" >> "$LOG"
    echo "  archived: $rel"
  fi
  archived=$((archived+1))
done < <(find "$INBOX" -type f ! -name ".gitkeep" ! -path "$ARCHIVE/*" -mtime +$DAYS -print0 2>/dev/null)

# Enforce 20-file cap on inbox root
root_count=$(find "$INBOX" -maxdepth 1 -type f ! -name ".gitkeep" 2>/dev/null | wc -l | tr -d ' ')
if [[ $root_count -gt 20 ]]; then
  echo ""
  echo "WARN: owners-inbox root has $root_count files (cap: 20)."
  echo "      Oldest files have already been archived above. Review:"
  find "$INBOX" -maxdepth 1 -type f ! -name ".gitkeep" -printf "        %T@ %p\n" 2>/dev/null \
    | sort -n | head -5 | awk '{print $2}'
fi

echo ""
echo "Done. Archived: $archived. Inbox root files: $root_count / 20."
