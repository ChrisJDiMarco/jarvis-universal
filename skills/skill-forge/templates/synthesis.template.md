# Synthesis: [skill-name]

**Date**: [YYYY-MM-DD]
**Corpus size**: NN notes
**Sources covered**: web=N, anthropic-docs=N, local-skills=N, github=N

---

## 1. Concrete Patterns
*Named techniques with clear triggers. Becomes the skill's procedure / how-to section. Aim for 5–15.*

### Pattern: [name]
- **When to apply**: [trigger condition]
- **Technique**: [the actual pattern, 2–4 sentences]
- **Source**: [research-corpus/web/note-NN.md, line N or section title]

### Pattern: [name]
- **When to apply**: ...
- **Technique**: ...
- **Source**: ...

[continue for each pattern]

---

## 2. Failure Modes
*Anti-patterns and mistakes. Becomes the skill's Hard Rules / Guardrails section. Aim for 5–10.*

| Failure | Mechanism | Countermeasure | Source |
|---------|-----------|----------------|--------|
| [Failure 1] | [Why it happens] | [What to do instead] | [note-NN] |
| [Failure 2] | ... | ... | ... |

---

## 3. Tools & References
*Specific tools the skill should mention by name.*

| Tool | Purpose | Status | When to use | Source |
|------|---------|--------|-------------|--------|
| [tool-name] | [one line] | [battle-tested / niche / experimental / abandonware] | [conditions] | [note-NN] |

**Cross-reference with JARVIS infra**: [list any existing MCPs / skills / scripts the skill should defer to instead of recommending alternatives]

---

## 4. Trigger Phrases
*Mined from operator's spec, forum posts, adjacent skills, and natural-language variations.*

**Should fire on:**
- "[phrase 1]" — *source: operator spec*
- "[phrase 2]" — *source: forum thread / blog title pattern*
- "[phrase 3]" — *source: adjacent skill style*
- ...

**Should NOT fire on (near-misses for description optimization):**
- "[near-miss 1]" — handled by [adjacent skill / different tool]
- "[near-miss 2]" — explanation request, not a build request

---

## 5. Step-by-Step Procedures
*Concrete sequences from real implementations.*

### Procedure A: [name]
**Source**: [note-NN]
1. [step]
2. [step]
3. [step]

**Edge cases**: [where this procedure breaks]

### Procedure B: [name] (variant)
**Source**: [note-NN]
[steps]

**When to prefer this variant over Procedure A**: [conditions]

---

## 6. Worked Examples
*At least 2. Mark constructed examples explicitly.*

### Example 1: [scenario name]
**Type**: [real / constructed-from-pattern-X]
**Input**: [what the operator / system provides]
**Output**: [what the skill produces]
**Walk-through**: [3–5 sentences on how the skill handled this]

### Example 2: [scenario name]
[same structure]

---

## 7. Open Questions for Operator
*Anything the corpus didn't resolve — flag for Gate 2 conversation.*

- [Question 1] — [why it matters, what answers would change]
- [Question 2] — ...
- [Contradictions: source A says X, source B says Y — operator should decide]

---

## 8. Suggested SKILL.md Structure
*The bridge to Phase 4 drafting. Show how each piece of synthesis maps to a SKILL.md section.*

```markdown
# [skill-name]

## Goal
[from spec.one_line_purpose]

## When to Trigger
[from synthesis section 4 — should-fire list]

## Hard Rules
[from synthesis section 2 — failure modes converted to imperatives]

## Procedure / Phases
[from synthesis section 5 — step-by-step procedures]
[+ section 1 patterns as decision points within procedures]

## Tools You'll Lean On
[from synthesis section 3]

## Examples
[from synthesis section 6]

## File Inventory
[if folder skill: list sub-files]

## Related
[edge convention links]
```

**Sub-files needed (if any)**:
- `references/[name].md` — [what it contains, when to load]
- `scripts/[name].py` — [what it does — only if a deterministic helper would beat re-deriving inline]

---

## Synthesis confidence
- **High-confidence sections**: [list]
- **Lower-confidence sections** (operator should review extra carefully): [list]
- **Constructed-not-researched content**: [list — examples especially]
