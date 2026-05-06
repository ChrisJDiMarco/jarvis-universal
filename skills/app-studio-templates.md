# App Studio — Quick-Reference Templates

> Copy-paste starting points for every phase. Fill every [BRACKET] before running.

---

## Vision Brief Template
> Save to: `projects/[app-name]/vision-brief.md`

```markdown
# Vision Brief: [APP NAME]

**App name**: [name]
**Tagline**: [one-liner value prop]
**Problem**: [one sentence — the specific pain this solves]
**Target user**: [specific person, not "everyone" — e.g. "solo consultants who invoice via email"]
**Core loop**: [the 1 action users repeat most — e.g. "create → share → get paid"]
**Platform targets**: [web | mobile | native iOS | all]
**MVP features**:
  1. [feature 1 — the core loop]
  2. [feature 2]
  3. [feature 3]
  4. [feature 4 — optional]
  5. [feature 5 — optional]
**Post-launch v2** (DO NOT BUILD NOW):
  - [thing 1 users will ask for]
  - [thing 2]
**Revenue model**: [free | subscription | one-time | B2B SaaS | marketplace]
**Backend needed**: [yes — custom logic | no — Supabase handles it | maybe — TBD after PRD]
**Stack deviation**: [none | reason to diverge from App Studio default stack]
**GitHub repo**: [org/repo-name]
**Deploy target**: [Vercel | Railway | EAS | all]
**Deadline / target**: [date or sprint]

---
**Approved by operator**: [ ] YES
**Date approved**: [date]
```

---

## Build Log Template
> Save to: `projects/[app-name]/build-log.md`

```markdown
# Build Log: [APP NAME]

Started: [date]
Target: [platform(s)]
Stack: [confirmed stack]
GitHub: [repo URL]

---

## Phase 1 — Setup
- [ ] Monorepo scaffolded
- [ ] pnpm install clean
- [ ] docker-compose up (Postgres local)
- [ ] .env.example complete
- [ ] GitHub repo created + pushed
- [ ] GitHub Actions workflow added
**Completed**: [date] | **Notes**: [anything unusual]

## Phase 2 — Planning
- [ ] PRD complete (prd.md)
- [ ] File architecture approved (architecture.md)
- [ ] Database schema reviewed
- [ ] PRD approved by operator
**Completed**: [date] | **Notes**: [scope changes from original brief]

## Phase 3 — Building
### Web
- [ ] Design system
- [ ] Component library
- [ ] App shell + nav
- [ ] Auth UI
- [ ] [Feature 1]
- [ ] [Feature 2]
- [ ] [Feature N]

### Mobile
- [ ] Mobile design system
- [ ] Navigation shell
- [ ] Auth
- [ ] [Feature 1]

### Backend
- [ ] FastAPI setup + middleware
- [ ] Database models + migrations
- [ ] API routers
- [ ] Integrations (Stripe, email, storage)
**Completed**: [date] | **Notes**: [deviations from PRD]

## Phase 4 — QA
- [ ] Web build passes
- [ ] Web type-check passes
- [ ] Mobile export succeeds
- [ ] API tests pass
- [ ] All self-healing iterations resolved
**Build errors encountered**: [list any that required manual intervention]
**Completed**: [date]

## Phase 5 — Preview
- [ ] Web local preview clean (no console errors)
- [ ] Auth flow tested end-to-end
- [ ] Core feature tested with real data
- [ ] Mobile preview on Expo Go
- [ ] API Swagger UI verified
- [ ] Preview checklist complete
**Preview URL**: [localhost:5173 | staging URL]
**Completed**: [date]

## Phase 6 — Commit
- [ ] All changes staged
- [ ] Commit pushed to GitHub
- [ ] CI passing
- [ ] Operator notified via iMessage
**Commit hash**: [hash]
**Completed**: [date]

---

## Decisions Log
| Date | Decision | Rationale |
|------|----------|-----------|
| [date] | [what was decided] | [why] |

## Blockers Log
| Date | Blocker | Resolution |
|------|---------|------------|
| [date] | [what was blocked] | [how resolved / still open] |
```

---

## Deploy Manifest Template
> Save to: `projects/[app-name]/deploy.md`

