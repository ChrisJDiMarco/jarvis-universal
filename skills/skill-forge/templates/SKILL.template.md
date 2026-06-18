---
name: [skill-name]
description: [100–250 word description. Pushy. Lead with what the skill does. List 3–5 specific trigger phrases verbatim. Include alternative phrasings (formal + casual). Mention adjacent / near-miss contexts where it should also fire. Do NOT include implementation detail or which tools it uses internally — that goes in the body. Replace this placeholder with the description from synthesis section 4 + skill-creator's "pushiness" pattern.]
---

# [Skill Name] — [Short Subtitle]

## Goal

[One sentence from spec.one_line_purpose. What this skill enables Claude to do that it can't already.]

---

## When to Trigger

- "[trigger phrase 1]"
- "[trigger phrase 2]"
- "[trigger phrase 3]"
- ...

(Do NOT trigger on "[near-miss phrase]" — that's handled by [adjacent skill / context].)

---

## Hard Rules

1. [Rule 1, in imperative form]. — *Why: [reason from synthesis failure modes]*
2. [Rule 2]. — *Why: [reason]*
3. ...

[Per coding-style.md and skill-creator: explain why, don't just bark MUSTs. Today's models reason well; rigid commands without rationale fail at edge cases.]

---

## Procedure

[For single-shot skills: numbered steps with verification. For multi-phase skills: phase summaries with pointers to sub-files.]

### Step 1 — [name]
[What this step does, what it consumes, what it produces.]

### Step 2 — [name]
...

### Step N — Verification
[Per Karpathy Principle 5: define success criteria. Goal-driven, not imperative.]

---

## Tools You'll Lean On

| Tool | Purpose | Status |
|------|---------|--------|
| [tool] | [one line] | [battle-tested / niche / experimental] |

---

## Examples

### Example 1: [scenario]
**Input**: [...]
**Output**: [...]
**Walk-through**: [...]

### Example 2: [scenario]
[same]

---

## File Inventory (folder skills only)

```
[skill-name]/
├── SKILL.md                — entry point (this file)
├── references/[name].md    — [what, when to load]
└── scripts/[name].py       — [what it does]
```

---

## Common Failure Modes

[From synthesis section 2 — same content as Hard Rules, but reframed as situations the skill should prevent. Optional if Hard Rules already cover this.]

---

## Done = [success criteria]

[Concrete completion criteria from spec.success_criteria.]

---

## Related

[[part-of::[parent-system]]]  [[depends-on::[external-tool]]]  [[related-to::[adjacent-skill]]]
