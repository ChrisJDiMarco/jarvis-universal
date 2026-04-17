# Skill: Competitor Intelligence Harness

## Trigger
"research [company]", "competitor analysis", "competitive brief", "what does [company] do", "compare us to [competitor]", "intel on [company]"

## Goal
Produce a validated, structured competitive brief with zero hallucinated pricing or features — using a deterministic phase loop with programmatic validation, not a single open-ended LLM call.

## Execution Mode
**Always delegate to a sub-agent. Never run inline.**
This skill involves multi-phase Firecrawl scraping, validation loops, and structured file output — all heavy on context and tool calls. Spin up a Task sub-agent with this skill + the target company. The sub-agent owns the full pipeline and returns only the final brief path. Keeps the main session clean.

---

## Why This Exists
A 10-step workflow at 90% reliability per step compounds to ~35% success. This harness enforces phases with explicit validation gates so failures are caught early and retried precisely, not silently passed along.

---

## Architecture: Phase State Machine

### State Flow
```
PENDING → SCRAPED → EXTRACTED → VALIDATED → COMPLETE
                        ↑____________|  (if validation fails, push back to SCRAPED)
```

### Phase 1 — SCRAPE (Fast/Dumb)
**Agent**: Haiku or equivalent fast model
**Task**: Pure information retrieval — no synthesis
- Use `firecrawl_search` for: `[company] pricing`, `[company] features`, `[company] competitors`
- Use `firecrawl_scrape` to pull homepage and pricing page directly (gets clean Markdown, bypasses anti-bot)
- Use `firecrawl_search` to find G2/Capterra reviews: `[company] reviews site:g2.com OR site:capterra.com`
- Save raw text to: `owners-inbox/research/[company]-raw.txt`
- **Do NOT summarize. Raw text only.**
- Update state → SCRAPED

### Phase 2 — EXTRACT (Smart/Isolated)
**Agent**: Sonnet with isolated context (only the raw file, no conversation history)
**Prompt (exact)**:
```
Extract ONLY the following from the attached raw research data.
Return as JSON. If you cannot find a field with confidence, return null — do NOT guess.

{
  "company_name": "",
  "starting_price": "",
  "pricing_model": "per-seat | usage-based | flat | unknown",
  "core_features": ["feature1", "feature2", "feature3"],
  "target_customer": "",
  "main_differentiator": "",
  "weakness_signals": ["", ""],
  "sources_used": ["url1", "url2"]
}
```
- Save output to: `owners-inbox/research/[company]-extraction.json`
- Update state → EXTRACTED

### Phase 3 — VALIDATE (Programmatic, NO LLM)
Run these checks against the JSON file:
1. `starting_price` is not null AND not empty
2. `core_features` array has >= 3 items
3. `sources_used` has >= 1 URL
4. `pricing_model` is one of the four valid values

**If any check fails:**
- Log which check failed and why
- Push state back to → SCRAPED (retry with broader search terms)
- Max retries: 2. If still failing after 2 retries → flag to owners-inbox as INCOMPLETE with reason

**If all checks pass:** Update state → VALIDATED

### Phase 4 — SYNTHESIZE & DELIVER (Sonnet)
**Context given**: Only the validated JSON + JARVIS business context (from memory/agency.md or relevant context)
**Output format** (push to `owners-inbox/[company]-competitive-brief.md`):

```markdown
# Competitive Brief: [Company Name]
**Date**: [date] | **Status**: VALIDATED

## Snapshot
- **Price**: [starting_price] ([pricing_model])
- **Target**: [target_customer]
- **Key Differentiator**: [main_differentiator]

## Core Features
1. [feature1]
2. [feature2]
3. [feature3]

## Weakness Signals
- [weakness1]
- [weakness2]

## Your Positioning (vs. their offer)
[2-3 sentences on how the operator's product/service competes, based on context from memory/context.md]

## Sources
[sources_used]
```

---

## State Persistence
- Use `data/jarvis.db` → table `research_runs`
- Schema: `(run_id, company, phase, retries, created_at, updated_at)`
- Create table if not exists before first run
- Each phase updates `phase` and `updated_at`
- On session restart: query for PENDING/SCRAPED/EXTRACTED runs → resume from current phase

---

## Rules
- Never generate pricing from training knowledge — only from scraped sources
- If raw scrape returns <500 characters, flag as likely blocked/paywalled before extracting
- Validation is programmatic, not LLM-based — no model should override a failed validation check
- Max 2 retry loops per run — escalate to Chris if still failing
- Always isolate Phase 2 context from Phase 1 scrape noise — pass only the raw file, not the full conversation

---

## Output Location
`owners-inbox/[company-slug]-competitive-brief.md`

## Estimated Time
- Standard run: 3–5 minutes
- With 1 retry: 5–8 minutes
- With 2 retries: flag to Chris, deliver partial
