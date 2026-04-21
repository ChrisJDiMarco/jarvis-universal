# Skill: Prospect Scoring

## Trigger
"score prospects", "qualify leads", "rate this prospect", "how hot is this lead"

## Goal
Score agency prospects on a 0-10 scale based on likelihood of closing and lifetime value.

## Scoring Criteria (Binary — yes = points, no = 0)

| Signal | Points | How to Check |
|--------|--------|--------------|
| No chat widget on website | +2 | Visit site |
| No after-hours answering/message | +3 | Call after 6pm |
| High review count (50+) with responsiveness complaints | +3 | Google Business |
| Running Google/Facebook ads | +2 | Check ads library or site pixels |
| Multi-location or franchise | +1 | Google Maps |
| Revenue > $500K/year (estimated) | +1 | Team size, truck count, office |
| Owner-operated (decision maker accessible) | +1 | Website about page |

## Score Interpretation
- 8-10: HOT — prioritize immediate outreach
- 5-7: WARM — include in email sequence
- 3-4: COOL — nurture, check back in 30 days
- 0-2: SKIP — not a fit right now

## Process
1. Receive prospect data (name, website, vertical, location)
2. If website provided: check for chat widget, after-hours info, ad pixels
3. Check Google Business Profile: review count, rating, responsiveness mentions
4. Calculate score
5. Save to agency_clients table with score + notes
6. If score ≥ 8: flag in owners-inbox with "HOT LEAD" prefix

## Rules
- Binary scoring only — no subjective "feels like a good fit"
- Always record the specific gap identified (the hook for outreach)
- Never inflate scores — false positives waste the operator's time on bad calls
