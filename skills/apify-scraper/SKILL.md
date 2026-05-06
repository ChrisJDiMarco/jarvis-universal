---
name: apify-scraper
description: Lead generation and web scraping using Apify and Vibe Prospecting via Cowork connectors. ALWAYS use this skill when asked to scrape data, find leads, build prospect lists, find company information, get CEO emails, pull LinkedIn profiles, find businesses without websites, research social activity, or do any B2B prospecting. Trigger phrases: "find me X companies in Y", "scrape", "prospect", "build a lead list", "find the CEO", "get emails for", "find businesses without websites", "Apify", "Vibe Prospecting", "B2B list".
---

# Apify + Vibe Prospecting — Lead Gen Skill

This skill orchestrates two Cowork connectors to scrape any data from the internet and build highly enriched prospect lists with minimal cost.

---

## The Two Tools

### Apify
**What it is**: The world's largest scraper directory. Thousands of pre-built "actors" (scrapers) that cover virtually every website and data source.

**Key advantage**: One API key = access to all actors. JARVIS picks the best actor automatically based on the task — no manual actor selection needed. Actors are ranked by community reviews and performance.

**Cost**: Fractions of a penny per record. $5/month free tier covers substantial volume.

**Setup (one-time)**:
1. Go to `apify.com` → Console → Settings → API & Integration
2. Generate a new API token (set expiration as needed)
3. In Claude Cowork → Customize → Connectors → Add Apify → Paste token

### Vibe Prospecting
**What it is**: A B2B contact database built specifically for Claude/Cowork. Designed Claude-first.

**Key advantage**: Instant access to a massive database of company and contact information without needing to scrape — just query. 400 free credits to start.

**Setup (one-time)**:
1. Sign up at vibeprospecting.com
2. In Claude Cowork → Customize → Connectors → Add Vibe Prospecting → Connect

---

## When to Use Which Tool

| Use Case | Best Tool |
|----------|-----------|
| Local businesses (Google Maps data) | Apify (Google Maps Scraper actor) |
| LinkedIn profiles + contact info | Apify (LinkedIn actor) |
| Social media activity | Apify (Twitter/LinkedIn/Instagram actor) |
| Trip Advisor, Amazon, Yelp reviews | Apify (platform-specific actors) |
| B2B company database queries | Vibe Prospecting |
| VC-backed companies, funded startups | Vibe Prospecting |
| Company firmographics (size, industry) | Vibe Prospecting |
| CEO/exec names + emails | Either (Vibe for known companies, Apify for scraping) |
| Businesses without websites | Apify (Google Maps actor → filter for no website) |

**When in doubt**: Try Vibe Prospecting first for company/contact data. Fall back to Apify for anything site-specific.

---

## Core Workflows

### Workflow 1: Local Business Lead List

**Goal**: Find local businesses in a vertical, pull contact info, filter by criteria.

**Prompt pattern**:
```
Use Apify. Find me [N] [vertical] companies in [City, State].
For each: business name, address, phone number, website, email if available.
Return as a table.
```

**Example**:
```
Use Apify. Find me 20 HVAC companies in Atlanta, Georgia.
For each: company name, address, phone, website, email.
Return as a table.
```

**Power variant — companies without websites** (agency prospecting gold mine):
```
Use Apify. Find me 15 [vertical] companies in [City] that are on Google Maps
but do NOT have a website listed. Just phone/email contact.
Return: company name, phone, email, Google Maps URL.
```

---

### Workflow 2: Enriched Prospect List (Multi-Step)

**Goal**: Start with companies, drill down to decision-maker contacts and social activity.

**Step 1 — Find companies**:
```
Use Apify. Find me 15 [vertical] companies in [location].
Get: company name, website, phone, email.
```

**Step 2 — Find decision makers** (run immediately after Step 1):
```
Great. Now for each of those companies, find me the CEO or owner name
and their email address or LinkedIn profile.
```

**Step 3 — Social enrichment** (optional, for hyper-personalized outreach):
```
For each of those LinkedIn profiles, find any recent social activity
(posts, comments, likes) from the last 30 days that I could reference
in cold outreach to make it personal.
```

**Run all at once** (most efficient):
```
Use Apify. Find me 15 consulting firms in New York City.
For each firm:
- Company name, website, address, phone
- CEO or founder name and email
- Their LinkedIn profile URL
- Any recent LinkedIn posts (last 2 weeks)
Return everything in a table.
```

---

### Workflow 3: B2B Database Query (Vibe Prospecting)

**Goal**: Pull from a curated database — faster than scraping, better for firmographic filters.

