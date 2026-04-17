# Skill: Workflow Builder

## Trigger
"build a workflow", "automate [X]", "new automation", "n8n workflow", "Zapier workflow", "Make scenario", "automate this process", "set up [trigger] → [action]"

## Goal
Design and deploy automation workflows using proven patterns. Translate a business process into a working automation — webhook, schedule, or event-triggered — with proper error handling and testing.

---

## Supported Platforms
- **n8n** (primary — most powerful, self-hostable)
- **Zapier** (easiest for non-technical users)
- **Make** (visual, mid-complexity)
- **Custom webhook chains** (for API-to-API without a platform)

This skill uses n8n as the reference platform. Adapt patterns for other platforms as needed.

---

## Step 1: Requirement Gathering

Before designing anything, answer:

```
Trigger: What starts this workflow? [webhook / schedule / event / manual]
Input: What data comes in at the trigger?
Steps: What happens in sequence?
Output: What does the workflow produce? (message, record, file, notification)
Error case: What should happen if it fails?
Volume: How often does this run? (per minute / per hour / per day)
```

If any of these is unclear → ask before designing.

---

## Step 2: Design (Node Map)

Produce a plain-English node map BEFORE generating any JSON:

```
[Trigger: Webhook POST from form submission]
  ↓
[IF: email field is empty]
  → YES: [Respond 400 — required field missing]
  → NO: continue
  ↓
[HTTP: POST to CRM API — create contact]
  ↓
[Send Email: welcome email via Resend]
  ↓
[SQLite: log execution to jarvis.db]
  ↓
[Respond: 200 success]

Error handler:
  [Error Trigger] → [Send alert via Slack/iMessage] → [Log to SQLite]
```

Get approval on the node map before generating JSON.

---

## Step 3: Generate Workflow

For n8n: produce importable JSON saved to `n8n-configs/[workflow-name].json`

**Every workflow must include:**
- Error trigger node (or Continue On Fail on non-critical nodes)
- Execution logging to SQLite (`system_logs` table) or similar
- Alert on critical failure (iMessage, Slack, or email)
- A test payload in the workflow notes

---

## Step 4: Test + Deploy (Self-Healing)

Apply the `self-healing-executor` skill:
1. Validate JSON schema and node connectivity
2. Execute with test payload
3. If failure: diagnose → repair → retry (max 5 iterations)
4. On success: deploy and document

Save deployment record to `owners-inbox/automations/[name]-[date].md`

---

## Common Workflow Patterns

### Pattern 1: Form → CRM → Email
```
Webhook → validate data → create CRM record → send welcome email → respond 200
```

### Pattern 2: Scheduled Report
```
Schedule (daily/weekly) → query database → format report → send to Slack/Email → log run
```

### Pattern 3: Event → Multi-Channel Notification
```
Webhook → parse event → IF condition → notify Slack + send email + create ticket → log
```

### Pattern 4: AI Processing Pipeline
```
Webhook → receive content → call Claude API → process response → store result → notify
```

### Pattern 5: Sync Between Systems
```
Schedule → pull from System A → compare with System B → update differences → log changes
```

---

## n8n Integration Patterns

When using n8n's MCP tools:
- `search_workflows` — find existing workflows before building new ones
- `get_workflow_details` — inspect current workflow structure
- `execute_workflow` — trigger a workflow with test data

---

## Rules
- **Present a node map for approval before generating JSON** — never build blind
- Every workflow must have error handling — no silent failures
- Test with edge cases: empty fields, invalid data, rate limit scenarios
- New workflows go to `owners-inbox/automations/[name]-[date].json` for operator import — never auto-deploy
- If the same workflow fails 3x: escalate with `BLOCKED: [workflow] failing — [root cause]`
- Document what each workflow does in the n8n workflow notes field
- Reuse existing patterns from `n8n-configs/` — don't build from scratch if a template exists
