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

# Reuse the existing BM25 search implementation so we don't duplicate tokenizer
# or scoring logic.
sys.path.insert(0, str(MEMORY_DIR))
try:
    from memory_search import search  # type: ignore
except ImportError:
    print("ERROR: memory_search.py not found next to memory/", file=sys.stderr)
    sys.exit(1)


HEADER = "## Lessons from Previous Runs (apply these before executing)\n"
MIN_SCORE = 1.0  # BM25 score floor — filters weak matches


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
    parser.add_argument("--min-score", type=float, default=MIN_SCORE)
    args = parser.parse_args()

    if not LEARNED_INDEX.exists():
        if not args.silent_if_empty:
            print(f"Lessons index not found at {LEARNED_INDEX}.", file=sys.stderr)
        return 0

    results = search(args.query, top_k=args.top, index_path=LEARNED_INDEX)
    results = [r for r in results if r["score"] >= args.min_score]

    if not results and args.silent_if_empty:
        return 0

    block = format_inject_block(results)
    if block:
        print(block)
    return 0


if __name__ == "__main__":
    sys.exit(main())
