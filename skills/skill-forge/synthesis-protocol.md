# Synthesis Protocol — Phase 3

**Goal**: Collapse the research corpus into a single distilled brief that the drafting phase can mechanically convert into SKILL.md sections. This is the highest-leverage step in the entire pipeline.

**Output**: `owners-inbox/skill-forge/[slug]-[date]/synthesis.md` using `templates/synthesis.template.md`.

**Gate**: 🚧 Operator must approve the synthesis before drafting (Gate 2).

---

## Why This Step Exists

The corpus from Phase 2 is 20–40 notes — too much to feed directly into SKILL.md drafting and too unstructured to act on. Synthesis distills it into the **six fields the SKILL.md actually needs**:

1. Concrete patterns (→ procedure section)
2. Failure modes (→ rules / hard stops section)
3. Tools & references (→ file inventory and references)
4. Trigger phrases (→ frontmatter description)
5. Step-by-step procedures (→ phase / step sections)
6. Worked examples (→ examples section)

Skip synthesis and the SKILL.md ends up either too vague (no concrete content) or too noisy (everything dumped in).

---

## Who Writes the Synthesis

**One agent.** Not parallel. Synthesis requires holistic reading — every note influences how every field is shaped. Parallel synthesizers contradict each other.

**Use Opus.** This is the highest-leverage step. Sonnet works in a pinch, but Opus's pattern-recognition across 20+ notes is meaningfully better.

If `Agent` tool is unavailable, do the synthesis inline (single agent reading the corpus directly).

---

## Synthesis Procedure

### Step 1 — Read the entire corpus in one pass

The agent reads:
- All notes in `research-corpus/web/`
- All notes in `research-corpus/anthropic-docs/`
- All notes in `research-corpus/local-skills/`
- All notes in `research-corpus/github/`
- The original `spec.md` (re-anchor on what the operator actually wanted)

Don't skim. Read.

### Step 2 — Extract Field 1: Concrete Patterns

These become the skill's procedure / how-to section.

**What counts as a pattern**:
- A named technique with a clear trigger ("use cache-aside when reads >> writes")
- A specific sequence of steps ("first scrape pricing page, then validate against G2 reviews")
- A heuristic with a threshold ("if >5 levels nested, refactor")
- A decision tree ("if SaaS hero → CSS 3D mockup; if portfolio → Three.js")

**What doesn't count**:
- Generic platitudes ("write good code")
- Vendor marketing claims ("our tool is 10x faster")
- Untested speculation ("you could probably try X")

For each pattern, capture: name, when-to-apply trigger, the technique itself, source citation.

Aim for 5–15 patterns. Fewer = skill is too vague. More = skill is bloated and the patterns aren't actually distinct.

### Step 3 — Extract Field 2: Failure Modes

These become the Rules / Hard Stops section. They're the highest-leverage content — half a skill's value is preventing known mistakes.

For each failure mode, capture:
- The failure (concrete, specific)
- Why it happens (mechanism)
- The countermeasure (what to do instead)
- Source

Format:

| Failure | Mechanism | Countermeasure | Source |
|---------|-----------|----------------|--------|
| Cache stampede on TTL expiry | All requests miss simultaneously, hammer DB | Use jittered TTL or probabilistic early refresh | [link] |

Aim for 5–10 failure modes. If the corpus only surfaces 2–3, the topic might not have well-known anti-patterns yet (rare) or research was too thin (common — go back to Phase 2 with failure-flavored queries).

### Step 4 — Extract Field 3: Tools & References

These become the file inventory and references section.

For each tool/library mentioned in the corpus:
- Name
- What it does (one line)
- Status (battle-tested / niche / experimental / abandonware)
- When to use it / when not to
- Source

Cross-reference against existing JARVIS infrastructure: if the operator already has a connected MCP for this domain, the skill should prefer it over alternatives.

### Step 5 — Extract Field 4: Trigger Phrases

The single most important field for whether the skill ever fires.

Sources for trigger phrases:
- The operator's own phrasing in spec.md (highest weight — they'll use these)
- Forum / Reddit / blog posts where practitioners describe this task in their own words
- Adjacent JARVIS skills' frontmatter descriptions (matches house style)
- Variations: formal, casual, action-verb-led, declarative-led

