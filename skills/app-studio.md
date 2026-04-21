# Skill: App Studio — Multi-Platform App Builder

> Appifex-inspired. Full-stack, multi-platform, self-healing. Web + Mobile + Backend from a single idea.

## Trigger
"build an app", "app studio", "build me a [type] app", "create a mobile app", "build web + mobile", "I need an app that", "scaffold [app name]", "full-stack app", "build and deploy", "Appifex-style build", "multi-platform app"

## Goal
Take an idea from concept to deployed, production-ready application across web, mobile, and backend — using the same structured 6-phase pipeline Appifex uses. One monorepo. Self-healing builds. GitHub-first. Live preview after every phase.

---

## The Appifex Method (What We Replicate)

Appifex's genius is their 6-phase pipeline applied to every build:

```
Phase 1: SETUP       → Lock stack, create monorepo, configure tools
Phase 2: PLANNING    → AI plans architecture, generates spec + file tree
Phase 3: BUILDING    → Generate code by platform (web → mobile → backend)
Phase 4: QA          → Self-healing loop: compile → catch errors → auto-fix → recompile
Phase 5: PREVIEW     → Spin up dev servers, live URLs + QR codes, manual test pass
Phase 6: GIT COMMIT  → Commit all passing code to GitHub with structured message
```

This cycle repeats for every feature increment. **One change at a time. No exceptions.**

---

## Platform Stack (Multi-Platform Monorepo)

```
[app-name]/
├── apps/
│   ├── web/              ← React + Vite + Tailwind CSS
│   ├── mobile/           ← React Native + Expo
│   └── api/              ← FastAPI + PostgreSQL + SQLModel
├── packages/
│   ├── shared/           ← Shared TypeScript types, utils, constants
│   ├── ui/               ← Shared component library (web + mobile)
│   └── config/           ← Shared ESLint, TypeScript, Tailwind configs
├── .github/
│   └── workflows/        ← CI/CD pipelines
├── docker-compose.yml    ← Local dev environment
├── package.json          ← Monorepo root (pnpm workspaces)
└── README.md
```

### Layer-by-Layer Stack

| Platform | Primary Stack | Why |
|----------|-------------|-----|
| **Web** | React + Vite + Tailwind CSS + shadcn/ui | Fastest iteration, Vercel-native |
| **Mobile** | React Native + Expo + NativeWind | Share logic with web, OTA updates |
| **iOS Native** | SwiftUI + Xcode (via Runner) | True native when performance matters |
| **Backend** | FastAPI + PostgreSQL + SQLModel + Alembic | Auto-generated OpenAPI docs, type-safe |
| **Auth** | Supabase Auth (or JWT via FastAPI) | Fast setup; upgrade to custom if needed |
| **Storage** | Supabase Storage or S3 | Presigned URLs, client-direct upload |
| **Payments** | Stripe | Subscriptions + one-time + webhook tooling |
| **Deploy — Web** | Vercel + GitHub Actions | Preview deploys, zero-config |
| **Deploy — Mobile** | Expo EAS Build + EAS Submit | App Store + Play Store CI |
| **Deploy — API** | Railway or Render (Docker) | Auto-deploy on push, Postgres included |
| **Monitoring** | Sentry (web + mobile + API) | One SDK across all platforms |
| **Analytics** | PostHog | Open-source, cross-platform, GDPR |

### Platform Decision Matrix
| Need | Build for... |
|------|-------------|
| Marketing site / dashboard / SaaS | Web only (fast, SEO-friendly) |
| Consumer product, camera/GPS/notifications | Mobile (React Native) |
| Game, AR, max performance | iOS Native (SwiftUI) |
| All three + shared data | Full monorepo |
| Internal tool | Web + API only |

---

## Pre-Build: Vision Lock

**Before Phase 1 starts, complete this brief.** Save to `projects/[app-name]/vision-brief.md`.

