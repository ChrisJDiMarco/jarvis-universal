# Skill: Agent Species Selector

**Trigger phrases:** "what kind of agent", "which agent pattern", "how should I build this", "agent for [X]", "should this be a dark factory", "agent architecture for"

**Goal:** Select the correct agent species for any given task before building anything. Wrong species = wasted build time and guaranteed failure.

---

## The 4 Species (+ 1 Variant)

### 1. Coding Harness (Individual)
- **Shape:** One developer's task. Singlethreaded.
- **Examples:** Claude Code, Codex, writing a script, fixing a bug
- **Human role:** Manager — you judge all output
- **Key unlock:** Task decomposition. Break the problem well → hand off confidently.
- **Failure mode:** Giving it an open-ended, poorly-scoped task

### 2. Project Harness (Team-Scale)
- **Shape:** Multi-agent codebase work. Planner + executor pattern.
- **Examples:** Cursor building a browser/compiler, large feature ships, multi-file refactors
- **Architecture:** One planner agent manages state + spins up short-running grunt/executor agents per task
- **Human role:** Top (design/spec confirmation) + end (eval gate) + occasional guidance
- **Key rule:** Max 2 management layers. Cursor tried 3 — failed. Keep it flat.
- **Failure mode:** Adding management hierarchy "for control" → kills performance

### 3. Dark Factory
- **Shape:** Spec in, working software out, no humans in the middle
- **Examples:** Automated PR generation, bulk content pipelines, spec-to-deploy workflows
- **Human role:** Top (write excellent spec + nonfunctional requirements) + bottom (eval/test review before prod)
- **Critical:** Never skip the human eval at the end. Amazon learned this the hard way with AI-generated incidents in production.
- **Key unlock:** Evals and tests must be so rigorous they can stand in for human judgment in the middle
- **Failure mode:** Trusting agents to ship to prod without any human review of the eval gate

### 4. Auto-Research
- **Shape:** Iterative metric optimization — LLM runs experiments to hill-climb toward better performance
- **Examples:**
  - Optimize email outreach sequence for reply rate
  - A/B test voice agent scripts to improve call conversion
  - Optimize landing page copy for signups
  - Tune n8n workflow logic for throughput
- **Requires:** A measurable metric. No metric → can't do auto-research. Full stop.
- **Human role:** Define metric + data → review successful experiments → decide what ships
- **Failure mode:** Trying to use this to "build software" — it optimizes, it doesn't build
- **Status for JARVIS:** Not yet built. Infrastructure needed: metric tracking + iterative experiment loop + results comparison. n8n is the right platform.

### 5. Orchestration
- **Shape:** Multi-role workflow routing with specialized agents at each step
- **Examples:** LangGraph, CrewAI, researcher → drafter → editor pipelines, customer success ticket flows
- **Human role:** Many joints in the process still require human review
- **Key question before building:** What's the volume?
  - <1K units → probably not worth the plumbing
  - 10K+ units → justified
- **Failure mode:** Building orchestration for small volumes — the coordination tax exceeds the value

---

## Decision Tree (Run This First)

```
Is the problem metric-shaped (I want to optimize a rate)?
  YES → Auto-Research
  NO ↓

Is it routing between distinct specialized roles (researcher, writer, reviewer)?
  YES → Orchestration (check scale first — worth it?)
  NO ↓

Is it software / code / content to be produced?
  Is human judgment needed throughout?
    YES → Coding Harness (individual) or Project Harness (team-scale)
  Can humans be removed from the middle?
    YES + strong evals exist → Dark Factory
    NO → Coding Harness with human checkpoints
```

---

## Application Examples

| Scenario | Correct species |
|----------|-----------------|
| Write outreach copy for a campaign | Dark Factory (spec → copy → eval on reply rate) |
| Optimize reply rate on existing sequences | Auto-Research |
| Build an automation from a spec | Dark Factory |
| Manage bulk inbound processing (10K+/mo) | Orchestration |
| Build a voice agent for one client | Coding Harness |
| Manage a large multi-workflow project | Project Harness |

---

## Rules
- Never build an agent without identifying the species first
- Never use auto-research to "build" something — it optimizes, not constructs
- Never use orchestration for low-volume work
- Never skip the eval gate in a dark factory
- Never add more than 2 management layers to a project harness
