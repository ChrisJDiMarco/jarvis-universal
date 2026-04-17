# JARVIS — Universal Agentic Operating System

**JARVIS is a Claude Code project that turns Claude into your personal AI chief of staff.** It self-configures on first run, adapts to who you are, and gets smarter every session.

---

## What It Is

JARVIS is not a chatbot. It's an **operating system for your work** — a team of AI specialists you can delegate to, with persistent memory, self-improving rules, and the ability to monitor your world and proactively act.

Think of it as: you, plus a team of world-class specialists who never sleep, never forget, and get better at working with you over time.

---

## What It Can Do

| I want to... | JARVIS does... |
|-------------|---------------|
| Research anything | Runs a 6-phase pipeline: search → screen → extract → synthesize → gap analysis → deliver with citations |
| Write posts / articles | Drafts in your voice for any platform (LinkedIn, Reddit, newsletter, blog) with auto fact-checking |
| Build an app | Follows a proven 25-prompt, 7-day methodology: PRD → stack → auth → backend → payments → launch |
| Automate a process | Designs + deploys automation workflows (n8n, Zapier, Make) with error handling and self-healing |
| Build a website | Produces animated, 2026-tier HTML with depth, motion, and conversion optimization |
| Stay on top of my calendar | Morning briefings, meeting prep, deadline tracking |
| Track revenue/expenses | Logs income and costs, tracks against goals, generates invoices |
| Monitor something continuously | Watches conditions and sends proactive alerts (via iMessage, Slack, email) |
| Analyze competitors | Produces validated competitive briefs — no hallucinated pricing |
| Never make the same mistake twice | MetaClaw system extracts lessons from every failure and injects them into future runs |

---

## Who It's For

JARVIS works for anyone. On first run, it asks 3 questions and configures itself for your archetype:

| Archetype | Primary Use |
|-----------|------------|
| 🏢 Business Owner / Entrepreneur | Pipeline, clients, revenue, content, market intelligence |
| 💼 Solopreneur / Freelancer | Projects, invoicing, client comms, scheduling |
| 🎨 Creator / Content Maker | Content pipeline, platform strategy, monetization |
| 🔬 Researcher / Academic | Deep research, literature review, citation management |
| 👩‍💻 Developer / Engineer | Code, architecture, automation, debugging |
| 🎓 Student / Learner | Study planning, research, writing, scheduling |
| 👔 Executive / Manager | Strategic briefings, team coordination, reporting |
| 🏠 Personal Assistant | Calendar, tasks, personal goals, life organization |

---

## Architecture

```
JARVIS
├── Orchestrator (routes every request to the right specialist)
├── 8 Specialist Agents (researcher, builder, analyst, writer, etc.)
├── 20+ Skill playbooks (deep research, app building, automation, etc.)
├── Persistent Memory + BM25 Search (learns your context, recalls it precisely)
├── MetaClaw Learning (extracts lessons from failures — immune system)
└── Self-Healing Executor (builds, tests, repairs, deploys — autonomously)
```

---

## Setup (5 minutes)

