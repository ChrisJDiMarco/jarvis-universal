# Skill: Discovery Audit

## Trigger
"run an audit", "audit call", "discovery for [client]", "paid audit", "pre-sales audit", "do an audit for"

## Goal
Deliver a paid discovery audit ($500–$2K) that qualifies the prospect, surfaces their exact gaps, and naturally leads to a deployment proposal. Filters tire-kickers and generates revenue before any build work begins.

## What It Is
A structured analysis of a local business's current lead capture and follow-up system. Delivered as a 2–3 page report. The operator presents findings on a 30-min call. The audit fee applies toward deployment if they move forward.

## Phase 1: Intake

Collect from the client (intake form or call):
1. Business name, website, vertical
2. Primary lead sources (Google Ads, organic, referrals, walk-ins)
3. Current follow-up process ("what happens after someone fills out your form?")
4. Estimated monthly lead volume
5. Average job/appointment value
6. What CRM or booking tool they use (if any)
7. Biggest frustration with their current setup

Save intake to: `data/audits/[client-slug]-intake.md`

## Phase 2: Audit Checklist

Run each check and record: PASS / FAIL / PARTIAL + notes

### Lead Capture
- [ ] Form on homepage with confirmation email/SMS
- [ ] Call tracking number in place
- [ ] Google Business profile claimed + optimized
- [ ] Chat widget (live or bot)
- [ ] After-hours messaging / auto-response

### Speed to Lead
- [ ] Response time to web form (test submit → time first contact)
- [ ] Response time after business hours
- [ ] SMS follow-up in place
- [ ] Response within 5 minutes (industry benchmark)

### Follow-Up System
- [ ] Multi-touch sequence (email + SMS) after first contact
- [ ] No-show recovery process
- [ ] Unresponsive lead re-engagement
- [ ] Sequence length (minimum: 7 touches over 5 days)

### Booking & Conversion
- [ ] Online booking available
- [ ] Appointment confirmation sent
- [ ] Appointment reminder sequence (24h + 1h before)
- [ ] Post-appointment review request

### Scoring
- 0-4 checks passing: Critical gaps — high urgency pitch
- 5-8 checks passing: Moderate gaps — solid ROI case
- 9-12 checks passing: Optimized — pitch advanced features (voice agent, AI chat)
- 13+ passing: Already optimized — may not be a fit

## Phase 2.5: Industry Intelligence Layer (AutoResearchClaw-inspired)

**Purpose**: Back every audit claim with real industry data — not LLM opinions. This is what separates a $500 audit from a $2K audit.

### Step 1: Vertical Research (via researcher-deep pipeline, SURVEY depth)
Run a scoped research pass on the prospect's vertical:
- Search queries: `[vertical] lead response time benchmark`, `[vertical] customer acquisition cost 2025`, `[vertical] average conversion rate`, `[vertical] AI automation case study`
- Collect 8-12 sources via Firecrawl
- Extract: industry benchmarks, competitor stats, market size, growth trends

### Step 2: Competitor Snapshot (via competitor-intelligence-harness, fast mode)
- Identify 2-3 direct competitors in the prospect's local market
- Scrape their websites: forms, chat widgets, booking links, response time (test submit if possible)
- Score each competitor against the same audit checklist
- Outcome: "Your competitor [X] responds in [Y] minutes. You respond in [Z] minutes."

### Step 3: Benchmark Injection
Inject verified industry data into the audit:
- Check `data/verified-registry.json` for pre-verified benchmarks
- Any new benchmark found → add to registry with source URL
- Use in Phase 3 revenue model: replace generic "20-30% for slow responders" with actual vertical-specific benchmarks when available

### Step 4: Source Appendix
Compile all sources used into an appendix for the audit report:
```markdown
## Data Sources
- [Source 1]: [Title] — [URL] (accessed [date])
- [Source 2]: [Title] — [URL] (accessed [date])
```

This appendix goes at the end of the Phase 4 report. When the operator presents, they can say "these aren't my opinions — here are the studies."

### Gate Check
- Minimum 3 verified industry benchmarks before proceeding to Phase 3
- If <3 benchmarks found: use the generic benchmarks but flag as "industry average (general)" rather than vertical-specific
- Log any new benchmarks to `data/verified-registry.json`

---

