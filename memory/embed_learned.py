#!/usr/bin/env python3
"""
Embed Learned Lessons

Walks an existing chunked index (default: skills/learned/learned_index.json) and
populates an `embedding` field on each chunk via Ollama (nomic-embed-text).
Idempotent — already-embedded chunks are skipped unless --force is set.

Run once after metaclaw_extract.py writes new lessons, or wire it into stop_hook.sh
as the post-extract step. Silent on Ollama unavailability.

Usage:
    python3 memory/embed_learned.py
    python3 memory/embed_learned.py --index-path skills/learned/learned_index.json
    python3 memory/embed_learned.py --force  # re-embed all chunks
"""

import argparse
import json
import os
import sys
import urllib.error
import urllib.request
from datetime import datetime
from pathlib import Path

JARVIS_DIR = Path(__file__).resolve().parent.parent
DEFAULT_INDEX = JARVIS_DIR / "skills" / "learned" / "learned_index.json"
LOG_FILE = JARVIS_DIR / "logs" / "metaclaw.log"

OLLAMA_HOST = os.environ.get("OLLAMA_HOST", "http://localhost:11434")
OLLAMA_MODEL = os.environ.get("OLLAMA_EMBED_MODEL", "nomic-embed-text")
OLLAMA_TIMEOUT = 10.0


def log(msg: str) -> None:
    LOG_FILE.parent.mkdir(parents=True, exist_ok=True)
    with LOG_FILE.open("a", encoding="utf-8") as f:
        f.write(f"[{datetime.now().strftime('%Y-%m-%d %H:%M:%S')}] [embed] {msg}\n")


def embed_text(text: str) -> list[float] | None:
    url = f"{OLLAMA_HOST}/api/embeddings"
    payload = json.dumps({"model": OLLAMA_MODEL, "prompt": text}).encode("utf-8")
    req = urllib.request.Request(
        url, data=payload, headers={"Content-Type": "application/json"}, method="POST"
    )
    try:
        with urllib.request.urlopen(req, timeout=OLLAMA_TIMEOUT) as resp:
            data = json.loads(resp.read().decode("utf-8"))
            embedding = data.get("embedding")
            if isinstance(embedding, list) and embedding:
                return embedding
    except (urllib.error.URLError, urllib.error.HTTPError, TimeoutError, ConnectionError, json.JSONDecodeError) as e:
        log(f"WARN: embed failed: {type(e).__name__}: {e}")
        return None
    return None


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--index-path", type=Path, default=DEFAULT_INDEX)
    parser.add_argument("--force", action="store_true", help="Re-embed all chunks")
    args = parser.parse_args()

    if not args.index_path.exists():
        log(f"SKIP: index not found at {args.index_path}")
        return 0

    data = json.loads(args.index_path.read_text(encoding="utf-8"))
    chunks = data.get("chunks", [])
    if not chunks:
        log(f"SKIP: no chunks in {args.index_path}")
        return 0

    # Probe Ollama once before iterating.
    probe = embed_text("test")
    if probe is None:
        log(f"SKIP: Ollama unreachable at {OLLAMA_HOST} or model {OLLAMA_MODEL} unavailable")
        return 0

    embedded = 0
    skipped = 0
    failed = 0
    for c in chunks:
        if not args.force and "embedding" in c and c["embedding"]:
            skipped += 1
            continue

        text = (c.get("section", "") + "\n" + c.get("content", "")).strip()
        if not text:
            skipped += 1
            continue

        vec = embed_text(text)
        if vec is None:
            failed += 1
            continue

        c["embedding"] = vec
        c["embedded_at"] = datetime.utcnow().isoformat() + "Z"
        embedded += 1

    data["chunks"] = chunks
    data["embedding_model"] = OLLAMA_MODEL
    data["last_embed_run"] = datetime.utcnow().isoformat() + "Z"
    args.index_path.write_text(json.dumps(data, indent=2), encoding="utf-8")

    log(f"done: embedded={embedded} skipped={skipped} failed={failed} index={args.index_path}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
