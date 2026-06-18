# Skill: grill-me-ingestion

## Trigger
"grill me about", "interview me about", "extract what's in my head", "brain dump this", "help me ingest this idea", "build context on [topic]", "JARVIS needs more nuance on [topic]"

## Goal
Turn operator-held knowledge into a staged raw note first, then promote only durable facts, decisions, or learnings into canonical memory.

## Process

1. Identify the target topic and the future query shape:
   - "How will the operator likely ask for this later?"
   - "Should the answer be a decision, project context, relationship, learning, or external knowledge note?"
2. Interview one question at a time. Push for specifics: names, dates, constraints, current status, stakes, what changed, and what would make the fact stale.
3. Stop when the missing context is good enough to route future work without asking the operator to re-explain the topic.
4. Stage the result in `memory/raw/YYYY-MM-DD-<topic>.md` only after the operator agrees to save it.
5. Include this structure:
   ```markdown
   ---
   title: "<topic>"
   type: raw-ingestion
   status: staged
   captured: YYYY-MM-DD
   promote-to: [context | decisions | learnings | relationships | knowledge | none]
   ---

   # <topic>

   ## Future Queries
   - ...

   ## Raw Context
   ...

   ## Candidate Promotions
   - ...
   ```
6. Promote only the distilled keepers. Do not store the whole interview in canonical memory.
7. If promoted, update the appropriate index and log the write to `logs/memory-updates.log`.

## Guardrails

- Ask one question at a time unless the operator explicitly requests a questionnaire.
- Do not save secrets, credentials, private medical details, or unnecessary raw transcripts.
- Do not promote volatile Slack/Gmail/calendar/customer chatter into memory. Store the durable summary and leave volatile data in live connectors.
- If the topic belongs in an active project repo or external tracker, point there instead of duplicating state in memory.
- If the staged note is wrong, delete or replace it. Raw is a staging zone, not an archive.

## References

- `memory/raw/README.md`
- `skills/memory-management.md`
- `references/memory-protocol.md`
- `skills/second-brain-level-audit.md`

## Related
[[supports::memory-management]]  [[related-to::knowledge-integrity]]  [[part-of::second-brain-level-audit]]
