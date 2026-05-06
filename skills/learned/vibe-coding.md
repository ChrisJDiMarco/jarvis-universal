# Learned Lessons: Vibe Coding & App Building

> Sourced from Neurolume 7-Day Vibecode App Process playbook. Battle-tested on real builds.
> Apply when JARVIS is building or recommending architecture for any web app.

---

### one-job-per-prompt — vibe_coding (confidence: HIGH, seen: industry-wide)
**When**: Delegating any build task to an AI coding tool (Lovable, Replit, Cursor, Claude Code)
**Rule**: Give the AI exactly one job per prompt. Never batch or stack prompts.
**Why**: Batched prompts produce code with implicit dependencies and unclear scope — debugging becomes impossible because you don't know which part of the prompt caused the issue
**Fix/Pattern**: Break any request into atomic units. If a task has "and" in it, split it.
**Applies to**: vibecode-app-builder, any coding delegation
*Last seen: 2026-03-26*

### foundation-before-features — vibe_coding (confidence: HIGH, seen: industry-wide)
**When**: Any app build, any vibe coding session
**Rule**: Never write feature code before the file structure, stack, and architecture are locked
**Why**: Changing tech stack mid-build costs 3x the time. Changing it after launch is close to a rewrite.
**Fix/Pattern**: Day 1 = PRD + stack + file structure. No exceptions. Nothing else gets built until this exists.
**Applies to**: vibecode-app-builder
*Last seen: 2026-03-26*

### validate-day-before-continuing — vibe_coding (confidence: HIGH, seen: industry-wide)
**When**: Any multi-day build
**Rule**: Test every day's output end-to-end before starting the next day
**Why**: Stacking unvalidated code creates compounding debt — by Day 4 you're debugging Day 1 decisions while trying to build Day 4 features
**Fix/Pattern**: Define a simple smoke test checklist for each day. All pass = proceed. Any fail = fix before moving.
**Applies to**: vibecode-app-builder, self-healing-executor
*Last seen: 2026-03-26*

### security-day-3-not-launch — vibe_coding (confidence: HIGH, seen: real incident)
**When**: Building any app with user data or access control
**Rule**: Write RLS policies on Day 3 (when auth is set up), not before launch
**Why**: Retrofitting Row Level Security onto a live database with real data is painful and error-prone. It's 10x easier to add RLS when the schema is fresh.
**Fix/Pattern**: Use Supabase's built-in security advisor after every schema migration — it flags RLS gaps automatically
**Applies to**: vibecode-app-builder, any Supabase project
*Last seen: 2026-03-26*

### soft-delete-over-hard-delete — vibe_coding (confidence: HIGH, seen: support pattern)
**When**: Designing any database schema with user-generated content
**Rule**: Always use soft delete (deleted_at column) instead of hard delete
**Why**: Hard deletes are permanent and invisible — when a user complains their data is gone, you have nothing. Soft deletes enable recovery, audit logs, and undo functionality.
**Fix/Pattern**: Add `deleted_at TIMESTAMPTZ DEFAULT NULL` to every user-data table. Query with `WHERE deleted_at IS NULL`.
**Applies to**: vibecode-app-builder, any DB schema design
*Last seen: 2026-03-26*

### updated-at-trigger-day-one — vibe_coding (confidence: HIGH, seen: sync pain)
**When**: Designing any database schema
**Rule**: Add updated_at trigger to every table from day one
**Why**: Sync systems, audit logs, cache invalidation, and conflict resolution all need to know when a row last changed. Adding this retroactively to a production DB requires a migration and backfill.
**Fix/Pattern**: `CREATE TRIGGER set_updated_at BEFORE UPDATE ON [table] FOR EACH ROW EXECUTE FUNCTION trigger_set_timestamp();`
**Applies to**: vibecode-app-builder
*Last seen: 2026-03-26*

### proxy-third-party-apis — vibe_coding (confidence: HIGH, seen: security incident)
**When**: Integrating any external API (OpenAI, Twilio, Maps, etc.) into a web app
**Rule**: Always proxy third-party API calls through your backend (Supabase Edge Function). Never call from the client.
**Why**: Client-side API keys are visible in browser devtools and get scraped by bots within hours of going live
**Fix/Pattern**: Edge Function acts as secure proxy → rate limit per user → log usage → surface friendly errors
**Applies to**: vibecode-app-builder, any client-facing AI tool JARVIS builds
*Last seen: 2026-03-26*

### north-star-before-analytics — vibe_coding (confidence: HIGH, seen: analytics debt)
**When**: Instrumenting analytics for any app
**Rule**: Define the North Star metric before writing a single analytics event
**Why**: Without a North Star, teams track everything and learn nothing. The dashboard becomes noise.
**Fix/Pattern**: Write the sentence "Our app succeeds when [user] does [action] [frequency]" → that's your North Star → instrument that event first → build funnel toward it
**Applies to**: vibecode-app-builder, thinklet-dev
*Last seen: 2026-03-26*

### onboarding-checklist-retention — vibe_coding (confidence: HIGH, seen: SaaS research)
**When**: Building user onboarding for any SaaS or app
**Rule**: Always build a checklist-style onboarding dashboard showing progress toward activation
**Why**: Users who complete the onboarding checklist retain at 3-5x the rate of those who skip. It's the single highest-ROI UX investment in early-stage SaaS.
**Fix/Pattern**: 3 key actions define "activated". Show progress visually. Add skip option. Send reminder email at 24h if incomplete.
**Applies to**: vibecode-app-builder, thinklet-dev (213 users — immediate opportunity)
*Last seen: 2026-03-26*

### pitr-backup-day-one — vibe_coding (confidence: HIGH, seen: data loss incident)
**When**: Going live on Supabase
**Rule**: Enable Point-in-Time Recovery backup on day one of production
**Why**: PITR only protects data from the moment it's enabled. If you enable it on Day 30, you can only recover back to Day 30.
**Fix/Pattern**: Supabase dashboard → Settings → Backups → Enable PITR → set retention period
**Applies to**: vibecode-app-builder, any Supabase production deployment
*Last seen: 2026-03-26*

### log-errors-with-user-context — vibe_coding (confidence: HIGH, seen: debugging pain)
**When**: Setting up error logging (Sentry, LogFlare, etc.)
**Rule**: Always log errors with user ID and the action they were taking
**Why**: Anonymous stack traces tell you what broke but not who or why. User context cuts debugging time by 60-70%.
**Fix/Pattern**: Sentry.setUser({ id, email }) on login. Sentry.addBreadcrumb({ message: "User clicked X" }) before risky operations.
**Applies to**: vibecode-app-builder
*Last seen: 2026-03-26*

### test-mobile-first — vibe_coding (confidence: HIGH, seen: scramble pattern)
**When**: Building any web UI
**Rule**: Test mobile layout before desktop
**Why**: Most vibe coders build desktop then scramble to fix mobile before launch. Mobile-first catches responsive issues early when they're cheap to fix.
**Fix/Pattern**: After every layout prompt, immediately check in Chrome DevTools at 375px width before proceeding
**Applies to**: vibecode-app-builder, elite-web-ui
*Last seen: 2026-03-26*

### email-verification-always — vibe_coding (confidence: HIGH, seen: list quality)
**When**: Building any auth system with email signup
**Rule**: Always add email verification on signup, even in MVP
**Why**: Unverified email lists are worth nothing for re-engagement, and you can't reclaim that history later
**Fix/Pattern**: Supabase Auth handles this natively — just enable email verification in project settings
**Applies to**: vibecode-app-builder
*Last seen: 2026-03-26*
