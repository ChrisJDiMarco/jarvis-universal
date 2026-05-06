# Skill: Semantic Code Search (claude-context MCP)

## Trigger

"find where X is implemented", "search the codebase for", "who references Y", "show me usages of", "where do we handle", "anywhere we do X", "semantic search", "find code about", paraphrased concept lookup across projects, cross-repo pattern hunting.

## When this beats other tools

Use thisNot thisParaphrased concept ("where do we validate user input")Exact string grepCross-file pattern hunting`rg` / Grep"Find anything related to X" across many projects`find` / GlobSurfacing conceptually similar code + docs`memory_search.py` (that's for memory markdown only)

Do NOT use this for:

- Known exact strings or symbols — `rg` / Grep is faster and zero-cost
- Memory / skills / agents recall — use `memory/memory_search.py` (BM25 over markdown index)
- Files with specific known path — just `Read`

## Goal

Semantic retrieval over the entire `~/jarvis` corpus (code + markdown) via vector embeddings, so routing and recall don't rely on literal keyword matches.

## Architecture

Optional power-up. Not installed by default. Install via `docs/semantic-code-search-setup.md`.

- **MCP server**: `@zilliz/claude-context-mcp` registered as `claude-context` in `~/.claude.json` (user scope)
- **Embeddings**: Ollama running locally at `http://127.0.0.1:11434` with model `nomic-embed-text`
- **Vector DB**: Milvus standalone in Docker container `milvus-standalone` on `127.0.0.1:19530`
- **Collection prefix**: `jarvis` (via `CODE_CHUNKS_COLLECTION_NAME_OVERRIDE`)
- **Indexed extensions**: default code extensions + `.md`, `.markdown`, `.mdx`
- **Ignored**: `logs/**`, `data/**`, `**/node_modules/**`, `**/.next/**`, `**/dist/**`, `**/build/**`, `**/.git/**`, `assets/**`, `owners-inbox/archive/**`, `**/*.db`, `**/*.sqlite`
- **Incremental**: Merkle-tree change detection — only re-embeds changed files

## Available MCP tools

Prefix: `mcp__claude-context__`

ToolUse`index_codebase`Index a directory. First index is slow (embedding everything). Re-runs are incremental. Use `force=true` only to rebuild from scratch.`search_code`Natural-language query over an already-indexed codebase. Returns top-k chunks with file paths and line ranges.`get_indexing_status`Check progress. Phase-based (not a clean file-count ratio).`clear_index`Drop the Milvus collection for a path. Use before a forced re-index of a moved/renamed directory.

## How to use

### Search (most common)

```
mcp__claude-context__search_code(
  path="/absolute/path/to/jarvis",
  query="where do we handle scheduled-task failure recovery",
  limit=10
)
```

Tips:

- `query` is natural language — describe the concept, not the exact code
- Return `limit=5` for precision, `10-20` for exploration
- Narrow with `extensionFilter=[".md"]` to hit memory/skills/docs only, or `[".py",".ts"]` for code only
- Always read the top result files with `Read` after retrieval — the chunk previews are short

### Start an index on a new project

When the operator adds a new project folder (e.g. `~/jarvis/projects/new-thing/`):

```
mcp__claude-context__index_codebase(
  path="/absolute/path/to/jarvis/projects/new-thing",
  splitter="ast",
  force=false
)
```

Each absolute path gets its own collection — no need to re-index all of `~/jarvis` for one new project.

### Re-index after a major restructure

```
mcp__claude-context__clear_index(path="...")
mcp__claude-context__index_codebase(path="...", force=true)
```

### First index (use the helper)

The first full index of `~/jarvis` runs in a background task inside the MCP server. A one-shot `claude -p` call kills the server before indexing completes. Use `scripts/claude_context_indexer.py`, which keeps the MCP alive until done:

```bash
python3 ~/jarvis/scripts/claude_context_indexer.py
# or for a custom path:
python3 ~/jarvis/scripts/claude_context_indexer.py /path/to/other/repo
```

## Operational requirements (must be running)

Before any search, verify these three services are up:

1. **Ollama**: `curl -sf http://127.0.0.1:11434/ >/dev/null && echo ok`
2. **Milvus**: `docker ps --filter name=milvus-standalone --format '{{.Status}}'` should show `(healthy)`
3. **MCP**: `claude mcp list | grep claude-context` should show `Connected`

### Startup after a reboot

Both services should auto-start:

- Ollama: `brew services` manages it on macOS (persists across reboots)
- Milvus: `docker start milvus-standalone` (Docker Desktop auto-starts enabled containers)

If either is missing, re-run:

```bash
brew services start ollama              # macOS
# or: systemctl --user start ollama     # Linux
bash ~/.milvus-standalone/standalone_embed.sh start
```

## Routing logic for JARVIS

When the operator asks a "find / where / who does X" style question:

1. **Exact symbol name known?** → `rg` / Grep. Instant, no MCP overhead.
2. **Memory / skill / agent recall?** → `memory/memory_search.py "query"` (BM25 over markdown index, fast).
3. **Paraphrased concept across code + docs?** → `mcp__claude-context__search_code`.
4. **Cross-domain ("how did we solve X last time")?** → Both `memory_search.py` AND claude-context, combine top results.

## Failure modes

- **Ollama not running**: MCP returns embedding errors. Fix: `brew services start ollama`.
- **Milvus unhealthy**: MCP returns connection errors. Fix: `bash ~/.milvus-standalone/standalone_embed.sh restart`.
- **Index stale**: operator added files and they don't show up. Fix: re-call `index_codebase` with `force=false` — incremental re-index will pick up new/changed files via Merkle diff.
- **Indexing was interrupted**: `get_indexing_status` reports "MCP server restarted". Fix: re-run `scripts/claude_context_indexer.py` (keeps the MCP alive until done).

## Reference files

- Setup guide: `docs/semantic-code-search-setup.md`
- First-index helper: `scripts/claude_context_indexer.py`
- Milvus control: `~/.milvus-standalone/standalone_embed.sh start|stop|restart`
- MCP config entry: `~/.claude.json` under `mcpServers.claude-context`

## Rules and guardrails

- **Never** send queries for production secrets / keys through the MCP — embeddings and vector data are at rest on disk.
- **Never** index `data/*.db` or `logs/**` — already excluded; if adding new excludes, update both the MCP env AND re-run clear_index + index_codebase.
- **Prefer grep over semantic search for known strings.** Semantic is \~100x more expensive per query than ripgrep.
- **Don't force re-index** unless structure changed significantly. Incremental is cheap; full rebuild is 10-20 minutes for a JARVIS-sized corpus.
