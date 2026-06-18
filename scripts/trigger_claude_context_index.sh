#!/usr/bin/env bash
# Triggers claude-context MCP to index ~/jarvis via stdio JSON-RPC.
# The MCP server's index_codebase tool kicks off background indexing and returns immediately.
# Safe to re-run: server uses Merkle-tree incremental indexing to re-embed only changed files.

set -euo pipefail

JARVIS_ROOT="${JARVIS_ROOT:-$HOME/jarvis}"

export EMBEDDING_PROVIDER=Ollama
export EMBEDDING_MODEL=nomic-embed-text
export OLLAMA_HOST=http://127.0.0.1:11434
export MILVUS_ADDRESS=127.0.0.1:19530
export MILVUS_TOKEN=local
export EMBEDDING_BATCH_SIZE=64
export CUSTOM_EXTENSIONS=".md,.markdown,.mdx"
export CUSTOM_IGNORE_PATTERNS="logs/**,data/**,**/*.db,**/*.sqlite,**/.next/**,**/dist/**,**/build/**,**/node_modules/**,**/.venv/**,**/venv/**,**/.git/**,**/.DS_Store,owners-inbox/archive/**,assets/**,projects/*/node_modules/**,projects/*/.next/**"
export CODE_CHUNKS_COLLECTION_NAME_OVERRIDE=jarvis

# JSON-RPC sequence: initialize -> notifications/initialized -> tools/call index_codebase
{
  printf '%s\n' '{"jsonrpc":"2.0","id":1,"method":"initialize","params":{"protocolVersion":"2024-11-05","capabilities":{},"clientInfo":{"name":"jarvis-trigger","version":"1.0"}}}'
  sleep 1
  printf '%s\n' '{"jsonrpc":"2.0","method":"notifications/initialized"}'
  sleep 1
  printf '%s\n' "{\"jsonrpc\":\"2.0\",\"id\":2,\"method\":\"tools/call\",\"params\":{\"name\":\"index_codebase\",\"arguments\":{\"path\":\"$JARVIS_ROOT\",\"splitter\":\"ast\",\"force\":false}}}"
  sleep 3
} | npx -y @zilliz/claude-context-mcp@latest 2>&1 | tail -80
