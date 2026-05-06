# Skill: Case Study Generator

## Trigger
"build a case study", "results from [client]", "write up [client]'s results", "turn this into a case study", "we got results for"

## Goal
Convert a client's before/after results data into a compelling, shareable case study that fuels future cold outreach and content.

## Required Inputs (collect before running)

1. Client name (or pseudonym if they prefer anonymity)
2. Vertical (HVAC, roofing, dental, etc.)
3. Geography (city/region — keep vague if client prefers)
4. Before metrics:
   - Average response time to new leads
   - Monthly booked appointments (baseline)
   - Lead volume per month
   - Close rate / booking rate
5. After metrics (30-day mark minimum):
   - New average response time
   - Booked appointments in period
   - Any specific revenue tied to new bookings
6. One quote from the client (ideal) — even a paraphrase from a text/call works
7. Any standout moment (e.g., "they booked a $4,200 job at 11pm on a Saturday")

Save inputs to: `data/case-studies/[client-slug]-raw.md`

## Case Study Template

Save output to: `owners-inbox/case-studies/[client-slug]-case-study.md`

```markdown
# How [Business Name / "A [City] HVAC Company"] Increased Booked Appointments by [X]% in 30 Days

**Vertical**: [HVAC / Roofing / Plumbing / etc.]
**Location**: [City, State]
**System**: Speed to Lead (Tier [1/2])

---

## The Problem

[Business Name] was running solid marketing — Google Ads, organic traffic, referrals — but leads were slipping through the cracks.

When someone filled out their contact form after hours or on weekends, they'd get a callback the next business day. By then, most had already called someone else.

Their booking rate from web leads was sitting at [X]%. Industry average for businesses running automated follow-up is [55-65]%.

> "[Client quote about the frustration — e.g., 'We were spending $2K a month on ads and probably losing half the leads we were paying for.']"

---

## The Fix

We deployed the Speed to Lead system in 48 hours:

- **Instant response**: Every new web lead receives a personalized SMS + email within 60 seconds, 24/7
- **7-touch follow-up**: Non-responders enter a 72-hour automated sequence (SMS + email)
- **Direct booking**: Leads can book directly on the calendar without a phone call
- **No-show recovery**: Missed appointments trigger an automatic re-engagement sequence
[If Tier 2: - **AI voice agent**: Incoming calls are handled by an AI that answers questions and books appointments live]

---

## Results (30 Days)

| Metric | Before | After | Change |
|--------|--------|-------|--------|
| Avg. response time | [e.g., 4.5 hours] | [e.g., 47 seconds] | [99% faster] |
| Booked appointments/month | [X] | [Y] | [+Z%] |
| Booking rate from web leads | [X%] | [Y%] | [+Z pts] |
| After-hours bookings captured | ~0 | [X] | New revenue stream |

**Revenue impact**: [X] additional booked jobs × $[avg job value] = **$[total] in new revenue** in the first 30 days.

> "[Client quote about results — e.g., 'We booked a $4,200 job at 11pm on a Saturday. That's money we would have left on the table.']"

---

## What Came Next

[One sentence on the ongoing relationship — e.g., "They've since upgraded to Tier 2 to handle inbound calls during peak season."]

---

*Interested in similar results for your [vertical] business? [Book a 15-min call →](booking link)*
```

## Short-Form Version (for cold outreach + LinkedIn)

```
Quick case study from last month:

[Vertical] business in [city]. Was responding to web leads in ~[X hours].
After installing Speed to Lead: 47-second average response.
Booked appointments up [X]% in 30 days.

One job they almost missed: a [job type] request came in at [time].
System texted the lead in 42 seconds. Booked. $[value] job.

That's the gap we close.
```

## Distribution Checklist

After generating the case study:
- [ ] Save full version to `owners-inbox/case-studies/`
- [ ] Save short version to `assets/social-proof/`
- [ ] Add to cold outreach templates (reference in Day 2 follow-up)
- [ ] Queue for LinkedIn post (trigger `content-creation` skill)
- [ ] Add data point to proposal template (`skills/proposal-generation.md`)
- [ ] Update `memory/agency.md` with latest client result

## Rules
- Always anonymize if client hasn't explicitly approved using their name
- Lead with the dollar amount or appointment count — not the tech
- The standout story (Saturday night booking, etc.) is the headline — use it
- Never fabricate numbers — use actuals or don't publish
- Minimum data requirement: before booking rate + after booking rate + time period
