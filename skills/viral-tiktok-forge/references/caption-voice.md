# Caption Voice — AI-Smell Prevention

Read in Phase F every time. The single highest-leverage element of viral output that AI consistently breaks.

---

## The Problem

Claude (and every other LLM) defaults to "AI voice":
- Em-dashes everywhere
- "It's not just X — it's Y" structure
- Polished grammar, no fragments
- Verbs: `transforms`, `elevate`, `unleash`, `harness`, `leverage`
- "In a world where..." openers
- Adjective stacks: `revolutionary, groundbreaking, transformative`

Real human short-form social copy looks nothing like this. The mismatch is the AI fingerprint.

This file is the prevention protocol.

---

## The Voice Contract (System Prompt)

Use this verbatim in Phase F's caption-generation call:

```
Voice: [LOAD FROM OPERATOR SPEC; default "casual, specific, slightly understated"]

You are writing a TikTok caption that pairs with a [VISUAL HOOK]. The caption opens
with a hook line that mirrors the visual hook. Total length: 100-150 characters.

REQUIREMENTS:
- Lowercase preferred (capitalize proper nouns only).
- Fragments are fine. Run-ons are fine. Periods optional.
- Specificity beats abstraction. Numbers, brand names, exact details > generic claims.
- The opener does NOT explain the video. It hooks the viewer into wanting to watch.

FORBIDDEN (these are AI fingerprints):
- Em-dashes (—) and en-dashes (–). Use commas instead. ZERO em-dashes.
- "It's not just X — it's Y" structure. Drop both halves.
- Verbs: transforms, elevate, unleash, harness, leverage, embark, dive into, journey,
  revolution, revolutionary, groundbreaking, transformative, game-changer, paradigm.
- Adjective stacks (3+ adjectives in a row).
- "In a world where..." openers.
- "Whether you're X or Y..." openers.
- Marketing language: best-in-class, cutting-edge, next-generation, world-class.

PREFERRED:
- Concrete sensory details ("steam rising off shoulders," "38° water," "$200 cheaper")
- Personal stakes ("starting today," "for the next 30 days," "posting the receipts")
- Conversational rhythm ("and i'm convinced this is...", "turns out...", "hot take:")
- Specific time / number / brand references
```

Adjust the Voice line per operator. Defaults per Gate 2:
- **No spec voice loaded** → "casual, specific, slightly understated"
- **Operator-personal-brand topics** → load from `~/jarvis/memory/core.md` if present
- **Agency-client topics** → load from client brief; default to "casual confident" if missing

---

## The Em-Dash Post-Strip (Hard Rule 3)

Even with the system prompt above, Claude will produce em-dashes ~30% of the time. Mandatory post-process.

```python
# scripts/strip_ai_smell.py — applied to every caption
caption = caption.replace("—", ", ")  # em-dash → comma
caption = caption.replace("–", ", ")  # en-dash → comma
caption = caption.replace("…", "...")  # ellipsis char → 3 periods
```

The replacement is `comma + space`, not just comma — em-dashes typically have spaces around them already; replacement preserves natural pause without doubling spaces.

---

## The Forbidden Phrase Scanner

Beyond em-dashes, scan for these phrases. **Flag, don't auto-edit** — operator should see the smell and decide whether to rewrite or keep.

### Tier 1 — Auto-flag (highest AI-smell signal)
```
isn't just
not just X but Y
transforms
elevate
unleash
harness
leverage
embark
dive into
revolutionary
groundbreaking
transformative
game-changer
paradigm shift
in a world where
whether you're
```

### Tier 2 — Warn (sometimes appropriate, often not)
```
journey
adventure
ultimate
essential
must-have
key to
unlock
mastery
discover
explore
empower
```

### Tier 3 — Adjective-stack pattern (3+ adjectives)
Regex: `(\w+ly\s+){0,1}\w+,\s+\w+,\s+\w+`
Examples to flag: "revolutionary, groundbreaking, transformative" / "fast, easy, affordable"

---

## Hashtag Bundle Composition

Total: 10 hashtags. Distribute:

| Tier | Count | Post volume | Purpose |
|------|-------|-------------|---------|
| **Broad** | 3 | >1M posts | Discovery — algorithm reach |
| **Niche** | 4 | 50k–500k | Community fit — targeted audience |
| **Community** | 3 | <50k | Early-engagement boost — loyal small communities |

### Selection rules
- Broad tags should match the topic's most general category (`#wellness`, `#startup`, `#cooking`)
- Niche tags should match the specific sub-domain (`#coldtherapy`, `#indiehacker`, `#sourdough`)
- Community tags should match what insiders use (`#plungelife`, `#shipfast`, `#breadtok`)

### Anti-patterns
- Don't repeat words across tiers (`#wellness` AND `#wellnessjourney` AND `#wellnesstips` — too redundant)
- Don't mix unrelated topic spaces (`#cooking` + `#crypto` = algorithm confusion)
- Don't use #fyp or #foryoupage — TikTok's algorithm doesn't reward them and they signal amateur

### Research path (if you don't know the topic's hashtag landscape)
- Default to operator's existing hashtag patterns if available (check past TikTok captions in their content folder)
- Fall back to TikTok's discover-page suggestions for the broad tags
- Niche/community tags require domain knowledge — operator may need to provide

---

## Posting Strategy Defaults

Per Gate 2 — defaults; operator can override per topic:

- **Best time**: weekday 6–8pm EST
- **Day of week**: Tuesday-Thursday best for most topics; Saturday for lifestyle; Sunday evening for inspirational
- **Sound**: Seedance-generated native audio is default; flag if topic implies trending-audio match would lift performance (e.g., dance/music topics, comedy)
- **Caption style** by topic:
  - Founder content: declarative + receipts ("built this in 6 months, live today")
  - Lifestyle: sensory + personal ("starting [thing] for the next 30 days")
  - Educational: hook + payoff promise ("this is why X actually works")
  - Comedy: setup + tension ("POV: when you realize...")

---

## Worked Example — Voice Contract Application

**Visual hook**: Steam rising from icy water in a black tub. Person's silhouette frozen in approach.

**Topic**: cold plunge tub
**Voice**: `casual, specific, slightly understated` (default)

**Bad (AI smell)**:
> Embark on a transformative wellness journey with our revolutionary cold plunge tub — the ultimate way to elevate your morning routine and unleash your body's full potential.

**Reasons**: `embark`, `transformative journey`, `revolutionary`, `ultimate`, `elevate`, `unleash`, em-dashes, marketing voice.

**Good (post-strip)**:
> 3 minutes in 38° water and i'm convinced this is cheaper than therapy. starting my mornings here for the next 30 days, posting the receipts.

**Reasons**: lowercase, specific number (3 minutes, 38°), personal stake (cheaper than therapy), commitment marker (next 30 days), authenticity signal (posting the receipts), conversational rhythm.

---

## Related

[[part-of::viral-tiktok-forge]]  [[depends-on::strip_ai_smell.py]]  [[related-to::viral-formats]]
