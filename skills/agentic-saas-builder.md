# Agentic SaaS Builder's Handbook
*The definitive reference for building autonomous, agentic SaaS products that run from a MacBook*

**Version:** 1.0 — April 2026
**Stack:** Hermes Agent + Claude Managed Agents + Vercel + Stripe + domain-specific data APIs
**Purpose:** This document is the complete mental model, decision framework, and build playbook for rapidly shipping autonomous SaaS products with near-zero infrastructure overhead. Written for both human builders and AI agents executing build tasks.

---

## Part 1: The Mental Model

### What an Agentic SaaS Actually Is

An agentic SaaS is a product where the *fulfillment* of the service is handled by AI agents running autonomously — not by a human, not by a deterministic script, but by agents that reason, research, and produce outputs the way a skilled person would.

The customer pays. The agents do the work. You collect the margin.

The key difference from traditional SaaS: you are not building software that users operate. You are building a workforce that operates on behalf of users. The UI is almost incidental — it's just how work gets submitted and results get delivered.

### The Core Equation

```
Agentic SaaS = Data Layer + Agent Layer + Delivery Layer
```

- **Data Layer**: The APIs and sources your agents query (e.g., Shovels for permits, USPTO for patents, Firecrawl for web)
- **Agent Layer**: The AI workers that reason over that data and produce the output
- **Delivery Layer**: How the output reaches the customer (PDF email, Slack message, dashboard, webhook)

Your competitive moat is almost always the **Data Layer** combined with the **quality of your agent's analysis** — not the UI, not the AI model itself (which is a commodity).

### The Two-Layer Architecture

Every autonomous SaaS backend runs on two types of compute:

```
┌─────────────────────────────────────────────────────────────┐
│  LAYER 1: ALWAYS-ON (Hermes Agent)                          │
│  Purpose: Watch, listen, route, remember, alert             │
│  Cost: ~$5-10/month on a VPS or free on MacBook             │
│  Lives on: Local machine or $5 VPS                          │
│  Role: The nervous system — always awake                     │
└─────────────────────────────────────────────────────────────┘
                            ↓ triggers
┌─────────────────────────────────────────────────────────────┐
│  LAYER 2: BURST COMPUTE (Claude Managed Agents)             │
│  Purpose: Heavy reasoning, parallel research, report gen    │
│  Cost: $0.08/session-hour + token costs (~$1-3/task)        │
│  Lives on: Anthropic's managed infrastructure               │
│  Role: The skilled workforce — spun up on demand            │
└─────────────────────────────────────────────────────────────┘
```

**Hermes** is the always-on sentinel. It monitors email inboxes, Stripe webhooks, Slack channels, scheduled triggers, and incoming requests. It's lightweight, self-improving, and costs almost nothing to run continuously.

**Claude Managed Agents** is the heavy compute layer. When Hermes decides a task needs real work done — research, analysis, writing, data synthesis — it fires off a Claude Managed Agent session. That session runs for minutes, completes the work, and terminates. You only pay while it's running.

This combination gives you 24/7 availability at a fraction of the cost of traditional infrastructure.

### The Five Mental Models to Internalize

**1. Ship the verdict, not the data.**
Customers don't want raw permit records. They want to know: "Can I build an ADU on this property?" Give them a Green/Yellow/Red verdict with supporting evidence. The agent's job is to answer a decision question, not to display data.

**2. Know your COGS before your price.**
Every agentic product has a cost-per-fulfillment. Calculate it before you set your price. For a report-based service: API data costs + Claude token costs + delivery costs = your COGS. At $299/report with $3 COGS, your gross margin is 99%. At $29 with $3 COGS, it's 90%. Price accordingly.

**3. The trigger is the product.**
What kicks off the work? A Stripe payment? An email? A form submission? A schedule? The trigger design determines how autonomous the system is. The best triggers are zero-human — the system just watches for events and acts.

