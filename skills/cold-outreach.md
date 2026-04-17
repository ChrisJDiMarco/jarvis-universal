# Skill: Cold Outreach

## Trigger
"write outreach", "start a sequence", "prospect [vertical]", "send cold email", "reach out to", "build outreach for"

## Goal
Execute top-of-funnel prospecting from raw vertical → enriched lead list → personalized outreach copy ready to push into GHL.

## Phase 1: Prospect Pull

1. Identify target vertical + geography (default: Philly metro, expand from there)
2. Use Apify to scrape Google Maps / local business directories:
   - Search: `[vertical] [city]` e.g., "HVAC Philadelphia"
   - Extract: business name, phone, website, Google review count + rating
3. Score each prospect using `skills/prospect-scoring.md`
4. Filter: keep HOT (8-10) and WARM (5-7) only
5. Save raw list to `data/prospects/[vertical]-[date].csv`

## Phase 2: Lead Enrichment

For each scored lead:
1. Use `firecrawl_scrape` on their website — check for: chat widget, contact form, booking tool, after-hours messaging. Faster and more reliable than Chrome for bulk enrichment.
2. Note the **specific gap** (this becomes the outreach hook)
3. Check Google Business: response rate, reviews mentioning slow follow-up
4. Flag the single most compelling gap per lead

Common gaps (apply to any vertical):
- No after-hours response or chat widget
- No instant follow-up after form fill
- After-hours calls go to voicemail with no follow-up text
- No appointment reminder or no-show recovery
- No lead nurture sequence after initial inquiry
- No SMS confirmation after booking

## Phase 3: Outreach Copy

### Cold Email Template

```
Subject: [Business Name] — saw something on your site

Hey [Owner First Name],

Checked out [Business Name] — you're clearly doing solid work (the reviews back it up).

One thing I noticed: [SPECIFIC GAP — e.g., "there's no way for someone visiting after hours to book or get a response until morning"].

I run an AI automation system for [vertical] businesses in the area. It responds to every new lead within 60 seconds via text and email — 24/7 — and books them directly on your calendar.

Most owners we work with see 30–40% more booked appointments in the first month.

Worth a 15-min call to see if it's a fit?

— [Your name]
[Your business name]
[phone] | [booking link]
```

### LinkedIn DM Template (shorter)

```
Hey [Name] — noticed [Business Name] doesn't have after-hours lead capture set up. I help [vertical] owners automate that — response in 60 seconds, 24/7. Want to see how it works for your setup? Takes 15 min.
```

### Cold Call Opening

```
"Hey, this is Chris — I work with [vertical] companies in [city] to help them respond to leads faster. I looked at your site and noticed [GAP]. Is that something you've thought about solving?"
```

## Phase 4: Push to GHL

1. Create contact in GHL with: name, business, phone, email, vertical, score, gap noted
2. Tag: `cold-outreach`, `[vertical]`, `[score: hot/warm]`
3. Enroll in appropriate GHL sequence:
   - HOT leads: Priority Outreach sequence (calls + texts within 24h)
   - WARM leads: Email Drip sequence (7-day automated email cadence)
4. Set follow-up task in GHL for Chris review if no response in 72h

## Output
- Prospect CSV saved to `data/prospects/`
- Outreach copy saved to `owners-inbox/outreach/[vertical]-[date]-outreach.md`
- Contacts pushed to GHL with tags and sequences enrolled

## Rules
- Never send without a specific gap identified — generic outreach gets ignored
- Personalize the hook per lead — do not batch-blast identical copy
- ICP is vertical-agnostic: any service business with employees, wanting more work, with minimal web presence qualifies
- Max 50 cold emails/day to avoid spam filters
- Always CC the operator's primary email on outreach threads
- Save all templates used to `assets/outreach-templates/`