```markdown
# Deploy Manifest: [APP NAME]

**Last updated**: [date]

---

## Live URLs
| Platform | URL | Status |
|----------|-----|--------|
| Web (production) | [vercel URL] | [live / pending] |
| Web (preview) | [vercel preview URL] | [live / pending] |
| API | [railway/render URL] | [live / pending] |
| API Docs | [URL]/docs | [live / pending] |
| Mobile (TestFlight) | [link] | [live / pending] |
| Mobile (Play Store beta) | [link] | [live / pending] |

---

## Environment Variables

### Web (apps/web/.env)
```
VITE_API_URL=
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
VITE_STRIPE_PUBLISHABLE_KEY=
VITE_POSTHOG_KEY=
VITE_SENTRY_DSN=
```

### API (apps/api/.env)
```
DATABASE_URL=
SUPABASE_URL=
SUPABASE_SERVICE_ROLE_KEY=
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
RESEND_API_KEY=
SENTRY_DSN=
JWT_SECRET=
CORS_ORIGINS=
```

### Mobile (apps/mobile/.env)
```
EXPO_PUBLIC_API_URL=
EXPO_PUBLIC_SUPABASE_URL=
EXPO_PUBLIC_SUPABASE_ANON_KEY=
SENTRY_DSN=
```

---

## Service Accounts
| Service | Account | Notes |
|---------|---------|-------|
| Vercel | [account] | [project name] |
| Railway | [account] | [project name] |
| Supabase | [account] | [project ref] |
| Stripe | [account] | [live/test mode] |
| Expo | [account] | [slug] |
| Sentry | [account] | [DSN] |

---

## CI/CD
- GitHub repo: [URL]
- GitHub Actions: [.github/workflows/ci.yml]
- Deploy trigger: push to `main`
- Test gate: lint + type-check + tests must pass

---

## Monitoring Checklist
- [ ] Sentry error tracking active (web + mobile + API)
- [ ] PostHog analytics connected
- [ ] Uptime monitor configured (BetterUptime or similar)
- [ ] Stripe webhook endpoint registered in dashboard
- [ ] Database backups enabled (Supabase PITR)
- [ ] Railway/Render health check URL configured
```

---

## Monorepo Init Commands
> Paste into Bash tool to scaffold instantly.

```bash
# Variables (fill before running)
APP_NAME="my-app"
GITHUB_ORG="your-github-username"
PLATFORMS="all"   # web | mobile | api | all

# Create project directory
mkdir -p ~/jarvis/projects/$APP_NAME
cd ~/jarvis/projects/$APP_NAME

# Init pnpm monorepo
pnpm init
cat > pnpm-workspace.yaml << 'EOF'
packages:
  - 'apps/*'
  - 'packages/*'
EOF

# Create directory structure
mkdir -p apps/web apps/mobile apps/api
mkdir -p packages/shared packages/ui packages/config

# Init apps
cd apps/web && pnpm create vite . --template react-ts && pnpm install && cd ../..
cd apps/mobile && npx create-expo-app . --template blank-typescript && cd ../..
cd apps/api && python3 -m venv venv && source venv/bin/activate && pip install fastapi uvicorn sqlmodel alembic psycopg2-binary python-jose passlib --break-system-packages && cd ../..

# Init git
git init
git remote add origin git@github.com:$GITHUB_ORG/$APP_NAME.git

echo "✅ Monorepo ready for: $APP_NAME"
echo "Next: fill vision-brief.md and run Phase 2"
```

---

## FastAPI App Factory Template
> `apps/api/main.py` — paste and fill.

```python
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from .database import create_db_and_tables
from .routers import auth, users  # add your routers here
import sentry_sdk

sentry_sdk.init(dsn=os.getenv("SENTRY_DSN"), traces_sample_rate=0.1)

@asynccontextmanager
async def lifespan(app: FastAPI):
    create_db_and_tables()
    yield

app = FastAPI(
    title="[APP NAME] API",
    version="1.0.0",
    lifespan=lifespan
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=os.getenv("CORS_ORIGINS", "http://localhost:5173").split(","),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router, prefix="/auth", tags=["auth"])
app.include_router(users.router, prefix="/users", tags=["users"])
# Add more routers here

@app.get("/health")
async def health():
    return {"status": "ok", "version": "1.0.0"}
```

---

## GitHub Actions CI Template
> `.github/workflows/ci.yml`

```yaml
name: CI

on:
  push:
    branches: [main, dev]
  pull_request:
    branches: [main]

jobs:
  lint-typecheck:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v3
        with: { version: 8 }
      - uses: actions/setup-node@v4
        with: { node-version: 20, cache: pnpm }
      - run: pnpm install --frozen-lockfile
      - run: pnpm lint
      - run: pnpm --filter web type-check
      - run: pnpm --filter mobile type-check

  test-api:
    runs-on: ubuntu-latest
    services:
      postgres:
        image: postgres:15
        env:
          POSTGRES_PASSWORD: test
          POSTGRES_DB: testdb
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-python@v5
        with: { python-version: '3.11' }
      - run: cd apps/api && pip install -r requirements.txt --break-system-packages
      - run: cd apps/api && pytest tests/ -x -v
        env:
          DATABASE_URL: postgresql://postgres:test@localhost/testdb

  build-web:
    runs-on: ubuntu-latest
    needs: [lint-typecheck]
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v3
        with: { version: 8 }
      - uses: actions/setup-node@v4
        with: { node-version: 20, cache: pnpm }
      - run: pnpm install --frozen-lockfile
      - run: pnpm --filter web build
```
