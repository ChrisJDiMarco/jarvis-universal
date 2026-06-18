# API Over MCP

## The discipline

When integrating a new third-party tool, prefer **direct API calls + a saved markdown reference** over loading an MCP server, when the API is well-documented and stable.

## Why

MCP servers are great for discovery. They surface every endpoint, every tool, every parameter — useful when JARVIS doesn't yet know what's possible. The cost: every loaded MCP eats tokens on every session start, even if you only use 3 of its 47 tools.

Once JARVIS has used a tool a few times and knows which 3–5 endpoints actually matter, the MCP becomes overhead. A markdown reference doc + raw API calls is dramatically cheaper and just as reliable.

## The pattern

### 1. First contact: use the MCP
When a new tool first comes into a workflow, use the MCP if it exists. Discover the API surface, find the endpoints that work, learn the auth model.

### 2. Capture what worked
After the first 2–3 successful uses, save a `references/{tool}-api.md` containing:
- Auth pattern (where the key lives, header format)
- The 3–10 endpoints actually used, with example request + response
- Common IDs (team ID, list ID, channel ID, label ID) hardcoded
- Known gotchas (rate limits, pagination, weird response shapes)

### 3. Switch to direct API calls
In skills that use the tool, call the API directly (`curl`, `requests`, `fetch`) referencing the markdown doc. Drop the MCP from the project's MCP config if no other skill needs it.

### 4. Hardcode common IDs in skills
If a skill always queries ClickUp list ID `12345`, put `12345` in the skill.md. Don't make Claude re-query "what's the list ID for our internal projects" on every run. Discovery cost should be paid once.

## When to KEEP the MCP

- The tool is exploratory (not yet used 3+ times)
- The API has many auth-state-dependent endpoints (OAuth flows, sessions)
- The MCP server provides functionality not exposed via REST (websockets, streaming)
- You're using the dedicated MCP package providers built (`mcp__claude-context__*`, `mcp__cowork__*`) — these are tuned for purpose, not generic API wrappers
- The progressive-disclosure pattern in `mcp-code-exec.md` already handles the schema-bloat problem for that specific MCP

## Anti-pattern

```
# BAD — every run, JARVIS re-discovers what it already knows
1. Load ClickUp MCP (~3000 tokens of tool schemas)
2. Call clickup_list_workspaces → find team ID
3. Call clickup_list_lists → find target list
4. Call clickup_create_task

# GOOD — discovery paid once, captured in reference
1. Read references/clickup-api.md (hardcoded team ID + list ID)
2. curl POST https://api.clickup.com/api/v2/list/{LIST_ID}/task -H "Authorization: $CLICKUP_API_KEY" ...
```

## Apply when

- A skill calls the same tool more than 3 times across the JARVIS lifetime
- An MCP's tool schemas exceed 2,000 tokens
- A scheduled task or cloud routine uses the tool (token cost compounds across runs)

## Don't apply when

- The integration is one-off
- The API is poorly documented or rapidly changing
- The MCP gives capabilities the raw API doesn't

## Related
[[mcp-code-exec]] — alternative pattern: progressive tool disclosure within an MCP wrapper
[[mcp-discovery]] — how to find the right MCP in the first place
[[gws-cli]] — concrete application of this rule