```
App name:         [name]
Problem:          [one sentence — what pain does it solve]
Target user:      [specific person, not "everyone"]
Core loop:        [the 1 action users repeat most]
Platform targets: [web | mobile | native iOS | all]
MVP features:     [3–5 only — ruthless scope]
Revenue model:    [free | subscription | one-time | B2B]
Backend needed:   [yes/no — justification]
Stack deviation:  [any reason to diverge from default stack]
GitHub repo:      [repo name / org]
Deploy target:    [Vercel | Railway | EAS | all]
```

---

## Phase 1 — SETUP

**Goal**: Monorepo initialized, stack locked, all tools configured before a single line of business logic.

### Prompt 1 — Write the Vision Brief (PRE-BUILD)
```
I'm building [APP NAME]. The problem: [PROBLEM]. For: [USER]. Core loop: [CORE ACTION].
Platform targets: [web | mobile | all]. Revenue: [model].

Generate:
1. A 1-paragraph product vision statement
2. A ruthless MVP scope (5 features max, justified)
3. A post-launch v2 wishlist (so we don't scope-creep MVP)
4. Stack recommendation with justification (use the App Studio default stack unless there's a clear reason not to)
5. Monorepo structure tree for the chosen platforms
```
> **Rule**: Get approval on this before writing any code. Ambiguous vision = wasted build.

### Prompt 2 — Scaffold Monorepo
```
Create the complete monorepo for [APP NAME] using pnpm workspaces.
Platforms: [web | mobile | api | all].
Include:
- Root package.json with workspace definitions and shared scripts
- All app package.json files with correct dependencies
- TypeScript configs (root + per-package with proper paths)
- ESLint + Prettier configs shared across workspace
- .env.example for each app with every required variable documented
- docker-compose.yml for local Postgres dev environment
- .gitignore (monorepo-aware)
- GitHub Actions CI workflow: lint → type-check → test → preview deploy
Output as a complete file tree with every file's content.
```
> **Rule**: Run `pnpm install` and confirm zero errors before Phase 2.

### Prompt 3 — Infrastructure Setup
```
Set up infrastructure for [APP NAME]:
1. Supabase project: configure auth providers (email, Google, Apple), create initial tables, enable RLS
2. PostgreSQL schema seed file (docker-compose local + Supabase prod)
3. Railway/Render deployment config for FastAPI (Dockerfile + railway.toml or render.yaml)
4. Vercel project config (vercel.json) with environment variable names
5. EAS build config (eas.json) for Expo if mobile is in scope
6. Sentry DSNs configured in each app's .env.example
Output all config files with full content.
```

---

## Phase 2 — PLANNING

**Goal**: AI plans architecture and generates a dev-ready spec. No guessing mid-build.

### Prompt 4 — Product Requirements Document
```
Based on the vision brief for [APP NAME], generate a complete PRD:
1. User stories (format: As a [user], I want to [action] so that [outcome])
2. Acceptance criteria for each story
3. Feature priority matrix: must-have vs. nice-to-have vs. post-launch
4. Data model: every entity, its fields, relationships, and indexes
5. API contract: every endpoint (method, path, request body, response schema, auth required)
6. Screen inventory: every screen/page with description and key interactions
7. Edge cases and error states to handle
Format as a dev-ready spec that a developer could build from without asking questions.
```
> **Rule**: Share PRD with client or stakeholder before Day 2 if building for someone else.

### Prompt 5 — File Architecture
```
Generate the complete file architecture for [APP NAME]:
- apps/web/: all pages, components, hooks, services, types, utils
- apps/mobile/: all screens, components, navigation, hooks, services
- apps/api/: all routers, models, schemas, services, middleware, tests
- packages/shared/: every shared type, util, and constant

Output as a directory tree where every file has a 1-line description.
Flag: any file that is non-obvious or contains something important to know upfront.
```
> **Rule**: Paste this tree into the build as context for every subsequent prompt.

