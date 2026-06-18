# QA Protocol — Phase 5

**Goal**: Three parallel reviewers stress-test the draft from three angles. Synthesize findings into a single revision pass.

**Output**: revised `draft/SKILL.md` + `qa-report.md` documenting what was caught and fixed.

---

## Why Three Reviewers

Each reviewer answers a different question. A single reviewer trying to answer all three does any of them poorly.

| Reviewer | Question it answers | Why this dimension matters |
|----------|---------------------|----------------------------|
| **Trigger fidelity** | Would Claude actually invoke this skill on the right prompts? | A skill that never fires is worthless regardless of body quality. |
| **Completeness** | Are there obvious gaps a domain expert would flag? Edge cases missing? | Body quality. Did we capture the right material from the corpus? |
| **Format compliance** | Does it match anthropic-skills:skill-creator standards? Frontmatter, progressive disclosure, file size? | Cosmetics, but they affect every future maintainer / reader. |

All three run in parallel via `Agent` tool calls in a single message.

---

## Reviewer 1 — Trigger Fidelity

**Subagent**: `general-purpose`.
**Tools**: Read, that's it. (This is a paper review.)

Prompt:

```
You are the trigger-fidelity reviewer for a forged skill.

Skill draft path: ~/jarvis/owners-inbox/skill-forge/[slug]-[date]/draft/SKILL.md
Synthesis (for context): ~/jarvis/owners-inbox/skill-forge/[slug]-[date]/synthesis.md

Your job: assess whether Claude would actually invoke this skill on the right prompts.

Procedure:
1. Read the SKILL.md frontmatter description.
2. Read the synthesis section 4 (trigger phrases).
3. For each of these 5 mock prompts, judge whether the description would cause
   Claude to consult this skill (yes / no / borderline):

   Mock prompts (generate based on the skill's domain):
   - 2 phrasings that should trigger (one formal, one casual)
   - 1 phrasing that uses adjacent terminology but should still trigger
   - 1 phrasing that's a near-miss — should NOT trigger (something an adjacent skill handles)
   - 1 phrasing that's tangentially related — should NOT trigger

4. For each prompt, write: [prompt] → [judgment] → [why]

5. Surface the 1-2 highest-leverage description fixes if anything fails to trigger or
   over-triggers. Specific edits, not vague feedback.

Output format:
## Trigger Fidelity Review

### Mock Prompts
| Prompt | Should trigger? | Predicted? | Rationale |
|--------|-----------------|------------|-----------|

### Issues found
[Specific issues with description, with proposed fixes]

### Verdict
PASS / NEEDS_REVISION
```

