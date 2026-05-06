# Skill: Vibecode App Builder

## Trigger
"vibe code this", "build an app", "spin up a [type] app", "7-day build", "build me a web app", "scaffold [app name]", "Lovable", "Replit build", "new app for client", "build a tool for"

## Goal
Execute a structured 7-day, 25-prompt process to build a complete, production-ready web app using AI coding tools (Lovable, Replit, Cursor, Bolt, or Claude Code directly). Foundation before features. Security before launch. No skipping days.

## Default Stack (lock before writing one line)
| Layer | Tool | Why |
|-------|------|-----|
| Frontend | React + Vite + Tailwind CSS | Fast, Lovable/Replit compatible, ecosystem depth |
| Backend | Supabase (Postgres + Auth + Storage + Edge Functions) | Auth + DB + Storage in one, generous free tier |
| Payments | Stripe | Standard, best webhook tooling |
| Email | Resend (or Postmark) | Deliverability + templates |
| Analytics | PostHog | Open source, GDPR-friendly, funnel-native |
| Error Tracking | Sentry | User context on errors = actionable traces |
| Deploy | Vercel + GitHub | CI/CD out of the box, Supabase-native |

## Ground Rules (Never Violate)
1. **One prompt at a time.** Each prompt is one job. Never paste two together.
2. **Fill the brackets first.** Replace every [PLACEHOLDER] before running. Vague in = garbage out.
3. **Validate before moving on.** Test every day's output end-to-end before starting the next day.
4. **Commit to GitHub after each day.** The repo is the asset, not the AI tool's project.
5. **Read the pro tips.** They're lessons from real builds that save hours of debugging.

---

## DAY 1 — Foundation & Planning

### PRE-BUILD: Write the Vision Brief
Before any prompt, write this in `projects/[app-name]/vision-brief.md`:
```
App name: [name]
Problem: [one sentence — what pain does it solve]
Target user: [specific person, not "everyone"]
Core loop: [the 1 thing users do repeatedly]
MVP features: [3-5, be ruthless — everything else is v2]
Revenue model: [free/subscription/one-time]
Stack: [confirm default or explain deviation]
```

### Prompt 1 — Define App Scope & Requirements (PLANNING)
```
I'm building [APP NAME]. It solves [PROBLEM] for [TARGET USER]. Core features are: [LIST 3-5 FEATURES]. Please create a structured PRD (Product Requirements Document) with user stories, acceptance criteria, and a prioritized feature list split into MVP and post-launch. Format it as a dev-ready spec.
```
> **Pro tip**: Be ruthless about MVP scope. Ship the core loop first. Everything else is v2.

### Prompt 2 — Choose & Lock Your Tech Stack (ARCHITECTURE)
```
Based on this app spec: [PASTE PRD SUMMARY]. Recommend the best tech stack considering: solo dev speed, scalability to 10k users, cost at zero and at scale, and Lovable/Replit compatibility. Compare 2 options and recommend one. Include frontend, backend, auth, database, storage, and hosting.
```
> **Pro tip**: Lock your stack before writing a single line. Changing it mid-build costs 3x the time.

### Prompt 3 — Generate Project File Structure (SCAFFOLDING)
```
Create the complete folder and file structure for [APP NAME] built with [STACK]. Include: src/components, pages, hooks, utils, types, services, constants. Also include config files (.env.example, README, .gitignore). Output as a tree diagram with a 1-line description of what each file/folder holds.
```
> **Pro tip**: Paste this tree into Lovable or Replit as the very first prompt. Clean structure = clean code.

---

## DAY 2 — UI Design System

### Prompt 4 — Build the Design Token System (DESIGN)
```
Create a complete design token system for [APP NAME] with this brand vibe: [DESCRIBE: modern/playful/enterprise/dark etc]. Output CSS variables and Tailwind config for: primary and secondary colors (with 9-shade scales), typography scale (display, heading, body, caption), spacing scale, border radius tokens, shadow levels, and animation easing values.
```
> **Pro tip**: Reference a brand you admire as a mood anchor. It gives the AI a concrete aesthetic target.