### Prompt 6 — Database Schema
```
Design the complete PostgreSQL schema for [APP NAME].
For every table include:
- Primary key (UUID, default gen_random_uuid())
- created_at, updated_at (with auto-update trigger)
- Foreign key relationships with ON DELETE behavior specified
- Indexes on every foreign key and frequently queried column
- Check constraints for data integrity
- Row Level Security policies for every user-owned table
- Comments on every column

Output:
1. SQLModel Python classes (for FastAPI)
2. Alembic migration file (SQL)
3. Supabase RLS policy SQL
```

---

## Phase 3 — BUILDING

**The core build phase. One module at a time. Web → Mobile → Backend order.**

### Ground Rules (Never Violate)
1. **One prompt = one module.** Never mix concerns in a single prompt.
2. **Fill every [PLACEHOLDER] before running.** Vague in = broken out.
3. **Share file tree context** at the start of every prompt.
4. **Never duplicate code** that belongs in `packages/shared/`.
5. **Every async operation gets a loading state, error state, and empty state.** No half-built UIs.

---

### WEB BUILD TRACK (apps/web/)

#### Prompt 7 — Design System
```
Build the complete design system for [APP NAME] web app.
Brand vibe: [describe: minimal/vibrant/enterprise/dark/playful]
Reference aesthetic: [name an app or site you admire]

Output:
1. Tailwind CSS config (colors with 9-shade scales, typography, spacing, radius, shadow, animation)
2. CSS custom properties in globals.css
3. shadcn/ui theme configuration
4. Font imports (Google Fonts or custom)
The design system must be consistent with any mobile design tokens in packages/ui/.
```

#### Prompt 8 — Core Component Library
```
Build these reusable React components for [APP NAME]:
- Button (primary, secondary, ghost, destructive, loading state, disabled state)
- Input (label, placeholder, error message, helper text, icons)
- Card (header, body, footer, hover variant)
- Badge (status variants: success, warning, error, neutral, custom color)
- Avatar (image, initials fallback, size variants, skeleton)
- Modal (title, body, footer CTA, close button, escape key, backdrop click)
- Toast notification (success, error, warning, info — auto-dismiss with progress bar)
- Skeleton (text, card, avatar, table row variants)
- EmptyState (icon, title, description, CTA button)

Each component: TypeScript interface, ARIA attributes, className extension prop.
```

#### Prompt 9 — App Shell & Navigation
```
Build the authenticated app shell for [APP NAME]:
- Responsive sidebar (collapsible on mobile, shows icons only on tablet, full on desktop)
- Top header bar (breadcrumb, search, notification bell, user avatar + dropdown)
- Main content area (proper padding, scroll behavior, max-width container)
- Mobile bottom nav bar (5 items max, active state, badge count)
- Unauthenticated layout (centered, no sidebar)
- Route configuration (React Router v7 with lazy loading on all routes)
- Protected route wrapper that redirects to /login if not authenticated
Handle: route loading state, route error boundary, 404 page.
```

#### Prompt 10 — Authentication UI
```
Build the complete auth UI for [APP NAME]:
- Signup page (email + password, Google OAuth button, Apple sign-in if mobile)
- Login page (email + password, magic link toggle, forgot password link)
- Email verification pending screen (resend button with cooldown)
- Forgot password page (email input, confirmation state)
- Reset password page (new password + confirm, strength indicator)
- Onboarding wizard — 3 steps: [define 3 onboarding steps]

Supabase Auth integration: useAuth() hook, AuthProvider, session persistence, auto-refresh.
Every form: react-hook-form + zod validation. Loading states on all submit buttons.
```

#### Prompt 11 — Core Feature: [FEATURE NAME]
```
Build [FEATURE NAME] for [APP NAME] — this is the core product loop.
User story: [paste from PRD]
Screens to build: [list from file architecture]

For each screen:
- Full component with all states (loading, empty, error, populated)
- API integration using React Query (useQuery, useMutation with optimistic updates)
- Form validation with zod
- Responsive layout (mobile-first)

API layer: create a typed service in services/[feature].service.ts that wraps all API calls.
Use the shared types from packages/shared/ for all data models.
```
> **Rule**: Repeat Prompt 11 for each core feature. This is the most repeated prompt in the build.

