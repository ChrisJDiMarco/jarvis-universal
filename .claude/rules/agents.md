# Agent Orchestration

## Available Agents

Agents live in `.claude/agents/` (65 total).

> **Source of truth**: `team/roster.md` (JARVIS agents) and the Team Roster table in `CLAUDE.md` (which lists the ECC builder sub-team).
> The table below is a short-hand for the most-used coding agents — NOT an exhaustive list.

### Common coding agents (shorthand)

| Agent | Purpose | When to Use |
|-------|---------|-------------|
| planner | Implementation planning | Complex features, refactoring |
| architect | System design | Architectural decisions |
| tdd-guide | Test-driven development | New features, bug fixes |
| code-reviewer | Code review | After writing code |
| security-reviewer | Security analysis | Before commits |
| build-error-resolver | Fix build errors | When build fails |
| e2e-runner | E2E testing | Critical user flows |
| refactor-cleaner | Dead code cleanup | Code maintenance |
| doc-updater | Documentation | Updating docs |
| docs-lookup | API reference research | "how does X work in [library]" |
| performance-optimizer | Profiling, bottleneck fixes | "optimize", "it's slow" |
| loop-operator | Autonomous loops, batch pipelines | DAG orchestration |
| harness-optimizer | Agent config + prompt tuning | "tune the agent" |
| typescript-reviewer | TS/JS code review | TypeScript projects |
| python-reviewer | Python code review | Python projects |
| go-reviewer | Go code review | Go projects |
| rust-reviewer | Rust code review | Rust projects |
| java-reviewer | Java code review | Java projects |
| kotlin-reviewer | Kotlin code review | Kotlin projects |
| flutter-reviewer | Flutter / Dart UI code review | Flutter projects |
| cpp-reviewer | C++ code review | C++ projects |
| csharp-reviewer | C# code review | C# projects |
| database-reviewer | Query / schema review | DB changes |
| healthcare-reviewer | HIPAA / medical compliance | Healthcare code |

See `team/roster.md` for the full JARVIS agent roster including comms-triage, scout, deal-closer, agency-ops, vibecode-builder, app-studio, voice-agent-builder, seo-content-agent, n8n-architect, opensource-forker/packager/sanitizer, gan-planner/generator/evaluator, and others.

## Immediate Agent Usage

No user prompt needed:
1. Complex feature requests - Use **planner** agent
2. Code just written/modified - Use **code-reviewer** agent
3. Bug fix or new feature - Use **tdd-guide** agent
4. Architectural decision - Use **architect** agent

## Parallel Task Execution

ALWAYS use parallel Task execution for independent operations:

```markdown
# GOOD: Parallel execution
Launch 3 agents in parallel:
1. Agent 1: Security analysis of auth module
2. Agent 2: Performance review of cache system
3. Agent 3: Type checking of utilities

# BAD: Sequential when unnecessary
First agent 1, then agent 2, then agent 3
```

## Multi-Perspective Analysis

For complex problems, use split role sub-agents:
- Factual reviewer
- Senior engineer
- Security expert
- Consistency reviewer
- Redundancy checker
