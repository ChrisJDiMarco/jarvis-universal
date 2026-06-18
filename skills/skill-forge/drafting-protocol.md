# Drafting Protocol — Phase 4

**Goal**: Hand the synthesis to `anthropic-skills:skill-creator` and let it produce the canonical SKILL.md. Then inject the synthesis content into the right sections.

**Output**: `owners-inbox/skill-forge/[slug]-[date]/draft/SKILL.md` (+ any sub-files).

---

## Why We Defer to anthropic-skills:skill-creator

skill-creator is the canonical assembler. It encodes:
- Frontmatter format (name, description, optional compatibility)
- Description "pushiness" pattern (so the skill triggers reliably)
- Progressive disclosure (SKILL.md < 500 lines, sub-files for detail)
- Eval scaffolding (evals.json structure, test prompt patterns)
- Description optimization loop (the run_loop.py pipeline)

Re-deriving any of those from training is lossy. We use the proven assembler for *structure* and inject our researched content for *substance*.

---

## Step 1 — Invoke skill-creator

Call the skill via the `Skill` tool:

```
Skill(skill: "anthropic-skills:skill-creator")
```

When skill-creator loads, it'll go into its standard "create a skill" flow. Provide it the inputs from synthesis upfront so it doesn't re-ask:

```
I'm building a skill named [skill-name] using the skill-forge meta-pipeline.

Here's the synthesis (pre-extracted from research):
[paste synthesis.md sections 1-8]

The operator already approved this synthesis at Gate 2. We don't need to re-interview
or run the full eval loop right now — we'll do that as a follow-up step.

For this pass:
1. Generate the SKILL.md frontmatter (name, description) per skill-creator's guidance.
   Use the trigger phrases from synthesis section 4 to inform the description's
   "pushiness" pattern.
2. Structure the SKILL.md body using the synthesis section 8 skeleton.
3. Recommend sub-files (references/, scripts/, assets/, agents/) where the
   synthesis suggests load-bearing detail belongs.
4. Save the draft to: ~/jarvis/owners-inbox/skill-forge/[slug]-[date]/draft/

Skip: evals.json scaffolding for now (we'll add in a follow-up loop if needed),
description optimization loop (do that after the operator approves the draft at Gate 3).
```

skill-creator will produce a SKILL.md draft. It may also propose sub-file scaffolding — accept its proposals unless they contradict the synthesis.

---

## Step 2 — Inject Synthesis Content

Skill-creator gets the structure right; we ensure the substance is fully migrated. Walk through each section:

### Section: Frontmatter description

Verify:
- Includes the "what does this do" + "when to trigger" pattern
- Pushy enough (mentions specific trigger phrases, common alternative phrasings)
- 100–250 words
- Does NOT contain implementation detail (that goes in the body)

If skill-creator's draft is too thin, expand using synthesis trigger phrases.

### Section: Goal / one-liner at top of body

One sentence. From spec.md `one_line_purpose`.

### Section: When to Trigger

Bullet list. Use the synthesis trigger phrases (section 4). Include the should-NOT-fire near-misses as a counter-example, e.g.:

```markdown
## When to Trigger
- "build me X for [domain]"
- "design [thing] for production"
- ...

(Do NOT trigger on bare "what is [domain]?" — that's an explanation request, not a build request.)
```

### Section: Hard Rules / Rules

This is the synthesis section 2 (failure modes), restructured as imperatives:

```markdown
## Hard Rules

1. [Failure 1's countermeasure as imperative]. — [why]
2. [Failure 2's countermeasure]. — [why]
...
```

Per `coding-style.md` and skill-creator guidance: explain the *why*, don't just bark `MUST` / `NEVER`. Today's models reason well; rigid commands without rationale fail at edge cases.

### Section: Procedure / Phases / How To

The skill's load-bearing operational content. Comes from synthesis section 5 (procedures) + section 1 (patterns).

If the skill is single-shot, structure as a numbered procedure with verification steps (per Karpathy Principle 5: goal-driven execution).

If the skill is multi-phase (like skill-forge itself), structure as phases with their own protocol files. Use this folder skill's own structure as a model.

### Section: Tools & References

