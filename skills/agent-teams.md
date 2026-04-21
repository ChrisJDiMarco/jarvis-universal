# Skill: Agent Teams

## Trigger
"build me a team", "spin up a team", "create an agent team", "use agent teams", "I need parallel specialists", any complex multi-domain task requiring agents to *react to each other's output* during execution

## Goal
Deploy a coordinated team of specialist agents that work in parallel, communicate peer-to-peer, share a task list, and produce a unified high-quality deliverable — beyond what sequential sub-agents or a single agent can achieve.

---

## Agent Teams vs Sub-Agents — When to Use Which

| Dimension | Sub-Agents (fan-out) | Agent Teams |
|-----------|---------------------|-------------|
| Communication | Results only → orchestrator | Peer-to-peer direct messaging |
| Task list | None (isolated) | Shared, visible to all |
| Parallelism | Yes | Yes |
| Agents react to each other | No | Yes |
| QA loops / iteration | Manual | Built-in (QA agent can reject + resend) |
| Cost | Lower | Higher (N × context cost) |
| Speed | Faster for simple tasks | Slower but higher quality |
| Best for | Independent parallel tasks | Interdependent specialists, quality gates |

**Decision rule:**
- If Task B doesn't need Task A's output → fan-out (sub-agents)
- If agents need to hand off work, review each other, or iterate → agent team

---

## Setup (One-Time Per Project)

Agent teams are **disabled by default** (experimental feature). Enable via:

```json
// .claude/settings.local.json
{
  "claude_code_agent_teams": true
}
```

Tell JARVIS: "Put `claude_code_agent_teams: true` in local settings for this project" — it will create the file.

**Recommended**: Also feed the official docs into the project:
> "Create a master reference guide for agent teams in docs/ from the Claude Code documentation URL"

---

## Prompting Pattern

Structure every team spawn with these 4 components:

```
GOAL: [End state — what the finished product is and why the team exists]

Create a team of [N] teammates using [model].

Teammate 1 — [Role Name]:
  - Responsibility: [what they own]
  - Files they own: [specific paths, never shared]
  - When done: message [teammate name] with [what to hand off]

Teammate 2 — [Role Name]:
  - Responsibility: [what they own]
  - Files they own: [specific paths]
  - Dependencies: wait for [teammate name]'s message before starting [task]

Teammate 3 — [QA / Critic Role]:
  - Responsibility: review all outputs against [criteria]
  - If issues found: send back to [teammate] with specific fixes needed
  - When all pass: confirm to main session

Final deliverables:
  1. [Specific output 1]
  2. [Specific output 2]
  3. Summary doc: what was built, key decisions, how to run it
```

---

## Key Rules

### File Ownership (Critical)
Each agent must own **specific, non-overlapping files**. Never have two agents writing to the same file — they will overwrite each other.

```
✅ Agent 1 → frontend/App.jsx
✅ Agent 2 → backend/server.py
✅ Agent 3 → reports/qa-report.md

❌ Both Agent 1 and Agent 2 writing to README.md
```

### Context Bootstrapping
Agents **start cold — no conversation history**. Always inject:
1. The team goal (so they understand why their teammates exist)
2. What memory files to read (e.g., `memory/agency.md`)
3. Who their teammates are and when/why to message them
4. Exact output format and file destination

### Team Size
- **Sweet spot: 3–5 agents**
- 2 agents = probably just fan-out sub-agents instead
- 6+ agents = wave approach (group 1 runs, then group 2 uses their output)
- More agents = linearly more expensive

### Permissions
All teammates inherit permissions from the main session. If main session has tool X allowed, all agents can use tool X — including MCP servers, bash commands, file writes, etc.

### Plan Approval Mode
For high-stakes work, configure agents to plan before executing:
> "Each agent must share their plan with the main session before taking any actions. Wait for approval."

This catches wrong-direction work before it burns tokens.

### Clean Shutdown
Always end a team session with a formal shutdown sequence:
1. Main session sends shutdown message to each agent: "Save your work and confirm ready to close."
2. Each agent confirms or requests more time
3. Main session closes after all confirmations
4. Never force-kill — unsaved work and inconsistent state will result

