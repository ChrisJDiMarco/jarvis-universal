# Walkthrough — Forging a "caching-strategy-designer" Skill

A full pipeline trace for a hypothetical operator request. Read this when you need a concrete sense of what each phase actually produces.

---

## The Operator's Ask

> "I keep making the same caching mistakes across projects. Forge me a skill that helps me pick the right caching strategy when I'm designing a new feature."

---

## Phase 0 — Intake

**AskUserQuestion responses:**

| Question | Answer |
|----------|--------|
| Skill purpose? | Apply domain expertise — caching pattern selection + tradeoff analysis |
| Trigger? | Domain keywords + decision-flavored phrases ("should I cache X", "what cache strategy for Y") |
| Output format? | Inline analysis in chat, with optional written brief if asked |
| Scope? | One-shot (single decision support response, not a multi-phase pipeline) |

**Probed for prior knowledge:**
> "I've read Designing Data-Intensive Applications cover-to-cover. I know the basic patterns (cache-aside, write-through, etc.) — what I keep messing up is invalidation strategy and TTL choices, and I don't have a good gut for when caching is actually the wrong answer."

**Spec written** (`owners-inbox/skill-forge/caching-strategy-designer-2026-05-06/spec.md`):

```yaml
skill_name: caching-strategy-designer
one_line_purpose: Helps Claude recommend caching strategy when reviewing or designing
  a new feature, with explicit attention to invalidation, TTL, and "should we cache
  at all" boundary cases.
trigger_phrases:
  should_fire: ["should I cache X", "what cache strategy for", "caching for [feature]",
    "TTL for", "how do I invalidate", "is caching the right answer"]
  should_not_fire: ["explain caching" (explanation), "configure redis" (handled by
    builder agent + redis MCP)]
expected_output: Inline analysis with: chosen pattern + rationale, TTL recommendation,
  invalidation strategy, when this could be the wrong answer.
scope: one-shot
pre_existing_material: |
  Operator has read DDIA. Familiar with cache-aside, write-through, write-back.
  Weak spots: invalidation strategy, TTL choices, "should we cache at all".
```

**Operator at Gate 1**: *"Yes, that's exactly it."*

---

## Phase 1 — Search Planning

`search-plan.md` produced:

### Dimension 1 — Core Domain (3 queries)
| Query | Source | Rationale |
|-------|--------|-----------|
| "cache invalidation patterns 2026" | firecrawl_search | Year-bounded for recency |
| "CAP theorem caching tradeoffs" | firecrawl_search | Frames caching in distributed-systems terms |
| "TTL strategy stale-while-revalidate" | firecrawl_search | Operator-flagged weak spot — pull canonical material |

### Dimension 2 — Best Practices (4 queries)
| Query | Source | Rationale |
|-------|--------|-----------|
| "production caching patterns at scale" | firecrawl_search | Real production guidance |
| "cache-aside vs read-through pros and cons" | firecrawl_search | Comparison surfaces tradeoffs |
| "Claude best practices caching" | docs.claude.com via WebFetch | Anthropic-specific guidance |
| "stripe caching architecture" | firecrawl_search | Engineering blog from a known-careful team |

### Dimension 3 — Failure Modes (5 queries)
| Query | Source | Rationale |
|-------|--------|-----------|
| "thundering herd cache stampede" | firecrawl_search | Specific named failure with rich literature |
| "cache invalidation horror stories reddit" | firecrawl_search | Forum-flavored — unfiltered war stories |
| "cache hell" | firecrawl_search | Catch-all for cascading-cache-failure stories |
| "stale cache production incident postmortem" | firecrawl_search | Postmortem-flavored, dense practitioner detail |
| "when caching made things worse" | firecrawl_search | Counterintuitive but high-signal |

### Dimension 4 — Tooling (4 queries)
| Query | Source | Rationale |
|-------|--------|-----------|
| "redis vs memcached vs dragonfly 2026" | firecrawl_search | Concrete tool comparison |
| "awesome-caching" | gh search repos | Curated tool surface |
| "cdn cache vs application cache" | firecrawl_search | Layer comparison |
| "next.js cache patterns" | firecrawl_search | Operator builds with Next; surface stack-specific |

### Dimension 5 — Adjacent (2 queries)
| Query | Source | Rationale |
|-------|--------|-----------|
| "when not to use a cache" | firecrawl_search | Boundary — when whole approach is wrong |
| "alternatives to caching for read-heavy" | firecrawl_search | Surface design space (replicas, materialized views, etc.) |

**Total: 18 queries.** Plus 2 local-skills queries on `~/jarvis/skills/` for adjacent existing skills.

---

## Phase 2 — Research Fanout (parallel)

Four agents launched in one message:

