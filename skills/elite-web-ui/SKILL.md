---
name: elite-web-ui
description: Elite 2026 web UI builder with advanced animations, 3D, and cutting-edge design. ALWAYS use this skill when building any webpage, landing page, React component, web UI, portfolio, SaaS dashboard, hero section, or any visual web artifact — even if the user doesn't explicitly ask for advanced design. Also trigger when asked to "make it more animated", "add 3D effects", "make it look premium", "improve the design", "build a marketing site", "create something impressive", or "make it feel modern". This skill is the difference between forgettable HTML and Awwwards-level interfaces.
---

# Elite Web UI — 2026 Design System

## ⚡ FIRST — Read This Before Any Code

**You are always building for the Cowork HTML preview unless told otherwise.** The preview renders files locally, which means **external JavaScript CDN scripts silently fail to load**. GSAP, Lenis, Three.js — all blocked. The page renders but stays invisible because JS never fires.

**The rule:** For every single-file HTML build in Cowork:
1. **NO** `<script src="https://...">` tags — ever. Zero. They don't load.
2. **YES** font `<link>` tags — Fontshare/Google Fonts are CSS, they work fine.
3. Use **pure CSS `@keyframes`** for hero entrance animations (with `animation-fill-mode: both`)
4. Use **`IntersectionObserver`** for scroll reveals — direct replacement for GSAP ScrollTrigger
5. Use **vanilla JS `requestAnimationFrame`** for counters, cursor, magnetic buttons, parallax

**Read `references/vanilla-animation-patterns.md` now** — it has complete copy-paste code for every animation technique, all zero-dependency.

This single rule is the difference between a page that loads fully rendered vs. a blank dark screen with a floating cursor.

---

You are building a world-class web interface. Before writing a single line of code, internalize these five pillars. They are the difference between forgettable and extraordinary.

---

## The Five Pillars

### 1. Motion as Communication
Every animation serves a semantic purpose — it reveals hierarchy, communicates physics/weight, guides attention, or confirms interaction. Before adding any animation, ask: "what does this teach the user?" Remove any animation you can't answer that question for.

Intent map:
- **Entrance** → establish visual hierarchy, tell the eye where to start
- **Hover** → confirm interactivity, invite click
- **Scroll** → reveal content progressively, maintain spatial context
- **Transition** → maintain orientation across state changes
- **Idle** → suggest life and depth (use sparingly — 1 idle animation per screen max)

### 2. Depth System — Always Three Layers
Every interface must have foreground, midground, and background. Flat = forgettable.

| Layer | z-index | Scroll behavior | Examples |
|-------|---------|----------------|---------|
| Background | 0 | Parallax 0.1x (slow) | Grain overlay, mesh gradient, ambient 3D scene |
| Midground | 1 | Normal | Main content, cards, text blocks |
| Foreground | 2 | Parallax 1.15x (fast) | Floating elements, cursor effects, badges |

### 3. GPU-Only Animations — Non-Negotiable
**ONLY animate `transform` and `opacity`.** This is the single most important performance rule.

```css
/* ✅ GPU-composited — smooth at 60fps on any device */
.element { transform: translateY(30px); opacity: 0; }
.element.visible { transform: translateY(0); opacity: 1; }

/* ❌ Causes layout reflow — jank, battery drain, mobile death */
.element { top: 30px; visibility: hidden; width: 0; }
```

For animated colors/gradients: use CSS `@property` (custom property animation) — see design-system-2026.md.
Add `will-change: transform` ONLY on elements actively about to animate, remove it after.

### 4. 3D as a Design Tool
3D is not decoration. It establishes spatial metaphors, creates premium perception, and communicates depth when 2D layout cannot. Match complexity to context:

| Context | 3D Approach |
|---------|------------|
| **SaaS / product landing page hero** | **CSS 3D product mockup** — show the actual UI at a perspective tilt. Communicates value immediately. No Three.js. (See design-system-2026.md → CSS 3D Product Mockup) |
| Abstract / portfolio hero | Three.js: particle field or floating geometry |
| Product showcase | Three.js: model with environment + reflection |
| Feature card | CSS `perspective` + `rotateX/Y` on hover (no JS) |
| Dashboard | CSS 3D sparingly for depth cues — never distractions |
| Portfolio | Three.js: custom scene matching brand personality |

**Key rule added (validated 2026-03):** For SaaS/product landing pages, CSS 3D product mockups outperform Three.js scenes — they load faster, communicate the actual product, and align with Apple's "show the device" philosophy. Use Three.js only when no real product UI exists to show, or when brand personality explicitly calls for abstraction.

