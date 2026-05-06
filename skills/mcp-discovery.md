# Skill: MCP Discovery

## Trigger
"I need a tool for [X]", "do we have an MCP for [Y]", "find me a way to integrate with [Z]", or any task implying an external app/service where no direct MCP tool is currently loaded. Also auto-trigger before falling back to Chrome MCP — never go to a slower tier without checking the registry first.

## Goal
When JARVIS needs an external capability that isn't already wired up as a direct MCP, run a structured discovery sequence so the right integration is found, surfaced to the operator, and either installed or invoked — without prematurely defaulting to browser automation or hand-rolled scripts.

This formalizes the Composio-style discovery pattern (`list connections → search → introspect → execute`) for JARVIS's own MCP ecosystem.

---

## Discovery Sequence (Run Top to Bottom — Stop on First Hit)

### Step 1 — Verify what's already loaded
Before reaching for anything new, confirm the capability isn't already available.

- Check the **Live Integrations** table in `CLAUDE.md` for the right MCP prefix (gmail_, gcal_, slack_, notion-, firecrawl_, etc.)
- If you suspect the tool exists but its schema isn't loaded, fire a `ToolSearch` keyword query first — many MCPs are deferred and need explicit loading

**If found here → use it. Stop.**

### Step 2 — Search the JARVIS plugin registry
Use the registry tools that already exist in this stack:

| Tool | When |
|------|------|
| `mcp__mcp-registry__search_mcp_registry` | Search by intent: e.g. `["asana", "jira", "linear", "project management"]` |
| `mcp__mcp-registry__list_connectors` | Browse the full catalog when the intent is fuzzy |
| `mcp__plugins__search_plugins` | If the user's request implies a *domain* (engineering, sales, marketing) rather than a single app |

Pass 3–5 candidate keywords per query — synonyms catch what exact-match misses.

### Step 3 — Introspect candidate tools
Once a candidate connector is found:

1. Read its description to confirm the action you need is supported
2. If the connector exposes a discovery layer (Composio-style aggregators do), call its tool-list/search endpoint with the user's intent
3. Pull the parameter schema (with `include_args=True` semantics if available) so you build the call correctly the first time

Never call `Execute` blind. The cost of one bad call (auth prompt, error trail, wrong-resource creation) outweighs the schema read every time.

### Step 4 — Suggest installation if needed
If the connector exists in the registry but isn't installed:

- Call `mcp__mcp-registry__suggest_connectors` for raw MCPs
- Call `mcp__plugins__suggest_plugin_install` for full plugins (skills + agents + MCPs bundled)

Surface the suggestion to the operator. **Do not silently install** — The operator approves connector installs explicitly.

### Step 5 — Execute
Once the schema is loaded and the operator has authorized any required auth:

1. Make the call with the smallest scope that proves the integration works
2. Save intermediate results to variables — never make the same fetch twice in one task
3. Format outputs by extracting only the fields needed for the current task (avoid context bloat)

### Step 6 — Fall back ONLY if no MCP exists
If every prior step came back empty, then:

- For web apps: use `mcp__Claude_in_Chrome__*`
- For native Mac apps: use `mcp__computer-use__*` or `mcp__Control_your_Mac__osascript`
- Last resort: scripted scrape via `firecrawl_*` (only if no direct alternative exists)

---

## When to Document the Find

If the discovery cycle surfaces a connector the operator will likely reach for again, add a `reference_*.md` memory entry pointing at the MCP prefix and what it's good for. This skips Steps 2–4 next time.

Format (matches existing reference memories):
```
---
name: [tool] reference
description: [tool] reachable via [mcp_prefix]; key actions are X, Y, Z
type: reference
---

[Tool] = `mcp__[prefix]__*` — covers [capabilities].
Common calls: [tool1], [tool2], [tool3].
Auth status: [connected | needs install | needs operator approval].
Use for: [domains].
Skip for: [domains where another tool is faster].
```

---

## Anti-Patterns

- **Reaching for Chrome before checking the registry.** Browser automation is the slowest, most brittle tier. Always exhaust direct MCPs first.
- **Calling `Execute` without `Introspect`.** You'll guess parameters wrong, hit auth prompts, and create wrong-resource side effects.
- **Loading every tool in a connector eagerly.** If the connector has 20+ tools, use the [`mcp-code-exec`](mcp-code-exec.md) progressive-disclosure pattern instead of pulling all schemas into context.
- **Silently installing a plugin.** The operator approves installs. Always surface a suggestion first.

---

## Related
[[mcp-code-exec]]  [[browser-automation]]  [[agent-infrastructure-audit]]
