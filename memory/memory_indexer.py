#!/usr/bin/env python3
"""
JARVIS Memory Indexer
Chunks markdown files by section heading and stores them in a JSON index so
memory_search.py can do fast BM25 recall without loading every file into
context.

Default usage indexes memory/*.md. Pass --source-dir / --index-path to reuse
the same indexer for other corpora (e.g. skills/learned/).

Usage:
    python3 memory/memory_indexer.py                    # full reindex of memory/
    python3 memory/memory_indexer.py file1.md           # incremental (named files only)
    python3 memory/memory_indexer.py --source-dir DIR --index-path IDX.json
    python3 memory/memory_indexer.py --source-dir DIR --index-path IDX.json file1.md
"""

import argparse
import re
import sys
import json
from datetime import datetime, timezone
from pathlib import Path

MEMORY_DIR = Path(__file__).parent
INDEX_PATH = MEMORY_DIR / "memory_index.json"

SKIP_FILES = {"memory_indexer.py", "memory_search.py", "memory_index.json",
              "memory_index_stats.json", "learned_index.json"}


def parse_sections(text: str) -> list[dict]:
    """
    Split a markdown file into (section_heading, content) chunks.
    Top-level content before any heading becomes section '__preamble__'.
    Each #, ##, or ### heading starts a new chunk.
    """
    chunks = []
    current_heading = "__preamble__"
    current_lines: list[str] = []

    for line in text.splitlines():
        heading_match = re.match(r"^(#{1,3})\s+(.+)", line)
        if heading_match:
            body = "\n".join(current_lines).strip()
            if body:
                chunks.append({
                    "section": current_heading,
                    "content": body,
                    "word_count": len(body.split()),
                })
            current_heading = heading_match.group(2).strip()
            current_lines = []
        else:
            current_lines.append(line)

    body = "\n".join(current_lines).strip()
    if body:
        chunks.append({
            "section": current_heading,
            "content": body,
            "word_count": len(body.split()),
        })

    return chunks


def load_index(index_path: Path) -> dict:
    if index_path.exists():
        try:
            return json.loads(index_path.read_text(encoding="utf-8"))
        except json.JSONDecodeError:
            pass
    return {"chunks": [], "stats": {}}


def save_index(index: dict, index_path: Path) -> None:
    index_path.parent.mkdir(parents=True, exist_ok=True)
    index_path.write_text(json.dumps(index, indent=2, ensure_ascii=False), encoding="utf-8")


def index_file(index: dict, md_path: Path) -> int:
    """Remove existing chunks for this file and reindex. Returns chunk count."""
    text = md_path.read_text(encoding="utf-8", errors="replace")
    filename = md_path.name
    sections = parse_sections(text)
    now = datetime.now(timezone.utc).isoformat()

    # Remove old chunks for this file
    index["chunks"] = [c for c in index["chunks"] if c["file"] != filename]

    # Add new chunks
    for s in sections:
        index["chunks"].append({
            "file": filename,
            "section": s["section"],
            "content": s["content"],
            "word_count": s["word_count"],
            "indexed_at": now,
        })

    return len(sections)


def main(
    target_files: list[str] | None = None,
    source_dir: Path = MEMORY_DIR,
    index_path: Path = INDEX_PATH,
) -> None:
    index = load_index(index_path)

    if target_files:
        paths = [source_dir / f for f in target_files if (source_dir / f).exists()]
    else:
        paths = sorted(
            p for p in source_dir.glob("*.md")
            if p.name not in SKIP_FILES
        )

    total_chunks = 0
    for path in paths:
        count = index_file(index, path)
        total_chunks += count
        print(f"  indexed {path.name} → {count} chunks")

    index["stats"] = {
        "last_indexed": datetime.now(timezone.utc).isoformat(),
        "files_indexed": len(index["chunks"]) and len({c["file"] for c in index["chunks"]}),
        "total_chunks": len(index["chunks"]),
        "source_dir": str(source_dir),
    }

    save_index(index, index_path)
    print(f"\n✓ Index updated: {len(paths)} files, {total_chunks} chunks → {index_path.name}")


def _parse_args() -> tuple[list[str] | None, Path, Path]:
    parser = argparse.ArgumentParser(description="BM25 indexer for markdown corpora")
    parser.add_argument("files", nargs="*", help="Specific files to reindex (incremental)")
    parser.add_argument("--source-dir", type=Path, default=MEMORY_DIR)
    parser.add_argument("--index-path", type=Path, default=INDEX_PATH)
    args = parser.parse_args()
    return (args.files or None), args.source_dir, args.index_path


if __name__ == "__main__":
    target, source, idx = _parse_args()
    main(target, source_dir=source, index_path=idx)