**4. Distribution beats product.**
A $299 report with 3 customers/week = $900/week. A $99 report with 30 customers/week = $2,970/week. Solve distribution first, then optimize the product. For real estate: BiggerPockets. For patents: r/patents + IP attorney LinkedIn groups. For support: cold email to e-commerce brands.

**5. Autonomy is a dial, not a switch.**
You don't need to go fully dark (zero human involvement) on day one. Start at Level 1, validate quality, then dial up autonomy as you gain confidence.

| Level | Name | Human role | When to use |
|-------|------|-----------|-------------|
| 1 | Supervised | Reviews every output before delivery | First 10 customers |
| 2 | Spot-check | Reviews 1 in 10, approves before delivery | After quality baseline |
| 3 | Dark factory | Agents run, deliver, and follow up autonomously | After trust is established |

---

## Part 2: The Stack

### Canonical Stack (MacBook-native, minimal infra)

| Layer | Tool | Purpose | Cost |
|-------|------|---------|------|
| Always-on agent | Hermes Agent (NousResearch) | Watches triggers, routes work, sends alerts | Free/local or $5/mo VPS |
| Burst compute | Claude Managed Agents | Multi-agent research, analysis, writing | $0.08/session-hr + tokens |
| Webhooks/API | Vercel (serverless functions) | Receives Stripe webhooks, exposes endpoints | Free tier |
| Payment | Stripe | Checkout, webhooks on payment success | 2.9% + 30¢ |
| Transactional email | Resend or Postmark | Deliver PDFs, receipts, follow-ups | Free tier / $20/mo |
| Data: permits | Shovels.ai API | 1,800+ jurisdictions, 85% US population | Free trial → paid |
| Data: web | Firecrawl | Scrape any URL, search the web | Free tier |
| Data: patents | USPTO API + Google Patents | Public, free | Free |
| Version control | GitHub | Code, agent definitions, config | Free |
| Deploy | Vercel | One-push deploys, preview URLs | Free tier |

### Hermes Setup (MacBook)

```bash
# Install Hermes Agent locally
npx hermes-agent install

# Or run via Docker (recommended for always-on)
docker run -d \
  --name hermes \
  -e ANTHROPIC_API_KEY=your_key \
  -e TELEGRAM_BOT_TOKEN=your_token \
  -v hermes_data:/app/data \
  nousresearch/hermes-agent:latest

# Configure platform gateway (choose your alert channel)
hermes gateway add telegram  # recommended for mobile alerts
hermes gateway add slack     # for team notifications
```

Hermes stores all memory in FTS5 SQLite — zero external dependencies. It self-improves its skills across sessions.

### Claude Managed Agents Setup

```javascript
// Install SDK
npm install @anthropic-ai/claude-agent-sdk

// Fire a managed agent session
import { AgentSDK } from '@anthropic-ai/claude-agent-sdk';

const agent = new AgentSDK({ apiKey: process.env.ANTHROPIC_API_KEY });

const session = await agent.sessions.create({
  agentDefinition: {
    model: 'claude-sonnet-4-6',
    systemPrompt: `You are a permit research analyst. Given a property address, 
    research the permit history via the Shovels API and produce a structured JSON 
    summary of: permit count, red flags, most recent work, unpermitted signals.`,
    tools: ['bash', 'web_fetch', 'web_search'],
  },
  input: `Research this property: ${address}`,
  header: { 'managed-agents-2026-04-01': 'true' }
});

// Stream results
for await (const event of session.stream()) {
  if (event.type === 'session.complete') {
    return event.output;
  }
}
```

### Multi-Agent Pattern (Coordinator + Workers)

```javascript
// Coordinator agent definition
const coordinatorDef = {
  model: 'claude-opus-4-6',
  systemPrompt: `You are the report coordinator. You receive a property address 
  and orchestrate 4 specialist agents to research it in parallel. Synthesize 
  their outputs into a final investor-grade site intelligence report.`,
  subagents: [
    { name: 'permit-researcher', ... },
    { name: 'zoning-analyst', ... },
    { name: 'adu-specialist', ... },
    { name: 'market-analyst', ... }
  ]
};

// Each worker runs in its own isolated thread, in parallel
// Coordinator waits for all 4, then synthesizes
// Total time: max(individual agent times) not sum
```

