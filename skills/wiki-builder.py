#!/usr/bin/env python3
"""
JARVIS Wiki Builder
Trigger: "build the wiki" or "compile the wiki"
Scans all JARVIS knowledge files → compiles Obsidian wiki + graph.json for graph explorers

Usage: python3 ~/jarvis/skills/wiki-builder.py
"""

import os
import re
import json
from pathlib import Path
from datetime import datetime

JARVIS_ROOT = Path(os.path.expanduser("~/jarvis"))
WIKI_ROOT   = JARVIS_ROOT / "wiki"
GRAPH_FILE  = WIKI_ROOT / "graph.json"

# ── Visual identity for each node type ────────────────────────────────────────
NODE_COLORS = {
    "memory_L0": "#ffffff",   # core identity — pure white star
    "memory_L1": "#c8c8ff",   # L1 critical facts — bright blue-white
    "memory_L2": "#8888cc",   # L2 domain context — medium purple
    "memory_L3": "#555588",   # L3 deep archive — dim violet
    "project":   "#4a9eff",   # projects — electric blue
    "skill":     "#4aff88",   # skills — bright green
    "agent":     "#ffd700",   # agents — gold
    "person":    "#ff6b8a",   # people — warm red-pink
    "team":      "#ff9944",   # team files — orange
}

NODE_SIZES = {
    "memory_L0": 28,
    "memory_L1": 16,
    "memory_L2": 10,
    "memory_L3":  7,
    "project":   10,
    "skill":      7,
    "agent":      7,
    "person":    13,
    "team":       9,
}

# ── Memory layer assignments ───────────────────────────────────────────────────
LAYER_MAP = {
    "core.md":             "L0",
    "L1-critical-facts.md": "L1",
    "context.md":          "L2",
    "decisions.md":        "L2",
    "learnings.md":        "L2",
    "relationships.md":    "L2",
    "soul.md":             "L2",
}
# Operator-specific memory files will default to L2 — add them here
# after you create them (e.g., your business name or project: "L2").

# ── Tag keyword detection ─────────────────────────────────────────────────────
# Add your own project/client/tool keywords here. These map substring matches
# in file content to canonical tag slugs used by the graph.
TAG_MAP = {
    "claude":       "claude",
    "n8n":          "n8n",
    "notion":       "notion",
    "slack":        "slack",
    "revenue":      "revenue",
    "content":      "content",
    "research":     "research",
    "memory":       "memory",
    "agent":        "agent",
    "workflow":     "workflow",
    "automation":   "automation",
    "firecrawl":    "firecrawl",
    "github":       "github",
    "openai":       "openai",
}


# ═══════════════════════════════════════════════════════════════════════════════
# PARSERS
# ═══════════════════════════════════════════════════════════════════════════════

def extract_h1(content, fallback=""):
    m = re.search(r"^#\s+(.+)$", content, re.MULTILINE)
    return m.group(1).strip() if m else fallback

def extract_wikilinks(content):
    return re.findall(r"\[\[([^\]|]+)(?:\|[^\]]*)?\]\]", content)

def extract_backtick_refs(content):
    return re.findall(r"`([a-z][a-zA-Z0-9_/.-]+\.md)`", content)

def extract_tags(content):
    tags = []
    lower = content.lower()
    for keyword, tag in TAG_MAP.items():
        if keyword in lower and tag not in tags:
            tags.append(tag)
    return tags[:8]

def get_excerpt(content, max_chars=220):
    text = re.sub(r"^---\n[\s\S]*?\n---\n?", "", content)  # strip frontmatter
    text = re.sub(r"^#{1,6}\s+.+$", "", text, flags=re.MULTILINE)
    text = re.sub(r"[*_`\[\]>|]", "", text)
    text = re.sub(r"\n+", " ", text).strip()
    return (text[:max_chars] + "…") if len(text) > max_chars else text

