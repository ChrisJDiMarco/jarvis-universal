---
name: viral-tiktok-forge
description: Take any topic and produce a fully-produced viral-ready TikTok video end-to-end via FAL.ai Seedance 2.0 — single-clip OR multi-clip continuous (Flux text-to-image keyframe → image-to-video chain via last-frame extraction → FFmpeg stitching), with optional ElevenLabs voiceover or Seedance native audio. ALWAYS use this skill when the user says "make me a tiktok about [X]", "viral tiktok for [X]", "viral tiktok about [X]", "make me a viral seedance video about [X]", "tiktok video for [X]" (with or without naming Seedance), "generate a tiktok of [X]", "create a tiktok of [X]", "make me a 3-part tiktok", "viral video series about [X]", "30-second tiktok with multiple shots", or any request-form phrasing for a TikTok video ("can i get a tiktok for [X]", "yo i need a tiktok about [X]", "i want a tiktok for [X]") — even if the user doesn't explicitly name Seedance or FAL. Also trigger on bare "viral video for [topic]" when context implies short-form AI generation. The skill auto-detects multi-clip mode from topic complexity (narrative, before/after, multi-beat → 3×10s default; simple/single-subject → single 10s clip), ideates the viral angle, picks the right aesthetic from a 6-format catalog (POV-immersive vs Documentary now distinct so locked-off observational shots get `fixed` not `handheld`), crafts Seedance prompts that survive motion-verb idioms and intent-based filter, chains image-to-video calls for continuity in multi-clip mode, generates with native audio, optionally layers ElevenLabs voiceover, stitches with FFmpeg, and packages a TikTok-ready caption (em-dashes regex-stripped) + hashtag bundle + posting strategy. Out of scope: explanation/advice requests ("how do i go viral", "how does seedance work" — those are research, not builds), video editing of existing footage, caption-only requests, talking-head face-swap, posting automation, and content moderation pre-checks — those are queued as separate v2 skills.
---

# Viral TikTok Forge — End-to-end AI Video Pipeline for Seedance 2.0

**Version**: 1.1 (2026-05-06) — adds multi-clip continuity, FFmpeg stitching, ElevenLabs voiceover, and corrects POV camera-default split. See `CHANGELOG` at bottom.

## Goal

Take any topic the operator names and produce a fully-produced viral-ready TikTok video. Single-clip mode for simple topics (one 10s shot), multi-clip continuous mode for complex topics (3×10s = 30s with frame-continuity via Flux keyframe + image-to-video chain + FFmpeg stitch). Both modes end with a TikTok-ready caption + hashtag bundle + posting strategy in one folder per run.

---

## When to Trigger

**Should fire on:**
- "make me a tiktok about [X]"
- "viral tiktok for [X]" / "viral tiktok about [X]"
- "make me a viral seedance video about [X]"
- "tiktok video for [X]" (with or without naming Seedance)
- "generate a tiktok of [X]" / "create a tiktok of [X]"
- "make me a 3-part tiktok" / "viral video series about [X]" / "30-second tiktok with multiple shots" → multi-clip mode
- Request-form phrasings: "can i get a tiktok for [X]", "yo i need a tiktok about [X]", "i want a tiktok for [X]"
- "viral video for [topic]" when context implies short-form AI generation

**Should NOT fire on:**
- "make a video for [X]" → handled by `video-builder` (Remotion code-generated, deterministic motion graphics)
- "edit my video" → not a generation skill
- "write a tiktok caption" → too narrow; this is the full pipeline
- "how does seedance work" / "how do i go viral" → explanation requests, not builds
- "build a tiktok strategy" → strategy skill, not a generator
- "post this to tiktok" → posting automation; queued for separate `tiktok-poster` v2 skill

---

## Setup (One-Time)

Before first invocation, confirm two env vars and one CLI tool:

```bash
echo $FAL_KEY              # required
echo $ELEVENLABS_KEY       # required only for voiceover mode
ffmpeg -version | head -1  # required for multi-clip + audio
```

If any are missing, add the keys to `~/.zshrc`:
```bash
export FAL_KEY="your-fal-key-here"
export ELEVENLABS_KEY="your-elevenlabs-key-here"  # optional
```

