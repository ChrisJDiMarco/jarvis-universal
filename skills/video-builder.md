# Skill: Video Builder (Remotion)

## Trigger
"build a demo video", "product video", "demo video for [product]", "animated explainer", "Remotion", "code-generated video", "video for [purpose]"

## Goal
Build a polished, code-generated product demo or explainer video using Remotion — no AI video generation, no screen recording. Pure code → rendered MP4. Best for: product demos, animated explainers, launch announcements, tutorial snippets.

---

## When to Use This vs. Alternatives

| Use This | Use Instead |
|---------|-------------|
| Polished, repeatable product demo | Simple screen recording → Loom |
| Animated data/stats explainer | AI video (Runway, Sora) → when photorealism matters |
| Launch announcement with motion graphics | Slideshow → Canva or Google Slides |
| Consistent brand-quality output | Quick demo → just record your screen |

Remotion wins when: precision matters, the video will be used repeatedly, or you want programmatic control over every frame.

---

## Phase 1: Define the Video

```
Type: [product demo / explainer / announcement / tutorial]
Duration: [15s / 30s / 60s / 2min]
Audience: [who watches this]
Goal: [what they should do or feel after watching]
Key moments: [3–5 things that must be shown]
Brand colors: [hex values or "match [reference]"]
Music/audio: [upbeat / calm / none]
```

---

## Phase 2: Storyboard (Text-Based)

Before writing code, produce a shot-by-shot storyboard:

```
Shot 1 [0:00–0:03]: Title card — "[App Name]" fades in on dark background with accent glow
Shot 2 [0:03–0:08]: Problem statement — headline text animates word by word
Shot 3 [0:08–0:18]: Product UI mockup slides in — highlight key feature with animated arrow
Shot 4 [0:18–0:24]: Results / metric — counter animates from 0 to [number]
Shot 5 [0:24–0:28]: CTA — "Try it at [url]" with pulsing button animation
Shot 6 [0:28–0:30]: Logo outro
```

Get approval on storyboard before writing any code.

---

## Phase 3: Build with Remotion

**Standard setup:**
```bash
npx create-video@latest [project-name]
cd [project-name]
npm install
```

**Key Remotion concepts:**
- `useCurrentFrame()` — current frame number (at 30fps: 0–899 for 30s video)
- `interpolate(frame, [from, to], [0, 1])` — map frame to animation value
- `spring({ frame, fps, config })` — physics-based animation
- `<Sequence from={30}>` — delay component start by N frames
- `<Series>` — sequential scenes

**Reference `remotion-best-practices/` for:**
- Text animations
- Chart animations
- Transitions between scenes
- Font loading
- Audio sync

---

## Phase 4: Render

```bash
npx remotion render src/index.ts [CompositionName] out/video.mp4
```

For web delivery:
```bash
npx remotion render --codec=h264 --crf=18 out/video.mp4
```

---

## Output

- Project: `projects/videos/[name]/`
- Rendered video: `owners-inbox/designs/[name].mp4`
- Storyboard: `projects/videos/[name]/storyboard.md`

---

## Rules
- Always get storyboard approval before coding — direction changes after render are expensive
- Keep videos under 2 minutes — attention drops sharply after 90 seconds
- Test render a short clip (first 5 seconds) before rendering the full video
- Use the `remotion-best-practices/` skill rules for any advanced animation patterns
- Provide the raw Remotion project so the operator can update it later without rebuilding from scratch
