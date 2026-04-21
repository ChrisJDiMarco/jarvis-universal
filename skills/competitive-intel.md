# Skill: Competitive Intelligence Harness

## Trigger
"research [company]", "competitive brief on", "intel on [competitor]", "analyze [competitor]", "what is [company] doing", "who are my competitors", "competitive landscape"

## Goal
Produce a validated, source-backed competitive intelligence brief using a phased research loop — no hallucinated pricing, no fabricated features. Every claim is traceable.

---

## Phase Loop Architecture

```
SCOPE → COLLECT → VALIDATE → SYNTHESIZE → DELIVER
            ↑_________|
        (re-collect if data is thin)
```

---

## Phase 1: SCOPE

Define what intelligence is actually needed:

1. **Subject**: Who/what is being researched (company, product, person, movement)
2. **Purpose**: What decision does this intel inform? (positioning, pricing, feature roadmap, sales strategy)
3. **Intel categories needed** (select applicable):
   - Positioning / messaging
   - Pricing and packages
   - Feature set
   - Target market / ICP
   - Content and SEO strategy
   - Funding / growth trajectory
   - Weaknesses / gaps
   - Customer sentiment (reviews, forums, social)

---

## Phase 2: COLLECT (Firecrawl-first)

**Source priority:**
1. `firecrawl_scrape` — their homepage, pricing page, about, blog
2. `firecrawl_search` — "[company name] pricing", "[company name] vs [us/alternative]", "[company name] review"
3. `firecrawl_scrape` — G2, Capterra, Trustpilot, ProductHunt reviews
4. `firecrawl_search` — "[company name] funding", "[company name] news", Reddit/forum mentions
5. `firecrawl_scrape` — LinkedIn company page for team size, hiring signals, positioning

**Rules:**
- Minimum 8 distinct sources before proceeding
- Save raw content: `data/research/[slug]-raw/[source-N].md`
- Note: scrape date on every source (pricing changes, messaging changes are time-sensitive)
- If a page is gated or blocked: note it, move on — don't hallucinate the content

---

## Phase 3: VALIDATE

Cross-check key claims before putting them in the brief:

| Claim Type | Validation Method |
|-----------|-------------------|
| Pricing | Must appear on their actual pricing page OR in a dated source — no estimations |
| Feature claims | Must be on their site or in their docs — no inference |
| Customer count/revenue | Must be from a press release, funding announcement, or credible news |
| Review sentiment | Pull actual review snippets, not paraphrases |
| Team size | LinkedIn headcount, not estimates |

**Unverified claims → mark as UNVERIFIED or remove**

---

## Phase 4: SYNTHESIZE

Structure findings as:

1. **Who they are**: One-paragraph summary — what they do, for whom, at what price
2. **How they position**: Key messaging themes, value props, tone
3. **Pricing**: Actual tiers and prices (with scrape date) — UNVERIFIED if not on their site
4. **Feature set**: What they offer — organized by category
5. **Strengths**: What they do well (with evidence)
6. **Weaknesses / Gaps**: What they don't do, complaints from reviews, missing features
7. **Who they're targeting**: ICP signals from their marketing
8. **Recent moves**: Funding, product launches, partnerships, hiring signals
9. **Opportunity**: Based on their gaps — where can you differentiate?

---

## Phase 5: DELIVER

Save to `owners-inbox/research/competitive-[subject]-[date].md`

**Header block:**
```
# Competitive Brief: [Subject]
Date: [date] | Sources: [N] | Verified data only: [YES/PARTIAL/NO]
```

**Pricing / claims confidence:**
- ✅ VERIFIED — seen on their site or dated source
- ⚠️ UNVERIFIED — inferred or from third-party, not confirmed
- ❌ NOT FOUND — couldn't locate this information

---

## Rules
- Never hallucinate pricing. If you can't find it, say "pricing not publicly available"
- Always timestamp pricing data — it goes stale fast
- The "Weaknesses / Gaps" section is mandatory — it's the most actionable section
- Cross-reference reviews from multiple platforms — a company with 5 stars on one site and 2 stars on another is a red flag worth surfacing
- Flag if research surfaced something surprising — surprises are often the highest-value intel

---

## Related
[[researcher-deep]]  [[deep-search]]  [[claim-verifier]]  [[context]]