#### Prompt 12 — [Feature N]
> *(Repeat for each additional feature from the PRD)*

---

### MOBILE BUILD TRACK (apps/mobile/)

#### Prompt 13 — Mobile Design System
```
Build the React Native design system for [APP NAME] using NativeWind.
Must be visually consistent with the web design system.
Output:
1. NativeWind/Tailwind config for mobile (matching web color tokens)
2. Theme context provider (light/dark mode toggle, system preference detection)
3. Core native components: Button, TextInput, Card, Avatar, Badge, BottomSheet, Toast
Note: No web-specific APIs. All components must work on both iOS and Android.
```

#### Prompt 14 — Navigation & Shell
```
Build the Expo Router navigation structure for [APP NAME] mobile:
- Tab navigator (bottom tabs: [list 4-5 tabs])
- Stack navigators within each tab
- Modal stack for full-screen overlays
- Auth flow: unauthenticated → login/signup → onboarding → main tabs
- Deep linking configuration (URL scheme: [app-name]://)
- Splash screen and app icon configuration
- Push notification handler setup (Expo Notifications)
Handle: navigation state persistence, back button behavior on Android.
```

#### Prompt 15 — Auth + Core Mobile Features
```
Build authentication for [APP NAME] mobile using Supabase:
- Expo SecureStore for token storage (never AsyncStorage for sensitive data)
- Biometric authentication option (Face ID / Touch ID)
- Same auth flows as web: email/password, magic link, Google OAuth (Expo AuthSession)
Then build [CORE MOBILE FEATURE] — the most important thing users do on mobile:
[Feature description and UX flow]
```

---

### BACKEND BUILD TRACK (apps/api/)

#### Prompt 16 — FastAPI App Setup
```
Build the FastAPI application structure for [APP NAME]:
- App factory pattern (create_app function)
- CORS middleware (allow web + mobile origins)
- Request ID middleware (UUID per request for tracing)
- Auth middleware (JWT validation via Supabase Auth)
- Rate limiting middleware (slowapi, per-user and per-IP)
- Global exception handlers (HTTPException, ValidationError, generic 500)
- Health check endpoint (/health — returns status + DB connection check)
- OpenAPI docs configuration (title, version, description)
- SQLModel + AsyncSession database setup with connection pooling
- Alembic configuration for migrations
```

#### Prompt 17 — API Routers
```
Build the API routers for [APP NAME] based on the PRD API contract.
For each resource ([list resources from PRD]):
- GET /[resource]s — paginated list with filtering + sorting
- GET /[resource]s/{id} — get by ID with 404 handling
- POST /[resource]s — create with validation
- PATCH /[resource]s/{id} — partial update, ownership check
- DELETE /[resource]s/{id} — soft delete (deleted_at), ownership check

Every endpoint:
- Pydantic request/response schemas (Input vs. Response models)
- Current user injected via Depends(get_current_user)
- Ownership check before any mutation (raise 403 if not owner)
- Response uses Response model (never exposes internal fields)
Output all routers + schemas + service layer functions.
```

#### Prompt 18 — Background Tasks & Integrations
```
Build background tasks and integrations for [APP NAME]:
1. Email via Resend: welcome email, verification, password reset, [app-specific emails]
2. Stripe integration: create customer, checkout session, webhook handler (checkout.completed, subscription events)
3. File upload: presigned S3/Supabase URLs, background thumbnail generation
4. Background tasks via FastAPI BackgroundTasks or Celery (if heavy workload)
5. Webhook receiver pattern (signature validation, idempotency via processed_webhooks table)

Stripe webhook rule: always check event was not already processed before executing side effects.
```

---

## Phase 4 — QA (Self-Healing Loop)

**Goal**: Zero broken code ships to preview. The AI fix agent runs before you ever see the output.

### Self-Healing Protocol

