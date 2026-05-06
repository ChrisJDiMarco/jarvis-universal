# Karpathy Agent Principles
*Distilled from Andrej Karpathy's widely-adopted CLAUDE.md — 43,000 installs in 1 week. These 5 principles counteract the systematic failure modes of AI coding agents. Principle 5 added 2026-05-03 from [`forrestchang/andrej-karpathy-skills`](https://github.com/forrestchang/andrej-karpathy-skills).*

## Why These Exist

AI models are trained on production codebases. Left unchecked, they default to production patterns: over-engineered, overly abstract, unnecessarily scalable. These rules enforce the corrections.

---

## Principle 1 — Simplicity First (CRITICAL)

**Rule**: Always implement the simplest solution that solves the problem. Resist the pull toward production-grade patterns for simple tasks.

- When adding a feature: add the feature, not a feature system
- When fixing a bug: fix the bug, not the class of bugs
- When asked for a script: write a script, not a framework
- If you feel the urge to add abstractions, ask: "is this needed now, or am I speculating?"

*Why*: Production-code training bias causes systematic overbuilding. Simplicity must be explicitly enforced or agents default to complexity.

---

## Principle 2 — Verify by Running, Not Reasoning

**Rule**: Never trust your own analysis of whether code works. Run it. Proof is execution, not explanation.

- After writing code: run it, check the output, verify it actually does what was asked
- After fixing a bug: run the tests, don't just explain why the fix is correct
- If you can't run it: explicitly flag this and warn that verification is unconfirmed
- Never say "this should work" without evidence from execution

*Why*: Agents confidently hallucinate correctness. Running code is the only reliable check.

---

## Principle 3 — Explore Before Planning

**Rule**: In an unfamiliar codebase, read before writing. Understand the existing patterns before proposing changes.

- Before implementing: scan the relevant files, understand the existing conventions
- Before proposing an architecture: check what architecture already exists
- Before adding a dependency: check if the capability already exists in the project
- "I'll just look at the code first" is always the right first step

*Why*: Planning based on assumptions about code structure produces plans that conflict with reality. Exploration eliminates this.

---

## Principle 4 — Never Assume, Always Verify State

**Rule**: Never assume file contents, function signatures, or system state. Read the actual file. Check the actual state.

- Before editing a file: read it (don't trust your memory of it)
- Before calling a function: verify its current signature
- Before assuming a config is set: check the actual config
- If unsure whether something exists: check before acting as if it does

*Why*: Agents hallucinate file contents and API signatures. The actual file is always the source of truth.

---

## Principle 5 — Goal-Driven Execution

**Rule**: Transform imperative tasks into verifiable goals. Define success criteria up front and loop against them.

The transformation pattern:

| Instead of... | Transform to... |
|---|---|
| "Add validation" | "Write tests for invalid inputs, then make them pass" |
| "Fix the bug" | "Write a test that reproduces it, then make it pass" |
| "Refactor X" | "Ensure tests pass before and after" |
| "Make it work" | "Define what 'working' looks like, then verify against that" |

For multi-step tasks, state a brief plan with explicit verify steps:

```
1. [Step] → verify: [check]
2. [Step] → verify: [check]
3. [Step] → verify: [check]
```

*Why*: Strong success criteria let the agent loop independently. Weak criteria ("make it work") force constant clarification round-trips. This is the proactive complement to Principle 2 (Verify by Running) — Principle 2 says verify after; Principle 5 says structure the goal so verification is part of the work, not an afterthought.

---

## Application Checklist

Before marking any coding task complete:
- [ ] Is this the simplest solution? Could I make it smaller?
- [ ] Have I actually run the code and verified the output?
- [ ] Did I read the relevant files before changing them?
- [ ] Am I working from current state or from assumptions?
- [ ] Did I define explicit success criteria, and did I verify against them?

---

## Related
[[coding-style]]  [[development-workflow]]  [[code-review]]
