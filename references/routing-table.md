# Context Auto-Detection — Full Routing Table

> Externalized from CLAUDE.md (2026-06-18) to keep the always-loaded orchestrator prompt lean. CLAUDE.md carries a compact summary of the high-frequency contexts; this file holds the full granular trigger→agent/skill map. Read this when a request doesn't match a summary row.

| Context | Keywords / Signals | Active Agent |
|---------|-------------------|--------------|
| Research | research, analyze, deep dive, literature review, compare, what does the evidence say | researcher |
| Content | post, LinkedIn, Reddit, tweet, article, newsletter, write, publish | content-creator |
| Calendar | meeting, schedule, tomorrow, this week, prep, calendar, deadline | scheduler |
| Finance | revenue, costs, invoice, budget, MRR, spend, track money | finance |
| Build (web-only) | build an app, vibe code, scaffold, workflow, automate, integrate, n8n, API | builder → vibecode-app-builder skill |
| Build (multi-platform) | build web + mobile, mobile app, iOS app, full-stack app, Appifex-style, app studio, multi-platform | app-studio agent |
| Analysis | audit, analyze [thing], competitive, SEO, market, report on | analyst |
| Design | landing page, web design, make it look, animated, premium UI, website, experimental UI, visual direction | web-designer → elite-web-ui + experimental-ui-styles skills |
| Design (hi-fi prototype) | hi-fi prototype, clickable demo, iOS/Android prototype, App mockup, interactive demo | web-designer → huashu-design skill |
| Design (slide deck) | slide deck, keynote, presentation, PPT, PPTX, editable slides | web-designer → huashu-design skill |
| Design (motion) | motion design, MP4 export, GIF export, 60fps animation, hero animation, promo video | web-designer → huashu-design skill |
| Design (critique) | design critique, design review, 5-dimension review, expert critique, score this design | web-designer → huashu-design skill |
| Design (direction) | design direction, design philosophy, recommend a style, pick a direction, design advisor | web-designer → huashu-design skill |
| UI deslop / polish | deslop, clean up the UI, polish pass, fix spacing/hierarchy/typography | web-designer / builder → baseline-ui skill (`.claude/skills/`) |
| UI accessibility | accessibility, a11y, ARIA, keyboard nav, focus management, WCAG, color contrast | web-designer / builder → fixing-accessibility skill |
| UI motion performance | janky animation, motion stutters, transitions jank, scroll-linked motion, compositor props | web-designer / builder → fixing-motion-performance skill |
| shadcn/ui work | shadcn, add/compose shadcn components, shadcn registry/preset, project-aware shadcn | builder → shadcn skill |
| Distinctive frontend | production-grade frontend, anti-generic UI, avoid the AI aesthetic, distinctive interface | web-designer → frontend-design skill |
| React/shadcn UI build/polish | build or polish a React component UI | baseline-ui + shadcn + fixing-motion-performance |
| UI task, no local match | any UI/frontend task without a clear local skill | route via UI Skills directory: `npx ui-skills start` (see `references/rules/skill-discovery.md`) |
| Monitoring | monitor, alert me when, watch for, keep an eye on | orchestrator → persistent-daemon skill |
| Morning | morning briefing, come online, good morning, what's on today | orchestrator → morning-briefing skill |
| World briefing | world briefing, the intelligencer, what's going on in the world, state of the world, today's edition | orchestrator → world-briefing skill |
| Weekly | weekly review, end of week, how's the week | orchestrator → weekly-review skill |
| Synthesis | find connections, synthesize my notes, what's connecting, weekly connections, what patterns am I missing | orchestrator → connection-synthesis skill |
| Monthly meta | monthly retrospective, end of month, month in review, what beliefs am I forming | orchestrator → monthly-retrospective skill |
| Memory | remember this, save this, update memory | orchestrator → memory-management skill |
| Agent build | what kind of agent, build an agent, agent for, agent architecture | orchestrator → agent-species-selector skill |
| Code review | review this code, review before merge, check this PR, is this safe | builder → code-reviewer agent |
| Security scan | security scan, check for vulnerabilities, audit this, OWASP | builder → security-reviewer agent |
| TDD / Testing | write tests, TDD this, test coverage, failing test | builder → tdd-guide agent |
| Refactor | clean this up, refactor, dead code, simplify | builder → refactor-cleaner agent |
| Plan feature | plan this, break this down, implementation plan | builder → planner agent |
| Build errors | build fails, compilation error, TypeScript error, can't compile | builder → build-error-resolver agent |
| Tool setup | "connect [tool]", "set up [MCP]", "I need a tool for [X]", "set up my connectors" | onboarder agent |
| Ship to prod | "ship it", "ship this", "production deploy", "ready to ship", "push to prod" | orchestrator → ship-it skill |
| Independent grade | "/grade", "grade this", "grade the work" | orchestrator → grade skill (spawns elite-cto-grader) |
| Four C's audit | "four c's audit", "AIOS health check", "score my agentic OS" | orchestrator → four-cs-audit skill |
| Level up | "level up", "what should I automate next", "where can I get leverage" | orchestrator → level-up skill |
| Evening debrief | "evening debrief", "end of day", "wind down", "patch list" | orchestrator → evening-debrief skill |
| Workspace artifact | "create google slides", "create google doc", "build a slide deck", "google sheets from data" | builder → gws-cli skill |
| Cloud routine | "cloud routine", "run task while my laptop is off", "remote scheduled task" | orchestrator → cloud-routines skill |
| Knowledge base | "knowledge base", "second brain", "build a wiki from", "add this to my reading", "ingest this article" | orchestrator → knowledge/ (subject KB: raw→wiki→outputs) |
| Second-brain level audit | "second brain audit", "memory level audit", "retrieval ladder", "should this be semantic search", "should this be a knowledge graph" | orchestrator → second-brain-level-audit skill |
| Knowledge ingestion interview | "grill me about", "interview me about", "extract what's in my head", "brain dump this", "JARVIS needs more nuance" | orchestrator → grill-me-ingestion skill |
| Knowledge health | "knowledge health check", "audit my memory", "check the wiki", "find contradictions in my notes", "what's rotting" | orchestrator → knowledge-integrity skill |
| Marketing org | "organize marketing", "marketing for [company/app]", "start/set up marketing", "marketing assets", "marketing folder" | orchestrator → Marketing folder convention (below) |

**Archetype-specific contexts** are loaded from `memory/core.md` — once the operator's context is known, routing becomes more precise.

---

## Marketing Folder Convention

All marketing work lives in **one master folder**: `~/jarvis/Marketing/` — a fixed 15-category taxonomy (Research → Strategy → Branding → Content → SEO → Paid Ads → Social Media → Email Marketing → Acquisition → Conversion → Launch → Analytics → Retention → Growth → Scaling, each with 5 subcategories and 3 leaf folders). This taxonomy is **shared across every business** — never duplicate the tree per company, and never create a separate marketing folder outside it.

When the operator asks to organize or start marketing for a specific business/app, create a folder named exactly after that business **inside each section you're producing assets for** — e.g. `Marketing/Content/Blog & Articles/AcmeApp/`, `Marketing/SEO/Keyword Research/AcmeApp/`. Do not pre-create the company in all 75 sections; add it only where there are real assets. Use **one consistent company name everywhere** so a search for that name surfaces all of its assets across the tree. File by marketing function first, company second. Full taxonomy map + spec: `Marketing/README.md`.
