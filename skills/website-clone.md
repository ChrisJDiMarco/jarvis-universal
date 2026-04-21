# Skill: Website Clone

## Trigger
"clone [site]", "make something like [site]", "inspired by [site]", "copy the design of", "build a site like", "replicate [url]"

## Goal
Produce a faithful visual clone of a target website adapted for a new brand — matching the actual aesthetic, layout, color system, and interaction patterns of the original. Zero guessing from scraped text alone.

## The Non-Negotiable Rule
**Never build before seeing.** The #1 failure mode is scraping JSON content and inferring the design from section titles. Always complete all recon steps before writing a single line of HTML. A single screenshot at step 1 prevents the entire class of "you gave me something totally different" failures.

---

## 5-Step Clone Protocol (Always Execute In Order)

### Step 1 — SEE IT FIRST (visual screenshot)
Use `mcp__Claude_in_Chrome__computer` to navigate to the URL and take a full screenshot. Look at it carefully before doing anything else. Note:
- Light vs dark theme
- Typography style (serif? geometric? condensed?)
- Background treatment (gradient? illustrated? photo? flat color?)
- Card style and UI component patterns
- Animation/interaction signals
- Overall mood (playful? corporate? editorial? minimal?)

If the page has critical sections below the fold, scroll and screenshot those too.

### Step 2 — EXTRACT BRANDING
Run `firecrawl_scrape` with `formats: ["branding"]` on the target URL. This returns:
- Exact color palette (primary, secondary, accent, background, text)
- Font stack (display font + body font + weights)
- Spacing system and border-radius conventions
- UI component patterns (button styles, card borders, etc.)

### Step 3 — EXTRACT FULL DOM + CSS
Use `mcp__Claude_in_Chrome__read_page` or `mcp__Control_Chrome__get_page_content` to pull the actual rendered HTML and computed styles. Look for:
- Grid/flex layout patterns
- Section structure and naming
- CSS animation/transition patterns
- Responsive breakpoints
- Any custom component patterns that aren't obvious from a screenshot

### Step 4 — SCROLL & SCREENSHOT ALL KEY SECTIONS
Use Claude in Chrome to scroll through the full page and capture screenshots of each major section: hero, feature splits, bento/grid, pricing, footer. This catches:
- Elements that only appear on scroll
- Section-specific background changes
- Animation states
- Mobile layout differences if relevant

### Step 5 — BUILD with full visual reference
Only now open the elite-web-ui skill and build. Inform every decision from the recon above:
- Match the exact color palette from Step 2
- Match the layout structure from Step 3
- Match the visual mood from Steps 1 and 4
- Replace all content with the new brand (your product, client name, etc.) but keep the design system faithful

---

## Output Standard
The finished clone should be visually indistinguishable from the original at a glance — same energy, same layout density, same color temperature — with the new brand's content and identity swapped in.

## Common Failure Modes (Avoid These)
- ❌ Using Firecrawl JSON extraction only (gives you text content, not visual design)
- ❌ Building a dark theme when the original is light (or vice versa)
- ❌ Using the wrong typography category (serif original → building with sans-serif)
- ❌ Missing illustrated or textural background elements (clouds, paper, grain, mesh)
- ❌ Skipping the scroll-through and missing below-fold design decisions

## References
- `skills/elite-web-ui/SKILL.md` — design system, animation patterns, component library
- `skills/elite-web-ui/references/design-system-2026.md` — color, typography, shadows
- `skills/elite-web-ui/references/vanilla-animation-patterns.md` — zero-dependency animations