---

## JARVIS Agent Team Templates

### Template A: Full-Stack Build
```
GOAL: Build [product] — a running app I can view on localhost with [features].

Create a team of 3 using Sonnet:

Backend Dev:
  - Build REST API in [language/framework]
  - Files: backend/
  - When done: message Frontend Dev with API endpoint list + payload shapes

Frontend Dev:
  - Build React UI
  - Files: frontend/
  - Wait for Backend Dev's API spec before building data-fetch logic
  - When done: message QA with both frontend and backend ready for testing

QA Agent:
  - Run tests, verify all endpoints, check UI flows
  - Files: reports/qa-report.md
  - If critical issues: send back to relevant dev with specific failures
  - When all pass: confirm to main session

Deliverables: running app, qa-report.md, docs/what-was-built.md
```

### Template B: Research + Strategy + Critique
```
GOAL: Produce a validated [topic] brief — researched, strategized, and stress-tested.

Create a team of 3 using Sonnet:

Researcher:
  - Deep-dive [topic], pull facts, sources, data
  - Files: research/raw-findings.md
  - When done: message Strategist AND Critic with structured inventory

Strategist:
  - Take Researcher's inventory, build actionable recommendations
  - Files: strategy/recommendations.md
  - When done: message Critic for stress-test

Critic:
  - Challenge both research and strategy — find gaps, weak assumptions, missing angles
  - Files: critique/gaps-and-risks.md
  - Send findings back to Researcher/Strategist if material gaps exist

Deliverables: research/, strategy/, critique/, owners-inbox/final-brief.md
```

### Template C: Content Pipeline
```
GOAL: Produce [N] pieces of polished [format] content on [topic].

Create a team of 3 using Sonnet:

Content Writer:
  - Draft all pieces using brand voice (read memory/core.md)
  - Files: drafts/
  - When done: send to Editor

Editor:
  - Refine for clarity, punch, engagement
  - Files: edited/
  - When done: send to QA/Publisher

QA/Publisher:
  - Final polish, format check, platform-specific adjustments
  - Files: final/
  - Flag anything that doesn't meet brand standards back to Editor

Deliverables: final/ folder with [N] ready-to-publish pieces
```

---

## Watching Teams Run (TMux)

If using Claude Code in a TMux terminal, you can:
- **See all agents in split panes** — color-coded by agent (blue, green, yellow)
- **Message individual agents directly** without going through main session
- **Approve or redirect** a specific agent mid-run

This is the preferred mode for complex builds where you want to intervene if an agent goes off-course.

---

## Common Pitfalls & Fixes

| Problem | Fix |
|---------|-----|
| Agents keep asking for permissions | Pre-approve tools in settings.local.json |
| Deliverables feel disjointed | Enforce strict file ownership, have one agent synthesize final output |
| An agent sits idle | Add explicit dependency in prompt: "wait for X message before starting Y" |
| Burning too many tokens | Reduce to 3 agents, use Haiku for lower-complexity roles |
| Work getting lost | Tell agents: "save all work-in-progress to temp files you can resume from" |
| Wrong quality / off-track | Switch to plan approval mode, or be the plan approver yourself |

---

## JARVIS Use Cases

| Trigger | Team Config |
|---------|-------------|
| "Build me a [tool/app]" | Backend Dev + Frontend Dev + QA |
| "Research and give me a full brief on [topic]" | Researcher + Strategist + Critic |
| "Write a full content package for [campaign]" | Writer + Editor + Publisher/QA |
| "Audit [client]'s entire automation stack" | CRM Auditor + Automation Auditor + Report Writer |
| "Build and validate a new n8n workflow" | Workflow Builder + Test Runner + Docs Writer |

---

## Index Entry for CLAUDE.md

```
| agent-teams | "build me a team", "spin up agents", "create a team of", complex multi-domain parallel work | Spawn coordinated specialist agents with peer messaging, shared task list, QA loops |
```
