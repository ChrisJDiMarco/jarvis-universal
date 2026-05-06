#!/usr/bin/env python3
"""
MetaClaw Injector
Takes a task description, searches the skills/learned/ BM25 index, and prints
the top relevant lessons in a format that can be prepended to an agent's
context.

Usage:
    python3 hooks/metaclaw_inject.py "write a firecrawl scraper for pricing pages"
    python3 hooks/metaclaw_inject.py "deploy to supabase" --top 3
    python3 hooks/metaclaw_inject.py "some task" --silent-if-empty

Output (stdout): a Markdown block ready to inject into a system prompt. Exits
0 whether or not matches are found unless --silent-if-empty is set and no
matches exist, in which case it prints nothing and exits 0.
"""

import argparse
import os
import re
import sys
from pathlib import Path

# Resolve JARVIS_DIR: env override → script's parent dir (script lives in hooks/)
_SCRIPT_ROOT = Path(__file__).resolve().parent.parent
JARVIS_DIR = Path(os.environ.get("JARVIS_DIR", _SCRIPT_ROOT))
LEARNED_INDEX = JARVIS_DIR / "skills" / "learned" / "learned_index.json"
MEMORY_DIR = JARVIS_DIR / "memory"

# Use semantic search (Ollama embeddings) with BM25 fallback. The semantic_search
# module handles the fallback transparently — if Ollama is down or chunks aren't
# embedded yet, it returns BM25 results. BM25 import is lazy so semantic-only
# environments (no rank-bm25) still work.
sys.path.insert(0, str(MEMORY_DIR))
try:
    from semantic_search import search_semantic  # type: ignore
except ImportError:
    print("ERROR: semantic_search.py not found next to memory/", file=sys.stderr)
    sys.exit(1)


def _bm25_search_lazy(query: str, top_k: int, index_path):
    # memory_search.py has a built-in BM25 fallback, but keep this lazy so
    # callers still degrade gracefully if the module itself is unavailable.
    import io
    import contextlib
    try:
        with contextlib.redirect_stdout(io.StringIO()):
            from memory_search import search as bm25_search  # type: ignore
        return bm25_search(query, top_k=top_k, index_path=index_path)
    except (ImportError, SystemExit):
        return []


HEADER = "## Lessons from Previous Runs (apply these before executing)\n"
# Floors are mode-specific: cosine similarity is in [0, 1]; BM25 raw scores
# are unbounded but typically <10 for relevant matches.
MIN_SEMANTIC_SCORE = 0.55
MIN_BM25_SCORE = 1.0


RULE_RE = re.compile(r"\*\*Rule\*\*:\s*(.+?)(?=\s*\*\*|$)", re.DOTALL)


def extract_rule(preview: str) -> str | None:
    """Pull the '**Rule**: ...' sentence out of a lesson preview, if present."""
    m = RULE_RE.search(preview)
    if not m:
        return None
    rule = m.group(1).strip().rstrip(".")
    # Trim to a reasonable length for a one-line injection
    if len(rule) > 180:
        rule = rule[:177].rsplit(" ", 1)[0] + "..."
    return rule


def format_inject_block(results: list[dict]) -> str:
    if not results:
        return ""
    lines = [HEADER]
    for r in results:
        rule = extract_rule(r["preview"])
        section = r["section"].split(" — ")[0]  # short slug
        if rule:
            lines.append(f"- **{rule}** — `{r['file']}` § {section}")
        else:
            snippet = r["preview"][:140].rsplit(" ", 1)[0] + "..."
            lines.append(f"- {snippet} — `{r['file']}`")
    return "\n".join(lines) + "\n"


def main() -> int:
    parser = argparse.ArgumentParser(description="Inject relevant learned lessons")
    parser.add_argument("query", help="Task description to match against lessons")
    parser.add_argument("--top", type=int, default=5)
    parser.add_argument("--silent-if-empty", action="store_true")
    parser.add_argument(
        "--min-score",
        type=float,
        default=None,
        help="Override floor (default: 0.55 for semantic, 1.0 for BM25)",
    )
    parser.add_argument(
        "--mode",
        choices=["auto", "semantic", "bm25"],
        default="auto",
        help="Force a search mode. 'auto' tries semantic first, falls back to BM25.",
    )
    args = parser.parse_args()

    if not LEARNED_INDEX.exists():
        if not args.silent_if_empty:
            print(f"Lessons index not found at {LEARNED_INDEX}.", file=sys.stderr)
        return 0

    if args.mode == "bm25":
        results = _bm25_search_lazy(args.query, top_k=args.top, index_path=LEARNED_INDEX)
        floor = args.min_score if args.min_score is not None else MIN_BM25_SCORE
    else:
        results, mode_used = search_semantic(args.query, top_k=args.top, index_path=LEARNED_INDEX)
        if args.min_score is not None:
            floor = args.min_score
        else:
            floor = MIN_SEMANTIC_SCORE if mode_used == "semantic" else MIN_BM25_SCORE

    results = [r for r in results if r["score"] >= floor]

    if not results and args.silent_if_empty:
        return 0

    block = format_inject_block(results)
    if block:
        print(block)
    return 0


if __name__ == "__main__":
    sys.exit(main())
