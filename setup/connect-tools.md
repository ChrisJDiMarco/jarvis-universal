# Connect Your Tools — JARVIS Setup Reference

> Reference doc for the `onboarder` agent. Lists every tool JARVIS knows how to set up, with concrete install steps. Read top-down — built-in connectors are listed first because they're lower friction.
>
> Format per tool: **what it unlocks** → **install steps** → **verification**.

---

## Tier 1 — Built-in Claude Code Connectors

These ship with Claude Code's plugin system. They use OAuth — no API keys to copy. Install once via plugin, then run an authentication flow per service.

### Setup pattern (applies to every tool below)

```
claude plugin install engineering         # one-time, installs the plugin bundle
# In a new claude session:
"authenticate <service>"                  # triggers the OAuth flow
```

The plugin marketplace is browseable via Claude Code's `/plugin` command — search by service name or category.

| Service | What JARVIS unlocks | Plugin |
|---------|--------------------|--------|
| **Slack** | Read channels, post messages, search workspace, send DMs | `engineering` |
| **Notion** | Search workspace, create + update pages, fetch docs | `engineering` |
| **Linear** | Read tickets, create issues, query sprints | `engineering` |
| **GitHub** | Read repos, comment on PRs, manage issues | `engineering` |
| **Atlassian** (Jira/Confluence) | Read tickets, query Confluence pages | `engineering` |
| **Asana** | Read tasks, projects, workspaces | `engineering` |
| **PagerDuty** | Read incidents, on-call schedules | `engineering` |

### Verification probes (run one to confirm a tool works)

| Tool | Probe |
|------|-------|
| Slack | `slack_search_users(query: "<your-name>")` — should return your profile |
| Notion | `notion-search(query: "any-term-from-your-workspace")` |
| Linear | `linear_search_issues(query: "")` — returns your recent tickets |
| GitHub | `github_get_user()` — returns your profile |
| Atlassian | `atlassian_search(query: "any-keyword")` |
| Asana | `asana_list_workspaces()` |

---

## Tier 1.5 — Google Workspace (built-in, separate flow)

Google services are typically separate connectors — same OAuth pattern.

| Service | What JARVIS unlocks | Connector |
|---------|--------------------|-----------|
| **Gmail** | Search threads, read messages, draft replies, send | `gmail` |
| **Google Calendar** | List events, create meetings, find free slots, respond to invites | `gcal` |
| **Google Drive** | Search files, fetch document content | `google_drive` |

Install via Claude Code's `/connectors` slash command (browse + click), or `claude mcp add <name>` if you have a custom Google Workspace setup.

Verification:
- Gmail: `gmail_search_threads(query: "newer_than:7d")` — returns recent threads
- Calendar: `gcal_list_events(timeMin: today)` — returns today's events
- Drive: `google_drive_search(query: "any-recent-doc-name")`

---

## Tier 2 — High-Leverage Community MCPs (manual setup)

These need an API key from a third-party service. Plan ~2 minutes per tool.

### Firecrawl ⭐ (recommended for everyone)

**What it unlocks:** Web scraping, search, structured extraction. The single highest-leverage MCP for JARVIS — powers research, competitive intel, content briefs, basically anything that needs the web.

**Steps:**
1. Open https://firecrawl.dev → click "Sign up" (Google or GitHub login).
2. Once in the dashboard, go to **API Keys** → **Create new key**.
3. Copy the key (starts with `fc-`). Free tier gives 500 credits/month.
4. Install the MCP:
   ```
   claude mcp add firecrawl
   ```
5. When prompted for `FIRECRAWL_API_KEY`, paste the key.

**Verify:** `firecrawl_search(query: "anthropic claude", limit: 1)` — should return one result with title + snippet.

---

### n8n (automation workflows)

**What it unlocks:** JARVIS can trigger and manage your n8n workflows — lead pipelines, data sync, scheduled jobs, anything you've built in n8n.

**Steps:**
1. You need a running n8n instance (cloud or self-hosted) and an API key.
2. In n8n: **Settings → API** → create an API key.
3. Note your n8n URL (e.g., `https://your-instance.n8n.cloud` or `http://localhost:5678`).
4. Install the MCP:
   ```
   claude mcp add n8n
   ```
5. When prompted, supply: `N8N_URL` + `N8N_API_KEY`.

**Verify:** `n8n_list_workflows()` — returns your existing workflows.

---

### Apify (scraping at scale)

**What it unlocks:** Pre-built scrapers for Google Maps, LinkedIn, Twitter, Instagram, etc. Pair with the `scout` agent for lead-gen pipelines.

**Steps:**
1. Sign up at https://apify.com → free tier includes $5/month of credits.
2. **Settings → Integrations → API** → copy your token.
3. Install:
   ```
   claude mcp add apify
   ```
4. Paste `APIFY_TOKEN` when prompted.

**Verify:** `apify_list_actors()` — returns available scrapers.

---

## Tier 3 — Local macOS Tools (no API keys, permission-only)

These run on your Mac and don't need any external accounts.

### iMessage (proactive alerts to your phone)

