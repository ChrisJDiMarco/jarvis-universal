#!/usr/bin/env python3
"""
reachability-gc.py — Mark-and-sweep garbage collection for JARVIS memory.

Treats the memory store as a managed-memory heap. A memory node is "live" only
if it is REACHABLE — by typed or untyped [[wikilinks]] — from the always-loaded
root set (the files CLAUDE.md loads by name). Atomic nodes that nothing live
points to are unreachable: captured once, never wired in, unable to influence a
future decision. Those are reported as collection candidates.

The point (borrowed from mark-and-sweep GC and the glymphatic system): garbage
is defined by UNREACHABILITY — inability to affect the future — not by age or
size. JARVIS already prunes by age (check-staleness.sh) and size (memory caps);
this fills the missing third collector.

REPORT-ONLY. This script never edits or deletes anything. The operator decides
what to promote (link it from a live file), archive, or drop.

Usage:
    python3 scripts/reachability-gc.py                 # human report to stdout
    python3 scripts/reachability-gc.py --write-report  # also write owners-inbox md
    python3 scripts/reachability-gc.py --json          # machine-readable
    python3 scripts/reachability-gc.py --quiet         # exit code only

Exit codes: 0 = no unreachable nodes, 2 = unreachable nodes found, 1 = error.
"""
from __future__ import annotations

import argparse
import json
import re
import subprocess
import sys
from datetime import datetime, timezone
from pathlib import Path

# --- Configuration -----------------------------------------------------------

# GC roots: files addressable directly by the system. CLAUDE.md's Memory Stack
# loads these by name, so they are live independent of inbound links — exactly
# what a "root" is in a tracing collector. Everything else must earn its
# reachability through the edge graph.
ROOT_FILES = {
    # L0 / L1 — always loaded every session
    "core.md", "L1-critical-facts.md",
    # L2 structural domain layers (the capped files in CLAUDE.md's Memory Stack)
    "context.md", "decisions.md", "learnings.md", "relationships.md",
    "soul.md", "ai-intelligence.md", "hot.md",
}

# Files that are documentation / navigation scaffolding, not memory nodes.
SKIP_NAME_SUBSTRINGS = ("readme",)
SKIP_DIRS = {"__pycache__"}

WIKILINK_RE = re.compile(r"\[\[([^\]]+)\]\]")


# --- Graph construction ------------------------------------------------------

def discover_nodes(mem_root: Path) -> list[Path]:
    """All markdown files under the memory root, minus scaffolding."""
    nodes = []
    for p in sorted(mem_root.rglob("*.md")):
        if any(part in SKIP_DIRS for part in p.parts):
            continue
        if any(s in p.name.lower() for s in SKIP_NAME_SUBSTRINGS):
            continue
        nodes.append(p)
    return nodes


def build_alias_map(mem_root: Path, nodes: list[Path]) -> dict[str, Path]:
    """Map lookup keys -> node. Each node is reachable by its relative path
    (no extension) and by its bare basename, both lowercased."""
    alias: dict[str, Path] = {}
    for n in nodes:
        rel = n.relative_to(mem_root).with_suffix("")
        rel_key = str(rel).lower()
        base_key = n.stem.lower()
        # full relpath wins on collision; basename only fills if unclaimed
        alias[rel_key] = n
        alias.setdefault(base_key, n)
    return alias


def candidate_keys(raw_target: str):
    """Yield lookup keys for a wikilink target, most specific first.
    Strips edge-type prefix, anchors, extension, and ../ path navigation."""
    t = raw_target.strip()
    if "::" in t:                       # drop typed-edge prefix: supports::core
        t = t.split("::", 1)[1]
    t = t.strip().split("#", 1)[0].strip().strip("/")
    if t.lower().endswith(".md"):
        t = t[:-3]
    parts = [p for p in t.split("/") if p not in ("", ".", "..")]
    if not parts:
        return
    yield "/".join(parts).lower()       # normalized relpath
    yield parts[-1].lower()             # basename


