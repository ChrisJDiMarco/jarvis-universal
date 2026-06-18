# Seedance 2.0 Prompt Grammar — Technical Reference

The load-bearing technical reference for Phase D. Read this before crafting any Seedance prompt.

---

## The 6-Step Formula

Every Seedance 2.0 prompt follows this order. The model expects this structure; deviations produce flat output.

```
Subject → Action → Environment → Camera → Style → Constraints
```

| Section | What it says | Example fragment |
|---------|--------------|------------------|
| **Subject** | Who/what is in frame | `person stepping into a sleek black cold plunge tub` |
| **Action** | What they're doing, with timing if relevant | `slow-mo entry, full submersion at 4-second mark, emergence with steam billowing` |
| **Environment** | Where it is + lighting | `minimalist concrete patio, golden hour light, single warm tungsten side-light` |
| **Camera** | One named camera move | `smooth tracking shot orbiting subject 90 degrees` |
| **Style** | Visual treatment / film stock language | `35mm film aesthetic, shallow depth of field, Arri Alexa color grade` |
| **Constraints** | Quality requirements / things to preserve | `realistic skin texture, no smoothing, breath visible` |

**Word count cap: 60–100 words.** Past 100, Seedance starts ignoring later sections.
**Word count floor: ~50 words.** Below that, output is generic regardless of subject specificity.

---

## The 8 Named Camera Moves

Use **exactly one** per prompt (Hard Rule 1). Multiple moves = stiff, confused output.

| Move | What it does | Best for |
|------|--------------|----------|
| `push-in` | Camera moves toward subject | Drama, focus, intimacy |
| `pull-out` | Camera moves away from subject | Reveal context, emphasize scale |
| `pan` | Horizontal sweep | Surveying scene, lateral motion |
| `tracking` | Camera follows subject (typically lateral) | Subject in motion, walking, riding |
| `orbit` | Camera circles subject | Product reveals, hero shots |
| `aerial` | Top-down or high-angle establishing | Scale, location, drama |
| `handheld` | Slight shake, organic motion | Authenticity, documentary, comedy |
| `fixed` | Static, no camera movement | Static beauty, dialogue, talking head |

**Banned motion verbs** (these confuse Seedance):
- `moves`, `shifts`, `goes`, `does`, `goes through`
- Replace with the specific named move above.

---

## Multishot Syntax (When You Need >1 Camera Move)

Seedance 2.0 supports multishot prompts using JSON or numbered shots:

### Numbered shot syntax
```
Shot 1: [Subject] [Action 1]. Camera: push-in.
Shot 2: [Subject continues] [Action 2]. Camera: orbit.
RAMPS TO SLOW MOTION at 0:03.
SNAPS BACK at 0:05.
[VFX: cinematic glow at 0:04]
Total: 10s / 2 shots / 9:16
```

### JSON multishot (cleaner for >2 shots)
```json
{
  "shots": [
    {"description": "Subject performs action", "camera": "push-in", "duration": 3},
    {"description": "Subject's reaction", "camera": "fixed", "duration": 2},
    {"description": "Wide reveal", "camera": "pull-out", "duration": 5}
  ],
  "total_duration": 10,
  "aspect_ratio": "9:16"
}
```

Use multishot for: transformations (before→after), narrative arcs with visual beats, reveal patterns. Avoid for: simple single-subject hero shots (the named single-shot formula is cleaner).

---

## @Reference Syntax

For image, audio, or video references, use `@` prefix:

```
@Image1: subject reference photo
@Audio1: music track for sync
@Video1: motion reference for extension
```

