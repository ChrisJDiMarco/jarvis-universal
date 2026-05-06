---
title: "Decisions Index"
type: index
layer: L2
tags: [decisions, atomic, infinite-brain]
created: 2026-05-05
---

# memory/decisions/ — Atomic Decision Nodes

> **Purpose**: One file per decision, atomic and individually queryable. Replaces (going forward) the journal-style append-to-`memory/decisions.md` pattern.

## Why atomic

The themed `memory/decisions.md` was a single file with all decisions appended. That works at small scale but degrades the moment you want to ask "why did we kill the free tier?" — the AI has to read the whole journal instead of one node + its edges.

Atomic per-decision files give:
- Direct semantic-search retrieval ("decisions/2026-05-04-no-free-tier.md" returns just the one node)
- Typed edges between decisions (this decision *contradicts* that earlier one, this *depends-on* a hypothesis, etc.)
- Per-decision frontmatter (status: active / superseded / revisited)
- Smaller token cost per query — the 9k → 600 win from the Infinite Brain pattern

## File naming

```
YYYY-MM-DD-slug.md
```

Example: `2026-05-04-no-free-tier.md`

Use the actual date the decision was made. If a decision is revisited, create a new file with the new date and link `[[supersedes::YYYY-MM-DD-original-slug]]`.

## Frontmatter template

```yaml
---
title: "[Decision title]"
type: decision
layer: L2
tags: [domain1, domain2]
status: [active | superseded | revisited]
made: YYYY-MM-DD
revisit: YYYY-MM-DD or "when X happens"
supersedes: [optional - prior decision slug]
---
```

## Body template

```markdown
> **Summary**: [One-sentence essence — what was decided and why, in one breath]

## Decision
[What was chosen]

## Alternatives considered
- [Option A] — rejected because [...]
- [Option B] — rejected because [...]

## Rationale
[Why this choice — the actual reasoning, not just the outcome]

## Expected outcome
[What success looks like, measurably if possible]

## Revisit when
[Specific signal/date that would warrant revisiting]

---

## Related
[[supports::concept-or-pillar]]  [[depends-on::another-decision]]  [[derived-from::source-event]]
```

## Backwards compatibility

The canonical `memory/decisions.md` still exists and is still valid as a fallback. Existing entries in it are NOT being migrated — Infinite Brain principle is "adopt going forward," not "rewrite history."

For new decisions, prefer this atomic pattern. If a decision is too small to warrant its own file (< 5 lines), append it to `memory/decisions.md` as before.

## Promotion from raw/

Decisions often start as `memory/raw/YYYY-MM-DD-decision-draft.md` while still being thought through. When the decision is final:
1. Copy to `memory/decisions/YYYY-MM-DD-slug.md`
2. Update the raw file's frontmatter: `status: promoted`
3. Cross-link: in the new decision file, add `[[derived-from::raw/YYYY-MM-DD-decision-draft]]`

---

## Index

*(Atomic decision files will be listed here as they're created. Update by hand or via the wiki-builder skill.)*

| Date | Title | Status | Tags |
|------|-------|--------|------|
| *(none yet — first one to come)* | | | |

---

## Related
[[part-of::../MEMORY]]  [[supersedes::../decisions.md]]  [[depends-on::../../wiki/INDEX]]
