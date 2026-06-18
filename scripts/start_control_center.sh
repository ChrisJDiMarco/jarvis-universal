#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
PORT="${JARVIS_CONTROL_CENTER_PORT:-5174}"
LOG_DIR="$ROOT_DIR/logs"
PID_FILE="$LOG_DIR/control-center-server.pid"
LOG_FILE="$LOG_DIR/control-center-server.log"

mkdir -p "$LOG_DIR"

if [[ -f "$PID_FILE" ]]; then
  OLD_PID="$(cat "$PID_FILE")"
  if [[ -n "$OLD_PID" ]] && kill -0 "$OLD_PID" 2>/dev/null; then
    echo "Control Center already running on pid $OLD_PID"
    echo "URL: http://127.0.0.1:$PORT"
    exit 0
  fi
fi

cd "$ROOT_DIR"
nohup python3 runtime/control_center/server.py > "$LOG_FILE" 2>&1 &
echo "$!" > "$PID_FILE"
echo "Control Center started on pid $(cat "$PID_FILE")"
echo "URL: http://127.0.0.1:$PORT"
echo "Log: $LOG_FILE"
