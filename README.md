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

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Built with Claude](https://img.shields.io/badge/Built%20with-Claude%20Code-blueviolet)](https://claude.ai/code)
[![Agents](https://img.shields.io/badge/Agents-65-blue)](/.claude/agents)
[![Skills](https://img.shields.io/badge/Skills-200%2B-green)](./skills)
[![Self-Configuring](https://img.shields.io/badge/Setup-5%20minutes-orange)](./setup)

<br/>

*JARVIS is a Claude Code project that turns Claude into your personal AI operating system.*
*It self-configures on first run, learns your context, and gets smarter every session.*

[**Quick Start →**](#-setup-5-minutes) &nbsp;·&nbsp; [**What It Does →**](#-what-jarvis-does) &nbsp;·&nbsp; [**Architecture →**](#-architecture) &nbsp;·&nbsp; [**Who It's For →**](#-who-its-for)

</div>

---

## The Difference

Most AI tools are a single model answering questions. JARVIS is a **coordinated team of specialists** with persistent memory, self-healing execution, and a learning system that makes it immune to the same mistake twice.

```
Chat AI                          JARVIS
──────────────────────────────   ──────────────────────────────────────────
One model, no memory         →   65 specialists + layered memory
Forgets everything each chat →   Remembers your context, goals, decisions
Hallucinated stats & facts   →   Claims verified before delivery
Fails silently               →   Self-healing loops, 5-attempt recovery
Gets worse at edge cases     →   MetaClaw: every failure becomes a rule
You manage the process       →   Orchestrator routes, specialists execute
```

---

## ⚡ What JARVIS Does

| You say... | JARVIS does... |
|-----------|----------------|
| `"Research [topic]"` | 6-phase pipeline: scope → search → screen → extract → synthesize → deliver with citations |
| `"Write a post about [X]"` | Drafts in your voice for any platform with auto fact-checking |
| `"Build an app that does [X]"` | 25-prompt, 7-day build: PRD → stack → auth → backend → payments → launch |
| `"Automate [workflow]"` | Designs + deploys n8n/Zapier workflows with self-healing error handling |
| `"Morning briefing"` | Calendar, priorities, inbox summary, project status — in under 60 seconds |
| `"Analyze my competitors"` | Validated competitive briefs — no hallucinated pricing or fake data |
| `"Monitor [condition] and alert me"` | Watches continuously, sends proactive iMessage/Slack/email alerts |
| `"Build a landing page for [X]"` | 2026-tier animated HTML — depth, motion, conversion-optimized |
| `"Prep me for my meeting with [name]"` | Pulls context, drafts talking points, formats agenda |
| `"Review this code"` | Multi-specialist review: quality + security + language-specific patterns |

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

    ORCH --> SK["📚 Skills Library<br/>200+ playbooks"]
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

<table>
<tr>
<td align="center" width="25%">

**🏢 Business Owner**

Pipeline, clients, revenue, market intel, content

*Primary: researcher, finance, analyst, content-creator*

</td>
<td align="center" width="25%">

**💼 Solopreneur**

Projects, invoicing, client comms, scheduling

*Primary: scheduler, finance, content-creator*

</td>
<td align="center" width="25%">

**🎨 Creator**

Content pipeline, platform strategy, monetization

*Primary: content-creator, researcher, analyst*

</td>
<td align="center" width="25%">

**👩‍💻 Developer**

Code, architecture, automation, debugging

*Primary: builder + full ECC sub-team*

</td>
</tr>
<tr>
<td align="center">

**🔬 Researcher**

Deep research, literature review, citation mgmt

*Primary: researcher (deep pipeline)*

</td>
<td align="center">

**🎓 Student**

Study planning, research, writing, scheduling

*Primary: researcher, scheduler*

</td>
<td align="center">

**👔 Executive**

Strategic briefings, team coordination, reporting

*Primary: researcher, analyst, scheduler*

</td>
<td align="center">

**🏠 Personal**

Calendar, tasks, goals, life organization

*Primary: scheduler, researcher*

</td>
</tr>
</table>

---

## 🚀 Setup (5 minutes)

### Prerequisites

- [Claude Code](https://claude.ai/code) — requires Claude Pro or API key

### Install

```bash
# Clone to ~/jarvis (recommended location)
git clone https://github.com/ChrisJDiMarco/jarvis-universal.git ~/jarvis

# Open Claude Code in the jarvis directory
cd ~/jarvis && claude
```

**That's it.** JARVIS detects first run automatically and walks you through 3 questions:

```
JARVIS: What's your name, and in one sentence — what do you do or what are you building?
You:    [your answer]

JARVIS: What's your main goal right now?
You:    [your answer]

JARVIS: What tools do you use day-to-day?
You:    [Notion, Slack, Gmail, GitHub — whatever you actually use]
```

After 2 minutes, JARVIS has configured memory, activated the right agents, and is ready to work.

---

## 🔌 MCP Integrations (Optional — Unlocks Full Power)

MCPs give JARVIS direct API access to your tools — no browser automation needed.

| MCP | What it unlocks | Install |
|-----|----------------|---------|
| 📧 **Gmail** | Read threads, draft replies, search inbox | `claude mcp add gmail` |
| 📅 **Google Calendar** | Query events, create meetings, meeting prep | `claude mcp add google-calendar` |
| 📝 **Notion** | Search + write your workspace | `claude mcp add notion` |
| 💬 **Slack** | Send messages, read channels, search | `claude mcp add slack` |
| 🔍 **Firecrawl** | Web scraping + search — core research tool | `claude mcp add firecrawl` |
| 🔄 **n8n** | Trigger + manage automation workflows | `claude mcp add n8n` |
| 📱 **iMessage** | Proactive alerts to your phone | `claude mcp add imessage` |
| 🗂 **Google Drive** | Pull docs into research and briefings | `claude mcp add gdrive` |

> **Tier priority**: Direct MCP → automation workflow → Chrome automation → manual. JARVIS always uses the fastest available path.

---

## 📂 File Structure

```
~/jarvis/
│
├── 📄 CLAUDE.md               ← System brain — loaded every session
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
├── 🤖 .claude/agents/         ← 65 specialist agents
│   ├── orchestrator.md          Chief of Staff
│   ├── researcher.md            Deep research pipeline
│   ├── builder.md               App + automation engineer
│   ├── content-creator.md       Brand-voice writing
│   ├── analyst.md               Market + SEO + competitive
│   ├── [... 60 more agents]
│
├── 📚 skills/                 ← 200+ skill playbooks
│   ├── researcher-deep.md       6-phase research pipeline
│   ├── vibecode-app-builder.md  25-prompt app build process
│   ├── elite-web-ui/            2026-tier web design system
│   ├── competitive-intel.md     Validated competitor research
│   ├── metaclaw-learning.md     Self-improvement protocol
│   ├── learned/                 Auto-generated lessons (MetaClaw)
│   └── ecc/                     181 engineering skill playbooks
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

## 💬 Example Conversations

<details>
<summary><b>🔬 Deep Research</b></summary>

```
You:    Deep dive on the B2B SaaS churn problem — I want academic-level analysis

JARVIS: [routes to researcher → researcher-deep skill]
        Phase 1: Scoping the question...
        Phase 2: Running 8 parallel search queries...
        Phase 3: Screening 34 sources, filtering to 12 high-signal...
        Phase 4: Extracting key findings...
        Phase 5: Synthesizing + gap analysis...

        Delivers: 2,400-word report with citations, confidence levels,
        and flagged claims that couldn't be verified
```

</details>

<details>
<summary><b>🔨 Building an App</b></summary>

```
You:    Build me a SaaS app where users submit job applications
        and AI scores them against a rubric

JARVIS: [routes to builder → vibecode-app-builder skill]

        Day 1: PRD + stack decision (Next.js, Supabase, OpenAI)
        Day 2: File structure + auth (Supabase Auth + RLS)
        Day 3: Core feature — submission form + AI scoring pipeline
        Day 4: Dashboard + results UI
        Day 5: Payments (Stripe)
        Day 6: Polish + mobile
        Day 7: Deploy (Vercel) + monitoring

        Each step self-heals: build → test → diagnose → repair → retry
```

</details>

<details>
<summary><b>🧬 Self-Improvement in Action</b></summary>

```
[JARVIS tries Firecrawl on a page, gets rate-limited, falls back to Chrome]

MetaClaw extracts:
  Rule: "G2/Capterra review pages → use firecrawl_scrape, not Chrome"
  Confidence: HIGH
  Stored in: skills/learned/tool-routing.md

Next time anyone asks JARVIS to scrape G2, it uses Firecrawl directly.
No repeat of the failure. Permanent immunity.
```

</details>

<details>
<summary><b>📅 Morning Briefing</b></summary>

```
You:    Morning briefing

JARVIS: Good morning. Here's your day:

        CALENDAR (3 events)
        • 10:00am — Investor call with [name] — prep notes attached
        • 2:00pm — Team standup
        • 4:30pm — 1:1 with [direct report]

        PRIORITIES (from memory)
        • [Project A] — launch blocked on payment integration
        • [Project B] — waiting on design feedback

        OWNERS INBOX (2 items need your attention)
        • Competitive brief on [company] — ready for review
        • Draft LinkedIn post — needs approval before publish

        What's the focus today?
```

</details>

---

## 🤖 The Agent Team

<details>
<summary><b>Core Team (18 agents)</b></summary>

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

JARVIS comes with 65 agents — but you can add more any time:

```
"I need an agent that handles customer onboarding emails.
They should draft sequences based on user behavior and
integrate with our CRM."
```

JARVIS writes the `.md` file, adds it to the roster, and briefs you on capabilities. Takes about 30 seconds.

---

## 💡 Philosophy

> *Five principles that drive every design decision.*

**1 — Route, don't execute.** The orchestrator never does domain work directly. It delegates to specialists. Context stays clean, outputs stay high-quality.

**2 — Memory is sacred.** The system is only as good as what it remembers. Memory files are capped, structured, and maintained carefully — so information stays current and never bloats.

**3 — Self-improve or stagnate.** JARVIS extracts lessons from every failure. The MetaClaw system turns mistakes into permanent rules. It's not just an assistant — it's a learning system.

**4 — Plan before executing.** For any task over 3 steps, JARVIS proposes a plan first. For significant work, it writes a Requirement Document. Wasted execution is worse than wasted planning.

**5 — The most direct tool wins.** Direct MCP over Chrome automation. Specific API over general search. Fastest reliable path — always.

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

Built with [Claude Code](https://claude.ai/code) · Inspired by the idea that AI should work like a team, not a chatbot

**[⭐ Star this repo](https://github.com/ChrisJDiMarco/jarvis-universal)** if JARVIS saves you time

</div>