## Phase 3: Revenue Impact Model

Calculate for this specific business:

```
Monthly lead volume: [X]
Current estimated response rate: [Y]% (benchmark if unknown: 20-30% for slow responders)
Average job value: [$Z]

Current monthly revenue from leads: X × Y% × $Z = $[A]

With Speed to Lead system (response rate → 60-70%):
New monthly revenue from leads: X × 65% × $Z = $[B]

Monthly uplift: $[B] - $[A] = $[DELTA]
Annual uplift: $[DELTA] × 12 = $[ANNUAL]

ROI on Tier 1 ($1,500/mo): [DELTA / 1500]x monthly return
```

Always show conservative (50% lift) and optimistic (70% lift) scenarios.

## Phase 4: Audit Report

Save to `owners-inbox/audits/[client-slug]-audit-report.md`

```markdown
# Lead Capture & Follow-Up Audit
**[Business Name]** | [Date] | Prepared by [Your agency / consultancy]

---

## Executive Summary
[2-3 sentences: what we found, what it's costing them, what's possible]

## What's Working
[List 2-3 genuine positives — never lead with all negatives]

## Critical Gaps Found

### Gap 1: [Name] — [CRITICAL / MODERATE]
**What we found**: [Specific observation]
**What it's costing you**: [Revenue calculation or lead loss estimate]
**Fix**: [What our system does to solve it]

### Gap 2: [Name]...
[Repeat for top 3-5 gaps]

## Revenue Impact Estimate
[Insert model from Phase 3 — conservative + optimistic]

## Recommended System
[Tier 1 or Tier 2 recommendation with brief rationale]

## Investment
Deployment: $[2,000–2,500] (one-time)
Monthly: $[1,500 / 3,000]/month

*Your audit fee of $[X] applies toward the deployment cost.*

## Guarantee
30% increase in booked appointments in 30 days or full deployment refund.

## Industry Context
[2-3 sentences from Phase 2.5 vertical research — market size, trends, where AI is heading in this vertical]

### How You Compare to Local Competitors
| Metric | [Prospect] | [Competitor A] | [Competitor B] | Industry Benchmark |
|--------|-----------|---------------|---------------|-------------------|
| Response time | [X min] | [Y min] | [Z min] | [benchmark] |
| Online booking | [Y/N] | [Y/N] | [Y/N] | — |
| Follow-up sequence | [Y/N] | [Y/N] | [Y/N] | — |

## Next Step
Review call: [booking link] | Questions: [email]

## Data Sources
[Numbered list of all sources from Phase 2.5 with URLs and access dates]
```

### Phase 4.5: Claim Verification (Auto-triggered)
Run the `claim-verifier` skill on the completed report at **HIGH** strictness:
- All revenue model numbers must trace to client intake data or verified benchmarks
- All industry stats must have source URLs
- Any unverified claims get softened or removed before delivery
- Verification report appended internally (not shown to client) at `data/audits/[client-slug]-verification.json`

## Phase 5: Call Prep

Before the delivery call, prepare:
1. Top 3 gaps to lead with (most emotional / highest dollar impact)
2. Revenue model walkthrough (know the numbers cold)
3. Objection responses:
   - "We already have a system" → Ask: "What's your current average response time?"
   - "It's too expensive" → Show monthly ROI calculation
   - "I need to think about it" → "What would need to be true for this to be a yes?"
4. Close: "Based on what I found, I'd recommend [Tier]. Want to move forward today? The audit fee comes off the deployment."

## Pricing
- Audit only: $500 (HVAC/roofing/plumbing) — $1,000–$2,000 (dental/med spa/multi-location)
- Audit fee applies to deployment if they sign within 14 days

## Rules
- Always do the actual tests — don't guess or assume
- Revenue model must use the client's own numbers when available
- Report tone: clinical and factual, not salesy
- Never deliver the report without a scheduled review call
- Save all audits to `data/audits/` for future case study use
- Every statistic in the report must be traceable to a source (Phase 2.5 or client intake)
- Competitor comparison table is mandatory for audits >$500
- Run claim-verifier at HIGH strictness before delivering — zero hallucinated stats
- New benchmarks discovered during audit → add to `data/verified-registry.json` for reuse
- Check `skills/learned/` before running — inject relevant MetaClaw lessons
