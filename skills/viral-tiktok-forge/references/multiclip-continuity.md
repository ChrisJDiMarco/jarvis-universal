# Multi-Clip Continuity — Phase E Reference (v1.1)

The load-bearing reference for multi-clip mode. Read this when Phase A auto-detection or operator phrasing activates multi-clip generation.

---

## Why This Pattern Exists

Two back-to-back text-to-video Seedance calls produce two independent generations. Same prompt, same seed — different builders, different desks, different lighting. No continuity.

The fix: chain via **image-to-video**. The first frame of clip N is locked to a specific image, so the visual world stays consistent across cuts.

```
Flux text-to-image
  ↓ (keyframe.jpg)
Seedance image-to-video (clip 1 starts from keyframe.jpg)
  ↓ (clip_01.mp4)
[FFmpeg extract_last_frame]
  ↓ (frame_01_last.jpg)
[upload to FAL storage]
  ↓ (frame_01_last URL)
Seedance image-to-video (clip 2 starts from frame_01_last URL)
  ↓ (clip_02.mp4)
[FFmpeg extract_last_frame]
  ↓ (frame_02_last.jpg)
[upload to FAL storage]
  ↓ (frame_02_last URL)
Seedance image-to-video (clip 3 starts from frame_02_last URL)
  ↓ (clip_03.mp4)
[FFmpeg concat_clips]
  ↓ (stitched.mp4)
```

For 3 clips × 10s = 30s output: 1 Flux call + 3 image-to-video calls + 2 last-frame extractions + 2 file uploads + 1 concat.

---

## Cost Math (Fast tier)

| Step | Calls | Per-call | Subtotal |
|------|-------|----------|----------|
| Flux keyframe | 1 | ~$0.025 | $0.03 |
| Seedance fast i2v × 10s | 3 | $0.2419/s × 10 = $2.42 | $7.26 |
| **Total** | — | — | **~$7.29** |

In Standard tier: ~$9.10. Over 4× the single-clip cost; the value prop is the 30s of continuous output that feels like one production.

---

## The Keyframe Prompt (Flux text-to-image)

This is **different** from a Seedance prompt. Flux is a still-image model; you describe a single static frame, not motion.

**Structure**:
```
[Cinematic framing prefix]. [Subject + composition]. [Environment + lighting].
[Style + film stock language]. [Static composition descriptor].
```

**Example** (for "how my agentic OS works" multi-clip):
> Cinematic medium shot of a builder at a dimly-lit home-office desk, three monitors with soft blue and violet glow, warm side-light from a small lamp, hand-drawn component sketches taped to the wall, 35mm film aesthetic, shallow depth of field, naturalistic color grading, faint film grain. Static composition, builder facing screens, hands resting on keyboard, satisfied posture, mid-build moment.

**Cap**: 50–100 words. Same cinematic-context rule as Seedance applies — sparse Flux prompts produce generic stills.

**Aspect ratio**: pass `image_size="portrait_16_9"` to Flux (which Flux interprets as 9:16 vertical for TikTok).

---

## Per-Clip Prompts (Seedance image-to-video)

Each clip's prompt describes **what HAPPENS** in those 10 seconds, starting from the image you pass as `image_url`.

**Structure** (modified 6-step formula for i2v):
```
Subject continues: [from the keyframe — what's still there]
Action: [what changes during these 10s]
Camera: [ONE named move]
Continuity: [the 3-5 visual descriptors from beat planning that stay constant]
Constraints: [quality requirements]
```

Note: no Subject + Environment sections (those are inherited from the input image).

**Example — Clip 1** (starts from keyframe):
> Subject continues: same builder at desk with three monitors. Action: builder leans forward, types prompt into terminal at real-time pace, blue terminal text appears character-by-character matching typing rhythm. Camera: fixed locked-off shot. Continuity: 35mm film aesthetic, naturalistic color grade, faint grain throughout, soft blue and violet monitor glow, warm side-light. Constraints: realistic skin texture, accurate finger anatomy, code text matches typing speed, no time-lapse.

**Example — Clip 2** (starts from frame_01_last):
> Subject continues: same builder at desk, mid-task. Action: focus shifts to monitors as agent terminals spawn one by one, each with its own scrolling output. Camera: slow push-in toward the central monitor. Continuity: same 35mm film aesthetic, naturalistic color grade, faint grain, soft blue and violet glow, warm side-light. Constraints: coherent terminal text on all screens, realistic depth of field, smooth focus pull.

