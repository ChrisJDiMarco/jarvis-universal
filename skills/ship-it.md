# Skill: Ship It

## Trigger
"ship it", "ship this", "production deploy", "ready to ship", "release this", "push to prod", "let's ship"

## Goal
Take a feature from "looks done" to "actually deployed" through a structured pipeline of plan → tdd → review → security → grade → commit, with operator approval gates between phases. The killer-demo workflow that turns the JARVIS sub-team into a coordinated release engine.

## When to Use
- A feature is implemented but not yet committed
- Operator says "this looks good, let's ship"
- A bug fix is ready and needs final verification before merge
- Pre-release of any code change touching production paths

When NOT to use:
- Throwaway scripts or one-off explorations
- Documentation-only changes (use a simpler doc-update flow)
- WIP code that isn't yet feature-complete

## The Pipeline (6 phases, 5 gates)

```
[idea] → 1.PLAN → ⏸ → 2.TDD → ⏸ → 3.CODE-REVIEW → ⏸ → 4.SECURITY → ⏸ → 5.GRADE → ⏸ → 6.COMMIT → [shipped]
```

Each ⏸ is an explicit operator approval gate. If any phase returns CRITICAL or HIGH-severity issues, the pipeline halts and waits for the operator to choose: fix → retry, override → continue, or abort.

### Phase 1 — Plan
**Agent**: `planner`

Output: A short implementation plan with phased steps and verify checkpoints (Karpathy Principle 5). For an existing feature being shipped, this is a *retrospective* plan — what was done, what was skipped, what's still risky.

**Gate**: Operator confirms the plan accurately reflects the change.

### Phase 2 — TDD coverage check
**Agent**: `tdd-guide`

Verify tests exist for the change. If missing, write them first (RED), then re-run to confirm they pass (GREEN). Report final coverage.

**Gate**: Coverage ≥ 80% per `.claude/rules/testing.md`. If below, operator decides: write more tests or override.

### Phase 3 — Code review
**Agent**: `code-reviewer` + relevant language-specific reviewer (`typescript-reviewer`, `python-reviewer`, etc.)

Run review on the diff. Report findings by severity (CRITICAL / HIGH / MEDIUM / LOW per `.claude/rules/code-review.md`).

**Gate**: No CRITICAL issues. HIGH issues require operator override to proceed.

### Phase 4 — Security review
**Agent**: `security-reviewer`

Mandatory if the change touches:
- Authentication or authorization
- User input handling
- Database queries
- File system or network operations
- Cryptographic operations
- Payment / financial code

Otherwise: lightweight scan for hardcoded secrets, injection vectors, XSS surface.

**Gate**: No CRITICAL findings. HIGH requires operator override.

### Phase 5 — Independent grade
**Skill**: `grade`

Spawn fresh-session Opus subagent with only the diff + original task description (no memory, no chat context). Returns A–F grade and SHIP / FIX-FIRST / KILL verdict.

**Gate**: Grade ≥ B and verdict ∈ {SHIP, FIX-FIRST}. KILL halts the pipeline.

### Phase 6 — Commit
**Agent**: orchestrator (delegates to git workflow per `.claude/rules/git-workflow.md`)

Stage diff, write conventional-commit message based on the plan from Phase 1, commit. If on a feature branch and ready: open PR. If on main: push.

**Gate**: Final operator confirmation before push.

## Output

After each phase, append a one-line entry to `logs/ship-it.log`:
```
2026-05-05T14:32:11Z  [feature-name]  phase=plan        status=approved
2026-05-05T14:35:42Z  [feature-name]  phase=tdd         status=approved coverage=87%
2026-05-05T14:38:09Z  [feature-name]  phase=code-review status=approved findings=2 medium 0 high 0 critical
...
```

Final summary written to `owners-inbox/ship-it-[feature]-[date].md` with:
- The plan
- Coverage delta
- Review findings (with severity)
- Security findings
- Grade letter + verdict + rationale
- Final commit hash
- Time spent per phase

## Behavioral Rules

- **Never skip a gate.** Operator approval is the safety mechanism. If the operator types anything other than explicit approval ("yes", "ship", "approved", "go"), halt and ask.
- **Never auto-override critical findings.** Even with operator approval, log the override explicitly so post-incident analysis can trace decisions.
- **One feature at a time.** Don't ship two unrelated changes through the same pipeline run — each gets its own log entry and grade.
- **Halt-fast on Phase 5 KILL verdict.** A grade of D or F + KILL means the change has fundamental issues. Pipeline cannot proceed without going back to Phase 1 with a corrected plan.
- **Phase 4 security scan is mandatory** for any change touching the trigger list above, regardless of operator preference. The whole point is to catch what the operator might miss.
- **All phases run in the operator's working tree.** Do not branch, do not stash. The pipeline reflects reality.

## Failure Modes

| Symptom | Likely Cause | Fix |
|---------|-------------|-----|
| Phase 2 finds no tests | Feature was implemented without TDD | Write tests now, re-run from Phase 2 |
| Phase 3 finds 5+ HIGH issues | Code didn't go through normal review | Refactor or split the change, re-run from Phase 1 |
| Phase 4 finds hardcoded secret | Pre-commit secret scan failed | Rotate the secret immediately, then remove from diff |
| Phase 5 returns D/KILL | Change doesn't actually solve the problem stated | Halt — operator + planner go back to Phase 1 |
| Phase 6 conflict with main | Branch out of date | Pull/rebase, return to Phase 3 to re-review the merge |

## SQLite writes (data/jarvis.db)

| Action | Table | Key Fields |
|--------|-------|------------|
| Pipeline started | `system_logs` | agent='ship-it', action='start', details='[feature]' |
| Phase completed | `system_logs` | agent='ship-it', action='phase_complete', details='[feature] phase=[N] status=[S]' |
| Pipeline shipped | `system_logs` | agent='ship-it', action='shipped', details='[feature] grade=[X] commit=[hash]' |
| Pipeline aborted | `system_logs` | agent='ship-it', action='aborted', details='[feature] phase=[N] reason=[R]' |

## Activity logging

After every shipped or aborted run, append to `logs/daily-activity.md`:
```
## [DATE] — Ship-it: [feature name]
**What happened**: [shipped / aborted at phase N]
**Why it matters**: [what the change does + grade letter]
**Share-worthy**: HIGH if grade is A and the feature is publicly visible
```

## Related
[[planner]]  [[tdd-guide]]  [[code-reviewer]]  [[security-reviewer]]  [[grade]]  [[../CLAUDE]]
