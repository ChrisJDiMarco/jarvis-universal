# Skill: Deep Search Harness

## Trigger
Any research or retrieval task. Used standalone for focused lookups or as the COLLECT phase inside `researcher-deep`. Activated explicitly by: "find everything on [topic]", "search deeply for", "retrieve all relevant [X]", or implicitly whenever the researcher agent needs to gather sources.

## Goal
Retrieve the highest-quality, most relevant set of documents/sources for a given query — using a parallel + prune loop inspired by Chroma Context-1's agentic search architecture. The harness separates *retrieval* from *synthesis* so the researcher can search without polluting its reasoning context with junk docs.

---

## Core Insight (from Chroma Context-1)

Traditional search: one query → 10 results → done (no recovery if it misses)

Deep search: Plan → Parallel broad + narrow queries → Evaluate + score → Prune irrelevant → Deeper read on promising hits → Repeat until satisfied → Output clean set

The model doing this loop doesn't answer questions — it only retrieves. The downstream synthesis step uses the clean document set. This separation is why it performs better.

---

## The Harness Loop

```
PLAN → PARALLEL SEARCH → EVALUATE → PRUNE → [DEEP READ?] → [MORE SEARCH?] → OUTPUT
          ↑___________________________________________________|  (if gaps remain)
```

**Max iterations**: 4 loops before forced output with coverage note
**Termination condition**: All research questions have ≥2 supporting documents, OR no new documents found in last loop, OR max iterations reached

---

## Phase 1: PLAN (mandatory — do this before any tool call)

Before issuing a single search, output a search plan:

```
SEARCH PLAN
───────────
Topic: [the query]
Research questions I need to answer:
  1. [specific question]
  2. [specific question]
  3. [specific question]

Query set (broad):
  - "[broad query 1]"
  - "[broad query 2]"

Query set (narrow/targeted):
  - "[specific query with qualifier]"
  - "[specific query with date range or site:]"
  - "[contrarian/gap query]"

Documents I'm looking for:
  - [type of source: case study / stat / definition / implementation / etc.]

Dedup tracker: [] (seen URLs, grows each loop)
Keep set: [] (docs scored ≥ 6, grows each loop)
```

This plan is not for the user — it's for the agent's own reasoning. Output it as a thinking block before tool calls.

---

## Phase 2: PARALLEL SEARCH

**Rule: Never issue one search at a time. Always fire 3–5 queries simultaneously.**

Use Firecrawl tools in parallel:
- `firecrawl_search` — for broad web queries (returns snippets + URLs)
- `firecrawl_scrape` — for specific known URLs that look authoritative
- `firecrawl_extract` — for structured data extraction from a page

**Query strategy per loop**:

| Loop | Query type | Goal |
|------|-----------|------|
| 1 | Broad (category-level) + 2 targeted | Map the space, find best sources |
| 2 | Narrowed based on loop 1 discoveries | Drill into the most promising thread |
| 3 | Gap-filling (what loop 1+2 didn't cover) | Contrarian angles, edge cases |
| 4 | Confirmation queries | Verify contested claims |

**Parallel call example** (fire these simultaneously, not sequentially):
```
firecrawl_search("context 1 chroma agentic search 2026")
firecrawl_search("agentic search model training recall precision tradeoff")
firecrawl_search("agentic search benchmark comparison frontier models")
firecrawl_scrape("https://trychroma.com/agent")
```

---

## Phase 3: EVALUATE (score each result)

For every URL/document returned, score before keeping:

| Criterion | Score |
|-----------|-------|
| Directly answers ≥1 research question | 0–3 |
| Contains specific data, numbers, or evidence | 0–3 |
| Source authority (official/primary > industry blog > random) | 0–3 |
| Recency (2025–2026 = 3, 2023–2024 = 2, older = 1) | 0–3 |

**Threshold**:
- Score ≥ 7: KEEP — add to keep set, mark URL as seen
- Score 5–6: MAYBE — keep if keep set has <8 docs
- Score < 5: DISCARD — add URL to dedup tracker, do not read further

**Key dedup rule**: If URL is already in `seen_urls`, skip immediately — never re-fetch the same page.

---

## Phase 4: PRUNE

After evaluating each loop's results:
1. Remove DISCARD documents from working context entirely
2. For MAYBE documents that weren't needed: remove
3. Keep only KEEP set in active context
4. Update `seen_urls` with everything evaluated (keep AND discard)

**Why this matters**: Without pruning, you accumulate 40+ irrelevant snippets that dilute the final synthesis. Prune aggressively — if a doc doesn't directly support a research question, it goes.

---

## Phase 5: DEEP READ (conditional)

If a KEEP document looks like it has more depth than the snippet reveals, use `firecrawl_scrape` to fetch the full page.

**Trigger for deep read**:
- Snippet mentions a specific stat, study, or case study without the full data
- Source is clearly authoritative (official docs, research paper, primary source)
- Full page content would directly answer a research question

**Limit**: Max 5 deep reads per harness run (to manage cost + latency)

---

## Phase 6: LOOP DECISION

After each loop, ask:
- **Are all research questions answered with ≥2 supporting docs?** → Output
- **Did this loop add 0 new KEEP docs?** → Output (with coverage note)
- **Are there obvious gaps still?** → New loop with gap-filling queries
- **Max iterations reached?** → Output what we have

---

## Phase 7: OUTPUT

Return a clean document set — not a summary, not an answer. Just the curated retrieval.

```
RETRIEVAL RESULT
────────────────
Query: [original topic]
Loops run: [N]
Documents evaluated: [N]
Keep set: [N] documents

KEEP SET:
[1] [Title] — [URL]
    Relevance: [which research question this answers]
    Key data: [1 sentence — specific fact/stat from this doc]
    Score: [N/12]

[2] ...

COVERAGE GAPS:
- [Research question with <2 supporting docs, if any]

SUGGESTED NEXT: [if gaps remain, suggest follow-up queries]
```

This output feeds directly into the EXTRACT phase of `researcher-deep`, or can be used directly by the researcher for synthesis.

---

## Integration Points

### With researcher-deep
Deep search replaces the COLLECT phase in `researcher-deep`. Instead of ad-hoc Firecrawl calls, run this harness and pass the KEEP SET to Phase 4 (EXTRACT).

### Standalone
Use for any focused retrieval task: finding competitor pricing, locating a specific stat, confirming a claim, finding case studies for a proposal.

### With claim-verifier
After synthesis, if `claim-verifier` needs to verify a specific stat, run a targeted deep-search loop (1-2 loops, narrow queries only) on that specific claim.

---

## Token Management Rules

- **Never accumulate raw page content in active context** — store to file, keep only URL + key excerpt
- **Prune after every loop** — don't let discarded docs persist
- **For long runs**: save intermediate KEEP SET to `data/research/[slug]-search-state.json` after each loop so work isn't lost if context fills

---

## Cost Guidance

| Run size | Loops | Firecrawl calls | Approx cost |
|----------|-------|-----------------|-------------|
| Quick lookup | 1–2 | 5–10 | ~$0.20–0.50 |
| Standard research | 2–3 | 10–20 | ~$0.50–2.00 |
| Deep retrieval | 3–4 | 20–30 | ~$2.00–5.00 |

---

## Rules
- **Plan before any tool call** — the reasoning step is not optional
- **Parallel queries always** — never one at a time
- **Prune after every loop** — irrelevant docs are context poison
- **Dedup is sacred** — never re-fetch a seen URL
- **Retrieval ≠ synthesis** — this skill finds documents; it does NOT answer the question
- **If coverage gaps remain at output** — flag them explicitly; don't paper over them
