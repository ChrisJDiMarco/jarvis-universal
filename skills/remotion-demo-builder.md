# Skill: Remotion Demo Builder

## Trigger
"build a demo video", "make a product video", "create a video demo", "Remotion", "animate my product", "demo video for [product/client]", "video for subreddit post", "video for pitch"

## Goal
Produce a polished 30-60 second product demo video using Claude Code + Remotion Skills. Output is a rendered MP4 — code-generated, not AI video model. No Premiere Pro required unless adding music/SFX.

## What Remotion Skills Is
- A Claude Code plugin installed via one command from remotionskills.com
- Claude Code writes React/Remotion components → renders to MP4
- Not a video AI — it's code that generates video (no deepfake risk, fully deterministic)
- Quality looks professional when prompted with sufficient detail

## Install (one-time per Claude Code environment)
```
# Visit remotionskills.com for the install command — one line, installs as a Claude Code plugin
```
After install, Claude Code has access to Remotion rendering capabilities.

## Phase 1: Vision Brief

Before prompting Claude Code, write a shot-by-shot brief. Vague prompts = mediocre output.

**Brief Template:**
```
Product: [name + one-line description]
Audience: [who will watch this]
Duration: [target seconds — 30-60 is ideal]
Tone: [clean/minimal, energetic, premium, etc.]

Shot sequence:
1. [0-5s] — [what happens: logo, headline, background]
2. [5-15s] — [product UI appears, specific interaction shown]
3. [15-25s] — [zoom to feature X with highlight/annotation]
4. [25-35s] — [second feature Y, hover/transition effect]
5. [35-45s] — [result or payoff screen]
6. [45-50s] — [CTA or logo outro]

Visual style: [color palette, font feel, animation style]
Key UI to show: [list specific screens/components to feature]
```

Save brief to: `projects/[business]/video-briefs/[name]-[date].md`

## Phase 2: Claude Code Prompt

Pass the brief to Claude Code with this framing:
```
Using Remotion Skills, create a [X]-second product demo video for [product].

Shot-by-shot sequence:
[paste brief]

Important constraints:
- Use smooth easing on all transitions (ease-in-out, spring physics)
- Highlight elements with a subtle glow or border animation, not harsh overlays
- Text should fade in, not pop — use staggered character animation where possible
- Export at 1080p, 30fps
- Keep the composition breathable — don't crowd the frame
```

Iterate 2-3 rounds. Each round: review the render, describe exactly what to change ("the zoom in shot 3 is too fast, slow it to 1.5s" not "make it better").

## Phase 3: Export & Optional Polish

1. Export via Remotion render command (Claude Code handles this)
2. Output: `.mp4` file, save to `owners-inbox/videos/[name]-[date].mp4`
3. Optional Premiere Pro polish: add music track, sound effects, color grade
4. For subreddit posts: no music needed (autoplay muted anyway) — focus on visual clarity

## Use Cases by Context

### Subreddit Outreach
- Build a 30-40s demo of a specific tool or product in action
- Show: landing on the product → entering a query → impressive output being generated
- Include the result — the most compelling output you can produce with that tool
- Embed or link in Reddit post — video posts get significantly more engagement than text+image
- Target: one demo video per major subreddit campaign

### Client Pitches
- 45-60s walkthrough of what the client's stack would look like
- Show: incoming lead → contact created → automated agent follows up → sequence fires
- Use placeholder branding (client name + colors if known)
- Include in proposal PDF or link in email — replaces 3 paragraphs of explanation

### YouTube Content
- Use Remotion for animated product demo segments within YouTube videos
- Replaces screen recording for UI walkthroughs — cleaner and more controllable
- Pairs with the youtube-idea-generator scheduled task

## Quality Rules
- Never export without previewing first — render a short clip at low resolution to check timing
- Shot transitions must feel intentional — no abrupt cuts unless for a stylistic effect
- Text on screen: max 6 words per line, 2-3 lines max per shot
- Product UI must be readable — zoom in enough that the content is legible
- If the first render looks weak: add more detail to the brief, don't just re-prompt hoping for different output

## Output
- Video file: `owners-inbox/videos/[product]-demo-[date].mp4`
- Brief saved: `projects/[business]/video-briefs/[name]-[date].md`
- Operator notified via iMessage when render is complete

## Notes
- Remotion Skills is a Claude Code plugin — must be installed in the Claude Code environment, not in JARVIS directly. Trigger this skill by starting a Claude Code session and invoking it there.
- First video will take longer (learning the tool) — subsequent videos follow the same pattern, faster
- If a render fails: check that Remotion dependencies are installed (`npm` packages), then retry
