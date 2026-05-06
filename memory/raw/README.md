---
title: "Raw Staging Area"
type: convention
layer: meta
tags: [memory, staging, pipeline, raw, wiki]
created: 2026-05-05
---

# memory/raw/ — Staging Area

> **Purpose**: A lightweight drop-zone for ideas, clippings, half-formed thoughts, and inbound notes that aren't yet refined enough to live in the canonical themed memory files (`context.md`, `decisions.md`, `learnings.md`, etc.).

## Why this exists

The architecture diagram from the May 2026 "Infinite Brain" reference uses a `/raw → /wiki` pipeline: drop unprocessed material into `/raw`, then a refiner periodically promotes the keepers into the compiled knowledge base. JARVIS already has a `/wiki/` (the compiled atomic-entity layer auto-built by the `wiki-builder` skill) but had no formal `/raw` zone — material went straight into themed memory files or was lost in chat.

This directory closes that gap.

## How it differs from other zones

| Zone | What | Lifetime |
|------|------|----------|
| `team-inbox/` | **Files** the operator drops for JARVIS to process (CSVs, screenshots, docs) | Until processed, then archived |
| `owners-inbox/` | **Outputs** JARVIS produces for the operator to review | 7 days, then auto-archived |
| `memory/raw/` | **Ideas/notes/clippings** captured mid-conversation for later refinement | Until promoted to themed memory or deleted |
| `memory/[themed].md` | Refined, cap-managed canonical knowledge | Permanent, pruned when cap hit |
| `wiki/` | Auto-compiled atomic-entity snapshots (one .md per agent/skill/project/memory) | Rebuilt by wiki-builder skill |

## Conventions

### File naming
```
YYYY-MM-DD-slug.md
```
Example: `2026-05-05-infinite-brain-comparison.md`

### Frontmatter (recommended)
```
---
title: "[Short title]"
type: [decision-draft | hypothesis | concept | clipping | question | playbook-draft]
tags: [topic1, topic2]
captured: YYYY-MM-DD
status: [draft | promoted | discarded]
---
```

### Body
Keep atomic — 50-300 lines per file. If you need more, split into part-1, part-2.

Lead with a one-sentence summary so future-JARVIS spends ~50 tokens deciding whether to dive deeper:

```markdown
> **Summary**: [One-sentence essence of this note.]

[Body]
```

## Promotion workflow

When a `raw/` entry has earned its place in canonical memory:

1. Decide which themed file it belongs in (`decisions.md`, `learnings.md`, `context.md`, etc.)
2. Append to that file using the existing format conventions
3. Update the `raw/` file's frontmatter: `status: promoted`
4. Optionally move to `memory/raw/promoted/` to keep the working set clean

If a `raw/` entry is wrong, stale, or no longer relevant: delete it. Raw is *cheap*. Don't archive what you'd rather forget.

## When NOT to use raw/

- **For files the operator drops**: use `team-inbox/`
- **For outputs to deliver**: use `owners-inbox/`
- **For project-specific notes**: use `projects/[project-name]/notes/`
- **For final decisions you're confident in**: skip raw, write straight to `decisions.md`

Raw is for the messy middle: "I had this thought / saw this thing / am exploring this idea" that hasn't earned a permanent slot yet.

---

## Related
[[supports::../MEMORY]]  [[depends-on::../../wiki/INDEX]]  [[related-to::../../skills/memory-management]]
