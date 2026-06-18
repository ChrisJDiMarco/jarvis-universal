# Firecrawl API — Capability Reference

> Source: docs.firecrawl.dev (v2 API + llms.txt index), captured 2026-06-16.
> Base URL: `https://api.firecrawl.dev` · Auth: `Authorization: Bearer fc-...`
> Two ways to call it from JARVIS: **installed MCP tools** (`firecrawl_*`) or **raw REST** (`/v2/*`). Per [[api-over-mcp]], prefer raw REST once an endpoint is used 3+ times.

---

## Decision guide — which ability for which job

**JARVIS routing rule:** when a task means getting data off the web, pick the best-suited Firecrawl ability automatically and go. Stop to ask the operator which aspect only when scope or method is genuinely ambiguous (triggers below).

| If the goal is to… | Use | Notes |
|---|---|---|
| Get the content of **one known page** | Scrape | Cleanest single fetch → markdown/JSON |
| **Find** something without a known URL | Search | Web/news/images + optional page content |
| List **every URL** on a site | Map | Discovery only, no content |
| Pull content from **many/all pages** of a site | Crawl | Recursive, async (Map first if you only need URLs) |
| Pull the **same fields** across pages (prices, names, specs) | Extract | Schema/prompt → structured JSON |
| Read a **local or non-public file** (PDF, docx) | Parse | File → markdown |
| Page needs **clicking / forms / login / JS** | Interact (after a scrape) | Drive the live page |
| A **fuzzy goal** across unknown pages ("find me X and its price") | Agent (FIRE-1) | Autonomous navigation |
| **Watch** a page/site for changes over time | Monitor | Recurring + webhook/email alerts |
| Scrape a **fixed list of URLs** in bulk | Batch Scrape (REST) | One async job |

**Quick flow:** known single URL → Scrape · no URL yet → Search · whole site → Map then Crawl · repeated fields → Extract · local file → Parse · needs interaction → Interact/Agent · ongoing → Monitor.

**Ask the operator which aspect when:**
- "Get data from site X" — one page or the whole site? (Scrape vs Crawl)
- "Track competitor Y" — one-time snapshot or ongoing monitoring? (Scrape vs Monitor)
- "Research topic Z" — a quick search or a deep multi-page crawl/agent pass?
- Output unclear — markdown for reading vs structured JSON for data.

Otherwise: choose, proceed, and name which ability was used and why in one line.