def make_node(node_id, label, node_type, subtype, path_obj, content="", layer=""):
    tags       = extract_tags(content)
    wikilinks  = extract_wikilinks(content)
    refs       = extract_backtick_refs(content)
    updated    = int(path_obj.stat().st_mtime * 1000) if path_obj.exists() else 0
    size       = path_obj.stat().st_size if path_obj.exists() else 0
    color      = NODE_COLORS.get(subtype, NODE_COLORS.get(node_type, "#aaaaaa"))
    node_size  = NODE_SIZES.get(subtype, NODE_SIZES.get(node_type, 6))

    return {
        "id":        node_id,
        "label":     label,
        "type":      node_type,
        "subtype":   subtype,
        "layer":     layer,
        "path":      str(path_obj),
        "filename":  path_obj.name,
        "tags":      tags,
        "excerpt":   get_excerpt(content),
        "updated":   updated,
        "size":      size,
        "wikilinks": wikilinks,
        "refs":      refs,
        "color":     color,
        "nodeSize":  node_size,
    }


# ═══════════════════════════════════════════════════════════════════════════════
# SCANNERS
# ═══════════════════════════════════════════════════════════════════════════════

def scan_memory():
    nodes = []
    mem_dir = JARVIS_ROOT / "memory"
    if not mem_dir.exists():
        return nodes
    for f in sorted(mem_dir.glob("*.md")):
        content  = f.read_text(encoding="utf-8", errors="ignore")
        layer    = LAYER_MAP.get(f.name, "L3")
        subtype  = f"memory_{layer}"
        label    = extract_h1(content, f.stem.replace("-", " ").title())
        node_id  = f"memory/{f.stem}"
        nodes.append(make_node(node_id, label, "memory", subtype, f, content, layer))
    return nodes


def scan_projects():
    nodes = []
    proj_dir = JARVIS_ROOT / "projects"
    if not proj_dir.exists():
        return nodes
    for item in sorted(proj_dir.iterdir()):
        if item.name.startswith(".") or item.suffix in (".zip", ".jsx", ".json", ".pdf"):
            continue
        if item.is_dir():
            readme  = item / "README.md"
            target  = readme if readme.exists() else item
            content = readme.read_text(encoding="utf-8", errors="ignore") if readme.exists() else ""
            label   = extract_h1(content, item.name.replace("-", " ").title())
            nodes.append(make_node(f"project/{item.name}", label, "project", "project", target, content))
        elif item.suffix == ".md":
            content = item.read_text(encoding="utf-8", errors="ignore")
            label   = extract_h1(content, item.stem.replace("-", " ").title())
            nodes.append(make_node(f"project/{item.stem}", label, "project", "project", item, content))
    return nodes


def scan_skills():
    nodes = []
    skills_dir = JARVIS_ROOT / "skills"
    if not skills_dir.exists():
        return nodes
    for f in sorted(skills_dir.glob("*.md")):
        if f.name in ("INDEX.md",):
            continue
        content = f.read_text(encoding="utf-8", errors="ignore")
        label   = extract_h1(content, f.stem.replace("-", " ").title())
        nodes.append(make_node(f"skill/{f.stem}", label, "skill", "skill", f, content))
    return nodes


def scan_agents():
    nodes = []
    agents_dir = JARVIS_ROOT / ".claude" / "agents"
    if not agents_dir.exists():
        return nodes
    for f in sorted(agents_dir.glob("*.md")):
        content = f.read_text(encoding="utf-8", errors="ignore")
        # Parse frontmatter for name + description
        fm = {}
        m  = re.match(r"^---\n([\s\S]*?)\n---", content)
        if m:
            for line in m.group(1).splitlines():
                parts = line.split(":", 1)
                if len(parts) == 2:
                    fm[parts[0].strip()] = parts[1].strip().strip('"')
        label   = fm.get("name", f.stem.replace("-", " ").title())
        excerpt = fm.get("description", "")[:220]
        node    = make_node(f"agent/{f.stem}", label, "agent", "agent", f, content)
        node["excerpt"] = excerpt
        nodes.append(node)
    return nodes