def parse_edges(node: Path, alias: dict[str, Path],
                mentions: list[tuple[str, Path]]):
    """Return (resolved_targets, unresolved_count) for one node.

    An edge is any concrete reference a reader could follow to another node:
      1. a [[wikilink]] (typed or untyped) that resolves, OR
      2. a literal filename-with-extension or relative-path mention in prose
         (e.g. `memory/decisions/2026-05-28-foo.md`). Requiring the `.md`
         keeps these matches intentional, not accidental word collisions.
    """
    try:
        text = node.read_text(encoding="utf-8", errors="ignore")
    except OSError:
        return set(), 0
    resolved, unresolved = set(), 0
    for m in WIKILINK_RE.findall(text):
        hit = None
        for key in candidate_keys(m):
            if key in alias:
                hit = alias[key]
                break
        if hit is not None and hit != node:
            resolved.add(hit)
        elif hit is None:
            unresolved += 1
    for key, tgt in mentions:               # concrete path/filename references
        if tgt != node and key in text:
            resolved.add(tgt)
    return resolved, unresolved


# --- Mark & sweep ------------------------------------------------------------

def mark(roots: list[Path], out_edges: dict[Path, set[Path]]) -> set[Path]:
    """BFS from roots following out-edges. Reachable = live."""
    seen = set(roots)
    stack = list(roots)
    while stack:
        cur = stack.pop()
        for tgt in out_edges.get(cur, ()):
            if tgt not in seen:
                seen.add(tgt)
                stack.append(tgt)
    return seen


# --- Metadata for the report -------------------------------------------------

def age_days(mem_root: Path, node: Path) -> int:
    """Days since the file was last touched (git commit date, else mtime)."""
    try:
        out = subprocess.run(
            ["git", "-C", str(mem_root), "log", "-1", "--format=%cI", "--",
             str(node.relative_to(mem_root))],
            capture_output=True, text=True, timeout=10,
        )
        iso = out.stdout.strip()
        if iso:
            dt = datetime.fromisoformat(iso)
            return (datetime.now(timezone.utc) - dt).days
    except (subprocess.SubprocessError, ValueError, OSError):
        pass
    mtime = datetime.fromtimestamp(node.stat().st_mtime, tz=timezone.utc)
    return (datetime.now(timezone.utc) - mtime).days


def collect(mem_root: Path):
    nodes = discover_nodes(mem_root)
    alias = build_alias_map(mem_root, nodes)
    # concrete path/filename references (must carry the .md to count)
    mentions = []
    for n in nodes:
        mentions.append((n.name, n))
        mentions.append((str(n.relative_to(mem_root)), n))

    out_edges: dict[Path, set[Path]] = {}
    in_degree: dict[Path, int] = {n: 0 for n in nodes}
    dangling = 0
    for n in nodes:
        resolved, unresolved = parse_edges(n, alias, mentions)
        out_edges[n] = resolved
        dangling += unresolved
        for tgt in resolved:
            in_degree[tgt] = in_degree.get(tgt, 0) + 1

    roots = [n for n in nodes if n.name in ROOT_FILES]
    reachable = mark(roots, out_edges)
    unreachable = [n for n in nodes if n not in reachable]

    return {
        "mem_root": mem_root,
        "nodes": nodes,
        "roots": roots,
        "reachable": reachable,
        "unreachable": unreachable,
        "out_edges": out_edges,
        "in_degree": in_degree,
        "dangling": dangling,
    }


# --- Rendering ---------------------------------------------------------------

def render_rows(r: dict):
    mem_root = r["mem_root"]
    rows = []
    for n in r["unreachable"]:
        rows.append({
            "path": str(n.relative_to(mem_root)),
            "age_days": age_days(mem_root, n),
            "size": n.stat().st_size,
            "in": r["in_degree"].get(n, 0),
            "out": len(r["out_edges"].get(n, ())),
        })
    rows.sort(key=lambda x: x["age_days"], reverse=True)
    return rows


