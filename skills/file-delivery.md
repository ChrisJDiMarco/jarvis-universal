# Skill: File Delivery (Specialists Own Files End-to-End)

## Trigger
Always-on rule for any agent that produces a file deliverable. No explicit phrase — this fires implicitly whenever a `Write`, `Edit`, or file-export tool is used and a result is being returned to the operator or a parent agent.

(This pattern was originally drafted as a `.claude/rules/` file, but `.claude/rules/` is locked from session writes. Keeping it as a skill is functionally equivalent — agents that should follow it just need to load it.)

## Goal
When an agent produces a file, return **the path + a concise summary**, not the file's contents. Re-pasting file bodies into chat is the single largest preventable context-killer in JARVIS sessions and forces the operator to scroll past content they could open in one click.

This is the *how to deliver* complement to `feedback_save_to_jarvis` (which covers *where to save*).

---

## The Rule

When an agent produces a file deliverable, it returns:

1. **The absolute file path** (e.g. `~/jarvis/owners-inbox/competitive-brief-2026-05-05.md`)
2. **A concise summary** — what's in the file, in 1–3 sentences
3. **Nothing else by default**

It does **NOT**:

- Re-paste the full file contents into chat
- Forward raw markdown/HTML/body text "so the operator can see it"
- Force the orchestrator to relay the file's contents back upstream
- Dump multiple specialist outputs unfiltered

## Why

A 4-page report is ~3k tokens. Relaying it through orchestrator + back to operator triples the cost. It also wastes the operator's reading time — they can open the file faster than he can scroll past a chat dump of it. And it breaks the "specialists own end-to-end" topology: the orchestrator should never become a content pipe.

## The Output Pattern

For operator-facing responses:

```
[Brief 1-3 sentence summary of what was produced]

[View it](computer://~/jarvis/[path])
```

For agent-to-agent communication:

```json
{
  "path": "~/jarvis/owners-inbox/foo.md",
  "summary": "3-page brief on competitor X — key takeaway: their pricing model just changed",
  "lines": 142,
  "type": "markdown"
}
```

## When the Orchestrator Receives a File from a Specialist

The orchestrator should:

- Mention the deliverable is ready
- Include the path
- Add at most 1 sentence of context if the user asked a question that the file answers

It should **NOT**:

- Open the file and re-summarize its contents
- Quote sections of the file unless the operator explicitly asked
- Stitch contents from multiple specialist files into one chat dump

If the operator wants a synthesized briefing across multiple files, the orchestrator delegates that synthesis to a specialist (analyst, content-creator) which produces ONE new file, then returns the path.

## Exceptions (Narrow)

Inline contents are appropriate when:

- The operator explicitly requests raw source ("paste the markdown", "show me the actual text")
- The output is genuinely tiny (< 20 lines) AND the chat answer IS the deliverable (e.g. a one-liner shell command)
- The file is chat-only by design (a Slack message draft, a single tweet) — but even then, save it to `owners-inbox/` for a record

When in doubt: deliver by path, not by paste.

## Verification Checklist

Before any agent response that includes a file deliverable:

- [ ] Path is absolute and uses the workspace folder the operator can open
- [ ] Summary is ≤ 3 sentences
- [ ] No section of the file body is quoted unless operator asked for it
- [ ] If multiple files were produced, each gets its own path + 1-sentence summary (not a chat dump of all contents)

---

## Related
[[supports::agent-builder]]  [[depends-on::feedback_save_to_jarvis]]  [[related-to::multi-agent-fanout]]