Output 5–10 trigger phrases, plus 2–3 should-NOT-trigger near-misses to clarify the boundary. The near-misses help the description optimization phase later.

### Step 6 — Extract Field 5: Step-by-Step Procedures

If the skill is procedural (most are), the corpus should yield concrete sequences. Extract them.

Format:

```
## Procedure: [name]
Source: [citation]
1. [step]
2. [step]
3. [step]

Notes: [edge cases, when this procedure breaks]
```

Multiple procedures from different sources are good — the SKILL.md can present the canonical one and reference variants.

### Step 7 — Extract Field 6: Worked Examples

At least 2 examples, ideally with input → output pairs. These ground the skill in concrete usage and give future-Claude something to pattern-match against.

If the corpus doesn't yield examples, **construct them** from patterns + procedures. Mark constructed examples explicitly: *"(constructed from pattern X + procedure Y)"*. Future-Claude treats those differently from real-world examples.

---

## Output: synthesis.md Structure

Use `templates/synthesis.template.md`. Required sections:

```markdown
# Synthesis: [skill-name]
Date: [YYYY-MM-DD] | Corpus size: NN notes | Sources covered: web=N, docs=N, local=N, github=N

## 1. Concrete Patterns
[5-15 patterns with name, trigger, technique, citation]

## 2. Failure Modes
[5-10 failures with mechanism, countermeasure, citation]

## 3. Tools & References
[List of specific tools with status + when-to-use]

## 4. Trigger Phrases
- Should fire on: [list]
- Should NOT fire on (near-misses): [list]

## 5. Step-by-Step Procedures
[Procedures with sources]

## 6. Worked Examples
[At least 2, marked real or constructed]

## 7. Open Questions for Operator
[Things the corpus didn't resolve — flag for Gate 2]

## 8. Suggested SKILL.md Structure
[A skeleton showing how the above maps to SKILL.md sections]
```

---

## Hard Rules

- **One pass only.** Don't iterate on the synthesis 5 times trying to make it perfect. One thoughtful pass, then send to operator at Gate 2 for feedback.
- **Cite every load-bearing claim.** A pattern, failure mode, or tool without a source is a hallucination risk. Cite or cut.
- **Distinguish operator-knowledge from researched-knowledge.** Things the operator told you in Phase 0 should be marked explicitly — they're often more reliable than web sources for *this operator's context*.
- **Surface contradictions.** If two sources disagree (e.g., one says "always use Redis," another says "Memcached for X"), surface the disagreement in section 7. Don't silently pick a side.
- **Pre-fill the SKILL.md skeleton.** Section 8 is critical — it's the bridge to Phase 4. Show how each piece of the synthesis maps to a SKILL.md section so drafting is mechanical, not creative.

---

## Operator Gate (Gate 2)

After saving synthesis.md, show the operator:

```
Synthesis complete: owners-inbox/skill-forge/[slug]-[date]/synthesis.md

Quick read of the highlights:
- [N] concrete patterns extracted
- [N] failure modes captured (becomes the Rules section)
- [N] tools/libs surfaced
- [N] trigger phrases proposed
- [N] worked examples (real / constructed)

[Open questions if any]

This is the load-bearing artifact — the draft will be built mechanically from this.
Take a look. If anything's missing, off, or you want to add operator-specific context,
tell me now. Otherwise, I'll move to drafting.
```

🚧 **GATE 2**: Wait for explicit approval. If operator flags gaps, decide: (a) one more targeted research query → revise synthesis, or (b) push to Phase 4 with the gaps documented as known-limitations.

---

## When Synthesis Reveals "Don't Build This Skill"

Sometimes the corpus surfaces that the operator's intended skill is:

- Already covered by an existing JARVIS skill (Phase 2 local-skills agent should catch this — but synthesis confirms)
- Better solved by a tool/MCP than a skill (e.g., "monitor X" → use the existing scheduled-tasks MCP)
- Too narrow to justify a skill (one-off task, not a repeated pattern)

In those cases, surface the finding to the operator instead of forcing a skill into existence: *"Based on what we found, you might not need a new skill here — [existing thing] already does this. Want me to walk you through it instead?"*

This is the integrity check on the entire pipeline. The skill we don't build is sometimes the most valuable output.

---

## Related

[[part-of::skill-forge]]  [[preceded-by::fanout-protocol]]  [[followed-by::drafting-protocol]]