### Prompt 5 — Create Core Component Library (FRONTEND)
```
Using the design tokens above, build these reusable React components: Button (primary, secondary, ghost, destructive variants + loading state), Input (with label, error, helper text), Card (with header, body, footer slots), Badge, Avatar, Modal, Toast notification, Skeleton loader. Each component must be accessible (ARIA) and accept a className prop for extension.
```
> **Pro tip**: Skeleton loaders and loading states are day-1 work, not polish. Ship them together.

### Prompt 6 — Build Responsive Layout Shell (FRONTEND)
```
Create the main app layout shell with: a responsive sidebar nav (collapsible on mobile), top header bar with user avatar and notifications icon, main content area with proper padding, and a mobile bottom navigation bar. Use the component library above. Handle authenticated vs unauthenticated states with conditional rendering.
```
> **Pro tip**: Test mobile layout first. Most vibe coders build desktop and scramble to fix mobile later.

---

## DAY 3 — Authentication & Users

### Prompt 7 — Implement Auth Flow with Supabase (AUTH)
```
Set up complete authentication using Supabase Auth for [APP NAME]. Include: email + password signup with email verification, magic link login option, Google OAuth (and Apple if mobile), persistent sessions with auto-refresh, protected route wrapper component, auth state context with useAuth() hook, and loading/error state handling on all auth screens.
```
> **Pro tip**: Always add email verification on signup, even in MVP. Unverified email lists are worth nothing.

### Prompt 8 — Build User Profile System (BACKEND)
```
Create a user profiles system that extends Supabase auth.users with a public profiles table. Include: profile creation trigger on signup, fields for display_name, avatar_url, bio, and custom fields relevant to [APP TYPE]. Build a profile settings page with avatar upload (to Supabase Storage), form validation, and optimistic UI updates.
```
> **Pro tip**: Store avatars in Supabase Storage, not in your database. Never store binary data in a DB column.

### Prompt 9 — Role-Based Access Control (SECURITY)
```
Implement RBAC for [APP NAME] with roles: [LIST ROLES e.g. admin, member, viewer]. Using Supabase Row Level Security: write RLS policies for each role on every table, create a usePermissions() hook that returns boolean checks like canEdit, canDelete, canViewBilling, add role badges to the UI, and document the permission matrix as a comment in the code.
```
> **Pro tip**: Write your RLS policies on Day 3, not after launch. Retrofitting security is painful and risky.

---

## DAY 4 — Core Features & Backend

### Prompt 10 — Design & Migrate Database Schema (DATABASE)
```
Design the complete PostgreSQL schema for [APP NAME] with tables for: [LIST MAIN ENTITIES]. For each table include: primary key (UUID), created_at and updated_at timestamps, foreign key relationships with proper ON DELETE behavior, indexes on frequently queried columns, and check constraints for data integrity. Output as a Supabase migration SQL file with comments.
```
> **Pro tip**: Add updated_at trigger to every table from day one. You will need it for sync and audit logs.

### Prompt 11 — Build Core CRUD API Layer (BACKEND)
```
Create a typed API service layer for [MAIN ENTITY] with functions: getAll (with pagination, filtering, sorting), getById, create (with optimistic update), update (partial update support), delete (soft delete pattern), and batch operations. Use Supabase client with proper TypeScript types generated from the schema. Include error handling that surfaces user-friendly messages.
```
> **Pro tip**: Use soft delete (deleted_at column) instead of hard delete. You will thank yourself during support calls.

### Prompt 12 — Implement Real-Time Features (BACKEND)
```
Add Supabase Realtime subscriptions to [APP NAME] for: live updates on [TABLE NAME] when records are inserted or updated, presence indicators showing who is online, and optimistic UI updates that reconcile with server state. Build a useRealtimeSubscription() hook that handles subscribe, unsubscribe on unmount, and reconnection logic.
```
> **Pro tip**: Scope your realtime subscriptions tightly with filters. Broad subscriptions kill performance at scale.

