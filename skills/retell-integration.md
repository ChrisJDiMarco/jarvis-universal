# Skill: Retell AI Integration

## Trigger
"call logs", "Retell", "voice agent", "how did the call go", "call summary", "call performance", "AI calls", "call recording", "which calls converted", "voice automation status"

## Goal
Pull call logs, transcripts, summaries, and performance data from Retell AI via the n8n Retell bridge — enabling JARVIS to report on voice agent performance, surface hot leads from calls, and flag failed or low-quality calls without Chris having to log into Retell manually.

---

## Architecture

JARVIS → n8n Retell Bridge webhook → Retell API → parsed response to JARVIS

Same pattern as GHL bridge. Single n8n workflow with webhook trigger routing commands to Retell API.

**Bridge webhook URL**: Set in `n8n-configs/retell-bridge.json` after deployment. Store in `memory/agency.md` as `retell_bridge_webhook`.

---

## Available Commands

### Read Operations

**Get recent calls (default: last 50)**
```json
{
  "command": "get_calls",
  "params": {
    "limit": 50,
    "agent_id": "AGENT_ID",
    "start_timestamp": 1700000000000,
    "end_timestamp": 1700086400000
  }
}
```

**Get a single call with full detail**
```json
{
  "command": "get_call",
  "params": { "call_id": "call_abc123" }
}
```

**Get call transcript**
```json
{
  "command": "get_transcript",
  "params": { "call_id": "call_abc123" }
}
```

**List all agents**
```json
{
  "command": "list_agents",
  "params": {}
}
```

**Get agent performance summary (computed)**
```json
{
  "command": "get_performance",
  "params": {
    "agent_id": "AGENT_ID",
    "days": 7
  }
}
```

---

## Call Data Fields (What Retell Returns)

Each call object contains:
- `call_id` — unique identifier
- `agent_id` — which AI agent handled the call
- `call_status` — registered, ongoing, ended, error
- `start_timestamp` / `end_timestamp`
- `duration_ms` — call length
- `from_number` / `to_number`
- `transcript` — full text of conversation
- `call_analysis` — Retell's built-in analysis (sentiment, summary, custom fields)
- `disconnection_reason` — why call ended (agent_hangup, user_hangup, error, etc.)
- `recording_url` — link to call recording (if enabled)

---

## Performance Report Format

When reporting voice agent performance to Chris:

```
RETELL PERFORMANCE — [date range]
Agent: [agent_name] | Total Calls: [N] | Avg Duration: [Xm Ys]

OUTCOME BREAKDOWN
Booked appointment:     [N] ([X]%)
Voicemail left:         [N] ([X]%)
Not interested:         [N] ([X]%)
Call failed/error:      [N] ([X]%)

TOP CALL (longest engaged, likely warmest):
  Contact: [phone]
  Duration: [X] min
  Summary: [Retell's call_analysis.summary]

CALLS NEEDING ATTENTION:
  [Any calls with errors, very short duration, or negative sentiment]

RECOMMENDED ACTIONS:
  [1-2 specific follow-up actions based on call data]
```

---

## Call-to-Lead Workflow

When JARVIS detects a Retell call where the contact expressed interest but didn't book:
1. Pull the transcript from Retell
2. Extract contact's phone number and key context
3. Search GHL via ghl-integration skill for existing contact record
4. If no record: create_contact in GHL with `source: "retell-warm-call"`
5. Add a note with the call summary
6. Trigger the appropriate GHL follow-up workflow
7. Alert Chris via iMessage: "[Number] showed interest on AI call. Follow-up triggered."

---

## Rules
- Never expose Retell API keys — stored in n8n credentials only
- Don't pull recordings unless specifically asked — transcripts are sufficient for most tasks
- Flag any call where `disconnection_reason` = "error" or `call_status` = "error" — these indicate agent issues
- Performance reports run as part of the pipeline-pulse scheduled task (Mon/Wed/Fri)
- If a call transcript suggests an angry or distressed contact: flag immediately to Chris, do NOT trigger automated follow-up
