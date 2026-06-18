# Skill: Cloud Routines

## Trigger
"cloud routine", "cloud routines", "anthropic-hosted task", "run task while my laptop is off", "remote scheduled task", "github-triggered cron", "set up a routine", "migrate scheduled task to cloud"

## Origin
Anthropic shipped Claude Code Routines (research preview, April 2026): scheduled prompts that run on Anthropic's web infrastructure against a configured GitHub repo, while the operator's machine is off. Three trigger types: schedule, API call, GitHub event (push/PR/release). Each run is stateless — clones the repo, runs once, destroys the clone (except for branches the run pushes).

JARVIS already has `persistent-daemon` (scheduled-tasks MCP, runs locally while machine is awake) and `heartbeat` (proactive scans). Cloud routines are the **machine-off** complement — for tasks that genuinely need to run when nobody's watching the laptop.

## Goal
Set up a cloud routine correctly the first time. Choose the right repo, the right environment variables, the right network-trust tier, and a prompt that one-shots the task without needing operator input mid-run.

---

## When to use Cloud Routines vs. existing scheduling

| Need | Use this |
|------|----------|
| Daily morning briefing | Local scheduled-task (machine usually awake) |
| 10-minute polling during a build | `/loop` skill (in-session, 3-day expiry) |
| Heartbeat scans every 2 hours | `heartbeat` skill (local) |
| **Overnight job that touches ClickUp/Slack/Gmail while laptop is closed** | Cloud routine |
| **Hourly cadence task that must survive laptop sleep** | Cloud routine |
| **GitHub PR triage triggered by webhooks** | Cloud routine |
| Job that needs local files | NOT cloud routine — use local |
| Job that uses Playwright with cookied sessions | NOT cloud routine — stateless, no cookie persistence |

> Default rule: cloud routines are stateless. If it can't read your local filesystem and can't keep cookies between runs, it can't run as a cloud routine.

---

## Setup (per-routine)

### 1. Pick or create the GitHub repo
- For most JARVIS routines: a **dedicated thin repo** is better than the full JARVIS repo. The full repo's `CLAUDE.md` and skill index drains tokens on every run.
- Naming convention: `jarvis-routine-{name}` (private repo)
- Contents: minimal `CLAUDE.md` (just what this routine needs), the relevant skill file(s), maybe a `references/` doc

### 2. Configure the cloud environment
In Claude Desktop → Routines → New Task → Cloud Environment:
- **Network access**:
  - `trusted` — only Anthropic-vetted domains (Google services, GitHub, etc.). Default. Use when possible.
  - `full` — any outbound. Required for ClickUp, custom APIs, Slack webhooks
  - `custom` — allowlist specific domains
  - `none` — no network. Useful for pure compute jobs
- **Environment variables**: paste API keys here, NOT in the repo's `.env`. The repo's `.env` is gitignored and won't be present in the cloud clone.
- **Setup script** (optional): runs before Claude Code launches. Use for `pip install`, `npm install`, etc.

### 3. Write the prompt
Cloud routines are **one-shot**. The prompt must succeed without operator input. Patterns that work:
- Reference a skill explicitly: `Run the team-checkin skill. Use the ClickUp API key from environment.`
- Reference IDs explicitly: `Send a message to ClickUp channel ID 12345 with...` (don't make Claude rediscover)
- State the env-var name: `My YouTube API key is in env var YOUTUBE_API_KEY — use it directly, don't look for .env`

Patterns that fail:
- "Help me with..." (no decision criteria)
- "Check on the project and let me know if anything's wrong" (what's wrong? message me where?)
- Anything that requires Playwright with auth cookies (no cookie state)

### 4. Configure trigger
- **Schedule**: minimum interval is 1 hour. Set timezone explicitly.
- **API**: gets a webhook URL — useful for chaining from other automations
- **GitHub event**: push, PR, issue, release — useful for review/CI workflows

### 5. Permissions
Mostly fully autonomous in cloud routines. Bypass-permissions equivalent. Be cautious about anything destructive — the operator isn't there to catch it.

### 6. Test before scheduling
Hit "Run Now" 2–3 times. Watch the live output. Confirm:
- Env vars resolve
- API calls succeed
- Output is what you expected
- It exits cleanly (didn't get stuck waiting for input)

Only then enable the schedule.

---

## Quotas (as of May 2026 — verify in Claude Desktop usage panel)

| Plan | Routine runs/day |
|------|-------------------|
| Pro | 5 |
| Max ($200/mo) | 15 |
| Team | 25 |
| Enterprise | 25+ |

Resource limits per run: 4 vCPU, 16 GB RAM, 30 GB disk, 1-hour minimum interval.

---

## Pattern: Routine that uses GWS CLI

```yaml
# Routine: Daily inbox triage
schedule: "0 7 * * *"  # 7am daily
network: trusted
env:
  GOOGLE_APPLICATION_CREDENTIALS: /tmp/sa.json   # pasted as env var content
prompt: |
  1. Run the gws-cli inbox-triage skill (in this repo's skills/ folder)
  2. Score unread emails from last 24h using my business context (memory/L1-critical-facts.md)
  3. Mark anything scoring <5 as read
  4. For each scoring 8+, post a one-line summary to ClickUp channel ID 12345 (key in CLICKUP_API_KEY)
  5. Log result to a new branch report-YYYY-MM-DD.md and push
```

---

## What persists across runs

| Thing | Persists? |
|-------|-----------|
| The git branches the run pushes | YES |
| The session view in Claude Desktop (logs, errors, output) | YES |
| The cloned repo working directory | NO — destroyed |
| Cookies, auth state, local files written outside git | NO |
| Memory the routine wrote to its own runtime | NO |

Workaround for "stateful-feeling" cloud routines: have the run push a small state file (`logs/{routine}-state.md`) to a branch, and the next run reads it from the cloned repo at start.

---

## Rules
- **One repo per routine when possible.** Full JARVIS repo per routine = expensive token drain on every run.
- **API keys in env vars, never in `.env` pushed to git.** Even private repos leak.
- **Test 2–3 times before scheduling.** Cloud routines are unsupervised; bugs run forever.
- **Don't use cloud routines for browser automation that needs cookies.** Stateless. Use local `persistent-daemon` instead.
- **Watch your daily quota.** A routine running every hour = 24 runs/day, way over Max plan limits.
- **Setup scripts are silent if they fail.** Add `set -e` and explicit logging.
- **Network: trusted unless you have to.** Reduce blast radius if a malicious doc gets read mid-run.

---

## Cadence
Set up per-routine, manually. Audit quarterly: list active cloud routines, kill any that haven't produced useful output in 30 days, migrate any that drifted from one-shot back to local scheduling if they need state.

---

## Related
[[persistent-daemon]] — local scheduled-tasks for machine-on jobs
[[heartbeat]] — proactive periodic scans (local)
[[gws-cli]] — common payload for cloud routines that touch Workspace
[[service-accounts]] — auth pattern for cloud routines
[[ship-it]] — different scope (deploy pipeline, not scheduled job)
