#!/usr/bin/env python3
"""
second-brain-level-audit.py - read-only retrieval-layer audit for JARVIS.

This script answers one narrow question: which parts of the local knowledge
system are still best served by plain markdown/wiki routing, and which parts
have enough retrieval pain to justify semantic search, graph extraction, or
live connector lookup?

It is deliberately read-only. It does not rebuild indexes, create embeddings,
edit memory, or enable always-on ingestion.

Usage:
    python3 scripts/second-brain-level-audit.py
    python3 scripts/second-brain-level-audit.py --json
    python3 scripts/second-brain-level-audit.py --root /path/to/jarvis
"""
from __future__ import annotations

import argparse
import json
import os
import re
from dataclasses import asdict, dataclass
from pathlib import Path


WIKILINK_RE = re.compile(r"\[\[([^\]]+)\]\]")
HEADING_RE = re.compile(r"^#{1,6}\s+", re.MULTILINE)
WORD_RE = re.compile(r"[A-Za-z0-9_'-]+")


@dataclass
class CorpusReport:
    name: str
    path: str
    desired_level: str
    current_level: str
    files: int
    words: int
    sections: int
    wikilinks: int
    typed_wikilinks: int
    index_chunks: int
    embedded_chunks: int
    graph_present: bool
    status: str
    recommendation: str


def iter_markdown(base: Path, recursive: bool = True) -> list[Path]:
    if not base.exists():
        return []
    if base.is_file() and base.suffix == ".md":
        return [base]
    pattern = "**/*.md" if recursive else "*.md"
    ignored_parts = {
        ".git",
        "node_modules",
        ".venv",
        "venv",
        "__pycache__",
        "build",
        "DerivedData",
    }
    files = []
    for path in base.glob(pattern):
        if any(part in ignored_parts for part in path.parts):
            continue
        files.append(path)
    return sorted(files)


def read_text(path: Path) -> str:
    try:
        return path.read_text(encoding="utf-8", errors="replace")
    except OSError:
        return ""


def count_index(index_path: Path) -> tuple[int, int]:
    if not index_path.exists():
        return 0, 0
    try:
        data = json.loads(index_path.read_text(encoding="utf-8"))
    except (OSError, json.JSONDecodeError):
        return 0, 0
    chunks = data.get("chunks", [])
    if not isinstance(chunks, list):
        return 0, 0
    embedded = sum(1 for chunk in chunks if isinstance(chunk, dict) and chunk.get("embedding"))
    return len(chunks), embedded


def infer_current_level(
    files: int,
    typed_wikilinks: int,
    index_chunks: int,
    embedded_chunks: int,
    graph_present: bool,
) -> str:
    if graph_present or typed_wikilinks >= 25:
        # Typed wikilinks are graph-lite: useful relationships, not a full entity DB.
        return "L4-lite"
    if embedded_chunks > 0:
        return "L3"
    if index_chunks > 0 or files >= 10:
        return "L2"
    return "L1"


def score_status(
    desired_level: str,
    current_level: str,
    files: int,
    words: int,
    index_chunks: int,
    embedded_chunks: int,
) -> tuple[str, str]:
    wants_semantic = desired_level in {"L3", "L3 selective", "L3/L4-lite"}
    wants_graph = desired_level in {"L4-lite", "L3/L4-lite"}

    if wants_semantic and embedded_chunks == 0:
        if index_chunks > 0:
            return (
                "yellow",
                "Semantic code exists but this corpus has no embeddings; keep markdown as truth, then add embeddings only if search misses real queries.",
            )
        return (
            "yellow",
            "High-volume corpus without an index; add a cheap index before considering embeddings.",
        )

    if wants_graph and current_level != "L4-lite":
        return (
            "yellow",
            "Relationship value likely exists; add typed wikilinks during normal promotion rather than bulk graphing everything.",
        )

    if words > 50000 and desired_level in {"L1", "L2"}:
        return (
            "yellow",
            "Corpus is large for its desired level; split or index only if retrieval pain shows up.",
        )

    if files == 0:
        return "gray", "No files found for this corpus."

    return "green", "Current level is appropriate; do not add complexity without retrieval pain."


