#!/usr/bin/env bash
# JARVIS Universal — Status dashboard
#
# Generates a single self-contained HTML page snapshotting:
#   - Memory file health (size vs cap)
#   - Recent decisions (last 5)
#   - Recent learnings (last 5)
#   - Recent daily activity (last 7 entries)
#   - Inbox state
#   - Health-check summary
#
# Output: owners-inbox/dashboard.html
# Open with: open owners-inbox/dashboard.html  (macOS)

set -uo pipefail

SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
JARVIS_ROOT="$( cd "$SCRIPT_DIR/.." && pwd )"
OUT="$JARVIS_ROOT/owners-inbox/dashboard.html"

mkdir -p "$(dirname "$OUT")"

# Helpers
file_size() { [[ -f "$1" ]] && wc -c < "$1" | tr -d ' ' || echo 0; }
last_n_sections() {
  # Read a markdown file and return last N sections (## headings)
  local file="$1" n="$2"
  [[ ! -f "$file" ]] && return
  awk -v n="$n" '
    /^## / { sections[++count] = $0; section_starts[count] = NR }
    { lines[NR] = $0 }
    END {
      start = (count > n) ? section_starts[count - n + 1] : 1
      for (i = start; i <= NR; i++) print lines[i]
    }
  ' "$file"
}
escape_html() { sed 's/&/\&amp;/g; s/</\&lt;/g; s/>/\&gt;/g'; }

# Run health check, capture summary
HEALTH_JSON=$(bash "$JARVIS_ROOT/setup/check.sh" --json 2>/dev/null || echo '{}')
PASSES=$(echo "$HEALTH_JSON" | grep -o '"passes":[0-9]*' | grep -o '[0-9]*' || echo 0)
WARNS=$(echo "$HEALTH_JSON" | grep -o '"warnings":[0-9]*' | grep -o '[0-9]*' || echo 0)
CRIT=$(echo "$HEALTH_JSON" | grep -o '"critical":[0-9]*' | grep -o '[0-9]*' || echo 0)

# Memory caps (must match check-memory-caps.sh)
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

NOW=$(date -u +"%Y-%m-%d %H:%M UTC")

