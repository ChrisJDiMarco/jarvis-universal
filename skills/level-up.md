# Skill: Level Up

## Trigger
"level up", "level-up", "what should I automate next", "find the next skill to build", "where can I get leverage", "what should JARVIS do next"

## Origin
Adapted from Nate Herk's `level_up` skill (May 2026 AIOS walkthrough). His version asks five surgical questions designed to surface automation candidates the operator already knows about but hasn't named yet. JARVIS already has `agent-infrastructure-audit` (friction across the stack) and `four-cs-audit` (system maturity). This is the missing third loop: **opportunity-finder**. Audit tells you the gap, this tells you what to build.

## Goal
Run a 5-prompt interview, then return a ranked list of 3–5 next-skill candidates with concrete spec stubs (trigger, goal, connections needed) — small enough that any one can be turned into a real skill via `agent-builder` in the same week.

---

## The 5 Questions

Ask one at a time. Wait for each answer. Do not summarize. Let the operator's words sit.

1. **Last week recap** — "Walk me through the past week. What did you do three or more times?"
2. **Drudgery** — "Was there anything that felt manual, boring, or copy-paste?"
3. **Smart-intern test** — "Anything where you thought a smart intern could absolutely handle this — but you ended up doing it yourself because explaining would take longer?"
4. **Constraint** — "If 10x your current load showed up next Monday (10x customers, 10x clients, 10x inbound), what breaks first?"
5. **Growth lever** — "If one repeatable thing ran on autopilot tomorrow, what would move your business or life the most?"

> The smart-intern test is the highest-signal question. Answers there are almost always real automation candidates because the operator has already mentally simulated delegating it.

---

## Process

### 1. Pre-read
Before the first question, silently load:
- `memory/core.md` (L0)
- `memory/L1-critical-facts.md`
- Latest entry in `logs/daily-activity.md`
- Last `four-cs-audit` if one exists in `logs/audits/`

This lets you ground follow-ups in the operator's actual stack instead of asking generic questions.

### 2. Interview
- Ask one question at a time
- Don't propose solutions during the interview
- If an answer is one sentence, ask one clarifying follow-up: "what specifically", "how often", or "who else does this"
- Don't ask more than one follow-up — overcorrects toward analysis paralysis

### 3. Synthesize
After Q5, write a candidate list. For each candidate:

```markdown
### Candidate N: {short name}
- **Source**: Q{1-5} answer ("walked through Monday triage of new leads...")
- **Trigger phrase**: what the operator would say to invoke it
- **Goal**: one sentence — what the skill produces
- **Connections needed**: which MCPs/APIs/files
- **Estimated build time**: <1hr / half-day / multi-day
- **Leverage score**: 1–5 (how much time / decision fatigue this saves per week)
- **Build cost**: 1–5 (effort to build, including reference docs and testing)
- **Net (leverage − cost)**: __
```

Sort by net score, descending.

### 4. Recommend the top one
Pick the highest-net candidate and write a one-paragraph build plan:
- Which existing skill or agent in JARVIS is the closest analog?
- What new connection (if any) needs setup first?
- What's the simplest possible v1?

### 5. Offer the handoff
End with: "Want me to spawn `agent-builder` to scaffold the top candidate now, or save the full list to `owners-inbox/level-up-{date}.md` for later?"

---

## Output Format

```markdown
# Level Up — {ISO date}

## What I heard
{2-3 sentence synthesis of the interview, in operator's voice}

## Ranked candidates

| # | Skill | Leverage | Cost | Net |
|---|-------|----------|------|-----|
| 1 | ... | 5 | 2 | +3 |
| 2 | ... | 4 | 2 | +2 |
| 3 | ... | 3 | 1 | +2 |

## Top candidate spec
{Candidate 1 expanded}

## Build plan
{paragraph}

## Handoff
{question}
```

---

## Rules
- **Don't suggest skills the operator didn't mention.** Every candidate must trace back to a Q1–5 answer. No invented opportunities.
- **Don't grade their week.** No "you should have automated X earlier" — the system exists to make this easier going forward.
- **Be skeptical of high-leverage / low-cost claims.** If a candidate looks like a 5/1 (high leverage, trivial cost), there's usually a hidden integration or auth wall. Flag it.
- **Net score < +1? Drop the candidate.** Better to ship two real wins than five maybes.
- **Don't run this alone.** If the operator says "just look at my logs and figure it out," refuse politely — the smart-intern question only works in conversation.

---

## Cadence
Pair with `four-cs-audit` (run audit first, level-up second). Recommended monthly, or any time the operator says "I don't know what to build next." After 3 consecutive runs with the same top candidate appearing, auto-flag: "this keeps surfacing — should we just build it?"

---

## Related
[[four-cs-audit]] — finds the gap; this finds the fill
[[agent-builder]] — turns a candidate into a real skill
[[weekly-review]] — broader weekly cadence (different scope: progress, not opportunity)
[[evening-debrief]] — daily companion for catching small candidates as they happen
