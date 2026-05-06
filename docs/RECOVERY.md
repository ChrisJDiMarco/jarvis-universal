# Recovery — When Something Breaks

Diagnostic and recovery steps for the most common JARVIS failure modes.

## First step always: run the health check

```bash
bash setup/check.sh
```

It tells you which category of thing is broken — dependencies, hooks, settings, memory caps, first-run state, inbox health. Solve the highest-severity issue first.

## Specific failure modes

### Hooks aren't firing

**Symptoms**: `logs/session-log.jsonl` doesn't grow after sessions; `logs/daily-activity.md` has no new entries; memory files don't get reindexed.

**Likely cause**: hooks aren't executable, or `.claude/settings.local.json` isn't pointing at them.

**Fix**:
```bash
bash setup/install.sh                   # restores executable bits
cat .claude/settings.local.json | jq .  # verify hooks block exists
bash setup/check.sh                     # confirms wiring
```

If `settings.local.json` is missing or doesn't have hooks, restore it from the template repo:
```bash
git checkout origin/main -- .claude/settings.local.json
```

### Memory file is corrupted or wiped

**Symptoms**: JARVIS doesn't remember your context; `memory/core.md` is empty or has garbled content.

**Recovery options, in order**:

1. **Reflog** — Git keeps a 30-day history of every state your repo has been in:
   ```bash
   git reflog
   # find a SHA from before the corruption
   git checkout <sha> -- memory/core.md
   ```

2. **Last commit** — restore the file to its last committed state:
   ```bash
   git checkout HEAD -- memory/core.md
   ```

3. **Backup tarball** (if you made one per [`UPDATING.md`](UPDATING.md)):
   ```bash
   tar -xzf .backups/memory-<timestamp>.tar.gz memory/core.md
   ```

4. **Re-run first-run wizard** — last resort. You'll lose accumulated memory but get back to a working state:
   ```bash
   # Reset core.md to template
   git checkout origin/main -- memory/core.md
   # Then run claude — wizard will fire
   ```

### Memory file is over cap

**Symptoms**: `bash scripts/check-memory-caps.sh` shows a file at 100%+; JARVIS starts losing recall fidelity.

**Fix**: compress the file aggressively. The orchestrator can do this:

```
> "compress memory/learnings.md — preserve the 20 most recent and most-cited entries, summarize the rest into a 'historical patterns' block at the bottom"
```

Or do it manually — open the file, keep what matters, delete old entries.

After compression, verify:
```bash
bash scripts/check-memory-caps.sh
```

### Scheduled tasks stopped firing

**Symptoms**: morning briefing didn't arrive, weekly review skipped, monitoring alerts silent.

**Fix**: list scheduled tasks via the MCP:

```
> "list scheduled tasks"
```

If a task is missing or not firing:
- Re-create it via the `scheduled-tasks` MCP
- Check the logs the task was supposed to write to (`logs/`)
- Verify the script the task calls is still executable

### `claude mcp list` shows a connector as disconnected

**Symptoms**: tool calls fail with "tool not found" or "connector unavailable".

**Common fixes**:
```bash
# Re-authenticate (for OAuth-based connectors)
# In claude:  "authenticate <service>"

# For npx-based MCPs (like claude-context):
rm -rf ~/.npm/_npx
# Then re-run the relevant install (e.g., setup/install-semantic-search.sh)

# Verify with:
claude mcp list
```

### Semantic search returns no results

**Symptoms**: `mcp__claude-context__search_code` returns empty for queries that should match.

**Diagnosis order**:
```bash
# 1. Is Milvus running?
docker ps --filter name=milvus-standalone

# 2. Is Ollama serving?
curl -sf http://127.0.0.1:11434/

# 3. Is the index populated?
tail -20 logs/claude-context-indexer.log

# 4. If not indexed:
python3 scripts/claude_context_indexer.py
```

If everything is running but queries still return nothing, force a full reindex:
```bash
FORCE_REINDEX=true python3 scripts/claude_context_indexer.py
```

### Stop hook is creating bogus entries in daily-activity.md

**Symptoms**: every session — even trivial conversations — appends to `logs/daily-activity.md`.

**Fix**: the threshold is "≥3 tool calls OR any file writes". If chat-only sessions are being logged, the transcript parser is misclassifying them. Check `hooks/stop_hook.sh` lines 67–84 for the gate logic.

Also: prune the bogus entries. Open `logs/daily-activity.md`, remove anything that wasn't actually substantive.

### `bash setup/install-semantic-search.sh` hangs

**Symptoms**: script gets stuck somewhere in Phase 1 or 3.

**Likely cause**: Docker daemon is unresponsive (Docker Desktop not running, or stuck startup).

**Fix**:
```bash
# Check Docker status
ps aux | grep -i docker

# If Docker Desktop is the issue, force restart
killall Docker  # macOS
open -a Docker  # macOS — relaunches Docker Desktop

# Or just kill the install script and re-run with --check first
bash setup/install-semantic-search.sh --check
```

The installer has built-in `timeout` wrappers on Docker calls (5–10 seconds) so it shouldn't hang indefinitely. If it does, check that the bash version is 4+ (`bash --version`) — older bash may not honor the timeout subshells.

### Test suite fails after pulling an update

**Symptoms**: `bash tests/run-all.sh` reports failures right after `git pull`.

**Fix**:
```bash
# Read the failure messages — most are documentation drift catches
bash tests/run-all.sh --verbose

# Common cause: a referenced script was renamed or removed but a doc still mentions it.
# Either restore the missing file from the previous commit or update the reference.

# If the test itself is wrong (false positive), fix the test, then re-run.
```

## Nuclear option: restore from a clean clone

If something is fundamentally broken and you want to start fresh while preserving your memory:

```bash
# 1. Back up your memory + work
cp -R ~/jarvis/memory /tmp/jarvis-memory-backup
cp -R ~/jarvis/owners-inbox /tmp/jarvis-inbox-backup
cp -R ~/jarvis/projects /tmp/jarvis-projects-backup
cp -R ~/jarvis/logs /tmp/jarvis-logs-backup

# 2. Move the broken install aside
mv ~/jarvis ~/jarvis-broken

# 3. Fresh clone
git clone https://github.com/ChrisJDiMarco/jarvis-universal.git ~/jarvis
cd ~/jarvis
bash setup/install.sh

# 4. Restore your data
cp -R /tmp/jarvis-memory-backup/* memory/
cp -R /tmp/jarvis-inbox-backup/* owners-inbox/
cp -R /tmp/jarvis-projects-backup/* projects/
cp -R /tmp/jarvis-logs-backup/* logs/

# 5. Verify
bash setup/check.sh --full-suite
```

If `setup/check.sh` reports clean, you're back. Once you're confident, delete `~/jarvis-broken`.

## Related
- [`UPDATING.md`](UPDATING.md) — safe `git pull` workflow
- [`RELEASING.md`](RELEASING.md) — release process and version semantics
- [`semantic-code-search-setup.md`](semantic-code-search-setup.md) — full Milvus setup
