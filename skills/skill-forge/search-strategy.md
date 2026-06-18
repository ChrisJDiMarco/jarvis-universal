# Search Strategy — Phase 1

**Goal**: Generate 15–25 well-reasoned, *diverse* search queries that will pull in maximum signal from the open web, Anthropic docs, GitHub, and adjacent skills. Diversity matters more than depth — five great queries across five dimensions beat twenty-five variations of one query.

**Output**: `owners-inbox/skill-forge/[slug]-[date]/search-plan.md` using `templates/search-plan.template.md`.

---

## The Core Idea — Cover the Five Dimensions

Most domains have a small number of canonical "angles" that, taken together, capture nearly all the practitioner knowledge worth knowing. We use five:

| Dimension | Question it answers | Why it matters |
|-----------|---------------------|----------------|
| **Core domain** | What is this thing? Authoritative definitions, scope, mental models, history. | Without this, the skill misuses terminology and feels amateur. |
| **Best practices** | How do experts actually do this in production? | The skill needs concrete *how*, not just *what*. |
| **Failure modes** | What goes wrong? Anti-patterns, common mistakes, debugging horror stories. | The Rules / Hard Stops section comes from here. Half the value of a skill is preventing known mistakes. |
| **Tooling & libraries** | What concrete tools, libraries, MCP servers exist? Which are battle-tested vs. abandonware? | The skill should reference real tools by name, not generic placeholders. |
| **Adjacent / competitive** | What alternatives exist? When is this approach the wrong fit? | Helps the skill know its own scope — when to defer to a different skill or tool. |

Generate 3–5 queries per dimension (2–4 for adjacent/competitive). Total target: **15–25 queries**.

---

## Query-Crafting Heuristics

For each dimension, vary the angle. Here are the angles that consistently pull diverse signal:

### Angle 1 — Year-bounded for recency
*"X best practices 2026"* / *"modern X patterns"* / *"latest approach to X"*

This filters out outdated material. Especially important for fast-moving domains (LLM tooling, frontend frameworks, security practices). For stable domains (data structures, classical algorithms), skip this angle — recency is irrelevant.

### Angle 2 — Comparison for tradeoff exposure
*"X vs Y"* / *"alternatives to X"* / *"when to use X over Y"*

Comparisons surface tradeoffs better than monolithic articles. Two competitors arguing in the same article gives you both sides of the design space.

### Angle 3 — Failure-flavored for guardrails
*"common mistakes when X"* / *"X anti-patterns"* / *"why X fails in production"* / *"X postmortem"*

These pull from blog posts, conference talks, and practitioner threads. Fertile ground for the skill's Rules section.

### Angle 4 — GitHub-flavored for real implementations
*"X site:github.com"* / *"X stars github"* / *"awesome-X github"*

Real implementations beat theoretical articles. Look for repos with 1k+ stars and recent commits — those have battle-tested patterns.

### Angle 5 — Forum-flavored for unfiltered practitioner takes
*"X reddit"* / *"X HackerNews"* / *"X discussion thread"*

Forums surface what blogs sanitize: the actual frustrations, edge cases, and "this didn't work as advertised" stories.

### Angle 6 — Specificity dial
For each query, ask: *would adding the operator's tech stack help?* Sometimes yes (*"caching strategies for Next.js 14"*), sometimes no (*"caching strategies"*). General-first, then specific. Both are valuable for different reasons.

---

## Reasoning Template — Apply to Every Query

Before writing a query, write a one-line rationale. Force yourself to articulate *why this query specifically*. If you can't, the query is filler — drop it.

Example, for a hypothetical "caching-strategies" skill:

| Dimension | Query | Rationale |
|-----------|-------|-----------|
| Core domain | "cache invalidation patterns" | Need authoritative definitions of read-through, write-through, write-back, etc. |
| Core domain | "CAP theorem and caching" | Frames caching choices in distributed systems terms. |
| Best practices | "production caching patterns 2026" | Recent practitioner consensus on what works at scale. |
| Best practices | "cache-aside vs read-through pros and cons" | Comparison surfaces tradeoffs explicitly. |
| Failure modes | "thundering herd cache stampede" | Specific named failure mode with rich literature. |
| Failure modes | "cache invalidation horror stories reddit" | Forum-flavored — unfiltered war stories. |
| Tooling | "redis vs memcached vs dragonfly" | Concrete tool comparison. |
| Tooling | "awesome-caching github" | Curated list = curated tool surface. |
| Adjacent | "when not to use a cache" | Boundary — when is the whole approach wrong? |

This kind of explicit rationale turns query-writing from a vibes exercise into a deliberate one.

---

## Query Anti-patterns — Don't Do These

| Anti-pattern | Why it fails |
|--------------|--------------|
| Same dimension, repeated: *"caching"*, *"cache strategies"*, *"how to cache"* | These hit the same articles. Diversity is across dimensions, not synonyms. |
| Too long / too natural-language: *"What are the best ways to handle caching when you have a high-traffic web application that needs..."* | Search engines rank these worse than terse queries. Cut to the keywords. |
| Operator-name-specific without need: *"caching for the operator's internal app"* | The web has no idea who the operator or this app is. Strip personal context unless the skill genuinely is operator-specific. |
| Pure jargon nobody searches: *"L1/L2 cache hierarchy ARM64"* if the skill is web caching | Wrong domain. Stay in the operator's domain. |
| Already-answered queries: *"what is HTTP"* | Don't query for things that are common knowledge. Aim queries at where signal density is highest. |

---

## How Many Queries Per Source

The 15–25 total queries get distributed roughly:

- **Web (firecrawl_search)**: 8–12 queries — broadest, highest yield
- **Anthropic docs**: 2–3 targeted queries (*"Claude best practices [topic]"*, *"prompt engineering [topic]"*)
- **GitHub code search**: 3–5 queries — shorter, more keyword-flavored (real code finds real patterns)
- **Local skills (~/jarvis/skills/)**: 1–3 grep/glob queries to find adjacent existing skills

You don't need 5 queries per source. You need *the right query per source* — Anthropic docs only has so much content; GitHub code search wants different syntax than Google.

---

## Output Format

Write the search plan to `search-plan.md` using `templates/search-plan.template.md`. Structure:

```markdown
# Search Plan: [skill-name]
Date: [YYYY-MM-DD] | Target source mix: web=N, docs=N, github=N, local=N

## Dimension 1 — Core Domain (N queries)
| Query | Source | Rationale |
|-------|--------|-----------|
| ... | firecrawl_search | ... |

## Dimension 2 — Best Practices (N queries)
...

## Dimension 3 — Failure Modes (N queries)
...

## Dimension 4 — Tooling (N queries)
...

## Dimension 5 — Adjacent / Competitive (N queries)
...

## Total: NN queries (target: 15–25)
```

---

## Self-Check Before Moving On

Before exiting Phase 1, verify:

- [ ] All 5 dimensions have at least 2 queries
- [ ] Total is 15–25 (not 5, not 50)
- [ ] Each query has a one-line rationale
- [ ] Source allocation is sensible (most queries on firecrawl, a few on each other source)
- [ ] No duplicate queries
- [ ] No "synonym variations" (different words, same intent)
- [ ] Failure-mode dimension has at least one forum-flavored query
- [ ] Tooling dimension names at least 2 specific candidate tools/libraries to investigate

If any check fails, revise the plan before launching Phase 2.

---

## When to Skip Phase 1

Almost never. Even when the operator says "I already know everything about this," running Phase 1 + 2 surfaces something they didn't know — that's the value. The cost is ~5 minutes. The cost of skipping is a generic, derivative skill.

The only legitimate skip: the operator hands you a complete, well-structured doc and says *"turn this into a skill, no research needed."* In that case, hand directly to `anthropic-skills:skill-creator` and skip skill-forge entirely.

---

## Related

[[part-of::skill-forge]]  [[preceded-by::intake-protocol]]  [[followed-by::fanout-protocol]]
