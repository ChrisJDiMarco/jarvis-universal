# Skill: Subreddit Outreach Campaign

## Trigger
"post to [subreddit]", "plan a campaign for r/", "subreddit campaign", "find a subreddit to post to", "build a tool for r/"

## Goal
Execute a full subreddit outreach campaign: identify the right community, build a tailored free tool or piece of content, write a post that fits native culture, publish, and track performance.

## Proven Model
- Complex, impressive free tools (deep domain knowledge embedded) drive the best engagement
- Post the process/tool, not an ad — native value first
- Target communities that have a recurring "I wish I had a tool for X" pain
- Aim: 2-3 posts per week across different subreddits

## Phase 1: Subreddit Selection

Criteria for a good target:
- 50K+ subscribers (enough reach)
- Active daily posts (not dead)
- Community has a recurring information or research need
- Not overly restrictive about tool sharing (check sidebar rules)
- Has shown appetite for AI/tool posts before (search "tool" or "app" in subreddit)

Good subreddit categories for the tool:
- Research/analysis communities: r/UFOs, r/finance, r/investing, r/MachineLearning, r/datascience
- Hobbyist research: r/genealogy, r/history, r/AskHistorians, r/Astronomy
- Professional tools: r/legaladvice, r/marketing, r/entrepreneur, r/startups
- Niche obsessives: r/formula1, r/nba, r/fantasyfootball, r/DnD
- Health/wellness: r/nutrition, r/Fitness, r/loseit, r/ADHD

Avoid: r/artificial, r/ChatGPT (oversaturated), any sub with "no self-promotion" rules for tools

## Phase 2: the tool Design

Design principle: **The the tool should do something the subreddit community genuinely wishes existed.**

Brainstorm prompt:
> "What does someone in r/[subreddit] research, track, or try to understand that currently takes hours or requires multiple tools?"

High-engagement the tool patterns:
- Deep-dive analyzer (e.g., analyze a company, analyze a flight record, analyze a medical study)
- Pattern finder across a dataset (e.g., historical UFO report patterns, stock earnings patterns)
- Community-specific assistant (e.g., a DnD encounter builder, a fantasy sports trade analyzer)
- Research aggregator (e.g., pull together everything known about a topic)

Complexity target: aim for 800+ lines of the tool instructions — complexity signals quality

Save design brief to: `projects/thinklet/subreddit-campaigns/[subreddit]-brief.md`

## Phase 2.5: Video Demo (Optional but High-Impact)

For high-priority campaigns, build a 30-40s demo video using the `remotion-demo-builder` skill before writing the post.

**Why**: Video posts on Reddit get significantly higher engagement than text+image. A well-executed demo video showing the the tool working on a real query is the single most compelling piece of content you can post.

**What to show**:
1. Landing on the the tool (app UI visible)
2. Entering a query the subreddit community would recognize immediately
3. The output being generated — show the most impressive part
4. End on the result — let the quality speak for itself

**When to use it**: Any campaign targeting 100K+ subscriber subreddits, or any subreddit where competitors post screen recordings. Skip for smaller/test campaigns.

Trigger: "build a demo video for this subreddit post" → `remotion-demo-builder` skill

## Phase 3: Post Writing

### Post Title Formulas (use native subreddit language)
- "I built a tool that [does the thing they care about] — [interesting result or claim]"
- "After [X hours/months] of research, I built an AI that [specific capability]"
- "Frustrated with [recurring community pain], so I made this — [brief description]"
- "[Specific use case] the tool — built for r/[subreddit] specifically"

### Post Body Template

```markdown
[Open with the community pain or story — 2-3 sentences that show you understand this community]

So I built a tool for exactly this.

**What it does:**
[3-4 bullet points — specific capabilities, not vague claims]
- [Capability 1]
- [Capability 2]
- [Capability 3]

**How I built it:**
[1 paragraph on the process — show your work, this builds credibility]
[Mention: context files, instruction complexity, what makes it not just a basic ChatGPT wrapper]

**Try it here:** [the tool link]

[Optional: show a specific example output that's impressive]

Happy to answer questions about how it works or what else it could do. Also open to feedback from people deep in this topic — you'd know better than me if I got anything wrong.
```

### Rules for Post Body
- Always lead with the community's problem, not your product
- Show the process — builders and researchers love seeing the "how"
- Include a real example output in the post or comments
- Be humble and invite criticism — it sparks engagement
- Never use marketing language ("revolutionary", "game-changing", "powerful AI")

## Phase 4: Publish & Engage

1. Post at peak subreddit times (check r/[subreddit] analytics — usually Tue-Thu, 9am-1pm EST)
2. Within first hour:
   - Respond to every comment (engagement velocity drives Reddit algorithm)
   - Add a top-level comment with an example use case if not in OP
3. If post gains traction (50+ upvotes in 2h): notify Chris via iMessage
4. Pin a comment with a "how to use it" walkthrough if it gets big

## Phase 5: Track Performance

Log to `projects/thinklet/subreddit-campaigns/performance-log.md`:

| Date | Subreddit | Post Title | Upvotes | Comments | New the tool Users | Notes |
|------|-----------|------------|---------|----------|-------------------|-------|
| [date] | r/[sub] | [title] | [X] | [X] | [X] | |

Review after 48h. If performance < 20 upvotes: analyze why in the log (wrong subreddit? wrong title? wrong timing? wrong the tool?).

## Phase 6: Repurpose Wins

If a post hits 100+ upvotes:
- Screenshot + repurpose as LinkedIn post (trigger `content-creation` skill)
- Mention in the tool newsletter / update
- Use the community feedback to improve the the tool
- Build a similar the tool for an adjacent subreddit

## Output
- Post draft saved to `owners-inbox/thinklet-posts/[subreddit]-[date].md`
- Performance tracked in campaign log
- Chris notified via iMessage when post is live

## Rules
- Read sidebar rules before posting — never get banned
- Never post the same the tool to multiple subreddits without customization
- Engage authentically in the thread — do not use bot-like responses
- If a subreddit removes the post, log the reason and adjust approach
- Target: 2-3 new subreddit posts per week
