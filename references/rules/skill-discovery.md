# Skill & Agent Discovery Protocol

## The discipline

Before starting any non-trivial task — research, multi-step work, file creation, skill/agent building — run a discovery sweep across available skills, agents, plugin marketplace, MCP registry, and GitHub. **Building from scratch is the last option, not the first.**

## Why

JARVIS now has 61 skills in `skills/`, 210 skills in `skills/ecc/`, a growing `skills/learned/` corpus, 59 active agents in `.claude/agents/`, and access to the Claude Code plugin marketplace + Anthropic skills marketplace + MCP registry + the entire GitHub ecosystem (live counts: `scripts/system-stats.sh`). The probability that the thing you want to build *already exists somewhere* is very high.

When Claude skips discovery and builds from scratch, three things go wrong:

1. **Duplication** — the new thing competes with an existing thing that does it better
2. **Fragmentation** — the skill ecosystem splinters, semantic search returns conflicting hits, future agents pick the wrong one
3. **Wasted effort** — time spent building is time not spent doing the user's actual work

The discovery cost is ~2 minutes. The build cost is ~30 minutes minimum. Discovery has positive ROI even when it returns nothing.

## The protocol — run in order

### 1. Pattern-match user intent against locally available skills

- Read the `<available_skills>` block in the system prompt
- Read `CLAUDE.md`'s Active Skills Index table
- For coding work: scan `skills/ecc/` (210 technical skills)
- For learned patterns: scan `skills/learned/` (auto-generated lessons)
- If uncertain about the full inventory, call `mcp__skills__list_skills`

**Match by behavior, not just by name.** A skill called `morning-briefing` may do what the user is asking for even if they didn't say "morning briefing." A skill called `karpathy-loop` may handle "auto-research" requests even though "Karpathy" doesn't appear in the user's words.

### 2. If a skill fits, invoke it

Use the `Skill` tool. Don't paraphrase the skill's logic in chat — call the actual skill so its full prompt loads and its conventions are followed.

### 3. If no skill fits but an agent does, use the `Agent` tool

- `planner` for implementation planning
- `architect` for system design
- `code-reviewer` after writing code
- `security-reviewer` for auth/payment/user-input code
- `tdd-guide` for new features
- `Explore` for codebase navigation
- `Plan` for design tasks
- `general-purpose` for multi-step research
- Domain specialists (see `team/roster.md` and `.claude/agents/`) for everything else

### 4. If nothing fits locally, search externally

Do this **before** opening a blank file. In rough order:

- `mcp__plugins__search_plugins` — Claude Code plugin marketplace (bundled skills + agents + MCPs)
- `mcp__skills__suggest_skills` — Anthropic standalone skills marketplace
- `mcp__mcp-registry__search_mcp_registry` — MCP connectors for tool integrations
- `WebSearch` with queries like `site:github.com [topic] skill` or `[topic] claude code agent`
- `mcp__plugins__suggest_plugin_install` if a found plugin would help
- `WebFetch` on promising GitHub repos to verify they actually work

**For UI / frontend / design-engineering tasks specifically:** check the [UI Skills directory](https://www.ui-skills.com) (110+ curated `SKILL.md` skills covering accessibility, motion, frameworks, craft, and taste — by ibelick/Interface Office). Two ways to use it:
- **Install** a specific skill: `npx skills add <repo-url> --skill <name>` (drops it into `.claude/skills/`, tracked in `skills-lock.json`).
- **Route on demand** without installing: `npx ui-skills start` → `npx ui-skills categories` → `npx ui-skills list --category <x>` → `npx ui-skills get <slug>`. Prefer 1 skill, max 3.

Already installed locally: `baseline-ui`, `fixing-accessibility`, `fixing-motion-performance`, `shadcn`, `frontend-design`. Full reference + licensing note: `references/ui-skills.md`.

### 5. Build from scratch only as last resort

When the discovery sweep genuinely returns nothing useful, then build. The deliverable should document what was searched and why nothing fit — this protects against future redundant builds and gives the operator visibility.

### 6. Surface the discovery decision tree in the response

Even when building, tell the operator:

> "I searched [X, Y, Z] for existing implementations. Found [A, B] but they didn't fit because [reason]. Built from scratch."

This lets them override the choice ("actually, A is fine — use that").

## Edge cases

| Situation | Do |
|-----------|-----|
| Trivial chat reply, simple factual question | Skip discovery, just answer |
| User explicitly says "build me X from scratch" | Brief discovery for awareness; still build |
| User says "use [specific skill]" | Invoke directly, no discovery |
| Discovery would take longer than the build | Time-box to ~2 min, then build |
| Already mid-task and discovered something relevant | Stop, evaluate, switch if better |

## Triggers for full discovery sweep

- Any "build me a skill/agent/tool" request
- Any research task involving 3+ web fetches
- Any task estimated > 15 min of work
- Any time the operator asks "can JARVIS do X"
- Before invoking `skill-creator`, `skill-forge`, or `agent-builder` — the meta-builders should *use* this protocol, not skip it
- Before adding any new file to `skills/` or `.claude/agents/`

## The anti-pattern to kill

Reading the available skills list visually, deciding "nothing matches," and immediately opening a blank file. This is the failure mode that produces duplicate skills, conflicting routing, and wasted operator time.

The corrected pattern: read the list, search the marketplaces, *then* decide. The decision tree should have multiple branches checked, not one.

## Apply when

- Operator asks for a new capability
- Operator asks for help with a workflow
- A task naturally splits into "find tool" + "use tool" — always do the find pass first

## Don't apply when

- Operator explicitly waives discovery ("just write it")
- Pure conversational reply
- The task is to *modify* an existing skill, not create a new one

## Related
[[mcp-discovery]] — same principle for MCPs specifically
[[api-over-mcp]] — what to do after discovery: prefer raw APIs once tools are battle-tested
[[boring-is-beautiful]] — companion: simplest solution wins; existing solutions usually qualify
[[poc-first]] — companion: don't over-invest in building when discovery + 2-week POC of existing thing might suffice
