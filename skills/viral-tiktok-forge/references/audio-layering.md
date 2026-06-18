# Audio Layering — Phase E2 Reference (v1.1)

When the skill applies ElevenLabs TTS voiceover OR replaces audio entirely. Read this when voiceover mode activates.

---

## The Audio Decision Tree (Phase E2)

```
Did operator say "with voiceover" / "narrate it"?
├─ YES → ElevenLabs TTS + mix_audio (voiceover prominent + native ducked)
│
├─ NO, but topic is educational/explanatory/tour-style
│   → Ask at gate: "voiceover or just Seedance native audio?"
│   ├─ Operator picks voiceover → ElevenLabs + mix
│   └─ Operator picks native → skip Phase E2 audio step
│
└─ NO, topic is purely visual / vibe / single-moment
    → Skip Phase E2 entirely; Seedance native audio IS the audio
```

The skill should NOT auto-add voiceover without operator agreement — narration changes the entire feel of the video. When in doubt, ask.

---

## Voiceover Source Text

The voiceover MP3 is generated from a **subset of the caption** — typically the verbal hook + 1–2 sentences from the arc, NOT the full caption with hashtags.

**Example** for the "agentic OS" multi-clip:

Full caption:
> day in the life of running my own agentic OS. type prompt, agents spawn, work happens, lean back. this is what AI-augmented building actually looks like.
>
> #AI #buildinpublic #startup #agenticAI #aiagents #indiehackers #aitools #agenticOS #aios #autonomousagents

Voiceover text (strip hashtags, strip emoji if any, keep narration body):
> day in the life of running my own agentic OS. type prompt, agents spawn, work happens, lean back. this is what AI-augmented building actually looks like.

Length target: 8–18 seconds when spoken at conversational pace. Roughly 1.5 words per second. So 12-25 words. Trim if over.

---

## ElevenLabs Voice Selection

`scripts/elevenlabs_tts.py` defaults to **Rachel** (voice_id `21m00Tcm4TlvDq8ikWAM`) — narration-friendly, warm, gender-neutral readable.

| Topic shape | Recommended voice | Voice ID |
|-------------|-------------------|----------|
| Founder content / educational | Rachel (default) | `21m00Tcm4TlvDq8ikWAM` |
| Confident POV ("here's what I built") | Domi | `AZnzlk1XvdvUeBnXmlld` |
| Lifestyle / casual relatable | Bella | `EXAVITQu4vr4xnSDxMaL` |
| Male voice for founder content | Antoni | `ErXwobaYiN019PkySvjV` |
| Younger / energetic | Elli | `MF3mGyEYCl7XYWbV9V6O` |
| Documentary / narrative | Josh | `TxGEqnHWrfWFTfGW9XjX` |

To use a non-default voice, pass `voice_id` to `generate_voiceover()` or set `ELEVENLABS_VOICE_ID` env var.

To list voices the operator's ElevenLabs account has cloned/saved:
```bash
ELEVENLABS_KEY="..." python -m elevenlabs_tts voices
```

---

## Voice Settings

The defaults in `elevenlabs_tts.generate_voiceover()`:

| Setting | Default | What it does |
|---------|---------|--------------|
| `stability` | 0.50 | Lower = more expressive, higher = more consistent. 0.50 is balanced for short-form. |
| `similarity_boost` | 0.75 | Higher = closer to base voice. 0.75 is good for narration. |
| `style` | 0.30 | Higher = more emotional inflection. 0.30 keeps it natural-conversational, not theatrical. |
| `use_speaker_boost` | True | Clearer voice when mixed with background audio. |

**Tweak when**:
- TikTok comedy / energetic content → `stability=0.30, style=0.50` (more expressive)
- Founder content / serious educational → `stability=0.65, style=0.20` (more consistent, less emotional)
- Whispered/intimate narration → `stability=0.70, style=0.10` (very controlled)

---

## Mixing Audio (the FFmpeg recipe)

Use `ffmpeg_helpers.mix_audio()`:

```python
from scripts.ffmpeg_helpers import mix_audio

final = mix_audio(
    video_path="workspace/stitched.mp4",  # or workspace/video.mp4 for single-clip
    voiceover_path="workspace/voiceover.mp3",
    output_path="workspace/final.mp4",
    voice_volume=0.85,    # voiceover prominence
    native_volume=0.40,   # native audio ducked to ambient bed
    voiceover_offset_seconds=0.0,  # delay if voiceover should start after intro
)
```

**Default mix ratio (0.85 voice / 0.40 native)** is calibrated for:
- Voiceover sits prominently (drives the story)
- Native audio remains audible as ambient texture (typing sounds, room tone, ambient music)
- The mix doesn't sound dry (voice in vacuum) or muddy (voice fighting background)

**Adjust when**:
- Native audio is loud/musical (Seedance generated music) → drop native_volume to 0.25
- Native audio is quiet/ambient (room tone only) → leave defaults or raise to 0.50
- Voiceover should feel ASMR/intimate → raise voice_volume to 0.95, drop native to 0.30

---

## Replacing Audio (vs Mixing)

Use `replace_audio()` when:
- Native audio actively clashes with the voiceover (e.g., dialogue in Seedance audio competing with narration)
- You want a fully clean voiceover-only audio track
- A music-driven TikTok where the music IS the audio (no Seedance native, no voiceover)

```python
from scripts.ffmpeg_helpers import replace_audio

final = replace_audio(
    video_path="workspace/stitched.mp4",
    audio_path="workspace/voiceover.mp3",
    output_path="workspace/final.mp4",
)
```

Output is trimmed to the shorter of (video, audio) duration via `-shortest`.

---

## Voiceover Timing & Offset

If the visual hook is at t=0 but the verbal hook should land slightly after (e.g., a 0.5s visual setup before the voice starts), use `voiceover_offset_seconds`:

```python
mix_audio(
    video_path="...",
    voiceover_path="...",
    output_path="...",
    voiceover_offset_seconds=0.5,  # voice starts 0.5s into the video
)
```

**Default is 0.0** (voice starts immediately) — matches Hard Rule 8 (first spoken word ≤ 0.5s).

---

## When to Skip Audio Entirely

Do NOT layer voiceover when:
- Topic is purely visual ("aesthetic shot of X", "POV of Y")
- Caption is hook-only (no explanatory body to narrate)
- Operator explicitly says "no narration" / "silent" / "seedance audio only"
- Single-clip mode where Seedance native audio is the differentiator (most cases)

**Default is no voiceover.** Voiceover activates only on explicit operator request OR explicit gate confirmation for narration-friendly topics.

---

## Diagnostic — When Audio Goes Wrong

| Symptom | Cause | Fix |
|---------|-------|-----|
| Voiceover is too quiet over native audio | native_volume too high | Drop native_volume to 0.25–0.35 |
| Voiceover sounds dry / disconnected | native_volume too low | Raise native_volume to 0.45–0.50 |
| Voice and music both fight for space | Both at default volumes | Replace audio entirely (no native mix) |
| TTS reads "smiling face emoji" | emojis not stripped | Strip via `_strip_emojis()` (auto in `generate_voiceover`) |
| TTS pronounces "TikTok" wrong | Brand names confuse TTS | Edit text: "tik tok" or "TT" |
| Final.mp4 is shorter than expected | `-shortest` trimmed to audio | Pad voiceover with silence OR trim video to voiceover length |
| Voiceover starts too early | offset = 0 but visual hook needs setup | voiceover_offset_seconds=0.3–0.5 |

---

## Cost (ElevenLabs)

ElevenLabs pricing (as of 2026-05): roughly $0.30 per 1000 characters at standard quality, or 1 credit = ~5 characters on the Creator/Pro tier.

For typical 15-25 word caption (~100-150 characters): roughly **$0.03–0.05 per voiceover**. Negligible vs FAL costs.

---

## Related

[[part-of::viral-tiktok-forge]]  [[depends-on::ELEVENLABS_KEY]]  [[depends-on::ffmpeg_helpers]]  [[depends-on::elevenlabs_tts]]  [[related-to::caption-voice]]
