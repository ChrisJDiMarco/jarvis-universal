# UI Skills — Design-Engineering Skill Directory (Reference)

> Source: [ui-skills.com](https://www.ui-skills.com) + [github.com/ibelick/ui-skills](https://github.com/ibelick/ui-skills), captured 2026-06-16.
> By ibelick (Interface Office). A curated directory of **110+ design-engineering skills** in the standard Anthropic `SKILL.md` format — the same format Claude Code auto-discovers from `.claude/skills/`.
> License: ibelick's repo is MIT. The directory **aggregates third-party authors** (Anthropic, Vercel, shadcn, Microsoft, Emil Kowalski, Paul Bakaus, etc.) under their own licenses — check per-skill before commercial use. Same caution as [[huashu-design]].

---

## What it is

A directory of frontend **code-craft** skills: Tailwind/React/motion/a11y constraints, "deslopping," performance audits, framework best-practices, and design-taste rulesets. Complements JARVIS's existing visual-design stack (`elite-web-ui`, `experimental-ui-styles`, `huashu-design`) rather than duplicating it — those are visual/pipeline; UI Skills is production code quality.

## Two ways to use it

**1. Install a specific skill** (drops into `.claude/skills/`, tracked in `skills-lock.json`):
```bash
npx skills add <repo-url> --skill <name>      # e.g. https://github.com/ibelick/ui-skills --skill baseline-ui
```

**2. Route on demand without installing** (the intended pattern — "ask your agent to run the CLI first"):
```bash
npx ui-skills start                # router entry point (the ui-skills-root skill)
npx ui-skills categories           # list categories
npx ui-skills list --category <x>  # browse a category
npx ui-skills get <slug>           # load one skill's context
```
Selection rule: prefer 1 skill, 2 for two clear angles, max 3.

Topics: Accessibility · Motion · Systems · Visual · Interaction · Performance · Craft · Taste · Typography · Color · Frontend · Tooling · Architecture · Testing.

## Installed locally (2026-06-16)

| Skill | Source repo | Use for |
|-------|-------------|---------|
| `baseline-ui` | ibelick/ui-skills | Deslop pass — opinionated MUST/SHOULD/NEVER ruleset for spacing, hierarchy, typography, motion, layout |
| `fixing-accessibility` | ibelick/ui-skills | Audit + fix ARIA, keyboard nav, focus, contrast, form errors; WCAG review |
| `fixing-motion-performance` | ibelick/ui-skills | Fix animation jank — layout thrashing, compositor props, scroll-linked motion, blur |
| `shadcn` | shadcn-ui/ui | Project-aware shadcn/ui workflow — search, add, compose, fix components (multi-file: `rules/`, `cli.md`, etc.) |
| `frontend-design` | anthropics/skills | Anthropic's own — distinctive, production-grade, anti-generic frontend interfaces |

They resolve through `.claude/skills/` (the ibelick three are symlinks into `.agents/skills/`; shadcn + frontend-design are copied dirs).

## How they're wired into JARVIS

- **Routing** — `CLAUDE.md` Context Auto-Detection has rows: UI deslop/polish → `baseline-ui`; UI accessibility → `fixing-accessibility`; UI motion performance → `fixing-motion-performance`; shadcn/ui work → `shadcn`; distinctive frontend → `frontend-design`; plus a "no local match → `npx ui-skills start`" fallback.
- **Discovery** — `references/rules/skill-discovery.md` step 4 registers the directory so any UI/frontend task checks it before building from scratch.
- **web-designer agent** — roster row points at these for code craft.
- **React + shadcn apps** — pair your component output with `baseline-ui` + `shadcn` + `fixing-motion-performance` (React + shadcn + Tailwind + motion stack).

## Install gotchas (learned 2026-06-16)

- `--skill` does **not** accept comma-separated values — repeat the flag: `-s a -s b -s c`.
- Agent key for Claude Code is `claude-code`, **not** `claude`. Scope installs with `-a claude-code -y` to avoid the CLI fanning out to ~14 detected agents.
- In restricted/sandboxed filesystems the multi-agent symlink step can `EPERM`. Source files still land in `.agents/skills/<name>/`; if the `.claude/skills/` symlink is missing, create it manually: `ln -s ../../.agents/skills/<name> .claude/skills/<name>`.

## Manage

```bash
npx skills list                    # what's installed
npx skills update [name]           # update to latest
npx skills remove <name>           # uninstall
npx skills add <repo> --list       # list available skills in a repo without installing
```

## Related
[[skill-discovery]] · [[huashu-design]] · [[api-over-mcp]] · web-designer agent · frontend-design
