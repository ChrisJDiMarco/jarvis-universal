# Releasing JARVIS Universal

How to cut a new release. Process applies starting with v1.0.0.

## Convention

- **Versioning**: [SemVer](https://semver.org/spec/v2.0.0.html) — `MAJOR.MINOR.PATCH`.
  - `PATCH` (1.0.0 → 1.0.1): bug fixes, doc tweaks, no behavior change.
  - `MINOR` (1.0.0 → 1.1.0): new agents, new skills, new scripts. Backward compatible.
  - `MAJOR` (1.0.0 → 2.0.0): breaking changes — memory file format, hook contract, agent file structure.

- **Commits**: starting with v1.0.0, every change is an **additive commit** on `main`. No more squash-rewrites of history. The reasons:
  1. Older tags stay reachable (v1.0.0 always points at the same commit, even after a hundred releases).
  2. Anyone who's cloned/forked can `git pull` cleanly without history-divergence headaches.
  3. The history becomes a real audit trail.

- **Tags**: every release is an annotated tag (`git tag -a vX.Y.Z`). Pre-releases use suffixes (`v1.1.0-beta.1`).

## Pre-release checklist

Before tagging:

1. `bash setup/check.sh --full-suite` — must pass cleanly (no critical, ideally no warnings).
2. `bash tests/run-all.sh` — all tests must pass.
3. `bash tests/test-no-personal-info.sh` — explicit personal-info sweep.
4. Update `CHANGELOG.md`:
   - Add a new `## [X.Y.Z] — YYYY-MM-DD` section at the top (under the H1).
   - Document under standard subsections: `### Added`, `### Changed`, `### Fixed`, `### Removed`, `### Deprecated`, `### Security`.
   - Include "Known limitations" if shipping with caveats.
5. Bump any version constants if they exist (currently none — version is defined only by the git tag).
6. Verify `setup/install.sh` runs cleanly on a fresh clone if any installer changes were made.

## Cutting the release

```bash
# From an updated main branch
git checkout main
git pull origin main

# Make sure the tree is clean and tests pass
bash setup/check.sh --full-suite
bash tests/run-all.sh

# Tag with annotation (the message becomes the release notes preview)
git tag -a v1.1.0 -m "v1.1.0 — Summary of what's in this release

Highlight the headline features. Keep this short — the full notes
live in CHANGELOG.md."

# Push the tag (separate from pushing commits)
git push origin v1.1.0
```

If you're using GitHub releases (recommended), create one from the tag:

```bash
# Requires gh CLI
gh release create v1.1.0 --notes-from-tag
```

Or copy/paste the relevant CHANGELOG.md section into the GitHub release UI.

## Hotfix process (PATCH releases)

For an urgent fix to an already-tagged release:

```bash
# Branch from the tag, not from main (which may have unreleased work)
git checkout -b hotfix/v1.0.1 v1.0.0

# Make the fix, commit
git commit -m "fix: <what broke and how>"

# Run tests
bash tests/run-all.sh

# Merge to main
git checkout main
git merge --no-ff hotfix/v1.0.1

# Tag
git tag -a v1.0.1 -m "v1.0.1 — hotfix: <one line>"

# Push
git push origin main
git push origin v1.0.1
```

## What changed from pre-1.0.0

Before v1.0.0, the development convention was to squash all of `main` into a single `JARVIS Universal` commit on every push, then force-push. This kept the GitHub file browser clean (every row showed the same commit message) at the cost of:
- Rewriting public history every time
- Breaking any forks/clones
- Making tags impossible (a tag would point at an orphaned commit after the next force-push)

Starting with v1.0.0, history is preserved. The tradeoff: the GitHub file browser now shows a mix of "JARVIS Universal" rows (older files unchanged since v1.0.0) and per-commit messages for newer changes. That's a reasonable tradeoff for a system anyone can clone and trust to stay stable.

## Release cadence

No fixed schedule. Tag a new version when:
- Any breaking change ships → MAJOR
- A meaningful new agent or skill ships → MINOR
- A pile of small fixes accumulates → PATCH (cut every 1–2 months at most, or when something needs to ship)

There's no virtue in releasing for its own sake. Cut a tag when the system is in a state worth pinning.
