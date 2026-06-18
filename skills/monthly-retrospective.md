# Skill: Monthly Retrospective

## Trigger

"monthly retrospective", "end of month", "month in review", "monthly meta-review", "what am I forming", "what beliefs am I building"

## Goal

Run a meta-level pass over the last 30 days of memory to surface what JARVIS and the operator are *implicitly* forming — beliefs, themes, omissions — that haven't been said out loud yet. Distinct from `weekly-review` (which is operational) and `connection-synthesis` (which finds note-to-note relationships). This skill looks for the shape of the operator's thinking over time.

This is the layer Vellum's research pass surfaced as a JARVIS gap. `weekly-review` answers "what got done"; this answers "what is forming."

## When to run

- Last Sunday of the month (or scheduled task `0 18 28-31 * 0`)
- After a major project ends
- Operator says "what am I missing" with no specific topic in mind
- Before a quarterly planning session

## Inputs

- **`memory/raw/`** — all entries from the last 30 days (the unfiltered signal)
- **`memory/[themed].md`** — full read, looking for *what changed* relative to 30 days ago (git diff if available; otherwise just current state with the implicit comparison)
- **`memory/connections/`** — last 30 days of synthesis files
- **`memory/decisions.md`** — decisions logged in the window
- **`logs/daily-activity.md`** — the last month's entries
- **`memory/learnings.md`** — any learnings written this month

If git is available in `~/jarvis/`, run `git log --since="30 days ago" --pretty=format:"%ad %s" --date=short -- memory/ skills/ projects/` to see what changed concretely.

## Process — the four questions

Run these four questions sequentially. Each should produce *specific* output (with quotes from actual notes), not generic platitudes.

### Question 1: What beliefs am I forming that I haven't stated explicitly?

Read across raw captures, decisions, and recent skill changes. Look for **stances that show up in three or more places** but have never been named as a stated belief.

> Example pattern: "Six different captures in the last month gravitated toward the idea that productized version of personal-AI architecture has commercial legs (Vellum research, Boop agent install, Anthropic Managed Agents work, etc.). Stated belief: 'I think JARVIS might be productizable.' Hasn't been written as a goal yet."

Output: 1–3 unstated beliefs, each with the source notes that gave them away.

### Question 2: What pattern keeps appearing across different domains in my notes?

This is the macro version of `connection-synthesis` Type C. A theme showing up in **multiple project contexts**, suggesting it's a load-bearing concern even though no single project owns it.

> Example pattern: "Credential isolation appears in the Vellum CES research, the service-accounts rule, the agentic-harness RD, the Boop setup. It's not owned by any one project — but it's becoming a cross-cutting concern that probably wants its own design treatment."

Output: 1–2 cross-cutting patterns, each with a concrete recommendation (codify as a rule? promote to a skill? deserves its own project?).

### Question 3: What is the single highest-leverage thing I could be thinking about right now?

Based on the corpus, name the **one question** whose answer would meaningfully redirect the next 30 days. Not "what's most urgent" — what's most leveraged.

> Example: "Whether JARVIS stays personal or productizes. Multiple notes orbit around this without committing. Until it's decided, every architecture choice has a stranded option cost."

Output: One question. One paragraph on why it matters. Do not answer it.

### Question 4: What am I clearly not reading that the gaps in my notes suggest I should be?

Look at what's *missing* from the corpus relative to the operator's stated goals and active projects. If JARVIS is doing more work on X but the notes don't reference any external thinking on X, that's a literacy gap.

> Example: "The agentic-harness RD is mid-design, but there are zero captures referencing the academic literature on agent systems (no Hendrycks, no Karpathy follow-ups beyond the obvious, no AI Safety threads). The gap suggests the design is being made in a vacuum."

Output: 1–2 reading gaps with specific suggested inputs (papers, threads, books, people to follow). Be concrete.

## Output

Save to `owners-inbox/monthly-retrospective-YYYY-MM.md` with this structure:

```markdown
# Monthly Retrospective — [YYYY-MM]

**Window**: [start date] → [end date]
**Corpus**: [N raw notes, M themed updates, K connections, L decisions]

## 1. Beliefs forming but unstated
[1–3 items, each with quoted sources]

## 2. Cross-cutting patterns
[1–2 items, each with a concrete next move]

## 3. The highest-leverage question right now
[One question + one paragraph on why. Do not answer.]

## 4. Reading gaps
[1–2 specific inputs missing from the corpus]

## What this month leaves with me
[1–2 sentences. Plain prose. No platitudes.]
```

Then present a condensed version in chat:

```
🧭 MONTHLY RETROSPECTIVE — [YYYY-MM]
Saved: owners-inbox/monthly-retrospective-[YYYY-MM].md

📍 Unstated belief: [the most surprising one]
🔁 Cross-cutting pattern: [the most load-bearing one]
❓ Highest-leverage question: [the question, verbatim]
📚 Reading gap: [the most specific one]
```

## Rules

- **Quote, don't paraphrase.** Every claim about what the operator is forming needs source attribution to a real note.
- **Generic forbidden.** "You're working hard" / "you have many projects" / "consider rest" — none of this. If the answer isn't specific to the corpus, don't include it.
- **Don't answer Question 3.** The question is the deliverable. Answering it preempts the operator's own thinking.
- **Be willing to return little.** If the corpus doesn't support a strong answer to one of the four questions, say so. ("No clear cross-cutting pattern this month — projects ran in their own lanes.") Better than fabricating.
- **Run silent if nothing material.** First Sunday of the month with only 4 days of captures (e.g., during a vacation) — skip the run, log to `logs/daily-activity.md` that the corpus was insufficient.

## Anti-patterns

- Recapping what got done → that's `weekly-review`, not this
- Listing project statuses → that's `morning-briefing`, not this
- Surfacing note-to-note connections → that's `connection-synthesis`, not this
- Giving generic life advice → not this skill's job, not any skill's job

## Cadence

- **Default**: scheduled task on the last Sunday of each month at 6pm
- **Manual**: any time operator triggers it
- **After a project ends**: run a project-scoped version with `--scope=projects/[name]/`

---

## Related
[[weekly-review]]  [[connection-synthesis]]  [[memory-management]]  [[level-up]]  [[evening-debrief]]
