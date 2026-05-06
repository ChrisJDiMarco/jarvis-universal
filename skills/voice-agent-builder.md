# Skill: Voice Agent Builder

## Trigger
"build a voice agent", "set up a voice bot", "configure voice", "voice AI for [use case]", "phone agent", "AI receptionist", "Retell AI", "VAPI"

## Goal
Design and deploy a production-ready voice AI agent: persona, call script, integration with CRM/calendar, and test protocol. Works with any voice AI platform (Retell, VAPI, Bland, ElevenLabs Conversational AI).

---

## Phase 1: Scope the Agent

Answer these before writing a single line of script:

```
Use case: [inbound sales / appointment booking / support / outbound outreach / other]
Caller persona: Who calls this agent? What do they want?
Agent persona: What name, personality, voice style?
Primary goal of each call: [book appointment / qualify lead / answer questions / collect info]
Integration: What should happen at end of call? [CRM update / calendar booking / Slack alert / email]
Escalation: When does the agent hand off to a human?
Platform: [Retell / VAPI / Bland / ElevenLabs / other]
```

---

## Phase 2: Build the Persona

**Persona document:**
```
Name: [agent name]
Voice style: [warm / professional / casual / energetic]
Speaking pace: [normal / slightly slow for clarity]
Personality traits: [3 words: e.g., "friendly, direct, helpful"]
What they never say: [avoid jargon, avoid being pushy, avoid uncertainty phrases like "I think" or "maybe"]
How they handle silence: [brief acknowledgment, re-prompt]
How they handle objections: [acknowledge, reframe, continue]
```

---

## Phase 3: Write the Call Script

**Script structure:**
```
[OPENING — first 10 seconds are critical]
"Hi, this is [Agent Name] calling for [Company]. Is this [name]?
  → YES: Great! I'm reaching out about [reason]. Do you have about 2 minutes?
  → NO: My apologies — is there a better time to reach [name]?
  → VOICEMAIL: Leave short message, end call"

[CORE — varies by use case]

APPOINTMENT BOOKING:
"I'd love to get a time on the calendar for [purpose].
Are you generally more available mornings or afternoons?"
[Propose specific slots → confirm → send calendar invite]

SALES QUALIFICATION:
"Quick question — are you currently using anything for [problem]?"
[Listen → qualify → if fit: book demo / if not: politely end]

SUPPORT:
"I can help with that. Can you give me your [account info]?"
[Collect → look up → resolve or escalate]

[CLOSE]
"I've got you booked for [time] — you'll get a confirmation shortly.
Is there anything else before I let you go?"

[OBJECTION HANDLERS]
"Too busy": "Totally understand — what day next week works better?"
"Not interested": "No problem at all — good luck with [their situation]."
"Who is this again": "[name], [company], calling about [reason]."
```

---

## Phase 4: Integration Setup

At call end, trigger downstream actions:

**CRM Update (via webhook → n8n → CRM API):**
```
Call outcome: [booked / not interested / no answer / callback requested]
Key info collected: [name, email, pain point, etc.]
Next action: [what happens next automatically]
```

**Calendar Booking:**
- Connect to Google Calendar or Calendly API
- Book slot confirmed during call
- Send confirmation email automatically

**Alert on hot lead:**
- If caller expressed strong interest → alert operator via iMessage/Slack within 5 minutes

---

## Phase 5: QA Protocol

Before going live, run these tests:

| Test | Expected Result |
|------|----------------|
| Normal call — books appointment | Appointment confirmed, CRM updated |
| Caller says wrong name | Agent handles gracefully, recovers |
| Caller objects | Handles all scripted objections |
| Caller hangs up early | Logs "incomplete", no error |
| Bad audio / silence | Agent re-prompts once, ends politely if no response |
| Already existing contact | Doesn't create duplicate in CRM |

---

## Output

- Persona doc: `projects/voice-agents/[name]-persona.md`
- Call script: `projects/voice-agents/[name]-script.md`
- Integration spec: `projects/voice-agents/[name]-integration.md`
- QA results: `projects/voice-agents/[name]-qa.md`

---

## Rules
- Test with real calls (not just simulations) before going live with real callers
- Never make the agent claim to be human if directly asked
- Escalation path to a human must always exist — never trap a caller
- Record and review the first 10 calls — the real script issues only show up in production
- Build compliance notes if calling in regulated contexts (finance, healthcare, etc.)
