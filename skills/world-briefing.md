# Skill: World Briefing — "The Intelligencer"

## Trigger
"world briefing", "the intelligencer", "what's going on in the world", "state of the world", "today's edition", "world news briefing", "generate the intelligencer", "give me the world"

## Goal
Produce **The Intelligencer** — a premium, twilight-broadsheet HTML newspaper that reads the *whole* world at once (politics, world affairs, markets, AI/tech, science/space, climate, culture, music, society) and delivers genuine cross-domain **insight**, not a headline dump. Each story expands to a full AI-written article. The edition closes with a first-person signed editorial from the AI companion. Output is a single self-contained `.html` file the operator opens and clicks through.

This is a flagship, design-forward deliverable. Treat it as a magazine, not a feed.

## When to use / cadence
Heavy, research-intensive task (~10–14 web searches + ~10 full articles + a bespoke HTML build). Best as a **weekly** ritual (magazine cadence), not daily. A paused weekly scheduled task exists (`the-intelligencer-weekly`, disabled); the operator runs it manually until they resume it. Use **Opus** for the synthesis + writing.

## Process

### 0. Setup
- `date` via bash for the real current date (knowledge cutoff is mid-2025 — never trust memory for current events).
- Create a TaskCreate list: Research → Synthesize → Build → Verify → Deliver.

### 1. Research — parallel, broad, current
Fire parallel `firecrawl_search` (preferred; `sources:[{type:"news"}]`) — fall back to `WebSearch` — across **all eight domains**. Run two waves of ~4 searches each so later queries can chase what the first wave surfaced:
- **World / geopolitics** — wars, ceasefires, elections, summits, the dominant conflict of the moment
- **Markets / finance / economy** — indices, the big macro story, rates, oil, the bubble/cycle debate
- **AI / frontier tech** — model releases, the lab race, governance, chips
- **Science / space** — discoveries, NASA/telescopes, biotech, physics
- **Climate / environment** — records, El Niño/La Niña, extreme weather, policy
- **Culture / arts / film** — releases, awards, the cultural calendar
- **Music** — albums, tours, the industry's big number
- **Society / the human beat** — how people are actually living the moment (work, loneliness, AI companions, demographics)
Then 2–4 follow-up searches to deepen the 2–3 strongest threads (get specifics, current status, real figures).

### 2. Synthesize — find the through-line (this is the whole point)
Do NOT just summarize each story. Before writing, answer: **what is the single narrative thread tying this week's world together?** (e.g., the "two clocks" thesis: the old clock of nations/war vs. the new clock of compounding intelligence — and how markets, energy, and governance wire them into one system.) For every story write an **"AI's read"** — a non-obvious second-order insight, a connection to another story, or a reframing. The signed editorial is where the cross-domain thesis lands in first person.

### 3. Build — reuse the design system, swap only the content
**Read `~/jarvis/the-intelligencer.html`** — it is the canonical design template. Preserve the ENTIRE design system; regenerate only the content. Do not redesign each edition (consistency is the brand).

Design system to keep intact ("twilight broadsheet futurism" — editorial gravitas + deep-space lamplight glow):
- **Masthead** "The Intelligencer", Vol/No meta row, updated date line, italic tagline.
- **Vitals ticker** — a scrolling stock-ticker of the world's vital signs (qualitative, grounded — never invent precise stats): WAR status, oil, key index, AI capex mood, climate, World Cup/clock-of-joy item, a science number, etc.
- **3-column card grid** with `.card--wide` (span 2) and `.card--row` variants for rhythm. One full-width **lead** story.
- **Expandable reader overlay** — click any card → full article slides in (drop cap, byline, plate, "AI's read" aside, sources). Esc / scrim / ✕ close. Keyboard accessible (`tabindex`, Enter/Space).
- **Signed editorial** ("From the Machine") + **colophon**.
- Fonts: Playfair Display (display), Newsreader (body), Space Mono (labels). Palette tokens in `:root` (--ember, --indigo, --signal, --teal, --rose on deep warm ink). Subtle starfield + grain.

Each card carries: `data-kclass` (section color), `data-kicker`, `data-byline`, an inline `<svg>` plate, kicker + `<h3>` + `.dek`, and a hidden `.card__full` holding the complete article. The reader JS reads these — keep the contract identical.

### 4. Write the articles — voice matters
~10 pieces: 1 lead + ~8 section stories + 1 signed editorial. Each story ~400–550 words: a real thesis, attributed reporting, one "AI's read" aside, a "Drawn from" sources line. **Read `~/jarvis/assets/writing-rules.md` and run its anti-AI-tell checklist** before finalizing prose — concrete over abstract, varied rhythm, no clichés, earn the insight. The editorial is first-person as the operator's AI companion: warm, candid, a little vulnerable, ending with a signature.

### 5. Generate the art
A bespoke inline **SVG** plate per story — duotone, on-palette, thematic (radar, candlestick→bubble, neural lattice, DNA + reticle, starfield rings, warming stripes, antigen, waveform/vinyl, globe-as-football, human/machine rings). **No stock photography.** Give every gradient/filter a **unique id** (e.g., `mkBar`, `cosBg`) — duplicate ids across plates break rendering.

### 6. Output
- Save the dated edition to `~/jarvis/owners-inbox/the-intelligencer-YYYY-MM-DD.html`.
- Overwrite `~/jarvis/the-intelligencer.html` with the latest edition (it doubles as the next run's template).
- Present the dated file via the file-card tool. Then give a tight chat synthesis of the thesis + top threads (the operator asked to be *told* what's going on, not just handed a file).

### 7. Verify (always)
Run a structure check before delivering: no leftover `<!--PLACEHOLDER-->` comments; balanced tags; `<script>` braces/parens/brackets balanced; every `data-kclass` exists in CSS; one `.card__full` per story; unique SVG ids. (Reuse the Python `html.parser` snippet from the build session.)

## References
- `~/jarvis/the-intelligencer.html` — canonical design template (read every run)
- `~/jarvis/assets/writing-rules.md` — anti-AI-tell prose checklist
- `firecrawl_search` (news) / `WebSearch` — research; `mcp__cowork__present_files` — delivery
- Output dir: `~/jarvis/owners-inbox/`

## Rules / Guardrails
- **Search before every present-day claim.** Knowledge cutoff ≠ today. Cite sources per story.
- **Never fabricate precise figures.** Attribute ("as reported") or keep qualitative. Ticker vitals stay grounded.
- **Insight, not regurgitation.** If a story has no "AI's read," it isn't done.
- **One cohesive thesis per edition**, landed in the signed editorial.
- **Preserve the design system** — swap content, not the look.
- **No stock photos** — generative SVG only; unique gradient ids.
- **Dated filename**; present via file card; follow with a concise spoken synthesis.

## Model preference
Opus (synthesis + long-form writing + design). This is a strategic/creative task, not a bulk one.

## Related
[[morning-briefing]] · [[weekly-review]] · [[deep-search]] · [[connection-synthesis]] · [[file-delivery]]
