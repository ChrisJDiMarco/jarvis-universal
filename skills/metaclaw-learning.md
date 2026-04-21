# Skill: MetaClaw Learning System

## Trigger
"extract learnings", "what did we learn", after confirmed agent error + recovery, on 3rd pattern repeat, task post-mortems

## Invocation
**Manual or post-error only — do not auto-invoke on casual keyword hits.**
MetaClaw writes to shared learning files. Firing mid-task on the wrong signal corrupts the learning corpus with partial or context-free entries. Only run after a genuine error/recovery cycle, after an explicit the operator request, or at session/task end.

## Goal
Automatically extract reusable lessons from failures, recoveries, and validated successes — then inject them into future agent runs so JARVIS never makes the same mistake twice. Inspired by AutoResearchClaw's MetaClaw cross-run learning system.

---

## Architecture: Learn → Store → Inject Loop

### How It Works
```
Agent fails → recovers → MetaClaw extracts lesson
                              ↓
                     Lesson stored in skills/learned/
                              ↓
              Future agents receive relevant lessons
                     injected into their context
```

---

## Phase 1: DETECT (Automatic)

Monitor for these learning signals during any agent execution:

### Failure Signals (extract what went wrong + what fixed it)
- Agent retried a step and the retry succeeded
- An error was caught and a workaround was applied
- A tool call failed and an alternative tool was used
- A validation check failed and content was regenerated
- An LLM output was rejected and re-prompted

### Success Signals (extract what worked unexpectedly well)
- A non-obvious approach was chosen and user confirmed it was correct
- A task completed significantly faster than expected
- Output quality was explicitly praised by the operator
- A novel tool combination was used successfully

### Pattern Signals (extract emerging workflows)
- Same type of task done 3+ times with same approach
- Same error encountered 2+ times across different sessions
- Same tool routing decision made repeatedly

---

## Phase 2: EXTRACT (Haiku — fast, cheap)

When a signal is detected, extract a structured lesson:

```json
{
  "lesson_id": "[auto-generated: context-keyword-date]",
  "type": "failure_recovery | success_pattern | workflow_pattern | tool_routing",
  "trigger_context": "What situation caused this",
  "what_happened": "The specific failure or success",
  "root_cause": "Why it happened (if failure)",
  "resolution": "What fixed it or what worked",
  "rule": "One-sentence rule for future agents",
  "applies_to": ["agent-name", "skill-name", "tool-name"],
  "confidence": "HIGH | MEDIUM | LOW",
  "occurrences": 1,
  "first_seen": "2026-03-25",
  "last_seen": "2026-03-25"
}
```

**Model routing**: Use Haiku for extraction — this is pattern matching, not reasoning.

---

## Phase 3: STORE

### Storage Location
`skills/learned/` directory — one `.md` file per lesson category:

| File | Contains |
|------|----------|
| `skills/learned/tool-routing.md` | Which tools work/fail for which tasks |
| `skills/learned/error-recovery.md` | Known errors and their fixes |
| `skills/learned/prompt-patterns.md` | Prompt structures that work vs. fail |
| `skills/learned/workflow-patterns.md` | Validated multi-step sequences |
| `skills/learned/integration-gotchas.md` | API quirks, rate limits, format issues |

### Storage Rules
- **Dedup before write**: Check if a similar lesson already exists (same root_cause + applies_to)
- **If duplicate**: Increment `occurrences`, update `last_seen`, increase confidence if warranted
- **If new**: Append to appropriate file
- **Cap**: Each file maxes at 3,000 chars. When approaching cap, use Haiku to compress: merge related lessons, drop LOW confidence lessons older than 30 days
- **Format per lesson in file**:

```markdown
### [lesson_id] — [type] (confidence: HIGH, seen: 3x)
**When**: [trigger_context]
**Rule**: [one-sentence rule]
**Why**: [root_cause or reason it works]
**Fix/Pattern**: [resolution]
**Applies to**: [agent/skill/tool list]
*Last seen: 2026-03-25*
```

---

## Phase 4: INJECT (Before Agent Execution)

When any agent is about to execute a task:

1. **Identify relevant lesson files** based on:
   - Agent name → check `applies_to` fields
   - Skill being used → check `applies_to` fields
   - Tools being used → check `tool-routing.md`

2. **Extract HIGH + MEDIUM confidence lessons** that match

3. **Inject as context prefix** in the agent's system prompt:

```
## Lessons from Previous Runs (DO NOT ignore these)
- [rule 1]: [one-line explanation]
- [rule 2]: [one-line explanation]
- [rule 3]: [one-line explanation]
```

4. **Max injection**: 5 lessons per agent run (prioritize by: confidence DESC, occurrences DESC, recency DESC)

---

## Phase 5: PRUNE (Weekly — part of weekly-review)

During the weekly review:
1. Load all lesson files
2. Remove lessons with confidence: LOW that haven't been seen in 21+ days
3. Merge lessons that evolved into the same rule
4. Promote frequently-seen patterns (5+ occurrences) to `memory/learnings.md` as permanent rules
5. Log pruning summary to `logs/metaclaw-prune.log`

---

## Integration Points

### With Memory Management
- MetaClaw writes to `skills/learned/` (operational patterns)
- Memory Management writes to `memory/learnings.md` (strategic learnings)
- Promotion path: lesson hits 5+ occurrences → Memory Management moves it to `learnings.md`

### With Agent Teams
- When spinning up an agent team, inject relevant lessons into EACH agent's context
- Team-level lessons (coordination failures) stored in `workflow-patterns.md`

### With Existing Skills
- Each skill can reference learned lessons: "Before executing, check `skills/learned/[relevant-file].md`"
- The n8n-workflow-builder, discovery-audit, and content-creation skills should all read their relevant lessons

---

## Trigger Protocol

### After Error Recovery
```
1. Error detected → agent recovers
2. MetaClaw DETECT fires
3. EXTRACT lesson using Haiku
4. STORE to appropriate file
5. Log: "MetaClaw: New lesson stored — [lesson_id]"
```

### On Pattern Repeat (3rd time same approach used)
```
1. Pattern recognized across session
2. EXTRACT as workflow or tool-routing lesson
3. STORE to appropriate file
```

### On Explicit Request
- "what did we learn" → Display all lessons from current session
- "extract learnings" → Force extraction from recent conversation
- "inject lessons for [agent]" → Show what would be injected

---

## Rules
- Extraction uses Haiku only — never spend Sonnet/Opus tokens on lesson extraction
- Lessons must be actionable (a future agent can act on the rule without additional context)
- Never store conversation content — only distilled rules and patterns
- Confidence starts at LOW for first occurrence, upgrades to MEDIUM at 2 occurrences, HIGH at 3+
- If a lesson contradicts an existing one: keep both, flag for the operator's review during weekly pruning
- The `skills/learned/` directory is the immune system — it should grow steadily but stay lean

---

## Related
[[learnings]]  [[decisions]]  [[error-recovery]]  [[prompt-patterns]]  [[tool-routing]]
