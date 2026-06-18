#!/bin/bash
# JARVIS PreCompact Hook
# Fires before Claude Code compresses the context window.
# Writes a timestamped flag so JARVIS knows a compression happened
# and should treat the next memory write as a recovery save.

JARVIS_DIR="$HOME/jarvis"
LOG_FILE="$JARVIS_DIR/logs/precompact-flag.md"
TIMESTAMP=$(date '+%Y-%m-%d %H:%M:%S')

mkdir -p "$JARVIS_DIR/logs"

cat >> "$LOG_FILE" << EOF

## Compression event: $TIMESTAMP
Status: CONTEXT COMPRESSED — memory may be incomplete for this session.
Action: On next session start, treat as recovery — prioritize reading all memory files and writing any unsaved decisions/learnings from the compressed session.
EOF

# Keep the flag bounded. It had bloated to 40KB+/149 events with the recovery
# loop never closing, degrading the signal to noise. Archive when it grows past
# ~8KB and keep only the most recent entries.
FLAG_BYTES=$(wc -c < "$LOG_FILE" 2>/dev/null | tr -d ' ')
if [ "${FLAG_BYTES:-0}" -gt 8000 ]; then
    ARCHIVE_DIR="$JARVIS_DIR/logs/archive"
    mkdir -p "$ARCHIVE_DIR"
    cp "$LOG_FILE" "$ARCHIVE_DIR/precompact-flag-$(date '+%Y-%m-%d_%H%M%S').md"
    tail -n 12 "$LOG_FILE" > "$LOG_FILE.tmp" && mv "$LOG_FILE.tmp" "$LOG_FILE"
fi

echo "[JARVIS] PreCompact flag written at $TIMESTAMP"
