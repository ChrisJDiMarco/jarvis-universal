# Memory Protocol — Reference Detail

> Externalized from CLAUDE.md (2026-06-18). The operational core (Memory Stack, On Session Start/End, Before Compression, the caps table) stays in CLAUDE.md because it shapes behavior every session. This file holds the reference material consulted only when you're actively editing the memory graph: the typed-wikilink edge taxonomy, the raw-staging workflow, and the wiki refresh cadence.

## Edge Convention (Typed Wikilinks)

> Borrowed from the "Infinite Brain" graph methodology.

Standard `[[wikilinks]]` are untyped — the AI sees a link but not the *nature* of the relationship. Type them inline so the semantic-search re-indexer and any future graph-walker can reason about them.

Convention:
```
[[<edge-type>::<target>]]
```

Edge types (10 — match Infinite Brain spec):

| Edge | Meaning | Example |
|------|---------|---------|
| `supports` | This argument/decision reinforces the target | `[[supports::no-free-tier]]` |
| `contradicts` | This argument disagrees with the target | `[[contradicts::team-tier-question]]` |
| `depends-on` | For this to be true, target must be true | `[[depends-on::stripe-pricing]]` |
| `derived-from` | This was created based on the target | `[[derived-from::kyle-call-2026-04-14]]` |
| `related-to` | Loose association, no stronger label fits | `[[related-to::competitive-positioning]]` |
| `part-of` | This is a sub-component of the target | `[[part-of::infinite-brain-methodology]]` |
| `preceded-by` | This happens after the target in a sequence | `[[preceded-by::step-2]]` |
| `followed-by` | This happens before the target in a sequence | `[[followed-by::step-4]]` |
| `authored` | Who/what created this | `[[authored::claude-opus-4-8]]` |
| `tagged` | Generic categorization | `[[tagged::pricing]]` |

Untyped `[[wikilinks]]` are still valid (treated as `related-to`). Adopt typing on new entries; don't bulk-rewrite history.

## Retrieval Ladder

Use the lowest retrieval layer that solves the observed pain. A corpus can sit at different levels than the rest of JARVIS; do not promote the whole system just because one folder needs more retrieval power.

| Level | Use when | JARVIS pattern |
|-------|----------|----------------|
| L1 router | exact file/path lookup is enough | `CLAUDE.md`, `AGENTS.md`, routing docs |
| L2 wiki/markdown | topics span multiple notes but full-file context matters | `memory/*.md`, `memory/decisions/`, `wiki/`, `knowledge/*/wiki/` |
| L3 semantic search | wording varies and the corpus is too large for exact search | selected indexes with embeddings; search aid only |
| L4-lite graph | relationship chains matter more than whole-note summaries | typed wikilinks and generated graph views |
| L5 always-on brain | live data must refresh without prompting | scheduled tasks/live connectors, only with explicit approval |

Run `python3 scripts/second-brain-level-audit.py` before adding semantic search, graph extraction, or always-on ingestion. If the report finds no retrieval pain, keep the boring markdown path.

## Raw Staging Workflow

`memory/raw/` is the drop-zone for half-formed material — clippings, mid-conversation thoughts, draft decisions, hypotheses you're testing. See `memory/raw/README.md` for naming and promotion conventions.

**Promote → canonical** when an entry has earned a permanent slot. **Delete** when an entry is wrong, stale, or no longer relevant. Raw is cheap; don't archive what you'd rather forget.

## Wiki Refresh

The `wiki/` snapshot is rebuilt by the `wiki-builder` skill. Last auto-compile timestamp is in `wiki/INDEX.md`. If the timestamp is >30 days old, run `wiki-builder` to refresh — stale wiki entries cause semantic search to return outdated context.

## Reachability (the third collector)

Memory hygiene runs three collectors with three definitions of garbage — keep all three: **caps** (size/bloat → `check-memory-caps.sh`), **staleness** (age → `check-staleness.sh`), and **reachability** (orphans nothing live links to → `reachability-gc.py`). Full rationale and how-to: `references/rules/memory-reachability.md`. Run reachability as a consolidation pass (weekly, via memory-janitor), not per-edit.
