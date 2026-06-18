# Skill: JARVIS Control Plane

## Trigger
"build the JARVIS interface", "command center", "control center", "mission control", "agent OS dashboard", "OS interface", "War Room", "voice room", "mobile bridge", "channel gateway", "ClaudeClaw-style", "make JARVIS feel like an OS"

## Goal
Turn JARVIS from a repo-native agent brain into an operator-facing OS shell: dashboard, mission queue, channel gateway, safe runner, memory browser, usage ledger, and optional voice/meeting surfaces.

---

## When To Use

Use this skill when the operator asks for:
- A dashboard or interface for JARVIS.
- Mobile/chat access through Telegram, Slack, Discord, WhatsApp, or similar.
- Mission Control / queue / task lifecycle visibility.
- A War Room or voice-agent interface.
- A ClaudeClaw-style system.
- Packaging JARVIS for teammates or clients who will not use a terminal.

Do not use this skill for a normal SaaS dashboard. Use it only when the dashboard is the control plane for JARVIS itself.

---

## Reference Model

The control plane closes three gaps:
1. **Memory gap**: make persistent memory searchable and visible.
2. **Consistency gap**: expose skills and agents as repeatable buttons/workflows.
3. **Access gap**: let non-technical users trigger JARVIS without a terminal.

The target system borrows from ClaudeClaw-style architecture:
- Channels feed a mission queue.
- A router assigns missions to agents/skills.
- A runner executes real Claude Code/Codex sessions behind a process boundary.
- Security checks wrap inbound and outbound data.
- The UI shows task state, outputs, usage, schedules, and memory.

---

## Required Sequence

### Step 1: Write The Requirement Document

Any control-plane build is substantial. Start with an RD in `projects/jarvis-control-plane/` unless the operator only asks for a gap audit.

Include:
- Target users: operator only, team, clients, or public.
- First interface: dashboard, Telegram, Slack, Discord, WhatsApp, or voice.
- Runtime target: Claude Code, Codex, or runtime-agnostic.
- Execution posture: enqueue-only, human-approved execution, or direct execution.
- Security posture: allowlist, PIN, kill switch, redaction, audit log.

### Step 2: Define Contracts Before UI

Create stable schemas for:
- `Mission`: prompt, source, operator, target agent, status, priority.
- `Run`: runtime, command, cwd, timestamps, exit code, cost estimate.
- `Event`: mission lifecycle and audit trail.
- `SecurityDecision`: allow/deny/redact/PIN-needed.
- `AgentResponse`: summary, artifacts, followups, cost footer.

### Step 3: Build Mission Queue

Use SQLite first because JARVIS already has `data/jarvis.db` as the local data anchor.

Minimum tables:
- `missions`
- `mission_runs`
- `mission_events`
- `usage_ledger`
- `channel_identities`
- `security_events`

### Step 4: Build Dashboard MVP

The first dashboard should show:
- Mission queue: queued, assigned, running, done, failed.
- Agent roster and skill packs.
- Prompt launcher with editable prompt and selected agent.
- Recent outputs from `owners-inbox/`.
- Memory search.
- Usage/cost ledger.
- Pause/kill switch state.

Keep it local-first. The first version can run on localhost.

### Step 5: Add Safe Runner

Add a process boundary that executes agent work without giving the UI raw shell freedom.

Runner rules:
- Accept only structured `Mission` input.
- Resolve the target agent/skill inside JARVIS, not from arbitrary user-provided shell text.
- Use explicit `cwd`.
- Log raw stdout/stderr to files.
- Return structured JSON to the queue.
- Deny or pause risky actions through the security layer.

Claude Code primary path:
- Use non-interactive/headless Claude Code execution where available.
- Prefer structured JSON or stream JSON output when supported.
- Pass explicit tool permissions and working directory.

Codex fallback:
- Use the available Codex runtime/CLI/API when present.
- If no safe non-interactive runner exists, enqueue the mission and surface it in the dashboard for manual execution.

### Step 6: Add One Channel Gateway

Add only one external channel first. Telegram is a common first choice because the identity and chat model are simple, but Slack or Discord may be better for team use.

Pipeline:
1. Receive message.
2. Verify identity allowlist.
3. Require PIN for high-risk action.
4. Classify target agent/skill.
5. Enqueue mission.
6. Execute or await approval based on policy.
7. Redact output.
8. Reply with summary, artifacts, and cost footer.

### Step 7: Add Security Bar

No broad remote access until these exist:
- Channel allowlist.
- PIN challenge for risky actions.
- Emergency kill phrase.
- Exfiltration guard for secrets, env files, credentials, private keys, and sensitive memory.
- Audit log for every inbound request and execution.

### Step 8: Add Advanced Surfaces

Only after dashboard, queue, runner, and security are stable:
- War Room voice interface.
- Meeting assistant.
- Avatar/video layer.
- Multi-channel fanout.

---

## UI Principles

- The dashboard should feel like an operations console, not a marketing site.
- Prioritize dense, scannable status over decorative cards.
- Every action must explain what it will run, where it will run, and what risk level it has.
- Buttons represent agents, skills, routines, and approvals.
- Include clear empty states for no missions, no schedules, and no pending reviews.
- Usage, risk, and output destination should never be hidden.

---

## Output Format

When using this skill, deliver:
1. Current gap summary.
2. RD or implementation plan.
3. Contracts/schemas.
4. File/module map.
5. Security checklist.
6. Verification plan.

---

## Related
[[control-plane-gap-audit]]  [[agent-infrastructure-audit]]  [[workflow-builder]]  [[persistent-daemon]]  [[app-studio]]  [[voice-agent-builder]]