### 5. 2026 Aesthetic Vocabulary
These design moves signal mastery. Use at least 3 per project:

**Color**: Deep dark base (`#060609`–`#111`), mesh gradient overlays, single saturated accent on dark canvas, aurora-style animated backgrounds.

**Typography**: **Satoshi** (Fontshare CDN) is the #1 premium SaaS display font for 2026. Swiss geometric modernist, weight 900 for hero, pairs with Inter for body. DO NOT use Syne (too eclectic/artsy for SaaS). Variable font weight transitions, tight display tracking (`letter-spacing: -0.04em`), fluid type with `clamp()`, CAPS for labels/metadata.
```html
<link href="https://api.fontshare.com/v2/css?f[]=satoshi@400,500,700,900&display=swap" rel="stylesheet">
```

**Texture**: Grain noise at 3–5% opacity — this single move kills digital flatness and makes screens feel physical. Always include it.

**Layout**: Bento grid for feature sections, full-bleed backgrounds with max-width content containers, asymmetric hero text placement, generous whitespace (more than feels comfortable).

**Glass**: `backdrop-filter: blur(28px) saturate(180%)` + semi-transparent bg + `0.5px solid rgba(255,255,255,0.07)`. Use 1–2 glass elements per design, never more.

**Soft UI / Neumorphic 2026**: Cards use multi-layer box-shadow instead of borders. This is the signature Apple/Stripe/Vercel treatment — creates dimensionality without visible lines:
```css
/* The validated Soft UI card recipe */
--shadow-card:
  0 1px 0 rgba(255,255,255,0.055) inset,   /* top edge highlight (light source) */
  0 -1px 0 rgba(0,0,0,0.45) inset,          /* bottom inner shadow */
  0 24px 56px rgba(0,0,0,0.48),             /* outer depth shadow */
  0 0 0 0.5px rgba(255,255,255,0.06);       /* ghost border */

--shadow-card-hover:
  0 1px 0 rgba(255,255,255,0.07) inset,
  0 -1px 0 rgba(0,0,0,0.5) inset,
  0 32px 72px rgba(0,0,0,0.55),
  0 0 0 0.5px rgba(139,92,246,0.3);         /* accent ghost border on hover */
```
Background: `linear-gradient(150deg, #111120, #0d0d1a)` — never flat color on dark cards.

**Gradient text**: Use STATIC gradient on hero headlines (not spinning `@property --angle`). Apple never uses spinning gradients. Reserve `@property` animation for backgrounds only.
`background: linear-gradient(130deg, #c4b5fd 0%, #8b5cf6 40%, #06b6d4 100%)`

**Motion cue**: Subtle idle animation on hero element (gentle float, slow rotation) — makes static pages feel alive.

---

## Project Type → Which References to Read

**For all Cowork single-file HTML builds, always read `references/vanilla-animation-patterns.md` first.** Then pick the second reference based on project type.

| Project Type | Read First (Cowork HTML) | Also Read |
|-------------|--------------------------|-----------|
| Marketing / landing page | `references/vanilla-animation-patterns.md` | `references/design-system-2026.md` |
| Portfolio / creative agency | `references/vanilla-animation-patterns.md` | `references/design-system-2026.md` |
| SaaS product UI | `references/vanilla-animation-patterns.md` | `references/design-system-2026.md` |
| Local business / service page | `references/vanilla-animation-patterns.md` | `references/code-snippets.md` |
| Any single UI element / component | `references/vanilla-animation-patterns.md` | `references/code-snippets.md` |
| "Make this look amazing" | `references/vanilla-animation-patterns.md` | `references/design-system-2026.md` |

**Default rule**: When uncertain, read `references/vanilla-animation-patterns.md` — it has the complete zero-dependency bootstrap block you can drop straight into any HTML file.

---

## Tech Selection Guide

> ⚠️ **Critical — Read This Before Picking a Tech Stack**
>
> Cowork's HTML preview renders files **locally** (equivalent to `file://`). This means **external JavaScript CDNs are blocked** — GSAP, Lenis, Three.js, and any `<script src="https://...">` will silently fail to load. The page renders, animations never fire, content stays invisible.
>
> **CSS CDNs (fonts) still work.** Fontshare and Google Fonts load fine. Only `<script src>` tags pointing to external hosts are blocked.
>
> Rule: **If the HTML file will be previewed in Cowork, use zero external JS dependencies.** Build with pure CSS animations + vanilla JS instead. See `references/vanilla-animation-patterns.md` for the complete playbook.

---

### Context A: Single-file HTML → Cowork Preview (local file viewing)
**ZERO external JS scripts.** Fonts-only CDNs are fine.

