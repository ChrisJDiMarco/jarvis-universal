# Skill: Agent Builder (Phased Pipeline)

## Trigger
"I need an agent that handles [X]", "build me an agent for [Y]", "hire a new agent", "add a [role] to the team", "we should have an agent that [does Z]". Also fires when the operator describes a recurring workflow that's been done manually 3+ times — that's the moment a dedicated agent earns its keep.

## Goal
Replace the thin "tell JARVIS I need an agent and it'll write the .md file" guidance in `CLAUDE.md` with a rigorous, phased pipeline that produces production-ready agents — instructions, tools, registry entry, and a passing QA round before the agent goes live.

This is the JARVIS analog of OpenSwarm's Agency Builder workflow, adapted to JARVIS's actual file layout (`.claude/agents/`, `team/roster.md`, skills, direct MCPs instead of Composio).

---

## Pre-Phase: Pick the Species

Before the pipeline starts, run [`agent-species-selector`](agent-species-selector.md) to decide:

- Coding harness (single-task, manager-judges)
- Project harness (planner + executor, multi-file)
- Dark factory (spec-in, software-out, no humans mid-flow)
- Auto-research (metric-driven hill-climbing — needs a metric)
- Orchestration (multi-role workflow with handoffs)

The species determines how much of the pipeline below applies. A simple coding harness needs less ceremony than an orchestration team.

---

## Phase 1 — Spec & Clarify

Ask the operator the smallest set of questions needed to scope:

1. **Purpose** — one sentence: what does this agent do that's not already covered?
2. **Inputs** — what triggers it, and what data does it expect?
3. **Outputs** — what does success look like? (File? Decision? Side effect?)
4. **Tools** — which MCPs/integrations does it touch? Run [`mcp-discovery`](mcp-discovery.md) for any not yet loaded.
5. **Model tier** — Haiku, Sonnet, or Opus? (Default Sonnet unless tasks are bulk/cheap or strategic/expensive.)
6. **Frequency** — one-shot, on-demand, or scheduled?

If the operator's idea is vague, ask **one question at a time** — never overwhelm. Stop after each answer and confirm understanding before proceeding.

---

## Phase 2 — Research (Parallel)

Once the spec is sharp, run two independent research workstreams in parallel:

| Workstream | What |
|------------|------|
| **Tool research** | Run `mcp-discovery` to confirm every required MCP is loaded or installable. Note any auth steps Chris will need to do. |
| **Overlap check** | Grep `team/roster.md` and `.claude/agents/` for existing agents that already cover this. Grep `skills/` for skills that overlap. If overlap is real, surface it — sometimes "I need an agent" is actually "I need to add a skill to an existing agent." |

If the overlap check finds an existing agent that does 70% of this, **stop the pipeline and recommend extending it** instead of building new. The roster is already 65 agents — bloat is a real risk.

---

## Phase 3 — PRD (One-Pager, Operator-Confirmed)

Write a one-page PRD before any code. Save to `owners-inbox/agent-prd-[name]-[date].md`.

```markdown
# Agent PRD: [name]

## Purpose
[One sentence]

## Species
[Coding harness | Project harness | Dark factory | Auto-research | Orchestration]

## Trigger Conditions
[When does this agent fire — keywords, contexts, scheduled cadence]

## Inputs
[What it expects to receive]

## Tools Required
[List each MCP/skill, with auth status]

## Outputs
[File path? Direct response? Side effect?]

## Success Criteria
[3-5 measurable bullets — what does "this works" look like?]

## Model
[Haiku / Sonnet / Opus + why]

## Communication
[Standalone | Subagent of [parent] | Peer in team [name]]

## Open Questions
[Anything still unclear]
```

**Show the PRD to the operator and wait for explicit approval.** Do not proceed to build until Chris says "yes" or edits it. This is the highest-leverage gate in the pipeline — five minutes here saves an hour of rebuilds later.

---

## Phase 4 — Build (Parallel Where Possible)

After PRD approval, run these workstreams in parallel:

| Workstream | Output |
|------------|--------|
| **Agent file** | `.claude/agents/[name].md` with the full system prompt, tool permissions, model setting |
| **Roster entry** | Append to `team/roster.md` with role, model, specialty, trigger conditions |
| **Tool wiring** | If new MCPs needed: install via `suggest_plugin_install` (with operator approval), confirm auth |
| **Skill, if applicable** | If the agent embodies a reusable workflow, also write `skills/[name].md` |

For multi-tool agents, apply [`mcp-code-exec`](mcp-code-exec.md) progressive disclosure if tool count exceeds ~20.

---

## Phase 5 — QA (5 Test Prompts)

Before declaring the agent done, run **5 test prompts** that cover:

1. The happy path — exactly the use case the PRD describes
2. An edge case — partial input, missing context, ambiguous request
3. An out-of-scope request — should the agent decline cleanly?
4. A failure case — wrong tool, missing auth, malformed input
5. A handoff case (if applicable) — does it route correctly to peers?

Capture results in `owners-inbox/agent-qa-[name]-[date].md`:

```markdown
# QA Results: [agent name]

| # | Prompt | Expected | Actual | Pass/Fail | Notes |
|---|--------|----------|--------|-----------|-------|
| 1 | ... | ... | ... | ✅ | |
```

---

## Phase 6 — Iterate

If any QA test fails, route the fix to the right place:

- **Wrong response shape** → revise the agent's instructions in `.claude/agents/[name].md`
- **Wrong tool used** → tighten the system prompt's tool-use guidance, or remove the wrong tool from the agent's allowlist
- **Missing capability** → loop back to Phase 2 to add the missing MCP
- **Routing error** → fix the trigger conditions in `CLAUDE.md` Context Auto-Detection table

Re-run the same 5 test prompts. Continue until all 5 pass and any subjective quality bar (operator's judgment) is met.

---

## Phase 7 — Index

Once QA passes:

- [ ] Add agent to `CLAUDE.md` Team Roster table (or ECC sub-team table if it's a coding sub-agent)
- [ ] Update `CLAUDE.md` Context Auto-Detection table with new trigger keywords
- [ ] If a skill was written, add it to `CLAUDE.md` Active Skills Index AND `skills/INDEX.md`
- [ ] Append a one-line entry to `logs/daily-activity.md` noting the new agent

---

## Anti-Patterns

- **Skipping the PRD.** "It's a small agent" — write the PRD anyway. The 10 minutes catches scope creep before it ships.
- **Skipping the overlap check.** Roster bloat is real. The 66th agent that does 70% of what agent #34 already does is technical debt.
- **Skipping QA.** Untested agents become silent failure modes — they fire on the wrong triggers and the operator only finds out weeks later.
- **Auto-installing MCPs.** Chris approves connector installs. Always suggest, never silently install.
- **Building when the answer is "extend an existing skill."** Sometimes the right output of this pipeline is "don't build a new agent — add this trigger to skill X."

---

## Related
[[agent-species-selector]]  [[agent-teams]]  [[mcp-discovery]]  [[mcp-code-exec]]  [[multi-agent-fanout]]
