# Team Roster

> Agent files live in `.claude/agents/`. Each is a `.md` file defining role, model preference, tools, behavioral rules, and output format.

---

## Core Team

| Agent | Role | Model | Status | Specialty |
|-------|------|-------|--------|-----------|
| orchestrator | Chief of Staff | Opus | active | Routing, delegation, memory, first-run setup |
| onboarder | Setup Specialist | Sonnet | active | MCP + connector setup. Walks through Claude Code built-ins and Firecrawl/community MCPs |
| researcher | Senior Researcher | Sonnet | active | Web research, competitive intel, deep dives |
| content-creator | Content Strategist | Sonnet | active | Posts, articles, newsletters, brand voice |
| scheduler | Calendar Manager | Haiku/Sonnet | active | Meetings, prep, scheduling, deadlines |
| finance | Finance Tracker | Haiku/Sonnet | active | Revenue, costs, invoicing, budgets |
| builder | App & Automation Engineer | Sonnet/Opus | active | Apps, workflows, integrations, scripts |
| analyst | Intelligence Analyst | Sonnet/Opus | active | Market research, SEO, audits, reporting |
| web-designer | Visual Web Designer | Sonnet/Opus | active | Landing pages, UI, animations, design systems |

---

## Specialist Team

| Agent | Role | Model | Status | Specialty |
|-------|------|-------|--------|-----------|
| vibecode-builder | Vibe Code Engineer | Sonnet/Opus | active | 25-prompt 7-day app builds, PRD → launch (web-only, Supabase) |
| app-studio | Multi-Platform App Builder | Sonnet/Opus | active | 6-phase Appifex pipeline: web + mobile + backend monorepo, self-healing builds |
| voice-agent-builder | Voice AI Builder | Sonnet | active | Voice persona, Retell/vapi.ai setup, test protocol |
| seo-content-agent | SEO Content Machine | Sonnet | active | Keyword gaps, article generation, SEO publishing |
| n8n-architect | Automation Architect | Sonnet/Opus | active | n8n workflow design, automation patterns |
| deal-closer | Sales & Deal Closer | Sonnet | active | Proposal writing, objection handling, close sequences |
| scout | Market Scout | Sonnet | active | Lead scraping, niche validation, competitive mapping |
| comms-triage | Comms Triage | Opus | active | Multi-channel inbox triage (email/Slack/LINE/Messenger), 4-tier classification, draft replies |

---

## Agent Routing Quick Reference

| Trigger | Agent |
|---------|-------|
| "research", "deep dive", "analyze [topic]", "what does the evidence say" | researcher |
| "write a post", "LinkedIn", "Reddit", "newsletter", "content" | content-creator |
| "meeting", "schedule", "calendar", "prep me for" | scheduler |
| "revenue", "invoice", "budget", "costs", "MRR" | finance |
| "build an app" (web-only), "workflow", "automate", "script", "integrate" | builder → vibecode-app-builder skill |
| "competitive", "market analysis", "SEO", "audit [domain]" | analyst |
| "landing page", "website", "make it look", "web design" | web-designer |
| "vibe code", "build and ship", "7-day build" | vibecode-builder |
| "web + mobile", "mobile app", "iOS app", "full-stack", "app studio", "Appifex-style" | app-studio |
| "voice agent", "voice bot", "Retell", "vapi" | voice-agent-builder |
| "SEO content", "blog", "content calendar", "keywords" | seo-content-agent |
| "n8n workflow", "automate [X]", "build a workflow" | n8n-architect |
| "proposal", "close the deal", "follow up", "pitch" | deal-closer |
| "find leads", "scrape [niche]", "validate niche", "map competitors" | scout |
| "triage my inbox", "draft replies", "what needs my attention", multi-channel comms | comms-triage |
| "morning briefing", "come online" | orchestrator → morning-briefing skill |
| "remember this", "save this" | orchestrator → memory-management skill |
| "build me a team", "agent team" | orchestrator → agent-teams skill |
| "connect [tool]", "set up MCPs", "I need a tool for [X]" | onboarder |

---

## How to Hire a New Agent

Tell JARVIS in plain English:
"I need an agent that handles [X]. They should [Y] and use [Z] tools."

JARVIS will:
1. Research best practices for the role
2. Write a new `.md` file in `.claude/agents/`
3. Update this roster
4. Brief you on the new agent's capabilities

---

## Related
[[core]]  [[CLAUDE]]  [[orchestrator]]  [[researcher]]  [[content-creator]]  [[scheduler]]  [[finance]]  [[builder]]  [[analyst]]  [[web-designer]]  [[comms-triage]]
