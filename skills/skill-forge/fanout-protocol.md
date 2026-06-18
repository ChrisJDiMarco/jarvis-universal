# Fanout Protocol — Phase 2

**Goal**: Execute the search plan in parallel across 4 specialist research agents. Collect structured notes. Prune duplicates. Hand a clean corpus to Phase 3.

**Output**: `owners-inbox/skill-forge/[slug]-[date]/research-corpus/` populated with 20–40 structured notes, organized by source.

---

## Why Parallel?

Sequential research is the #1 time sink. A single Opus agent running 20 queries serially takes 5–8 minutes and produces narrower results because each query's findings color the next. Four parallel agents finish in 2–3 minutes with broader coverage.

**Always launch all 4 agents in the same turn**, using a single message with multiple `Agent` tool calls.

---

## The Four Agents

### Agent 1 — Web Research

**Subagent**: `general-purpose` (or `Explore` if read-only).
**Tools**: `firecrawl_search`, `firecrawl_scrape`, `WebSearch` (fallback).
**Input**: The web-allocated queries from search-plan.md (typically 8–12 queries).
**Output**: `research-corpus/web/note-NN.md` — one note per query, using `templates/research-note.template.md`.

Prompt template:

```
You are the web research agent for a skill-forge run.

Skill being built: [name]
One-line purpose: [purpose]

Your job: execute these N queries via firecrawl_search, scrape the top 2-3 results
per query, and write structured notes for the synthesis phase.

Queries:
[paste list with rationale]

For each query:
1. Run firecrawl_search.
2. Pick the 2-3 most relevant + authoritative results (recent dates, reputable sources, dense practitioner content).
3. firecrawl_scrape each pick.
4. Write a note using research-note.template.md and save to:
   ~/jarvis/owners-inbox/skill-forge/[slug]-[date]/research-corpus/web/note-NN.md

Notes must include:
- Source URL + scrape date
- Key insights (bullet list, ~5-8 bullets)
- Concrete patterns/code snippets if any (capped at 30 lines)
- Applicability score (1-5) — how directly does this inform the skill?

Compress aggressively. Cap each note at ~500 words. Quote sparingly (Hard Rule on copyright).

Do NOT fabricate. If a query returns nothing useful, write a one-line note saying so and move on.

Report back: number of notes written, any queries that returned nothing.
```

### Agent 2 — Anthropic Docs

**Subagent**: `claude-code-guide` if available, else `general-purpose`.
**Tools**: `WebFetch` on `docs.claude.com`, `firecrawl_scrape`, `WebSearch`.
**Input**: 2–3 targeted queries about Claude best practices for the skill's domain.
**Output**: `research-corpus/anthropic-docs/note-NN.md`.

Prompt template:

```
You are the Anthropic-docs research agent for a skill-forge run.

Skill being built: [name]
Domain: [topic from spec.md]

Your job: find Claude/Anthropic-specific guidance relevant to this skill's domain.

Search:
- docs.claude.com for [topic]
- prompt engineering guide for [topic-related sections]
- Claude Agent SDK docs if the skill is agent-shaped

Specific queries:
[paste from search-plan.md]

For each finding:
1. Verify the source is on docs.claude.com or anthropic.com.
2. Extract the load-bearing guidance — not the marketing copy.
3. Note the date the doc was last updated (Anthropic docs evolve).
4. Save to ~/jarvis/owners-inbox/skill-forge/[slug]-[date]/research-corpus/anthropic-docs/note-NN.md

Pay particular attention to:
- Tool / MCP recommendations Claude makes
- Specific prompt patterns Anthropic recommends
- Known Claude failure modes documented in the prompt engineering guide

Report back: number of notes written, key Claude-specific best practices found.
```

### Agent 3 — Local Skills (Pattern Match)

**Subagent**: `Explore`.
**Tools**: `Glob`, `Read`, `Grep`, optionally `mcp__claude-context__search_code` if available.
**Input**: The skill's purpose and trigger phrases.
**Output**: `research-corpus/local-skills/note-NN.md` — pattern-matching report.

Prompt template:

```
You are the local-skills pattern-matching agent.

Skill being forged: [name]
Purpose: [purpose]
Trigger phrases: [list]

Your job: scan ~/jarvis/skills/ for adjacent existing skills and report:
1. Direct overlaps — any existing skill that does ~80% of what this skill would do.
2. Style references — well-built JARVIS skills with similar structure (multi-phase pipelines, agent-driven flows, etc.) the new skill should match.
3. Naming conventions — how similar skills are named in this codebase.
4. Trigger phrasing — how adjacent skills phrase their triggers in their frontmatter description.
5. Sub-file conventions — folder vs single-file, how reference files are organized.

Procedure:
- Glob ~/jarvis/skills/*.md and ~/jarvis/skills/**/SKILL.md
- Skim each for trigger phrases and purpose
- Pick the 3-5 most relevant skills, Read them in full
- Write findings to ~/jarvis/owners-inbox/skill-forge/[slug]-[date]/research-corpus/local-skills/note-NN.md

If mcp__claude-context__search_code is available, run it with the skill's purpose + 2-3 trigger phrases to surface semantically-similar skills.

Output format:
- Adjacent skills found: [list with one-line on each]
- Direct overlap risk: [yes/no, with explanation]
- Style references to match: [skill names]
- Naming convention: [observation]
- Trigger phrase pattern: [observation]
```

