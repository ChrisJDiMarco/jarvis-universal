# JARVIS Control Center Shell

Local-first shell for the JARVIS OS control plane.

## Run

```bash
scripts/start_control_center.sh
```

Open `http://127.0.0.1:5174`.

## Scope

This is local-first. `runtime/control_center/server.py` serves the UI, stores missions in `data/jarvis-control-center.db`, exposes channel ingest endpoints, and runs missions through a narrow safe runner boundary. Set `JARVIS_RUNNER_MODE=claude`, `codex`, `local`, or `auto` to choose the runner. `auto` prefers Claude, then Codex, then the local fallback.

## Modules

- Simple view for consumer-friendly task intake.
- Mission Control for queue, launcher, pipeline, audit feed, and usage.
- Agents for the specialist mesh and routable skill catalog.
- Setup for first-run memory status.
- Memory for recall search.
- Channels for local gateway ingest and toggles.
- Security for policy toggles, kill switch, and decisions.
- Automations for local schedule registry.
- Artifacts for saved mission outputs and run logs.
- Settings for runner mode, budget, timeout, permissions, and paths.