**Prompt pattern**:
```
Use Vibe Prospecting. Find me [N] [description] companies.
Filter by: [industry], [location], [company size], [funding status].
Include: company name, CEO name, CEO email, LinkedIn, website.
```

**High-value examples**:

VC-backed SaaS (great for agency pitches):
```
Use Vibe Prospecting. Find me 20 venture-backed SaaS companies
that have raised a Series A or B in the last 12 months.
Include: company name, CEO, email, LinkedIn, total funding.
```

SMB targets for automation agency:
```
Use Vibe Prospecting. Find me 25 service businesses
(HVAC, roofing, plumbing, landscaping) with 10-50 employees
in the Philadelphia area.
Include: owner name, email, phone, company size.
```

---

### Workflow 4: Scheduled Lead Generation

Run these on autopilot — Cowork executes them on schedule as long as the desktop app is running.

**Setup prompt**:
```
Create a scheduled task that runs every [Monday/day] at [9am]:
Use Apify to find 20 new [vertical] companies in [location]
that don't have websites. Save results to a CSV in my workspace folder
named "leads-[date].csv". iMessage me when done with the count.
```

**What this enables**: Passive, daily lead list building. Each run finds new businesses. Over time, builds a substantial prospect database automatically.

---

### Workflow 5: Competitor / Market Research

```
Use Apify. Scrape the top [10/20] results for "[search query]" on Google.
For each result: URL, page title, meta description, domain.
```

```
Use Apify. Find all companies listed on [G2/Capterra/ProductHunt]
in the [category] category. For each: company name, website, pricing page URL,
number of reviews, average rating.
```

---

## Output Formats

Always specify your preferred output. Options:

- **Table** — best for viewing in Cowork, easy to scan
- **CSV file** — best for import to GHL, n8n, spreadsheets
- **JSON** — best for piping into n8n workflows
- **Markdown list** — best for quick reference

Add to any prompt: `Return as a [table/CSV file/JSON/markdown list].`
For CSV: `Save as a CSV file to my workspace folder named [filename].csv`

---

## GHL Integration (Agency Pipeline)

After scraping, push directly to GHL:

```
[After getting lead list]
Now create contacts in GHL for each of these leads.
Use the cold-outreach sequence for [vertical].
Tag each contact as "apify-[date]".
```

Or batch via n8n:
```
Export these leads as CSV, then trigger the n8n workflow
"GHL Contact Import" with this CSV.
```

---

## Cost Reference

| Operation | Apify Cost | Vibe Prospecting Cost |
|-----------|------------|----------------------|
| 15 local businesses (basic) | ~$0.05 | — |
| 15 businesses + CEO emails | ~$0.25 | — |
| 15 companies + LinkedIn + social | ~$0.50–$1.00 | — |
| 15 B2B contacts (database lookup) | — | ~63 credits |
| 400 Vibe credits ≈ | — | ~6–7 batches of 15 |

Free tiers: Apify gives $5/month. Vibe Prospecting gives 400 credits to start.

---

## Prompt Templates (Copy-Paste Ready)

**Quick local leads**:
```
Use Apify. Find 20 [VERTICAL] companies in [CITY], [STATE].
Include: name, address, phone, website, email. Table format.
```

**No-website businesses** (agency cold outreach):
```
Use Apify. Find 15 [VERTICAL] in [CITY] on Google Maps with
no website — just phone/email. Table: name, phone, email, Maps URL.
```

**Full enriched B2B list**:
```
Use Apify + Vibe Prospecting. Find 15 [VERTICAL] companies in [LOCATION].
For each: company name, website, CEO name, CEO email, LinkedIn URL,
any recent social posts. Save as CSV named "leads-[vertical]-[date].csv".
iMessage me when complete.
```

**VC-backed pipeline**:
```
Use Vibe Prospecting. 20 VC-backed SaaS companies, Series A/B,
raised in last 6 months. CEO name + email + LinkedIn. Table.
```

**Scheduled daily finds**:
```
Schedule daily at 9am: Use Apify, find 10 new [VERTICAL] in [CITY]
without websites. Append to CSV "daily-leads.csv" in workspace.
iMessage count when done.
```

---

## Rules and Guardrails

1. **Verify before bulk runs.** Test with 5–10 records first to confirm actor selection and data quality before scaling to 100+.
2. **Always tag GHL contacts** with source and date (e.g., `apify-hvac-2026-03-25`).
3. **Respect rate limits.** Apify handles this, but avoid >500 records per run for debut workflows.
4. **GDPR/CAN-SPAM awareness.** Data scraped from public sources is generally fine; cold email requires opt-out mechanism.
5. **Deduplicate before GHL push.** Ask JARVIS to check existing contacts before creating new ones.