**Both `@Image1` and `[Image1]` work** — multi-source corroboration says `@Image1` is preferred (matches FAL's official docs after 2025-08).

### Music sync (the high-leverage TikTok pattern)
```
[6-step formula prompt]
Scene transitions should align with @Audio 1 beat positions.
```

This requires `bytedance/seedance-2.0/reference-to-video` endpoint with audio URL provided. Cost is 0.6× multiplier — actually cheaper than text-to-video standard.

### Video extension
```
Extend @Video 1 by 10 seconds. Continue with [action description]. Preserve [aesthetic continuity].
```

Chains a 15s base + 10s extension = 25s output. Breaks the visible 15s ceiling.

---

## Negative Prompts

Seedance 2.0 supports negative prompts (contrary to some older docs):

```
[6-step formula prompt]
negative: smoothed skin, plastic skin, distorted hands, extra fingers, text overlays, watermark, low resolution
```

OR inline:
```
[prompt body] avoid smoothing, distorted hands, watermarks.
```

**Use when**: known artifact risks (skin smoothing on close-ups, hand distortion on action shots, text/logo distortion on product reveals).

---

## Synchronization Language — The Typing/Screen Fix (v1.1)

**The problem (validated 2026-05-06)**: Seedance frequently desynchronizes hand motion from on-screen events. A builder is shown typing slowly while terminal text scrolls rapidly. A finger lands on a key while the corresponding character has already appeared. The visual desync is the #1 "this is AI-generated" tell for tech/builder/process content.

**Partial fix** (mitigates but doesn't fully solve — Seedance limitation): add explicit synchronization language to the Action and Constraints sections.

**Use these phrases** when the prompt involves typing, button presses, screens updating in response to physical action, or any synchronized motion:

| Phrase | Use when |
|--------|----------|
| `"typing rhythm matches text appearance"` | Builder typing on keyboard with text appearing on screen |
| `"code scrolls character-by-character at typing pace"` | Code editor / terminal updating |
| `"actions happen in real-time, no time-lapse"` | Any sequence where pacing must feel natural |
| `"each keystroke produces one character on screen"` | Direct one-to-one typing |
| `"screen updates synchronize with hand motion"` | UI buttons, mouse clicks, app interactions |
| `"finger lands on key, character appears simultaneously"` | Close-up finger-on-key shots |

**Where to put them**: dedicated synchronization clause in the **Constraints** section, e.g.:

```
... Constraints: realistic skin texture, accurate finger anatomy,
typing rhythm matches text appearance, code scrolls character-by-character
at typing pace, no time-lapse on action.
```

**What it does NOT fix**: Seedance's underlying physics model still produces some desync — this language reduces severity but doesn't eliminate it. If the desync is critical (e.g., closeup hand shots are the entire video), consider:
1. Use Standard tier instead of Fast (better physics)
2. Avoid the typing-as-subject framing — use a Documentary observer shot of the builder + screens together rather than a closeup of hands
3. Multi-clip mode where each clip is a separate moment, not continuous typing

**Verbiage tested 2026-05-06**: All six synchronization phrases above were drafted post-run. None were in the original v1.0 prompt that produced the typing-vs-scrolling desync. Adding them to the next run is the validation test.

---

## Cinematic Context — The Filter Unlock

Seedance's safety filter is **intent-based, not keyword-based**. It uses an LM to judge the prompt as a scene description.

**Sparse prompts get flagged** because they give the filter no picture to read.

**Cinematic framing unlocks latitude.** These phrases read as filmmaking:
- `"Cinematic medium shot of..."`
- `"35mm film aesthetic..."`
- `"shot on Arri Alexa with shallow depth of field..."`
- `"production-quality framing of..."`
- `"film noir lighting..."`

Wrap edge-case topics (anything that *could* trip a literal-keyword scanner) with these openers.

**Hard-blocked content** (no amount of cinematic framing rescues these):
- Real public figures' faces
- Named copyrighted characters (Mickey Mouse, Spider-Man, etc.)
- Explicit sexual content
- Real children in any context

---

## Common Failure Patterns (Diagnostic)

| Symptom | Likely cause | Fix |
|---------|--------------|-----|
| Output is stiff, generic, "AI-looking" | Prompt < 50 words OR no lighting clause | Add Environment + Style sections |
| Camera move ignored | Multiple camera instructions OR vague verb | Use exactly one named move |
| HTTP 422 error | Numeric input as integer | Coerce to string |
| Filter rejection | Sparse prompt on edge-case topic | Add cinematic framing prefix |
| Wrong aspect ratio | Default 16:9 used | Set `aspect_ratio: "9:16"` explicitly |
| No audio in output | `generate_audio` missing or False | Set `generate_audio: True` |
| Output looks like Seedance v1 | Wrong endpoint namespace | Use `bytedance/seedance-2.0/...` not `fal-ai/bytedance/...` |

---

## Quick Validation Checklist

Before sending any Seedance request, check:

- [ ] Prompt is 60–100 words
- [ ] Exactly one of the 8 named camera moves
- [ ] Lighting language present in Environment section
- [ ] No banned verbs (`moves`, `shifts`, `goes`, `does`)
- [ ] All numeric API params are strings
- [ ] `generate_audio: True` is set
- [ ] Endpoint is `bytedance/seedance-2.0/...`
- [ ] Edge-case topic? Cinematic framing added.
- [ ] Known artifact risk? Negative prompt added.

---

## Related

[[part-of::viral-tiktok-forge]]  [[depends-on::Seedance-2.0]]  [[related-to::viral-formats]]