### Prerequisites
- [Claude Code](https://claude.ai/code) installed (requires Claude Pro subscription or API key)

### Install

```bash
git clone https://github.com/ChrisJDiMarco/jarvis-universal.git ~/jarvis
cd ~/jarvis
claude  # opens Claude Code in the jarvis directory
```

JARVIS detects it's a first run and will guide you through setup automatically.

### Optional (Unlocks Full Power)

Connect MCP servers for direct tool access:

| Tool | What it unlocks |
|------|----------------|
| Gmail MCP | Read/draft emails directly |
| Google Calendar MCP | Calendar queries, meeting prep, scheduling |
| Google Drive MCP | Pull docs for research and briefings |
| Notion MCP | Search/write your Notion workspace |
| Slack MCP | Send messages, read channels |
| Firecrawl MCP | Web scraping and search (core research tool) |
| n8n MCP | Trigger/manage automation workflows |
| iMessage MCP | Proactive alerts to your phone |

Install any of these via the MCP marketplace in Claude Code settings, or search `claude mcp add` in your terminal.

---

## How to Use It

Just talk to it. JARVIS figures out which specialist to route to.

```
"What's on my calendar this week?"
"Research the top 3 CRM tools for a 5-person sales team"
"Write a LinkedIn post about my experience building [thing]"
"Build me an app that [does X]"
"Automate my [workflow]"
"Morning briefing"
"Weekly review"
"Monitor my site uptime and alert me if it goes down"
"Build a voice agent for my [business]"
```

---

## Memory & Self-Improvement

JARVIS remembers across sessions:
- **What you do** (role, goals, projects)
- **How you work** (preferences, communication style)
- **Decisions made** (no re-explaining context)
- **Lessons learned** (MetaClaw immune system — failures become rules)

Memory files live in `memory/` — capped markdown files, indexed for fast BM25 recall.

### Memory Search

JARVIS ships with a lightweight semantic search layer over all memory files, so it can surface the right context without loading every file into the conversation.

```bash
# Build the index (run once after cloning, auto-updates after each session)
pip3 install rank-bm25
python3 memory/memory_indexer.py

# Search from the CLI
python3 memory/memory_search.py "Thinklet pricing decision"
python3 memory/memory_search.py "what did we decide about the launch" --top 3
```

The index is rebuilt automatically at session end whenever memory files are updated (via `hooks/stop_hook.sh`). The generated index file (`memory/memory_index.json`) is gitignored — each user builds their own from their own memory files.

---

## Hiring New Agents

JARVIS comes with 65 agents (18 JARVIS specialists + 47 ECC builder sub-team). You can hire more:

```
"I need an agent that handles [X]. They should [Y] and use [Z] tools."
```

JARVIS will write the agent definition file, add it to the roster, and brief you on capabilities.

---

## Self-Improvement

JARVIS gets smarter over time through three mechanisms:

1. **MetaClaw Learning**: After every failure/recovery or repeated pattern, lessons are extracted and stored in `skills/learned/`. Future agents automatically receive relevant lessons before executing.

2. **Memory Updates**: At session end, JARVIS evaluates what it learned and updates the appropriate memory file — so it never forgets.

3. **Skill Creation**: When the same task type appears 3+ times, JARVIS creates a new skill file — turning ad-hoc work into a repeatable playbook.

---

## File Structure

```
~/jarvis/
├── CLAUDE.md              ← System configuration (read by Claude on every session)
├── setup/                 ← First-run wizard and archetype definitions
├── memory/                ← Persistent context (capped .md files)
├── .claude/agents/        ← Specialist agent definitions
├── team/roster.md         ← Agent registry
├── skills/                ← Skill playbooks (~55 top-level + 181 ECC)
│   └── learned/           ← Auto-generated lessons from MetaClaw
├── .claude/
│   ├── agents/            ← 65 agent definitions
│   └── rules/             ← Always-loaded guardrails (coding-style, security, ...)
├── owners-inbox/          ← All outputs for your review
├── team-inbox/            ← Drop files here for JARVIS to process
├── projects/              ← Per-project files
├── n8n-configs/           ← Automation workflow templates
├── data/                  ← SQLite database (optional)
├── logs/                  ← Activity and memory update logs
├── assets/                ← Your brand files, templates
└── docs/                  ← System documentation
```

---

## Philosophy

JARVIS is built on a few core ideas:

**Route, don't execute.** The orchestrator never does domain work directly. It delegates to specialists. This keeps context clean and outputs high-quality.

**Memory is sacred.** The system is only as good as what it remembers. Memory files are capped, structured, and maintained carefully — so information stays current and useful.

**Self-improve or stagnate.** JARVIS extracts lessons from every failure. The MetaClaw system turns painful mistakes into permanent immunities. It's not just an assistant — it's a learning system.

**Build before executing.** For any task >3 steps, JARVIS proposes a plan first. For significant tasks, it writes a Requirement Document. This prevents wasted work and miscommunication.

**The most direct tool wins.** Always use the most specific MCP for a task. Never use Chrome automation for a site that has a direct MCP. Never use a slower tier when a faster one exists.

---

## Contributing

PRs welcome. The most valuable contributions:
- New skill playbooks in `skills/`
- New agent definitions in `.claude/agents/`
- Improvements to existing skills based on real usage
- New archetype templates in `setup/archetypes.md`

---

## License

MIT — use it, fork it, build on it.

---

*Built with Claude Code and the Claude Agent SDK. Inspired by the idea that AI should work like a team, not a chatbot.*

---

## Related
[[core]]  [[CLAUDE]]  [[L1-critical-facts]]