Then install the Python deps:
```bash
pip install fal-client requests
brew install ffmpeg  # macOS; or apt install ffmpeg on Linux
```

The skill never embeds keys, never writes them to files, never logs them.

---

## Hard Rules

These rules encode failure modes from the research corpus + lessons from real runs. Don't relax them.

1. **Use exactly ONE primary camera move per prompt.** Pick from the 8 named moves: `push-in`, `pull-out`, `pan`, `tracking`, `orbit`, `aerial`, `handheld`, `fixed`. Multiple moves confuse Seedance. *Why: Seedance's grammar expects a single primary directive; secondary moves go in multishot prompts via `Shot 1:` numbering.*

2. **All numeric API inputs are STRINGS, not numbers.** `duration: "10"`, `resolution: "720p"`. Integers trigger HTTP 422. *Why: Seedance's API treats these as enum-like strings.*

3. **Em-dashes get regex-stripped post-generation.** After Claude generates the caption, the wrapper auto-runs `caption.replace("—", ", ")`. *Why: model "knows better" but persistently produces em-dashes — the #1 AI-fingerprint in short-form copy. Prompting alone doesn't fix it.*

4. **Wrap edge-case topics in cinematic language.** "Cinematic medium shot of...", "35mm film aesthetic", "Arri Alexa color grade" — these read as filmmaking to the intent-based filter. *Why: sparse prompts give the safety LM no picture to read; cinematic context provides the scene it uses for judgment.*

5. **Default to `seedance-2.0/fast` for iteration; require `--final` for Standard.** Fast is $0.2419/sec, Standard $0.3034/sec. *Why: Standard handles complex motion + finger anatomy more reliably, but burning it on prompt experiments wastes credits.*

6. **Use `generate_audio: True` on every Seedance 2.0 call** unless the skill is layering ElevenLabs voiceover via FFmpeg. *Why: Seedance 2.0's native audio replaces what used to be a 4-step pipeline.*

7. **Endpoint namespaces** (validated 2026-05-06 from a real run):
   - `bytedance/seedance-2.0/text-to-video` — Standard text-to-video
   - `bytedance/seedance-2.0/fast/text-to-video` — Fast text-to-video
   - `bytedance/seedance-2.0/image-to-video` — image-to-video (multi-clip continuity)
   - `bytedance/seedance-2.0/fast/image-to-video` — Fast image-to-video
   - `fal-ai/flux/dev` — text-to-image keyframe (multi-clip mode only)
   - **No `fal-ai/` prefix on Seedance endpoints. ByteDance is the namespace.** Easy to copy wrong from old docs.

8. **The hook lands in the first 0.5 seconds, not 3.** First spoken word ≤ 0.5s. Captions appear from word 1 — no music-only intro, no slow fade-in. *Why: TikTok's algorithmic preview decides "show this to more people" before the viewer actively chooses to watch.*

9. **Use submit-then-poll for FAL calls, not blocking subscribe.** Bash invocations cap at 45s; Seedance Fast generation often takes 60–90s. Submit returns immediately with a `request_id`; poll across multiple bash calls. *Why: validated 2026-05-06 — first run's `subscribe()` hit the bash timeout. The wrapper now exposes both modes and defaults to submit+poll.*

10. **Documentary observational shots get `fixed`, NOT `handheld`.** This corrects a v1 bug: POV format defaulted to handheld for ALL POV shots, but observational ("fly-on-the-wall") shots should be locked-off. The format catalog now distinguishes POV-immersive (first-person, you-are-the-subject → handheld) from Documentary (observer watching subject → fixed). *Why: validated 2026-05-06 — first multi-monitor builder shot got handheld shake when locked-off would have read as more authentic.*

11. **For actions involving screens / typing / synchronized motion, add explicit synchronization language.** Phrases like "typing rhythm matches text appearance", "code scrolls character-by-character at typing pace", "actions happen in real-time, no time-lapse". *Why: Seedance 2.0 frequently desynchronizes hands-and-screen — typing fast while text appears slow, or vice versa. Synchronization language partially mitigates; doesn't fully fix (model limitation).*

