# Skills Index

> **Source of truth for skills is `CLAUDE.md` → Active Skills Index** (loads every session).
> This file is the categorized, browsable version — use it when you need to find a skill by domain.
> When adding a new skill: update BOTH this file AND the Active Skills Index in `CLAUDE.md`.
> Load a skill by reading its `.md` file before executing the task.

---

## 🧠 Meta-Skills (Used by Any Agent)

| Skill | File | Trigger Phrases |
|-------|------|----------------|
| Agent Species Selector | `agent-species-selector.md` | "what kind of agent", "which agent pattern", "agent architecture for" |
| Agent Teams | `agent-teams.md` | "build me a team", "spin up a team", "create a team of" |
| Multi-Agent Fanout | `multi-agent-fanout.md` | "in parallel", "simultaneously", "do all of this at once" |
| Memory Management | `memory-management.md` | "remember this", "update memory", session end |
| MetaClaw Learning | `metaclaw-learning.md` | after errors, "extract learnings", 3rd pattern repeat |
| Claim Verifier | `claim-verifier.md` | "verify this", "fact check", auto on content/proposals |
| Self-Healing Executor | `self-healing-executor.md` | "build and test", "auto-fix", deploy phase |
| Deep Research | `researcher-deep.md` | "deep dive on", "deep research", "literature review on" |
| Deep Search Harness | `deep-search.md` | Any retrieval task — used by researcher agent + researcher-deep COLLECT phase |
| Persistent Daemon | `persistent-daemon.md` | "monitor", "alert me when", "watch for" |
| Browser Automation | `browser-automation.md` | "open", "go to", "click", "scrape", "send message", "run on mac" |
| **Karpathy Loop** | `karpathy-loop.md` | "karpathy loop", "auto-research", "self-optimize", "run experiments overnight", "optimize [metric] automatically" |
| **Heartbeat Agent** | `heartbeat.md` | "add a heartbeat", "proactive JARVIS", "check in on me", "monitor without being asked", "autonomous check-ins" |
| **Agent Infrastructure Audit** | `agent-infrastructure-audit.md` | "infrastructure audit", "50x gap", "agent friction", "optimize stack for agents", "agent-native" |
| **MCP Discovery** | `mcp-discovery.md` | "I need a tool for [X]", "do we have an MCP for [Y]", before falling back to Chrome |
| **MCP Code Execution Pattern** | `mcp-code-exec.md` | MCP server with 20+ tools, agent context bloating from tool schemas |
| **File Delivery** | `file-delivery.md` | Implicit on every file deliverable — return path + summary, never paste contents |
| **Agent Builder** | `agent-builder.md` | "I need an agent that handles [X]", "build me an agent for [Y]", "hire a new agent" |
| **JARVIS Control Plane** | `jarvis-control-plane.md` | "command center", "control center", "mission control", "agent OS dashboard", "OS interface", "War Room", "mobile bridge", "ClaudeClaw-style" |
| **Grade** | `grade.md` | "/grade", "grade this", "grade the work", independent CTO review |

---

## 📣 Content Skills

| Skill | File | Trigger Phrases |
|-------|------|----------------|
| Content Creation | `content-creation.md` | "write a post", "LinkedIn", "Reddit", "newsletter", "draft" |
| SEO Content Engine | `seo-content-engine.md` | "SEO content", "blog", "content calendar", "keyword gaps" |
| Voice Agent Builder | `voice-agent-builder.md` | "build a voice agent", "set up a voice bot", "configure voice" |

---

## 🏗️ Build Skills

| Skill | File | Trigger Phrases |
|-------|------|----------------|
| Vibecode App Builder | `vibecode-app-builder.md` | "build an app", "vibe code", "7-day build", "scaffold [app]" — web-only, Supabase |
| **App Studio** | `app-studio.md` | "web + mobile", "mobile app", "iOS app", "full-stack", "Appifex-style", "app studio" — multi-platform monorepo |
| App Studio Templates | `app-studio-templates.md` | Quick-reference templates for App Studio builds (vision brief, build log, deploy manifest, monorepo init) |
| Workflow Builder | `workflow-builder.md` | "build a workflow", "automate [X]", "new n8n workflow" |
| Elite Web UI | `elite-web-ui/SKILL.md` | "landing page", "make it animated", "premium UI", any visual web artifact |
| Voice Agent Builder | `voice-agent-builder.md` | "build a voice agent", "set up a voice bot", "configure voice" |
| Video Builder | `video-builder.md` | "build a demo video", "product video", "Remotion" |

---

## 🔍 Intelligence Skills

| Skill | File | Trigger Phrases |
|-------|------|----------------|
| Competitive Intel | `competitive-intel.md` | "research [company]", "competitive brief", "intel on [competitor]" |
| Funded Company Analyzer | `funded-company-analyzer.md` | "find the play on [company]", "reverse engineer [company]", "replicate [company]" |

---

## 📅 Operations Skills

| Skill | File | Trigger Phrases |
|-------|------|----------------|
| Morning Briefing | `morning-briefing.md` | "morning briefing", "come online", "good morning" |
| Weekly Review | `weekly-review.md` | "weekly review", "end of week", "how's the week looking" |

---

## 📁 Learned Skills

Self-generated patterns from repeated tasks.

| Skill | File | Origin |
|-------|------|--------|
| *(auto-generated)* | `learned/` | Created by metaclaw-learning when a pattern repeats 3+ times |

---

## Adding a New Skill

When a repeatable pattern emerges (3+ times doing the same type of task):
1. Name it with a clear trigger phrase
2. Write a one-sentence goal
3. Document the step-by-step process
4. List reference files needed
5. Define rules and guardrails
6. Save to `skills/[skill-name].md`
7. Add a row to this INDEX.md under the right category
8. Add to the Active Skills Index in `CLAUDE.md`

---

## Related
[[CLAUDE]]  [[researcher-deep]]  [[deep-search]]  [[competitive-intel]]  [[content-creation]]  [[vibecode-app-builder]]  [[morning-briefing]]  [[weekly-review]]  [[memory-management]]  [[elite-web-ui]]  [[workflow-builder]]  [[metaclaw-learning]]  [[claim-verifier]]  [[self-healing-executor]]  [[persistent-daemon]]