def scan_people():
    """Extract person nodes from memory/relationships.md."""
    nodes = []
    rel_file = JARVIS_ROOT / "memory" / "relationships.md"
    if not rel_file.exists():
        return nodes
    content = rel_file.read_text(encoding="utf-8", errors="ignore")
    people  = re.findall(r"^## (.+)$", content, re.MULTILINE)
    for person in people:
        pattern      = rf"## {re.escape(person)}\n([\s\S]*?)(?=\n## |\Z)"
        m            = re.search(pattern, content)
        person_text  = m.group(1) if m else ""
        person_id    = f"person/{person.lower().replace(' ', '-')}"
        node         = make_node(person_id, person, "person", "person", rel_file, person_text)
        node["size"] = len(person_text)
        nodes.append(node)
    return nodes


def scan_team():
    nodes = []
    team_dir = JARVIS_ROOT / "team"
    if not team_dir.exists():
        return nodes
    for f in sorted(team_dir.glob("*.md")):
        content = f.read_text(encoding="utf-8", errors="ignore")
        label   = extract_h1(content, f.stem.replace("-", " ").title())
        nodes.append(make_node(f"team/{f.stem}", label, "team", "team", f, content))
    return nodes


# ═══════════════════════════════════════════════════════════════════════════════
# LINK BUILDER
# ═══════════════════════════════════════════════════════════════════════════════

def build_links(all_nodes):
    links    = []
    seen     = set()
    node_ids = {n["id"] for n in all_nodes}

    # Stem / label lookup for fuzzy resolution
    stem_to_id = {}
    for n in all_nodes:
        stem = n["id"].split("/")[-1].lower()
        stem_to_id[stem]          = n["id"]
        stem_to_id[n["label"].lower().replace(" ", "-")] = n["id"]

    def add_link(src, tgt, link_type="reference", **extra):
        if src == tgt:
            return
        key = tuple(sorted([src, tgt]))
        if key in seen:
            return
        seen.add(key)
        links.append({"source": src, "target": tgt, "type": link_type, **extra})

    def resolve(ref, _src):
        r = ref.lower().replace(".md", "").replace(" ", "-")
        if r in node_ids:
            return r
        # Try prefixed
        for prefix in ("memory/", "project/", "skill/", "agent/", "person/", "team/"):
            c = prefix + r.split("/")[-1]
            if c in node_ids:
                return c
        # Stem lookup
        return stem_to_id.get(r.split("/")[-1])

    # Explicit reference links
    for node in all_nodes:
        src  = node["id"]
        refs = node.get("refs", []) + node.get("wikilinks", [])
        for ref in refs:
            tgt = resolve(ref, src)
            if tgt:
                add_link(src, tgt, "reference")

    # Memory layer backbone (L0 ↔ L1 ↔ L2)
    by_layer = {"L0": [], "L1": [], "L2": [], "L3": []}
    for n in all_nodes:
        if n.get("layer") in by_layer:
            by_layer[n["layer"]].append(n["id"])

    for l0 in by_layer["L0"]:
        for l1 in by_layer["L1"]:
            add_link(l0, l1, "layer")
    for l1 in by_layer["L1"]:
        for l2 in by_layer["L2"]:
            add_link(l1, l2, "layer")

    # Tag-based semantic gravity (shared tags → weak bond)
    tag_index: dict[str, list] = {}
    for n in all_nodes:
        for tag in n.get("tags", []):
            tag_index.setdefault(tag, []).append(n["id"])

    for tag, members in tag_index.items():
        if 2 <= len(members) <= 15:
            hub = members[0]
            for other in members[1:]:
                add_link(hub, other, "tag", tag=tag)

    return links