def human_report(r: dict, rows: list[dict]) -> str:
    n_total = len(r["nodes"])
    n_reach = len(r["reachable"])
    n_un = len(r["unreachable"])
    pct = (100 * n_reach / n_total) if n_total else 100
    lines = []
    lines.append(f"Memory reachability sweep — {datetime.now():%Y-%m-%d %H:%M}")
    lines.append(f"  nodes: {n_total}   roots: {len(r['roots'])}   "
                 f"reachable: {n_reach} ({pct:.0f}%)   "
                 f"unreachable: {n_un}   dangling-links: {r['dangling']}")
    if not rows:
        lines.append("  ✓ Every node is reachable from the live root set.")
        return "\n".join(lines)
    lines.append("")
    lines.append("  Unreachable nodes (nothing live points to them) — "
                 "oldest first:")
    lines.append(f"  {'AGE':>5}  {'IN':>3} {'OUT':>3}  {'SIZE':>6}  PATH")
    for x in rows:
        lines.append(f"  {x['age_days']:>4}d  {x['in']:>3} {x['out']:>3}  "
                     f"{x['size']:>5}B  {x['path']}")
    return "\n".join(lines)


def markdown_report(r: dict, rows: list[dict]) -> str:
    n_total = len(r["nodes"])
    n_reach = len(r["reachable"])
    n_un = len(r["unreachable"])
    pct = (100 * n_reach / n_total) if n_total else 100
    md = []
    md.append(f"# Memory Reachability Sweep — {datetime.now():%Y-%m-%d}")
    md.append("")
    md.append("> Mark-and-sweep over `~/jarvis/memory/`. A node is **live** "
              "only if reachable — by `[[wikilink]]` or file-path reference — "
              "from the always-loaded root set. Unreachable = captured but "
              "never wired in. **Report-only — nothing was changed.**")
    md.append("")
    md.append(f"- **Nodes:** {n_total}")
    md.append(f"- **Roots:** {len(r['roots'])} (structural files loaded by name)")
    md.append(f"- **Reachable:** {n_reach} ({pct:.0f}%)")
    md.append(f"- **Unreachable:** {n_un}")
    md.append(f"- **Dangling links** (point to nothing — see integrity-check.py): "
              f"{r['dangling']}")
    md.append("")
    if not rows:
        md.append("✅ Every node is reachable from the live root set. "
                  "Nothing to collect.")
        return "\n".join(md)
    md.append("## Collection candidates")
    md.append("")
    md.append("Nothing live points to these. For each: **promote** (add a link "
              "from a live file), **archive**, or **delete**.")
    md.append("")
    md.append("| Age | In | Out | Size | Node |")
    md.append("|----:|---:|----:|-----:|------|")
    for x in rows:
        md.append(f"| {x['age_days']}d | {x['in']} | {x['out']} | "
                  f"{x['size']}B | `{x['path']}` |")
    md.append("")
    md.append("_In = inbound links, Out = outbound links. A node with Out>0 "
              "but In=0 is 'write-only' — it references the system but the "
              "system never references it back._")
    return "\n".join(md)


# --- Main --------------------------------------------------------------------

def main() -> int:
    ap = argparse.ArgumentParser(description=__doc__)
    ap.add_argument("--memory-dir", default=None,
                    help="Path to memory/ (default: ../memory relative to script)")
    ap.add_argument("--write-report", action="store_true",
                    help="Write a dated markdown report to owners-inbox/")
    ap.add_argument("--json", action="store_true", help="Emit JSON")
    ap.add_argument("--quiet", action="store_true", help="Exit code only")
    args = ap.parse_args()

    script_dir = Path(__file__).resolve().parent
    mem_root = Path(args.memory_dir).resolve() if args.memory_dir \
        else (script_dir.parent / "memory").resolve()
    if not mem_root.is_dir():
        print(f"error: memory dir not found: {mem_root}", file=sys.stderr)
        return 1

    r = collect(mem_root)
    rows = render_rows(r)

    if args.json:
        print(json.dumps({
            "nodes": len(r["nodes"]),
            "roots": len(r["roots"]),
            "reachable": len(r["reachable"]),
            "unreachable": len(r["unreachable"]),
            "dangling": r["dangling"],
            "candidates": rows,
        }, indent=2))
    elif not args.quiet:
        print(human_report(r, rows))

    if args.write_report:
        inbox = script_dir.parent / "owners-inbox"
        inbox.mkdir(exist_ok=True)
        out = inbox / f"memory-gc-report-{datetime.now():%Y-%m-%d}.md"
        out.write_text(markdown_report(r, rows), encoding="utf-8")
        if not args.quiet:
            print(f"\nReport written: {out}")

    return 2 if r["unreachable"] else 0


if __name__ == "__main__":
    sys.exit(main())
