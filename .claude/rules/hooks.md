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
| Stop | `hooks/stop_hook.sh` | Appends a breadcrumb to `logs/session-log.jsonl` every turn; appends a structured entry to `logs/daily-activity.md` for substantive sessions; reindexes any `memory/*.md` files touched this session; fires `hooks/metaclaw_extract.py` in background if any tool call errored (MetaClaw autonomous capture); reindexes `skills/learned/` if new lessons were written. |

## MetaClaw Autonomous Learning

The Stop hook pre-filters for `is_error:true` tool results. If any are found, it spawns `hooks/metaclaw_extract.py` asynchronously (nohup + background). The extractor uses Haiku to distill a structured lesson and appends it to the correct `skills/learned/{category}.md` file. The learned corpus is then semantically searchable via `memory_search.py --index-path skills/learned/learned_index.json` and orchestrator uses `hooks/metaclaw_inject.py` to prepend relevant lessons to delegated agent contexts. See `skills/metaclaw-learning.md` for the full flow.

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
