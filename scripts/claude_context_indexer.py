#!/usr/bin/env python3
"""
Long-lived driver for the claude-context MCP server.

Problem: index_codebase runs as a background task inside the MCP server process.
When the server exits (stdin EOF, parent death, etc.), the indexing halts.
A one-shot `claude -p` call spawns its own MCP server that tears down as soon
as the call ends — so indexing never finishes.

This script launches the MCP server as a child process and keeps the stdio
connection open for as long as indexing takes, polling get_indexing_status
every 30 seconds until the server reports completion or failure.


Usage:
    python3 scripts/claude_context_indexer.py                 # indexes ~/jarvis
    python3 scripts/claude_context_indexer.py /path/to/repo   # indexes any dir
    JARVIS_ROOT=~/my-jarvis python3 scripts/claude_context_indexer.py

Requirements:
    - Ollama running on http://127.0.0.1:11434 with `nomic-embed-text` pulled
    - Milvus running on 127.0.0.1:19530 (see docs/semantic-code-search-setup.md)
    - Node.js / npx available (the MCP is an npm package)

Writes progress to <target>/logs/claude-context-indexer.log
"""

import json
import os
import subprocess
import sys
import time
from pathlib import Path

DEFAULT_ROOT = Path(os.environ.get("JARVIS_ROOT", Path.home() / "jarvis")).expanduser()
PATH = Path(sys.argv[1]).expanduser() if len(sys.argv) > 1 else DEFAULT_ROOT
POLL_INTERVAL_SEC = 30
MAX_MINUTES = 45
LOG_PATH = PATH / "logs" / "claude-context-indexer.log"

ENV = {
    **os.environ,
    "EMBEDDING_PROVIDER": "Ollama",
    "EMBEDDING_MODEL": "nomic-embed-text",
    "OLLAMA_HOST": os.environ.get("OLLAMA_HOST", "http://127.0.0.1:11434"),
    "MILVUS_ADDRESS": os.environ.get("MILVUS_ADDRESS", "127.0.0.1:19530"),
    "MILVUS_TOKEN": os.environ.get("MILVUS_TOKEN", "local"),
    "EMBEDDING_BATCH_SIZE": os.environ.get("EMBEDDING_BATCH_SIZE", "64"),
    "CUSTOM_EXTENSIONS": ".md,.markdown,.mdx",
    "CUSTOM_IGNORE_PATTERNS": (
        "logs/**,data/**,**/*.db,**/*.sqlite,**/.next/**,**/dist/**,"
        "**/build/**,**/node_modules/**,**/.venv/**,**/venv/**,**/.git/**,"
        "**/.DS_Store,owners-inbox/archive/**,assets/**,"
        "projects/*/node_modules/**,projects/*/.next/**"
    ),
    "CODE_CHUNKS_COLLECTION_NAME_OVERRIDE": "jarvis",
}



def log(msg: str) -> None:
    ts = time.strftime("%H:%M:%S")
    line = f"[{ts}] {msg}"
    print(line, flush=True)
    LOG_PATH.parent.mkdir(parents=True, exist_ok=True)
    with LOG_PATH.open("a") as f:
        f.write(line + "\n")


def send(proc: subprocess.Popen, msg: dict) -> None:
    data = json.dumps(msg) + "\n"
    proc.stdin.write(data)
    proc.stdin.flush()


def read_response(proc: subprocess.Popen, expected_id: int, timeout_sec: int = 30) -> dict | None:
    """Read lines until we find a response matching expected_id, or timeout."""
    deadline = time.time() + timeout_sec
    while time.time() < deadline:
        if proc.poll() is not None:
            log(f"MCP server died with exit code {proc.returncode}")
            return None
        line = proc.stdout.readline()
        if not line:
            time.sleep(0.1)
            continue
        line = line.strip()
        if not line:
            continue
        try:
            msg = json.loads(line)
        except json.JSONDecodeError:
            log(f"non-json: {line[:200]}")
            continue
        if msg.get("id") == expected_id:
            return msg
        if "method" in msg:
            log(f"notif: {msg.get('method')} params={str(msg.get('params'))[:100]}")
    log(f"timeout waiting for id={expected_id}")
    return None


def extract_text(response: dict) -> str:
    if not response:
        return ""
    result = response.get("result") or {}
    content = result.get("content") or []
    parts = []
    for item in content:
        if isinstance(item, dict) and item.get("type") == "text":
            parts.append(item.get("text", ""))
    return "\n".join(parts)



def main() -> int:
    target = str(PATH)
    log(f"launching MCP server, indexing target: {target}")
    proc = subprocess.Popen(
        ["npx", "-y", "@zilliz/claude-context-mcp@latest"],
        stdin=subprocess.PIPE,
        stdout=subprocess.PIPE,
        stderr=subprocess.DEVNULL,
        env=ENV,
        text=True,
        bufsize=1,
    )

    # 1. initialize
    send(proc, {
        "jsonrpc": "2.0",
        "id": 1,
        "method": "initialize",
        "params": {
            "protocolVersion": "2024-11-05",
            "capabilities": {},
            "clientInfo": {"name": "jarvis-indexer", "version": "1.0"},
        },
    })
    resp = read_response(proc, 1, timeout_sec=60)
    if resp is None:
        log("initialize failed")
        proc.terminate()
        return 1
    log(f"initialized: server={resp.get('result', {}).get('serverInfo', {}).get('name')}")

    # 2. initialized notification
    send(proc, {"jsonrpc": "2.0", "method": "notifications/initialized"})
    time.sleep(1)

    # 3. kick off indexing
    force = os.environ.get("FORCE_REINDEX", "true").lower() in ("1", "true", "yes")
    log(f"calling index_codebase(force={force})")
    send(proc, {
        "jsonrpc": "2.0",
        "id": 2,
        "method": "tools/call",
        "params": {
            "name": "index_codebase",
            "arguments": {"path": target, "splitter": "ast", "force": force},
        },
    })
    resp = read_response(proc, 2, timeout_sec=60)
    log(f"index_codebase response: {extract_text(resp)[:300]}")


    # 4. poll status loop
    start = time.time()
    poll_id = 10
    last_progress = None
    while time.time() - start < MAX_MINUTES * 60:
        if proc.poll() is not None:
            log(f"MCP died mid-index, exit={proc.returncode}")
            return 2
        time.sleep(POLL_INTERVAL_SEC)
        poll_id += 1
        send(proc, {
            "jsonrpc": "2.0",
            "id": poll_id,
            "method": "tools/call",
            "params": {
                "name": "get_indexing_status",
                "arguments": {"path": target},
            },
        })
        resp = read_response(proc, poll_id, timeout_sec=30)
        text = extract_text(resp)
        if text and text != last_progress:
            log(f"status: {text[:400]}")
            last_progress = text
        lower = text.lower()
        if "indexing failed" in lower:
            log("FAIL detected")
            break
        if ("completed" in lower or "100%" in lower or "fully indexed" in lower):
            log("COMPLETE detected")
            break

    log("shutting down MCP")
    try:
        proc.stdin.close()
        proc.wait(timeout=10)
    except subprocess.TimeoutExpired:
        proc.terminate()
        proc.wait(timeout=5)
    log(f"done after {(time.time()-start)/60:.1f} min")
    return 0


if __name__ == "__main__":
    sys.exit(main())
