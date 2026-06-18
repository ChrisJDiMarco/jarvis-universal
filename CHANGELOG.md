# Changelog

All notable changes to JARVIS Universal are documented here.

This project follows [Semantic Versioning](https://semver.org/spec/v2.0.0.html). Going forward, every release is an additive commit (no more squash-rewrites of `main`) so older tags remain meaningful.

---

## [1.1.0] — 2026-06-18

Brings Universal current with six weeks of upstream evolution: an always-loaded restructure, single-source-of-truth config, more self-maintenance, broader language coverage, and CI.

### Added

- **9 agents** (now 73 active): `a11y-architect`, `react-reviewer`, `react-build-resolver`, `swift-reviewer`, `swift-build-resolver`, `django-reviewer`, `django-build-resolver`, `fastapi-reviewer`, `mle-reviewer`. Every language reviewer (Go, Rust, Java, Kotlin, C++, C#, Dart, Flutter, PyTorch) now ships active, so the install fits any stack out of the box.
- **3 ECC rules**: `boring-is-beautiful.md` (deterministic-first decision tree), `poc-first.md` (prove demand before building the heavy version), `api-over-mcp.md` (direct API + saved reference once a tool is used 3+ times).
- **`config/memory-caps.conf`** — the single place memory caps are defined; `check-memory-caps.sh` and `setup/check.sh` both read it.
- **`references/`** — lazy-loaded detail moved out of the always-loaded prompt: `routing-table.md` (40+ trigger→skill mappings), `memory-protocol.md`, `firecrawl-api.md`, `ui-skills.md`, and three moved-out rules (`skill-discovery`, `service-accounts`, `memory-reachability`).
- **Self-maintenance scripts**: `system-stats.sh` (single source of truth for counts), `check-staleness.sh`, `reachability-gc.py` (mark-and-sweep memory GC), `integrity-check.py`, `measure-context-surface.sh`, `sync-agents-md.py`, `second-brain-level-audit.py`.
- **3 guard tests** wired into `run-all.sh`: `test-counts-single-source.sh`, `test-caps-single-source.sh`, `test-agents-md-sync.sh`.
- **~15 skills**: the second-brain + cadence set (`evening-debrief`, `monthly-retrospective`, `world-briefing`, `four-cs-audit`, `knowledge-integrity`, `level-up`, `second-brain-level-audit`, `connection-synthesis`, `cloud-routines`, `grill-me-ingestion`), plus `app-creation-thinker`, `vibe-code-thinker`, `experimental-ui-styles`, `gws-cli`, `higgsfield-quickstart`, and the `skill-forge`, `remotion-best-practices`, and `viral-tiktok-forge` skill packs.
- **GitHub Actions CI** — runs `tests/run-all.sh` on every push and pull request.

### Changed

- **CLAUDE.md restructured** (36k → 26k chars while adding capability): inline routing and skills tables externalized to `references/` and `skills/INDEX.md`; inventory counts now cite `system-stats.sh`; memory caps reframed as advisory two-tier signals; the ops-scripts section reflects the real scripts plus the deterministic Stop-hook backstop.
- **Stop hook** now runs `check-staleness.sh` + `check-memory-caps.sh` once a day (scheduler-independent hygiene). **PreCompact hook** self-bounds its recovery flag.
- **Models** bumped to Opus 4.8 / Sonnet 4.6 / Haiku 4.5 in `setup/models.yaml`.
- **AGENTS.md** is auto-generated from CLAUDE.md via `sync-agents-md.py`; `test-agents-md-sync.sh` keeps the two in lockstep.

### Fixed

- Stale hand-typed counts across docs (agents, ECC skills) now match the filesystem and are guarded against recurrence by `test-counts-single-source.sh`.
- Sanitization sweep removed residual personal project names from ported reference and skill files; `test-no-personal-info.sh` passes clean.

---

## [1.0.0] — 2026-05-05

The first tagged release. Establishes JARVIS Universal as a production-ready, public-template Claude Code installation.

### Added

**Activation infrastructure**
- `setup/install.sh` — one-shot installer. Verifies dependencies (jq, python3, git, claude CLI), validates the directory structure, makes hooks executable, surfaces optional MCP recommendations, writes `.jarvis-installed` marker. Idempotent, safe to re-run.
- `setup/check.sh` — health check. Reports passes/warnings/criticals across dependencies, hook executability, settings.local.json wiring, memory file caps vs documented limits, first-run state, inbox health. Supports `--terse`, `--json`, and `--full-suite` (runs the test harness).
- `setup/install-semantic-search.sh` — one-command installer for the optional Milvus + Ollama + claude-context MCP stack. Idempotent. Supports `--check` (status only), `--dry-run` (print what would happen), and `--yes` (skip confirmations). Includes disk preflight, network reachability check, retry logic on flaky operations, and a portable bash-only `timeout` fallback for systems without GNU coreutils.
- `setup/connect-tools.md` — reference doc the onboarder agent reads at runtime. Per-tool install steps grouped into 4 tiers: built-in connectors (Slack/Notion/Linear/GitHub/Atlassian/Asana/Gmail/Calendar/Drive), high-leverage community MCPs (Firecrawl), local services with bigger setup (semantic code search), and browser automation as last resort.
- `setup/models.yaml` — single source of truth for the strategic/daily/bulk → model-version mapping. Update one file when Anthropic ships new models.

**New agent**
- `.claude/agents/onboarder.md` — MCP setup specialist. Walks the operator through tool connection one at a time, verifies each with a real probe call, refuses to paste API keys in chat, recommends built-in connectors over community MCPs when both exist. Invoked during first-run Phase 6 and any later "connect [tool]" / "set up MCPs" request.

**New skill**
- `skills/ship-it.md` — production deployment pipeline. Plan → tdd → code-review → security-review → grade → commit, with operator approval gates between every phase. Halt-fast on any CRITICAL finding or grade D/KILL verdict.

**Lifecycle automation**
- `scripts/cleanup-inbox.sh` — enforces the 7-day archive policy and 20-file cap on `owners-inbox/` that CLAUDE.md previously documented but didn't enforce. Supports `--dry-run`.
- `scripts/check-memory-caps.sh` — verifies each `memory/*.md` file is under its documented cap. Warns at 80%, fails at 100%. Supports `--json` for tooling.
- `scripts/dashboard.sh` — generates `owners-inbox/dashboard.html`: dark-themed status snapshot with memory health bars, recent decisions, recent learnings, recent activity log, inbox state.

**Test harness** (new in this release)
- `tests/run-all.sh` — runs every `tests/test-*.sh` script. Reports pass/fail counts, exits non-zero if any test fails. Supports `--verbose` and `--quiet`.
- `tests/test-bash-syntax.sh` — `bash -n` syntax check on every `.sh` file in the repo.
- `tests/test-no-personal-info.sh` — greps for personal references (name, email, hardcoded paths) across all tracked files.
- `tests/test-hooks-executable.sh` — verifies every script that's expected to run has the executable bit.
- `tests/test-routing-table.sh` — parses CLAUDE.md's Context Auto-Detection table and verifies every referenced agent file actually exists.
- `tests/test-agents-have-required-sections.sh` — verifies every JARVIS top-level agent file has Role + Behavioral Rules sections (ECC sub-agents skipped — different convention).
- `tests/test-memory-templates.sh` — verifies `memory/core.md` has the Setup Needed marker and L0 END boundary.
- `tests/test-ops-scripts-referenced.sh` — verifies every script CLAUDE.md claims exists actually exists.
- `tests/test-skills-have-trigger.sh` — verifies every skill file declares a trigger (any of: `## Trigger`, `trigger:`, `**Trigger:**`).

**Hook enhancements**
- `hooks/stop_hook.sh` — added Milvus auto-reindex block. When source files change AND the semantic search stack is installed AND Milvus health endpoint responds within 5s, kicks off `FORCE_REINDEX=false` (Merkle-tree diff, seconds-to-a-minute) in the background. Silent if not installed.

**Documentation**
- `CHANGELOG.md` — this file.
- `docs/RELEASING.md` — release process for cutting future versions. Establishes the additive-commit convention going forward.
- `docs/UPDATING.md` — how to safely `git pull` a new JARVIS version without losing memory.
- `docs/RECOVERY.md` — what to do when hooks break, scheduled tasks stop firing, or memory gets corrupted.
- `README.md` — added "Try These First" section with 6 starter prompts. Restructured MCP section into the 4-tier install order. Updated semantic search section to reference the one-shot installer. Added versioning note.
- `CLAUDE.md` — model preference table now references abstract tiers (with `setup/models.yaml` as source of truth). Added Operational Scripts section. Added onboarder to Team Roster. Added "Tool setup" routing trigger. First Run Protocol explicitly includes Phase 6 (connect tools). Strengthened the first-run detection language at the top of the file.
- `setup/first-run.md` — added Step 6 (Connect tools) that delegates to the onboarder agent.
- `team/roster.md` — added onboarder to core team and quick-reference routing.

### Changed
- README's "MCP Integrations" section restructured around Tier 1 (built-in connectors) → Tier 2 (Firecrawl) → Tier 3 (optional power-ups). Lower friction first.
- Model preference guidance moved from hardcoded version names to abstract tier references — version mapping lives in `setup/models.yaml`.
- `hooks/stop_hook.sh` — fourth indexing block (Milvus reindex) added after the existing memory and learned-lessons blocks.

### Removed
- `instructions.txt` — content fully covered by README + INSTALL. Three setup docs at root was confusing.
- `the-ai-brief-template.html` — orphan file (newsletter email template) unrelated to JARVIS.

### Fixed
- Personal references scrubbed from 20+ files (operator name, email, hardcoded `/Users/...` paths). Replaced with `the operator`, `[Your Name]`, or `~/jarvis` as context required.

### Known limitations
- The first-run wizard still depends on the LLM noticing the template marker in `memory/core.md`. Strengthened with a CRITICAL banner at the top of CLAUDE.md and a manual-trigger escape hatch ("run first-run wizard") but not enforced by code.
- `setup/install-semantic-search.sh` is smoke-tested in `--check` mode only. End-to-end install (Docker pull, MCP registration, first index) is unverified — high-confidence based on the source guide it was built from but should be considered "tested only when someone actually runs it on a clean machine".
- Cross-platform: most testing on macOS. Linux paths use plausible commands but unverified.

---

## Release process going forward

Starting with v1.0.0, releases are **additive commits**, not squash-rewrites. See [`docs/RELEASING.md`](docs/RELEASING.md) for the full process. The v1.0.0 tag will remain pointing at the same commit forever; v1.0.1, v1.1.0, etc. are normal commits on top of it.

[1.0.0]: https://github.com/ChrisJDiMarco/jarvis-universal/releases/tag/v1.0.0
