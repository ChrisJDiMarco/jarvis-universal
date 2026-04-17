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

echo "[JARVIS] PreCompact flag written at $TIMESTAMP"
