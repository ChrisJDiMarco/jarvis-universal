# Skill: second-brain-level-audit

## Trigger
"second brain audit", "memory level audit", "retrieval ladder", "audit retrieval", "should this be semantic search", "should this be a knowledge graph", "is JARVIS memory too complicated", "what level should this knowledge live at"

## Goal
Choose the lowest JARVIS retrieval layer that solves the observed pain, then recommend additive improvements without changing runtime behavior.

## Retrieval Ladder

Use this order before adding complexity:

1. **L1 router** - exact file/path lookup through `CLAUDE.md`, `AGENTS.md`, and routing docs.
2. **L2 wiki/markdown** - topic files, indexes, backlinks, and atomic notes.
3. **L3 semantic search** - embeddings/vector search for large corpora where wording varies.
4. **L4-lite graph** - typed wikilinks or extracted entities when relationship chains matter.
5. **L5 always-on brain** - scheduled/live sync. Use only with explicit operator approval.

## Process

1. Run the deterministic read-only audit:
   ```bash
   python3 scripts/second-brain-level-audit.py
   ```
2. Read the report by corpus. Treat yellow findings as candidates, not mandates.
3. Ask what retrieval pain actually happened:
   - exact file not found -> strengthen routing or indexes
   - topic spread across many notes -> wiki/atomic notes
   - same meaning, different wording -> semantic search
   - entity chain question -> typed wikilinks or graph extraction
   - volatile external data -> live connector lookup, not memory ingestion
4. Recommend the smallest additive fix. Prefer docs/indexing before embeddings, embeddings before graph extraction, graph extraction before always-on sync.
5. If actioning changes, keep them reversible: new docs, new scripts, new indexes, or generated reports. Do not rewrite canonical memory in bulk.

## Guardrails

- Never enable autonomous ingestion from Slack, Gmail, calendar, browser, or customer data from this skill.
- Never vectorize secrets, raw client transcripts, or private credentials.
- Do not replace markdown truth with vector search. Semantic search is a retrieval aid, not authority.
- If no retrieval pain exists, say so and stop. Complexity that does not solve a pain is drag.

## References

- `scripts/second-brain-level-audit.py`
- `references/memory-protocol.md`
- `skills/knowledge-integrity.md`
- `skills/wiki-builder.md`

## Related
[[related-to::memory-management]]  [[related-to::knowledge-integrity]]  [[supports::CLAUDE]]
