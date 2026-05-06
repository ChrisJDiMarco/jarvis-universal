# Skill: Deep Research Pipeline

## Trigger
"deep dive on [topic]", "research paper on", "thorough analysis of", "literature review on", "what does the research say about", "academic research on", "deep research [topic]"

## Goal
Run a structured, multi-phase research pipeline inspired by AutoResearchClaw — producing a verified, citation-backed research brief with gap analysis and synthesis. Goes far beyond a single web search by using multi-source collection, screening, knowledge extraction, and synthesis with debate.

## Execution Mode
**Always delegate to a sub-agent. Never run inline.**
This skill is context-heavy by design (15+ sources, 6 phases, multi-step file writes). Running it inline would consume the main context window and degrade the rest of the session. JARVIS must spin up a Task sub-agent, pass it this skill + the topic, and let the sub-agent own the full pipeline. The sub-agent returns only the final brief path when done.

---

## Architecture: 6-Phase Pipeline

```
TOPIC → SCOPE → COLLECT → SCREEN → EXTRACT → SYNTHESIZE → DELIVER
                   ↑_________|  (if <8 quality sources, re-collect with expanded queries)
```

---

## Phase 1: SCOPE (Haiku)
**Purpose**: Decompose the topic into searchable components

**Input**: Raw topic from the operator
**Process**:
1. Parse the topic into 3-5 specific research questions
2. Identify the domain (AI/ML, business strategy, marketing, SaaS, local business, other)
3. Generate 8-12 search queries across angles:
   - Direct: `[topic] research 2025 2026`
   - Academic: `[topic] study results findings`
   - Contrarian: `[topic] criticism limitations problems`
   - Applied: `[topic] case study implementation results`
   - Trend: `[topic] trend forecast future`
4. Detect hardware/tool requirements (need code execution? data analysis?)

**Output**: `data/research/[slug]-scope.json`
```json
{
  "topic": "",
  "research_questions": [],
  "domain": "",
  "search_queries": [],
  "requires_code": false,
  "estimated_depth": "SURVEY | ANALYSIS | DEEP_DIVE"
}
```

---

## Phase 2: COLLECT (via deep-search harness)
**Purpose**: Cast a wide net across multiple sources using the structured retrieval harness

**⚠️ Do NOT issue ad-hoc Firecrawl calls here. Load and run `skills/deep-search.md` instead.**

The deep-search harness handles all retrieval with:
- Mandatory planning before any tool call
- Parallel queries (3–5 at a time, never sequential)
- Score-based keep/discard per document
- Dedup tracking across loops
- Pruning of irrelevant content after each loop
- Max 3–4 loops before forced output

**Pass to deep-search**:
- The 8–12 search queries generated in Phase 1 (SCOPE)
- The 3–5 research questions as the evaluation criteria
- Target: minimum 15 documents in KEEP SET

**Gate check**: If KEEP SET < 8 docs after deep-search completes, run one more loop with expanded/synonym queries. Max 2 retries.

**After deep-search completes**:

**NotebookLM Sources (run in parallel with deep-search)**:
If the topic relates to any domain the operator has notebooks on, query NotebookLM first via the MCP:
```
tools: notebooklm_query (MCP tool)
1. List available notebooks: list all notebooks relevant to the topic
2. For each relevant notebook: query with the research questions from Phase 1
3. Treat notebook answers as HIGH-authority sources — they come from curated, uploaded docs
4. Add to KEEP SET with source label: [NotebookLM: <notebook name>]
```
NotebookLM results bypass SCREEN scoring — treat as auto-score 9/12 and move directly to EXTRACT.

- Save KEEP SET to `data/research/[slug]-raw/` (one file per doc: URL + key excerpt)
- Use KEEP SET as input to Phase 3 (SCREEN)

---

## Phase 3: SCREEN (Haiku — bulk processing)
**Purpose**: Filter noise, rank sources by quality and relevance

**For each source, score on**:
| Criterion | Score |
|-----------|-------|
| Relevance to research questions | 0-3 |
| Recency (2024-2026 = 3, 2022-2023 = 2, older = 1, undated = 0) | 0-3 |
| Source authority (academic/official = 3, industry blog = 2, random = 1) | 0-3 |
| Contains data/evidence (numbers, studies cited) | 0-3 |

**Total score**: 0-12 per source
- **Keep**: Score ≥ 6 (move to extraction)
- **Maybe**: Score 4-5 (keep if needed to reach minimum)
- **Drop**: Score < 4

**Gate check**: Need minimum 8 screened sources with score ≥ 6. If not met, return to COLLECT with adjusted queries.

**Output**: `data/research/[slug]-screened.json` (source list with scores)

---

## Phase 4: EXTRACT (Sonnet — isolated context per source)
**Purpose**: Pull structured knowledge from each screened source

