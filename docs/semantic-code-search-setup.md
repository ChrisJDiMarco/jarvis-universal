# Semantic Code Search — Setup Guide

Optional power-up. Adds semantic search across your entire JARVIS corpus — code, memory, skills, agents, docs — so JARVIS can find things by meaning, not by exact keyword.

**What this unlocks:** instead of needing to remember the exact words you used six months ago, you can ask *"where did I write about scaling pricing tiers?"* or *"anything related to authentication patterns?"* and JARVIS retrieves the right files across every project.

**Cost:** zero ongoing. Everything runs local — embeddings via Ollama, vector storage via a local Milvus container. No API keys. No data leaves your machine.

**Disk / RAM:** ~2 GB disk (model + Milvus), a few hundred MB RAM idle.

**Time to install:** ~10 minutes.

---

## 1. Prerequisites

| Requirement | Install |
|-------------|---------|
| macOS or Linux | — |
| Docker (running) | macOS: [Docker Desktop](https://www.docker.com/products/docker-desktop). Linux: `sudo apt install docker.io` or distro equivalent. |
| Node.js 18+ and `npx` | `brew install node` / `apt install nodejs npm` |
| Python 3.10+ | Usually pre-installed. |
| Claude Code CLI | From https://claude.ai/code |
| `claude-context` MCP setup bandwidth | First index takes 10–20 minutes depending on repo size. |

Verify:
```bash
docker --version && node --version && python3 --version && claude --version
```

---

## 2. Install Ollama + Pull the Embedding Model

Ollama runs a small local server that serves embeddings.

### macOS
```bash
brew install ollama
brew services start ollama
```

### Linux
```bash
curl -fsSL https://ollama.com/install.sh | sh
systemctl --user enable --now ollama
```

### Pull the embedding model (both platforms)
```bash
ollama pull nomic-embed-text
```

Verify:
```bash
curl -sf http://127.0.0.1:11434/ && echo " ollama OK"
ollama list | grep nomic
```

`nomic-embed-text` is 274 MB, fast, and purpose-built for retrieval.

---

## 3. Start a Local Milvus Standalone Container

Milvus is the vector database. We run it locally so no data leaves your machine.

```bash
mkdir -p ~/.milvus-standalone && cd ~/.milvus-standalone
curl -sfL https://raw.githubusercontent.com/milvus-io/milvus/master/scripts/standalone_embed.sh -o standalone_embed.sh
chmod +x standalone_embed.sh
```

The official script uses `sudo docker ...` by default. If your Docker doesn't need sudo (Docker Desktop on macOS, rootless Docker on Linux), patch those out:

```bash
sed -i.bak 's/sudo docker/docker/g; s/sudo rm/rm/g' standalone_embed.sh
```

Start it:
```bash
bash standalone_embed.sh start
```

First run pulls the Milvus image (~1 GB) and starts the container. Verify:
```bash
docker ps --filter name=milvus-standalone --format '{{.Status}}'
# expect: Up N seconds (healthy)

curl -sf http://127.0.0.1:9091/healthz && echo " milvus OK"
```

Data persists at `~/.milvus-standalone/volumes/milvus`. Control with:
```bash
bash ~/.milvus-standalone/standalone_embed.sh start|stop|restart|delete
```

The container auto-starts with Docker Desktop / the Docker daemon on reboot.

---

## 4. Register the MCP with Claude Code

One command:

```bash
claude mcp add claude-context --scope user \
  -e EMBEDDING_PROVIDER=Ollama \
  -e EMBEDDING_MODEL=nomic-embed-text \
  -e OLLAMA_HOST=http://127.0.0.1:11434 \
  -e MILVUS_ADDRESS=127.0.0.1:19530 \
  -e MILVUS_TOKEN=local \
  -e EMBEDDING_BATCH_SIZE=64 \
  -e "CUSTOM_EXTENSIONS=.md,.markdown,.mdx" \
  -e "CUSTOM_IGNORE_PATTERNS=logs/**,data/**,**/*.db,**/*.sqlite,**/.next/**,**/dist/**,**/build/**,**/node_modules/**,**/.venv/**,**/venv/**,**/.git/**,**/.DS_Store,owners-inbox/archive/**,assets/**,projects/*/node_modules/**,projects/*/.next/**" \
  -e CODE_CHUNKS_COLLECTION_NAME_OVERRIDE=jarvis \
  -- npx -y @zilliz/claude-context-mcp@latest
```

Verify:
```bash
claude mcp list
# should show: claude-context: npx -y @zilliz/claude-context-mcp@latest - ✓ Connected
```

The `CUSTOM_EXTENSIONS` env adds Markdown to the indexer's default language list (the tool is primarily code-focused). The `CUSTOM_IGNORE_PATTERNS` keeps your logs, databases, node_modules, and archive noise out of the index.

---

## 5. Run the First Full Index

**Important:** the MCP server's `index_codebase` tool kicks off indexing as a background task inside its own process. If the server exits before indexing finishes (which happens when `claude -p` ends), indexing halts. Use the included helper, which keeps the server alive until done:

```bash
python3 ~/jarvis/scripts/claude_context_indexer.py
```

Or point it at a different root:
```bash
python3 ~/jarvis/scripts/claude_context_indexer.py /path/to/other/repo
```

The script:
- Launches the MCP server as a subprocess
- Calls `index_codebase` with `force=true`
- Polls `get_indexing_status` every 30 seconds
- Exits when indexing completes or fails
- Logs progress to `<target>/logs/claude-context-indexer.log`

Expected time: **~8–20 minutes** for a full JARVIS repo on an M-series Mac. Linear with file count. Watch progress:
```bash
tail -f ~/jarvis/logs/claude-context-indexer.log
```

On completion you'll see something like:
```
status: ✅ Codebase '/Users/you/jarvis' is fully indexed and ready for search.
📊 Statistics: 2479 files, 25075 chunks
📅 Status: completed
COMPLETE detected
```

---

## 6. Verify It Works

Ask JARVIS a paraphrased question that would miss on a literal grep:

```
"Find where we handle persistent monitoring daemons"
```

or

```
"What skills exist for deep research?"
```

JARVIS should route to `mcp__claude-context__search_code` and return 5–10 files with file paths and line ranges — including files that don't contain the exact words in your query but are conceptually similar.

Manual test from a shell:
```bash
claude -p 'Use mcp__claude-context__search_code with path=/Users/you/jarvis, query="where do we validate user input", limit=5. Return the raw tool response.' \
  --allowed-tools "mcp__claude-context__search_code" \
  --permission-mode acceptEdits </dev/null
```

---

## 7. Keeping the Index Fresh

The MCP uses a Merkle-tree diff to re-embed only changed files, so incremental re-indexing is cheap (seconds to a minute). Trigger whenever you've done a lot of work:

```bash
FORCE_REINDEX=false python3 ~/jarvis/scripts/claude_context_indexer.py
```

Or ask JARVIS: `"re-index jarvis"` — it will call `index_codebase` with `force=false`.

Optional: schedule a nightly incremental re-index via the `scheduled-tasks` MCP or a cron.

---

## 8. Routing Guidance for JARVIS

The `skills/semantic-code-search.md` file tells JARVIS when to use this tool vs. grep vs. `memory_search.py`:

| Query shape | Right tool |
|-------------|-----------|
| Known exact string (function name, error text) | `rg` / Grep — instant, zero cost |
| Memory / skill / agent recall | `memory/memory_search.py` — BM25 over markdown, fast |
| Paraphrased concept across code + docs | `mcp__claude-context__search_code` |
| Cross-domain ("how did we solve X last time") | Both `memory_search.py` + claude-context, combine top results |

JARVIS will pick automatically — you don't need to specify.

---

## 9. Troubleshooting

**`claude mcp list` shows claude-context as disconnected.**
Check that `npx -y @zilliz/claude-context-mcp@latest` can run. Common fix: upgrade Node, clear the npx cache with `rm -rf ~/.npm/_npx`.

**Indexing stalls or fails at "MCP server restarted".**
Don't call `index_codebase` from a one-shot `claude -p` — the server dies when the call ends. Use `scripts/claude_context_indexer.py` instead.

**Search returns zero results after indexing completed.**
Check `MILVUS_ADDRESS` is reachable: `nc -zv 127.0.0.1 19530`. Confirm the collection exists: `curl -s http://127.0.0.1:9091/api/v1/health`. If the collection name looks wrong, clear and re-index: call `clear_index` then `index_codebase` with `force=true`.

**Ollama won't start after reboot.**
macOS: `brew services restart ollama`. Linux: `systemctl --user restart ollama`.

**Milvus container crashed / is unhealthy.**
```bash
bash ~/.milvus-standalone/standalone_embed.sh restart
docker logs milvus-standalone --tail 50
```

**Disk pressure — want to reclaim space.**
```bash
bash ~/.milvus-standalone/standalone_embed.sh delete   # drops container + volumes
ollama rm nomic-embed-text                              # frees ~274 MB
claude mcp remove claude-context --scope user          # unregister MCP
```

---

## 10. How It Differs From `memory_search.py`

JARVIS ships with two retrieval systems and keeps them separate on purpose:

| | `memory_search.py` | `claude-context` MCP |
|---|---|---|
| **Algorithm** | BM25 (keyword) | Dense vector + BM25 hybrid |
| **Scope** | Memory markdown files only | Entire repo: code + markdown |
| **Setup** | Built-in, zero config | Requires Ollama + Milvus + MCP |
| **Query shape** | Keyword / phrase | Natural language / paraphrase |
| **Best for** | "Does a memory exist about X" | "Find where we handle X" across everything |

You don't need to choose — JARVIS uses both, routing by query shape. This doc is about adding the second one.

---

## 11. Credits

- [zilliztech/claude-context](https://github.com/zilliztech/claude-context) — the MCP server this relies on.
- [ollama.com](https://ollama.com) — local embedding runtime.
- [milvus.io](https://milvus.io) — vector database.

If you find a cleaner setup flow, submit a PR to the JARVIS Universal repo.