**Standing exceptions:** GitHub → use Claude in Chrome (the operator's [[github-access]] rule), not Firecrawl. When a target has its own direct MCP (Gmail, GCal, Notion, Slack, Drive), prefer that over Firecrawl.

---

## The 6 core things Firecrawl does

| # | Capability | What it does | REST endpoint | MCP tool (installed) |
|---|-----------|--------------|---------------|----------------------|
| 1 | **Scrape** | One URL → clean markdown / HTML / structured JSON / screenshot / links. Handles JS rendering, proxies, anti-bot. | `POST /v2/scrape` | `firecrawl_scrape` |
| 2 | **Search** | Web search → results with optional full-page content. Sources: web, news, images. | `POST /v2/search` | `firecrawl_search` (+ `firecrawl_search_feedback` refunds 1 credit) |
| 3 | **Map** | Discover every URL on a site, fast. | `POST /v2/map` | `firecrawl_map` |
| 4 | **Crawl** | Recursively pull content from an entire site. | `POST /v2/crawl` (+ status/errors/active/cancel) | `firecrawl_crawl`, `firecrawl_check_crawl_status` |
| 5 | **Extract** | Schema/prompt-driven structured-JSON extraction across one or many URLs. | scrape JSON mode / `/extract` | `firecrawl_extract` |
| 6 | **Parse** | Upload a local/non-public file (PDF, docx, etc.) → LLM-ready markdown. | `POST /v2/parse` | `firecrawl_parse` |

---

## Agentic / interactive layer

| Capability | What it does | REST | MCP tool |
|-----------|--------------|------|----------|
| **Agent (FIRE-1)** | Autonomous AI agent gathers web data from a plain-English goal — navigates and interacts on its own. | `POST /v2/agent` | `firecrawl_agent`, `firecrawl_agent_status` |
| **Interact** | After a scrape, keep working the page: click, fill forms, run code, extract dynamic content. Prompt or code; returns a live-view URL. | `POST /v2/scrape/{id}/interact` (+ `DELETE` to stop) | `firecrawl_interact`, `firecrawl_interact_stop` |
| **Browser Sandbox** | Managed, controllable browser sessions for multi-step interactive workflows. | `POST` browser-create, list sessions | *REST only — no MCP tool installed* |

---

## Monitoring & change detection

Schedule recurring scrapes/crawls, detect content changes, get webhook or email alerts.

| Action | REST | MCP tool |
|--------|------|----------|
| Create / get / list / update / delete monitor | monitor-create/get/list/update/delete | `firecrawl_monitor_create`, `_get`, `_list`, `_update`, `_delete` |
| Run a monitor now | monitor-run | `firecrawl_monitor_run` |
| Get / list monitor checks | monitor-check-get, monitor-checks-list | `firecrawl_monitor_check`, `firecrawl_monitor_checks` |

---

## Batch & async

| Capability | What it does | REST | MCP |
|-----------|--------------|------|-----|
| **Batch Scrape** | Many URLs in one async job (+ status, errors, cancel). | `POST /v2/batch/scrape` | *REST only — no MCP tool installed* |
| **Webhooks** | Async event delivery: crawl started/page/completed, batch-scrape started/page/completed, monitor check-completed/page. | webhooks-openapi | n/a (delivered to your endpoint) |

---

## Account & observability (REST only — no MCP tools)

| Endpoint | Returns |
|----------|---------|
| **Activity** | Your team's API jobs from the last 24h (job IDs to fetch full results). |
| **Credit Usage** / Historical | Current + historical credit consumption. |
| **Token Usage** / Historical | Current + historical token consumption. |
| **Queue Status** | State of your async job queue. |
| **Ask** | AI support agent that diagnoses job/account/API issues. |
| **Docs Search** | Q&A over the public Firecrawl docs corpus. |

---

## Output formats (scrape / search / crawl)

`markdown` · `html` · `rawHtml` · `links` · `screenshot` (incl. full-page) · `json` (schema extraction) · `summary` · `branding` (brand style-guide extraction) · change-tracking.

Common scrape options: only-main-content, include/exclude tags, wait-for, page actions, geolocation, and `maxAge` caching.

## Special modes

- **Lockdown Mode** — cache-only scraping, zero outbound traffic (compliance / air-gapped).
- **Agent Auth (WorkOS ID-JAG)** — lets identity-aware agents mint their own API keys.
- **Partner Integration API** — approved partners create/manage keys for their own users.

---

## How you can reach the API (access methods)

- **REST** — `https://api.firecrawl.dev/v2/*`, Bearer auth. OpenAPI specs published (v2, v1, v0, webhooks).
- **Official SDKs** — Python, Node, plus Go, Rust, Java, Elixir, .NET, PHP, Ruby.
- **CLI** — `npx firecrawl-cli` (also installs agent "skills").
- **MCP server** — what JARVIS uses now (the `firecrawl_*` tools).
- **Framework integrations** — LangChain, LangGraph, LlamaIndex, OpenAI, Anthropic, Vercel AI SDK, Mastra, Google ADK.
- **No-code / workflow** — n8n, Make, Zapier, Dify.

---

## Gaps between the full API and JARVIS's installed MCP

Available via REST but **not** as installed MCP tools right now: Batch Scrape, Browser Sandbox sessions, and all the account/observability endpoints (Activity, Credit/Token Usage, Queue Status, Ask, Docs Search). If a workflow needs those, call the REST endpoint directly with the `FIRECRAWL_API_KEY`.

## Related
[[api-over-mcp]] · [[mcp-discovery]] · [[firecrawl]] (Live Integrations in CLAUDE.md)
