# Skill: GWS CLI Integration

## Trigger
"gws cli", "google workspace cli", "install gws", "set up gws", "gws integration", "create google slides", "create google doc", "create google sheet", "create slide deck", "build a google doc", "send via gmail cli", any request that produces a real Google Workspace artifact (Slides/Docs/Sheets/Drive/Gmail/Calendar) and the existing MCP wouldn't be enough

## Origin
Google released the official `gws` CLI (github.com/googleworkspace/cli) in spring 2026 — one binary covering Drive, Gmail, Calendar, Sheets, Docs, Slides, Chat, and Admin. It's dynamically built from Google's Discovery Service so new API endpoints appear automatically, and it ships with 40+ pre-built "skills" (multi-step recipes like "create-presentation-from-sheet-data", "label-and-archive-emails", "find-free-time-and-schedule"). It also has an `mcp` mode (`gws mcp`).

JARVIS already has `gmail_*`, `gcal_*`, and `google_drive_*` MCPs which are great for **reading** Workspace data. GWS CLI fills the **writing** gap — particularly Slides and Docs creation, which the Discovery-API-based MCPs don't handle gracefully.

## Goal
Install `gws`, authenticate it once via OAuth desktop credentials, save a reference doc of the most-used commands and recipes, and route Workspace **write** requests (create slides, create docs, edit sheets, format outputs) through `gws` instead of the read-focused MCPs.

---

## When to use GWS CLI vs. existing MCPs

