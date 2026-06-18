# Memory Reachability — The Third Collector

## The discipline

Garbage in the memory store is **unreachable** data — a node that nothing live can lead you to, so it can no longer influence a future decision. It is *not* defined by age and *not* by size. Collect memory by reachability, not by how old or how large it is.

## Why

JARVIS already runs two collectors, and both use the wrong definition of garbage:

- `scripts/check-memory-caps.sh` collects by **size** (per-file char caps)
- `scripts/check-staleness.sh` collects by **age** (flags "CURRENT" claims >14d, integrity flags >90d)

Borrowed from mark-and-sweep garbage collection (and its biological twin, the glymphatic system that clears the brain during slow-wave sleep): the functional definition of waste is *inability to affect the future*. A six-month-old fact still load-bearing for an active project is live; a note written yesterday that nothing points to is garbage. Age and size miss both cases.

The gap this fills: JARVIS had the **pointer graph** all along — the typed `[[edge::target]]` wikilink convention — but never traced reachability over it. `scripts/reachability-gc.py` does the trace.

## Three collectors, three failure modes — keep all three

| Collector | Script | Catches | Definition |
|-----------|--------|---------|------------|
| Caps | `check-memory-caps.sh` | Bloat | Size |
| Staleness / integrity | `check-staleness.sh`, `integrity-check.py` | **Leaks** — reachable but dead (a stale fact still linked from somewhere) | Age + provenance |
| **Reachability** | `reachability-gc.py` | **Orphans** — captured but never wired in | Unreachability |

Orphans and leaks are *different* failures and need *different* collectors. A leak is still reachable, so a reachability trace will never free it — that's staleness's job. An orphan isn't stale, so the age guard ignores it — that's reachability's job. Don't try to make one collector do the other's work.

## How it works

- **Roots** = the structural files CLAUDE.md's Memory Stack loads by name (`core.md`, `L1-critical-facts.md`, `context.md`, `decisions.md`, `learnings.md`, `relationships.md`, `soul.md`, `ai-intelligence.md`, `hot.md`). These are live independent of inbound links — that is exactly what a GC root is. Edit the `ROOT_FILES` set in the script if the structural layer changes.
- **Reachability** = a node is live if a live file reaches it by a `[[wikilink]]` (typed or untyped) **or** a concrete file-path / filename mention carrying `.md` (the way prose in `context.md` cites a decision file). Requiring the `.md` keeps path matches intentional, not accidental word collisions.
- **Generational framing**: structural files are the *tenured* generation (roots, effectively never collected). Atomic nodes in `decisions/`, `connections/`, `raw/` are the *young* generation — they must earn reachability through edges. Most captures die young; that's expected.
- **Report-only. It never edits or deletes.** Output is a dated report in `owners-inbox/` and a stdout summary. The operator decides per candidate: **promote** (add a link from a live file), **archive**, or **delete**.

## How to run

```bash
python3 scripts/reachability-gc.py                 # human summary to stdout
python3 scripts/reachability-gc.py --write-report  # + dated owners-inbox/ md
python3 scripts/reachability-gc.py --json          # machine-readable
python3 scripts/reachability-gc.py --quiet         # exit code only
```

Exit codes: `0` all reachable, `2` orphans found, `1` error. Run weekly as **step 4 of the `memory-janitor` task** (Sun 3am), which folds reachability into the unified memory-hygiene report alongside caps and staleness and relays a one-line summary by iMessage. (A standalone `memory-reachability-sweep` task was created first, then disabled as redundant.)

## What to do with an orphan

A flagged node is a question, not a verdict. Three honest answers:

1. **It matters** → it shouldn't be an orphan. Add a `[[wikilink]]` or path reference from a live file (often the relevant `INDEX.md` or structural file). This is the most common fix and it strengthens the graph.
2. **It mattered once** → archive it (move out of `memory/`), or let it stay if it's cheap.
3. **It never mattered** → delete it. Raw, unpromoted, unreferenced captures are exactly what `memory/raw/`'s "promote or delete" rule is about.

## Apply when

- Running the weekly memory hygiene pass
- After a burst of atomic-node creation (decisions, connections, raw captures) — check they got wired in
- Before trusting edge-walking or semantic recall to surface "everything about X" — orphans are invisible to graph traversal

## Don't apply when

- You only care about bloat (use caps) or stale claims (use staleness) — those are the other two collectors
- Mid-task — this is a consolidation pass, not a per-edit check. Like the sleep cycle it's modeled on, run it as a dedicated sweep, not interleaved with active work.

## The frontier (not built yet)

Today this is a **stop-the-world** batch — a scheduled sweep that traces the whole graph at once. The alternative is a **concurrent collector**: pay a small "write-barrier" tax on every memory write (update backlinks + a reachability marker as you go) so a full trace is never needed. The Stop hook's existing reindex-on-touch is already a partial write barrier. And the sweep can run *unihemispherically* — in a sub-agent over a snapshot while the orchestrator keeps serving — so the trace never blocks live work. Promote to one of those only if the weekly batch ever becomes a bottleneck.

## Related
[[boring-is-beautiful]] — a 50-line deterministic script, not an agent
[[poc-first]] — shipped report-only; earns the right to auto-act only after it proves itself
[[karpathy-agent-principles]] — Principle 2 (verify by running): tuned against the live graph, not by reasoning
[[memory-management]] — the broader memory protocol this slots into
