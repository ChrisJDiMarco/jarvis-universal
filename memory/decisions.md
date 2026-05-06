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

## 2026-05-05 — Prioritize JARVIS Control Plane Before Voice/Avatar Layers
**Decision**: Treat the missing command-center/control-plane layer as the next major JARVIS evolution before building War Room voice, avatar, or meeting assistant features.
**Alternatives considered**: Leave JARVIS as a terminal-native agent repo; build voice/avatar features first; build channel bots without a shared mission queue.
**Rationale**: The ClaudeClaw guide and Chase AI agentic OS video both point to the same bottleneck: memory and skills are not enough if the system lacks accessible surfaces, mission state, security gates, and a safe runner. Voice and meeting layers depend on the same queue/runner/security contracts, so building them first would create duplicated plumbing.
**Expected outcome**: JARVIS gains a dashboard-first OS shell with missions, agents, skills, memory, schedules, channel gateways, usage/cost visibility, and a kill switch.
**Revisit when**: A dashboard MVP can launch or enqueue missions safely from localhost and at least one external channel can create a mission through the same contract.

## Related
[[supports::core]]  [[derived-from::learnings]]  [[depends-on::context]]  [[part-of::decisions/INDEX]]
