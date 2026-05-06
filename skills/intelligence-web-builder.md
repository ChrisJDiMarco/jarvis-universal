---
name: intelligence-web-builder
description: Full-stack agency workflow for building $10k+ client websites: FireCrawl market intelligence → competitor analysis report → Claude Code site build → scroll-triggered AI video animation (Nano Banana 2 + Kling) → accessibility/SEO audit → Notion client feedback portal.
trigger: "build a client website", "intelligence website", "website for [client/niche]", "animated client site", "scroll animation website", "pool cleaner website", "local business site", "12k website", "premium client website"
---

# Intelligence Web Builder

## Goal
Build a high-converting, animated client website grounded in market intelligence — not just aesthetics. The output is a scroll-stopping site with a real competitive blueprint underneath it, a 3D scroll-triggered video hero, and a client feedback system.

## When to Use This Skill
- Building a website for an agency client (local business, service company, etc.)
- Need to justify website pricing with a deliverable intelligence report
- Want a hero section with a before/after scroll animation (dirty → clean pool, empty → booked calendar, etc.)
- Client needs a way to request changes without direct access to the code

---

## Phase 1 — FireCrawl Market Intelligence

### 1A. Scrape the Client's Existing Website
```
firecrawl_scrape(url: "[client-url]")
```
Extract: current copy, trust signals, headlines, CTAs, design gaps, SEO issues (duplicate headings, missing schema, etc.).

### 1B. Find Top 5 Competitors
Use FireCrawl search to find the top-ranked competitors in the niche + geography:
```
firecrawl_search(query: "best [niche] in [city/region] site:yelp.com OR site:google.com")
firecrawl_extract(urls: [...top_5_urls], prompt: "Extract: company name, brand colors (hex), services, trust signals, testimonials, headline copy, CTAs, photo style, review count/rating, SEO page structure")
```

Ranking signals to identify winners: Google review count + rating, Trustpilot score, search position, domain authority.

### 1C. Synthesize the Intelligence Report
Build a structured markdown/HTML report with:
- **Executive Summary** — what wins in this market (trust, photos, content depth, etc.)
- **Client Audit** — current site strengths, critical gaps, SEO issues
- **Competitor Profiles** (top 5) — brand colors, review ratings, what they do exceptionally well
- **Color Palette Matrix** — side-by-side color swatches for all 5 competitors
- **Winning Blueprint** — page structure, content patterns, CTAs that appear across all winners
- **SEO Landscape** — keywords all winners rank for, gaps the client can own
- **Proposed Design Direction** — layout, tone, trust signals to include

> 💡 This report is a **deliverable** — give it to the client as part of the sale. It signals expertise and justifies premium pricing.

---

## Phase 2 — Creative Direction + Build

### 2A. Run Creative Direction (before writing any code)

Do NOT just start building. First, use the competitor data from Phase 1 to run the **Creative Direction framework** (full decision system in `.claude/agents/web-designer.md` → Phase 0):

1. **Classify** — extract business type, audience, conversion goal, brand personality, price signal
2. **Style matrix** — use the Phase 1 competitor data to inform palette direction (what wins in this market?), then pick typography, animation intensity, and layout style
3. **Feature selection** — pick sections that match the conversion goal; cut everything else
4. **Hero treatment** — which hero pattern fits this business? (scroll crossfade, split, typographic, bento, etc.)
5. **Output a 5-line Design Brief** — present it, get a "yes", then build

### 2B. Build

With the brief approved, use the intelligence report as the content blueprint:

```
"Build an SEO-optimized website for [client] using the intelligence report as the blueprint
and the approved design brief as the visual direction.
Match the winning structural patterns from the top competitors.
Use the decided color palette and messaging tone.
Leave the hero ready for the scroll-triggered image crossfade (Phase 3).
Make it mobile responsive."
```

**Content rules from the competitor research:**
- Pull real headline/CTA patterns from the top-ranked competitors — don't invent copy
- Use actual review quotes scraped via FireCrawl — never fabricate testimonials
- Mirror the trust signals that appear across 3+ competitors (years in business, certifications, guarantees)
- Match the service terminology the market searches for — don't rename things

