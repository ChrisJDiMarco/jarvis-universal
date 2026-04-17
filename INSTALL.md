# JARVIS — Install Guide

This gets you from zero to a working JARVIS in about 5 minutes.

---

## 1. Prerequisites

| Requirement | Notes |
|-------------|-------|
| macOS, Linux, or WSL | JARVIS works anywhere Claude Code runs |
| Claude Code CLI | Install from https://claude.ai/code — requires a Claude Pro / Max subscription or a Claude API key |
| Git | For cloning the repo |
| Python 3.10+ (optional) | Only needed if you use `skills/wiki-builder.py` or other helper scripts |
| Node.js 20+ (optional) | Only needed for some builder / app-studio workflows |

---

## 2. Clone the Repo

```bash
git clone https://github.com/ChrisJDiMarco/jarvis-universal.git ~/jarvis
cd ~/jarvis
```

The repo drops into `~/jarvis` by convention. You can install anywhere — just update any absolute paths in `CLAUDE.md` if you change it.

---

## 3. Launch Claude Code in the Repo

```bash
claude
```

Claude Code reads `CLAUDE.md` automatically when it starts in a directory. On first run, JARVIS detects that `memory/core.md` is still a template and triggers the **First Run Protocol**:

1. Greets you
2. Asks 3 onboarding questions (name + what you do, top goal, tools you use)
3. Detects your archetype from `setup/archetypes.md`
4. Populates `memory/core.md` with your identity
5. Tells you which agents are active for your context
6. Asks what to work on first

You're running.

---

## 4. Optional: Connect MCP Servers

JARVIS is most powerful when it can reach your tools directly. Install any of these via `claude mcp add` or the Claude Code MCP marketplace:

| MCP | What it unlocks |
|-----|----------------|
| `gmail` | Read / draft emails directly |
| `google-calendar` | Calendar queries, meeting prep, scheduling |
| `google-drive` | Pull docs for research and briefings |
| `notion` | Search / write your Notion workspace |
| `slack` | Send messages, read channels |
| `firecrawl` | Web scraping and search — core research tool |
| `n8n` | Trigger / manage automation workflows |
| `imessage` (macOS) | Proactive alerts to your phone |
| `desktop-commander` | Local file operations and process control |
| `claude-in-chrome` | Browser automation for sites without a dedicated MCP |

Each MCP has its own setup docs. JARVIS will route to whichever ones you have connected — you don't need all of them to start.

---

## 5. Optional: Wire Up Scheduled Tasks

If you install the `scheduled-tasks` MCP, you can set up recurring runs. Common examples:

| Task | Schedule | Effect |
|------|----------|--------|
| `morning-briefing` | Weekdays 8:00am | Calendar + priorities + inbox pushed to you |
| `weekly-review` | Friday 5:00pm | Progress scoreboard + memory update |

Ask JARVIS: `"set up a morning briefing every weekday at 8am"` — it handles the rest.

---

## 6. Verify It's Working

Try these smoke tests in Claude Code:

```
"morning briefing"
"what agents do I have?"
"research the top 3 AI note-taking apps"
"write a LinkedIn post about learning something new this week"
```

Each one should route to a different specialist and produce a real output. Outputs go to `owners-inbox/`.

---

## 7. Where Things Live

| Path | Purpose |
|------|---------|
| `CLAUDE.md` | System config — loaded by Claude Code every session |
| `memory/` | Persistent operator context (capped markdown files) |
| `.claude/agents/` | 65 agent definitions |
| `.claude/rules/` | Always-loaded guardrails (coding-style, security, testing, ...) |
| `skills/` | ~55 top-level skill playbooks |
| `skills/ecc/` | 181 ECC technical skills |
| `owners-inbox/` | Everything JARVIS produces for your review |
| `team-inbox/` | Drop files here for JARVIS to process |
| `projects/` | Per-project working directories |
| `logs/` | Activity, memory updates, session breadcrumbs |

---

## 8. Updating

```bash
cd ~/jarvis
git pull
```

Your `memory/` directory is gitignored by default, so updates won't touch your personal context. Review the CHANGELOG for any breaking changes to skill / agent signatures.

---

## 9. Troubleshooting

**Claude Code starts but doesn't ask first-run questions.**
`memory/core.md` has already been populated. Delete it and restart — or ask JARVIS to "re-run first-run setup".

**An agent fails with `command not found` or missing MCP.**
That agent needs an MCP you haven't installed yet. JARVIS will tell you which one. Install it via `claude mcp add` and retry.

**Memory files hit their caps.**
Ask JARVIS: `"compress memory/[file].md"`. The memory-management skill runs a Haiku pass to consolidate older entries.

**Context window feels crowded mid-session.**
The PreCompact hook at `hooks/precompact_hook.sh` saves state automatically. Start a new session — JARVIS will detect the recovery flag at `logs/precompact-flag.md` and load L2+L3 memory before continuing.

---

## 10. Next Steps

- Read `CLAUDE.md` end-to-end — it is the system manual
- Browse `skills/` for the full catalog of playbooks
- Browse `.claude/agents/` to see what each specialist does
- Ask JARVIS: `"what can you do?"` — it will give you a personalized tour based on your archetype

Enjoy.
