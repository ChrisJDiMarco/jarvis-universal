# Intake Protocol — Phase 0

**Goal**: Convert the operator's fuzzy ask into a written spec they confirm before research starts. A wrong spec wastes Phase 1–3.

**Output**: `owners-inbox/skill-forge/[skill-slug]-[YYYY-MM-DD]/spec.md` using `templates/spec.template.md`.

**Gate**: 🚧 Operator must affirm the spec ("yes, that's it" / "looks right") before we move on.

---

## When You Enter This Phase

The operator has said something like:
- "forge a skill for X"
- "build me a skill for [domain]"
- "I want a meta-skill that does [thing]"
- Or any variant where they want a skill but haven't written one.

You don't yet know:
- What exactly the skill should produce
- When it should trigger (the phrases that fire it)
- The scope (one-shot vs multi-phase, inline vs agent-driven)
- Whether they have prior art (a draft, a doc, a reference repo)

---

## Step 1 — Detect Pre-existing Material

Before asking anything, scan for:

- **Existing draft**: Did they paste partial skill content? Did they reference a file path?
- **Conversation history**: Did they describe a workflow earlier in the conversation? That workflow IS the skill — capture it.
- **Adjacent skills**: Run `Glob ~/jarvis/skills/*` and check if a similar skill already exists. If yes, surface it: *"`competitive-intel.md` already does competitor research — should the new skill complement it or replace it?"*

If you find pre-existing material, **lead with it**: *"It looks like you already started thinking about this — here's what I picked up. Let me ask a few questions to fill the gaps."* This shows the operator you're paying attention and skips redundant questions.

---

## Step 2 — Ask 3–4 Clarifying Questions

Use the `AskUserQuestion` tool. Pick the 3–4 questions most likely to disambiguate the skill. Default question bank:

### Question A — Purpose (always ask)
"What should this skill enable Claude to do that it can't already?"

Options should cover the dimensions:
- *Produce a deliverable* (report, code, document)
- *Execute a workflow* (multi-step task with state)
- *Apply a domain expertise* (judgment, evaluation, recommendations)
- *Wrap a tool / API / process* (concrete integration)

### Question B — Trigger (always ask)
"What phrases or contexts should make Claude reach for this skill?"

If the operator can list trigger phrases directly, skip multi-choice and capture their phrasing. Otherwise offer:
- *Explicit name* ("forge me a skill for X")
- *Domain keywords* (any mention of [topic])
- *Action verbs* ("audit", "design", "review")
- *Operator state* (e.g., "every time I'm reviewing a PR")

### Question C — Output format (often ask)
"What's the expected output shape?"

- *File deliverable* (markdown report, code file, presentation)
- *Inline response* (analysis in chat)
- *Side effects* (creates infra, sends messages, modifies files)
- *Mixed* (some of each)

### Question D — Scope / autonomy (situational)
"How autonomous should the skill be?"

- *Fully autonomous* (one shot, returns deliverable)
- *Operator-gated* (asks at decision points)
- *Phased pipeline* (multi-phase like skill-forge itself)

Skip questions that are already answered by pre-existing material.

---

## Step 3 — Probe for Domain Knowledge the Operator Already Has

The operator's existing knowledge is the highest-quality signal in the entire pipeline. Don't waste it.

After the multi-choice questions, ask **conversationally**:
- *"What references do you already have? (docs, repos, articles you've read, an internal wiki page)"*
- *"Have you done this task by hand before? Walk me through how you've been doing it."*
- *"What goes wrong when you've tried this before, or when you've seen others try?"*

Capture verbatim. These become the seed for Phase 1 search planning AND Phase 3 synthesis.

---

## Step 4 — Write the Spec

Use `templates/spec.template.md`. Fill in every field. If a field doesn't apply, write `N/A — [reason]` rather than leaving it blank.

The spec must include:

| Field | What it captures |
|-------|------------------|
| `skill_name` | Snake-case slug (e.g., `cache-strategy-designer`). One word per concept. |
| `one_line_purpose` | Single sentence. "This skill helps Claude [verb] when [context]." |
| `trigger_phrases` | Bullet list. 3–8 phrases the skill should fire on. Include 1–2 should-NOT-fire near-misses to clarify boundary. |
| `expected_output` | Concrete shape: file paths, formats, length, side effects. |
| `scope` | One-shot / phased / autonomous / gated. |
| `pre_existing_material` | What the operator already wrote/knows. Verbatim quotes preferred. |
| `existing_skills_to_check` | Adjacent JARVIS skills the new skill should integrate with or avoid duplicating. |
| `success_criteria` | How will we know this skill works? "If I paste [phrase], Claude does [action] and produces [output]." |
| `out_of_scope` | What the skill should NOT do. (Equally important — narrows research dimensions.) |

---

## Step 5 — Show & Confirm

Save spec.md, then show the operator a summary:

```
Spec captured at owners-inbox/skill-forge/[slug]-[date]/spec.md.

Quick gut-check:
- Skill name: [name]
- One-liner: [purpose]
- Triggers on: [3-4 representative phrases]
- Output: [shape]
- Scope: [scope]

Does this match what you wanted? If yes, I'll move into Phase 1 (search planning).
If anything's off, tell me what to adjust.
```

🚧 **GATE 1**: Wait for affirmative. If the operator pushes back, revise the spec and re-show. Don't move on until they say "yes" or equivalent.

---

## Hard Rules

- **Never start research from the spec alone if a key field is `N/A`.** Loop back, ask the operator. The cost of one more question is much smaller than the cost of researching the wrong thing.
- **Never invent the operator's pre-existing knowledge.** If they didn't mention a doc/repo, don't assume one exists.
- **Cap intake at ~5 minutes.** If clarification is taking longer, the skill might be too vague to forge — propose narrowing it ("let's start with X, build that, then add Y as a v2").
- **Skill name should be unique.** Run `Glob ~/jarvis/skills/[name]*` before finalizing. If it conflicts, suggest variants.

---

## Edge Cases

**Operator says "just go, you figure it out":**
Push back gently — *"I'll do better work with one round of clarification. Two questions: [purpose] and [output shape]?"*

**Operator describes 3 different skills in one breath:**
Ask which one to build first; offer to queue the others as follow-up forge runs.

**Operator wants to update an existing skill instead of creating new:**
This isn't skill-forge territory. Hand off to `anthropic-skills:skill-creator` with the existing skill path; skill-forge is for cold-start.

**Operator's spec implies a skill that already exists:**
Surface the existing skill, ask if they want to extend it or build something distinct.

---

## Related

[[part-of::skill-forge]]  [[followed-by::search-strategy]]  [[depends-on::AskUserQuestion]]
