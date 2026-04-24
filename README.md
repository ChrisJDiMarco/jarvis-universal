<div align="center">

```
    ██╗ █████╗ ██████╗ ██╗   ██╗██╗███████╗
    ██║██╔══██╗██╔══██╗██║   ██║██║██╔════╝
    ██║███████║██████╔╝██║   ██║██║███████╗
██   ██║██╔══██║██╔══██╗╚██╗ ██╔╝██║╚════██║
╚█████╔╝██║  ██║██║  ██║ ╚████╔╝ ██║███████║
 ╚════╝ ╚═╝  ╚═╝╚═╝  ╚═╝  ╚═══╝  ╚═╝╚══════╝
```

### Universal Agentic Operating System

**Not a chatbot. A team.**

```
Chat AI                          JARVIS
──────────────────────────────   ──────────────────────────────────────
One model, no memory         →   63 specialists + layered memory
Forgets everything each chat →   Remembers goals, decisions, rules
Hallucinated stats & facts   →   Claims verified before delivery
Fails silently               →   Self-healing loops, 5-attempt recovery
Gets worse at edge cases     →   MetaClaw: every failure becomes a rule
You manage the process       →   Orchestrator routes, specialists execute
```

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Built with Claude](https://img.shields.io/badge/Built%20with-Claude%20Code-blueviolet)](https://claude.com/product/claude-code)
[![Agents](https://img.shields.io/badge/Agents-63-blue)](/.claude/agents)
[![Skills](https://img.shields.io/badge/Skills-290%2B-green)](./skills)
[![Status](https://img.shields.io/badge/Status-Production-success)](./)

[**Quick Start →**](#-setup) &nbsp;·&nbsp; [**What It Does →**](#-what-jarvis-does) &nbsp;·&nbsp; [**How It Compares →**](#-how-it-compares) &nbsp;·&nbsp; [**Architecture →**](#-architecture)

</div>

---

## Why This Exists

Every AI tool puts you in the orchestrator seat — you decide which model, what context to paste, what to carry across sessions, when to switch tools. For a system that's supposed to be working _for_ you, that's a lot of operator work.

JARVIS flips it. You say what you want in plain language. An orchestrator routes the request to the right specialist. The specialists have their own tools, their own memory, and their own rules. The system extracts a lesson from every failure and never makes the same mistake twice.

It's not an assistant. It's a team that happens to live inside Claude Code.

---

## ⚡ What JARVIS Does

| You say... | JARVIS does... |
|-----------|----------------|
| `"Research [topic]"` | 6-phase pipeline: scope → search → screen → extract → synthesize → deliver with citations |
| `"Write a post about [X]"` | Drafts in your voice for any platform, claims fact-checked before delivery |
| `"Build an app that does [X]"` | 25-prompt, 7-day build: PRD → stack → auth → backend → payments → launch |
| `"Automate [workflow]"` | Designs + deploys n8n/Zapier workflows with self-healing error handling |
| `"Morning briefing"` | Calendar, priorities, inbox summary, project status — in under 60 seconds |
| `"Analyze my competitors"` | Validated competitive briefs — no hallucinated pricing or fake data |
| `"Monitor [condition] and alert me"` | Watches continuously, sends proactive iMessage/Slack/email alerts |
| `"Build a landing page for [X]"` | 2026-tier animated HTML — depth, motion, conversion-optimized |
| `"Prep me for my meeting with [name]"` | Pulls context, drafts talking points, formats agenda |
| `"Review this code"` | Multi-specialist review: quality + security + language-specific patterns |

---

## 🥊 How It Compares

|  | JARVIS | Bare Claude Code | Cursor / Copilot | Aider | CrewAI / LangGraph |
|--|--------|------------------|------------------|-------|--------------------|
| **Primary use** | Any knowledge work | Coding | IDE coding | Pair-programming | Build-your-own agents |
| **Specialist roster** | ✅ 63 + 47 ECC engineers | ❌ | ❌ | ❌ | Build yourself |
| **Persistent memory** | ✅ 4-layer lazy load | ⚠️ project files | ❌ | ❌ | Build yourself |
| **Learns from failures** | ✅ MetaClaw | ❌ | ❌ | ❌ | ❌ |
| **Works out of the box** | ✅ Clone + run | ✅ Clone + run | ✅ | ✅ | ❌ (framework) |
| **Scope** | Research, content, build, analyze, schedule | Coding tasks | Coding tasks | Coding tasks | Whatever you build |

JARVIS is built **on top of** Claude Code — so you get Claude Code's strengths plus routing, memory, and a pre-loaded specialist team.

---

## 🏗 Architecture

```mermaid
graph TD
    You(["👤 You<br/><i>plain language</i>"])

    You --> ORCH["🧠 Orchestrator<br/><i>routes every request</i>"]

    ORCH --> R["🔬 Researcher<br/>deep dives · intel · facts"]
    ORCH --> C["✍️ Content Creator<br/>posts · articles · newsletters"]
    ORCH --> B["🔨 Builder<br/>apps · automation · code"]
    ORCH --> A["📊 Analyst<br/>market · SEO · competitive"]
    ORCH --> S["📅 Scheduler<br/>calendar · meetings · prep"]
    ORCH --> F["💰 Finance<br/>revenue · costs · invoices"]
    ORCH --> W["🎨 Web Designer<br/>landing pages · UI · motion"]

    B --> ECC["⚙️ ECC Sub-Team<br/><i>47 specialist engineers</i>"]

    ECC --> P["planner · architect<br/>tdd-guide · code-reviewer<br/>security · refactor<br/>+ 41 more"]

    ORCH --> MEM["💾 Memory System<br/><i>persistent across sessions</i>"]
    MEM --> L0["L0: Identity<br/><i>always loaded</i>"]
    MEM --> L1["L1: Critical Facts<br/><i>always loaded</i>"]
    MEM --> L2["L2: Domain Context<br/><i>loaded on demand</i>"]
    MEM --> L3["L3: Deep History<br/><i>recovery mode</i>"]

    ORCH --> SK["📚 Skills Library<br/>290+ playbooks"]
    ORCH --> MC["🧬 MetaClaw<br/><i>learns from failures</i>"]

    style You fill:#4f46e5,color:#fff
    style ORCH fill:#7c3aed,color:#fff
    style MEM fill:#0f766e,color:#fff
    style MC fill:#b91c1c,color:#fff
    style ECC fill:#1d4ed8,color:#fff
    style SK fill:#065f46,color:#fff
```

---

## 🧠 The Memory System

JARVIS never asks the same question twice. Memory is stored in structured, capped markdown files — loaded lazily so they don't bloat every conversation.

```
Session Start
│
├── L0 — Identity (~200 tokens) ········· ALWAYS loaded
│   └── Who you are, archetype, working style
│
├── L1 — Critical Facts (~300 tokens) ··· ALWAYS loaded
│   └── Active focus, constraints, preferences
│
├── L2 — Domain Context ················· Loaded when relevant
│   ├── memory/context.md   → projects, clients, tools
│   ├── memory/decisions.md → past decisions + rationale
│   └── memory/learnings.md → extracted patterns
│
└── L3 — Deep History ··················· Loaded on recovery only
    └── relationships, domain files, soul.md
```

**At session end**, JARVIS evaluates what it learned and writes updates to the appropriate layer. The index rebuilds automatically.

```bash
# BM25 search across all memory files (built-in, no external DB)
python3 memory/memory_search.py "what did we decide about pricing" --top 3
python3 memory/memory_search.py "CRM tool decision" --top 5
```

---

## 🧬 MetaClaw — The Self-Improvement Loop

```
Error / Unexpected Result
        │
        ▼
   [ Extract Lesson ]
   What happened? Why? What rule prevents it?
        │
        ▼
   [ Store in skills/learned/ ]
   Categorized by type: tool-routing, workflow-patterns,
   vibe-coding, integration-gotchas, prompt-patterns
        │
        ▼
   [ Inject on Next Run ]
   Relevant agents receive lessons before executing
        │
        ▼
   Immunity — same mistake never happens again
```

JARVIS ships with **pre-loaded lessons** from real-world usage — tool routing decisions, workflow architecture patterns, app-building gotchas, and prompt engineering rules already baked in from day one.

---

## 👤 Who It's For

JARVIS asks 3 questions on first run and configures itself for your archetype. No manual setup.

| Archetype | Primary Focus | Core Agents |
|-----------|--------------|-------------|
| 🏢 **Business Owner** | Pipeline, clients, revenue, market intel | researcher, finance, analyst, content-creator |
| 💼 **Solopreneur** | Projects, invoicing, client comms, scheduling | scheduler, finance, content-creator |
| 🎨 **Creator** | Content pipeline, platform strategy, monetization | content-creator, researcher, analyst |
| 👩‍💻 **Developer** | Code, architecture, automation, debugging | builder + full ECC sub-team |
| 🔬 **Researcher** | Deep research, literature review, citations | researcher (deep pipeline) |
| 🎓 **Student** | Study planning, research, writing | researcher, scheduler |
| 👔 **Executive** | Strategic briefings, team coordination | researcher, analyst, scheduler |
| 🏠 **Personal** | Calendar, tasks, goals, life organization | scheduler, researcher |

---

## 🚀 Setup

### Prerequisites
- [Claude Code](https://claude.com/product/claude-code) — requires Claude Pro or API key

### Install

```bash
git clone https://github.com/ChrisJDiMarco/jarvis-universal.git ~/jarvis
cd ~/jarvis && claude
```

JARVIS detects first run automatically and walks you through 3 questions:

```
JARVIS: What's your name, and in one sentence — what do you do?
JARVIS: What's your main goal right now?
JARVIS: What tools do you use day-to-day?
```

After about two minutes, JARVIS has populated memory, activated the right agents, and is ready to work.

### Optional Power-Up: Semantic Code Search

Add a fully local vector index over your entire JARVIS corpus — code, memory, skills, agents, docs. JARVIS can then find things by meaning, not exact keywords. Great for queries like `"find where we handle [concept]"` or `"anything about [topic]?"` across every project.

Fully offline: Ollama embeddings + local Milvus container. Zero API cost, data stays on your machine. ~10 min to set up. See [`docs/semantic-code-search-setup.md`](docs/semantic-code-search-setup.md).

---

## 🔌 MCP Integrations (Optional — Unlocks Full Power)

MCPs give JARVIS direct API access to your tools, replacing slower browser automation.

| MCP | What it unlocks |
|-----|----------------|
| 📧 **Gmail** | Read threads, draft replies, search inbox |
| 📅 **Google Calendar** | Query events, create meetings, meeting prep |
| 📝 **Notion** | Search + write your workspace |
| 💬 **Slack** | Send messages, read channels, search |
| 🔍 **Firecrawl** | Web scraping + search — core research tool |
| 🔄 **n8n** | Trigger + manage automation workflows |
| 🗂 **Google Drive** | Pull docs into research and briefings |
| 📱 **iMessage / SMS** | Proactive alerts to your phone |

> **Install**: each MCP has its own setup flow. Browse the official server list at [modelcontextprotocol/servers](https://github.com/modelcontextprotocol/servers) and Claude Code's MCP docs at [docs.claude.com/claude-code/mcp](https://docs.claude.com/en/docs/claude-code/mcp). Generic shape: `claude mcp add <name> -- <command>`.

> **Tier priority**: Direct MCP → automation workflow → browser automation → manual. JARVIS always uses the fastest available path.

---

## 📂 File Structure

```
~/jarvis/
│
├── 📄 CLAUDE.md               ← System brain — loaded every session by Claude Code
├── 📄 AGENTS.md               ← Neutral runtime pointer for Codex / Cursor / other tools
├── 📄 INSTALL.md              ← Detailed setup guide
│
├── 🧠 memory/                 ← What JARVIS knows about you
│   ├── core.md                  L0/L2 — identity + context
│   ├── L1-critical-facts.md     Always-loaded quick facts
│   ├── context.md               Projects, tools, cadence
│   ├── decisions.md             Decision log with rationale
│   ├── learnings.md             Extracted patterns
│   ├── soul.md                  Operating philosophy
│   ├── memory_indexer.py        BM25 index builder
│   └── memory_search.py         CLI search tool
│
├── 🤖 .claude/agents/         ← 63 specialist agents
│   ├── orchestrator.md          Chief of Staff
│   ├── researcher.md            Deep research pipeline
│   ├── builder.md               App + automation engineer
│   ├── content-creator.md       Brand-voice writing
│   ├── analyst.md               Market + SEO + competitive
│   ├── [... 58 more agents]
│
├── 📚 skills/                 ← 290+ skill playbooks
│   ├── researcher-deep.md       6-phase research pipeline
│   ├── vibecode-app-builder.md  25-prompt app build process
│   ├── elite-web-ui/            2026-tier web design system
│   ├── competitive-intel.md     Validated competitor research
│   ├── metaclaw-learning.md     Self-improvement protocol
│   ├── learned/                 Auto-generated lessons (MetaClaw)
│   └── ecc/                     237 engineering skill playbooks
│
├── ⚙️  setup/
│   ├── archetypes.md            8 operator archetypes + routing
│   └── first-run.md             Setup wizard instructions
│
├── 📥 owners-inbox/           ← Every output JARVIS produces for you
├── 📤 team-inbox/             ← Drop files here for JARVIS to process
├── 📁 projects/               ← Per-project context files
├── 🪝 hooks/                  ← Auto-memory + session logging
├── 📊 logs/                   ← Activity log, memory update log
└── 📖 docs/                   ← System documentation
```

---

## 💬 Examples

<details>
<summary><b>🔬 Deep Research</b></summary>

Ask for a deep dive and you get a 6-phase pipeline, not a one-shot answer:

1. **Scope** — JARVIS restates the question and flags ambiguities
2. **Search** — 6-10 parallel queries across sources
3. **Screen** — filter to high-signal sources, discard junk
4. **Extract** — pull claims, stats, quotes with citations
5. **Synthesize** — build the narrative, flag gaps
6. **Deliver** — 1,500–3,000 word report with source list + confidence levels

Claims that can't be verified get flagged with `[unverified]` instead of being silently presented as fact.
</details>

<details>
<summary><b>🔨 Building an App</b></summary>

The `vibecode-app-builder` skill runs a 25-prompt process over 7 working days:

- **Day 1** — PRD, stack decision, schema
- **Day 2** — File structure + auth
- **Day 3** — Core feature + self-healing integrations
- **Day 4** — Dashboard + UI polish
- **Day 5** — Payments (Stripe)
- **Day 6** — Mobile-friendly polish
- **Day 7** — Deploy + monitoring

Every step runs through the self-healing executor: build → test → diagnose → repair → retry, up to 5 iterations before escalating to you.
</details>

<details>
<summary><b>🧬 Self-Improvement in Action</b></summary>

A real pattern from usage:

> JARVIS tries Firecrawl on a G2 review page → rate-limited → falls back to Chrome scrape → succeeds.
>
> MetaClaw extracts the lesson:
> - **Rule:** G2/Capterra review pages rate-limit Firecrawl — use Chrome scrape instead
> - **Confidence:** HIGH
> - **Stored in:** `skills/learned/tool-routing.md`
>
> Next time anyone asks JARVIS to scrape G2, it goes straight to Chrome. The failure never repeats.
</details>

<details>
<summary><b>📅 Morning Briefing</b></summary>

A single `"morning briefing"` returns:

- Today's calendar (events with prep notes attached for each)
- Active priorities from memory (with blocker status)
- Owners-inbox items awaiting your review
- Outstanding items from yesterday that didn't close

Designed to replace the first 10 minutes of every morning.
</details>

---

## 🤖 The Agent Team

<details>
<summary><b>Core Team (16 agents)</b></summary>

| Agent | Role | When to Use |
|-------|------|-------------|
| `orchestrator` | Chief of Staff | Routes everything — you never call this directly |
| `researcher` | Senior Researcher | "Research [topic]", "Deep dive on [X]" |
| `content-creator` | Content Strategist | "Write a post about [X]", "Draft a newsletter" |
| `builder` | App & Automation Engineer | "Build [thing]", "Automate [process]" |
| `analyst` | Intelligence Analyst | "Analyze competitors", "SEO audit for [site]" |
| `scheduler` | Calendar Manager | "What's on my calendar", "Prep me for [meeting]" |
| `finance` | Finance Tracker | "Log revenue", "What's my burn rate" |
| `web-designer` | Visual Web Designer | "Build a landing page for [X]" |
| `comms-triage` | Comms Triage | "What needs my attention", multi-channel inbox |
| `deal-closer` | Sales & Closing | "Write a proposal for [client]" |
| `scout` | Market Scout | "Find leads in [niche]", "Validate this market" |
| `n8n-architect` | Automation Architect | "Design a workflow for [X]" |
| `vibecode-builder` | Vibe Code Engineer | "7-day build for [app]" |
| `app-studio` | Multi-Platform Builder | "Build web + mobile app for [X]" |
| `voice-agent-builder` | Voice AI Builder | "Set up a voice agent for [business]" |
| `seo-content-agent` | SEO Content Machine | "Content calendar for [site]" |

</details>

<details>
<summary><b>ECC Builder Sub-Team (47 engineering specialists)</b></summary>

When `builder` gets a coding task, it delegates to the right specialist:

| Category | Agents |
|----------|--------|
| **Planning** | `planner`, `architect`, `docs-lookup` |
| **Code Quality** | `code-reviewer`, `refactor-cleaner`, `performance-optimizer` |
| **Testing** | `tdd-guide`, `e2e-runner`, `security-reviewer` |
| **Build & Deploy** | `build-error-resolver`, `doc-updater`, `loop-operator` |
| **Language Reviewers** | `typescript`, `python`, `go`, `rust`, `java`, `kotlin`, `flutter`, `cpp`, `csharp`, `database`, + more |

</details>

---

## 🔧 Hiring New Agents

JARVIS comes with 63 agents — but you can add more any time:

```
"I need an agent that handles customer onboarding emails.
They should draft sequences based on user behavior and
integrate with our CRM."
```

JARVIS writes the `.md` file, adds it to the roster, and briefs you on capabilities. Takes about 30 seconds.

---

## 🛣 Roadmap

- **Voice layer** — primary interaction through the `voice-agent-builder` pattern
- **Multi-device sync** — memory accessible across desktop, mobile, and server deployments
- **Community skill registry** — contribute a skill, everyone inherits it

---

## 💡 Philosophy

> *Five principles that drive every design decision.*

**1 — Route, don't execute.** The orchestrator never does domain work directly. It delegates to specialists. Context stays clean, outputs stay high-quality.

**2 — Memory is sacred.** The system is only as good as what it remembers. Memory files are capped, structured, and maintained carefully — so information stays current and never bloats.

**3 — Self-improve or stagnate.** JARVIS extracts lessons from every failure. The MetaClaw system turns mistakes into permanent rules. It's not just an assistant — it's a learning system.

**4 — Plan before executing.** For any task over 3 steps, JARVIS proposes a plan first. For significant work, it writes a Requirement Document. Wasted execution is worse than wasted planning.

**5 — The most direct tool wins.** Direct MCP over browser automation. Specific API over general search. Fastest reliable path — always.

---

## 🤝 Contributing

PRs welcome. Highest-value contributions:

- **New skill playbooks** in `skills/` — real patterns from real usage
- **New agent definitions** in `.claude/agents/` — specialized roles
- **Archetype templates** in `setup/archetypes.md` — new operator types
- **Learned lessons** in `skills/learned/` — real failure patterns

---

## License

MIT — use it, fork it, build on it, sell what you build with it.

---

<div align="center">

Built with [Claude Code](https://claude.com/product/claude-code) · Inspired by the idea that AI should work like a team, not a chatbot

**[⭐ Star this repo](https://github.com/ChrisJDiMarco/jarvis-universal)** if JARVIS saves you time

</div>