12. **Multi-clip mode chains via `image-to-video`, not back-to-back `text-to-video`.** First clip: Flux text-to-image keyframe → Seedance image-to-video. Subsequent clips: extract last frame of previous clip via FFmpeg → use as start image for next image-to-video call. *Why: text-to-video has no frame-continuity guarantee between calls; image-to-video starting from the previous last frame is the only way to get visual continuity.*

13. **Audio overlay only when explicitly requested OR when topic warrants narration.** Default = Seedance native audio. Layer ElevenLabs TTS voiceover when: (a) operator says "with voiceover" / "narrate it", OR (b) the caption is hook+explanation that benefits from being spoken (educational/explanatory topics). When ambiguous, ask at the gate. *Why: not every TikTok needs narration; ambient Seedance audio is often the right call.*

---

## Pipeline

```
INPUT: topic (+ optional style / duration / --final / multi-clip / audio hints)
  ↓
A. Intake + auto-detect multi-clip-vs-single + flag extraction
  ↓
B. Concept ideation (single concept OR N-beat narrative arc)
  ↓
C. Style selection (6-format catalog, format → camera default map)
  ↓
D. Prompt crafting (single Seedance prompt OR N prompts for chained clips)
  ↓
🚧 Operator Gate (skippable with "just go")
  ↓
E1. Generation
    Single-clip:   text-to-video → MP4
    Multi-clip:    Flux keyframe → i2v clip 1 → extract last-frame → i2v clip 2 → ... (chain)
  ↓
E2. Post-production (multi-clip OR audio-overlay only)
    Stitch clips via FFmpeg concat
    Optional: ElevenLabs voiceover + FFmpeg audio mix
  ↓
F. Caption + hashtag + posting package (with em-dash post-strip)
  ↓
G. Deliver: ~/jarvis/owners-inbox/viral-tiktok-forge/[slug]-[date]/
```

### Phase A — Intake

Extract from operator's prompt:
- **Topic** (required)
- **Style hint** (optional, e.g., "POV", "cinematic", "surreal", "documentary")
- **Duration hint** (optional; default `"10"` per clip)
- **`--final` flag** (optional; switches to Standard tier)
- **`just go` / `auto-generate`** (optional; bypasses Operator Gate)
- **`music-driven`** (optional; switches to `reference-to-video` mode)
- **`multi-clip` / `--clips=N` / explicit phrasing** ("3-part", "30-second with multiple shots", "video series") (optional; forces multi-clip mode)
- **`with voiceover` / `narrate it` / `voiceover from caption`** (optional; activates ElevenLabs overlay)
- **`no narration` / `silent` / `seedance audio only`** (optional; forces Seedance native audio)

If topic is missing or fundamentally ambiguous, ask exactly one clarifying question. Don't interrogate.

**Multi-clip auto-detection** (per Gate 2): when no explicit multi-clip flag, judge topic complexity:

| Topic shape | Default mode |
|-------------|--------------|
| Single subject, single moment ("my new oat milk brand", "this product reveal") | Single-clip |
| Narrative / before-after / multi-beat ("the journey of building X", "from idea to launch") | Multi-clip (3 beats) |
| Tour / explainer ("how my agentic OS works", "the components of X", "what's inside Y") | Multi-clip (3 beats) |
| Comedy POV ("when you realize..." setup → punchline) | Multi-clip (2 beats) |
| Static beauty / vibe ("aesthetic shot of X", "moody scene of Y") | Single-clip |

When auto-detect picks multi-clip, the Operator Gate explicitly states it (so operator can downgrade to single).

**Flag precedence** (when multiple combine):
1. `multi-clip` / explicit count → uses multi-clip pipeline (overrides single-clip auto-detect)
2. `music-driven` → uses `reference-to-video` endpoint (single-clip only; multi-clip + music sync deferred to v1.2)
3. `--final` → Standard tier on all FAL calls
4. `with voiceover` → ElevenLabs overlay enabled
5. `just go` → bypasses gate at any point

**Topic-slug derivation** (for Phase G output path):
Lowercase, replace spaces with hyphens, strip non-alphanumeric except hyphens, truncate 40 chars.

### Phase B — Viral Concept Ideation

