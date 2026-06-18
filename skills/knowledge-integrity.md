# Skill: knowledge-integrity

**Trigger**: "knowledge health check", "audit my memory", "check the wiki", "integrity check", "find contradictions in my notes", "what's rotting in my knowledge base", monthly scheduled run.

**Goal**: Keep the JARVIS knowledge corpus (`memory/`, `wiki/`, `knowledge/`) trustworthy — catch the silent rot that semantic search can't see, before a small error compounds into a confidently-wrong answer.

> Adapted from the Karpathy knowledge-base health check (Systems Made Better, 2026-05-31). The deterministic 80% is a script; the judgement 20% (contradictions, new-article ideas) is the LLM pass. Boring-is-beautiful: run the script first, reason over its output second.

---

## Process — two phases (mirror the video)

### Phase 1 — Audit + report (read-only, never edits)

1. **Run the deterministic pass:**
   ```bash
   python3 scripts/integrity-check.py --json
   ```
   This returns orphaned/broken `[[wikilinks]]`, stale entries (>90d), and weak-provenance KB articles. Exit 2 = issues found.

2. **Read `assets/writing-rules.md`** before writing the report (no AI-tell prose).

3. **Run the LLM passes the script can't** — read the flagged files plus the corpus and check:
   - **Contradictions** — claims in two files that disagree (e.g. two different numbers for the same metric, two opposite decisions).
   - **Attribution drift** — a claim whose cited source doesn't actually support it.
   - **Coverage gaps** — material sitting in `raw/` / `team-inbox/` that was never ingested into a wiki.
   - **Suggested connections** — typed-wikilink edges that *should* exist between related notes but don't.
   - **Suggested new articles** — topics the corpus circles but never names directly (usually the highest-value output).

4. **Write the report** to `owners-inbox/knowledge-health-YYYY-MM-DD.md` using the template below. Present it as a clickable page when run interactively.

### Phase 2 — Action (only when asked)

- Interactive: use `AskUserQuestion` to let the operator pick which findings to action (fix links, ingest raw, draft new articles, merge contradictions).
- Automated/confident mode: *"do the work, report, and action"* — apply writing-rule fixes, ingest pending raw, draft the new articles, update INDEX + CHANGELOG. Log everything.
- After actioning, re-run `integrity-check.py` to confirm the issue count dropped.

---

## The seven checks

1. Contradictions / inconsistent data between files
2. Broken `[[wikilinks]]` and orphaned references — *(script)*
3. Source provenance — claims not backed by a source — *(script flags KB wikis; LLM checks drift)*
4. Coverage — un-ingested `raw/` material
5. Stale articles — >90d and no longer relevant — *(script)*
6. Suggested connections not yet drawn
7. Suggested new article candidates

## Report template

```
# Knowledge Health Check — YYYY-MM-DD
Verdict: [clean / minor / needs attention]

## Fixed-by-script (deterministic)
- Orphaned links: N   · Stale: N   · Weak provenance: N

## Contradictions
- [file A] vs [file B]: ...

## Coverage gaps (un-ingested raw)
- ...

## Suggested new articles  ← usually the real value
- ...

## Action menu (Phase 2)
- [ ] ...
```

## Guardrails

- Phase 1 **never edits** — audit and report only.
- Costs credits (LLM pass over the corpus). Schedule **monthly**, not daily; stagger multiple KBs across different days.
- Fixing the flagged `wiki/INDEX.md` orphans is often just *re-run `wiki-builder`* — don't hand-patch what a rebuild regenerates.

## References
- `scripts/integrity-check.py` — the deterministic pass
- `assets/writing-rules.md` — read before writing the report
- `skills/wiki-builder` — regenerates wiki nodes/INDEX
- `skills/consolidate-memory` (anthropic-skills) — companion: dedupe + prune the memory index

## Related
[[depends-on::../scripts/integrity-check]]  [[depends-on::../assets/writing-rules]]  [[related-to::four-cs-audit]]  [[related-to::monthly-retrospective]]