- **Web research**: 14 queries → 28 notes saved to `research-corpus/web/`
- **Anthropic docs**: 1 query (Claude best practices for caching) → 1 note (mostly came up empty — caching isn't Claude-specific)
- **Local skills**: scanned `~/jarvis/skills/` → 1 note. Found no direct overlap. Style references: `competitive-intel.md`, `vibecode-app-builder.md`.
- **GitHub code**: 4 queries → 5 notes on top repos (cachetools, hashicorp/golang-lru, awesome-caching, etc.)

**Total corpus**: 35 notes. After dedup: 28 notes.

**Surprise finding**: Several sources flagged "probabilistic early refresh" (XFetch algorithm) as the modern fix for thundering herd — the operator hadn't mentioned this and had been hand-rolling jittered TTL. Worth surfacing in synthesis.

---

## Phase 3 — Synthesis

`synthesis.md` produced. Highlights:

### Section 1 — Patterns (8 extracted)
- Cache-aside (lazy load) — when reads >> writes, OK with brief inconsistency
- Read-through — when consistency matters more than latency on miss
- Write-through — when you can't tolerate cache being stale
- Write-back / write-behind — when write throughput is the bottleneck (rare in app code)
- Stale-while-revalidate — for read-heavy with tolerable mild staleness
- Tagged cache invalidation — for complex object graphs
- Probabilistic early refresh (XFetch) — replaces hand-rolled stampede mitigation
- "No cache" pattern — replicas + materialized views can outperform caching at lower complexity

### Section 2 — Failure Modes (7 extracted)
| Failure | Mechanism | Countermeasure |
|---------|-----------|----------------|
| Thundering herd | All clients miss simultaneously, hammer DB | XFetch probabilistic refresh OR jittered TTL |
| Cache stampede on key contention | Hot key + simultaneous misses | Single-flight lock OR XFetch |
| Stale data (write-aside skew) | Cache + DB updated in different orders | Always invalidate on write, not on read |
| Memory pressure / OOM | Unbounded keyspace | TTL + LRU eviction + monitored hit rate |
| Cache poisoning | Bad data cached, persists | Negative-result TTL + monitoring |
| Wrong layer cached | App-layer cache when CDN would have handled it | Cache at the boundary closest to the consumer |
| "Cache as DB" | Cache becomes critical path, can't be invalidated | If you can't tolerate cache being cold, it's a database |

### Section 4 — Trigger Phrases
Mined: "should I cache X", "TTL for", "what cache strategy", "caching for [feature]", "is caching the right answer", "how do I invalidate", "cache invalidation help"

### Section 6 — Examples (2 constructed from patterns)
1. Read-heavy product catalog, low write rate → cache-aside + stale-while-revalidate + 5-min TTL
2. Real-time feed with personalization → "no cache" pattern, replica + materialized view

### Section 7 — Open Questions
- Operator builds primarily with Next.js — should the skill be Next-specific or general?
- Should the skill recommend specific tools (Redis vs Memcached) or stay layer-agnostic?

**Operator at Gate 2**: *"Looks great. Stay general-purpose, don't lock to Next.js. And include the XFetch finding — I didn't know about that."*

---

## Phase 4 — Drafting

Invoked `anthropic-skills:skill-creator` with the synthesis. It produced:

- `draft/SKILL.md` — 280 lines
- `draft/references/pattern-catalog.md` — detailed pattern reference (the 8 patterns from synthesis section 1, with code structure examples)
- `draft/references/failure-mode-checklist.md` — operational checklist for the 7 failures

Frontmatter description:

```
caching-strategy-designer: Recommend caching strategy when reviewing or designing
a new feature. ALWAYS use when the user asks "should I cache X", "what cache
strategy for [Y]", "TTL for [Z]", "how do I invalidate", "caching for [feature]",
or any question about whether caching is the right approach. Also trigger when
reviewing code that introduces caching, when debugging a stale-data incident,
or when an operator describes a read-heavy workload looking for performance.
This skill emphasizes invalidation strategy, TTL choice, and the boundary case
of "is caching even the right answer here" — three areas where naive caching
advice goes wrong.
```

---

## Phase 5 — QA Loop (3 parallel reviewers)

- **Trigger fidelity**: PASS. 5 mock prompts, 5/5 correct. Note: description is "perhaps slightly over-pushy on the no-trigger side; might pull questions that should go to a tool-config skill" — minor, no fix needed.
- **Completeness**: NEEDS_REVISION. Flagged that the skill didn't cover **CDN-layer caching** as a separate pattern — the synthesis had it but drafting compressed it. Fix: add a 5-line section on layer selection.
- **Format compliance**: PASS with 2 cosmetic fixes — Related section was using untyped wikilinks; convert to typed (`[[part-of::]]` etc.).

Revisions applied. Re-verified trigger fidelity (still PASS).

`qa-report.md` saved.

---

## Phase 6 — Install

**Operator at Gate 3**: *"Yes, install."*

```bash
mv owners-inbox/skill-forge/caching-strategy-designer-2026-05-06/draft \
   ~/jarvis/skills/caching-strategy-designer
```

CLAUDE.md Active Skills Index: appended row.

Memory pointer saved: `reference_skill_caching_strategy_designer.md`.

---

## Final Output

```
~/jarvis/skills/caching-strategy-designer/
├── SKILL.md (280 lines)
├── references/
│   ├── pattern-catalog.md (180 lines, 8 patterns with code structure)
│   └── failure-mode-checklist.md (90 lines, 7 failures with countermeasures)
```

**Total time**: ~25 minutes of active operator time, with ~12 minutes of background research (Phase 2) and ~5 minutes of QA (Phase 5).

**Operator test prompt** (24 hours later): *"Should I cache the user's notification feed?"*
→ Skill fires correctly, recommends "no cache" pattern with replicas + materialized view, flags that caching a personalized feed is one of the named failure modes.

---

## Lessons This Walkthrough Reveals

1. **Phase 2 surprises are gold.** The XFetch finding wasn't on the operator's radar — surfacing it was the highest-value moment in the whole pipeline.
2. **Phase 5 is non-trivial.** Completeness reviewer caught a real gap drafting compressed away. Worth the parallel cost.
3. **Sub-files matter.** SKILL.md stayed at 280 lines because pattern catalog + failure checklist became sub-files. Without that, it would've blown the 500-line soft cap.
4. **Operator gate prevents drift.** Gate 2 corrected scope (general vs Next-specific) before drafting locked it in.

---

## Related

[[part-of::skill-forge]]  [[derived-from::skill-forge-pipeline]]
