# Updating JARVIS Universal

How to safely pull a new release without losing your memory or settings.

## TL;DR

```bash
cd ~/jarvis
git fetch origin --tags
git status                      # confirm working tree is clean
git pull --rebase origin main   # pull new commits
bash setup/install.sh           # re-run installer (idempotent — safe)
bash setup/check.sh             # verify state
```

If `git pull` reports conflicts, see "Handling memory file conflicts" below.

## What's safe to update

These files are **template-managed** — JARVIS Universal owns them, and updates flow cleanly:

- `CLAUDE.md`, `README.md`, `INSTALL.md`, `AGENTS.md`, `CHANGELOG.md`
- `setup/*` (install scripts, first-run wizard, archetypes, models.yaml, connect-tools)
- `scripts/*` (cleanup, dashboard, memory caps, indexer)
- `tests/*`
- `hooks/*` (the hook scripts themselves)
- `.claude/agents/*` (agent definitions — JARVIS-shipped agents)
- `.claude/rules/*` (always-active guardrails)
- `skills/*` (skill playbooks)
- `team/roster.md` (the JARVIS-shipped roster)
- `docs/*`

Pulling these gets you the latest improvements. Conflicts are unlikely unless you've heavily customized them.

## What's yours

These files contain **your operator state** — JARVIS Universal won't touch them after first run, and the template tries to leave them alone:

- `memory/core.md` — populated by first-run wizard
- `memory/L1-critical-facts.md` — your always-loaded facts
- `memory/context.md`, `memory/decisions.md`, `memory/learnings.md`, `memory/relationships.md`, `memory/ai-intelligence.md` — your accumulated state
- `memory/raw/*` — your half-formed notes (template only ships `README.md`)
- `memory/soul.md` — your operating philosophy (template ships a generic version; you may have customized)
- `owners-inbox/*`, `team-inbox/*`, `projects/*` — your work
- `logs/*` — your activity history
- `.claude/settings.local.json` — local hook configuration (might differ between machines)
- `.jarvis-installed` — per-machine install marker (gitignored)

## Backup before any update

Memory is precious. Before any pull, snapshot it:

```bash
cd ~/jarvis
mkdir -p .backups
tar -czf ".backups/memory-$(date -u +%Y%m%dT%H%M%SZ).tar.gz" memory/ logs/ owners-inbox/
```

Five-second insurance. If anything goes wrong, you can restore.

## Handling memory file conflicts

If `git pull` reports a conflict in a `memory/*.md` file, the template ships an updated version of a file you've also modified. **The right resolution is almost always: keep your version.** The template's `memory/core.md` is the empty Setup Needed marker; you've populated it. Don't lose your data.

```bash
# For each conflicting memory file:
git checkout --ours memory/core.md
git checkout --ours memory/L1-critical-facts.md
# ...etc.

git add memory/
git rebase --continue
```

If you're not sure whether the template's update has anything you want, compare:

```bash
git diff HEAD memory/core.md         # what the template wants vs your current
git show origin/main:memory/core.md  # what the template ships now
```

If you want any of the template's structure (e.g., a new section was added), copy it manually into your file.

## Re-running the installer

After every update, re-run `bash setup/install.sh`. It's idempotent — won't undo anything — and:

- Picks up new directories that may have been added (`memory/raw/`, `tests/`, etc.)
- Re-applies executable bits on any new scripts
- Refreshes the `.jarvis-installed` marker timestamp

Then `bash setup/check.sh` confirms the install is healthy after the update.

## Updating with the test suite

If the release added new tests, run them after pulling:

```bash
bash tests/run-all.sh
```

If anything fails, check the CHANGELOG for that version's "Known limitations" — it might be a documented incompatibility with your existing memory format.

## Skipping a release

You don't have to take every release. To stay on a specific version:

```bash
git checkout v1.0.0       # or whatever tag
```

This puts you in detached-HEAD state — fine for use, but you can't `git pull` directly. To go back to the latest:

```bash
git checkout main
git pull origin main
```

## Major version updates

`MAJOR` releases (e.g., `v1.x.x` → `v2.0.0`) may include breaking changes — memory file format, hook contract, agent file structure. **Always read the CHANGELOG entry for the major version before pulling.** It will explicitly call out migration steps.

Don't pull a major version on a Friday afternoon. Don't pull a major version without a backup.

## Rollback

If an update breaks something, the easiest recovery is to roll the working tree back to the last known good commit:

```bash
git log --oneline -10                # find the SHA you want
git reset --hard <sha>               # reset to it
```

Your memory files are safe (Git tracks them, so the reset puts them back to that point in history).

If your local memory differed from any committed state and you didn't back up, see [`docs/RECOVERY.md`](RECOVERY.md) for reflog recovery and other options.