---

## Part 3: The Universal Pipeline

Every agentic SaaS product maps to this pipeline. Learn this pattern — it applies to every idea.

```
TRIGGER → VALIDATE → ROUTE → EXECUTE → QA → DELIVER → FOLLOW-UP
```

### Stage 1: Trigger
What kicks off the work?
- **Payment trigger**: Stripe `payment_intent.succeeded` webhook → Vercel function → fires agent
- **Form trigger**: Customer submits address on landing page → Vercel function → fires agent
- **Email trigger**: Hermes watches inbox for orders → routes to agent
- **Schedule trigger**: Hermes cron job → fires agent on a schedule (e.g., daily monitoring)
- **API trigger**: Another system calls your endpoint → fires agent

**Rule**: The trigger should be zero-latency. Don't queue — fire immediately on trigger.

### Stage 2: Validate
Before burning compute, validate the input:
- Is the address parseable and geocodable?
- Is it in a supported coverage area?
- Has this address been run before (cache check)?
- Is the payment confirmed (idempotency check)?

**Rule**: Validation is cheap. Do it synchronously before spinning up agents.

### Stage 3: Route
Decide which agent configuration to use based on the input:
- Austin address → use Austin-optimized config (richest data)
- California address → trigger ADU-specific worker
- NYC address → use NYC DOB API worker
- Unknown jurisdiction → fallback to Shovels + web scrape path

**Rule**: Routing is a small, fast decision. Hermes can handle this with a simple skill.

### Stage 4: Execute
This is where Claude Managed Agents runs. For a multi-research task:

```
Coordinator receives: { address, customerEmail, reportType }
        ↓ spawns in parallel
┌─────────────┬──────────────┬─────────────┬──────────────┐
│ Permit      │ Zoning       │ ADU/STR     │ Market       │
│ Worker      │ Worker       │ Worker      │ Worker       │
│             │              │             │              │
│ Shovels API │ Municode +   │ City regs + │ Comparable   │
│ + normalize │ City GIS     │ setback     │ sales +      │
│ + flag      │ + parse      │ analysis    │ rental data  │
└─────────────┴──────────────┴─────────────┴──────────────┘
        ↓ coordinator synthesizes
Final report: JSON structured data + narrative analysis
```

**Rule**: Parallelize everything that can be parallelized. Sequential = slow.

### Stage 5: QA
At Level 1-2 autonomy, insert a human review step:
- Coordinator writes output to `owners-inbox/` or sends to Telegram via Hermes
- Human reviews and approves (or flags for revision)
- At Level 3, this step is skipped

**Rule**: Build QA in from day one. Remove it only when you trust the output quality.

### Stage 6: Deliver
How does the output reach the customer?
- **PDF email**: Generate PDF inside agent sandbox → Resend/Postmark delivery
- **Dashboard**: Write JSON output to database → customer views in web app
- **Slack/Telegram**: Hermes sends a message to the customer's connected channel
- **Webhook**: POST results to customer's own endpoint (B2B integration)

**Rule**: Match delivery method to customer context. Individual investors want email PDFs. Enterprise clients want webhooks.

### Stage 7: Follow-up
This is where most builders leave money on the table. Automate it with Hermes:
- Day 0: Report delivered — confirmation email
- Day 3: Testimonial request (if no reply)
- Day 7: "Run another report?" upsell
- Day 14: "Share with a friend" referral ask

**Rule**: Hermes handles follow-up on autopilot. Define the sequence once, it runs forever.

---

## Part 4: Decision Framework

### Which tool for which job?

