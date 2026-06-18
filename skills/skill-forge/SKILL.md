---
name: skill-forge
description: Autonomous research-driven meta-skill builder. Creates highly-detailed Claude skills from a one-line idea by fanning out parallel research across the open web, Anthropic docs, GitHub, and existing skills, synthesizing findings, and assembling a production-grade SKILL.md with the anthropic-skills:skill-creator at the end. ALWAYS use this skill when the user asks to "forge a skill", "build me a skill for X", "research and build a skill", "design a skill for [domain]", "create a meta-skill", "create a skill from scratch with research", or any request to produce a skill where domain knowledge needs to be gathered first. Also trigger if the user wants a skill that captures expert-level practice in a domain they don't yet have written down. This skill is the difference between a thin one-page skill draft and a battle-tested skill grounded in real-world patterns.
---

# Skill Forge — The Meta-Skill That Builds Skills

## Goal

Take a fuzzy "I want a skill for X" request and produce a production-grade skill at `~/jarvis/skills/[name]/` — backed by real research, validated against existing patterns, and ready to invoke. Output is a folder skill (SKILL.md + sub-files + templates) that triggers reliably and tells future-Claude exactly how to act.

**What makes this different from `anthropic-skills:skill-creator`:** That skill is the canonical *assembler* — it knows the SKILL.md format, runs evals, optimizes descriptions. Skill-Forge wraps it with an **autonomous research engine** that runs first. Skill-Forge gathers the domain knowledge; skill-creator turns it into a polished skill. We use both.

---

## When to Trigger

- "forge a skill for [X]" / "build me a skill for [X]" / "I want a meta-skill that [...]"
- "research and build a skill on [domain]"
- "design a skill that captures how to [task]"
- "create a skill from scratch with proper research"
- Any "I need a skill for [X]" where the operator hasn't already written the domain knowledge down

If the operator already has a draft and just wants formatting + evals → route to `anthropic-skills:skill-creator` directly. Skill-Forge is for the cold-start case.

---

## Hard Rules (Read First)

1. **Three operator gates are mandatory.** Spec → Synthesis → Final. Never skip a gate even if the operator says "just go." A skipped gate burns context on a wrong-direction draft.
2. **Research before drafting. Always.** The whole point of this skill is that we don't write SKILL.md from training data alone. Even if the topic feels obvious, run the search-planning phase.
3. **Diverse search > deep search.** Generating 5 great queries across 5 angles beats 25 variations of one query. See `search-strategy.md` for the dimension framework.
4. **Parallel fanout, not sequential.** Phase 2 dispatches 4 research agents simultaneously. Sequential research wastes operator time and produces narrower results.
5. **Cite or remove.** Any concrete claim in the final SKILL.md (specific tools, version numbers, framework features) must trace to a source in the research corpus. Unverifiable claims get removed or labeled `(unverified)`.
6. **Use the anthropic-skills:skill-creator at the end.** Don't reinvent SKILL.md formatting, frontmatter conventions, or eval structure. Hand the synthesis to skill-creator and let it do canonical assembly. We add value before that step, not by replacing it.
7. **Keep the workspace clean.** All intermediate artifacts live in `~/jarvis/owners-inbox/skill-forge/[skill-slug]-[date]/`. The final skill goes to `~/jarvis/skills/[skill-name]/`. Don't pollute the skills directory with research notes.

---

## Pipeline Architecture

```
PHASE 0: INTAKE        → spec.md
            ↓
        🚧 GATE 1: Operator approves spec
            ↓
PHASE 1: SEARCH PLANNING → search-plan.md (15–25 queries across 5 dimensions)
            ↓
PHASE 2: RESEARCH FANOUT → research-corpus/ (parallel: web + docs + local + github)
            ↓
PHASE 3: SYNTHESIS     → synthesis.md
            ↓
        🚧 GATE 2: Operator approves synthesis
            ↓
PHASE 4: DRAFTING      → draft/ (anthropic-skills:skill-creator wraps it up)
            ↓
PHASE 5: QA LOOP       → revised draft + qa-report.md (3 parallel reviewers)
            ↓
        🚧 GATE 3: Operator final approval
            ↓
PHASE 6: INSTALL       → ~/jarvis/skills/[name]/ + CLAUDE.md index update
```

