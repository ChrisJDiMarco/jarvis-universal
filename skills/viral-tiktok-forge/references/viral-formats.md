# Viral Formats Catalog — Phase C Reference (v1.1)

The 6 viral formats + topic→format decision tree. Read in Phase C only when no operator style hint is given.

**v1.1 update**: Split POV into POV-immersive + Documentary because they have opposite camera defaults. Conflating them caused v1's locked-off observational shot to get unwanted handheld shake (Hard Rule 10).

---

## The 6 Formats

### 1. Transformations (Before → After)
- **Best for**: Products, fitness, makeup, life-change topics, problem→solution narratives
- **Structure**: 30% before-state setup → 20% transition moment → 50% after-state payoff
- **Camera**: `tracking` or `push-in`
- **Why it works**: TikTok's algorithm rewards narrative completion within 10s; before/after is the most compressed narrative possible
- **Example prompt opener**: `"Cinematic transformation shot. Subject begins as [X], transforms at 0:04 mark into [Y]..."`
- **Avoid**: Linear / no-payoff content (use POV-immersive or Documentary instead)

### 2. Orbs (Rotating Subject in Dramatic Light)
- **Best for**: Product reveals, abstract concepts, hero shots, anything benefiting from "premium" framing
- **Structure**: Single subject, single light source, slow rotation, no narrative beats
- **Camera**: `orbit` (always; the format is named for this)
- **Why it works**: Apple-keynote aesthetic = premium perception. Algorithm rewards "rewatchability"; orbital motion creates a hypnotic loop.
- **Example prompt opener**: `"Cinematic product reveal. Subject: floating [X] in pitch-black void, single rim light..."`
- **Avoid**: Multi-subject content, narrative content

### 3. POV-Immersive (First-Person, You Are the Subject)
- **Best for**: Experiences where the viewer should feel like they're DOING the thing — cooking, riding, walking, holding the object, comedy ("POV when…")
- **Structure**: First-person continuous shot. The camera IS the subject's eyes/body.
- **Camera**: `handheld` (organic, body-mounted feel) OR `tracking` for dramatic motion (running, riding)
- **Why it works**: TikTok's casual viewing posture pairs with first-person — viewer is *in* the video. Handheld shake reads as "this is real, this is me."
- **Example prompt opener**: `"Cinematic POV shot. Camera at subject's eye-level looks down at hands as they [X]..."`
- **Avoid**: Product showcases (use Orbs), abstract content (use Animation), observer-style content (use Documentary — DIFFERENT from this)

### 4. Documentary (Observer Watching Subject)
- **Best for**: Process content, "how X works", builder-at-work, day-in-the-life, fly-on-the-wall, behind-the-scenes
- **Structure**: Observational continuous shot. The camera is a witness, not a participant.
- **Camera**: **`fixed`** (locked-off, like a tripod) by default. `tracking` only when subject is in motion across the frame.
- **Why it works**: Locked-off observational shots read as authentic documentary footage — the highest-perceived-realism mode in the catalog. Pairs perfectly with "this is what X actually looks like" hooks.
- **Example prompt opener**: `"Cinematic medium shot. Subject: [person] at [activity]. Camera: fixed locked-off shot, observer perspective..."`
- **Avoid**: When the viewer should feel like they're DOING the thing (use POV-immersive), or when motion is the point (use Transformations or Fights)
- **CRITICAL — do NOT default to handheld for Documentary.** Locked-off is the right call. Documentary handheld is a specific stylistic choice (Bourne-style, news footage) and should only be used when the topic explicitly calls for it.

### 5. Fights (Kinetic Conflict)
- **Best for**: Problem/solution narratives where the problem is dramatized as antagonist
- **Structure**: Setup tension → kinetic moment → resolution
- **Camera**: `tracking` or `handheld` for kinetic energy
- **Why it works**: Conflict drives engagement; the algorithm rewards completion through tension
- **Example prompt opener**: `"Cinematic kinetic shot. Subject fights against [obstacle/concept]..."`
- **Avoid**: Calm/contemplative content, product reveals
- **Caution**: Can read as literal violence — use cinematic framing carefully; abstract conflict ("fights gravity") is safer than literal combat

### 6. Animation (Stylized Motion)
- **Best for**: Explanatory content, surreal/dreamlike topics, anything that wants to escape reality
- **Structure**: Stylized world rules, often non-physical motion
- **Camera**: Any (animation breaks physical camera rules)
- **Why it works**: Stylization signals "this is art" — viewers grant attention they wouldn't grant to literal documentary
- **Example prompt opener**: `"Stylized animated shot. Subject in surreal/animated world where [rule]..."`
- **Avoid**: Topics requiring photorealism (testimonials, product proof, cooking)

---

## Topic → Format Decision Tree