| Task | Use | Why |
|------|-----|-----|
| Watch for new emails | Hermes | Always-on, lightweight |
| Listen to Stripe webhooks | Vercel function | Serverless, instant |
| Route an incoming order | Hermes skill | Fast, cheap decision |
| Deep research (30+ min task) | Claude Managed Agents | Heavy compute, parallel |
| Generate a PDF | Claude Managed Agents (bash tool) | Inside the sandbox |
| Send an email | Resend via Hermes or agent | Direct API |
| Schedule a follow-up | Hermes cron | Always-on |
| Alert you on mobile | Hermes → Telegram | Zero latency |
| Scrape a webpage | Firecrawl (via agent) | Best-in-class |
| Store structured data | Hermes SQLite or Vercel KV | Zero infra |

### Which model for which agent?

| Agent Role | Model | Reason |
|-----------|-------|--------|
| Coordinator / synthesizer | claude-opus-4-6 | Highest reasoning for synthesis |
| Research workers | claude-sonnet-4-6 | Fast, capable, cost-efficient |
| Classification / routing | claude-haiku-4-5 | Near-instant, very cheap |
| Hermes gateway (local) | Any LLM via Hermes config | Use Claude via API or local model |

### Build vs Buy decision tree

```
Does a data API exist for what you need?
  YES → Use it (Shovels, USPTO, Firecrawl, etc.)
  NO  → Can you scrape it reliably?
          YES → Firecrawl + cache aggressively
          NO  → Reconsider the product idea

Is the agent task <5 minutes and simple?
  YES → Single Claude Managed Agent, no subagents
  NO  → Multi-agent with coordinator pattern

Does the task need to run 24/7?
  YES → Hermes daemon on VPS
  NO  → Serverless (Vercel function) + Claude on demand

Is the customer B2C (individuals)?
  YES → Email delivery, simple web form, Stripe checkout
  NO  → Webhook API, usage-based pricing, Slack integration
```

---

## Part 5: MacBook-Native Deployment

Everything needed to run an agentic SaaS from your MacBook — no cloud required for development, minimal cloud for production.

### Local Development Stack

```bash
# 1. Clone your repo
git clone https://github.com/yourusername/your-saas

# 2. Install dependencies
npm install

# 3. Start Hermes locally (always-on worker)
hermes start --config ./hermes.config.json

# 4. Start Vercel dev server (webhook receiver)
vercel dev

# 5. Stripe webhook forwarding to local
stripe listen --forward-to localhost:3000/api/webhooks/stripe

# 6. Set environment variables
cp .env.example .env.local
# Fill in: ANTHROPIC_API_KEY, STRIPE_SECRET_KEY, SHOVELS_API_KEY, RESEND_API_KEY
```

Your MacBook is now running the full stack. Stripe fires webhooks → Vercel receives them → Hermes routes → Claude Managed Agents executes → Resend delivers.

### Production Deployment (30 minutes)

```bash
# Vercel (webhook receiver + landing page)
vercel deploy --prod
# Done. Vercel handles scaling automatically.

# Hermes (always-on daemon)
# Option A: Keep running on MacBook (fine for early stage)
hermes start --daemon

# Option B: $5/month VPS (DigitalOcean, Hetzner, Hostinger)
# SSH into VPS, then:
docker run -d --restart=always \
  --name hermes-prod \
  -e ANTHROPIC_API_KEY=$ANTHROPIC_API_KEY \
  -e TELEGRAM_BOT_TOKEN=$TELEGRAM_BOT_TOKEN \
  nousresearch/hermes-agent:latest

# Claude Managed Agents: No deployment needed — Anthropic runs it
# Shovels: No deployment needed — it's an API
# Resend: No deployment needed — it's an API
# Stripe: No deployment needed — it's an API
```

Total production infra: 1 Vercel deployment + 1 Hermes container. Everything else is API calls.

---

## Part 6: Agent Definition Templates

### Template: Research Worker Agent

```javascript
const researchWorkerDef = {
  name: 'permit-researcher',
  model: 'claude-sonnet-4-6',
  systemPrompt: `You are a permit research specialist. Your ONLY job is to:
1. Query the Shovels API for permit history at the given address
2. Normalize the data into the standard schema below
3. Flag any red flags (permits pulled without inspection sign-off, open violations, structural work >$50k with no final inspection)
4. Return structured JSON — nothing else

Output schema:
{
  "address": string,
  "jurisdiction": string,
  "coverage": "full" | "partial" | "none",
  "permitCount": number,
  "dateRange": { "earliest": date, "latest": date },
  "permitTypes": string[],
  "redFlags": { "flag": string, "severity": "high|medium|low", "detail": string }[],
  "unpermittedSignals": string[],
  "rawPermits": permit[]
}

If coverage is "none" (jurisdiction not in Shovels), return coverage: "none" and explain why.`,
  tools: ['bash', 'web_fetch'],
  maxTokens: 4096,
};
```

### Template: Coordinator Agent

```javascript
const coordinatorDef = {
  name: 'report-coordinator',
  model: 'claude-opus-4-6',
  systemPrompt: `You are the coordinator for a real estate site intelligence report.
  
You receive a property address and orchestrate specialist researchers to analyze it.
When all research is complete, you synthesize it into a final investor-grade report.

Your synthesis must answer three questions the investor actually cares about:
1. DEAL OR NO DEAL? (Red/Yellow/Green verdict with confidence level)
2. WHAT'S THE UPSIDE? (Best development scenarios with rough cost/ROI estimates)
3. WHAT COULD KILL IT? (Risk flags in order of severity)

Write like a senior real estate advisor briefing a client — direct, specific, no hedging.
Never say "it depends" without immediately saying what it depends on and the range of outcomes.`,
  subagents: ['permit-researcher', 'zoning-analyst', 'adu-specialist', 'market-analyst'],
};
```

### Template: Hermes Routing Skill

```markdown
# skill: route-permit-order
trigger: stripe.payment_intent.succeeded for permit-report product
goal: Route new order to Claude Managed Agents coordinator

steps:
1. Extract address and customer email from Stripe metadata
2. Validate address is parseable (geocode check)
3. Check coverage: is address in Shovels-covered jurisdiction?
4. If covered: fire Claude Managed Agents coordinator session
5. If not covered: send customer a coverage notice email, queue for manual review
6. Log order to SQLite: timestamp, address, session_id, status
7. Send yourself a Telegram alert: "New order: [address] — session [id] started"

rules:
- Never fire agent if address fails geocode
- Always log before firing agent (idempotency)
- If agent session fails, retry once after 60 seconds
- After retry failure, alert human via Telegram immediately
```

---

## Part 7: COGS Calculator

Before pricing any agentic product, calculate cost per fulfillment:

```
COGS per Report = 
  Data API cost per query
  + Claude Managed Agents: (session duration in hours × $0.08) + token costs
  + Delivery cost (email)
  + Hermes overhead (amortized, ~$0.001/task)
  + Stripe fee (2.9% + $0.30)

Example — Municipal Permit Report Service:
  Permit data API: ~$0.50/address (estimate, verify with current pricing)
  Claude Managed Agents: 8 min session = 0.13 hrs × $0.08 = $0.01 + tokens (~$1.50)
  Resend email: $0.001
  Stripe on $299: $8.97
  ───────────────────────────────
  Total COGS: ~$11 per report
  Gross margin on $299: ~96%

At 10 reports/week: $2,880 revenue, ~$110 COGS = $2,770 gross profit/week
```

---

## Part 8: Worked Example — Municipal Permit Report Service

### Full Flow

