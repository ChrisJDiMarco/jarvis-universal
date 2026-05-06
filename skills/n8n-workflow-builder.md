# Skill: n8n Workflow Builder

## Trigger
"build a workflow", "automate [X] in n8n", "new n8n workflow", "set up automation for", "wire up [X] to [Y]", "create a workflow that"

## Goal
Design and deploy reusable n8n automations using proven patterns — no reinventing from scratch each time.

## Core Workflow Pattern Specs

These are canonical starter specs. If the referenced JSON file does not exist yet, generate it from the pattern, save it at the listed path, and document it in `n8n-configs/README.md` before deployment.

### Pattern 1: Lead Intake → GHL → Sequence Trigger
**Use for**: Any new web lead that needs to enter follow-up

```
Trigger: Webhook (form submission)
→ Set: Normalize field names (name, email, phone, source, vertical)
→ GHL: Create/Update Contact
→ GHL: Add Tags ([vertical], [source], lead-new)
→ GHL: Enroll in Sequence (based on source tag)
→ Slack/iMessage: Notify Chris if lead score ≥ 8
```

Config file to create/update: `n8n-configs/lead-intake.json`

### Pattern 2: Retell Call Complete → GHL Update
**Use for**: After AI voice call, log outcome and trigger next step

```
Trigger: Retell Webhook (call_ended)
→ Set: Extract call outcome (booked / not interested / callback / voicemail)
→ HTTP: Pull transcript from Retell API
→ Claude (Haiku): Summarize transcript → extract: sentiment, outcome, next action
→ GHL: Update Contact notes with summary
→ GHL: Update Pipeline Stage (based on outcome)
→ If outcome = booked: GHL trigger confirmation sequence
→ If outcome = callback: Set GHL task for follow-up
```

Config file to create/update: `n8n-configs/retell-bridge.json`

### Pattern 3: No-Show Recovery
**Use for**: When a booked appointment is missed

```
Trigger: GHL Webhook (appointment_no_show tag added)
→ Wait: 30 minutes
→ GHL: Send SMS ("Hey [Name], looks like we missed you — want to reschedule?")
→ Wait: 24 hours (if no response)
→ GHL: Send email with booking link
→ Wait: 48 hours (if no response)
→ GHL: Add tag (no-show-cold) and remove from active sequences
```

Config file to create/update: `n8n-configs/no-show-recovery.json`

### Pattern 4: Reddit Scout → Prospect Intake
**Use for**: Converting Reddit scout output to scored leads in GHL

```
Trigger: Schedule (daily 7am) or Manual
→ Apify: Run scraper for target subreddits/keywords
→ Loop: For each result
   → Filter: Min upvotes, post recency
   → Claude (Haiku): Extract business info, score fit (0-10)
   → If score ≥ 6: GHL create contact + tag (reddit-lead, [vertical])
→ Airtable/Notion: Log all results with scores
→ iMessage: Daily summary to Chris ("Found X leads, Y hot")
```

Config file to create/update: `n8n-configs/reddit-scout.json`

### Pattern 5: AI Intelligence Daily Brief
**Use for**: Morning AI landscape sweep

```
Trigger: Schedule (8:09am daily)
→ HTTP: Pull RSS/search results (AI news sources)
→ Claude (Sonnet): Filter relevance, summarize for agency context
→ Write: Save to memory/ai-intelligence.md (append, cap at 2000 chars)
→ Write: Append to owners-inbox/morning-brief-[date].md
```

Config file to create/update: `n8n-configs/ai-intelligence.json`

## Build Process

### Step 1: Define the Automation
Answer these before building:
1. **Trigger**: What starts this workflow? (webhook, schedule, manual, GHL event, Retell event)
2. **Data in**: What information arrives at the trigger?
3. **Core logic**: What decisions or transformations happen?
4. **Integrations**: Which tools need to read/write? (GHL, Retell, Claude, Apify, iMessage, Notion)
5. **Output**: What does success look like? What gets created/updated/sent?
6. **Error path**: What happens if a step fails?

### Step 2: Select Pattern
Match to an existing pattern if possible. Customizing a template = 80% faster than building from scratch.

If no match: build from scratch and document as a new pattern.

### Step 3: Build in n8n

Node naming convention:
- `[Action] [Target]` → e.g., `Create GHL Contact`, `Send SMS`, `Extract Lead Fields`
- Use sticky notes on every branch explaining decision logic
- Set `Continue On Fail = true` on non-critical nodes (notifications, logging)
- Always add an Error Handler node connected to iMessage notification

n8n credential IDs (reference these, don't recreate):
- GHL: `ghl-api-key`
- Retell: `retell-webhook-secret`
- Claude API: `anthropic-api-key`
- Apify: `apify-api-token`

### Step 4: Self-Healing Test + Deploy

**Invoke the `self-healing-executor` skill** instead of manual testing:

1. Pass the workflow JSON + a test payload to self-healing-executor
2. The executor will: validate structure → test execute → diagnose failures → auto-repair → retry (up to 5 iterations)
3. If all tests pass: executor handles deployment
4. If max iterations reached: executor saves diagnosis report and alerts Chris

**Fallback** (if self-healing executor is not available): Use manual test protocol:
1. Run with sample payload (never test on live GHL contacts)
2. Verify each node's output before proceeding to next
3. Test error path (force a failure, confirm error handler fires)
4. Run 3 times with different inputs before marking complete

### Step 5: Deploy + Document

1. Activate workflow in n8n
2. Save final JSON to `n8n-configs/[workflow-name].json`
3. Update `n8n-configs/README.md` with: workflow name, trigger, purpose, dependencies
4. Notify Chris: "Workflow [name] is live. Trigger: [X]. Monitors: [Y]."

## Claude Integration in Workflows

When using Claude inside n8n:
- Default to Haiku for: classification, extraction, summarization, scoring
- Use Sonnet for: writing copy, complex reasoning, multi-step analysis
- Always set max_tokens (Haiku: 512, Sonnet: 2048 for summaries)
- System prompt pattern: short + role + output format specification

Example Haiku node system prompt:
```
You are a lead classifier. Extract from the text: name, business, vertical, sentiment (positive/neutral/negative), and recommended next action (follow-up-call, send-proposal, add-to-drip, skip). Return JSON only.
```

## Rules
- Never hardcode API keys — always use n8n credentials manager
- Every workflow must have an error notification path
- Test before activating — no exceptions
- Document every deployed workflow in `n8n-configs/README.md`
- Reuse patterns rather than rebuilding — DRY principle
- If a workflow runs >5 nodes with Claude: use Haiku not Sonnet (cost control)
