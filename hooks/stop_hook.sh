#!/bin/bash
# JARVIS Stop Hook
# Fires when Claude Code finishes responding (end of a turn/session).
# Appends a breadcrumb to logs/session-log.jsonl every time.
# If the session was substantive (>=3 tool calls OR any file writes),
# also appends a structured entry to logs/daily-activity.md
# so the activity log reflects real work without Chris having to do it manually.
#
# Zero-token: pure bash + jq, no Claude invocations.
# Input: Claude Code passes a JSON object on stdin:
#   { "session_id": "...", "transcript_path": "...", "hook_event_name": "Stop", ... }

JARVIS_DIR="$HOME/jarvis"
LOG_DIR="$JARVIS_DIR/logs"
SESSION_LOG="$LOG_DIR/session-log.jsonl"
ACTIVITY_LOG="$LOG_DIR/daily-activity.md"

mkdir -p "$LOG_DIR"

# Read the hook payload from stdin
PAYLOAD=$(cat)

# Extract key fields (fall back gracefully if jq missing or field absent)
if command -v jq >/dev/null 2>&1; then
    SESSION_ID=$(echo "$PAYLOAD" | jq -r '.session_id // "unknown"')
    TRANSCRIPT=$(echo "$PAYLOAD" | jq -r '.transcript_path // ""')
else
    SESSION_ID="unknown"
    TRANSCRIPT=""
fi

TIMESTAMP=$(date '+%Y-%m-%d %H:%M:%S')
DATE=$(date '+%Y-%m-%d')

# Parse the transcript if we have one + jq
TOOL_COUNT=0
FILE_WRITES=0
FIRST_USER_MSG=""
TOOLS_USED=""
FILES_TOUCHED=""

if [ -n "$TRANSCRIPT" ] && [ -f "$TRANSCRIPT" ] && command -v jq >/dev/null 2>&1; then
    # Count tool_use entries in the transcript
    TOOL_COUNT=$(jq -r 'select(.type=="assistant") | .message.content[]? | select(.type=="tool_use") | .name' "$TRANSCRIPT" 2>/dev/null | wc -l | tr -d ' ')

    # File writes = Write or Edit tool calls
    FILE_WRITES=$(jq -r 'select(.type=="assistant") | .message.content[]? | select(.type=="tool_use" and (.name=="Write" or .name=="Edit" or .name=="NotebookEdit")) | .name' "$TRANSCRIPT" 2>/dev/null | wc -l | tr -d ' ')

    # Unique tool names used
    TOOLS_USED=$(jq -r 'select(.type=="assistant") | .message.content[]? | select(.type=="tool_use") | .name' "$TRANSCRIPT" 2>/dev/null | sort -u | tr '\n' ',' | sed 's/,$//')

    # First user message (truncated)
    FIRST_USER_MSG=$(jq -r 'select(.type=="user") | .message.content | if type=="string" then . else (.[]? | select(.type=="text") | .text) end' "$TRANSCRIPT" 2>/dev/null | head -1 | cut -c1-200)

    # Files touched by Write/Edit
    FILES_TOUCHED=$(jq -r 'select(.type=="assistant") | .message.content[]? | select(.type=="tool_use" and (.name=="Write" or .name=="Edit")) | .input.file_path // empty' "$TRANSCRIPT" 2>/dev/null | sort -u | head -10 | tr '\n' ',' | sed 's/,$//')
fi

# Always: append a breadcrumb to session-log.jsonl
BREADCRUMB=$(jq -nc --arg ts "$TIMESTAMP" --arg sid "$SESSION_ID" --arg tools "$TOOLS_USED" --argjson tcount "$TOOL_COUNT" --argjson fwrites "$FILE_WRITES" --arg first "$FIRST_USER_MSG" \
    '{timestamp: $ts, session_id: $sid, tool_count: $tcount, file_writes: $fwrites, tools: $tools, first_message: $first}' 2>/dev/null)

if [ -n "$BREADCRUMB" ]; then
    echo "$BREADCRUMB" >> "$SESSION_LOG"
fi

# Substantive session = at least one file write OR >=3 tool calls
if [ "$FILE_WRITES" -gt 0 ] || [ "$TOOL_COUNT" -ge 3 ]; then
    # Build session title from the first user message (first 60 chars)
    TITLE=$(echo "$FIRST_USER_MSG" | cut -c1-60 | tr -d '\n')
    [ -z "$TITLE" ] && TITLE="(no user message captured)"

    # Append a structured entry (CLAUDE.md format)
    {
        echo ""
        echo "## $DATE — $TITLE"
        echo "**What happened**: Session used ${TOOL_COUNT} tool calls, ${FILE_WRITES} file writes. Tools: ${TOOLS_USED:-none}."
        if [ -n "$FILES_TOUCHED" ]; then
            echo "**Files touched**: $FILES_TOUCHED"
        fi
        echo "**Why it matters**: [fill in manually if significant]"
        echo "**Share-worthy**: [LOW / MEDIUM / HIGH — fill in manually]"
    } >> "$ACTIVITY_LOG"
fi

# ── Memory index: reindex any memory/*.md files touched this session ──────────
if [ -n "$FILES_TOUCHED" ] && echo "$FILES_TOUCHED" | grep -q "memory/"; then
    CHANGED_MEMORY_FILES=$(echo "$FILES_TOUCHED" | tr ',' '\n' | grep "memory/.*\.md" | xargs -I{} basename {} | tr '\n' ' ')
    if [ -n "$CHANGED_MEMORY_FILES" ]; then
        cd "$JARVIS_DIR" && python3 memory/memory_indexer.py $CHANGED_MEMORY_FILES >> "$LOG_DIR/memory-index.log" 2>&1 &
    fi
fi

exit 0
