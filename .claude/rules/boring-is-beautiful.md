# Boring Is Beautiful

## The discipline

When you can solve a problem with a deterministic workflow (a script, a cron, a webhook handler) instead of an agentic skill, do that. Reach for an agent only when the work genuinely requires judgment that a script can't encode.

## Why

Agents are great at handling fuzzy, unpredictable input. They're worse than scripts at handling well-defined, repeated work — slower, more expensive, more variable in output, harder to debug when they fail. The mental bias is toward agents because they're new and exciting; the operational reality is that 9 out of 10 business processes don't need them.

A 30-line Python script that runs every Monday at 8am is more reliable than a Claude session that "checks the team's progress" with a vague prompt. The script will run forever; the session will drift.

## The decision tree

Before building an agentic skill, ask in order:

1. **Can a single shell command do this?** If yes — use that. Wire it into the skill if you must, but the skill is just calling the command.
2. **Can a deterministic script do this?** If the inputs and outputs are well-defined, write the script. Ten lines of Python beats fifty lines of skill markdown.
3. **Can a workflow tool do this?** If the work is "when X happens, do Y" — that's n8n, GitHub Actions, a webhook. Not an agent.
4. **Does this need real judgment in the loop?** Then agentic. Otherwise back up.

The yes-to-step-4 cases are real but rarer than they feel:
- Triaging unstructured inbound (emails, support tickets, leads) where the categorization itself is judgment
- Drafting writing in a voice (content, replies, summaries)
- Multi-step research where each step's next move depends on what the last step found
- Code review and design critique

Most other things are scripts.

## When the failure means *less* structure

A failure's signature tells you which way to move. A **brittle cascade** — one poisoned context wrecks a session, one wrong fact propagates into many decisions, one overloaded agent fails at everything it was handed — means too few boundaries: add a seam. **Anomic slippage** — no locatable crash, just pervasive drift where coordination overhead has quietly swallowed the work — means too many: consolidate. The reflex on any failure is to add process, a skill, a schedule; this is the case where adding makes it worse. JARVIS has lived it: 9 of 11 scheduled tasks silently died for weeks with no single rupture, and the fix was to collapse them into one pulse, not pile on more monitoring. (Borrowed from the inverse Hall–Petch effect in metallurgy — subdivision has an optimum past which finer is strictly weaker.)

## Apply when

- You're tempted to build a skill for a task that has clear inputs and clear outputs
- A workflow you've automated as a skill keeps drifting — moving it to a script will fix the drift
- Cost or latency on a recurring task is becoming a problem

## Don't apply when

- The task genuinely needs judgment — don't squeeze fuzzy work into a brittle script just for purity
- You haven't shipped *anything* yet — start with the agent if it's faster to prototype, then promote to script when the shape is clear
- The script would require building infrastructure that doesn't exist yet (auth, deployment, monitoring) where the skill could just borrow JARVIS's existing infrastructure

## In practice

This rule is a counterweight to the natural pull of an agentic OS. JARVIS makes building agents cheap, so it's tempting to build them for everything. The discipline is to notice when "I'll build a skill for that" should actually be "I'll write a 20-line script for that and let JARVIS call it."

When you do build a script, store it in `scripts/` (or the relevant project's `scripts/` folder), keep it small, and reference it from any skill that uses it. The skill becomes a thin wrapper: "run the script, format the output."

## Related
[[karpathy-agent-principles]] — Principle 1 (simplicity first) is the same instinct
[[poc-first]] — a related discipline: prove the concept lightweight before building the heavy version
[[coding-style]] — KISS / DRY / YAGNI all reinforce this
