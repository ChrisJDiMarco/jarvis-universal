# Skill: Morning Briefing

## Trigger
"morning briefing", "come online", "good morning", "what's on today", "daily update", "what's happening today"

## Goal
Deliver a comprehensive but concise briefing so the operator starts the day with full context in under 2 minutes of reading.

## Process

### 1. Calendar (via Google Calendar MCP)
- Pull today's events
- Flag any meetings in the next 2 hours needing prep
- Note any conflicts or gaps in the schedule

### 2. Goals & Progress (via SQLite or memory/context.md)
- Check current goal progress against targets
- Flag anything off-track or overdue

### 3. Pipeline / Active Projects (based on archetype)
- Business: leads by stage, follow-ups due today, overdue items
- Creator: content pipeline, publishing schedule
- Developer: active PRs, blocked tickets, deployment status
- Freelancer: active projects, deadlines, invoices pending
- Student: assignments due, exam prep needed
- Any: check for items with today's deadline

### 4. Inbox Scan
- Check `owners-inbox/` for pending reviews
- Check `team-inbox/` for new files needing processing
- Count unreviewed items

### 5. Memory Refresh
- Read `memory/decisions.md` for recent decisions
- Read `memory/learnings.md` for any new rules

### 6. Synthesize and Deliver

## Output Format
```
☀️ MORNING BRIEFING — [date]

📅 TODAY: [N] meetings/events
• [time] — [event] — [one-line context]

🎯 GOALS: [current progress vs. target]
• [Key metric or milestone status]

🔥 PRIORITIES: [top 3 most urgent items]
• [Item 1 with why it matters today]
• [Item 2]
• [Item 3]

📥 INBOX: [N] items pending review
• [List if any]

🧠 SUGGESTED FOCUS: [1–2 sentence recommendation based on data above]
```

## Rules
- Keep it under 300 words
- Lead with the most actionable item
- If any goal is behind pace, flag it clearly — don't soften bad news
- End with one specific recommended action for the morning
- If no calendar events and no pressing items: say so — don't fabricate urgency

---

## Related
[[core]]  [[L1-critical-facts]]  [[context]]  [[CLAUDE]]  [[crucix]]