```
FOR EACH BUILD PHASE:

1. RUN: Execute build command for platform
   - Web:    cd apps/web && pnpm build
   - Mobile: cd apps/mobile && npx expo export
   - API:    cd apps/api && python -m pytest tests/ -x

2. CHECK: Did it succeed? (exit code 0)
   YES → Move to Preview phase
   NO → Trigger Fix Loop

3. FIX LOOP (max 5 iterations):
   a. Parse error output — extract specific error, file, line number
   b. Diagnose: is this an import error? Type error? Runtime error? Config error?
   c. Generate targeted fix — change only what the error indicates
   d. Apply fix using Edit tool (surgical, never rewrite whole file)
   e. Re-run build command
   f. Loop back to CHECK

4. IF still failing after 5 iterations:
   → BLOCKED: [specific error] — needs operator input
   → Do NOT continue to next phase on a broken build
```

### Type-Check Pass
```
After building, run:
- Web:   pnpm --filter web type-check
- API:   cd apps/api && mypy . --ignore-missing-imports

Fix all TypeScript and mypy errors before continuing.
Rule: TypeScript strict mode is required. No `any` types without a comment explaining why.
```

### Lint Pass
```
Run:  pnpm lint (runs ESLint on web + mobile)
Auto-fix: pnpm lint:fix
Manual fix: any error that auto-fix can't resolve

Rule: Zero lint errors before preview. Warnings are acceptable but must be logged.
```

---

## Phase 5 — PREVIEW

**Goal**: Live, testable app in browser/device before committing anything.

### Web Preview
```bash
# Start API + Web dev servers
docker-compose up -d postgres   # Start local DB
cd apps/api && uvicorn main:app --reload --port 8000 &
cd apps/web && pnpm dev &       # Starts on localhost:5173

# Open in browser via Chrome MCP
# URL: http://localhost:5173
```

### Mobile Preview
```bash
cd apps/mobile && npx expo start
# Scan QR code with Expo Go app
# OR press 'i' for iOS Simulator, 'a' for Android emulator
```

### Preview Checklist (Run Every Phase)
```
WEB:
[ ] App loads without console errors
[ ] Auth flow: signup → verify → login → dashboard → logout
[ ] Core feature works end-to-end with real data
[ ] Mobile responsive (test at 375px, 768px, 1280px)
[ ] Empty states display correctly
[ ] Error states trigger correctly (test with invalid input)
[ ] Loading states show on all async operations

MOBILE:
[ ] App loads on iOS Simulator without red screen
[ ] Navigation transitions work
[ ] Auth flow completes
[ ] Core feature works
[ ] Keyboard behavior correct (no hidden inputs)

API:
[ ] /health returns 200
[ ] Auth-protected endpoints return 401 without token
[ ] Core CRUD endpoints work via Swagger UI (localhost:8000/docs)
[ ] Webhook endpoint reachable (test with Stripe CLI if payments)
```

---

## Phase 6 — GIT COMMIT

**Goal**: Every passing build goes to GitHub with a clear, structured commit message.

### Commit Protocol
```bash
# Stage all changes (be specific — never `git add .` blindly)
git add apps/web/src/ apps/mobile/src/ apps/api/ packages/

# Commit with structured message
git commit -m "[PHASE] [APP NAME]: [what was built]

- [specific change 1]
- [specific change 2]
- [specific change 3]

Platforms: [web | mobile | api]
Phase: [1-6] / [phase name]"

# Push
git push origin main  # or feature branch if in PR workflow
```

### Branch Strategy
```
main          ← production-ready code only
dev           ← integration branch
feature/[X]   ← individual feature work
hotfix/[X]    ← urgent production fixes
```

### GitHub Actions Trigger
On every push to `main`:
1. Run lint + type-check
2. Run tests
3. Preview deploy to Vercel (web)
4. Build check on Expo (mobile, no publish)
5. Docker build check (API)

---

## Deployment

### Web (Vercel)
```bash
# First deploy
npx vercel --prod

# Configure in Vercel dashboard:
# - Root directory: apps/web
# - Build command: pnpm build
# - Output directory: dist
# - Environment variables: (paste from .env.example)
```