```html
<!-- ✅ Fonts load fine (CSS CDN, not JS) -->
<link href="https://api.fontshare.com/v2/css?f[]=satoshi@400,500,700,900&display=swap" rel="stylesheet">
<link href="https://fonts.googleapis.com/css2?family=Inter:opsz,wght@14..32,300..600&display=swap" rel="stylesheet">

<!-- ❌ These will silently fail in Cowork preview — DO NOT USE -->
<!-- <script src="https://cdnjs.cloudflare.com/ajax/libs/gsap/..."></script> -->
<!-- <script src="https://cdn.jsdelivr.net/...lenis..."></script> -->
```

**Replacement stack — covers everything GSAP + Lenis provided:**
- **Scroll entrance animations** → CSS `@keyframes` + `IntersectionObserver`
- **Stagger reveals** → CSS `nth-child` + `transition-delay`
- **Smooth scroll** → `scroll-behavior: smooth` (CSS)
- **Counters/number roll-up** → vanilla JS `requestAnimationFrame` loop
- **Magnetic buttons** → JS `mousemove` math (no lib needed)
- **Custom cursor** → JS `mousemove` + CSS `position: fixed`
- **Parallax** → JS `scroll` event + `transform`
- **Marquee** → CSS `@keyframes` infinite

**Read `references/vanilla-animation-patterns.md` for complete, copy-paste implementations of all of the above.**

---

### Context B: Single-file HTML → Deployed to web server / CDN
External JS scripts load normally. Full stack available:

```html
<!-- Satoshi — premium SaaS display font -->
<link href="https://api.fontshare.com/v2/css?f[]=satoshi@400,500,700,900&display=swap" rel="stylesheet">
<!-- GSAP 3.12 -->
<script src="https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.5/gsap.min.js"></script>
<script src="https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.5/ScrollTrigger.min.js"></script>
<!-- Three.js r128 — only if using 3D -->
<script src="https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js"></script>
<!-- Lenis smooth scroll -->
<script src="https://cdn.jsdelivr.net/npm/@studio-freight/lenis@1.0.42/dist/lenis.min.js"></script>
```

For product/SaaS landing pages, use CSS 3D mockup over Three.js — faster load, communicates actual product value.

---

### Context C: React JSX artifact (Cowork)
Available without install:
```jsx
import * as THREE from 'three'  // ✅ Available
import { useState, useEffect, useRef } from 'react'  // ✅ Always available
// Framer Motion NOT available by default — use CSS + useRef animations instead
// GSAP: load dynamically in useEffect or use CSS custom property animations
```
For React 3D: import THREE directly, manage canvas via `useRef`. See `references/3d-patterns.md`.

---

### Context D: Real project (npm/Vite/Next.js)
```bash
npm install gsap @studio-freight/lenis three @react-three/fiber @react-three/drei framer-motion
```
Full access to GSAP plugins (SplitText, MorphSVG), R3F ecosystem, Framer Motion variants.

---

## Animation Selection Guide

| Goal | Cowork Preview (no CDN) | Deployed / npm | Reference |
|------|------------------------|----------------|-----------|
| Entrance on scroll | `IntersectionObserver` + CSS `@keyframes` | GSAP ScrollTrigger | `vanilla-animation-patterns.md` |
| Stagger reveal | CSS `nth-child` + `transition-delay` | GSAP stagger | `vanilla-animation-patterns.md` |
| Smooth page scroll | `scroll-behavior: smooth` (CSS) | Lenis | `vanilla-animation-patterns.md` |
| Hover micro-interactions | CSS `transition` | CSS `transition` | `code-snippets.md` |
| Custom cursor / follower | Vanilla JS `mousemove` + lerp | Vanilla JS + CSS | `vanilla-animation-patterns.md` |
| Magnetic button | Vanilla JS `mousemove` math | Vanilla JS `mousemove` math | `vanilla-animation-patterns.md` |
| Counter / number rollup | Vanilla JS `requestAnimationFrame` | GSAP ticker | `vanilla-animation-patterns.md` |
| Infinite marquee | Pure CSS `@keyframes` | Pure CSS `@keyframes` | `vanilla-animation-patterns.md` |
| Hero entrance timeline | CSS `animation` + `animation-delay` | GSAP timeline | `vanilla-animation-patterns.md` |
| Parallax depth layers | Vanilla JS `scroll` + `transform` | GSAP ScrollTrigger | `vanilla-animation-patterns.md` |
| Page/route transitions | View Transitions API | View Transitions API | `animation-patterns.md` |
| Background 3D scene | ❌ Skip — use CSS gradient instead | Three.js | `3d-patterns.md` |
| **SaaS hero product mockup** | **CSS 3D perspective tilt** | **CSS 3D perspective tilt** | `design-system-2026.md` |
| Card tilt on hover | CSS `perspective` + JS | CSS `perspective` + JS | `code-snippets.md` |
| Text character reveal | CSS `@keyframes` stagger | GSAP SplitText | `animation-patterns.md` |
| Animated gradient/aurora | CSS `@property` | CSS `@property` | `design-system-2026.md` |
| Particle field | ❌ Skip or use Canvas API | Three.js Points | `3d-patterns.md` |
| Interactive 3D product | ❌ Skip — use CSS 3D mockup | Three.js + raycasting | `3d-patterns.md` |