```
1. Customer lands on your-service.com (Vercel static page)
2. Enters address + email → clicks "Order Report — $299"
3. Stripe Checkout opens → customer pays
4. Stripe fires payment_intent.succeeded webhook
5. Vercel function receives webhook:
   → validates Stripe signature
   → extracts address, email, payment_id
   → calls Hermes routing skill via API
6. Hermes skill validates address, checks coverage
7. Hermes fires Claude Managed Agents coordinator session:
   → passes: { address, email, payment_id }
   → sets timeout: 15 minutes max
8. Coordinator spawns 4 workers in parallel:
   → permit-researcher: hits Shovels API
   → zoning-analyst: scrapes city zoning portal
   → adu-specialist: checks ADU eligibility rules
   → market-analyst: pulls comparable rentals/sales
9. All 4 return JSON to coordinator (avg ~6 minutes)
10. Coordinator synthesizes → writes full report as markdown
11. Agent uses bash tool to generate PDF from markdown
12. Agent calls Resend API to email PDF to customer
13. Agent writes completion record to Hermes SQLite
14. Hermes sends Telegram: "✅ Report delivered: 123 Main St, Austin TX"
15. Hermes schedules Day 3 follow-up: testimonial request
    Hermes schedules Day 7 follow-up: upsell second report
```

### File Structure

```
permit-report/
├── vercel/
│   ├── api/
│   │   ├── webhooks/
│   │   │   └── stripe.js        ← receives payment webhook
│   │   └── report-status.js     ← optional status endpoint
│   └── index.html               ← landing page
├── agents/
│   ├── coordinator.js           ← coordinator agent definition
│   ├── workers/
│   │   ├── permit-researcher.js
│   │   ├── zoning-analyst.js
│   │   ├── adu-specialist.js
│   │   └── market-analyst.js
│   └── prompts/
│       └── report-template.md   ← the report structure Claude writes to
├── hermes/
│   ├── hermes.config.json       ← Hermes setup
│   └── skills/
│       ├── route-permit-order.md
│       ├── follow-up-sequence.md
│       └── coverage-check.md
├── .env.example
└── package.json
```

---

## Part 9: Rapid Idea Validation Framework

Before building, validate in 48 hours using this checklist:

**Data layer check (2 hours)**
- [ ] Does a public/paid API exist for the core data?
- [ ] What's the coverage (% of target market covered)?
- [ ] What's the cost per query?
- [ ] Are there data quality issues that would embarrass you?

**Market check (2 hours)**
- [ ] Is there a community where buyers congregate? (Reddit, BiggerPockets, Slack, LinkedIn group)
- [ ] Search that community for the problem. How often does it come up?
- [ ] What do people currently do instead? How painful is that?
- [ ] Are there direct competitors? At what price?

**COGS check (1 hour)**
- [ ] Calculate cost per fulfillment (see Part 7)
- [ ] At your target price, is gross margin > 80%?
- [ ] What's the minimum order volume to cover your fixed costs?

**Trigger check (1 hour)**
- [ ] What is the exact trigger that kicks off an order?
- [ ] Can it be fully automated (no human needed to fire it)?
- [ ] Is there a natural "buying moment" (right before a deal closes, right before a patent filing, etc.)?

**Go/No-go rule**: If you can check all four boxes in 48 hours, build it. If data coverage is under 60%, find a better data source or narrow the geography.

---

## Appendix: Key Tools Reference

| Tool | Docs | Use case |
|------|------|---------|
| Claude Managed Agents | platform.claude.com/docs/en/managed-agents | Multi-agent burst compute |
| Hermes Agent | github.com/NousResearch/hermes-agent | Always-on daemon, memory, routing |
| Shovels.ai | shovels.ai/api | US permit data, 1,800+ jurisdictions |
| Firecrawl | firecrawl.dev | Web scraping, search, extraction |
| Stripe | stripe.com/docs/webhooks | Payment + webhook trigger |
| Resend | resend.com | Transactional email delivery |
| Vercel | vercel.com/docs | Serverless functions + hosting |
| USPTO API | developer.uspto.gov | Patent/prior art data (free) |
| Google Patents | patents.google.com | Patent search (free) |

---

*This handbook is a living document. Update it when:*
- *A new data API proves more reliable than an existing one*
- *A better model is released that changes the cost/quality tradeoff*
- *A new product pattern is validated with a paying customer*
- *A failure mode is discovered that should be documented*