**What it unlocks:** JARVIS can text you when monitoring conditions fire (lead score ≥ 8, deal closes, build fails, etc.). The default alert channel for proactive notifications.

**Steps:**
1. `claude mcp add imessage` (the MCP lives at the official MCP servers repo).
2. macOS will prompt for **Full Disk Access** for Claude Code — grant it via System Settings → Privacy & Security → Full Disk Access.
3. Restart Claude Code.

**Verify:** `send_imessage(to: "<your-number>", body: "test from JARVIS")` — your phone should buzz within 5 seconds.

---

### Apple Notes (quick local capture)

**What it unlocks:** JARVIS can drop quick notes into your Notes app — meeting takeaways, ideas, todos.

**Steps:**
1. `claude mcp add apple-notes`
2. Grant **Automation** permission for Claude Code → Notes via System Settings.

**Verify:** `add_note(title: "JARVIS test", content: "hello")` — appears in Notes app.

---

### Spotify (mac control via AppleScript)

**What it unlocks:** Pause, skip, play tracks, query current state. Useful for focus-mode skills.

**Steps:**
1. `claude mcp add spotify` (uses local AppleScript, no API key).
2. Spotify must be installed and running.

**Verify:** `spotify_get_current_track()` — returns whatever's playing or `nothing`.

---

## Tier 3.5 — Local services with bigger setup

These run entirely on the operator's machine but cost more time/disk than the rest. Worth it for power users.

### Semantic Code Search ⭐ (recommended once the operator is past basic onboarding)

**What it unlocks:** Ask "find where we handle X" in plain language and JARVIS returns the right files across the whole repo — code, memory, skills, agents, docs — even when the query doesn't match any literal keyword. The biggest "where did I write that" feature JARVIS has.

**Cost:** ~10 minutes setup, ~1.5 GB disk (Milvus image + embedding model + index), ~few hundred MB RAM idle. Zero ongoing API cost — fully local.

**One-shot install:**
```
bash setup/install-semantic-search.sh
```

The installer is idempotent and walks through:
1. Verifies Docker and Node.js are installed (offers to install Node via brew on macOS)
2. Installs Ollama if missing (brew on macOS, curl on Linux), pulls `nomic-embed-text` (274 MB)
3. Pulls and starts Milvus standalone container (~1 GB)
4. Registers `claude-context` MCP with Claude Code via `claude mcp add`
5. Runs the first full index (~8–20 min for the JARVIS repo)
6. Verifies with health checks

**Status check anytime:** `bash setup/install-semantic-search.sh --check` — reports what's installed and what's missing without changing anything.

**Verify:** Ask JARVIS something paraphrased like "find where we handle persistent monitoring daemons" — it should route to `mcp__claude-context__search_code` and return file paths with line ranges.

**Auto-reindex:** the Stop hook detects when source files change and triggers an incremental reindex (Merkle-tree diff, seconds to a minute) automatically — no manual maintenance needed once it's set up.

**Skip when:** the operator has limited disk (<5 GB free), is on a Mac without Docker Desktop and doesn't want to install it, or just wants the basic JARVIS first. They can always add it later.

---

## Tier 4 — Browser Automation (fallback when no MCP exists)

Claude in Chrome MCP — DOM-aware browser automation for any web app without a dedicated connector.

**What it unlocks:** JARVIS can navigate sites, fill forms, click buttons, scrape pages — but slower and more brittle than a direct MCP.

**Use only when** no Tier 1–3 connector exists for the target. Always check the registry first via `mcp-discovery`.

**Steps:**
1. Install the Claude in Chrome browser extension from the Claude Code docs.
2. Open Claude Code with the extension active.
3. The MCP auto-loads.

**Verify:** Take a screenshot via `mcp__Claude_in_Chrome__computer` — should return the current Chrome tab.

---

## Order to recommend in onboarding

When the operator hasn't said which tools they want, default to this order:

1. **Firecrawl** (always — web research is core)
2. Whatever they mentioned in Q3 of first-run, prioritized: built-in > community > local
3. iMessage (if on macOS — enables proactive alerts)
4. **Semantic code search** (offer at the end, framed honestly: "~10 min and ~1.5 GB if you want JARVIS to find anything in your repo by meaning. Skip if you're disk-constrained or want to stay basic")
5. Skip the rest until they explicitly ask

The goal of onboarding is to get to a working JARVIS in under 10 minutes — not to install everything at once. Semantic search is the only Tier 3.5 item to mention proactively because it's the highest-leverage one once the operator has been using JARVIS for a few sessions and starts wanting "find where I wrote about X" recall.

---

## Maintenance Notes

- **API keys live in `.env` (gitignored) or in Claude Code's MCP config** — never in this repo, never in chat.
- When Claude Code ships new built-in connectors, add a row to Tier 1.
- When you discover a new high-leverage community MCP, add it to Tier 2 with the same format.
- The `onboarder` agent reads this file every time it runs — keep it accurate.

## Related
[[../.claude/agents/onboarder]] [[../skills/mcp-discovery]] [[first-run]] [[../CLAUDE]]