**For each source** (pass ONLY that source's content — isolated context):

```
Extract from this source:
1. Key claims (factual assertions with evidence)
2. Data points (specific numbers, statistics, metrics)
3. Methodology (how they arrived at their conclusions)
4. Limitations (what they acknowledge they don't know)
5. Connections (what other work/topics they reference)

Return as JSON. If a field is not present, return null — do NOT fabricate.
```

**Output per source**: Structured extraction JSON
**Aggregated output**: `data/research/[slug]-extractions.json`

---

## Phase 5: SYNTHESIZE (Opus or Sonnet — this is the reasoning-heavy step)
**Purpose**: Find the gaps, generate original insights, build the narrative

### 5a. Claim Mapping
- Group all extracted claims by research question
- Identify: claims with consensus (3+ sources agree), contested claims (sources disagree), gaps (questions no source addresses)

### 5b. Gap Analysis (the InfraNodus principle)
- **What is everyone saying?** → The consensus cluster
- **What is NO ONE saying?** → The structural gap — this is where original insight lives
- **Where do sources contradict?** → The debate zone — present both sides

### 5c. Multi-Perspective Debate (AutoResearchClaw-inspired)
For each gap or contested claim, run a mental debate:
- **Advocate**: Make the strongest case FOR the emerging hypothesis
- **Critic**: Attack it — what evidence is missing? What assumptions are shaky?
- **Synthesizer**: Reconcile — what's the most defensible conclusion given the evidence?

### 5d. Confidence Tagging
Every conclusion gets a confidence tag:
- **HIGH**: 3+ independent sources with data support, no major contradictions
- **MEDIUM**: 1-2 sources with data, or consensus without hard data
- **LOW**: Inference from gaps, or single-source claims
- **SPECULATIVE**: JARVIS's own hypothesis based on pattern recognition

**Output**: `data/research/[slug]-synthesis.json`

---

## Phase 6: DELIVER

### Output Format
Save to `owners-inbox/research/[slug]-deep-brief-[date].md`:

```markdown
# Deep Research Brief: [Topic]
**Date**: [date] | **Sources**: [N] analyzed, [M] cited | **Depth**: [SURVEY/ANALYSIS/DEEP_DIVE]

---

## Executive Summary
[3-4 sentences: what we found, what it means, what to do about it]

## Research Questions
1. [Question 1]
2. [Question 2]
...

## Key Findings

### Finding 1: [Title] — Confidence: [HIGH/MEDIUM/LOW]
[2-3 paragraph analysis with inline citations]
**Evidence**: [specific data points from sources]
**Sources**: [1], [2], [5]

### Finding 2: [Title] — Confidence: [HIGH/MEDIUM/LOW]
...

## The Gap: What No One Is Talking About
[This is the highest-value section — the structural gap analysis]
[What the sources collectively miss, and why it matters]

## Contested Territory
[Where sources disagree, with both sides presented fairly]

## Implications for [Business Context]
[Translate findings into actionable insights for the operator's specific context]
- For Agency: [how this affects client work]
- For product/tool: [how this affects what you're building]
- For Content: [angles worth creating content about]

## Recommended Actions
1. [Specific action with rationale]
2. [Specific action with rationale]
3. [Specific action with rationale]

## Sources
[Numbered list with titles and URLs — only actually-cited sources]

## Methodology Note
This brief was produced using JARVIS's deep research pipeline: [N] sources collected via Firecrawl, [M] screened (threshold: 6/12), [K] fully extracted, synthesized with gap analysis and multi-perspective debate. All data points verified against source material.
```

---

## Model Routing

| Phase | Model | Why |
|-------|-------|-----|
| SCOPE | Haiku | Query generation is fast pattern work |
| COLLECT | Haiku + Firecrawl | Tool orchestration, no reasoning needed |
| SCREEN | Haiku | Scoring is classification |
| EXTRACT | Sonnet | Needs comprehension, but isolated per source |
| SYNTHESIZE | Opus (if strategic) / Sonnet (if tactical) | Core reasoning, gap analysis, debate |
| DELIVER | Sonnet | Writing and formatting |

---

## State Persistence

Use `data/jarvis.db` → table `research_runs`:
```sql
CREATE TABLE IF NOT EXISTS research_runs (
  run_id TEXT PRIMARY KEY,
  topic TEXT,
  slug TEXT,
  phase TEXT DEFAULT 'SCOPE',
  sources_collected INTEGER DEFAULT 0,
  sources_screened INTEGER DEFAULT 0,
  retries INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```
- Each phase updates `phase` and `updated_at`
- On session restart: query for incomplete runs → offer to resume

---

## Integration with MetaClaw

- Before execution: Load relevant lessons from `skills/learned/prompt-patterns.md` and `skills/learned/tool-routing.md`
- After execution: If any phase required retry, extract lesson and store
- If a new source type proves valuable, store as tool-routing lesson

---

## Rules
- Never synthesize from memory/training data — only from collected + screened sources
- The gap analysis section is mandatory — it's the whole point of going deeper than a web search
- Confidence tags are non-negotiable — every claim must be tagged
- Isolated context for extraction — never let one source's content contaminate another's extraction
- Max 2 retry loops on collection — if sources are thin, deliver with a "Limited Data" caveat rather than fabricating depth
- Fan-out collection when >6 queries — speed matters, use parallel agents
- Always check `skills/learned/` before running — inject relevant lessons into agent prompts

---

## Estimated Time
- SURVEY depth: 5-10 minutes
- ANALYSIS depth: 10-20 minutes
- DEEP_DIVE depth: 20-40 minutes

## Estimated Cost
- SURVEY: ~$2-5 (mostly Haiku + Firecrawl calls)
- ANALYSIS: ~$5-10
- DEEP_DIVE: ~$10-20 (Opus synthesis)

---

## Related
[[deep-search]]  [[claim-verifier]]  [[metaclaw-learning]]  [[core]]  [[context]]