Use Claude Opus 4.7. System prompt structured as a "short contract" per `references/caption-voice.md`.

**Single-clip output**: structured concept brief (visual hook, verbal hook, narrative arc, emotional payoff).

**Multi-clip output**: N-beat narrative arc (default 3 beats for 30s output):

```
Beat 1 (0:00–0:10): [Setup beat — visual + verbal hook]
Beat 2 (0:10–0:20): [Tension/transformation beat — what changes]
Beat 3 (0:20–0:30): [Resolution/payoff beat — emotional landing]

Visual continuity: [what stays consistent across beats — character, setting, lighting]
```

The continuity description is critical for Phase E1 — it informs the keyframe prompt and the per-clip image-to-video prompts so the chained clips feel like one production, not three random AI generations.

### Phase C — Style Selection

Pick one of **6 viral formats** (catalog in `references/viral-formats.md`):

| Topic shape | Default format | Default camera |
|-------------|----------------|----------------|
| Product / launch | Transformations OR Orbs | tracking / orbit |
| Lifestyle / experience (you-are-the-subject) | POV-immersive | handheld |
| Process / "how X works" / observer watching subject | **Documentary** | **fixed** (locked-off) |
| Problem / insight | Transformations OR Fights | tracking |
| Abstract / philosophical | Animation OR Orbs | fixed / orbit |
| Comedy / relatable | POV-immersive | handheld |

If operator provided a style hint, **honor it verbatim**. The `documentary` hint maps to Documentary format with `fixed` camera.

**Critical v1.1 fix**: POV-immersive (first-person, you ARE the subject) defaults to `handheld`. Documentary (observer watching subject — fly-on-the-wall, process shots, builder-at-desk) defaults to `fixed`. Don't conflate them.

### Phase D — Seedance Prompt Crafting

Apply the **6-step formula** from `references/seedance-prompt-grammar.md`:

```
Subject → Action → Environment → Camera → Style → Constraints
```

**Single-clip mode**: one prompt, 60–100 words.

**Multi-clip mode**: one keyframe prompt + N image-to-video prompts:
1. **Keyframe prompt** (Flux text-to-image): describe the FIRST FRAME of clip 1. Static composition language. Lighting + mood + subject placement.
2. **Per-clip prompts** (Seedance image-to-video): describe what HAPPENS in each clip starting from the previous keyframe. Action language. Camera move. Continuity descriptors.
3. **Continuity tags**: each clip's prompt repeats the visual continuity descriptors (character, setting, lighting) so chained generations stay consistent.

Both modes:
- Cap each prompt at 60–100 words
- Exactly one named camera move per prompt (or per shot in multishot)
- Lighting language present (sparse prompts → stiff output)
- For edge-case topics, prefix with cinematic framing
- **For actions involving screens / typing / synchronized motion**, add synchronization language: `"typing rhythm matches text appearance"`, `"code scrolls character-by-character at typing pace"`, `"actions in real-time, no time-lapse"`. See Hard Rule 11.
- Optional: `negative: [list]` for known artifact risks

Validate before sending (Hard Rule 9 retry cap: max 3 validation rounds before surfacing to operator).

### 🚧 Operator Gate

```
Mode: [single-clip OR multi-clip 3-beat]
Concept: [hook] | [arc] | [payoff]
Style: [format] — [rationale]
Camera: [named move]
Audio: [seedance-native OR elevenlabs-voiceover]
Prompts: [paste 1 OR N prompts]
Estimated cost: ~$X (Y FAL calls + optional ElevenLabs)

Generate? (yes / tweak [what] / regen concept / use --final / switch single↔multi)
```

If `just go` flag was set in Phase A → bypass.

### Phase E1 — Generation

**Single-clip mode** (unchanged from v1.0):
1. Build text-to-video request (string-coerced numeric inputs, `generate_audio: True`)
2. `fal_client_wrapper.submit_seedance_video(...)` returns request_id immediately
3. Poll via `fal_client_wrapper.poll_until_complete(request_id, endpoint, deadline_seconds=35)` — yields and persists state if deadline hit, allowing resumption in next bash call
4. Download MP4 to workspace via `download_video()`

