# Skill: Heartbeat Agent

## Trigger
"add a heartbeat", "proactive JARVIS", "check in on me", "monitor without being asked", "wake up and check", "autonomous check-ins"

## Origin
Inspired by Peter Steinberger's OpenClaw heartbeat feature (TED Talk, April 2026). By default, agents only wake when prompted. A heartbeat makes JARVIS wake periodically, scan for what needs attention, and surface it proactively — transforming JARVIS from reactive tool to proactive collaborator.

## Goal
JARVIS wakes on a schedule, scans the operator's context (email, calendar, Slack, active projects), identifies anything that needs attention or follow-up, and sends a concise iMessage alert if anything is time-sensitive. Silent if nothing needs attention.

---

## Architecture

```
Scheduled trigger (every N hours)
    ↓
Heartbeat agent wakes
    ↓
Parallel scans: email → calendar → Slack → active project status
    ↓
Triage: anything time-sensitive or overdue?
    ↓
YES → iMessage alert with summary + top action
NO  → silent (log only)
```

---

## Heartbeat Scan Protocol

### What to scan (in parallel):
1. **Email** (`gmail_*`): Unread emails from the last 4 hours. Flag: direct questions, urgent keywords, known important senders
2. **Calendar** (`gcal_*`): Events in next 2 hours. Flag: meetings without prep, back-to-back blocks
3. **Slack** (`slack_*`): Unread messages in monitored channels. Flag: @mentions, DMs, action items
4. **Active projects**: Check `owners-inbox/` for any files awaiting review. Check `logs/daily-activity.md` for any unclosed tasks

### Triage criteria (flag if ANY are true):
- An email has a direct question or deadline language ("by EOD", "ASAP", "when can you")
- A meeting starts within 90 minutes with no notes or prep doc
- An @mention or DM is unanswered for >2 hours
- `owners-inbox/` has a file older than 48 hours with no response

### Alert format (via the operator's preferred alert channel):
```
⏱ JARVIS heartbeat — {time}

{flagged items as bullet list}

Top action: {single most urgent thing}
```

### Silent if clean:
Log to `logs/heartbeat.log`:
```
{timestamp} — heartbeat ran — nothing flagged
```

---

## Activation: Scheduled Task Setup

To activate the heartbeat, create a scheduled task with this config:

**Name**: `jarvis-heartbeat`
**Schedule**: Every 2 hours on weekdays (8am–8pm), or custom
**Prompt template**:
```
You are JARVIS running a proactive heartbeat check for the operator.

Scan in parallel:
1. Gmail: unread emails last 4 hours
2. Google Calendar: events next 2 hours  
3. Slack: unread @mentions and DMs
4. owners-inbox: files awaiting review

Triage criteria: email with direct question/deadline, meeting in <90min without prep, unanswered @mention >2hrs, owners-inbox file >48hrs

If anything flags: send an alert via the operator's preferred channel (iMessage / Slack / Telegram / email — see memory/core.md) with the ⏱ JARVIS heartbeat format.
If nothing flags: log to logs/heartbeat.log and exit silently.
```

**To activate now**: Ask JARVIS "activate heartbeat every 2 hours on weekdays" and JARVIS will set up the scheduled task.

---

## Customization Options

| Setting | Default | Options |
|---------|---------|---------|
| Frequency | Every 2 hours | Any interval |
| Hours | 8am–8pm weekdays | Custom |
| Channels | Email, Calendar, Slack, owners-inbox | Add/remove |
| Alert method | iMessage | Slack DM, Apple Notes |
| Triage sensitivity | Standard | Strict (fewer alerts) / Loose (more alerts) |

---

## Rules
- Never send more than 3 heartbeat alerts per day — if everything keeps flagging, something is wrong with the triage criteria, not the inputs
- Silent by default — only interrupt the operator when there's a genuine action needed
- Log every run (flagged or not) to `logs/heartbeat.log` for review
- If a scan tool is unavailable (MCP disconnected), skip that source and note it in the log

---

## Related
[[persistent-daemon]]  [[morning-briefing]]  [[memory-management]]