### Agent 4 — GitHub Code Search

**Subagent**: `general-purpose`.
**Tools**: `mcp__workspace__bash` (for `gh search code` / `gh search repos`).
**Input**: 3–5 GitHub-flavored queries from search-plan.md.
**Output**: `research-corpus/github/note-NN.md`.

Prompt template:

```
You are the GitHub research agent.

Skill being built: [name]
Purpose: [purpose]

Your job: find real, battle-tested implementations relevant to this skill's domain.

Use mcp__workspace__bash to run:
- `gh search repos [query] --stars=">1000" --limit=10`
- `gh search code [query] --limit=20`

Queries:
[paste from search-plan.md]

For each interesting repo:
1. Read the README (firecrawl_scrape on the github URL works).
2. Note: stars, last commit date, primary language, the load-bearing pattern they implement.
3. If a specific file is the "good part," capture its structure (filename + 5-line summary).

Save findings to ~/jarvis/owners-inbox/skill-forge/[slug]-[date]/research-corpus/github/note-NN.md

Quality bar: Repos with <100 stars or last commit >2 years ago are usually not worth including unless they're the only hit on a niche topic.

Report back:
- Top 3 repos that should influence the skill
- Specific patterns or code structures worth bundling into the skill's references
```

---

## Launch Sequence

In a single message, send 4 `Agent` tool calls. Do not interleave with other tool calls. Pseudocode:

```
[Agent: web-research, prompt: ..., subagent_type: general-purpose]
[Agent: anthropic-docs, prompt: ..., subagent_type: claude-code-guide]
[Agent: local-skills, prompt: ..., subagent_type: Explore]
[Agent: github-code, prompt: ..., subagent_type: general-purpose]
```

While they run, draft the synthesis template (Phase 3 prep) — don't sit idle.

---

## When Agents Return

Each agent reports back with note count + headline findings. Don't read every note in detail. Skim:

1. **Coverage check**: Did each dimension from search-plan.md get hit?
2. **Surprise check**: Did anything unexpected come up (a tool you didn't know about, a failure mode you didn't anticipate)?
3. **Gap check**: Are there obvious holes? If a dimension is empty, dispatch a follow-up query.

If a dimension has zero notes, run a single targeted follow-up query before moving to Phase 3. Don't move on with gaps.

---

## Compression & Deduplication

Before handing to Phase 3, do a 2-minute pass over the corpus:

- **Duplicate sources**: If two notes cite the same URL, merge them.
- **Redundant insights**: If three notes all say "use cache-aside for read-heavy workloads," consolidate into one note with three sources.
- **Empty notes**: Delete notes where the agent reported "no useful results found." Synthesis ignores them anyway.

Goal: ~20–30 high-signal notes, not 40 noisy ones.

---

## Hard Rules

- **Never let one agent block the others.** If the GitHub agent fails (e.g., gh CLI not authed), the other 3 still produce useful corpus.
- **No agent runs > 5 minutes.** If an agent appears stuck, kill its task and synthesize from what the others returned.
- **Notes are markdown only.** No JSON, no nested data structures. Synthesis reads markdown best.
- **Cite or remove.** Every claim in a note must have a URL or filepath as source. Anonymous claims get cut.
- **Don't reformat.** Preserve agent output as-is. Reformatting is Phase 3's job.

---

## Fallback: When Tools Are Unavailable

| Missing tool | Fallback |
|--------------|----------|
| `firecrawl_*` | `WebSearch` + `WebFetch` (slower, lower yield, but works) |
| `gh search` (CLI not installed/authed) | `firecrawl_search "topic site:github.com"` |
| `mcp__claude-context__search_code` | `Grep` over `~/jarvis/skills/` for trigger phrases |
| `Agent` tool unavailable | Run sequentially in a single agent thread, reading research-strategy.md inline |

If 2+ tools are missing, surface the limitation to the operator: *"Three of four research agents are unavailable — corpus will be thinner. Proceed?"*

---

## Related

[[part-of::skill-forge]]  [[preceded-by::search-strategy]]  [[followed-by::synthesis-protocol]]  [[depends-on::firecrawl]]  [[depends-on::Agent-tool]]
