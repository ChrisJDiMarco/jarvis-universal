#!/usr/bin/env python3
"""
integrity-check.py — Knowledge-corpus integrity validator for JARVIS.

Deterministic checks over the knowledge zones (memory/, wiki/, knowledge/,
team/, root CLAUDE.md). Catches the silent rot that semantic search can't:

  1. Orphaned wikilinks  — [[target]] (incl. typed [[edge::target]] and
                           aliased [[target|Display]]) whose target doesn't
                           resolve to any known file/slug or relative path.
  2. Stale entries       — memory + knowledge-wiki files not modified in >90d.
  3. Weak provenance     — knowledge-wiki articles that make numeric/$ claims
                           with no source link anywhere in the file.

What it deliberately does NOT do: contradiction detection between articles.
That needs an LLM pass — see skills/knowledge-integrity.md (the script runs
first, the skill reads this report and does the semantic pass).

Usage:
    python3 scripts/integrity-check.py            # human report, repo root
    python3 scripts/integrity-check.py --json     # machine-readable
    python3 scripts/integrity-check.py --root .   # explicit root
    python3 scripts/integrity-check.py --stale-days 120

Exit: 0 = clean, 2 = issues found (so a scheduled task can gate on it).
"""
from __future__ import annotations

import argparse
import glob
import json
import os
import re
import sys
import time

# Zones whose *links* we validate. Scoped on purpose — we do NOT crawl
# projects/ or skills/ecc/ (181 files, not the point) for broken links.
SCAN_DIRS = ["memory", "wiki", "knowledge", "team"]
SCAN_ROOT_FILES = ["CLAUDE.md"]

# Zones that can be *link targets*. Broader than SCAN so a memory note may
# legitimately point at a skill or an agent wiki node.
TARGET_DIRS = ["memory", "wiki", "knowledge", "team", "skills"]
TARGET_ROOT_FILES = ["CLAUDE.md", "MEMORY.md"]

# Wiki node prefixes that are stripped to recover the bare slug a note uses.
PREFIXES = ("memory_", "agent_", "project_", "skill_", "wiki_")
# A link is a "hard reference" (must resolve) only if it's structural: a path,
# an aliased index entry, or a typed node reference. Bare/typed concept links
# and tags are forward-links and MAY dangle per the CLAUDE.md edge convention
# ("a [[name]] that doesn't match yet is fine"). Flagging those = crying wolf.
NODE_PREFIXES = ("memory_", "agent_", "project_", "skill_", "wiki_",
                 "reference_", "feedback_", "team_")

WIKILINK_RE = re.compile(r"\[\[([^\]]+)\]\]")
NAME_FM_RE = re.compile(r"^name:\s*(.+?)\s*$", re.MULTILINE)
# Convention/template placeholders that appear in docs explaining the link
# format — not real links. Skipped so the report stays signal, not noise.
PLACEHOLDER_RE = re.compile(
    r"[<>]|YYYY|\bMM\b|\bDD\b|original-slug|concept-or-pillar|another-decision"
    r"|source-event|their-name|^wikilinks$|^name$|-1$|-2$|-3$|step-\d"
)
CLAIM_RE = re.compile(r"(\$\s?\d|\b\d+(?:[.,]\d+)?\s?%|\b\d{2,}\b)")
URL_OR_SOURCE_RE = re.compile(r"https?://|\bsource\b|\bref\b|\bcitation\b", re.IGNORECASE)

STALE_DAYS_DEFAULT = 90


def strip_code_keep_lines(text: str) -> list[str]:
    """Blank out fenced + inline code so example links inside docs aren't
    treated as real links. Line numbers are preserved."""
    out, in_fence = [], False
    for line in text.splitlines():
        s = line.lstrip()
        if s.startswith("```") or s.startswith("~~~"):
            in_fence = not in_fence
            out.append("")
            continue
        out.append("" if in_fence else re.sub(r"`[^`]*`", "", line))
    return out


def iter_md(root: str, rel_dir: str):
    base = os.path.join(root, rel_dir)
    if not os.path.isdir(base):
        return
    for dirpath, dirnames, filenames in os.walk(base):
        # never descend into dependency / build noise
        dirnames[:] = [d for d in dirnames if d not in {"node_modules", ".git", "venv", "__pycache__"}]
        for fn in filenames:
            if fn.endswith(".md"):
                yield os.path.join(dirpath, fn)


def slug_variants(filename: str) -> set[str]:
    """All identifiers a wikilink might use to refer to this file."""
    stem = os.path.basename(filename)[:-3]  # drop .md
    out = {stem, stem.lower()}
    for p in PREFIXES:
        if stem.startswith(p):
            short = stem[len(p):]
            out.add(short)
            out.add(short.lower())
    return out


def build_target_index(root: str) -> set[str]:
    targets: set[str] = set()
    for rel in TARGET_DIRS:
        for path in iter_md(root, rel):
            targets |= slug_variants(path)
            # also honour an explicit frontmatter name: slug
            try:
                head = open(path, "r", encoding="utf-8", errors="ignore").read(1500)
            except OSError:
                continue
            m = NAME_FM_RE.search(head)
            if m:
                targets.add(m.group(1).strip())
                targets.add(m.group(1).strip().lower())
    for rf in TARGET_ROOT_FILES:
        if os.path.isfile(os.path.join(root, rf)):
            targets.add(rf[:-3])           # CLAUDE
            targets.add(rf[:-3].lower())
    return targets


