# Skill: SEO Content Engine

## Trigger
"SEO content", "blog automation", "run my content plan", "keyword gaps for [site]", "SEO for [site]", "content calendar", "blog posts for [site]", "keyword research"

## Goal
Run a structured SEO content pipeline: competitor gap analysis → keyword targeting → article outline/draft → (optional) publish automation. Works for any site regardless of CMS.

---

## Phase 1: Competitor Gap Analysis

**Input**: Your site URL + 2–3 competitor URLs

**Process:**
1. `firecrawl_map` your site → get full URL list
2. `firecrawl_map` each competitor → get their URL list
3. `firecrawl_search` for "[competitor] site:their-domain" to find their top content
4. Identify: keyword clusters your competitors rank for that you don't
5. Identify: content types they have that you're missing

**Output**: `owners-inbox/research/seo-gap-[site]-[date].md`
```
## SEO Gap Analysis: [Site]
**Competitors analyzed**: [list]
**Your estimated coverage**: [topics you cover]
**Gaps identified**: [topics they rank for, you don't]
**Recommended priority**: [sorted by: high traffic potential + low difficulty]
```

---

## Phase 2: Keyword Targeting

For each gap, identify the bottom-funnel keyword cluster:

**Bottom-funnel priority order:**
1. "[product/service] vs [alternative]" — highest buyer intent
2. "[product/service] review" — late-stage research
3. "best [category] for [use case]" — comparison shoppers
4. "how to [specific task] with [product]" — existing users / integrators
5. "[product] alternative" — switching intent

**Avoid top-funnel generic terms** unless you're targeting brand awareness — they're expensive to rank for and convert poorly.

---

## Phase 3: Article Generation

For each target keyword:

**Article structure (proven template):**
```
Title: [Keyword] — [Unique Angle or Year]
Meta description: [120 chars — include keyword, one value prop]

H1: [Same as title or close variant]

## What is [topic]? (if broad keyword — skip for specific)
[2-3 paragraphs, define clearly]

## [Core value proposition section]
[Meat of the article — specific, actionable, detailed]

## [Comparison / alternatives / how-to section]
[Addresses the specific intent behind the search]

## [Social proof / examples / case studies]
[Real examples with specifics]

## Frequently Asked Questions
[5–8 questions that match People Also Ask / long-tail variants]

## Conclusion
[Summary + clear CTA]
```

**Quality checklist before saving:**
- [ ] Keyword appears in title, first 100 words, and at least 2 headings
- [ ] Article is at least 1,200 words (1,800+ for competitive terms)
- [ ] Includes at least 3 specific examples or data points
- [ ] Answers the search intent completely — would a reader need to go elsewhere?
- [ ] Internal links to 2–3 related pages on your site
- [ ] External links to 1–2 authoritative sources

---

## Phase 4: Publishing (Optional)

If the operator has connected a CMS:
- **WordPress**: Use REST API or Desktop Commander to create draft
- **Ghost**: Use Ghost Admin API
- **Webflow**: Export content for manual upload
- **Notion → CMS**: Write to Notion, trigger export workflow if configured

Default: Save article to `owners-inbox/content/seo-[keyword]-[date].md` for operator to publish.

---

## Phase 5: Content Calendar

Generate a publishing schedule based on:
- Number of articles planned
- Publishing frequency (1/week, 2/week, etc.)
- Priority order from Phase 2

Output: `projects/seo-content/calendar-[date].md`

```
| Week | Target Keyword | Article Title | Status | Publish Date |
|------|---------------|---------------|--------|--------------|
| 1 | [keyword] | [title] | draft | [date] |
...
```

---

## Rules
- **Never publish without operator review** — SEO content reflects brand voice
- Quality beats quantity — one excellent 2,000-word article beats five thin ones
- Update articles every 12 months — stale content loses rankings
- Track which articles are published in `projects/seo-content/` for performance review
- Run `claim-verifier` at MEDIUM strictness on any statistics in articles
