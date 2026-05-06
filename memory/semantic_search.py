#!/usr/bin/env python3
"""
JARVIS Semantic Search

Hybrid retrieval over the same chunked index format used by memory_search.py.
If Ollama (nomic-embed-text) is reachable AND chunks have embeddings, uses
cosine similarity. Otherwise falls back to BM25 via memory_search.search.

This is the upgrade path for the MetaClaw learned-lessons retrieval — semantic
search catches paraphrased lessons that BM25 misses.

Usage:
    python3 memory/semantic_search.py "tool routing for github" --index-path skills/learned/learned_index.json
    python3 memory/semantic_search.py "deploy supabase" --top 3 --json

Embeddings are populated by `embed_learned.py` and live alongside existing
chunks in the same JSON index. If a chunk has no embedding, it falls back to
BM25 scoring for that chunk only — so a partially-embedded index still works.
"""

import argparse
import json
import math
import os
import sys
import urllib.error
import urllib.request
from pathlib import Path

MEMORY_DIR = Path(__file__).resolve().parent
sys.path.insert(0, str(MEMORY_DIR))

# Load chunks helper (no BM25 dependency).
def _load_chunks(index_path: Path) -> list[dict]:
    if not index_path.exists():
        return []
    try:
        data = json.loads(index_path.read_text(encoding="utf-8"))
        return data.get("chunks", [])
    except (json.JSONDecodeError, KeyError):
        return []


# BM25 is imported lazily inside _bm25_fallback so this module works even when
# rank-bm25 isn't installed (semantic-only mode).
def _bm25_fallback(query: str, top_k: int, index_path: Path) -> list[dict]:
    # memory_search.py prints to stdout then sys.exit(1)s at module load if
    # rank-bm25 isn't installed. Suppress its noise so callers see clean output,
    # and catch SystemExit alongside ImportError so we degrade gracefully.
    import io
    import contextlib
    try:
        with contextlib.redirect_stdout(io.StringIO()):
            from memory_search import search as bm25_search  # type: ignore
        return bm25_search(query, top_k=top_k, index_path=index_path)
    except (ImportError, SystemExit):
        return []


OLLAMA_HOST = os.environ.get("OLLAMA_HOST", "http://localhost:11434")
OLLAMA_MODEL = os.environ.get("OLLAMA_EMBED_MODEL", "nomic-embed-text")
OLLAMA_TIMEOUT = 5.0  # seconds — fast fail


def embed_query(text: str) -> list[float] | None:
    """Embed a query via Ollama. Returns None if Ollama unreachable or errored."""
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
            return None
    except (urllib.error.URLError, urllib.error.HTTPError, TimeoutError, ConnectionError, json.JSONDecodeError):
        return None


def cosine(a: list[float], b: list[float]) -> float:
    if not a or not b or len(a) != len(b):
        return 0.0
    dot = sum(x * y for x, y in zip(a, b))
    na = math.sqrt(sum(x * x for x in a))
    nb = math.sqrt(sum(x * x for x in b))
    if na == 0 or nb == 0:
        return 0.0
    return dot / (na * nb)


def search_semantic(
    query: str, top_k: int = 5, index_path: Path | None = None
) -> tuple[list[dict], str]:
    """
    Returns (results, mode).
    mode is 'semantic' if Ollama embeddings were used, 'bm25' if fallback.
    Each result has the same shape as memory_search.search() output.
    """
    if index_path is None:
        index_path = MEMORY_DIR / "memory_index.json"

    chunks = _load_chunks(index_path)
    if not chunks:
        return [], "empty"

    # Are any chunks embedded? If none, fall straight back to BM25.
    has_embeddings = any("embedding" in c and c["embedding"] for c in chunks)
    if not has_embeddings:
        return _bm25_fallback(query, top_k=top_k, index_path=index_path), "bm25"

    # Try to embed the query. If Ollama isn't reachable, fall back to BM25.
    query_vec = embed_query(query)
    if query_vec is None:
        return _bm25_fallback(query, top_k=top_k, index_path=index_path), "bm25"

    # Score all chunks: semantic for embedded ones, BM25-derived for the rest.
    bm25_results = _bm25_fallback(query, top_k=len(chunks), index_path=index_path)
    bm25_by_section = {(r["file"], r["section"]): r["score"] for r in bm25_results}

    scored = []
    for c in chunks:
        emb = c.get("embedding")
        if emb:
            score = cosine(query_vec, emb)
            kind = "semantic"
        else:
            # Normalize BM25 score roughly to [0, 1] so it competes fairly
            raw = bm25_by_section.get((c["file"], c["section"]), 0.0)
            score = min(raw / 10.0, 1.0)
            kind = "bm25-fallback"
        if score <= 0:
            continue

        preview = c["content"].replace("\n", " ").strip()
        if len(preview) > 300:
            preview = preview[:297] + "..."

        scored.append({
            "file": c["file"],
            "section": c["section"],
            "preview": preview,
            "score": float(score),
            "match": kind,
        })

    scored.sort(key=lambda r: r["score"], reverse=True)
    return scored[:top_k], "semantic"


def main() -> int:
    parser = argparse.ArgumentParser(description="Semantic search over JARVIS memory chunks")
    parser.add_argument("query")
    parser.add_argument("--top", type=int, default=5)
    parser.add_argument("--index-path", type=Path, default=None)
    parser.add_argument("--json", action="store_true")
    args = parser.parse_args()

    results, mode = search_semantic(args.query, top_k=args.top, index_path=args.index_path)

    if args.json:
        print(json.dumps({"mode": mode, "results": results}, indent=2))
        return 0

    if not results:
        print(f"(no results — search mode: {mode})")
        return 0

    print(f"# Search mode: {mode}\n")
    for r in results:
        print(f"## {r['file']} § {r['section']}  (score: {r['score']:.3f}, {r.get('match','?')})")
        print(r["preview"])
        print()
    return 0


if __name__ == "__main__":
    sys.exit(main())
