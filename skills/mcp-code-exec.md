# Skill: MCP Code Execution Pattern (Progressive Tool Disclosure)

## Trigger
"This MCP has too many tools", "context is bloating from tool definitions", "convert this MCP to code-exec", "wrap this connector progressively", or — more commonly — when building a new JARVIS agent that needs access to a verbose MCP (Composio, full Slack surface, full GitHub surface, anything with 20+ tools). Auto-apply when an agent's loaded tool schemas would exceed ~10k tokens.

## Goal
Replace eager tool loading (every schema in context from turn 1) with **progressive disclosure**: load only the tool schemas you need, when you need them. VRSEN reports ~98% token reduction on verbose MCPs using this pattern. The principle is identical to how Cowork's `ToolSearch` works — and it's exactly what an agent should do when its toolkit is large.

---

## The Problem

A connector with 60 tools × ~400 tokens of schema = 24k tokens consumed before the model has read the user's first message. Every turn pays this cost. For a long session this is the single largest source of context bloat.

Most agents only ever call 2–5 tools per task. Loading all 60 schemas to find those 5 is pure waste.

---

## The Pattern (3 Tools Replace N)

Expose **3 lightweight wrapper tools** to the agent in place of the connector's full surface:

| Tool | Returns | Cost |
|------|---------|------|
| `discover_tools(query)` | List of `{name, one-line description}` matching the query | Tiny — names + summaries only |
| `load_tool(name)` | Full JSONSchema for a single named tool | One schema, on demand |
| `execute_tool(name, args)` | Tool execution result | Same as direct call |

The agent's flow becomes:

```
1. Read user task
2. Call discover_tools("send email gmail")        → returns 3 candidates
3. Call load_tool("GMAIL_SEND_EMAIL")            → returns full schema
4. Call execute_tool("GMAIL_SEND_EMAIL", {...})  → executes
```

Total schema pulled into context: 1 tool's worth (~400 tokens) instead of 60 (~24k). Tools the agent never touches never enter the window.

---

## When to Apply

Apply this pattern when:

- The MCP exposes **20+ tools** (rough threshold)
- The connector wraps an aggregator (Composio, Zapier-style, multi-toolkit servers)
- The agent is **long-running** — context cost compounds
- You're building an agent whose toolkit may grow over time and you don't want to keep tuning eager-load lists

Skip this pattern when:

- The MCP has < 10 tools — the wrapper overhead isn't worth it
- The agent is short-lived (one-shot) and always uses the same handful of tools — eager-load is fine
- Tools are stateful and need consistent context (rare)

---

## Implementation Sketch

```python
# wrapper for a verbose MCP server
def discover_tools(query: str) -> list[dict]:
    """Return candidate tools matching the query. Names + one-line descriptions only."""
    all_tools = mcp_client.list_tools()
    scored = bm25_score(query, [t.description for t in all_tools])
    return [{"name": t.name, "summary": t.description.split("\n")[0]}
            for t in scored[:8]]

def load_tool(name: str) -> dict:
    """Return full JSONSchema for a single named tool."""
    return mcp_client.get_tool_schema(name)

def execute_tool(name: str, args: dict) -> dict:
    """Execute the tool. Caller must have called load_tool first."""
    return mcp_client.execute(name, args)
```

The wrapper itself is a tiny MCP server (or a few functions inside a JARVIS agent). The verbose underlying MCP stays unchanged.

---

## Cache Schemas Per Session

Inside a single conversation, schemas the agent has loaded should be cached. Don't re-fetch the GMAIL_SEND_EMAIL schema 4 times in one session. A simple in-memory dict keyed by tool name is enough.

This cache should NOT persist across sessions — tool surfaces change, and a stale cache gives stale arg names.

---

## Anti-Patterns

- **Eager-loading 60 tools "in case the agent needs them".** This is the cost the pattern exists to eliminate. Trust the discovery step.
- **Skipping `discover_tools` and going straight to `load_tool` with a guessed name.** Same hallucination risk as guessing function signatures. Discovery is cheap.
- **Returning full schemas from `discover_tools`.** Then you've recreated the original problem. Discovery returns names + summaries only.
- **Persisting the schema cache to disk.** Tool surfaces drift. Stale schemas cause silent arg mismatches.

---

## Related
[[mcp-discovery]]  [[agent-infrastructure-audit]]  [[context-budget]] (in skills/ecc/)