### Prompt 13 — File Upload & Storage System (BACKEND)
```
Build a complete file handling system using Supabase Storage: drag-and-drop upload component with progress bar, file type and size validation (client and server side), image compression before upload using browser-image-compression, signed URL generation for private files, bulk delete with confirmation dialog, and a file gallery UI component.
```
> **Pro tip**: Always validate file type by reading the MIME type bytes, not just the file extension. Extensions lie.

---

## DAY 5 — Payments & Integrations

### Prompt 14 — Stripe Subscription Setup (PAYMENTS)
```
Integrate Stripe into [APP NAME] for [SUBSCRIPTION TIERS e.g. Free, Pro $19/mo, Business $49/mo]. Build: Stripe Checkout session creation from a Supabase Edge Function, webhook handler for payment events (checkout.completed, subscription.updated, subscription.deleted), user subscription status stored in Supabase and synced on webhook, billing portal link for self-service plan management, and feature gating based on plan.
```
> **Pro tip**: Test every webhook event in Stripe CLI before going live. Especially subscription cancellation and failed payment.

### Prompt 15 — Transactional Email System (INTEGRATIONS)
```
Set up transactional email for [APP NAME] using Resend (or Postmark). Build a Supabase Edge Function email service with templates for: welcome email on signup, email verification, password reset, subscription confirmation, weekly digest (if applicable), and payment failure warning. Each template should use a responsive HTML layout consistent with the app brand colors.
```
> **Pro tip**: Send a plain-text fallback version with every HTML email. It improves deliverability significantly.

### Prompt 16 — Third-Party API Integration (INTEGRATIONS)
```
Integrate [EXTERNAL API e.g. OpenAI, Google Maps, Twilio] into [APP NAME]. Build: a Supabase Edge Function as a secure proxy (never expose API keys to the client), rate limiting per user using a requests table, error handling with user-friendly fallback messages, usage tracking logged to the database, and a UI component that shows loading, success, and error states clearly.
```
> **Pro tip**: Always proxy third-party API calls through your backend. Client-side API keys get scraped and abused.

---

## DAY 6 — Security, Testing & Performance

### Prompt 17 — Security Audit & Hardening (SECURITY)
```
Audit and harden [APP NAME] for production. Check and fix: all Supabase RLS policies are enabled on every table, environment variables are never exposed to the client, all user inputs are sanitized before DB writes, rate limiting is applied to auth and API endpoints, CORS headers are correctly configured on Edge Functions, and the Content Security Policy header is set.
```
> **Pro tip**: Run Supabase's built-in security advisor in the dashboard. It flags RLS gaps automatically.

### Prompt 18 — Global Error Handling & Logging (RELIABILITY)
```
Implement production-grade error handling for [APP NAME]: a global React error boundary that catches UI crashes and shows a friendly fallback, async error handling wrapper for all API calls with typed error responses, user-facing toast notifications for actionable errors only, error logging to Sentry (or LogFlare) with user context attached, and a network connectivity detector that queues failed mutations for retry.
```
> **Pro tip**: Log errors with user ID and the action they were taking. Anonymous stack traces are nearly useless.

### Prompt 19 — Performance Optimization Pass (PERFORMANCE)
```
Optimize [APP NAME] for performance: implement React.lazy and Suspense for route-level code splitting, add React Query (or SWR) for server state caching with stale-while-revalidate, virtualize any lists over 50 items using react-virtual, add database indexes for the 5 most common query patterns, compress and lazy-load all images, and measure with Lighthouse — target 90+ score on all metrics.
```
> **Pro tip**: Run Lighthouse before optimizing so you have a baseline. Otherwise you are guessing what to fix.

### Prompt 20 — Write Critical Path Tests (TESTING)
```
Write tests for the critical paths in [APP NAME] using Vitest and Playwright. Cover: unit tests for utility functions and custom hooks, integration tests for auth flow (signup, login, logout, session refresh), integration tests for the main CRUD operations with mocked Supabase, and one end-to-end Playwright test for the core user journey from landing page to completing the primary action.
```
> **Pro tip**: If you only write one test, make it the e2e for your core conversion path. That is your revenue-critical flow.

---

## DAY 7 — Launch Prep & Go-Live