From synthesis section 3. Format as a table:

```markdown
## Tools You'll Lean On
| Tool | Purpose | Status |
|------|---------|--------|
| firecrawl_search | Web research | Battle-tested |
| ... |
```

### Section: Examples

From synthesis section 6. Mark constructed examples explicitly. Use input → output format where possible.

### Section: File Inventory

If sub-files were created, list them with one-line descriptions:

```markdown
## File Inventory
- SKILL.md — entry point
- references/[name].md — [what it contains, when to load]
```

### Section: Related (edge convention)

Per JARVIS edge convention. Include `[[part-of::]]`, `[[preceded-by::]]`, `[[depends-on::]]` etc. as relevant.

---

## Step 3 — Sub-File Generation

If synthesis section 3 (Tools & References) lists detailed reference material, write it to sub-files instead of bloating SKILL.md.

Heuristic: if a reference would add >50 lines to SKILL.md, move it to `references/[topic].md`. SKILL.md keeps a one-line pointer + when-to-load instruction.

Example:

```markdown
<!-- in SKILL.md -->
For the full caching pattern catalog with code examples, read `references/cache-patterns.md`.
Load that file only when implementing — not when answering generic questions.
```

Sub-file convention:
- `references/` — docs loaded on demand
- `scripts/` — executable code (deterministic helpers)
- `assets/` — templates, icons, fonts
- `agents/` — sub-agent prompts (if the skill spawns specialized agents, like skill-forge does)

---

## Step 4 — Frontmatter Description Quality Check

The description is the single most important field for triggering reliability. Run this checklist:

- [ ] Starts with what the skill does (action verb)
- [ ] Lists 3–5 specific trigger phrases verbatim
- [ ] Includes alternative phrasings (formal + casual)
- [ ] Mentions adjacent / near-miss contexts where it should also fire
- [ ] Does NOT mention contexts where it should NOT fire (those go in SKILL.md body)
- [ ] 100–250 words
- [ ] No implementation detail (no "uses X tool", "calls Y MCP")
- [ ] Reads like a skill description, not a marketing tagline

If any check fails, revise before saving.

---

## Step 5 — Save Draft

Save to `owners-inbox/skill-forge/[slug]-[date]/draft/`. Folder structure mirrors what the skill will look like once installed:

```
draft/
├── SKILL.md
├── references/  (if needed)
├── scripts/     (if needed)
├── agents/      (if needed)
└── assets/      (if needed)
```

Don't save to `~/jarvis/skills/[name]/` yet — that's Phase 6 (Install). Drafts live in owners-inbox until Gate 3 approves them.

---

## Hard Rules

- **One drafting pass per Gate 3 cycle.** If QA (Phase 5) flags issues, fix and re-show. Don't silently re-draft and present a different skill than what the operator saw at synthesis.
- **Don't re-research in this phase.** If you find a gap during drafting, note it for Gate 3. Re-running research in the middle of drafting is scope creep.
- **Match house style.** Run `Glob ~/jarvis/skills/*.md` and pick 2 well-built skills (e.g., `competitive-intel.md`, `vibecode-app-builder.md`). Match their formatting voice — tone, header level, edge convention usage.
- **Don't bloat SKILL.md.** 500 lines is the soft cap, 800 is the hard cap. Push detail into sub-files past 400 lines.
- **Don't use anthropic-skills:skill-creator's eval loop yet.** That's a follow-up after Gate 3. Eval-driven iteration on a skill the operator hasn't even approved yet is wasted compute.

---

## When skill-creator Is Unavailable

If the `anthropic-skills:skill-creator` skill isn't installed or accessible, fall back to using `templates/SKILL.template.md` as the skeleton. Manually fill in each section using the synthesis. Match house style by referencing 2 existing JARVIS skills.

This fallback produces a slightly less polished frontmatter (since skill-creator's "pushiness" pattern is lossy to re-derive), but the body content quality is identical because synthesis is the load-bearing input.

---

## Related

[[part-of::skill-forge]]  [[preceded-by::synthesis-protocol]]  [[followed-by::qa-protocol]]  [[depends-on::anthropic-skills:skill-creator]]