# ─── Build HTML ───
cat > "$OUT" <<HTML
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<title>JARVIS — Status Dashboard</title>
<style>
  :root { --bg:#0d1117; --card:#161b22; --border:#30363d; --fg:#e6edf3; --dim:#8b949e; --green:#3fb950; --yellow:#d29922; --red:#f85149; --blue:#58a6ff; }
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { background: var(--bg); color: var(--fg); font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", system-ui, sans-serif; line-height: 1.5; padding: 32px; }
  .wrap { max-width: 1100px; margin: 0 auto; }
  header { display: flex; align-items: baseline; justify-content: space-between; margin-bottom: 24px; }
  h1 { font-size: 22px; font-weight: 600; }
  .timestamp { color: var(--dim); font-size: 13px; font-variant-numeric: tabular-nums; }
  .grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(320px, 1fr)); gap: 16px; }
  .card { background: var(--card); border: 1px solid var(--border); border-radius: 8px; padding: 20px; }
  .card.full { grid-column: 1 / -1; }
  h2 { font-size: 13px; text-transform: uppercase; letter-spacing: 0.06em; color: var(--dim); margin-bottom: 14px; font-weight: 600; }
  .health-row { display: flex; gap: 24px; }
  .stat { display: flex; flex-direction: column; }
  .stat .num { font-size: 28px; font-weight: 600; font-variant-numeric: tabular-nums; }
  .stat .label { font-size: 11px; color: var(--dim); text-transform: uppercase; letter-spacing: 0.05em; }
  .stat.pass .num { color: var(--green); }
  .stat.warn .num { color: var(--yellow); }
  .stat.crit .num { color: var(--red); }
  .bar-row { display: flex; align-items: center; gap: 12px; margin-bottom: 8px; font-size: 13px; }
  .bar-row .name { width: 200px; color: var(--dim); font-family: SF Mono, Menlo, monospace; font-size: 12px; }
  .bar-row .bar { flex: 1; height: 6px; background: var(--border); border-radius: 3px; overflow: hidden; }
  .bar-row .bar > div { height: 100%; background: var(--green); }
  .bar-row.warn .bar > div { background: var(--yellow); }
  .bar-row.over .bar > div { background: var(--red); }
  .bar-row .pct { width: 60px; text-align: right; font-variant-numeric: tabular-nums; color: var(--dim); }
  pre { background: #0a0d12; padding: 14px; border-radius: 6px; overflow-x: auto; font-size: 12px; line-height: 1.6; color: var(--fg); white-space: pre-wrap; }
  .empty { color: var(--dim); font-style: italic; padding: 12px 0; }
</style>
</head>
<body>
<div class="wrap">

<header>
  <h1>JARVIS — Status Dashboard</h1>
  <div class="timestamp">Generated $NOW</div>
</header>

<div class="grid">

<div class="card">
  <h2>Health</h2>
  <div class="health-row">
    <div class="stat pass"><span class="num">$PASSES</span><span class="label">passing</span></div>
    <div class="stat warn"><span class="num">$WARNS</span><span class="label">warnings</span></div>
    <div class="stat crit"><span class="num">$CRIT</span><span class="label">critical</span></div>
  </div>
</div>

<div class="card">
  <h2>Memory</h2>
HTML

for entry in "${CAPS[@]}"; do
  file="${entry%:*}"; cap="${entry##*:}"
  size=$(file_size "$JARVIS_ROOT/$file")
  pct=$(( size * 100 / cap ))
  cls=""
  [[ $pct -ge 80 && $pct -lt 100 ]] && cls=" warn"
  [[ $pct -ge 100 ]] && cls=" over"
  bar=$(( pct > 100 ? 100 : pct ))
  short_name="${file#memory/}"
  cat >> "$OUT" <<HTML
  <div class="bar-row$cls">
    <div class="name">$short_name</div>
    <div class="bar"><div style="width:${bar}%"></div></div>
    <div class="pct">${pct}%</div>
  </div>
HTML
done

cat >> "$OUT" <<HTML
</div>

<div class="card">
  <h2>Inbox</h2>
HTML

INBOX_FILES=$(find "$JARVIS_ROOT/owners-inbox" -maxdepth 1 -type f ! -name ".gitkeep" 2>/dev/null | wc -l | tr -d ' ')
ARCHIVE_FILES=$(find "$JARVIS_ROOT/owners-inbox/archive" -type f ! -name ".gitkeep" 2>/dev/null | wc -l | tr -d ' ')
TEAM_INBOX_FILES=$(find "$JARVIS_ROOT/team-inbox" -maxdepth 1 -type f ! -name ".gitkeep" 2>/dev/null | wc -l | tr -d ' ')

cat >> "$OUT" <<HTML
  <div class="health-row">
    <div class="stat"><span class="num">$INBOX_FILES</span><span class="label">owners-inbox (cap 20)</span></div>
    <div class="stat"><span class="num">$TEAM_INBOX_FILES</span><span class="label">team-inbox</span></div>
    <div class="stat"><span class="num">$ARCHIVE_FILES</span><span class="label">archived</span></div>
  </div>
</div>

<div class="card full">
  <h2>Recent Decisions</h2>
HTML

DEC_CONTENT=$(last_n_sections "$JARVIS_ROOT/memory/decisions.md" 5 | escape_html)
if [[ -n "$DEC_CONTENT" ]]; then
  echo "  <pre>$DEC_CONTENT</pre>" >> "$OUT"
else
  echo "  <div class=\"empty\">No decisions logged yet.</div>" >> "$OUT"
fi

cat >> "$OUT" <<HTML
</div>

<div class="card full">
  <h2>Recent Learnings</h2>
HTML

LEARN_CONTENT=$(last_n_sections "$JARVIS_ROOT/memory/learnings.md" 5 | escape_html)
if [[ -n "$LEARN_CONTENT" ]]; then
  echo "  <pre>$LEARN_CONTENT</pre>" >> "$OUT"
else
  echo "  <div class=\"empty\">No learnings extracted yet.</div>" >> "$OUT"
fi

cat >> "$OUT" <<HTML
</div>

<div class="card full">
  <h2>Recent Activity</h2>
HTML

ACT_CONTENT=$(last_n_sections "$JARVIS_ROOT/logs/daily-activity.md" 7 | escape_html)
if [[ -n "$ACT_CONTENT" ]]; then
  echo "  <pre>$ACT_CONTENT</pre>" >> "$OUT"
else
  echo "  <div class=\"empty\">No activity logged yet — sessions populate this automatically via the Stop hook.</div>" >> "$OUT"
fi

cat >> "$OUT" <<'HTML'
</div>

</div>
</div>
</body>
</html>
HTML

echo "Dashboard written: $OUT"
echo "Open with: open '$OUT'"
