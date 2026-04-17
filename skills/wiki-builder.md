# Wiki Builder

**Trigger**: "build the wiki", "compile the wiki", "update the wiki", "rebuild the graph"

**Goal**: Scan all JARVIS knowledge files, compile an Obsidian-compatible wiki at `~/jarvis/wiki/`, and generate `graph.json` for the Helm Universe 3D visualization.

---

## What It Does

Reads every knowledge source in JARVIS — memory files, projects, skills, agents, team files, relationships — and compiles them into:

1. **`~/jarvis/wiki/`** — Obsidian vault with cross-linked markdown articles and an INDEX.md
2. **`~/jarvis/wiki/graph.json`** — Node/link graph data consumed by Helm's Universe tab

## Sources Scanned

| Source | Location | Node Type |
|--------|----------|-----------|
| Identity & memory | `memory/*.md` | memory (L0–L3) |
| Projects | `projects/*/README.md` + `projects/*.md` | project |
| Skills | `skills/*.md` | skill |
| Agents | `.claude/agents/*.md` | agent |
| People | extracted from `memory/relationships.md` | person |
| Team | `team/*.md` | team |

## Running It

```bash
python3 ~/jarvis/skills/wiki-builder.py
```

Output in ~5 seconds. No dependencies beyond Python 3 stdlib.

## After Running

1. Point Obsidian at `~/jarvis/wiki/` to browse the vault
2. Open Helm → **Universe** tab → click **Load Graph** to see the 3D visualization
3. Every node links back to its source file — click any node in Helm to open it in Obsidian

## Rebuilding

Run anytime JARVIS adds new memory, projects, or skills. The graph overwrites cleanly — no stale data.

---

## Rules

- **Never** delete `~/jarvis/wiki/` manually — it's generated. Safe to rebuild at any time.
- Output is idempotent — running twice produces the same result.
- The `graph.json` is consumed directly by Helm — do not edit it manually.