### API (Railway)
```bash
# Install Railway CLI
npm install -g @railway/cli
railway login
railway link     # link to project
railway up       # deploy

# Or via GitHub: connect repo, set:
# - Root directory: apps/api
# - Build command: docker build .
# - Start command: uvicorn main:app --host 0.0.0.0 --port $PORT
```

### Mobile (Expo EAS)
```bash
cd apps/mobile
npx eas build --platform all --profile preview   # TestFlight + Play Store beta
npx eas submit --platform ios                     # Submit to App Store
npx eas submit --platform android                 # Submit to Play Store

# OTA update (no App Store review):
npx eas update --branch main --message "[version]: [what changed]"
```

---

## Effective Prompt Patterns

### The Appifex Prompt Formula
```
[CONTEXT]: Brief description of what exists
[REQUEST]: Exactly one thing to build
[CONSTRAINTS]: Stack, patterns, performance requirements
[OUTPUT]: What files/code to produce
```

### Visual Prompts (Image Input)
When the user provides screenshots or mockups:
1. Identify the layout pattern (grid, sidebar, cards, etc.)
2. Note color palette, typography style, spacing density
3. List specific components visible in the image
4. Prompt: "Build this layout: [describe]. Match this visual style: [describe what you see]. Use our design system tokens."

### Iteration Prompts
When something needs changing:
```
In [FILE PATH], [specific change needed].
Current behavior: [what it does]
Expected behavior: [what it should do]
Do NOT change anything else.
```
> Rule: "Do NOT change anything else" is the most important phrase in an iteration prompt. LLMs love to refactor. Resist it.

---

## Output Files (Per Build)

| File | Location | Contents |
|------|----------|----------|
| Vision brief | `projects/[app]/vision-brief.md` | Approved app spec before build |
| PRD | `projects/[app]/prd.md` | Full product requirements |
| File architecture | `projects/[app]/architecture.md` | Complete file tree + descriptions |
| Build log | `projects/[app]/build-log.md` | Phase-by-phase progress, blockers, decisions |
| Deploy manifest | `projects/[app]/deploy.md` | All URLs, env vars, credentials checklist |
| Codebase | `projects/[app]/` (or separate GitHub repo) | All generated code |

---

## Operator Notifications

After each phase completes, send iMessage:
```
JARVIS App Studio: [APP NAME] — Phase [N] Complete ✅
Built: [what was built in 1 sentence]
Preview: [localhost URL or Expo QR]
Next: [what Phase N+1 will do]
Blockers: [none | specific question]
```

---

## Rules (Never Violate)

1. **Phase 1 (Setup) must complete before Phase 2.** Monorepo must install cleanly.
2. **PRD approval required before Phase 3 (Building).** Never build without approved spec.
3. **One change at a time.** Each prompt is one job. Never mix concerns.
4. **Self-healing loop runs before every commit.** Broken code never reaches GitHub.
5. **GitHub commit is non-negotiable at end of each phase.** Code not in Git doesn't exist.
6. **Never expose API keys client-side.** All third-party calls proxy through the FastAPI backend.
7. **Every table has RLS policies.** No naked tables in production.
8. **Stripe webhooks must be idempotent.** Always check for duplicate event processing.
9. **Mobile keyboard behavior is tested before Phase 6.** Keyboards hiding inputs is a shipping bug.
10. **Load/error/empty states on every async UI.** No half-built interfaces.

---

## When to Use This vs. vibecode-app-builder

| Scenario | Use |
|----------|-----|
| Web-only SaaS with Supabase backend | vibecode-app-builder (7-day, 25-prompt) |
| Multi-platform (web + mobile + API) | **app-studio** (this skill) |
| Native iOS app (SwiftUI) | **app-studio** mobile native track |
| Agency client portal | vibecode-app-builder |
| Greenfield product with FastAPI backend | **app-studio** |
| Quick internal tool (no mobile) | vibecode-app-builder |