| Task | Use this |
|------|----------|
| Read an email | `gmail_*` MCP |
| Send a one-off email | `gmail_*` MCP (it's read+send) |
| Search Drive | `google_drive_*` MCP |
| Check calendar | `gcal_*` MCP |
| **Create a Google Slides deck with formatting** | `gws` |
| **Create a formatted Google Doc with headers, links, images** | `gws` |
| **Build/update a Google Sheet from data** | `gws` (or sometimes the xlsx skill if local-first) |
| **Triage 50 emails with priority scoring** | `gws` (its built-in skills do this in one command) |
| **Multi-step "find free time, schedule, send invite, attach doc"** | `gws` (recipe) |

> Default rule: if the task is **producing a Workspace artifact** with formatting, use `gws`. If it's pulling data, the existing MCP is fine.

---

## Setup (one-time)

### 1. Install
```bash
# macOS Apple Silicon
curl -L -o /tmp/gws.tar.gz https://github.com/googleworkspace/cli/releases/latest/download/gws-darwin-arm64.tar.gz
tar -xzf /tmp/gws.tar.gz -C /usr/local/bin/
chmod +x /usr/local/bin/gws
gws --version
```
For other archs see https://github.com/googleworkspace/cli/releases.

### 2. Create a Google Cloud project + OAuth client
1. Go to https://console.cloud.google.com — create new project (or pick an existing one). Suggested name: `jarvis-gws-cli`
2. APIs & Services → OAuth consent screen → Internal (if Workspace org) or External + add operator email as test user
3. APIs & Services → Credentials → Create credentials → OAuth client ID → **Desktop app**
4. Download the JSON
5. Move it to `~/.config/gws/client_secret.json`

### 3. Enable APIs
In the same Cloud project, enable: Drive API, Gmail API, Calendar API, Docs API, Sheets API, Slides API, Admin SDK API. (`gws` will tell you if one is missing.)

### 4. First login
```bash
gws auth login
```
Browser opens — choose the operator's Workspace account, allow scopes, return to terminal.

### 5. Verify
```bash
gws drive list --max-results 5
gws gmail list --max-results 5
gws calendar list-events --max-results 5
```
If all three return JSON, install is good.

### 6. Save commonly-used identifiers
After install, run once and save outputs to `references/gws-ids.md`:
```bash
gws drive list --query "'{operator-email}' in owners" --max-results 50
gws calendar list-calendars
gws gmail labels list
```
Then in skills that use `gws`, reference these IDs directly so JARVIS doesn't re-discover them every run (see `.claude/rules/api-over-mcp.md`).

---

## Reference command set (save to `references/gws-cli.md`)

After setup, always create `references/gws-cli.md` containing the **commands JARVIS actually uses**, not the full surface. Start with these:

```bash
# Drive
gws drive list --query "name contains 'X'"
gws drive get FILE_ID
gws drive copy SOURCE_ID --name "..."
gws drive create --type=document --name "..."

# Docs
gws docs create --title "..." --body-file body.md
gws docs append DOC_ID --body-file additions.md
gws docs replace-text DOC_ID --find "..." --replace "..."

# Sheets
gws sheets create --title "..."
gws sheets append SHEET_ID --range "Sheet1!A1" --values-file rows.json
gws sheets get-values SHEET_ID --range "Sheet1!A1:Z100"

# Slides
gws slides create --title "..." --template-id TEMPLATE_ID
gws slides add-slide DECK_ID --layout-id LAYOUT_ID
gws slides replace-text DECK_ID --find "..." --replace "..."

# Gmail
gws gmail send --to "..." --subject "..." --body-file body.md
gws gmail list --query "is:unread newer_than:1d"
gws gmail label-add MESSAGE_ID --label "follow-up"

# Calendar
gws calendar create-event --summary "..." --start "..." --end "..." --attendees "..."
gws calendar find-free-time --duration 30m --within "tomorrow 9am-5pm"
```

Then a recipes section listing the multi-step `gws` skills you've actually used:

```bash
# Built-in recipes (from `gws skills list`)
gws skills run create-presentation-from-sheet --sheet-id ... --template ...
gws skills run triage-inbox --rules-file rules.json
gws skills run find-free-time-and-schedule --duration 30m ...
```

Update this file when JARVIS hits an endpoint not yet listed.

---

## Process (when invoked for a real task)

### 1. Confirm install
Check `which gws` and `gws --version`. If not installed, run setup first (Step 1–5 above) before attempting the task.

### 2. Load reference
Read `references/gws-cli.md` — that's the menu. If the operator's request maps to a documented command, use it directly. Don't web-search for a command that's already in the reference.

### 3. Visual validation for Slides/Docs (when applicable)
Slides especially: `gws` builds them programmatically without rendering, so spacing/layout can be off. After creation:
- Open the resulting URL via Chrome MCP
- Screenshot 1–2 representative pages
- If layout is broken, edit and rerun
- Save the validation pattern to the relevant skill (so next time it's automatic)

This is the "ChromeDev tools visual validation loop" — use it any time a `gws` artifact will be operator-facing.

### 4. Reference IDs, don't rediscover
If the command needs a label ID, calendar ID, or template ID that's already in `references/gws-ids.md`, pull from there. If it's a new ID, query once, save it.

### 5. Update reference if a new command was needed
After successful runs that used a command **not** in `references/gws-cli.md`, append it. Reference doc grows with use.

---

## Network / Permissions

- `gws auth login` runs OAuth locally — uses the desktop client_secret.json; refresh tokens stored in `~/.config/gws/token.json`
- For headless / cloud-routine use: copy the token file into the cloud env, or use a service account (see `service-accounts.md`)
- For shared use across machines: do NOT push token.json to git. It's in `.gitignore` by convention

---

## Rules
- **`gws` is for writing, MCPs are for reading.** Don't burn `gws` calls when an MCP read is fine.
- **Always save reference docs.** Don't ask `gws` to web-search its own docs every run — that's the failure mode `api-over-mcp.md` exists to prevent.
- **Visual validation for Slides/Docs is mandatory** when the artifact ships to a human. Spacing is the silent killer.
- **One Cloud project, all APIs enabled.** Don't make a new project per service — JARVIS already has too many auth surfaces.
- **Service account for scheduled use.** Operator account for interactive. See `service-accounts.md`.
- **It's beta.** Per Google: "expect breaking changes as we march to v1.0." If a command stops working, check the GWS CLI release notes before assuming a JARVIS bug.

---

## Cadence
Install once. Update reference doc continuously (every time a new command is used successfully). Quarterly: re-run `gws --version` and check release notes for breaking changes.

---

## Related
[[api-over-mcp]] — the discipline pattern this skill embodies (rule, not skill)
[[service-accounts]] — for cloud-routine and headless use
[[cloud-routines]] — pairs with `gws` for scheduled Workspace tasks running on Anthropic infra
[[huashu-design]] — has its own slide pipeline (PPTX, not Google Slides); use that for offline decks, this for shared Workspace decks
