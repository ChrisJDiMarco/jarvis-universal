# Learned Lessons: Tool Routing

> Auto-maintained by MetaClaw Learning System. Do not edit manually unless pruning.

### web-tool-routing-decision — tool_routing (confidence: HIGH, seen: 5x+)
**When**: Need to retrieve, scrape, or search any web content
**Rule**: Choose the cheapest tool that will reliably get the job done. Firecrawl costs money; Chrome is free. Default to Chrome for simple cases, Firecrawl for complex ones.
**Why**: Firecrawl is paid-per-call. Chrome MCP is free but slower and limited on dynamic/JS-heavy pages. Neither is always the right tool.

**Decision framework — run this check in order:**

1. **Is it a simple public webpage with no JS rendering needed?**
   → Use Chrome (`get_page_text` or `read_page`) — free, fast enough, no cost
   → Example: static blog post, Wikipedia, a simple About page

2. **Is it a multi-page search or discovery task (need 5+ URLs)?**
   → Use `firecrawl_search` — returns content + URLs in one call, Chrome would require N separate navigations
   → Example: "find 10 competitors in HVAC software", "research AI news today"

3. **Is the page JavaScript-heavy, behind a soft paywall, or known to block scrapers?**
   → Use `firecrawl_scrape` — handles rendering, returns clean markdown, bypasses most anti-bot
   → Example: G2/Capterra reviews, LinkedIn profiles, SaaS pricing pages

4. **Does it require login or form interaction?**
   → Use Chrome MCP (`mcp__Claude_in_Chrome__*`) — the only tool that can handle authenticated sessions
   → Example: GHL dashboard, client portals, anything behind a login

5. **Do you need structured data extracted from a complex page?**
   → Use `firecrawl_extract` with a schema — returns clean JSON, no parsing needed
   → Example: "extract all pricing tiers from this page as JSON"

6. **Is it a whole-site crawl or sitemap?**
   → Use `firecrawl_crawl` or `firecrawl_map` — no Chrome equivalent for this
   → Example: "scrape all blog posts from semrush.com"

**Cost consciousness:** For bulk research tasks (10+ pages), estimate Firecrawl cost before starting. If Chrome can do it in < 3 extra minutes, prefer Chrome. Firecrawl is worth the spend when: time matters, scale is high, or page complexity blocks Chrome.

**Applies to**: researcher, researcher-deep, scout, competitor-intelligence-harness, discovery-audit, all agents
*Last seen: 2026-03-25*

### haiku-for-classification — tool_routing (confidence: HIGH, seen: 5x+)
**When**: Classifying, scoring, extracting structured data, or compressing text
**Rule**: Use Haiku for all classification/extraction/compression tasks — Sonnet is overkill and 5x more expensive
**Why**: Classification is pattern matching, not reasoning. Haiku handles it with equivalent accuracy.
**Fix/Pattern**: Route to Haiku: lead scoring, sentiment analysis, entity extraction, memory compression, lesson extraction
**Applies to**: all agents, n8n-workflow-builder, memory-management, metaclaw-learning
*Last seen: 2026-03-25*
