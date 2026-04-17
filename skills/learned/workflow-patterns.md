# Learned Lessons: Workflow Patterns

> Auto-maintained by MetaClaw Learning System. Do not edit manually unless pruning.

### phase-gate-architecture — workflow_pattern (confidence: HIGH, seen: 5x+)
**When**: Building any multi-step pipeline or automation
**Rule**: Use phase state machines with programmatic validation gates between phases — never chain LLM calls without verification checkpoints
**Why**: 90% reliability per step × 10 steps = 35% overall. Gates catch failures early and enable retry from last good state.
**Fix/Pattern**: PENDING → PHASE_1 → VALIDATED → PHASE_2 → VALIDATED → COMPLETE. Validation = code checks, not LLM judgment.
**Applies to**: competitor-intelligence-harness, discovery-audit, n8n-workflow-builder, researcher-deep
*Last seen: 2026-03-25*

### file-ownership-sacred — workflow_pattern (confidence: HIGH, seen: 3x)
**When**: Running agent teams or parallel tasks
**Rule**: Never let two agents write to the same file — assign explicit file ownership per agent
**Why**: Concurrent writes = data corruption or silent overwrites. One agent's output disappears.
**Fix/Pattern**: Each agent gets named output files. Orchestrator merges results after all agents complete.
**Applies to**: agent-teams, multi-agent-fanout
*Last seen: 2026-03-25*
