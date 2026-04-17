# JARVIS Context Archetypes

When a new operator runs JARVIS for the first time, their answers are mapped to an archetype. The archetype determines:
- Which memory template to use
- Which agents are primary vs. secondary
- Which skills to highlight
- How to phrase outputs and recommendations

---

## Archetype Definitions

### 🏢 Business Owner / Entrepreneur
**Signals:** "I run a [business]", "I'm starting a company", "I have clients", "we're trying to grow", "revenue", "agency"

**Primary agents:** researcher, content-creator, finance, analyst, builder
**Secondary agents:** scheduler, web-designer

**Memory context template:**
```markdown
# Business Context

## Business
- Business name:
- What it does:
- Revenue model:
- Stage: [pre-revenue / early / growing / scaling]

## Clients / Customers
- ICP (ideal customer):
- Current clients:
- Pipeline stage:

## Revenue
- Current MRR/ARR:
- Target:
- Timeline:

## Tools & Stack
- CRM:
- Automation:
- Other:
```

**Specialized routing:**
- "pipeline" / "clients" / "deals" → analyst (with CRM context)
- "revenue" / "MRR" / "invoice" → finance
- "leads" / "prospect" / "outreach" → content-creator + researcher

---

### 💼 Solopreneur / Freelancer
**Signals:** "I freelance", "I consult", "solo", "independent", "I work with a few clients", "project-based"

**Primary agents:** scheduler, finance, content-creator, researcher
**Secondary agents:** builder, analyst

**Memory context template:**
```markdown
# Freelance Context

## Work
- Specialty / services:
- Industries I serve:
- Avg project size:
- Billing model: [hourly / project / retainer]

## Active Projects
- [Project name]: [client] — [status] — [deadline]

## Client Pipeline
- Leads:
- Proposals out:
- Active:

## Revenue
- Monthly target:
- Current MRR:
```

---

### 🎨 Creator / Content Maker
**Signals:** "I create content", "I have a channel", "I'm a YouTuber / podcaster / writer", "audience", "subscribers", "newsletter"

**Primary agents:** content-creator, researcher, analyst
**Secondary agents:** scheduler, builder, web-designer

**Memory context template:**
```markdown
# Creator Context

## Content
- Primary platform: [YouTube / Podcast / Newsletter / Blog / Social]
- Niche / topic:
- Publishing schedule:
- Audience size:

## Brand Voice
- Tone:
- Avoid:

## Monetization
- Model: [ads / sponsors / products / memberships / courses]
- Current revenue:

## Content Pipeline
- Ideas backlog: (track in projects/)
- In production:
- Published this week:
```

---

### 🔬 Researcher / Academic
**Signals:** "I research", "PhD", "I'm writing a thesis", "academic", "studying", "analyzing data", "literature review"

**Primary agents:** researcher
**Secondary agents:** content-creator, scheduler, analyst

**Memory context template:**
```markdown
# Research Context

## Research Focus
- Field / domain:
- Current project / thesis:
- Research questions:
- Methodology:

## Active Work
- Current phase: [literature review / data collection / analysis / writing]
- Deadline:
- Key sources:

## Output
- Target: [paper / thesis / report / presentation]
- Journal / venue:
```

**Specialized routing:**
- Almost everything → researcher (with deep research skill)
- "write a section" / "draft" → content-creator (academic writing mode)

---

### 👩‍💻 Developer / Engineer
**Signals:** "I'm a developer", "I build software", "codebase", "API", "deploy", "GitHub", "engineering"

**Primary agents:** builder, researcher, analyst
**Secondary agents:** scheduler, web-designer

**Memory context template:**
```markdown
# Dev Context

## Stack
- Languages:
- Frameworks:
- Infra / hosting:
- Key tools:

## Current Project
- What I'm building:
- Tech decisions in progress:
- Blockers:

## Workflow
- Repo:
- CI/CD:
- Team size: [solo / small team / large team]
```

**Specialized routing:**
- "build" / "code" / "debug" → builder (with self-healing-executor)
- "architecture" / "design" → builder (Opus)
- "research [library/tool]" → researcher

---

### 🎓 Student / Learner
**Signals:** "I'm a student", "I'm learning", "class", "assignment", "exam", "studying", "course"

**Primary agents:** researcher, scheduler
**Secondary agents:** content-creator, finance

**Memory context template:**
```markdown
# Student Context

## Studies
- Field / major:
- School / program:
- Current semester / year:

## Active Workload
- Courses:
- Current assignments / projects:
- Upcoming deadlines:

## Goals
- Short-term: [this semester / this month]
- Long-term: [career / next step]
```

**Specialized routing:**
- "research" / "find papers on" → researcher
- "write an essay" / "draft" → content-creator (academic mode)
- "schedule" / "plan my week" → scheduler
- "explain [topic]" → researcher

---

### 👔 Executive / Manager
**Signals:** "I'm a [C-suite/VP/Director/Manager]", "my team", "we have [N] employees", "board", "strategy", "quarterly goals"

**Primary agents:** researcher, analyst, scheduler
**Secondary agents:** content-creator, finance, builder

**Memory context template:**
```markdown
# Executive Context

## Role
- Title:
- Company:
- Team size:
- Key responsibilities:

## Strategic Priorities
- Q[N] goals:
- OKRs:
- Current blockers:

## Stakeholders
- Direct reports:
- Key relationships:
- Board/investors:

## Cadence
- Weekly meetings:
- Key reviews:
```

---

### 🏠 Personal Assistant Mode
**Signals:** "help me manage my life", "personal productivity", "I want to stay organized", "family", "health", "goals", no strong professional context

**Primary agents:** scheduler, researcher
**Secondary agents:** finance, content-creator

**Memory context template:**
```markdown
# Personal Context

## Life Context
- Where I am:
- Living situation:
- Key relationships:

## Goals
- Current personal goals:
- Health / fitness:
- Financial:
- Learning:

## Projects
- Active personal projects:
- Habits I'm building:
```

**Specialized routing:**
- "plan my day/week" → scheduler
- "research [personal topic]" → researcher
- "track my [budget/spending]" → finance

---

## Multi-Archetype Users

Many operators span multiple archetypes (e.g., a developer who is also building a business). In these cases:
1. Pick the **primary archetype** based on their stated main goal (Q2)
2. Note secondary contexts in `memory/context.md`
3. Enable routing from both archetypes' tables

Example: Developer building a startup → Primary: Business Owner, Secondary: Developer
- Business questions route to analyst/finance
- Technical questions route to builder

---

## Archetype Updates

When an operator's context changes (new job, new project, new phase), they can say "update my archetype" or JARVIS can proactively suggest it when signals shift significantly. Always confirm before changing archetype, as it affects memory structure.
