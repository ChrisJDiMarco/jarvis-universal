# Skill: Content Creation

## Trigger
"write a post", "draft content", "linkedin post", "reddit post", "tweet thread", "newsletter", "content for [platform]", "write an article"

## Goal
Draft platform-specific content in the operator's authentic voice that drives genuine engagement and advances their goals.

## Process

### 1. Load Operator Voice Profile
Read `memory/core.md` for:
- Tone and personality
- Industry / expertise area
- Target audience
- What to avoid (buzzwords, phrases they hate)

If no voice profile exists yet: ask "How would you describe your tone — who are you writing for, and what impression do you want to leave?"

### 2. Detect Platform + Context
- LinkedIn → professional thought leadership, first-person, ~150–250 words
- Reddit → community-native, value-first, match subreddit culture exactly
- Twitter/X → punchy numbered threads, lead with most surprising insight
- Newsletter → longer-form, relationship-building, conversational
- Blog/Article → comprehensive, SEO-aware, original perspective

### 3. Select Content Angle

**Process-led angles** (strongest for trust-building):
- "Here's exactly how I built / did / solved [thing]"
- "What I got wrong about [topic] and what I do now"
- Before/after with specific metrics

**Education angles** (strongest for awareness):
- The non-obvious thing about [topic]
- Why conventional wisdom on [topic] is wrong
- [N] things I wish I'd known about [topic]

**Story angles** (strongest for virality):
- A failure that taught me [lesson]
- The moment I realized [insight]
- Why I quit [thing] / started [thing]

### 4. Write Using the Framework
- **Hook**: First line stops the scroll. Create curiosity or surface a tension.
- **Insight**: The one thing they'll take away. One idea per post.
- **Proof**: Specific numbers, examples, screenshots, results. Never vague.
- **CTA**: Low-friction next step — comment, try it, DM, click link.

### 5. Self-Check
- [ ] Would I stop scrolling for this hook?
- [ ] Is there a specific detail (not a platitude)?
- [ ] Does it sound like the operator, not a marketing bot?
- [ ] Right length for the platform?
- [ ] Would this get genuine engagement?

If any "no" → revise.

### 6. Claim Verification
If content contains statistics, data points, or factual claims: invoke `claim-verifier` at MEDIUM strictness.

### 7. Save to owners-inbox/content/

## Rules
- Avoid: "game-changer," "unlock," "leverage," "dive deep," "at the end of the day," excessive exclamations
- Reddit: research the subreddit tone before writing — mismatch = instant downvotes
- LinkedIn: max 3 hashtags, use sparingly
- Never publish without saving to `owners-inbox/content/` for operator review
- "Post your process, not your product"
- For any platform: include suggested posting time in the draft

---

## Related
[[core]]  [[soul]]  [[context]]  [[weekly-review]]