Each phase has a dedicated protocol file. Read the protocol when entering the phase — don't reconstruct it from memory.

---

## Phase 0 — Intake

**Goal**: Convert a fuzzy ask into a written spec the operator confirms before research starts.

Read **`intake-protocol.md`** for the full procedure. Briefly:

1. Use `AskUserQuestion` to ask 3–4 critical questions (skill purpose, trigger phrases, output format, scope).
2. Detect if the operator already has a partial draft or domain experience → capture it before research starts (it's the highest-quality signal we'll get).
3. Write `spec.md` using `templates/spec.template.md`.
4. Show it to the operator with a "does this match what you wanted?" prompt.

**Output**: `owners-inbox/skill-forge/[slug]-[date]/spec.md`

🚧 **GATE 1**: Operator must reply affirmatively before Phase 1.

---

## Phase 1 — Search Planning

**Goal**: Generate a diverse, well-reasoned set of search queries across 5 research dimensions. The diversity captures more information than running 25 variations of the same query.

Read **`search-strategy.md`** for the dimension framework. The five dimensions:

| Dimension | Question it answers | Typical query count |
|-----------|---------------------|---------------------|
| **Core domain** | What is this topic? Authoritative definitions, scope, mental models. | 3–5 |
| **Best practices** | How do experts actually do this in production? | 3–5 |
| **Failure modes** | What goes wrong? Anti-patterns, common mistakes, debugging horror stories. | 3–5 |
| **Tooling & libraries** | What concrete tools, libraries, MCP servers exist? Which are battle-tested? | 3–5 |
| **Adjacent / competitive** | What alternatives exist? When is this approach the wrong fit? | 2–4 |

For each dimension, generate queries with **different angles**:
- Year-bounded ("X best practices 2026") to surface recent material
- Comparison ("X vs Y") to surface tradeoffs
- Failure ("common mistakes when X", "X anti-patterns")
- GitHub-specific ("X stars site:github.com") to find real implementations
- Reddit / forum ("X reddit", "X HackerNews") for unfiltered practitioner takes

**Output**: `owners-inbox/skill-forge/[slug]-[date]/search-plan.md` — 15–25 queries, grouped by dimension, each with a one-line rationale.

---

## Phase 2 — Research Fanout

**Goal**: Execute the search plan in parallel across 4 research agents, collect structured notes, prune duplicates.

Read **`fanout-protocol.md`** for the dispatch procedure. Briefly:

| Agent | Tool | Source | Returns |
|-------|------|--------|---------|
| **Web research** | `firecrawl_search` + `firecrawl_scrape` | Open web, blogs, articles | Notes per query: best-of-3 sources, key insights |
| **Anthropic docs** | `firecrawl_scrape` on docs.claude.com + `WebSearch` | Anthropic docs, prompt eng guides, agent SDK | Notes on Claude-specific best practices |
| **Local skills** | `Glob` + `Read` on `~/jarvis/skills/` | Existing JARVIS skills | Pattern-match: naming, structure, trigger phrases that work in this system |
| **GitHub code** | `gh search code` + `gh search repos` (via `mcp__workspace__bash`) | Real implementations | Top 3–5 repos with concrete patterns |

All four launch **in the same turn** — never sequentially. Each writes notes to `research-corpus/[agent-name]/[note-N].md` using `templates/research-note.template.md`.

**Output**: `owners-inbox/skill-forge/[slug]-[date]/research-corpus/` — typically 20–40 structured notes.

> **Compression rule**: Each note caps at ~500 words. If a source is dense, summarize the load-bearing parts and link to the original. We're optimizing for synthesis-readiness, not archive completeness.

---

## Phase 3 — Synthesis

**Goal**: Collapse the research corpus into a single distilled brief that the drafting phase can mechanically convert into SKILL.md sections.

Read **`synthesis-protocol.md`** for the full procedure. The synthesis extracts six fields:

1. **Concrete patterns** — concrete techniques to bake into the skill's procedure section
2. **Failure modes** — what to guard against (becomes the skill's Rules / Hard Stops section)
3. **Tools & references** — specific MCPs, libraries, files to point at
4. **Trigger phrases** — how operators *actually* describe this kind of task (mined from forums + adjacent skills)
5. **Step-by-step procedures** — concrete sequences from real implementations
6. **Examples** — at least 2 worked examples, ideally with input/output pairs

The synthesis is written by a single Opus agent reading the entire corpus in one pass. Use Sonnet only if Opus is unavailable — synthesis quality is the highest-leverage step in the pipeline.

**Output**: `owners-inbox/skill-forge/[slug]-[date]/synthesis.md`

🚧 **GATE 2**: Show synthesis to operator. They confirm or call out gaps before drafting.

---

## Phase 4 — Drafting

**Goal**: Hand the synthesis to `anthropic-skills:skill-creator` and let it produce the canonical SKILL.md.

Read **`drafting-protocol.md`** for the integration. Briefly:

1. Invoke the `anthropic-skills:skill-creator` skill with a focused prompt that includes the full synthesis.
2. Skill-creator handles: frontmatter formatting, description optimization recommendations, file structure, eval scaffolding.
3. **We inject** the concrete content from synthesis into the relevant SKILL.md sections — skill-creator gets the structure right; we get the content right.
4. Save the draft to `owners-inbox/skill-forge/[slug]-[date]/draft/`.

**Output**: `draft/SKILL.md` + any sub-files (templates, references, scripts) the skill needs.

> Why use skill-creator here instead of building from scratch? It already encodes the format quirks (description "pushiness", frontmatter, progressive disclosure). Re-deriving those from training is lossy. Use the proven assembler.

---

## Phase 5 — QA Loop

**Goal**: Three parallel reviewers stress-test the draft. Synthesize their findings into one revision pass.

Read **`qa-protocol.md`** for the reviewer specs. Briefly:

| Reviewer | Question it answers | Output |
|----------|---------------------|--------|
| **Trigger fidelity** | Would Claude actually invoke this skill on the right prompts? | Run 5 mock prompts against the description; report would-trigger / wouldn't-trigger |
| **Completeness** | Are there obvious gaps a domain expert would flag? Edge cases missing? | Gap list + specific section recommendations |
| **Format compliance** | Does the skill match anthropic-skills:skill-creator standards? Frontmatter, progressive disclosure, file size? | Format issues + corrections |

All three run **in parallel** via `Agent` tool calls. After they return, do a single revision pass that addresses everything.

**Output**: revised `draft/SKILL.md` + `qa-report.md` documenting what was caught and fixed.

---

## Phase 6 — Install

**Goal**: Move the validated skill into the JARVIS skill registry and index it.

Read **`install-protocol.md`** for the deploy procedure. Briefly:

🚧 **GATE 3**: Show the final SKILL.md to the operator. Get explicit approval. ("Looks good, install it.")

Then:

1. Move the skill folder: `mv draft/ ~/jarvis/skills/[skill-name]/`
2. Append a row to the **Active Skills Index** table in `~/jarvis/CLAUDE.md` (skill name, trigger, what it does — one line).
3. Optionally write `~/jarvis/wiki/skill_[name].md` with the atomic-entity reference (for graph search via the edge convention).
4. Optionally save a memory pointer using the `auto-memory` system: type=reference, name=skill_[name], description="[skill name] installed [date], purpose [Y]. Triggered by [phrases]."
5. Confirm with operator + show the skill path.

**Output**: Installed skill at `~/jarvis/skills/[skill-name]/`, indexed in CLAUDE.md, optional wiki entry + memory pointer.

---

## File Inventory

```
~/jarvis/skills/skill-forge/
├── SKILL.md                       ← This file. Entry point, phase summaries.
├── intake-protocol.md             ← Phase 0: clarifying questions, spec template usage.
├── search-strategy.md             ← Phase 1: the 5-dimension diverse-query framework.
├── fanout-protocol.md             ← Phase 2: parallel agent dispatch + research corpus structure.
├── synthesis-protocol.md          ← Phase 3: distillation rules, output schema.
├── drafting-protocol.md           ← Phase 4: integrating with anthropic-skills:skill-creator.
├── qa-protocol.md                 ← Phase 5: 3 reviewer specs + revision loop.
├── install-protocol.md            ← Phase 6: deploy + CLAUDE.md indexing.
├── templates/
│   ├── spec.template.md           ← Phase 0 output skeleton.
│   ├── search-plan.template.md    ← Phase 1 output skeleton.
│   ├── research-note.template.md  ← Per-source note format.
│   ├── synthesis.template.md      ← Phase 3 output skeleton.
│   └── SKILL.template.md          ← Bare-bones SKILL.md skeleton (used as fallback if skill-creator unavailable).
└── examples/
    └── walkthrough.md             ← Full pipeline trace for a hypothetical skill ("build a skill for caching strategies").
```

---

## Workspace Convention

Every skill-forge run creates a workspace at:

```
~/jarvis/owners-inbox/skill-forge/[skill-slug]-[YYYY-MM-DD]/
├── spec.md
├── search-plan.md
├── research-corpus/
│   ├── web/
│   ├── anthropic-docs/
│   ├── local-skills/
│   └── github/
├── synthesis.md
├── draft/
│   └── SKILL.md (+ sub-files)
└── qa-report.md
```

After install, the workspace stays in `owners-inbox` for 7 days, then gets archived per the JARVIS owners-inbox lifecycle. Don't delete it — the operator may want to revisit research.

---

## Tools You'll Lean On

These are the load-bearing tools. Confirm availability at the start of Phase 0; if any are missing, fall back per `fanout-protocol.md`:

- **`firecrawl_search`** + **`firecrawl_scrape`** — web research engine
- **`WebSearch`** — fallback when firecrawl is rate-limited
- **`mcp__workspace__bash`** — for `gh search code` / `gh search repos`
- **`Glob`** + **`Read`** — for ~/jarvis/skills/ pattern-matching
- **`Agent`** (Task tool) — for parallel research dispatch + QA reviewers
- **`AskUserQuestion`** — operator gate prompts (phases 0, 3, 5)
- **`anthropic-skills:skill-creator`** — Phase 4 assembler

If `mcp__claude-context__search_code` is available, also use it in Phase 2 local-skills agent for semantic pattern matching across `~/jarvis/skills/`.

---

## Common Failure Modes (Guard Against)

These are the failure modes that have shown up when building skills without this pipeline. Each has a Phase X countermeasure:

| Failure mode | Countermeasure |
|--------------|----------------|
| Skill description too narrow → never triggers | Phase 1 mines trigger phrases from forums + adjacent skills. Phase 5 trigger-fidelity reviewer catches narrow descriptions. |
| Skill is a thin shell with no concrete procedure | Phase 3 synthesis requires step-by-step procedures from real implementations. |
| Skill duplicates existing JARVIS skills | Phase 2 local-skills agent surfaces overlap. Phase 0 intake explicitly asks if the operator has considered existing skills. |
| Hallucinated tool names, version numbers, or features | Hard Rule #5: cite or remove. Phase 5 completeness reviewer catches uncited specifics. |
| Wall-of-text SKILL.md > 500 lines | Phase 4 leverages skill-creator's progressive disclosure pattern; sub-files for detail. |
| Trigger phrases are too generic and steal from other skills | Phase 5 trigger-fidelity reviewer runs 5 mock prompts including 2 should-NOT-trigger cases. |

---

## Done = Operator Approval at All 3 Gates + Install Confirmation

Skill-Forge is not done when the file is written. It's done when:
- Operator approved the spec (Gate 1)
- Operator approved the synthesis (Gate 2)
- Operator approved the final draft (Gate 3)
- Skill is installed at `~/jarvis/skills/[name]/`
- CLAUDE.md Active Skills Index has the new row
- Operator can paste a trigger phrase and watch it fire

If any of these is missing, the work is in-progress, not complete.

---

## Related

[[part-of::jarvis-skill-system]]  [[depends-on::anthropic-skills:skill-creator]]  [[related-to::agent-builder]]  [[related-to::skill-creator]]  [[supports::self-improving-jarvis]]
