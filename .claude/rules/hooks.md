# Hooks System

## Hook Types

- **PreToolUse**: Before tool execution (validation, parameter modification)
- **PostToolUse**: After tool execution (auto-format, checks)
- **Stop**: When session ends (final verification)
- **PreCompact**: Before context compression (save recovery state)

## Active JARVIS Hooks

Wired in `.claude/settings.local.json`:

| Event | Script | Purpose |
|-------|--------|---------|
| PreCompact | `hooks/precompact_hook.sh` | Drops a flag so the next session knows compression happened and treats it as a recovery save |
| Stop | `hooks/stop_hook.sh` | Appends a breadcrumb to `logs/session-log.jsonl` every turn; appends a structured entry to `logs/daily-activity.md` if the session was substantive (>=3 tool calls or any file write). Zero Claude invocations — pure bash + jq. |

## Auto-Accept Permissions

Use with caution:
- Enable for trusted, well-defined plans
- Disable for exploratory work
- Never use dangerously-skip-permissions flag
- Configure `allowedTools` in `~/.claude.json` instead

## TodoWrite Best Practices

Use TodoWrite tool to:
- Track progress on multi-step tasks
- Verify understanding of instructions
- Enable real-time steering
- Show granular implementation steps

Todo list reveals:
- Out of order steps
- Missing items
- Extra unnecessary items
- Wrong granularity
- Misinterpreted requirements
