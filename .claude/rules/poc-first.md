# Proof of Concept First

## The discipline

Before investing real engineering time in a custom solution (a dashboard, a tool, a deployment pipeline, a new agent), ship the lightest-weight version that proves whether the concept is actually useful. If the lightweight version sits unused for two weeks, the heavy version was never worth building.

## Why

The most expensive engineering work is the work that gets built and never used. The cause is almost always the same: someone imagined a use case, jumped to the polished version, shipped it, and discovered the real-world need was different — or smaller — or didn't exist.

A proof-of-concept is a question, not a product. It asks: *do I actually open this thing? do I actually need it?* You can't answer that without putting the cheapest possible version in front of yourself first.

## The pattern

### 1. State the question
Before building, write down what the PoC is trying to learn. Not "I'm going to build a revenue dashboard" — "I'm going to find out whether I actually check revenue data more than once a week." The question shapes the PoC.

### 2. Build the cheapest version that can answer it
- Need a dashboard? Use a Cowork live artifact (5 minutes) or a printed markdown file. Don't build a custom Next.js app.
- Need a workflow? Use a one-shot skill prompt. Don't build an n8n flow yet.
- Need a tool? Use Claude in Chrome to do it manually first. Don't build the integration.
- Need a report? Generate it on demand by asking JARVIS. Don't schedule a recurring job.

### 3. Use it for two weeks
Don't iterate during this window. Don't add features. Just use what's there and watch your own behavior:
- Did you open the artifact more than twice a week?
- Did you actually use the data to make decisions?
- Did the lightweight version reveal a different real need?

### 4. Decide
After two weeks, three outcomes:

| Behavior | Decision |
|----------|----------|
| Used it daily, hit limits | **Promote** — build the heavy version, scoped to what you actually used |
| Used it occasionally, fine as-is | **Stay** — the PoC is the product. Don't promote. |
| Didn't use it | **Kill** — delete the artifact. The concept wasn't real. |

The "kill" outcome is the most valuable — it costs you 5 minutes instead of 5 days.

## In practice

JARVIS makes PoCs trivially cheap because Cowork artifacts, skills, and lightweight scripts can all be spun up in minutes. The temptation is to skip the PoC because "I know I want this." Resist. Most of the time you don't actually want what you think you want; you want a different shape of the same idea, and the PoC reveals which shape.

## Apply when

- Operator says "let's build X" and X requires more than a day of work
- You're about to build a custom dashboard, custom tool, or custom integration
- A "we should automate this" instinct is forming around a workflow that hasn't been done manually 3+ times yet

## Don't apply when

- The PoC and the real version are the same thing (a 30-line script is both PoC and product)
- The work is operator-explicit and time-boxed (operator says "ship me X today")
- A previous PoC already validated the demand and you're now building V2

## Related
[[boring-is-beautiful]] — companion discipline: the simplest solution is usually right
[[karpathy-agent-principles]] — Principle 5 (goal-driven execution): define what success means before building
