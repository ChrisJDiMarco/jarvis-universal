# Service Accounts for AI

## The discipline

Don't give JARVIS your personal credentials when a dedicated service account will do. Each connection JARVIS uses should run under an account scoped to JARVIS, not under the operator's own login.

## Why

Three concrete wins:

1. **Blast radius.** If a prompt injection or malicious doc tricks JARVIS into a destructive action, the damage is bounded by what the service account can touch. Your personal admin account can delete the org; a scoped JARVIS account can delete one folder.
2. **Permission scoping.** Service accounts can be read-only, or workspace-scoped, or rate-limited in ways your personal account can't. The right principle of least privilege for an automated agent is different from the right one for a human.
3. **Cost attribution.** Each agent / each routine / each integration can have its own API key. When it's time to ask "which workflow is burning tokens" or "which integration is hitting its quota first," per-key telemetry tells you in seconds.

## The pattern

### 1. Create a dedicated account in each tool
- ClickUp → invite `jarvis@yourdomain` (or use ClickUp's "bot" account feature)
- GitHub → create `jarvis-bot-{org}` machine user (or use a GitHub App)
- Slack → create a Slack app + bot user, not a user token tied to the operator
- Google Workspace → service account JSON for headless, dedicated user for interactive
- Linear/Asana/Notion → invite a dedicated user, lowest sufficient role

### 2. Scope the permissions deliberately
For each service-account creation, ask:
- Does this account need write access, or only read?
- Does it need admin, or just member?
- Should it be limited to specific spaces / workspaces / projects?
- What's the smallest scope that still lets the skill work?

When in doubt, start read-only. Promote to write when a real skill needs it.

### 3. One API key per use case
Don't share one ClickUp key across heartbeat, evening-debrief, and a cloud routine. Each gets its own:
- Easier to revoke if compromised
- Easier to track usage
- Easier to rate-limit one without affecting the others

Naming convention: `{tool}_{usecase}_KEY` — e.g., `CLICKUP_HEARTBEAT_KEY`, `CLICKUP_CLOUDROUTINE_KEY`.

### 4. Document where each account lives
Keep a `references/service-accounts.md` (gitignored or operator-only) that lists:
- Account name + login
- Where the API key is stored (env var name, not the key itself)
- What scopes it has
- What skills/routines depend on it

When something breaks, this is the diagnostic surface.

## Specific patterns

### Cloud routines
Cloud routines run unattended on Anthropic infra. **Always** use service accounts, never the operator's personal credentials. If a routine gets jailbroken mid-run, you don't want it logged in as you.

### GWS CLI
Two patterns:
- **Interactive use** (operator-driven, on operator's machine): operator's own Workspace login. OAuth flow handles auth.
- **Headless / cloud routine**: a Google Cloud service account with domain-wide delegation. JSON key stored as env var.

### Slack
Always a Slack App with a bot user, never a user-token-on-operator. Slack apps support per-workspace OAuth scopes; user tokens don't.

### GitHub
For automation: GitHub App (best — fine-grained perms, app-level rate limit) or machine user (OK). Never a personal access token tied to operator.

## Anti-patterns

- "I'll just use my admin key, it's faster" — true until the day it isn't
- One shared `JARVIS_API_KEY` across every tool — defeats per-key attribution
- Leaving a service account at admin role because "we'll narrow it later" — later never comes
- Storing the key in `.env` and pushing the repo to GitHub — yes, even private repos leak

## Apply when

- Setting up any new third-party connection
- Migrating an existing skill from interactive (operator credentials) to scheduled/headless
- Onboarding a cloud routine that touches a tool with destructive endpoints

## Don't apply when

- The tool genuinely doesn't support multiple accounts (rare, but exists)
- The skill is operator-explicit and ephemeral (one-shot, supervised) — operator's own auth is fine

## Related
[[security]] — broader secret management
[[cloud-routines]] — primary consumer of this discipline
[[api-over-mcp]] — pairs with this for clean per-tool integration
