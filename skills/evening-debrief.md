# Skill: Evening Debrief

## Trigger
"evening debrief", "end of day", "wind down", "close out the day", "debrief", "what did I learn today", "patch list"

## Origin
Adapted from Nate Herk's daily loop pattern (May 2026 AIOS walkthrough): morning briefing for context, end-of-day reflection for compounding. The key insight: most skills get better not from one big rewrite, but from small daily patches the operator notices in the moment ("had to correct it again on tone" / "kept missing this connection"). Without a debrief, those patches evaporate. This skill captures them in 2 minutes.

`morning-briefing` opens the day; `evening-debrief` closes it. Together they form the daily loop.

## Goal
In under 2 minutes of operator time: capture which skills ran today, what was corrected, what context was missing, and what to patch tomorrow. Output is a lightweight log entry, not a report.

---

## Process

### 1. Auto-scan (silent)
Before asking the operator anything, gather:
- Skills invoked today from `logs/session-log.jsonl` (Stop hook records these)
- Files touched in `memory/` and `skills/` today (mtime within 24h)
- Errors/lessons captured by MetaClaw in `skills/learned/` today
- Calendar — what meetings happened, what came up
- Active scheduled tasks that fired (last 24h)

### 2. Three quick prompts
Ask in sequence, one at a time. Operator can answer in one line each.

1. **Win** — "What's one thing JARVIS did well today?" (anchors what to keep)
2. **Patch** — "What did you have to correct, repeat, or work around?" (the patch list)
3. **Missing** — "Anything JARVIS didn't know that it should have?" (context gap)

If operator says "nothing" to any, accept it and move on. Don't fish.

### 3. Synthesize and decide
For each "patch" or "missing" answer, decide between:
- **Patch existing skill** — small edit (1–3 lines) to a skill.md
- **Add to memory** — fact belongs in `memory/learnings.md` or `memory/L1-critical-facts.md`
- **New skill candidate** — bigger than a patch; queue for next `level-up` run
- **Drop** — one-off, not worth capturing

Apply patch-existing-skill edits **immediately** (small, scoped). Memory writes go through normal Memory Write Loop (security scan → cap check → write). Skill candidates get appended to `owners-inbox/level-up-queue.md`.

### 4. Append to daily activity log
One block in `logs/daily-activity.md`:

```markdown
## {YYYY-MM-DD} — Evening Debrief
**Skills used**: {comma-separated list}
**Win**: {one sentence}
**Patches applied**: {list of skill files edited, or "none"}
**Memory updated**: {list of memory files, or "none"}
**Queued for level-up**: {list of skill candidates, or "none"}
**Tomorrow's first move**: {one sentence — operator's stated #1}
```

### 5. Sign off
End with the operator's tomorrow-first-move surfaced cleanly so it's the first thing they see in `morning-briefing`. No long summary. The debrief itself was the work.

---

## Output Format

```
🌙 Evening debrief — {date}

Today: {N} skills ran, {N} files touched
Win: {one line}
Patches applied: {N} ({skill names})
Memory updated: {N} files
Queued: {N} candidates → level-up next month

Tomorrow's first move: {one line}
```

That's the whole answer. No analysis paragraphs. Operator already lived the day.

---

## Rules
- **Time-box to 2 minutes operator-side.** If the interview takes longer, the debrief is the wrong tool; suggest a `weekly-review` instead.
- **Apply patches immediately, not later.** A patch deferred is a patch lost. Edit the skill file in the same session.
- **Never invent corrections.** If the operator says "nothing to patch," don't go hunting in logs to manufacture patches — they get to define what counts.
- **Don't double-log.** If MetaClaw already captured something to `skills/learned/`, mention it but don't re-write.
- **Tomorrow's first move is the operator's, not yours.** Resist the urge to suggest. Ask, accept, log.

---

## Cadence
Run nightly (manual trigger or scheduled task at end-of-workday). Skips automatically on weekends unless operator opts in. Failure mode: 3 consecutive nights skipped → next `morning-briefing` opens with "Want to run a quick debrief covering the last 3 days?" instead of forcing it.

---

## Related
[[morning-briefing]] — opens the day; this closes it
[[level-up]] — drains the queue this skill builds
[[weekly-review]] — Friday rollup; reads this log for trends
[[memory-management]] — runs the memory writes this skill triggers