def normalize_target(raw: str) -> str:
    t = raw.strip()
    if "|" in t:            # [[target|Display alias]]
        t = t.split("|", 1)[0].strip()
    if "::" in t:           # [[edge-type::target]]
        t = t.split("::")[-1].strip()
    return t


def is_hard_ref(raw: str) -> bool:
    """Only path-style links promise a filesystem location and MUST resolve.
    Every slug link — bare, typed, aliased, or node-prefixed — is an Obsidian
    forward-link that may point at a not-yet-created note, which the CLAUDE.md
    edge convention explicitly allows. Flagging those is crying wolf, so the
    orphan check is scoped to unambiguous path breaks; the rest are by design."""
    t = normalize_target(raw)
    return "/" in t or t.startswith(".")


def resolve(target: str, source_file: str, root: str, target_index: set[str]) -> bool:
    t = normalize_target(target)
    if not t:
        return True  # empty/anchor-only, ignore
    # path-style link → resolve on disk (relative to the file, then to root)
    if "/" in t or t.startswith("."):
        cand = t if t.endswith(".md") else t + ".md"
        here = os.path.normpath(os.path.join(os.path.dirname(source_file), cand))
        there = os.path.normpath(os.path.join(root, cand.lstrip("./")))
        if os.path.isfile(here) or os.path.isfile(there):
            return True
        # bare path may point at a non-.md file (a script, a dir) — accept any match
        raw = os.path.normpath(os.path.join(os.path.dirname(source_file), t))
        return os.path.exists(raw) or bool(glob.glob(raw + ".*"))
    # slug-style link → check the known-target index
    stem = t[:-3] if t.endswith(".md") else t
    if stem in target_index or stem.lower() in target_index:
        return True
    for p in PREFIXES:
        if stem.startswith(p) and stem[len(p):] in target_index:
            return True
    return False


def check(root: str, stale_days: int) -> dict:
    target_index = build_target_index(root)
    orphans, stale, weak = [], [], []
    now = time.time()
    cutoff = stale_days * 86400

    scan_files = []
    for rel in SCAN_DIRS:
        scan_files += list(iter_md(root, rel))
    for rf in SCAN_ROOT_FILES:
        p = os.path.join(root, rf)
        if os.path.isfile(p):
            scan_files.append(p)

    for path in scan_files:
        try:
            text = open(path, "r", encoding="utf-8", errors="ignore").read()
        except OSError:
            continue
        rel = os.path.relpath(path, root)

        for lineno, line in enumerate(strip_code_keep_lines(text), 1):
            for m in WIKILINK_RE.finditer(line):
                target = m.group(1)
                if PLACEHOLDER_RE.search(normalize_target(target)):
                    continue
                if not is_hard_ref(target):
                    continue  # soft concept/tag forward-link — dangling allowed (edge convention)
                if not resolve(target, path, root, target_index):
                    orphans.append({"file": rel, "line": lineno, "link": f"[[{target}]]"})

        # staleness — only operational memory + knowledge wikis
        if rel.startswith("memory/") or "/wiki/" in rel.replace(os.sep, "/"):
            age = now - os.path.getmtime(path)
            if age > cutoff:
                stale.append({"file": rel, "days": int(age // 86400)})

        # provenance — only inside a knowledge-base wiki
        norm = rel.replace(os.sep, "/")
        if norm.startswith("knowledge/") and "/wiki/" in norm:
            if CLAIM_RE.search(text) and not URL_OR_SOURCE_RE.search(text):
                weak.append({"file": rel})

    return {
        "scanned": len(scan_files),
        "targets_indexed": len(target_index),
        "orphan_links": orphans,
        "stale_entries": sorted(stale, key=lambda x: -x["days"]),
        "weak_provenance": weak,
    }


def human(report: dict, stale_days: int) -> str:
    o, s, w = report["orphan_links"], report["stale_entries"], report["weak_provenance"]
    L = []
    L.append("JARVIS Knowledge Integrity Check")
    L.append("=" * 34)
    L.append(f"Scanned {report['scanned']} files · {report['targets_indexed']} link targets indexed\n")

    L.append(f"1. Orphaned wikilinks ........ {len(o)}")
    for it in o[:40]:
        L.append(f"     {it['file']}:{it['line']}  ->  {it['link']}")
    if len(o) > 40:
        L.append(f"     ... and {len(o) - 40} more")

    L.append(f"\n2. Stale entries (>{stale_days}d) ...... {len(s)}")
    for it in s[:20]:
        L.append(f"     {it['file']}  ({it['days']}d)")

    L.append(f"\n3. Weak provenance (KB wikis) . {len(w)}")
    for it in w[:20]:
        L.append(f"     {it['file']}")

    total = len(o) + len(s) + len(w)
    L.append("\n" + ("CLEAN — nothing to fix." if total == 0 else f"{total} item(s) to review."))
    L.append("(Contradiction detection is the LLM pass — run skills/knowledge-integrity.md.)")
    return "\n".join(L)


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--root", default=os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
    ap.add_argument("--json", action="store_true")
    ap.add_argument("--stale-days", type=int, default=STALE_DAYS_DEFAULT)
    args = ap.parse_args()

    report = check(args.root, args.stale_days)
    if args.json:
        print(json.dumps(report, indent=2))
    else:
        print(human(report, args.stale_days))

    issues = len(report["orphan_links"]) + len(report["stale_entries"]) + len(report["weak_provenance"])
    return 2 if issues else 0


if __name__ == "__main__":
    sys.exit(main())