**Multi-clip mode**:
1. **Keyframe**: `flux_text_to_image(keyframe_prompt)` → save `keyframe.jpg`
2. **Clip 1**: `submit_seedance_image_to_video(image_url=keyframe_url, prompt=clip_1_prompt)` → poll → download `clip_01.mp4`
3. **Extract last frame**: `ffmpeg_helpers.extract_last_frame(clip_01.mp4)` → `frame_01_last.jpg` → upload to FAL storage → get URL
4. **Clip 2**: `submit_seedance_image_to_video(image_url=frame_01_last_url, prompt=clip_2_prompt)` → poll → download `clip_02.mp4`
5. **Repeat** for N-1 transitions
6. All clips saved as `clip_01.mp4` … `clip_NN.mp4` in workspace before E2

Categorize FAL failures (`auth_failure` / `rate_limited` / `safety_rejection` / `generation_failure` / `download_failure`). On `safety_rejection` or `auth_failure`, halt — those don't fix themselves with retry.

### Phase E2 — Post-Production (multi-clip OR audio-overlay)

**Stitch clips** (multi-clip mode only):
- `ffmpeg_helpers.concat_clips([clip_01.mp4, clip_02.mp4, clip_03.mp4], "stitched.mp4")`
- Uses FFmpeg concat demuxer (no re-encoding — preserves quality, fast)

**Audio overlay** (when ElevenLabs voiceover requested OR auto-suggested for narration topics):
1. `elevenlabs_tts.generate_voiceover(caption_text, output_path="voiceover.mp3")` reads `ELEVENLABS_KEY` env var
2. `ffmpeg_helpers.mix_audio(video=stitched.mp4, voice=voiceover.mp3, music=None, output="final.mp4")` — mixes voiceover at 0.85 volume with Seedance native audio at 0.4 (ducked)
3. If no voiceover, skip this step; final output IS stitched.mp4

**Skip this phase entirely** when single-clip + Seedance-native-audio (most common path).

### Phase F — Caption + Hashtag + Posting Package

Generate caption with Claude Opus 4.7. Voice persona load priority:
1. Operator's spec.md `voice` field if invoked from active spec
2. `~/jarvis/memory/core.md` `voice` / `tone` / `working_style` fields
3. Default: `"casual, specific, slightly understated"`

Forbid the AI-smell phrase list (see `references/caption-voice.md`).

Then run `scripts/strip_ai_smell.py` (auto): em-dash regex strip + Tier 1/2/3 forbidden-phrase scan.

Hashtag bundle (10 total): 3 broad (>1M) + 4 niche (50k–500k) + 3 community (<50k). Posting strategy: weekday 6–8pm EST default.

### Phase G — Deliver

Save to `~/jarvis/owners-inbox/viral-tiktok-forge/[topic-slug]-[YYYY-MM-DD]/`:

**Single-clip outputs**:
- `video.mp4` — Seedance output, downloaded
- `brief.md`, `prompt.md`, `caption.md`, `generation-log.json`

**Multi-clip outputs**:
- `clip_01.mp4`, `clip_02.mp4`, `clip_03.mp4` — individual generations
- `keyframe.jpg`, `frame_01_last.jpg`, `frame_02_last.jpg` — continuity frames (kept for re-roll re-use)
- `stitched.mp4` — FFmpeg-concatenated
- `final.mp4` — stitched + audio overlay (only when voiceover applied; otherwise stitched.mp4 IS the final)
- `voiceover.mp3` — ElevenLabs output (if voiceover applied)
- `brief.md`, `prompt.md` (multi-prompt list), `caption.md`, `generation-log.json` (per-clip request IDs + costs)

**Folder collision handling**: if `[topic-slug]-[YYYY-MM-DD]/` exists, append `-2`, `-3`, etc. Never overwrite.

Return `computer://` link to the *final* video file (final.mp4 or stitched.mp4 or video.mp4 depending on mode). End message ≤ 3 sentences. Don't paste caption back into chat.

---

## Tools You'll Lean On

