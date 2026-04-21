#!/usr/bin/env python3
"""
JARVIS Memory Search
Fast BM25 recall over all indexed memory chunks.
Returns the top-k most relevant chunks with source file + section pointers,
so JARVIS can load only the right L2/L3 files instead of guessing.

Usage:
    python3 memory/memory_search.py "Thinklet pricing decision"
    python3 memory/memory_search.py "Lapse Engine launch timing" --top 5
    python3 memory/memory_search.py "Kyle Morley contact" --top 3 --json
"""

import re
import sys
import json
import argparse
from pathlib import Path

try:
    from rank_bm25 import BM25Okapi
except ImportError:
    print("ERROR: rank-bm25 not installed. Run: pip3 install rank-bm25 --break-system-packages")
    sys.exit(1)

MEMORY_DIR = Path(__file__).parent
DEFAULT_INDEX_PATH = MEMORY_DIR / "memory_index.json"

STOP_WORDS = {
    "a", "an", "the", "and", "or", "but", "in", "on", "at", "to", "for",
    "of", "with", "by", "from", "is", "are", "was", "were", "be", "been",
    "have", "has", "had", "do", "does", "did", "will", "would", "could",
    "should", "may", "might", "this", "that", "these", "those", "it", "its",
    "i", "we", "you", "he", "she", "they", "what", "which", "who", "how",
    "when", "where", "about", "as", "if", "so", "not", "no", "my", "our",
}


def tokenize(text: str) -> list[str]:
    tokens = re.findall(r"[a-z0-9]+", text.lower())
    return [t for t in tokens if t not in STOP_WORDS and len(t) > 1]


def load_chunks(index_path: Path = DEFAULT_INDEX_PATH) -> list[dict]:
    if not index_path.exists():
        return []
    try:
        data = json.loads(index_path.read_text(encoding="utf-8"))
        return data.get("chunks", [])
    except (json.JSONDecodeError, KeyError):
        return []


def search(query: str, top_k: int = 5, index_path: Path = DEFAULT_INDEX_PATH) -> list[dict]:
    chunks = load_chunks(index_path)
    if not chunks:
        return []

    corpus_tokens = [tokenize(c["content"] + " " + c["section"]) for c in chunks]
    query_tokens = tokenize(query)

    if not query_tokens:
        return []

    bm25 = BM25Okapi(corpus_tokens)
    scores = bm25.get_scores(query_tokens)

    ranked = sorted(
        ((score, chunk) for score, chunk in zip(scores, chunks) if score > 0),
        key=lambda x: x[0],
        reverse=True,
    )

    results = []
    for score, chunk in ranked[:top_k]:
        preview = chunk["content"].replace("\n", " ").strip()
        if len(preview) > 300:
            preview = preview[:297] + "..."
        results.append({
            "file": chunk["file"],
            "section": chunk["section"],
            "score": round(float(score), 3),
            "word_count": chunk["word_count"],
            "preview": preview,
        })

    return results


def format_results(results: list[dict], query: str) -> str:
    if not results:
        return (
            f'No memory chunks matched "{query}".\n'
            f'Try rebuilding the index: python3 memory/memory_indexer.py'
        )

    lines = [f'Memory search: "{query}" → {len(results)} result(s)\n']
    for i, r in enumerate(results, 1):
        lines.append(f"[{i}] {r['file']} § {r['section']}  (score: {r['score']})")
        lines.append(f"    {r['preview']}")
        lines.append("")
    return "\n".join(lines)


def main() -> None:
    parser = argparse.ArgumentParser(description="Search a BM25-indexed markdown corpus")
    parser.add_argument("query", help="Search query")
    parser.add_argument("--top", type=int, default=5, help="Number of results (default 5)")
    parser.add_argument("--json", action="store_true", dest="as_json", help="Output raw JSON")
    parser.add_argument(
        "--index-path",
        type=Path,
        default=DEFAULT_INDEX_PATH,
        help="Path to index JSON (default: memory/memory_index.json)",
    )
    args = parser.parse_args()

    if not args.index_path.exists():
        print(f"Index not found at {args.index_path}. Run memory_indexer.py first.")
        sys.exit(1)

    results = search(args.query, top_k=args.top, index_path=args.index_path)

    if args.as_json:
        print(json.dumps(results, indent=2))
    else:
        print(format_results(results, args.query))


if __name__ == "__main__":
    main()
