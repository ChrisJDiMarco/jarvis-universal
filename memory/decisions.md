# Decisions Memory

> L2 — Loaded on demand. Recent decisions with rationale. Cap: 15,000 chars (recalibrated for Opus 4.7). Prune older decisions when full — older decisions whose rationale no longer informs current work go first.
>
> JARVIS appends here when you make a non-obvious judgment call and the reasoning matters for future context. Empty on first run.

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
[[core]]  [[learnings]]  [[context]]