| Tool | Purpose | Status |
|------|---------|--------|
| `fal-client` (Python) | Official FAL.ai client; auth, queue, retry | Battle-tested |
| `bytedance/seedance-2.0/text-to-video` | Standard text-to-video, $0.3034/sec | Production |
| `bytedance/seedance-2.0/fast/text-to-video` | Fast text-to-video, $0.2419/sec — default for iteration | Production |
| `bytedance/seedance-2.0/image-to-video` | Image-to-video for multi-clip continuity, $0.3024/sec | Production |
| `bytedance/seedance-2.0/fast/image-to-video` | Fast image-to-video, $0.2419/sec | Production |
| `fal-ai/flux/dev` | Text-to-image for multi-clip first keyframe | Production |
| Claude Opus 4.7 | Concept ideation + caption generation | Production |
| FFmpeg | Last-frame extract, clip concat, audio mix | Battle-tested (system dep) |
| ElevenLabs TTS API | Voiceover generation from caption | Production (env var: `ELEVENLABS_KEY`) |
| `scripts/fal_client_wrapper.py` | submit+poll wrapper, image-to-video, Flux, retry, categorization | Skill-local |
| `scripts/ffmpeg_helpers.py` | extract_last_frame, concat_clips, mix_audio, replace_audio | Skill-local |
| `scripts/elevenlabs_tts.py` | generate_voiceover from caption text | Skill-local |
| `scripts/strip_ai_smell.py` | Em-dash regex strip + Tier 1/2/3 forbidden-phrase scanner | Skill-local |

**Cross-references**:
- For code-generated motion graphics (product demos, explainers), use `video-builder` (Remotion).
- For longer-form text content, use `content-creation`.
- For trend/keyword research before topic selection, use `seo-content-engine` or `competitive-intel`.

---

## Examples

### Example 1: Single-clip — "make me a tiktok about my new cold plunge tub"

(Unchanged from v1.0. See sections in this file or run output for `cold-plunge` topic if generated.)

### Example 2: Multi-clip — "make me a 30-second tiktok about how my agentic OS works"

**Detected**: multi-clip mode (topic = "how X works" → 3-beat tour). Documentary format (observer watching builder use system). Camera: `fixed` per beat (correctly NOT handheld).

**3-beat narrative arc**:
- Beat 1 (0:00–0:10): Builder at desk, types prompt into terminal. Static observation shot.
- Beat 2 (0:10–0:20): Camera-on-screen view: agents spawn, parallel terminals open, work happens autonomously.
- Beat 3 (0:20–0:30): Pull back to wider scene: builder leans back, system has produced output, content on monitors.

**Visual continuity tags** (repeated across all 3 prompts): "same builder in dark hoodie, same desk with three monitors and warm side-light, 35mm film aesthetic, naturalistic color grade, faint film grain throughout."

**Keyframe** (Flux): `"Cinematic medium shot of a builder at a dimly-lit home-office desk, three monitors with soft blue and violet glow, warm side-light from a small lamp, hand-drawn component sketches taped to the wall, 35mm film aesthetic, shallow depth of field, naturalistic color grading, faint film grain. Static composition, builder facing screens, hands at keyboard."`

**Clip prompts** (Seedance image-to-video, see `references/multiclip-continuity.md` for full pattern):
- Clip 1: starts from keyframe — builder types prompt, terminal text appears in real-time matching typing rhythm
- Clip 2: starts from frame_01_last — focus shifts to monitors as agents spawn (one camera move: `push-in`)
- Clip 3: starts from frame_02_last — builder leans back, output complete, satisfied posture (camera: `fixed`)

**Caption**:
> day in the life of running my own agentic OS. type prompt, agents spawn, work happens, lean back. this is what AI-augmented building actually looks like.

**Audio**: Seedance native (ambient typing + lamp hum + room tone). Voiceover NOT applied — captions carry the message; narration would over-explain.

For full multi-clip walkthrough, see `references/multiclip-continuity.md`.

---

## File Inventory