**Example — Clip 3** (starts from frame_02_last):
> Subject continues: same builder at desk, work nearly done. Action: builder leans back in chair, exhales, monitors now show completed output and a clean dashboard. Camera: fixed locked-off, slight pull-back at end. Continuity: 35mm film aesthetic, naturalistic color grade, faint grain, blue and violet monitor glow softening as natural dawn light begins, warm side-light. Constraints: realistic posture, satisfied but tired body language, monitors show coherent finished work.

---

## The Continuity Block

Every clip's prompt must include a **continuity block** — 3–5 specific visual descriptors that are identical across all clips. This is what binds the chain together at the level of color/grade/atmosphere.

Pick from these categories (combine 3–5):

| Category | Example tags |
|----------|--------------|
| Film stock | `35mm film aesthetic`, `16mm grain`, `digital naturalistic` |
| Color grade | `Arri Alexa color grade`, `naturalistic color grading`, `low-saturation grade` |
| Texture | `faint film grain throughout`, `subtle vignette`, `clean digital texture` |
| Lighting palette | `soft blue and violet glow`, `warm tungsten side-light`, `golden hour fill` |
| Depth of field | `shallow depth of field throughout`, `deep focus`, `selective focus on subject` |

The block goes **last** in each per-clip prompt before Constraints, so it reads as the dominant visual language Seedance carries forward.

---

## Last-Frame Extraction

Use `ffmpeg_helpers.extract_last_frame(clip_path)`:

```python
from scripts.ffmpeg_helpers import extract_last_frame
from scripts.fal_client_wrapper import upload_file_to_fal

last_frame_path = extract_last_frame("workspace/clip_01.mp4")
# returns "workspace/clip_01_last_frame.jpg"

last_frame_url = upload_file_to_fal(last_frame_path)
# returns FAL storage URL — pass this as image_url to next i2v call
```

The extraction uses `-sseof -0.5` (seek 0.5s before end) which is reliable across encoders. Some clips have a fade-out frame at the very end; using -0.5 lands on a meaningful frame.

If the extracted frame is solid black or blurry (rare — Seedance occasionally produces fade-out frames), retry with `-sseof -1.0` for a frame slightly earlier:

```python
extract_last_frame_at_offset = lambda video, dest, offset: subprocess.run([
    "ffmpeg", "-y", "-sseof", str(offset), "-i", video,
    "-update", "1", "-q:v", "1", "-frames:v", "1", dest,
], check=True)
```

---

## Stitching (FFmpeg concat)

Use `ffmpeg_helpers.concat_clips()`:

```python
from scripts.ffmpeg_helpers import concat_clips

stitched = concat_clips(
    clip_paths=["workspace/clip_01.mp4", "workspace/clip_02.mp4", "workspace/clip_03.mp4"],
    output_path="workspace/stitched.mp4",
    re_encode=False,  # try fast path first
)
```

The default `re_encode=False` uses FFmpeg's concat demuxer — no re-encoding, fast, lossless. **Works only if all clips share codec/resolution/framerate**, which Seedance outputs reliably do.

If the demuxer fails (rare codec mismatch), retry with `re_encode=True`:

```python
stitched = concat_clips(clip_paths, output_path, re_encode=True)
# slower, but tolerates mismatches; output is H.264 + AAC at CRF 20
```

---

## When Continuity Breaks (Diagnostic)

| Symptom | Cause | Fix |
|---------|-------|-----|
| Clip 2 has different lighting than clip 1 | Prompt didn't repeat the continuity block | Add 3-5 continuity tags to every clip's prompt |
| Subject's clothing changes between clips | Image-to-video didn't fully constrain | Reinforce in continuity block: `same builder in dark hoodie` |
| Sudden cut feels jarring | Last-frame had unusual motion blur | Use `-sseof -1.0` for extraction; pick earlier frame |
| Camera angle jumps unnaturally | Different camera move per clip is too aggressive | Stick to fixed/push-in for first multi-clip experiments; save dramatic cuts for v2 of a topic |
| Audio doesn't transition smoothly | Each clip has Seedance-native audio with hard cuts | Either use mix_audio() to layer voiceover OR replace with single track via replace_audio() |

---

## When NOT to Use Multi-Clip

- Topic is a single moment ("aesthetic shot of X", "this product reveal")
- Operator wants the cheapest/fastest output
- Topic is highly visual but doesn't have a narrative arc
- The single-shot 6-step formula already produces the right feeling

In those cases, single-clip mode is the right call. Multi-clip ≠ better. It's a tool for narrative content with continuity needs.

---

## Related

[[part-of::viral-tiktok-forge]]  [[depends-on::ffmpeg_helpers]]  [[depends-on::fal_client_wrapper]]  [[related-to::seedance-prompt-grammar]]