**Reference:** `elite-web-ui/SKILL.md` for animation patterns + GPU-safe CSS. Zero external JS CDNs for Cowork preview builds.

---

## Phase 3 — Scroll-Triggered Video Hero Animation

This is the $12k differentiator. A video that plays as the user scrolls — e.g., dirty pool → crystal clean, empty space → finished renovation, before/after service transformation.

### 3A. Generate the Before/After Frames

**Primary option: FAL.ai via Claude in Chrome MCP** — Chris has a FAL account. Navigate to `https://fal.ai` and use Flux or compatible model for image gen. FAL also supports Kling for video generation (see 3B), making the entire Phase 3 fully automated.

**Fallback: Gemini via Claude in Chrome MCP** — navigate to `https://gemini.google.com` if FAL is unavailable.

Never use Python/Pillow for image generation.

**Step-by-step:**

1. Get the tab context:
   ```
   mcp__Claude_in_Chrome__tabs_context_mcp(createIfEmpty: true)
   ```
2. Navigate to Gemini:
   ```
   mcp__Claude_in_Chrome__navigate(url: "https://gemini.google.com", tabId: [id])
   ```
3. Click the prompt input, then type the prompt using `mcp__Claude_in_Chrome__computer` → `type`. If `innerHTML` is blocked by Chrome's TrustedHTML policy, use `execCommand` via `javascript_tool`:
   ```javascript
   document.execCommand('selectAll');
   document.execCommand('insertText', false, 'YOUR PROMPT HERE');
   ```
4. Submit and wait. Take a screenshot to confirm the image rendered.
5. **Download:** Right-click the generated image → a download icon appears → click it. File lands in `~/Downloads/` as `Gemini_Generated_Image_[hash].png`.
6. **Verify** you have the right file — check the filename matches what just downloaded, not a previously cached image.
7. **Copy to site folder** via osascript:
   ```applescript
   do shell script "JARVIS_DIR=${JARVIS_DIR:-$HOME/jarvis}; cp ~/Downloads/'Gemini_Generated_Image_[hash].png' \"$JARVIS_DIR/owners-inbox/hero-before.png\""
   ```
8. Repeat for the AFTER image. After copying, **scroll-test in the browser** to confirm the correct image shows up in the crossfade.

**Prompt structure:**
```
[BEFORE prompt] — e.g.:
"Wooden fishing dock at golden hour dawn, weathered planks, ice chest overflowing with fresh fish,
misty ocean background, fishing boat with crew. Photorealistic, 16:9, cinematic quality."

[AFTER prompt] — e.g.:
"Vibrant fisherman's market display counter, fresh fish on ice, price tags, pendant lighting,
'DAILY FRESH CATCH' signage. Photorealistic, 16:9, warm and inviting lighting."
```

Generate BEFORE first, then AFTER so both images share consistent visual language.

### 3B. Generate the Transition Video (FAL / Kling)

Use FAL.ai via Claude in Chrome MCP — Chris has an active account. FAL supports Kling video generation natively.

