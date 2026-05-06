# Decisions Memory

> L2 — Loaded on demand. Cap: 15,000 chars (recalibrated for Opus 4.7).
>
> **As of 2026-05-05**: New decisions should be written as atomic files under `memory/decisions/YYYY-MM-DD-slug.md` (Infinite Brain pattern — see `memory/decisions/INDEX.md`). This file remains valid for short decisions (< 5 lines) that don't warrant their own atomic node, and as a fallback when the atomic pattern is overkill. Existing entries below are NOT being migrated — adopt the atomic pattern going forward.

## Atomic decisions (preferred)

→ `memory/decisions/` — one file per decision, individually queryable, with typed edges.

## Inline decisions (fallback for short ones, plus historical entries)

Entry format:

```
## YYYY-MM-DD — <decision title>
**Decision**: [What was chosen]
**Alternatives considered**: [What else was on the table]
**Rationale**: [Why this choice]
**Expected outcome**: [What success looks like]
**Revisit when**: [Conditions that would warrant revisiting — a date, a milestone, or a signal]
```

---

## Related
[[supports::core]]  [[derived-from::learnings]]  [[depends-on::context]]  [[part-of::decisions/INDEX]]
