# Skill: Deal Closer

## Trigger
"follow up with [prospect]", "close [name]", "objection: [X]", "they went quiet", "haven't heard back", "how do I close this", "send a follow-up"

## Goal
Move a warm or proposal-stage prospect to a signed deal through structured follow-up, objection handling, and frictionless closing mechanics.

## The Closing Sequence (Post-Proposal)

### Day 0 — Proposal Sent
- Send proposal via email
- Follow immediately with SMS: "Hey [Name], just sent over a breakdown of what I'd build for [Business] — worth 2 min to look at. Happy to answer any questions."
- Tag in GHL: `proposal-sent`
- Set GHL follow-up task: Day 2

### Day 2 — First Follow-Up (Value Add)
No response yet. Send a value-add, not a "just checking in."

```
Subject: One thing I should have mentioned

Hey [Name],

Quick add to the proposal I sent — I didn't include this in the doc but worth knowing:

[INSERT ONE OF:
- "We had an HVAC client in [nearby city] go from 22% booking rate to 61% in the first 30 days."
- "The voice agent piece (Tier 2) currently costs about 8-9 cents per minute. For most clients, it pays for itself with the first 2-3 bookings it captures."
- "The deployment is usually live within 48 hours of signing — most owners see results in the first week."]

Still happy to do a quick 15-min call if that helps. [booking link]

— [Your Name]
```

### Day 5 — Second Follow-Up (Soft Urgency)

```
Subject: Re: [Business Name] proposal

[Name] — circling back one more time.

I have [2 / 1] deployment slot(s) open this month. If timing works, I'd love to get [Business Name] set up before [end of month / next season peak].

If now's not the right time, no hard feelings — just let me know and I'll reach back out in [60 days / spring / whenever makes sense].

— [Your Name]
```

### Day 10 — Final Touch (Breakup + Reopen)

```
Subject: Closing the loop

Hey [Name],

Going to close out the loop on my end — sounds like the timing might not be right.

If anything changes (busy season hits, leads start slipping through), feel free to reach back out. Happy to run a quick audit and see where we stand.

— [Your Name]
```

Tag in GHL: `closed-no-response`, set 60-day reactivation task.

## Objection Responses

### "It's too expensive / I can't afford it right now"
> "Totally fair. Can I ask — what does a booked appointment typically bring in for you? [Wait for answer.] So if this system books you 5-6 more jobs a month, it pays for itself in week one. The question isn't whether it costs $1,500 — it's whether it makes you $10K+ more."

If they're still stuck: Offer to waive deployment fee for first client (strategic, one-time, use sparingly).

### "We already have something for this"
> "Makes sense. What are you using? [Listen.] And what's your average response time to a new web lead right now? [Listen.] Most of the systems I see are set up but not actually firing — the average response time for local service businesses is still over 90 minutes. If yours is under 5 minutes, you might already be ahead. Want me to run a quick test?"

### "I need to think about it / talk to my partner"
> "Of course. What would need to be true for this to be a clear yes? [Listen.] Is it the ROI, the timing, or something about the system itself?"

Then address the actual objection, not the cover story.

### "I've tried things like this before and they didn't work"
> "I hear that — most of these systems fail because they're not configured for your specific vertical and lead source. What happened with the last one? [Listen.] That's exactly what we'd handle differently. The guarantee is also there for this reason — if you don't see 30% more booked appointments in 30 days, you get the deployment fee back."

### "Can you do a lower price?"
> "The monthly retainer is fixed — it's what makes the economics work on our end to stay responsive. But for [this month only / first client in your area], I can apply a $500 credit toward the deployment. So instead of $2,000 to set up, it's $1,500."

Use sparingly. Never discount the monthly retainer.

## Contract + Invoice Process

1. Use DocuSign (or equivalent) — send from [your-email@example.com]
2. Contract covers:
   - Services delivered (Tier 1 or Tier 2 scope)
   - Payment terms: deployment upfront, monthly recurring
   - 30-day guarantee terms
   - 30-day notice to cancel after month 3
3. Invoice via Stripe: send immediately on contract signature
4. Mark GHL contact: `closed-won`, update pipeline stage

## Close Confirmation Message (after contract signed)

```
Awesome — welcome aboard. Here's what happens next:

1. I'll confirm receipt of payment within 24 hours
2. We'll schedule a 30-min onboarding call to connect your existing setup
3. Your system goes live within 48 hours of that call
4. You'll get a status update at day 7 and a full report at day 30

Any questions between now and then — text me at [number].

Looking forward to showing you what this does.
— [Your Name]
```

## Output
- All follow-up threads logged in GHL under contact timeline
- Closed-won deals moved to onboarding pipeline in GHL
- Trigger `client-onboarding` skill on close

## Rules
- Never send a follow-up that just says "checking in" — always add value or create stakes
- Max 3 follow-up touches before breakup email — don't be annoying
- Set 60-day reactivation on all closed-no-response leads (no lead is dead forever)
- Never discount monthly retainer — only deployment fee if needed
- Log every closed deal to `logs/daily-activity.md` with revenue amount
