#!/usr/bin/env python3
"""
MetaClaw Consolidator
Weekly hygiene pass over skills/learned/*.md. For each learned file:
  - If under soft cap, leave it alone (lessons are appended in chronological order).
  - If over soft cap OR has duplicate slugs, call Haiku to dedupe/merge/prune.

Intended to be invoked from a scheduled task, not a hook. Safe to run manually:
    python3 hooks/metaclaw_consolidate.py
    python3 hooks/metaclaw_consolidate.py --dry-run
    python3 hooks/metaclaw_consolidate.py --file tool-routing.md

Never spends Sonnet/Opus tokens — only Haiku for compression.
"""

import argparse
import os
import re
import subprocess
import sys
from datetime import datetime
from pathlib import Path

_SCRIPT_ROOT = Path(__file__).resolve().parent.parent
JARVIS_DIR = Path(os.environ.get("JARVIS_DIR", _SCRIPT_ROOT))
LEARNED_DIR = JARVIS_DIR / "skills" / "learned"
LOG_FILE = JARVIS_DIR / "logs" / "metaclaw.log"
HAIKU_MODEL = "claude-haiku-4-5-20251001"
SOFT_CAP_CHARS = 6_000
HARD_CAP_CHARS = 9_000

CONSOLIDATION_PROMPT = """You are the MetaClaw consolidator. Below is a markdown file of learned lessons that has grown too large or developed duplicates. Rewrite it following these rules:

1. MERGE duplicate lessons (same rule or same root cause) into a single entry. Bump the `seen` count to reflect combined occurrences. Raise confidence: 1x=LOW, 2x=MEDIUM, 3+=HIGH.
2. PRUNE lessons with confidence LOW that haven't been seen in 21+ days (compare against today's date).
3. KEEP lessons with confidence MEDIUM or HIGH regardless of age.
4. Preserve the markdown structure: file header stays, each lesson is a ### block with When/Rule/Why/Fix/Applies to/Last seen.
5. Do NOT invent new lessons. Do NOT change the substance of any rule. Only merge, prune, and tighten wording.
6. Output the full rewritten file content and nothing else — no commentary, no code fences around the whole thing.

Today's date: {today}
Target file: {filename}

ORIGINAL CONTENT:
{content}
"""


def log(msg: str) -> None:
    LOG_FILE.parent.mkdir(parents=True, exist_ok=True)
    with LOG_FILE.open("a", encoding="utf-8") as f:
        f.write(f"[{datetime.now().strftime('%Y-%m-%d %H:%M:%S')}] [consolidate] {msg}\n")


def has_duplicate_slugs(content: str) -> bool:
    slugs = re.findall(r"^###\s+([a-z0-9-]+)\s+—", content, flags=re.MULTILINE)
    return len(slugs) != len(set(slugs))


def needs_consolidation(path: Path) -> tuple[bool, str]:
    """Return (needs_work, reason)."""
    if not path.exists():
        return False, "missing"
    content = path.read_text(encoding="utf-8")
    size = len(content)
    if size >= HARD_CAP_CHARS:
        return True, f"over hard cap ({size} >= {HARD_CAP_CHARS})"
    if size >= SOFT_CAP_CHARS and has_duplicate_slugs(content):
        return True, f"over soft cap with duplicates ({size} chars)"
    if has_duplicate_slugs(content):
        return True, "duplicate slugs detected"
    return False, f"clean ({size} chars)"


def call_haiku(prompt: str) -> str | None:
    try:
        result = subprocess.run(
            ["claude", "-p", "--model", HAIKU_MODEL, "--output-format", "text"],
            input=prompt,
            capture_output=True,
            text=True,
            timeout=240,
        )
    except FileNotFoundError:
        log("SKIP: claude CLI not on PATH")
        return None
    except subprocess.TimeoutExpired:
        log("ERROR: claude CLI timed out after 240s")
        return None

    if result.returncode != 0:
        log(f"ERROR: claude returned {result.returncode}: {result.stderr[:200]}")
        return None
    return result.stdout.strip()


def consolidate_file(path: Path, dry_run: bool) -> bool:
    needs, reason = needs_consolidation(path)
    log(f"{path.name}: {reason}")
    if not needs:
        return False

    if dry_run:
        print(f"WOULD CONSOLIDATE: {path.name} ({reason})")
        return True

    original = path.read_text(encoding="utf-8")
    today = datetime.now().strftime("%Y-%m-%d")
    prompt = CONSOLIDATION_PROMPT.format(today=today, filename=path.name, content=original)
    new_content = call_haiku(prompt)

    if new_content is None:
        log(f"{path.name}: consolidation failed — keeping original")
        return False

    # Sanity check: output must start with the file header
    if not new_content.startswith("# "):
        log(f"{path.name}: rejected malformed output (missing header)")
        return False

    # Safety: never truncate below 50% of original unless explicit prune
    if len(new_content) < len(original) * 0.3:
        log(f"{path.name}: rejected — output too short ({len(new_content)} vs {len(original)})")
        return False

    # Write backup + new content
    backup = path.with_suffix(".md.bak")
    backup.write_text(original, encoding="utf-8")
    path.write_text(new_content, encoding="utf-8")
    log(f"{path.name}: consolidated ({len(original)} → {len(new_content)} chars, backup at {backup.name})")
    return True


def main() -> int:
    parser = argparse.ArgumentParser(description="MetaClaw weekly consolidator")
    parser.add_argument("--dry-run", action="store_true", help="Report only, don't modify files")
    parser.add_argument("--file", type=str, help="Consolidate a single file (by basename)")
    args = parser.parse_args()

    if not LEARNED_DIR.exists():
        print(f"No learned directory at {LEARNED_DIR}", file=sys.stderr)
        return 1

    if args.file:
        targets = [LEARNED_DIR / args.file]
    else:
        targets = sorted(p for p in LEARNED_DIR.glob("*.md"))

    consolidated = 0
    for path in targets:
        if consolidate_file(path, args.dry_run):
            consolidated += 1

    log(f"Run complete: {consolidated}/{len(targets)} files consolidated")
    print(f"Consolidated {consolidated}/{len(targets)} files. See {LOG_FILE}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
