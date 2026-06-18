# Spec: [skill-name]

**Date**: [YYYY-MM-DD]
**Operator**: the operator
**Status**: Awaiting Gate 1 approval

---

## skill_name
[snake-case slug, e.g., `cache-strategy-designer`]

## one_line_purpose
This skill helps Claude [verb] when [context], producing [output].

## trigger_phrases
**Should fire on:**
- "[phrase 1]"
- "[phrase 2]"
- "[phrase 3]"
- "[phrase 4]"

**Should NOT fire on (near-misses to disambiguate from adjacent skills):**
- "[near-miss 1]" — handled by [adjacent skill]
- "[near-miss 2]" — handled by [other skill / no skill needed]

## expected_output
- **Shape**: [file / inline response / side effect]
- **Format**: [markdown / docx / code file / etc.]
- **Length**: [approximate]
- **Destination**: [path / chat / external system]

## scope
- [ ] One-shot (single response)
- [ ] Multi-step procedure (sequential)
- [ ] Phased pipeline (with operator gates)
- [ ] Autonomous loop (with success criteria)

[Pick one + 1-line on which]

## pre_existing_material
**Operator's prior knowledge / drafts (verbatim where possible):**

> [Paste what the operator described, with attribution]

**Reference docs / repos / articles operator pointed at:**
- [URL or path] — [what it contains]

## existing_skills_to_check
**Adjacent JARVIS skills:**
- `[skill-name]` — [overlap risk: high/med/low] — [how new skill differs]

## success_criteria
"If I paste '[trigger phrase]', Claude will:
1. [step 1]
2. [step 2]
3. [step 3]
And produce [specific output]."

## out_of_scope
The skill should NOT:
- [Excluded behavior 1] — [reason]
- [Excluded behavior 2] — [reason]

---

## Operator notes
[Anything the operator added that doesn't fit the structured fields]