# ═══════════════════════════════════════════════════════════════════════════════
# WIKI WRITER
# ═══════════════════════════════════════════════════════════════════════════════

def write_wiki_articles(all_nodes):
    WIKI_ROOT.mkdir(parents=True, exist_ok=True)

    # Master index
    index = [f"# JARVIS Knowledge Wiki\n\n> Auto-compiled {datetime.now().strftime('%Y-%m-%d %H:%M')}\n\n"]
    for t in ("memory", "project", "skill", "agent", "person", "team"):
        group = [n for n in all_nodes if n["type"] == t]
        if not group:
            continue
        index.append(f"## {t.title()}s ({len(group)})\n\n")
        for n in sorted(group, key=lambda x: x["label"]):
            slug = n["id"].replace("/", "_")
            index.append(f"- [[{slug}|{n['label']}]]\n")
        index.append("\n")
    (WIKI_ROOT / "INDEX.md").write_text("".join(index), encoding="utf-8")

    # Individual articles
    for node in all_nodes:
        try:
            src = Path(node["path"])
            if not src.exists():
                continue
            raw     = src.read_text(encoding="utf-8", errors="ignore")
            slug    = node["id"].replace("/", "_")
            updated = datetime.fromtimestamp(node["updated"] / 1000).strftime("%Y-%m-%d")
            fm = (
                f"---\n"
                f"title: \"{node['label']}\"\n"
                f"type: {node['type']}\n"
                f"layer: {node.get('layer', '')}\n"
                f"tags: [{', '.join(node.get('tags', []))}]\n"
                f"source: {node['path']}\n"
                f"updated: {updated}\n"
                f"---\n\n"
            )
            (WIKI_ROOT / f"{slug}.md").write_text(fm + raw, encoding="utf-8")
        except Exception as e:
            print(f"  ⚠  Skipped {node['id']}: {e}")


# ═══════════════════════════════════════════════════════════════════════════════
# MAIN
# ═══════════════════════════════════════════════════════════════════════════════

def main():
    print("🧠 JARVIS Wiki Builder")
    print(f"   Root  : {JARVIS_ROOT}")
    print(f"   Output: {WIKI_ROOT}\n")

    WIKI_ROOT.mkdir(parents=True, exist_ok=True)

    all_nodes = []
    scanners = [
        ("memory files",  scan_memory),
        ("projects",      scan_projects),
        ("skills",        scan_skills),
        ("agents",        scan_agents),
        ("people",        scan_people),
        ("team files",    scan_team),
    ]
    for label, scanner in scanners:
        print(f"📁 Scanning {label}…", end=" ", flush=True)
        nodes = scanner()
        all_nodes.extend(nodes)
        print(f"{len(nodes)} nodes")

    print(f"\n🔗 Building links…", end=" ", flush=True)
    links = build_links(all_nodes)
    print(f"{len(links)} connections")

    print("📝 Writing wiki articles…", end=" ", flush=True)
    write_wiki_articles(all_nodes)
    print("done")

    print("💾 Writing graph.json…", end=" ", flush=True)
    graph = {
        "nodes": all_nodes,
        "links": links,
        "meta": {
            "generated":  datetime.now().isoformat(),
            "nodeCount":  len(all_nodes),
            "linkCount":  len(links),
            "jarvisPath": str(JARVIS_ROOT),
            "wikiPath":   str(WIKI_ROOT),
        },
    }
    GRAPH_FILE.write_text(json.dumps(graph, indent=2, default=str), encoding="utf-8")
    print("done")

    print(f"\n✅  {len(all_nodes)} nodes · {len(links)} links")
    print(f"    Wiki  → {WIKI_ROOT}")
    print(f"    Graph → {GRAPH_FILE}")
    print(f"\n    Open Obsidian at: {WIKI_ROOT}")
    print(f"    Or load {GRAPH_FILE.name} in any 3D graph viewer")


if __name__ == "__main__":
    main()