---

## Performance Rules (Hard Stops)

These are not guidelines — violating them makes the build worse than if you'd done nothing:

1. **Zero layout-triggering animations.** `top`, `left`, `width`, `height`, `margin`, `padding` — never animated.
2. **`will-change` is a promise, not a habit.** Add it only to elements actively mid-animation. Remove it in animation completion callbacks.
3. **Lazy-load 3D scenes.** Use `IntersectionObserver` — never init Three.js on page load for below-fold content.
4. **Canvas over DOM for particles.** >20 animated DOM elements = use Canvas or WebGL.
5. **`requestAnimationFrame` for JS animations.** Never `setInterval` or `setTimeout` for visual updates.
6. **Debounce scroll and resize handlers.** Window events fire hundreds of times per second.

---

## Accessibility — Always Include

```css
/* Reduced motion — always at the top of your CSS */
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
    scroll-behavior: auto !important;
  }
}
```

In GSAP/JS:
```js
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
if (!reducedMotion) {
  // All non-essential animations here
}
```

---

## Output Checklist — Before Shipping Any Web Build

Run through this before calling it done:

- [ ] **CDN safety check** — If delivering for Cowork preview: zero `<script src="https://...">` tags. Fonts CDN (`<link>`) is fine, JS CDN is not.
- [ ] **Depth test** — identifiable background, midground, foreground layers
- [ ] **Motion test** — at least one scroll-triggered entrance, one hover interaction
- [ ] **GPU test** — zero `top`/`left`/`width`/`height` values being animated
- [ ] **Texture test** — grain noise, gradient, or texture present (no pure flat surfaces)
- [ ] **Typography test** — Satoshi for display, tight tracking, fluid scale
- [ ] **Soft UI test** — cards use shadow recipe, not hard borders (unless glass morphism intentional)
- [ ] **Communication test** — does the hero visual immediately show WHAT the product does?
- [ ] **Gradient text test** — static gradient on headlines (no spinning @property)
- [ ] **Initial state test** — if using JS to animate elements in: confirm elements are VISIBLE before JS runs (use CSS `@keyframes` with `animation-fill-mode: both` so content never flashes invisible)
- [ ] **Mobile test** — responsive at 375px, animations don't break or overflow
- [ ] **Reduced motion** — `prefers-reduced-motion` respected
- [ ] **3D lazy** — Three.js (if used) only initializes when canvas enters viewport

The bar is elite. Never ship a flat, static layout when this skill is loaded.

---

## Reference Files

Load the relevant file(s) based on the project table above. Each is self-contained with working code.

| File | Contains | When to Use |
|------|---------|-------------|
| `references/vanilla-animation-patterns.md` | **Zero-dependency animations** — CSS `@keyframes`, `IntersectionObserver`, vanilla JS counters, cursor, magnetic, marquee, parallax | **Always read this first for Cowork preview builds** |
| `references/animation-patterns.md` | GSAP + ScrollTrigger, Lenis setup, CSS scroll-driven animations, View Transitions API, text reveal patterns | Deployed web builds with CDN access |
| `references/3d-patterns.md` | Three.js scene setup, particle fields, shader backgrounds, CSS 3D card tilt, floating objects | When Three.js CDN is available |
| `references/design-system-2026.md` | Color systems, mesh gradients, grain texture, variable typography, bento grid, glass morphism | All builds |
| `references/code-snippets.md` | 20 complete working implementations — magnetic buttons, cursor follower, parallax, counters, marquees | All builds (pure CSS/JS patterns) |
| `assets/boilerplate-cowork.html` | **Cowork-safe boilerplate** — zero CDN JS, pure CSS + vanilla JS, all patterns pre-wired | Starting point for Cowork preview builds |
| `assets/boilerplate.html` | Full-stack boilerplate — GSAP + Three.js + Lenis loaded, structure ready | Starting point for deployed web builds |