Apply when no operator style hint is given:

```
Topic shape                                   → Format
─────────────────────────────────────────────────────────────────
Product / launch / SaaS                       → Transformations OR Orbs
Lifestyle / experience / travel (you-are-it)  → POV-immersive
Process / "how X works" / day-in-the-life     → Documentary
Behind-the-scenes / builder-at-desk           → Documentary
Problem / insight / how-to (with arc)         → Transformations OR Fights
Abstract / philosophical / idea               → Animation OR Orbs
Comedy / relatable ("POV when…")              → POV-immersive (handheld)
Fitness / before-after                        → Transformations
Service business / process                    → Documentary
Wellness / ritual / routine                   → POV-immersive OR Transformations
Architecture / interior                       → Orbs OR aerial-pan Documentary
Food / cooking                                → POV-immersive (cooking IS first-person)
Pet / animal                                  → POV-immersive OR Documentary
Tour / walkthrough / explainer                → Documentary (multi-clip)
```

**When the topic fits multiple formats**: pick the one that best matches the *emotional payoff* the concept brief specified.

---

## Format → Camera Default Map

If you've picked a format but Phase D needs a camera move:

| Format | Default camera | Alternative | Forbidden |
|--------|----------------|-------------|-----------|
| Transformations | `tracking` | `push-in` | — |
| Orbs | `orbit` | — | anything else (format requires orbit) |
| **POV-immersive** | `handheld` | `tracking` (kinetic POV) | `fixed` (kills the immersive feel) |
| **Documentary** | **`fixed`** | `tracking` (subject in motion) | `handheld` (use only for Bourne-style aesthetic) |
| Fights | `tracking` | `handheld` | — |
| Animation | `fixed` or `pan` | any (animation flexible) | — |

**Critical**: do NOT carry over the v1 default of "POV → handheld" when the format is actually Documentary. The two are different formats with different camera defaults. Pick the right format first, then the right camera.

---

## Format-Specific Pitfalls

### Transformations
- **Trap**: Forgetting to specify the transition moment (e.g., "at 0:04 mark"). Without timing, Seedance smushes before/after into mush.
- **Fix**: Always include explicit timing in the Action section.

### Orbs
- **Trap**: Specifying multiple subjects. Orbs is single-subject only.
- **Fix**: If you need multi-subject reveal, use Transformations.

### POV-immersive
- **Trap**: Specifying camera moves that don't match first-person physics (e.g., `orbit` from a POV doesn't make sense — you can't orbit yourself).
- **Fix**: Stick to `handheld` or `tracking` — the only POV-compatible moves.

### Documentary
- **Trap (v1.0 bug)**: Defaulting to `handheld` because the format superficially resembles POV. Documentary is observational; locked-off is right.
- **Fix**: Default `fixed`. Only use `handheld` when the prompt explicitly calls for documentary-handycam aesthetic (rare).
- **Trap**: Forgetting to specify the observer perspective. Without it, Seedance interprets "documentary" as a generic style and may add unwanted handheld shake.
- **Fix**: Add `"Camera: fixed locked-off shot, observer perspective"` to the prompt body.

### Fights
- **Trap**: Literal violence triggers safety filter even with cinematic framing.
- **Fix**: Frame conflict abstractly ("fights against gravity," "battles the clock"); avoid literal fighting between people.

### Animation
- **Trap**: Mixing photorealism and animation in one prompt confuses Seedance.
- **Fix**: Pick fully-stylized OR fully-realistic; don't blend.

---

## Multi-Clip Format Selection

When multi-clip mode activates, the format usually carries across all clips for visual coherence. But camera moves CAN vary per clip within format constraints:

| Format | Multi-clip pattern (3 beats) |
|--------|------------------------------|
| Documentary | Clip 1: `fixed`, Clip 2: `push-in` (focus shift), Clip 3: `fixed` (return to wide) |
| Transformations | Clip 1: `tracking` (setup), Clip 2: `push-in` (transition), Clip 3: `pull-out` (reveal payoff) |
| POV-immersive | Clip 1: `handheld`, Clip 2: `handheld`, Clip 3: `tracking` (build to motion finale) |
| Orbs | Clip 1, 2, 3: `orbit` (consistent — the format demands it) |
| Fights | Clip 1: `tracking` (setup), Clip 2: `handheld` (conflict), Clip 3: `pull-out` (resolution) |
| Animation | Any per clip — animation breaks physical rules |

For multi-clip Documentary specifically (the most common multi-clip case), default to mostly-fixed with one push-in mid-arc for visual rhythm.

---

## Related

[[part-of::viral-tiktok-forge]]  [[related-to::seedance-prompt-grammar]]  [[related-to::caption-voice]]  [[related-to::multiclip-continuity]]
