# Skill: Funded Company Analyzer

**Trigger phrases:** "find the play on [company]", "reverse engineer [company]", "replicate [company]", "analyze [company] funding", "what's [company]'s data source", "build a clone of", "what AI company should I replicate", "find me a funded company to build"

**One-sentence goal:** Deconstruct any funded AI company into its data source + action layer, then produce a concrete JARVIS build plan to replicate it.

---

## The Core Mental Model

Every AI company = **Data source** + **LLM** + **Action tools**

The moat is almost never the LLM. It's the data source and the distribution. If you can tap the same data source via an MCP or API, you can ship their core product in hours — not months.

---

## Step-by-Step Process

### Phase 1 — Target Acquisition
If the user specifies a company: go directly to Phase 2.

If the user says "find me one":
1. Run `firecrawl_search` for: `"AI startup raised million 2025 OR 2026 site:techcrunch.com OR site:venturebeat.com`
2. Filter for companies with: recent funding ($5M–$200M range), B2B focus, obvious data-source dependency
3. Present 3 candidates with one-line descriptions, let user pick

### Phase 2 — Company Intel
Run these in parallel:
- `firecrawl_search`: "[company name] how it works product"
- `firecrawl_search`: "[company name] crunchbase funding"
- `firecrawl_scrape`: company's own website (homepage + /product or /how-it-works)

Extract:
- What problem they solve (one sentence)
- Who their customer is (ICP)
- What data they access or aggregate
- What actions the product takes on behalf of users
- Their pricing model if visible
- Headcount / team size signal (scrappy = replicable)

### Phase 3 — Data Source Identification
Classify their core data dependency into one of these categories:

| Data Type | Examples | Available MCP/API |
|-----------|----------|-------------------|
| People/contacts | LinkedIn profiles, job titles, emails | Apollo, Hunter.io, LinkedIn API |
| Company data | Firmographics, funding, headcount | Crunchbase, Clearbit, PredictLeads |
| Communications | Email threads, Slack, support tickets | Gmail MCP, Slack MCP |
| Documents | Contracts, reports, PDFs | Google Drive MCP, Notion MCP, PDF Tools MCP |
| Code/repos | GitHub activity, PRs, commits | GitHub API |
| Market/financial | Prices, news, filings | Yahoo Finance, FRED, SEC EDGAR |
| Web presence | Landing pages, SEO, content | Firecrawl |
| Location/physical | Properties, foot traffic, logistics | Google Maps API, OpenStreetMap |
| Health/clinical | Medical records, lab results | FHIR APIs, HL7 |
| Legal | Court filings, IP, trademarks | PACER, USPTO API |

### Phase 4 — Action Layer Mapping
Identify what the product *does* with the data (beyond showing it):

Common action patterns:
- **Outreach automation** → Gmail MCP + LinkedIn API
- **Content generation** → Claude (already have it)
- **Workflow triggers** → n8n execute_workflow
- **Alerting** → iMessages MCP, Slack MCP
- **CRM updates** → Notion MCP or HubSpot API
- **Report generation** → PDF Tools MCP + docx skill
- **Scheduling** → GCal MCP

### Phase 5 — Build Plan Output
Produce a structured build plan:

```
## [COMPANY NAME] — Reverse Engineered

### What they do
[One sentence]

### Their data source
[Name the data source and how they access it]

### Their action layer
[What the product does with the data]

### The replication stack
- Data: [MCP or API to tap same source]
- LLM: Claude (claude-sonnet-4-6)
- Actions: [List of JARVIS MCPs to use]
- Interface: [CLI / Slack / Web UI / Voice]

### Build sequence (estimated time)
1. [Step] — [~X min]
2. [Step] — [~X min]
...

### Total estimated build time: ~X hours

### What they have that you don't (be honest)
- [Distribution / brand / sales team / proprietary data]
- [These are the real moats — not the tech]

### Monetization angle
[How to sell it: productized service / SaaS / done-for-you / internal tool]

### Your play
[How this fits your situation — which skills or agents to run, what the sprint looks like, what the output is worth to you]
```

---

## Rules & Guardrails

1. **Never hallucinate funding amounts or product details.** If you can't find it via Firecrawl, say so and note what you couldn't verify.
2. **Always include "What they have that you don't."** Realism about real moats (sales, brand, data lock-in) is more valuable than hype.
3. **Flag regulatory risk** if the data source involves health, legal, or financial data — these have compliance implications.
4. **Prioritize JARVIS MCPs** already connected before suggesting new ones. The best build plan uses tools already in the stack.
5. **Output to owners-inbox** if the build plan is substantial (>3 steps). Filename: `[company-slug]-build-plan.md`

---

## Reference Files
- `skills/competitive-intel.md` — for deeper company research
- `skills/vibecode-app-builder.md` — if user wants to actually build it after analysis
- `skills/workflow-builder.md` — if the core deliverable is an n8n automation
- `team/roster.md` — builder agent handles implementation, analyst agent handles Phase 2-4

---

## Example Trigger → Output

**User:** "find the play on that AI recruiting company that raised $80M"

**JARVIS:** Runs Phases 2-5 on the company, identifies Apollo as the data source, Gmail + LinkedIn as the action layer, produces a build plan showing how to replicate with: Apollo API → Claude → Gmail MCP + n8n workflow, estimated 3-4 hours, notes their real moat is their sales team and ATS integrations, suggests operator could package this as a done-for-you recruiting automation service at $2-5K/month per client.
