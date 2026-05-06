# Skill: Persistent Daemon

## Trigger
"monitor", "watch for", "alert me when", "keep an eye on", "notify me if", "check in the background", or any request to have JARVIS proactively act without being prompted

## Goal
Make JARVIS ambient — able to detect events, monitor state, and surface alerts without the operator having to initiate a session.

---

## How "Always On" Works for JARVIS

JARVIS runs in sessions — it doesn't truly run continuously. But between scheduled tasks and alert channels, JARVIS is effectively always on:

| Layer | How It Works |
|-------|-------------|
| Scheduled tasks | Cron jobs fire JARVIS at set times (requires scheduled-tasks MCP) |
| team-inbox monitor | Scheduled task watches for new files in team-inbox/ |
| Custom monitors | Operator-defined: check X, alert if Y |

---

## Adding New Monitoring Loops

When the operator says "alert me when X happens", create a new scheduled task:

**Template:**
```
Task: monitor-[what]
Cron: [frequency — hourly for urgent, daily for normal, weekly for low-signal]
Prompt: Check [source/condition]. If [trigger condition]:
  1. Save finding to owners-inbox/alerts/[date]-[type].md
  2. Send alert to operator via [preferred channel]: "[JARVIS ALERT] [brief description] — details in owners-inbox"
  Otherwise: log "no action needed" and exit quietly.
```

---

## Common Monitoring Patterns

### Goal Pace Monitor (Daily)
```
Check current revenue/metric progress in data/jarvis.db.
If behind target pace: alert operator via iMessage with current pace and what's needed.
If on track: log silently.
```

### Inbox Monitor (Daily or On-Demand)
```
Check owners-inbox/ for files older than 3 days with no action.
If found: notify operator with list + "stale items need review or archive"
```

### team-inbox File Watcher (Daily)
```
Check team-inbox/ for new files since last run.
If found: read file, determine type (brief, data, invoice, etc.), route to appropriate agent.
Output to owners-inbox/ + alert operator.
```

### Keyword Monitor (Custom frequency)
```
Run firecrawl_search for [keyword/brand/competitor] from [sources].
If significant new results: save to owners-inbox/alerts/[date].md + alert operator.
```

---

## Alert Format

All proactive JARVIS alerts:
```
[JARVIS] {ALERT TYPE}
{1-2 sentence summary of what happened}
{Recommended action}
Details → owners-inbox/{path}
```

---

## Alert Channels

Configure in `memory/core.md` under "Stack & Integrations":
- **iMessage** (`send_imessage`) — default for urgent personal alerts
- **Slack** (`slack_send_message`) — default for team/work alerts
- **Email** (`gmail_create_draft`) — for non-urgent summaries
- **Apple Notes** — for silent logging that syncs to phone

---

## Rules
- Every alert must include a recommended action — never alert without a "so what"
- Silent runs (no action needed) get logged to `logs/` but do NOT send alerts
- Max 3 unsolicited alerts per day — prioritize ruthlessly
- Scheduled tasks are the heartbeat — use them for regular monitoring
- If an alert fires and operator doesn't respond in 24 hours: log as acknowledged, don't re-alert
- Never alert on the same item twice in the same day