def summarize_corpus(
    root: Path,
    name: str,
    rel_path: str,
    desired_level: str,
    recursive: bool = True,
    index_rel: str | None = None,
    graph_rel: str | None = None,
) -> CorpusReport:
    path = root / rel_path
    md_files = iter_markdown(path, recursive=recursive)
    texts = [read_text(file) for file in md_files]
    joined = "\n".join(texts)
    links = WIKILINK_RE.findall(joined)
    typed_links = [link for link in links if "::" in link]
    words = len(WORD_RE.findall(joined))
    sections = len(HEADING_RE.findall(joined))
    index_chunks, embedded_chunks = count_index(root / index_rel) if index_rel else (0, 0)
    graph_present = bool(graph_rel and (root / graph_rel).exists())
    current_level = infer_current_level(
        files=len(md_files),
        typed_wikilinks=len(typed_links),
        index_chunks=index_chunks,
        embedded_chunks=embedded_chunks,
        graph_present=graph_present,
    )
    status, recommendation = score_status(
        desired_level=desired_level,
        current_level=current_level,
        files=len(md_files),
        words=words,
        index_chunks=index_chunks,
        embedded_chunks=embedded_chunks,
    )
    return CorpusReport(
        name=name,
        path=rel_path,
        desired_level=desired_level,
        current_level=current_level,
        files=len(md_files),
        words=words,
        sections=sections,
        wikilinks=len(links),
        typed_wikilinks=len(typed_links),
        index_chunks=index_chunks,
        embedded_chunks=embedded_chunks,
        graph_present=graph_present,
        status=status,
        recommendation=recommendation,
    )


def build_report(root: Path) -> dict:
    corpora = [
        summarize_corpus(
            root,
            "Core memory",
            "memory/core.md",
            "L1",
            recursive=False,
        ),
        summarize_corpus(
            root,
            "Critical and hot memory",
            "memory/L1-critical-facts.md",
            "L1",
            recursive=False,
        ),
        summarize_corpus(
            root,
            "Operational memory",
            "memory",
            "L2",
            recursive=False,
            index_rel="memory/memory_index.json",
        ),
        summarize_corpus(
            root,
            "Atomic decisions",
            "memory/decisions",
            "L3/L4-lite",
            recursive=True,
        ),
        summarize_corpus(
            root,
            "Generated wiki",
            "wiki",
            "L2",
            recursive=True,
            graph_rel="wiki/graph.json",
        ),
        summarize_corpus(
            root,
            "Subject knowledge bases",
            "knowledge",
            "L2",
            recursive=True,
        ),
        summarize_corpus(
            root,
            "Top-level skills",
            "skills",
            "L2",
            recursive=False,
        ),
        summarize_corpus(
            root,
            "Learned lessons",
            "skills/learned",
            "L3 selective",
            recursive=True,
            index_rel="skills/learned/learned_index.json",
        ),
        summarize_corpus(
            root,
            "AI intel transcripts",
            "projects/ai-intel/transcripts",
            "L3",
            recursive=True,
            index_rel="projects/ai-intel/transcripts_index.json",
        ),
    ]

    counts = {
        "green": sum(1 for c in corpora if c.status == "green"),
        "yellow": sum(1 for c in corpora if c.status == "yellow"),
        "gray": sum(1 for c in corpora if c.status == "gray"),
    }
    return {
        "root": str(root),
        "verdict": "needs attention" if counts["yellow"] else "clean",
        "counts": counts,
        "corpora": [asdict(corpus) for corpus in corpora],
        "principle": "Use the lowest retrieval level that solves the observed pain; do not promote a corpus to semantic search, graph, or always-on ingestion just because the tooling exists.",
    }


def human(report: dict) -> str:
    lines = [
        "# JARVIS Second-Brain Level Audit",
        "",
        f"Verdict: {report['verdict']}",
        f"Principle: {report['principle']}",
        "",
        "| Corpus | Desired | Current | Files | Words | Links | Index | Status |",
        "|---|---:|---:|---:|---:|---:|---:|---|",
    ]
    for corpus in report["corpora"]:
        index = f"{corpus['embedded_chunks']}/{corpus['index_chunks']}"
        lines.append(
            "| {name} | {desired_level} | {current_level} | {files} | {words} | {typed_wikilinks}/{wikilinks} | {index} | {status} |".format(
                index=index,
                **corpus,
            )
        )
    lines.extend(["", "## Recommendations"])
    for corpus in report["corpora"]:
        if corpus["status"] != "green":
            lines.append(f"- {corpus['name']}: {corpus['recommendation']}")
    if not any(corpus["status"] != "green" for corpus in report["corpora"]):
        lines.append("- No action needed. Keep the system boring until retrieval pain appears.")
    lines.extend(
        [
            "",
            "## Level Key",
            "- L1: router files and exact lookup.",
            "- L2: markdown wiki/topic files with indexes and backlinks.",
            "- L3: semantic retrieval for large corpora where wording varies.",
            "- L4-lite: typed wikilinks or entity relationships for traceable chains.",
            "- L5: always-on syncing/refreshing; keep gated for JARVIS unless the operator asks.",
        ]
    )
    return "\n".join(lines)


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--root", default=Path(__file__).resolve().parents[1])
    parser.add_argument("--json", action="store_true")
    args = parser.parse_args()

    root = Path(args.root).expanduser().resolve()
    report = build_report(root)
    if args.json:
        print(json.dumps(report, indent=2))
    else:
        print(human(report))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