- **Start frame:** BEFORE image
- **End frame:** AFTER image
- **Prompt:** "Seamless cinematic transition from neglected [subject] to pristine clean [subject]. Objects transform and dissolve naturally. No cuts. Smooth continuous motion. Any objects exiting do so naturally."
- **Duration:** 5 seconds
- **Quality:** 1080p (upgrade from 720p — noticeable quality jump)
- **No audio** (it's a hero background loop)

Navigate to FAL via Chrome MCP, upload both frames, submit, wait for render, download the `.mp4`. This step is fully automated — no manual handoff needed.

### 3C. Integrate Scroll-Triggered Video into the Website

Drop the video file into the project folder, then prompt Claude Code:

```
"I've added a video file [filename.mp4]. Integrate it at the top of the website as the hero section.
As the user scrolls down, the video should progress — scrolling = video playhead advancing.
The hero background should be white so the video blends in seamlessly.
Use the 3D website builder best practices for the scroll-linked video effect.
Make it feel like the transformation is happening as you scroll down the page."
```

**CSS/JS pattern for scroll-linked video:**
```javascript
const video = document.querySelector('.hero-video');
video.pause(); // don't autoplay

window.addEventListener('scroll', () => {
  const scrolled = window.scrollY;
  const maxScroll = document.body.scrollHeight - window.innerHeight;
  const scrollFraction = scrolled / maxScroll;
  // Map scroll to video duration
  video.currentTime = scrollFraction * video.duration;
});
```

Tune scroll sensitivity: if the hero section is e.g. 200vh tall, map video progress to that section only using `getBoundingClientRect()`.

For mobile: generate a square (1:1) or portrait version of the same animation for breakpoints ≤768px.

---

## Local Preview Protocol

**Never use `file://` URLs.** Claude in Chrome MCP prepends `https://` to them, breaking the page.

Instead:

1. **Check if server is running:**
   ```bash
   lsof -i :8099
   ```
2. **Start if not running** (via osascript):
   ```applescript
   do shell script "JARVIS_DIR=${JARVIS_DIR:-$HOME/jarvis}; cd \"$JARVIS_DIR/owners-inbox\" && nohup python3 -m http.server 8099 > /tmp/httpserver.log 2>&1 &"
   ```
3. **Open in Chrome:**
   ```
   mcp__Control_Chrome__open_url(url: "http://localhost:8099/[filename].html")
   ```
4. **Get tab ID** for screenshot/scroll actions:
   ```
   mcp__Claude_in_Chrome__tabs_context_mcp(createIfEmpty: true)
   ```
5. **Scroll-test the hero crossfade** — scroll 10 ticks and take a screenshot to confirm the after-image is correct.

> The server does not persist between sessions — always restart via osascript.

---

## Phase 4 — Accessibility + SEO Audit

After building, run a comprehensive audit. Prompt Claude Code:

```
"Do a full accessibility and SEO audit of this website. Fix all critical issues. Give me a checklist
of everything you fixed. Specifically check: skip links, ARIA labels, color contrast, form labels,
heading hierarchy, meta tags, OG tags, schema markup, image alt text, touch target sizes,
mobile viewport."
```

This pass typically catches 10–20 fixable issues that would otherwise hurt rankings and conversion. Takes ~2 minutes to run, adds credibility to the deliverable.

---

## Delivery Package

What you hand the client:
1. **Market Intelligence Report** (PDF or hosted HTML) — competitive analysis, color palettes, SEO landscape
2. **Live website** (hosted on Netlify/Vercel/their domain)
3. Optional: **Retainer offer** — monthly updates at flat rate (best pricing model)

---

## Pricing Context

- Intelligence report alone: worth $500–$1,500 as a standalone deliverable
- Full website with animation: $3,000–$12,000+ depending on client size
- Monthly retainer (copy/design updates): $300–$800/mo
- Change request portal = justification for retainer (shows professionalism, eliminates back-and-forth)

---

## Tools Required

| Tool | Purpose |
|------|---------|
| `firecrawl_scrape` | Scrape client site + competitors |
| `firecrawl_search` | Find top-ranked competitors in niche |
| `firecrawl_extract` | Pull structured data (colors, reviews, copy) |
| FAL.ai (Flux) via Chrome MCP | Generate before/after hero frames — Chris has active account |
| FAL.ai (Kling) via Chrome MCP | Generate transition video — fully automated, no manual step |
| Claude Code / elite-web-ui skill | Build the actual website |
| `notion-create-database` + `notion-update-page` | Client feedback portal backend |

---

## Guardrails

- **Never fabricate competitor reviews.** Pull actual text from FireCrawl scrape.
- **White background = non-negotiable** on generated images if you want seamless blend.
- **Test scroll animation on mobile** before delivery — video playback on iOS has quirks (use `playsinline muted` attributes).
- **Run the accessibility audit every time** — not optional. It takes 2 min and prevents SEO damage.
- **Don't use stock photography** in the final build — if client has no photos, generate niche-specific AI images or clearly mark as placeholder.

---

## Reference Files

- `elite-web-ui/SKILL.md` — animation system, CSS patterns, typography
- `elite-web-ui/references/vanilla-animation-patterns.md` — scroll JS patterns
- `competitor-intelligence-harness.md` — deeper research loop if needed
- `seo-content-engine.md` — if client also wants ongoing blog/SEO content
