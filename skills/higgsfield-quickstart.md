# Skill: Higgsfield CLI Quickstart

## Trigger
"higgsfield", "nano banana", "soul id", "kling", "seedance via higgsfield", "generate hero image", "generate product shot", "marketing studio", "product photoshoot", any image/video generation request where the operator names Higgsfield or where the prompt would benefit from Higgsfield's preset modes (4K image, 15s video, consistent character, etc.).

## Origin
Higgsfield released the `higgsfield` CLI on May 4, 2026 alongside a "Marketing Skills" pack. One binary covers 30+ image and video models including Nano Banana Pro, GPT Image 2, Kling v3.0, Seedance 2.0, and Soul ID (their consistent-character system). Bypassing the Higgsfield MCP and shelling out to the CLI is faster and cheaper, and matches `.claude/rules/api-over-mcp.md`.

JARVIS already has the `viral-tiktok-forge` skill on FAL.ai/Seedance. Higgsfield overlaps on Seedance/Kling but adds Soul ID and the marketing-studio/product-photoshoot presets that FAL doesn't expose.

## Goal
Use `higgsfield` for any image/video generation where:
- The operator names Higgsfield, or
- A consistent character is needed (Soul ID), or
- A preset like `marketing-studio` or `product-photoshoot` solves the brief in one command, or
- 4K image / 15s video output is required.

For everything else, the existing `viral-tiktok-forge` (FAL.ai) and image-gen skills remain the default.

---

## When to use Higgsfield vs. existing skills

| Task | Use this |
|------|----------|
| 9:16 viral TikTok with Seedance | `viral-tiktok-forge` (already wired, has caption + hashtag pipeline) |
| Single hero image, named brand, 2K/4K | `higgsfield generate create nano_banana_2` |
| Product shot with consistent angles | `higgsfield product-photoshoot` |
| Multi-shot ad with same character | `higgsfield soul-id create` then `higgsfield generate create kling3 --soul-id ...` |
| Quick infographic / clean editorial image | `higgsfield generate create gpt_image_2` |
| Editable slides / hi-fi prototype | `huashu-design` (do not use Higgsfield) |
| Landing page UI mock | `elite-web-ui` (do not use Higgsfield) |

> Default rule: if the deliverable is a **rendered image or video asset** and the project doesn't already have a route for it, use Higgsfield.

---

## Setup state (as of 2026-05-07)

- Installed via Homebrew: `brew install higgsfield-ai/tap/higgsfield`
- Binary: `/opt/homebrew/bin/higgsfield`
- Version: 0.1.33
- Auth: `higgsfield auth login` (browser flow, one-time)
- Account check: `higgsfield account`

If reinstalling on a new machine, prefer `brew` over `npm` — npm global on `/usr/local` hits permission issues; brew uses `/opt/homebrew` cleanly.

---

## Core commands

```bash
higgsfield generate create <model>     # nano_banana_2, gpt_image_2, kling3, seedance, text2image
higgsfield soul-id create --name X     # train consistent-character model
higgsfield soul-id wait <id>           # block until training finishes
higgsfield model list                  # available models in your workspace
higgsfield upload <file>               # upload reference assets
higgsfield marketing-studio            # preset: marketing pipelines
higgsfield product-photoshoot          # preset: product shots
higgsfield workspace                   # workspace info
higgsfield account                     # current account/billing state
```

Universal flags:
- `--wait` — block until job finishes, print result URL
- `--wait-timeout 10m` — max wait
- `--wait-interval 3s` — poll cadence
- `--json` — machine-readable output (pipe into `jq`)
- `--no-color` — strip ANSI

Get every model + flag:
```bash
higgsfield generate create --help
higgsfield soul-id create --help
```

---

## Patterns

### 1. Hero image, single shot
```bash
higgsfield generate create nano_banana_2 \
  --prompt "modern architecture, glass facade, golden hour" \
  --aspect_ratio 16:9 --resolution 2k --wait
```

### 2. Editorial / infographic
```bash
higgsfield generate create gpt_image_2 \
  --prompt "clean infographic showing global energy mix, flat icons, muted palette" \
  --aspect_ratio 3:4 --quality high --resolution 2k --wait
```

### 3. Consistent character across a series
```bash
# Train once
higgsfield soul-id create --name my-brand --soul-2 \
  --image ref1.jpg --image ref2.jpg --image ref3.jpg
# Wait for training
higgsfield soul-id wait <id>
# Generate using it
higgsfield generate create kling3 \
  --soul-id my-brand \
  --prompt "founder pacing in studio, cinematic" \
  --duration 8 --wait
```

### 4. Pipe to JSON for downstream skills
```bash
higgsfield generate create seedance \
  --prompt "..." --json --wait | jq -r '.result_url'
```

---

## Integration notes

- **Auth lives in `~/.config/higgsfield/`.** Don't rotate without re-running `higgsfield auth login`.
- **Per `.claude/rules/api-over-mcp.md`:** after 3+ uses, capture the actually-used commands into `references/higgsfield-api.md` with hardcoded model IDs, common prompts, and known result-URL shapes. Drop the Higgsfield MCP if installed — CLI is enough.
- **Per `.claude/rules/service-accounts.md`:** if Higgsfield ever exposes service-account-style API keys, switch headless cloud routines to a dedicated key (`HIGGSFIELD_CLOUDROUTINE_KEY`), not the operator's interactive login.
- **Output paths:** results come back as URLs. Download with `curl -L -o assets/<name>.<ext> "<url>"` and store under the project's `assets/` folder. Never just paste the URL into chat as the deliverable.
- **Cost watching:** Higgsfield bills per generation. Always set `--wait-timeout` so a stuck job doesn't burn budget. For batch runs, log each `result_url` to a CSV before moving on.

---

## Known gotchas

- `npm install -g @higgsfield/cli` on a Mac with `/usr/local` prefix needs `sudo` or `npm config set prefix ~/.npm-global`. Use brew instead.
- Soul ID training takes minutes, not seconds. Always `--wait` on a separate command, not inline.
- Seedance 2.0 here vs. via FAL: same underlying model, different pricing/queue. Use whichever has shorter wait at the time. The viral-tiktok-forge skill stays on FAL because its caption/hashtag pipeline assumes FAL's response shape.
- `higgsfield account` is the fastest way to confirm auth + billing state when something fails.

---

## Companion: community Claude skills pack
[AKCodez/higgsfield-claude-skills](https://github.com/AKCodez/higgsfield-claude-skills) — 19 skills covering image gen, Seedance video, and full UGC ad pipelines with Playwright. Worth pulling in selectively (cherry-pick the UGC ad pipeline; skip the ones that overlap with our existing skills). Do not bulk-install — review each before adopting.

---

## Related
[[viral-tiktok-forge]] — FAL.ai/Seedance pipeline, primary video gen path
[[huashu-design]] — agency-tier design, slides, prototypes (do not delegate to Higgsfield)
[[elite-web-ui]] — landing pages and web UI (do not delegate to Higgsfield)
[[api-over-mcp]] — capture the 5–10 commands that actually get used into a reference doc after 3 uses
[[service-accounts]] — switch cloud-routine usage to a dedicated key when available
