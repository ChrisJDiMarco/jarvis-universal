# Search Plan: [skill-name]

**Date**: [YYYY-MM-DD]
**Source mix target**: web=N, anthropic-docs=N, github=N, local-skills=N
**Total queries**: NN (target 15–25)

---

## Dimension 1 — Core Domain
*Authoritative definitions, scope, mental models. Without this, the skill misuses terminology.*

| # | Query | Source | Rationale |
|---|-------|--------|-----------|
| 1 | "[query text]" | firecrawl_search | [why this query — what it surfaces] |
| 2 | "[query]" | firecrawl_search | [rationale] |
| 3 | "[query]" | WebFetch (docs.claude.com) | [rationale] |

## Dimension 2 — Best Practices
*How experts do this in production.*

| # | Query | Source | Rationale |
|---|-------|--------|-----------|
| 4 | "[query]" | firecrawl_search | [rationale] |
| ... |

## Dimension 3 — Failure Modes
*Anti-patterns, common mistakes, debugging horror stories. Becomes the Rules section.*

| # | Query | Source | Rationale |
|---|-------|--------|-----------|
| ... | "[query] anti-patterns" | firecrawl_search | [rationale] |
| ... | "[query] reddit" | firecrawl_search | Forum-flavored — unfiltered war stories |

## Dimension 4 — Tooling & Libraries
*Concrete tools the skill should reference by name.*

| # | Query | Source | Rationale |
|---|-------|--------|-----------|
| ... | "[X] vs [Y]" | firecrawl_search | Comparison surfaces tradeoffs |
| ... | "awesome-[topic]" | gh search repos | Curated list = curated tool surface |

## Dimension 5 — Adjacent / Competitive
*Alternatives, when this approach is the wrong fit.*

| # | Query | Source | Rationale |
|---|-------|--------|-----------|
| ... | "when not to use [X]" | firecrawl_search | Boundary — when the whole approach is wrong |
| ... | "[X] alternatives" | firecrawl_search | Surfaces design space |

---

## Self-Check
- [ ] All 5 dimensions have ≥ 2 queries
- [ ] Total is 15–25
- [ ] Each query has a one-line rationale
- [ ] Source allocation is sensible
- [ ] No duplicate queries or synonym variations
- [ ] Failure dimension has ≥ 1 forum-flavored query
- [ ] Tooling dimension names ≥ 2 specific candidate tools

## Notes
[Any caveats — e.g., "Domain is rapidly evolving, weighting toward 2026-bounded queries"]
