# Skill: Connection Synthesis

## Trigger

"find connections", "synthesize my notes", "what's connecting in my vault", "run connection synthesis", "weekly connections", "find this week's connections", "what patterns am I missing"

Also invoked automatically as Phase 3.5 of [`weekly-review`](./weekly-review.md).

## Goal

Read across recent memory captures and surface non-obvious relationships between notes. Output operator-validated synthesis files to `memory/connections/` for future retrieval and decision-making.

This skill exists because raw capture (`memory/raw/`) and themed memory files don't do synthesis on their own — the cross-pollination has to be actively run, or insights die in storage.

## Inputs

- **Default window**: last 7 days of `memory/raw/` and recent edits to `memory/[themed].md` files
- **Override**: operator can specify `last 30 days`, `since [date]`, `all of [project]`, or `everything in [folder]`
- **Topical scope**: optional — `"find connections in my notes about a specific project"` narrows the search

## Process

### Phase 1 — Load the corpus

1. Read every `.md` file in `memory/raw/` modified within the window
2. Read every themed `memory/*.md` file (they're cap-limited; full read is cheap)
3. Read `memory/connections/*.md` from the last 30 days (avoid re-surfacing connections you already noted)
4. Optionally read `wiki/INDEX.md` and pull any atomic entities relevant to the topical scope

If the corpus exceeds ~80% of the context window, fall back to semantic search via `mcp__claude-context__search_code` using key terms extracted from the most recent raw captures.

### Phase 2 — Search for the four connection types simultaneously

For each pair (or small group) of notes in the corpus, evaluate against the taxonomy. A connection is **strong** only if you can quote the relevant passages from the actual source notes and state the relationship in one sentence.

**Type A — Same principle, different domains.**
The same underlying mechanism showing up in two unrelated parts of the vault. Different surface, identical structure.

> Example: A note about how `project-a` stalled at "operator buy-in friction" mirrors a note about how `project-b` is stuck on "users don't trust the autonomy level." Different domains, same underlying friction.

**Type B — Contradiction.**
Two notes disagree, creating useful tension. Often one is stale; sometimes both are correct in different contexts and the contradiction reveals a missing distinction.

> Example: `memory/decisions.md` says "Project A backburnered" but `projects/project-b/` still treats it as the flagship of the project-b umbrella. One needs updating.

**Type C — Pattern across 3+ notes.**
A theme that appears in three or more places, enough to count as a real pattern instead of coincidence.

> Example: Captures from the last two weeks touching "credential isolation" (Vellum research, service-accounts rule, agentic-harness RD, boop-agent setup). This isn't four separate concerns — it's one load-bearing theme.

**Type D — Question/answer pair.**
An open question from one note that another note unintentionally answers.

> Example: An open question in `memory/raw/` about "how to do rhythmic memory consolidation" — and the Vellum research deliverable describing their 4-hour consolidation pass.

### Phase 3 — Quality filter (this is where most "connections" die)

Apply these filters to every candidate. Drop any that fail:

- **Specificity test**: Can you name both source notes by file? Can you quote the relevant passage?
- **Surprise test**: Would the operator say "huh, I hadn't thought of that"? If they'd say "yeah obviously" — drop it.
- **Actionability test**: Does this change a decision, an action, or how to talk about something? Pure trivia connections don't earn a file.
- **Already-known test**: Search `memory/connections/` from the last 30 days. If you've already filed this — skip.

**Quality over quantity. Minimum 0, maximum 5 connections per run.** Returning fewer is correct when the corpus genuinely has nothing strong.

### Phase 4 — Write the connection files

For each surviving connection, create a file at `memory/connections/YYYY-MM-DD-type[A|B|C|D]-[slug].md` following the format in [`memory/connections/README.md`](../memory/connections/README.md):

```markdown
---
title: "[Short title]"
type: connection
connection_type: [A | B | C | D]
sources: [[source-1]] [[source-2]]
captured: YYYY-MM-DD
status: active
---

> **Bridge**: [One sentence connecting the sources.]

## The connection
[2–4 sentences.]

## Why it matters
[1–2 sentences on what changes.]

## Sources
- [[source-1]] — [one-line context]
- [[source-2]] — [one-line context]
```

### Phase 5 — Deliver

Return to operator in this format:

```
🔗 CONNECTION SYNTHESIS — [date] — window: [last 7 days / specified]
Corpus: [N raw notes + M themed files] scanned. [K] strong connections surfaced.

[For each connection:]
[Type] | [Title]
Bridge: [one sentence]
Why it matters: [one sentence]
Saved: memory/connections/[filename]

[If 0 connections:] Nothing strong this run. Either the captures haven't accumulated enough to cross-pollinate yet, or the corpus is too thematically coherent to surface tension. Try again in a few days.

[If 1+ connections, end with:]
Most worth your time today: [pick one]
```

## Rules

- **Never fabricate connections.** If nothing strong exists, return 0. Inventing connections poisons the well — future semantic searches will surface fake patterns.
- **Cite from the actual notes.** Don't paraphrase; quote. The quote is what makes the connection verifiable.
- **No bullet-list output in the connection files themselves.** Prose. Bridge sentence + 2–4 explanatory sentences + sources block. Saves operator's eyes and forces actual thinking.
- **Filed connections older than 30 days that haven't earned their keep** (didn't influence a decision, action, or change in framing) — leave them alone, but don't reference them in new synthesis.
- **Skill output saved to disk first, summary to chat second.** Per `file-delivery` skill.

## Anti-patterns

- Generating a "connection" by restating two notes side by side without naming the relationship → not a connection, just a summary
- Surfacing 5 connections every run because that's the max → quality, not quota
- Searching across the whole vault every time → for daily/weekly cadence, the last 7–30 days is enough; whole-vault is for monthly retrospective
- Writing connections into a chat message instead of files → connections compound; chat doesn't persist

## When to use vs. not use

| Use when | Don't use when |
|----------|---------------|
| Weekly review (Sunday cadence) | Mid-task while solving something specific |
| After a research-heavy week | When `memory/raw/` is empty |
| When stuck on a decision and want to see what your notes already say | When the operator just wants a summary, not synthesis |
| Operator says "what am I missing" | As a substitute for `memory-management` (promotion is different from synthesis) |

## Cadence

- **Default**: Run automatically as Phase 3.5 of weekly-review (Sunday)
- **Ad hoc**: Any time operator invokes a trigger phrase
- **Monthly**: [`monthly-retrospective`](./monthly-retrospective.md) runs a 30-day window version as part of its meta-analysis

---

## Related
[[memory-management]]  [[weekly-review]]  [[monthly-retrospective]]  [[../memory/connections/README]]  [[../memory/raw/README]]
