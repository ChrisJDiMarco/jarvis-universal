# Skill: Four C's Audit

## Trigger
"four c's audit", "4cs audit", "audit my AIOS", "AIOS health check", "score my agentic OS", "AI OS readiness"

## Origin
Adapted from Nate Herk's AIOS framework (May 2026 walkthrough). Nate's `audit` skill grades a Claude Code AIOS against four ordered pillars — Context → Connections → Capabilities → Cadence — and saves a score over time so the operator can see whether the system is improving. JARVIS already has each pillar wired in better infrastructure (memory layers, MCP registry, ECC sub-team, scheduled-tasks). This skill adds the missing layer: a tracked, graded scorecard so progress is visible, not vibes.

## Goal
Score the current state of JARVIS across the four C's, identify the single highest-leverage gap, save the run to `logs/audits/` so trends are visible, and return a one-screen verdict.

> Distinct from `agent-infrastructure-audit` (which finds friction points across tools) and `grade` (which judges a specific completed deliverable). Four C's audit grades the **OS itself**.

---

## The Four C's

| Pillar | Question it answers | Where it lives in JARVIS |
|--------|--------------------|--------------------------|
| **Context** | What does JARVIS know about me, my work, my voice, my goals? | `memory/core.md`, `L1-critical-facts.md`, `context.md`, `relationships.md`, `wiki/` |
| **Connections** | What data can it actually reach? | Live Integrations table in CLAUDE.md, available MCPs, API references in `references/` |
| **Capabilities** | What can it produce — what skills exist that match my real workflows? | `skills/`, `.claude/agents/`, `skills/ecc/` |
| **Cadence** | What runs without me? What loops? | `skills/persistent-daemon.md`, `skills/heartbeat.md`, scheduled tasks, cloud routines |

Pillars build on each other in order. A 90/100 in Cadence with 30/100 in Context is a system that confidently does the wrong thing.

---

## Scoring Protocol (25 points per pillar = 100 total)

### Context (25 pts)
- 5 — `memory/core.md` exists and is populated (not template)
- 5 — `L1-critical-facts.md` is current (last edit < 30 days)
- 5 — At least one populated domain file (`context.md`, `relationships.md`, project memory)
- 5 — Voice/style captured (writing samples, brand voice, tone)
- 5 — Priorities for current quarter/sprint stored and readable

### Connections (25 pts)
- 5 — At least 3 of the 7 tier-1 buckets (revenue, customer, calendar, comms, tasks, meetings, knowledge) reachable
- 5 — Comms reachable (Gmail, Slack, iMessage, or equivalent)
- 5 — Calendar reachable
- 5 — Tasks/PM reachable (Linear, Asana, ClickUp, Notion, etc.)
- 5 — At least one knowledge source reachable (Notion, Drive, NotebookLM, semantic-code-search)

### Capabilities (25 pts)
- 5 — At least 3 custom skills built for repeatable personal workflows (not just defaults)
- 5 — At least one skill calls a real connection (not just web search)
- 5 — Skills index exists and is up to date (CLAUDE.md or `skills/INDEX.md`)
- 5 — At least one sub-agent or specialist exists in `.claude/agents/`
- 5 — Recent skill iteration (any skill edited within 14 days = live, evolving system)

### Cadence (25 pts)
- 5 — At least one scheduled/automated task is live (`list_scheduled_tasks` returns ≥1)
- 5 — A morning briefing or daily-loop skill exists
- 5 — A weekly review or end-of-week skill exists
- 5 — Heartbeat / proactive monitoring is configured (silent if clean, alert if action needed)
- 5 — Logs are being written (`logs/daily-activity.md`, scheduled-task history)

---

## Process

### 1. Scan
- Read `CLAUDE.md` for the routing tables and skill index
- `ls memory/` to confirm files exist + check mtimes
- `ls skills/` and count custom skills (exclude `ecc/` defaults)
- `ls .claude/agents/` for specialists
- Run `list_scheduled_tasks` to count active automations
- Check `logs/daily-activity.md` for last entry

### 2. Score each pillar
Walk the 5 checks above. Each is binary (5 pts or 0). No half-credit — forces honesty.

### 3. Compute and grade
- 90–100 = A (operating system, not toy)
- 75–89 = B (solid foundation, gaps known)
- 60–74 = C (works but leaky)
- 45–59 = D (early — keep building)
- < 45 = F (rebuild from CLAUDE.md scaffold)

### 4. Identify the single highest-leverage gap
Not the lowest-scoring pillar — the one where +5 points unlocks the most downstream value. Often Context or Connections, even if Cadence scores worst, because Cadence without Context = automated noise.

### 5. Save the run
Append to `logs/audits/YYYY-MM-DD.md`:
```markdown
# Four C's Audit — {ISO date}

| Pillar | Score | Notes |
|--------|-------|-------|
| Context | X/25 | ... |
| Connections | X/25 | ... |
| Capabilities | X/25 | ... |
| Cadence | X/25 | ... |
| **Total** | **X/100** | Grade: {A-F} |

## Highest-leverage gap
{one paragraph}

## Top 3 next moves (ranked)
1. ...
2. ...
3. ...
```

Also append a one-line summary to `logs/audits/INDEX.md`:
```
2026-05-06 — 78/100 (B) — gap: Capabilities (no skill for revenue tracking)
```

### 6. Deliver
Return the table + grade + highest-leverage gap + 3 ranked moves. Skip everything else. The history file is where trends live; the chat answer is the verdict.

---

## Rules
- **Score honestly, not generously.** Every pillar is 5 binary checks; resist the urge to round up.
- **Score the system, not the operator.** "Operator hasn't updated priorities this quarter" is a Context failure, not a personal failing — the system should be making it easier.
- **Don't recommend an audit as a fix.** If the highest-leverage gap is "no audit history exists," the move is to run audits weekly, not to build more audit infrastructure.
- **Compare to history.** If `logs/audits/INDEX.md` has prior entries, mention the trend (improving / flat / regressing) in the verdict.

---

## Cadence
Run weekly (Friday afternoon, paired with `weekly-review`) or on-demand. Auto-trigger: if `logs/audits/` last entry is >14 days old and a `weekly-review` is starting, prompt the operator to run this first.

---

## Related
[[level-up]] — opportunity finder; pairs with this audit (audit finds the gap, level-up finds the next skill to build)
[[grade]] — independent grader for completed deliverables (different scope)
[[agent-infrastructure-audit]] — friction analysis across tools (different scope)
[[weekly-review]] — broader weekly cadence