### Prompt 21 — SEO & Meta Tags Setup (LAUNCH)
```
Add comprehensive SEO to [APP NAME]: dynamic meta title and description per page, Open Graph tags for social sharing previews (og:title, og:description, og:image, og:url), Twitter Card meta tags, a sitemap.xml generated from your routes, robots.txt, and JSON-LD structured data for the homepage. Also add canonical URLs to prevent duplicate content issues.
```
> **Pro tip**: Generate OG images programmatically using Vercel's og:image API. Static OG images age badly.

### Prompt 22 — Analytics & Conversion Tracking (LAUNCH)
```
Instrument [APP NAME] with analytics using PostHog (open source, GDPR-friendly). Track: page views with UTM parameter capture, signup conversion funnel (landing to signup start to email verified to onboarding complete), core feature activation events (first [KEY ACTION] completed), subscription upgrade event with plan and revenue, and a custom dashboard in PostHog showing your North Star metric.
```
> **Pro tip**: Define your North Star metric before you instrument. Otherwise you will track everything and learn nothing.

### Prompt 23 — Production Deployment Checklist (DEVOPS)
```
Prepare [APP NAME] for production deployment to Vercel + Supabase. Complete checklist: configure all environment variables in Vercel dashboard, set up custom domain with SSL, enable Supabase Point-in-Time Recovery backup, configure Supabase connection pooling via PgBouncer, add Vercel Speed Insights, set up GitHub Actions CI/CD pipeline that runs tests before deploy, and configure uptime monitoring via BetterUptime or Checkly.
```
> **Pro tip**: Enable PITR backup in Supabase on day one of production. It only protects data from the moment it is enabled.

### Prompt 24 — Onboarding Flow & Empty States (UX)
```
Build a polished onboarding experience for new users of [APP NAME]: a 3-step guided setup wizard that collects essential profile info, a checklist-style dashboard showing progress toward activation (completing 3 key actions), empty state components for every list/grid with a clear CTA, a contextual tooltip system for first-time feature discovery, and a skip option on every step with ability to return later.
```
> **Pro tip**: Users who complete your onboarding checklist retain at 3 to 5x the rate of those who skip it. Prioritize it.

### Prompt 25 — Post-Launch Monitoring Setup (DEVOPS)
```
Set up a post-launch monitoring stack for [APP NAME]: Sentry for frontend and Edge Function error tracking with alert thresholds, Supabase dashboard alerts for database CPU and connection pool usage, Vercel Analytics for Core Web Vitals regression alerts, a status page using Instatus or Statuspage.io listing your key services, and a weekly automated report emailing you: new signups, active users, errors count, and revenue.
```
> **Pro tip**: Set a Slack alert for error rate spikes above 1%. Catch outages before your users tweet about them.

---

## Application Examples

### SaaS / Web App
- Use the full 7-day sequence for any greenfield app — resist the urge to skip planning phases
- Define your North Star metric before instrumenting analytics (Prompt 22)
- Write RLS policies on Day 3, not after launch (Prompt 9)

### Client Portals / Tools
- MVP scope: booking form + lead capture → Day 1–3 only (foundation + auth + CRUD)
- Get client approval on PRD output (Prompt 1) before Day 2
- Never expose API keys client-side (Prompt 16 rule)

### Internal JARVIS Tools
- When building any dashboard feature or internal data tool: follow this sequence
- Especially Prompt 9 (RBAC) if the tool ever gets a multi-user layer

---

## Output
- Vision brief: `projects/[app-name]/vision-brief.md`
- PRD: `projects/[app-name]/prd.md`
- Daily commit log: `projects/[app-name]/build-log.md`
- Operator notified (via iMessage/Slack) at end of each day with: day complete, what was built, blockers if any

## Rules
- Never start Day N+1 without fully validating Day N's output
- One prompt at a time — no batching
- GitHub commit is non-negotiable at end of each day
- If any prompt produces output that doesn't match the stack: stop, diagnose, don't continue building on bad foundation
- For agency client builds: get client approval on PRD (Prompt 1 output) before Day 2
- Cross-reference against existing tech decisions in memory/context.md before recommending stack changes