A description that misses on the should-trigger cases is a higher-priority fix than one that over-triggers (we can refine boundaries later; we can't make a never-firing skill useful).

---

## Reviewer 2 — Completeness

**Subagent**: `general-purpose` (Opus model preferred for domain reasoning).
**Tools**: Read.

Prompt:

```
You are the completeness reviewer for a forged skill.

Skill draft path: ~/jarvis/owners-inbox/skill-forge/[slug]-[date]/draft/SKILL.md
Synthesis: ~/jarvis/owners-inbox/skill-forge/[slug]-[date]/synthesis.md
Spec: ~/jarvis/owners-inbox/skill-forge/[slug]-[date]/spec.md

Your job: imagine you are a domain expert in [skill domain] reviewing this for someone
who would rely on it. What's missing?

Procedure:
1. Read all three documents.
2. Walk through the skill's procedure / phases. For each step, ask:
   - Is this step's input clearly defined?
   - Is the success criteria for this step verifiable?
   - What edge cases might break this step? Are they addressed?
   - What tools does this step rely on? Are they cited correctly?

3. Identify gaps in:
   - Failure modes (Hard Rules section) — anything obvious missing?
   - Tool references — anything cited that's actually wrong / outdated / abandonware?
   - Examples — are they representative, or do they miss the typical case?
   - Edge cases — what if the input is empty / malformed / oversized / multi-language?

4. Cross-check synthesis section 7 (open questions) — did the draft handle those, or
   did it punt?

Output format:
## Completeness Review

### Step-by-step audit
[For each phase / step, note any gap or weakness]

### Gaps identified
1. [Specific gap] — [proposed addition]
2. ...

### Tool / reference issues
[Anything wrong, outdated, or abandonware]

### Verdict
PASS / NEEDS_REVISION

If NEEDS_REVISION, prioritize: which 2-3 fixes are highest-leverage?
```

---

## Reviewer 3 — Format Compliance

**Subagent**: `Explore`.
**Tools**: Read, Glob.

Prompt:

```
You are the format-compliance reviewer for a forged skill.

Skill draft path: ~/jarvis/owners-inbox/skill-forge/[slug]-[date]/draft/

Your job: confirm the draft matches anthropic-skills:skill-creator standards and
JARVIS house style.

Reference files:
- /var/folders/.../anthropic-skills/skill-creator/SKILL.md (canonical format guidance)
- ~/jarvis/skills/competitive-intel.md (JARVIS house style, single-file)
- ~/jarvis/skills/elite-web-ui/SKILL.md (JARVIS house style, folder skill)

Check the draft against:

1. Frontmatter
   - [ ] Has `name` field (snake-case, matches folder name)
   - [ ] Has `description` field (100-250 words, pushy, includes trigger phrases)
   - [ ] No extraneous frontmatter fields beyond name / description / compatibility

2. Progressive disclosure
   - [ ] SKILL.md is < 500 lines (soft cap), absolute < 800
   - [ ] Detail is in sub-files (references/, scripts/, agents/, assets/) where appropriate
   - [ ] Sub-files are pointer-referenced from SKILL.md, not duplicated inline

3. Section structure
   - [ ] Goal / one-liner near top
   - [ ] When-to-trigger section
   - [ ] Hard Rules / guardrails section
   - [ ] Procedure / phases / how-to section
   - [ ] Examples section
   - [ ] File inventory (if folder skill)
   - [ ] Related section (edge convention) at bottom

4. Voice / tone
   - [ ] Imperative form predominantly
   - [ ] Explains WHY where it asks for behavior, not just MUSTs
   - [ ] No "this skill is amazing" marketing copy
   - [ ] Matches the voice of competitive-intel.md / elite-web-ui/SKILL.md

5. Edge convention
   - [ ] Related section uses typed wikilinks: [[part-of::]], [[depends-on::]], etc.

6. JARVIS conventions
   - [ ] Skill name doesn't conflict with existing skill in ~/jarvis/skills/ (run Glob)
   - [ ] Trigger phrases align with how JARVIS already routes context (CLAUDE.md table)

Output format:
## Format Compliance Review

### Checklist results
[Pass/fail per check]

### Specific fixes required
1. [Issue] — [proposed fix, with line number / section]
2. ...

### Verdict
PASS / NEEDS_REVISION
```

---

## Launch the Three in Parallel

Single message, three `Agent` calls:

```
[Agent: trigger-fidelity, prompt: ..., subagent_type: general-purpose]
[Agent: completeness, prompt: ..., subagent_type: general-purpose, model: opus]
[Agent: format-compliance, prompt: ..., subagent_type: Explore]
```

Wait for all three to return. Don't move on with partial results — completeness without trigger fidelity gives a great-content skill that never fires; trigger fidelity without completeness gives a great-firing skill that's hollow.

---

## Synthesizing Reviewer Findings

After all three return, write `qa-report.md`:

```markdown
# QA Report: [skill-name]
Date: [YYYY-MM-DD]

## Reviewer 1 — Trigger Fidelity: [PASS / NEEDS_REVISION]
[Issues + proposed fixes]

## Reviewer 2 — Completeness: [PASS / NEEDS_REVISION]
[Issues + proposed fixes]

## Reviewer 3 — Format Compliance: [PASS / NEEDS_REVISION]
[Issues + proposed fixes]

## Consolidated Fix List
1. [Fix] — [which reviewer flagged it] — [proposed change]
2. ...

## Plan
- Fix 1-N in order [or in parallel where independent]
- Re-verify trigger fidelity if frontmatter changes
```

---

## Apply Fixes — One Pass

Apply all fixes in a single revision pass on the draft. Use `Edit` tool for surgical changes — never rewrite the whole file.

After fixes:
- If only Reviewer 3 flagged issues (cosmetic) → save and proceed to Gate 3.
- If Reviewer 1 (trigger) flagged issues → re-run Reviewer 1 only on the revised description before Gate 3. Trigger fidelity is the load-bearing field.
- If Reviewer 2 (completeness) flagged a deep gap that requires more research → surface to operator: *"Reviewer found a gap that needs another research query. Want me to run it (5 more min) or proceed with the gap documented?"*

---

## Hard Rules

- **All three reviewers run in parallel.** Sequential review wastes time and biases later reviewers with earlier findings.
- **Fix before showing to operator.** Don't put the operator in the position of choosing between QA findings — synthesize them, fix, then show the cleaner draft at Gate 3.
- **Don't re-draft from scratch.** Edit the existing draft. Re-drafting after QA loses the synthesis-driven content.
- **One pass per cycle.** If Reviewer 1 fails after revision, escalate to operator — don't loop indefinitely.

---

## When QA Reveals "This Skill Shouldn't Be Built"

Rare but real. If Reviewer 2 (completeness) surfaces that the skill's premise is fundamentally flawed (e.g., the domain has no stable patterns, or the operator's intended use case is solved by an existing tool), surface that to the operator at Gate 3 explicitly:

*"QA found a structural issue: [explanation]. Two options: (a) narrow the skill's scope to [subset], (b) abandon and use [alternative]. Which?"*

It's better to kill a bad skill at Phase 5 than ship it.

---

## Related

[[part-of::skill-forge]]  [[preceded-by::drafting-protocol]]  [[followed-by::install-protocol]]
