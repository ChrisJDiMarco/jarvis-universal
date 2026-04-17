# Skill: GHL Integration

## Trigger
"check pipeline", "pipeline status", "GHL", "GoHighLevel", "update contact", "add contact", "trigger sequence", "how many leads", "contact [name]", "move [client] to [stage]", "send follow-up", any agency pipeline query

## Goal
Read and write to GoHighLevel (GHL) CRM from within JARVIS — contacts, opportunities, pipelines, tags, and workflow triggers — via the n8n GHL bridge webhook.

---

## Architecture

JARVIS → n8n GHL Bridge webhook → GHL API → response back to JARVIS

The bridge is a single n8n workflow with a webhook trigger that accepts structured commands and routes them to the appropriate GHL API endpoint. This avoids needing a dedicated GHL MCP.

**Bridge webhook URL**: Set in `n8n-configs/ghl-bridge.json` after deployment. Store in `memory/agency.md` once live.

---

## Available Commands

Send all commands as JSON POST to the bridge webhook. The bridge handles auth and returns structured responses.

### Read Operations

**Get all contacts (with optional filters)**
```json
{
  "command": "get_contacts",
  "params": {
    "limit": 50,
    "tag": "hvac-lead",
    "pipeline_stage": "discovery",
    "search": "roofing"
  }
}
```

**Get a single contact**
```json
{
  "command": "get_contact",
  "params": { "contact_id": "abc123" }
}
```

**Get pipeline with all opportunities**
```json
{
  "command": "get_pipeline",
  "params": {
    "pipeline_id": "PIPELINE_ID",
    "stage": "all"
  }
}
```

**Get a specific opportunity**
```json
{
  "command": "get_opportunity",
  "params": { "opportunity_id": "opp123" }
}
```

**Get recent conversations**
```json
{
  "command": "get_conversations",
  "params": { "contact_id": "abc123", "limit": 10 }
}
```

### Write Operations

**Update contact**
```json
{
  "command": "update_contact",
  "params": {
    "contact_id": "abc123",
    "fields": {
      "tags": ["hot-lead", "hvac"],
      "customField": { "last_contacted": "2026-03-24" }
    }
  }
}
```

**Move opportunity to new stage**
```json
{
  "command": "update_opportunity",
  "params": {
    "opportunity_id": "opp123",
    "stage_id": "STAGE_ID",
    "status": "open"
  }
}
```

**Add a note to a contact**
```json
{
  "command": "add_note",
  "params": {
    "contact_id": "abc123",
    "body": "Spoke on 2026-03-24. Interested in Tier 2. Follow up in 3 days."
  }
}
```

**Trigger a GHL workflow for a contact**
```json
{
  "command": "trigger_workflow",
  "params": {
    "contact_id": "abc123",
    "workflow_id": "WORKFLOW_ID"
  }
}
```

**Create a new contact**
```json
{
  "command": "create_contact",
  "params": {
    "firstName": "John",
    "lastName": "Smith",
    "email": "john@smithhvac.com",
    "phone": "+12155551234",
    "tags": ["hvac", "cold-outreach"],
    "source": "reddit-scout"
  }
}
```

---

## How to Call the Bridge (from within JARVIS)

Use the n8n MCP to trigger the webhook workflow, or HTTP fetch if n8n MCP isn't available:

```
1. Look up bridge webhook URL from memory/agency.md
2. POST the command JSON to the webhook URL
3. Wait for n8n response (usually <3 seconds)
4. Parse the response and act accordingly
```

Via n8n MCP (preferred):
- Use `mcp__fd53927f-c58e-4c98-9aca-21f57f7e3047__execute_workflow`
- workflow_id: "ghl-bridge" (set after deployment)
- Pass command as workflow input payload

---

## Pipeline Reporting Format

When reporting pipeline status to Chris, always use this format:

```
PIPELINE STATUS — [date]
Revenue target: $60K | Days remaining: [X] | MRR needed: $[X]

STAGE          | LEADS | VALUE    | NEXT ACTION
---------------|-------|----------|------------------
Cold Outreach  |  12   | $54,000  | 3 follow-ups due today
Discovery Sched|   4   | $18,000  | Prep briefs
Proposal Sent  |   2   | $9,000   | Follow up: John @ Smith HVAC
Closed Won     |   1   | $3,000   | Onboarding in progress
Closed Lost    |   3   | —        | Re-engage in 30 days

ALERTS: [any overdue actions, stalled deals, or errors]
```

---

## IDs to Know (populate from memory/agency.md once live)
- Location ID: stored in memory/agency.md
- Main Pipeline ID: stored in memory/agency.md
- Stage IDs (by name): stored in memory/agency.md
- Key Workflow IDs: stored in memory/agency.md

---

## Rules
- Always check `memory/agency.md` for current pipeline IDs before making API calls
- Write operations (update, trigger) require confirmation if value >$1,000 or if it's an irreversible action
- After any pipeline write: update SQLite `clients` table in `data/jarvis.db` to keep local state in sync
- Never expose GHL API keys — they live in n8n credentials only
- If the bridge returns an error: log it, do not retry automatically, report to Chris with full error context
