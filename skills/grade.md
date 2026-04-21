# Skill: Grade (Fresh-Session CTO Review)

## Trigger
"grade this", "grade the work", "grade the last build", "/grade", "how would a CTO grade this", "independent review"

## Invocation
**Must be invoked in a fresh subagent context — never inline in the session that produced the work.**

This skill exists because same-session review is compromised review. A `code-reviewer` agent that just watched code get written has already absorbed the rationalizations. A fresh-session grader that only sees the diff + the original ask gives you an actually independent check.

Do not invoke casually. The grader is Opus and exists for moments when you want a real calibration read, not noise.

## Goal
Produce a cold, independent grade (A-F) of a completed piece of work, with a SHIP/FIX-FIRST/KILL verdict, 3-5 specific critiques, and 2-4 uncomfortable questions. Standard is elite — most first-pass work lands B or C. A grade-A should be rare.

---

## Architecture: Isolate → Package → Spawn → Report

```
Completed work → PACKAGE inputs → SPAWN fresh agent → STRICT output → Return to operator
```

The whole point is the **spawn step**. The subagent must be launched via the Agent/Task tool with no session context.

---

## Phase 1: PACKAGE

Gather exactly three things from the current session — nothing more:

1. **Original ask** — the operator's initial request that kicked off this work. Quote it verbatim if possible.
2. **Diff / scope** — either `git diff` output, a PR URL, or an explicit file list. Whichever is most accurate.
3. **Success criteria** (optional) — anything the builder claimed would prove the work is done.

**Do NOT include:**
- The session transcript
- Memory files or CLAUDE.md
- The builder's reasoning or plan docs
- Prior review notes from same-session agents
- Any "context" about why the code looks the way it does

If the operator is tempted to include context to "help" the grader — refuse. That's the bias the skill exists to prevent.

---

## Phase 2: SPAWN

Invoke the `elite-cto-grader` agent with only the packaged inputs. Use the Agent/Task tool so the grader runs in a fresh context.

**Spawn prompt template:**
```
You are grading a completed piece of work. You have no prior context.

ORIGINAL ASK:
[verbatim operator request]

DIFF / SCOPE:
[one of: git diff output, file list with paths, PR URL]

SUCCESS CRITERIA (if provided):
[what the builder said would prove the work is done]

Grade per your agent definition. Return the strict output format.
```

**Critical:** do not add encouraging language, do not explain the builder's situation, do not mention memory or JARVIS context. The prompt should feel like a cold handoff.

---

## Phase 3: REPORT

Return the grader's output to the operator verbatim. Do not:
- Summarize it
- Soften critiques
- Add your own defense of the work
- Explain why the grader "may have missed context"

If the grader got something factually wrong (e.g., claimed a file doesn't exist when it does), note the factual correction but leave the judgment intact.

After delivering the report, ask:
> "Want me to address the findings, or disagree?"

The operator may override. That's their call, not yours.

---

## Phase 4: LOG

Append to `logs/grade-history.jsonl`:
```json
{"date": "ISO8601", "original_ask": "...", "scope": "file list or PR", "grade": "A|B|C|D|F", "verdict": "SHIP|FIX-FIRST|KILL", "findings_count": N}
```

This lets us watch the grade distribution over time. If everything is getting A's, the grader is being too soft (or the work truly is that good — unlikely). If everything is F, the grader is miscalibrated. Weekly review should spot-check.

---

## When to Run /grade

| Situation | Run /grade? |
|-----------|-------------|
| After any feature that took >2 hours to build | YES |
| Before shipping to production | YES |
| When you suspect the builder agent was being agreeable | YES |
| After a refactor that touched multiple files | YES |
| Quick one-line fixes | NO — overkill |
| Docs or config-only changes | NO — grader has no opinion |
| When you want validation, not calibration | NO — you're using it wrong |

---

## Relationship to Other Review Agents

This skill does NOT replace `code-reviewer`, `security-reviewer`, or the language-specific reviewers. Those run inline during the build and catch mechanical issues. `/grade` is the outer layer — an independent judgment call about whether the whole thing is worth shipping.

Run the inline reviewers first. Run `/grade` last.

---

## Rules

- The grader's output is the truth of this skill. Do not edit, soften, or reframe it.
- If the operator disagrees with the grade, that's a conversation — not a reason to re-run until the grade changes.
- Re-running on the same diff is fine if the work has changed. Re-running for a different result without changing the work is cargo-cult.
- The grader runs on Opus. Do not downgrade without operator direction.
- If `git diff` returns nothing, stop and ask what to grade before spawning — don't guess.

---

## Failure Modes to Watch

- **Grader goes too hard, always returns F** — check the prompt for "elite" inflation; recalibrate to "top-tier engineering org" not "Mars mission."
- **Grader goes soft** — check whether memory files are leaking into the spawn prompt. They shouldn't be.
- **Grader asks for more context instead of grading** — its instructions forbid this. Fix the agent file.
- **Operator starts ignoring grades** — log it. If `/grade` results aren't changing decisions, the skill has stopped being useful.