```
viral-tiktok-forge/
├── SKILL.md                                   ← entry point (this file)
├── references/
│   ├── seedance-prompt-grammar.md             ← 6-step formula, 8 camera moves, multishot, sync-language
│   ├── viral-formats.md                       ← 6 formats (POV-immersive vs Documentary distinct), camera defaults
│   ├── caption-voice.md                       ← AI-smell forbidden list, voice contract template
│   ├── multiclip-continuity.md                ← Flux→i2v chain, last-frame extraction, FFmpeg stitching
│   └── audio-layering.md                      ← ElevenLabs TTS + FFmpeg mix patterns
├── scripts/
│   ├── fal_client_wrapper.py                  ← submit+poll, text-to-video, image-to-video, Flux, retry
│   ├── ffmpeg_helpers.py                      ← extract_last_frame, concat_clips, mix_audio, replace_audio
│   ├── elevenlabs_tts.py                      ← generate_voiceover from caption text
│   └── strip_ai_smell.py                      ← em-dash strip + Tier 1/2/3 scanner
└── templates/
    ├── concept.template.md                    ← single-clip + multi-clip beat structure
    └── prompt.template.md                     ← 6-step formula skeleton
```

Read references on-demand:
- Always read `references/seedance-prompt-grammar.md` before Phase D
- Read `references/viral-formats.md` in Phase C only when no operator hint
- Read `references/multiclip-continuity.md` when multi-clip mode activates
- Read `references/audio-layering.md` when voiceover requested
- Read `references/caption-voice.md` before Phase F every time

---

## Common Failure Modes (Quick Reference)

| Skip this rule | What happens |
|----------------|--------------|
| One camera move per prompt | Stiff, jittery, generic motion |
| Strings on numeric inputs | HTTP 422, no video |
| Em-dash strip | Caption screams "ChatGPT wrote this" |
| Cinematic framing on edge-case topics | Safety filter rejection |
| Default to Fast for iteration | Burns ~$15 per 10-prompt cycle |
| `generate_audio: True` | Silent video, need separate audio pipeline |
| Correct endpoint namespace | Calls v1 instead of 2.0; no native audio, wrong schema |
| 0.5s hook | Algorithm scrolls past before viewer engages |
| **Submit+poll** for FAL calls | Hits 45s bash timeout on subscribe-blocking calls |
| **Documentary → fixed** (not handheld) | Locked-off shots get unwanted shake |
| **Synchronization language** for typing/screen actions | Code-on-screen desyncs from hand motion |
| **Multi-clip via image-to-video chain** | Each text-to-video clip looks like a different production |

---

## Done = The Operator Can Post Without Editing

The skill is done when the operator can paste any topic into the trigger phrase, approve the gate, and post the resulting MP4 + caption directly to TikTok without rewriting either. For multi-clip mode, "done" means the stitched (and optionally voiced-over) final.mp4 plays as one continuous production, not three separate Seedance generations slammed together.

---

## CHANGELOG

**v1.1 (2026-05-06)** — first run lessons + multi-clip + audio
- Added: multi-clip continuous mode (Flux keyframe → image-to-video chain → FFmpeg stitch); auto-detected from topic complexity, 3×10s default
- Added: ElevenLabs TTS voiceover via FFmpeg audio mix (skill decides between voiceover and Seedance-native, or asks at gate)
- Added: 6-format catalog (split POV into POV-immersive + Documentary so observational shots get `fixed` not `handheld` — Hard Rule 10)
- Added: synchronization language for actions involving screens/typing (Hard Rule 11) — partial mitigation for Seedance's typing-vs-text-scrolling desync
- Refactored: wrapper to submit+poll pattern (Hard Rule 9) — no more bash-timeout failures
- Validated: endpoint namespaces against real run (`bytedance/seedance-2.0/...` confirmed correct)
- New scripts: `ffmpeg_helpers.py`, `elevenlabs_tts.py`
- New references: `multiclip-continuity.md`, `audio-layering.md`
- Removed: "multi-shot stitching" from out-of-scope (now in scope)

**v1.0 (2026-05-06)** — initial release via skill-forge

---

## Related

[[part-of::jarvis-content-system]]  [[depends-on::FAL_KEY]]  [[depends-on::ELEVENLABS_KEY]]  [[depends-on::ffmpeg]]  [[depends-on::fal-client]]  [[depends-on::Claude-Opus-4.7]]  [[related-to::video-builder]]  [[related-to::content-creation]]  [[related-to::seo-content-engine]]  [[derived-from::skill-forge-2026-05-06]]
