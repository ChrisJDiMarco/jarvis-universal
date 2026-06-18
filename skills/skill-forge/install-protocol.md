# Install Protocol — Phase 6

**Goal**: Move the validated skill into `~/jarvis/skills/[name]/`, register it in CLAUDE.md, optionally write a wiki entry and memory pointer.

**Gate**: 🚧 Gate 3 — operator's final approval before install.

---

## Step 1 — Show the Final Draft (Gate 3)

Before any file move, show the operator:

```
QA pass complete. Final draft: ~/jarvis/owners-inbox/skill-forge/[slug]-[date]/draft/

What was caught and fixed:
- [N] trigger fidelity fixes
- [N] completeness gaps closed
- [N] format compliance items addressed
(Full QA report: owners-inbox/skill-forge/[slug]-[date]/qa-report.md)

Final SKILL.md:
[paste first 80 lines or so for quick review — frontmatter description + goal + when-to-trigger + first phase summary]

If this looks good, I'll install it to ~/jarvis/skills/[skill-name]/ and add it to
your CLAUDE.md skills index. If anything's off, tell me what to revise.
```

🚧 **GATE 3**: Wait for explicit "yes, install it" / "looks good, ship it" / equivalent. Pushback → revise; do not skip the gate.

---

## Step 2 — Move the Skill into Place

Use `mcp__workspace__bash`:

```bash
mv ~/jarvis/owners-inbox/skill-forge/[slug]-[date]/draft \
   ~/jarvis/skills/[skill-name]
```

Sandbox path mapping:

```bash
mv /sessions/.../mnt/jarvis/owners-inbox/skill-forge/[slug]-[date]/draft \
   /sessions/.../mnt/jarvis/skills/[skill-name]
```

Verify:

```bash
ls -la ~/jarvis/skills/[skill-name]/
cat ~/jarvis/skills/[skill-name]/SKILL.md | head -10
```

Confirm SKILL.md is at the root of the skill folder, frontmatter is intact, sub-files (if any) are present.

---

## Step 3 — Register in CLAUDE.md Active Skills Index

The Active Skills Index is in `~/jarvis/CLAUDE.md` under `### Active Skills Index`. Use `Edit` tool — surgical insertion, don't rewrite the table.

New row format (match existing table style):

```markdown
| [skill-name] | "[trigger phrase 1]", "[trigger phrase 2]", "[trigger phrase 3]" | [What it does in one sentence] |
```

Insertion order: alphabetical preferred, but trailing additions are also acceptable since CLAUDE.md is read top-to-bottom.

**Edit pattern**:

```python
Edit(
  file_path="~/jarvis/CLAUDE.md",
  old_string="| existing-skill-near-alphabetical-position | ... | ... |",
  new_string="| existing-skill-near-alphabetical-position | ... | ... |\n| [skill-name] | \"trigger\" | description |"
)
```

Verify the edit landed in the right table (Active Skills Index, not the routing table or the ECC skills table).

---

## Step 4 — (Optional) Write Wiki Entry

If `~/jarvis/wiki/` exists and the JARVIS wiki-builder skill is in active use:

Create `~/jarvis/wiki/skill_[name].md`:

```markdown
---
name: skill_[name]
type: skill
created: [YYYY-MM-DD]
---

# [skill-name]

[One-paragraph description from the SKILL.md goal section]

## Triggers
- "[phrase 1]"
- "[phrase 2]"
- ...

## Path
~/jarvis/skills/[skill-name]/

## Related
[[part-of::jarvis-skill-system]]
[[derived-from::[skill-forge run on YYYY-MM-DD]]]
[[depends-on::[external-tools]]]
```

This makes the skill semantically findable via `mcp__claude-context__search_code` once the wiki is reindexed.

If wiki/ doesn't exist or the operator hasn't been maintaining it, skip this step.

---

## Step 5 — (Optional) Save a Memory Pointer

Save a `reference`-type memory using the platform's auto-memory system. This makes the skill discoverable to future sessions even before they read CLAUDE.md fully.

Memory file: write to `[memory directory]/reference_skill_[name].md`:

```markdown
---
name: skill_[name]
description: [skill-name] installed [YYYY-MM-DD] at ~/jarvis/skills/[name]/. Forged via skill-forge. Triggers on: "[phrase 1]", "[phrase 2]". [One line on what it does and when to invoke.]
type: reference
---

[skill-name] is a JARVIS skill at ~/jarvis/skills/[skill-name]/.

Forged on [YYYY-MM-DD] using skill-forge. Research workspace preserved at:
~/jarvis/owners-inbox/skill-forge/[slug]-[date]/

## Trigger phrases
- ...

## What it does
[2-3 sentences from the SKILL.md goal section]

## When to invoke
[When the skill is most useful — distilled from synthesis section 4]
```

Then add a one-line entry to `MEMORY.md`:

```markdown
- [skill_[name]](reference_skill_[name].md) — [skill-name] forged [date], path ~/jarvis/skills/[name]/, triggers on "[primary trigger]"
```

Skip if the operator hasn't asked to save this kind of pointer (they sometimes prefer the skill self-discovers via CLAUDE.md alone).

---

## Step 6 — Confirm Installation with Operator

Final message to operator:

```
[skill-name] is live.

📁 Path: ~/jarvis/skills/[skill-name]/
📋 Indexed in CLAUDE.md Active Skills Index
[🧠 Memory pointer saved] (if step 5 ran)
[📚 Wiki entry written] (if step 4 ran)

Try it out:
- Paste any of these phrases to invoke it: "[trigger 1]", "[trigger 2]"
- Or load it explicitly via the Skill tool

Research workspace preserved (7-day archive lifecycle):
~/jarvis/owners-inbox/skill-forge/[slug]-[date]/

If the skill misfires or under-triggers, run skill-forge again pointing at it:
"tune the [skill-name] skill — it's missing on [phrase]"
```

---

## Step 7 — (Optional) Run Description Optimization

skill-creator's `run_loop.py` can optimize the description for trigger reliability. This is **a separate follow-up step**, not part of the install — surface it to the operator:

```
Optional: I can run anthropic-skills:skill-creator's description optimizer on this.
It generates 20 mock prompts (mix of should-trigger / should-NOT-trigger), runs them
3x each, and proposes refinements to the description until trigger accuracy is
maximized. Takes ~10 minutes in the background. Want me to run it now or later?
```

If the operator says yes, hand off to skill-creator. If no, the install is complete as-is.

---

## Hard Rules

- **Never install without Gate 3 approval.** Even if QA passed cleanly, the operator owns the final call.
- **Never overwrite an existing skill.** If `~/jarvis/skills/[name]/` already exists, surface to operator: *"A skill at that path already exists — overwrite, append a `-v2` suffix, or rename?"*
- **Always verify the move landed.** `ls` after the `mv`. Sandbox path mismatches have eaten skills before.
- **CLAUDE.md edit must be surgical.** Use `Edit` tool with a unique anchor; never rewrite the whole index.
- **Workspace cleanup is automatic.** Don't manually delete `owners-inbox/skill-forge/[slug]-[date]/` — the cleanup-inbox script handles it on the standard 7-day cycle.

---

## Edge Cases

**Operator requests a different install path** (e.g., `~/jarvis/.claude/skills/` for project scope only):
Respect their call. Update CLAUDE.md path reference accordingly.

**Skill needs to be packaged as a `.skill` file for distribution**:
Run `python -m scripts.package_skill ~/jarvis/skills/[name]` from the anthropic-skills:skill-creator scripts directory. Output: `[name].skill` file the operator can share.

**Operator wants to test before committing to install**:
Skip Steps 2–6, leave the skill at `owners-inbox/skill-forge/[slug]-[date]/draft/`. They can manually invoke it via `Skill(skill: <draft path>)` for ad-hoc testing.

**CLAUDE.md edit fails because the table format has drifted**:
Surface the issue, propose: *"The Active Skills Index table has been edited since I last read it — let me re-read and try again."* Don't blindly retry.

---

## Related

[[part-of::skill-forge]]  [[preceded-by::qa-protocol]]  [[depends-on::CLAUDE.md]]  [[followed-by::skill-in-production-use]]
