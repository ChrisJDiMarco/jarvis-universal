# Design System 2026 — Elite Web UI

Aesthetic vocabulary, color systems, typography, texture, and layout for world-class interfaces.

---

## 0. Typography — The #1 Decision (Updated 2026-03)

### Satoshi — The Premium SaaS Font
Satoshi is the validated #1 display font for 2026 premium SaaS. Geometric, Swiss modernist, weight 900 for hero headlines. DO NOT use Syne (too artsy/eclectic for product work).

```html
<!-- Always load both -->
<link href="https://api.fontshare.com/v2/css?f[]=satoshi@400,500,700,900&display=swap" rel="stylesheet">
<link href="https://fonts.googleapis.com/css2?family=Inter:opsz,wght@14..32,300..600&display=swap" rel="stylesheet">
```

```css
:root {
  --font-display: 'Satoshi', sans-serif;  /* Hero titles, section headings, nav logo */
  --font-body:    'Inter', sans-serif;    /* Body, captions, labels, UI text */
}

/* Hero display treatment */
.hero-h1 {
  font-family: var(--font-display);
  font-weight: 900;                       /* Always 900 for hero */
  letter-spacing: -0.04em;               /* Tight — Satoshi handles this beautifully */
  line-height: 0.92;                      /* Dense at large sizes */
  font-size: clamp(3rem, 7vw, 7rem);
}

/* Section headings */
h2 {
  font-family: var(--font-display);
  font-weight: 700;
  letter-spacing: -0.035em;
}

/* Gradient text — STATIC, not spinning */
.grad-text {
  background: linear-gradient(130deg, #c4b5fd 0%, #8b5cf6 40%, #06b6d4 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}
/* ❌ AVOID: animated @property --angle on text — too aggressive, not Apple */
/* ✅ Use @property animation on BACKGROUNDS only */
```

**Alternative premium fonts (all Fontshare CDN, all free):**
- `Clash Display` — `https://api.fontshare.com/v2/css?f[]=clash-display@400,500,600,700&display=swap`
- `Cabinet Grotesk` — `https://api.fontshare.com/v2/css?f[]=cabinet-grotesk@400,500,700,800&display=swap`
- `General Sans` — `https://api.fontshare.com/v2/css?f[]=general-sans@400,500,600,700&display=swap`

---

## 0b. Soft UI / Neumorphic 2026 — Card System (Updated 2026-03)

This is how Apple, Stripe, Vercel, and Linear handle cards in 2026. NO hard borders. Dimensional shadow system creates tactile, raised feel.

```css
/* Root shadow variables — define once, reuse everywhere */
:root {
  --shadow-card:
    0 1px 0 rgba(255,255,255,0.055) inset,   /* top-edge highlight = light source */
    0 -1px 0 rgba(0,0,0,0.45) inset,          /* bottom inner depth */
    0 24px 56px rgba(0,0,0,0.48),             /* outer drop shadow with depth */
    0 0 0 0.5px rgba(255,255,255,0.06);       /* ghost border — visible without being harsh */

  --shadow-card-hover:
    0 1px 0 rgba(255,255,255,0.07) inset,
    0 -1px 0 rgba(0,0,0,0.5) inset,
    0 32px 72px rgba(0,0,0,0.55),
    0 0 0 0.5px rgba(139,92,246,0.3);         /* accent tint on hover ghost border */

  --shadow-button-primary:
    0 1px 0 rgba(255,255,255,0.15) inset,     /* inner top highlight */
    0 8px 24px rgba(139,92,246,0.3);          /* colored drop shadow matches accent */
}

/* The card recipe */
.card {
  background: linear-gradient(150deg, #111120, #0d0d1a);  /* never flat color */
  box-shadow: var(--shadow-card);
  border-radius: 20px;
  border: none;                                             /* no CSS border */
  transition: box-shadow 0.3s ease, transform 0.3s ease;
}
.card:hover {
  box-shadow: var(--shadow-card-hover);
  transform: translateY(-2px);
}

/* Icon badge — soft UI version */
.icon-badge {
  background: rgba(139,92,246,0.1);
  box-shadow: 0 0 0 1px rgba(139,92,246,0.15), 0 1px 0 rgba(255,255,255,0.04) inset;
  border-radius: 12px;
  /* no border: declaration */
}
```

**Key insight**: The inner `inset 0 1px 0 rgba(255,255,255,0.055)` is the magic — it simulates a light source from above, making elements feel physically raised. This is what separates Apple-tier from generic dark mode.

---

## 0c. CSS 3D Product Mockup — SaaS Hero Pattern (Updated 2026-03)

For SaaS/product landing pages, show the ACTUAL product in a perspective-tilted mockup window. Communicates value immediately. Faster than Three.js. Apple does this with every iPhone/Mac showcase.

```html
<!-- HTML structure -->
<div class="mockup-scene" id="mockupScene">
  <div class="mockup-tilt" id="mockupTilt">
    <!-- Mac-style window chrome -->
    <div class="mw-header">
      <span class="mw-dot" style="background:#ff5f57"></span>
      <span class="mw-dot" style="background:#febc2e"></span>
      <span class="mw-dot" style="background:#28c840"></span>
      <span class="mw-title">Your App Name · Feature View</span>
    </div>
    <!-- App content goes here — sidebar + main area -->
    <div class="mw-body">
      <!-- sidebar, canvas, dashboard, etc. -->
    </div>
  </div>
</div>
```

```css
.mockup-scene {
  width: 100%; height: 100%;
  display: flex; align-items: center; justify-content: center;
  perspective: 1400px;
}

.mockup-tilt {
  width: 96%; max-width: 530px;
  border-radius: 20px;
  background: linear-gradient(150deg, #131323 0%, #0d0d1a 100%);
  box-shadow:
    0 1px 0 rgba(255,255,255,0.07) inset,
    0 -1px 0 rgba(0,0,0,0.6) inset,
    0 48px 96px rgba(0,0,0,0.72),
    0 0 0 0.5px rgba(255,255,255,0.07),
    0 0 80px rgba(139,92,246,0.07);     /* subtle accent glow */
  transform: perspective(1400px) rotateX(7deg) rotateY(-12deg);
  animation: mockup-float 5s ease-in-out infinite;
}

@keyframes mockup-float {
  0%,100% { transform: perspective(1400px) rotateX(7deg) rotateY(-12deg) translateY(0px); }
  50%      { transform: perspective(1400px) rotateX(7deg) rotateY(-12deg) translateY(-14px); }
}

/* window chrome */
.mw-header {
  display: flex; align-items: center; gap: 7px;
  padding: 13px 18px;
  border-bottom: 1px solid rgba(255,255,255,0.055);
  border-radius: 20px 20px 0 0;
}
.mw-dot { width: 10px; height: 10px; border-radius: 50%; flex-shrink: 0; }
.mw-title {
  flex: 1; text-align: center;
  font-size: .7rem; color: rgba(255,255,255,0.24);
  letter-spacing: .02em;
}
```

```js
// Smooth parallax tilt on mousemove — the Apple magic
const mScene = document.getElementById('mockupScene');
const mTilt  = document.getElementById('mockupTilt');
if (mScene && mTilt) {
  let baseX = 7, baseY = -12;
  let targetX = baseX, targetY = baseY;
  let currentX = baseX, currentY = baseY;
  let rafId;

  mScene.addEventListener('mousemove', e => {
    const r = mScene.getBoundingClientRect();
    const nx = (e.clientX - r.left)  / r.width  - 0.5;
    const ny = (e.clientY - r.top)   / r.height - 0.5;
    targetX = baseX + ny * -10;
    targetY = baseY + nx *  14;
  });

  mScene.addEventListener('mouseleave', () => {
    targetX = baseX; targetY = baseY;
  });

  // smooth lerp loop
  function tiltLoop() {
    currentX += (targetX - currentX) * 0.07;
    currentY += (targetY - currentY) * 0.07;
    mTilt.style.transform = `perspective(1400px) rotateX(${currentX}deg) rotateY(${currentY}deg)`;
    rafId = requestAnimationFrame(tiltLoop);
  }

  // Only animate when visible (performance)
  new IntersectionObserver(([e]) => {
    if (e.isIntersecting) tiltLoop();
    else cancelAnimationFrame(rafId);
  }, { threshold: 0.1 }).observe(mScene);
}
```

**What to put inside the mockup (matches the product's core action):**
- Tool builder → node graph with SVG connection lines + animated traveling dots
- Dashboard → mini charts and data rows
- Design tool → canvas with floating UI elements
- CRM → contact cards and pipeline columns
- Always include: traffic light dots header, status bar at bottom, sidebar for navigation

---

## 1. Color Systems

### Dark Mode as Primary Canvas
Dark mode is not an alternative — it IS the primary experience for premium 2026 interfaces.

```css
:root {
  /* Base surfaces */
  --bg-base:    #080808;   /* Deepest background */
  --bg-surface: #111111;   /* Cards, panels */
  --bg-elevated:#1a1a1a;   /* Modals, dropdowns */
  --bg-overlay: #222222;   /* Tooltips */

  /* Borders */
  --border-subtle: rgba(255,255,255,0.06);
  --border-default: rgba(255,255,255,0.10);
  --border-strong:  rgba(255,255,255,0.18);

  /* Text */
  --text-primary:   rgba(255,255,255,0.95);
  --text-secondary: rgba(255,255,255,0.60);
  --text-tertiary:  rgba(255,255,255,0.35);

  /* Accent — pick ONE saturated color */
  --accent:        #6366f1;  /* Indigo */
  --accent-light:  #818cf8;
  --accent-glow:   rgba(99,102,241,0.25);
}
```

**Accent palette options (pick one per project, stay monochromatic):**
```css
/* Electric Blue */   --accent: #3b82f6;  --accent-glow: rgba(59,130,246,0.25);
/* Violet */          --accent: #8b5cf6;  --accent-glow: rgba(139,92,246,0.25);
/* Emerald */         --accent: #10b981;  --accent-glow: rgba(16,185,129,0.25);
/* Amber */           --accent: #f59e0b;  --accent-glow: rgba(245,158,11,0.25);
/* Rose */            --accent: #f43f5e;  --accent-glow: rgba(244,63,94,0.25);
```

---

## 2. Mesh Gradient Backgrounds

Multiple overlapping radial gradients create a rich, painterly depth. The signature 2026 background.

```css
.mesh-gradient {
  background-color: #080808;
  background-image:
    radial-gradient(ellipse 80% 60% at 20% 40%, rgba(99,102,241,0.15) 0%, transparent 60%),
    radial-gradient(ellipse 60% 50% at 80% 20%, rgba(168,85,247,0.12) 0%, transparent 55%),
    radial-gradient(ellipse 50% 40% at 60% 80%, rgba(236,72,153,0.10) 0%, transparent 50%),
    radial-gradient(ellipse 40% 60% at 5%  90%, rgba(59,130,246,0.08) 0%, transparent 45%);
}
```

### Animated Mesh Gradient (CSS @property)
```css
/* Register animatable custom properties */
@property --g1-x { syntax: '<percentage>'; inherits: false; initial-value: 20%; }
@property --g1-y { syntax: '<percentage>'; inherits: false; initial-value: 40%; }
@property --g2-x { syntax: '<percentage>'; inherits: false; initial-value: 80%; }
@property --g2-y { syntax: '<percentage>'; inherits: false; initial-value: 20%; }
@property --g3-x { syntax: '<percentage>'; inherits: false; initial-value: 60%; }
@property --g3-y { syntax: '<percentage>'; inherits: false; initial-value: 80%; }

@keyframes morph-gradient {
  0%   { --g1-x: 20%; --g1-y: 40%; --g2-x: 80%; --g2-y: 20%; --g3-x: 60%; --g3-y: 80%; }
  33%  { --g1-x: 60%; --g1-y: 20%; --g2-x: 30%; --g2-y: 70%; --g3-x: 80%; --g3-y: 40%; }
  66%  { --g1-x: 40%; --g1-y: 70%; --g2-x: 70%; --g2-y: 50%; --g3-x: 20%; --g3-y: 30%; }
  100% { --g1-x: 20%; --g1-y: 40%; --g2-x: 80%; --g2-y: 20%; --g3-x: 60%; --g3-y: 80%; }
}

.animated-mesh {
  animation: morph-gradient 12s ease-in-out infinite;
  background-image:
    radial-gradient(ellipse 80% 60% at var(--g1-x) var(--g1-y), rgba(99,102,241,0.2) 0%, transparent 60%),
    radial-gradient(ellipse 60% 50% at var(--g2-x) var(--g2-y), rgba(168,85,247,0.15) 0%, transparent 55%),
    radial-gradient(ellipse 50% 40% at var(--g3-x) var(--g3-y), rgba(236,72,153,0.12) 0%, transparent 50%);
}
```

---

## 3. Grain / Noise Texture

The single most impactful texture move. Makes screens feel physical and premium.

```html
<!-- Add as first child of body or any section needing texture -->
<div class="grain-overlay" aria-hidden="true"></div>
```

```css
/* SVG turbulence filter approach — no image file needed */
.grain-overlay {
  position: fixed;
  inset: -50%;          /* Extend past edges to prevent edge artifacts */
  width: 200%;
  height: 200%;
  background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E");
  opacity: 0.035;        /* 3-5% — visible but not distracting */
  pointer-events: none;
  z-index: 9999;
  animation: grain-shift 0.5s steps(2) infinite;
}

@keyframes grain-shift {
  0%   { transform: translate(0, 0); }
  25%  { transform: translate(-3%, -5%); }
  50%  { transform: translate(5%, 3%); }
  75%  { transform: translate(-5%, 7%); }
  100% { transform: translate(3%, -3%); }
}
```

---

## 4. Typography System

### Variable Font + Fluid Scale
```css
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@100..900&display=swap');
/* OR for more premium feel: */
@import url('https://fonts.googleapis.com/css2?family=Syne:wght@400..800&family=Inter:wght@300..500&display=swap');

:root {
  /* Fluid type scale — responds to viewport width */
  --text-xs:   clamp(0.75rem,  1vw,    0.875rem);
  --text-sm:   clamp(0.875rem, 1.2vw,  1rem);
  --text-base: clamp(1rem,     1.5vw,  1.125rem);
  --text-lg:   clamp(1.125rem, 1.8vw,  1.25rem);
  --text-xl:   clamp(1.25rem,  2.2vw,  1.5rem);
  --text-2xl:  clamp(1.5rem,   3vw,    2rem);
  --text-3xl:  clamp(2rem,     4vw,    3rem);
  --text-4xl:  clamp(2.5rem,   5.5vw,  4.5rem);
  --text-hero: clamp(3rem,     8vw,    8rem);
}

/* Display typography — the header/hero style */
.display-text {
  font-family: 'Syne', sans-serif;
  font-weight: 700;
  letter-spacing: -0.04em;
  line-height: 0.95;
  font-size: var(--text-hero);
}

/* Body — readable and clean */
.body-text {
  font-family: 'Inter', sans-serif;
  font-weight: 400;
  letter-spacing: -0.01em;
  line-height: 1.6;
  font-size: var(--text-base);
  color: var(--text-secondary);
}

/* Labels / metadata — ALL CAPS with wide tracking */
.label-text {
  font-family: 'Inter', sans-serif;
  font-weight: 500;
  font-size: var(--text-xs);
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: var(--text-tertiary);
}
```

### Variable Font Weight Transition on Hover
```css
.variable-hover {
  font-variation-settings: 'wght' 400;
  transition: font-variation-settings 0.3s ease;
}
.variable-hover:hover {
  font-variation-settings: 'wght' 700;
}
```

---

## 5. Glassmorphism (Done Right)

The mistake most people make: too much blur, too high opacity, everywhere.
The rule: 1–2 glass elements per screen. Use for navigations and overlay cards only.

```css
.glass {
  background: rgba(255, 255, 255, 0.04);
  backdrop-filter: blur(20px) saturate(180%);
  -webkit-backdrop-filter: blur(20px) saturate(180%);
  border: 1px solid rgba(255, 255, 255, 0.08);
  box-shadow:
    0 4px 24px rgba(0, 0, 0, 0.3),
    inset 0 1px 0 rgba(255, 255, 255, 0.06);
}

/* Navigation bar glass */
.nav-glass {
  background: rgba(8, 8, 8, 0.7);
  backdrop-filter: blur(24px) saturate(200%);
  -webkit-backdrop-filter: blur(24px) saturate(200%);
  border-bottom: 1px solid rgba(255, 255, 255, 0.06);
  position: fixed; top: 0; left: 0; right: 0;
  z-index: 100;
  transition: background 0.3s ease;
}

/* Colored glass — use sparingly for premium cards */
.glass-accent {
  background: rgba(99, 102, 241, 0.08);
  backdrop-filter: blur(16px);
  border: 1px solid rgba(99, 102, 241, 0.2);
  box-shadow:
    0 0 0 1px rgba(99, 102, 241, 0.1),
    0 4px 32px rgba(99, 102, 241, 0.15);
}
```

---

## 6. Depth Shadows (Not Flat Shadows)

2026 shadows have multiple layers and color tint. Single-shadow = flat = 2015.

```css
/* Subtle card shadow */
.shadow-card {
  box-shadow:
    0 1px 2px rgba(0,0,0,0.2),
    0 4px 12px rgba(0,0,0,0.15),
    0 16px 32px rgba(0,0,0,0.10);
}

/* Elevated panel */
.shadow-elevated {
  box-shadow:
    0 2px 4px rgba(0,0,0,0.3),
    0 8px 24px rgba(0,0,0,0.2),
    0 32px 64px rgba(0,0,0,0.15);
}

/* Glow shadow — use for accent elements */
.shadow-glow {
  box-shadow:
    0 0 0 1px var(--accent-glow),
    0 4px 16px var(--accent-glow),
    0 16px 48px rgba(0,0,0,0.4);
}

/* Interactive: lift on hover */
.shadow-interactive {
  box-shadow: 0 2px 8px rgba(0,0,0,0.2);
  transition: box-shadow 0.3s ease, transform 0.3s ease;
}
.shadow-interactive:hover {
  box-shadow:
    0 4px 16px rgba(0,0,0,0.3),
    0 16px 48px rgba(0,0,0,0.2),
    0 0 32px var(--accent-glow);
  transform: translateY(-2px);
}
```

---

## 7. Bento Grid Layout

The signature 2026 feature section layout. Asymmetric grid with mixed-size cells.

```css
.bento-grid {
  display: grid;
  grid-template-columns: repeat(12, 1fr);
  grid-template-rows: auto;
  gap: 16px;
}

/* Large feature cell */
.bento-large {
  grid-column: span 8;
  grid-row: span 2;
  min-height: 400px;
}

/* Medium cell */
.bento-medium {
  grid-column: span 4;
  min-height: 190px;
}

/* Tall cell */
.bento-tall {
  grid-column: span 4;
  grid-row: span 2;
  min-height: 400px;
}

/* Wide cell */
.bento-wide {
  grid-column: span 8;
  min-height: 190px;
}

/* Mobile: all full width */
@media (max-width: 768px) {
  .bento-grid > * {
    grid-column: 1 / -1;
    grid-row: auto;
  }
}

/* Bento cell base */
.bento-cell {
  background: var(--bg-surface);
  border: 1px solid var(--border-subtle);
  border-radius: 20px;
  padding: 28px;
  overflow: hidden;
  position: relative;
  transition: border-color 0.3s ease, transform 0.3s ease;
}
.bento-cell:hover {
  border-color: var(--border-default);
}
```

---

## 8. Gradient Text

```css
.gradient-text {
  background: linear-gradient(135deg, #e0e0ff 0%, #6366f1 40%, #a855f7 70%, #ec4899 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

/* Animated gradient text */
@property --angle {
  syntax: '<angle>';
  inherits: false;
  initial-value: 135deg;
}
@keyframes rotate-gradient {
  to { --angle: 495deg; }
}
.gradient-text-animated {
  background: linear-gradient(var(--angle), #6366f1, #a855f7, #ec4899, #6366f1);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  animation: rotate-gradient 4s linear infinite;
}
```

---

## 9. Gradient Border

```css
.gradient-border {
  position: relative;
  background: var(--bg-surface);
  border-radius: 16px;
}
.gradient-border::before {
  content: '';
  position: absolute;
  inset: -1px;
  border-radius: 17px; /* 1px larger than parent */
  background: linear-gradient(135deg, rgba(99,102,241,0.6), rgba(168,85,247,0.3), rgba(99,102,241,0.1));
  z-index: -1;
}
```

---

## 10. Button System

```css
/* Primary — filled with glow */
.btn-primary {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 12px 24px;
  background: var(--accent);
  color: white;
  font-weight: 500;
  font-size: 0.9rem;
  letter-spacing: -0.01em;
  border: none;
  border-radius: 10px;
  cursor: pointer;
  transition: transform 0.2s ease, box-shadow 0.2s ease, background 0.2s ease;
}
.btn-primary:hover {
  transform: translateY(-1px);
  box-shadow: 0 8px 24px var(--accent-glow);
  background: var(--accent-light);
}
.btn-primary:active { transform: translateY(0); }

/* Secondary — ghost with border */
.btn-secondary {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 11px 23px; /* 1px less for border compensation */
  background: transparent;
  color: var(--text-primary);
  font-weight: 500;
  font-size: 0.9rem;
  border: 1px solid var(--border-default);
  border-radius: 10px;
  cursor: pointer;
  transition: border-color 0.2s ease, background 0.2s ease, transform 0.2s ease;
}
.btn-secondary:hover {
  border-color: var(--border-strong);
  background: rgba(255,255,255,0.04);
  transform: translateY(-1px);
}
```

---

## 11. Layout Fundamentals

```css
/* Full-bleed section with constrained content */
.section {
  width: 100%;
  padding: clamp(60px, 10vw, 120px) 0;
}
.container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 clamp(20px, 5vw, 80px);
}

/* Hero layout — asymmetric, editorial */
.hero {
  display: grid;
  grid-template-columns: 1fr 1fr;
  align-items: center;
  min-height: 100vh;
  gap: 60px;
  padding: 120px clamp(20px, 5vw, 80px);
}
@media (max-width: 768px) {
  .hero { grid-template-columns: 1fr; padding-top: 100px; }
}

/* Feature section: text left, media right */
.feature-split {
  display: grid;
  grid-template-columns: 5fr 7fr;
  gap: clamp(40px, 6vw, 80px);
  align-items: center;
}
.feature-split.reverse { direction: rtl; }
.feature-split.reverse > * { direction: ltr; }

@media (max-width: 900px) {
  .feature-split { grid-template-columns: 1fr; }
  .feature-split.reverse { direction: ltr; }
}
```

---

## 12. Glow Orbs (Ambient Light Blobs)

Positioned blobs of color that illuminate the dark background — creates atmospheric depth.

```css
/* Place these fixed or absolute, behind main content */
.orb {
  position: absolute;
  border-radius: 50%;
  filter: blur(80px);
  pointer-events: none;
  z-index: 0;
}
.orb-purple {
  width: 600px; height: 600px;
  background: rgba(139, 92, 246, 0.12);
  top: -200px; left: -200px;
}
.orb-blue {
  width: 500px; height: 500px;
  background: rgba(59, 130, 246, 0.10);
  bottom: -150px; right: -150px;
}
.orb-pink {
  width: 400px; height: 400px;
  background: rgba(244, 63, 94, 0.08);
  top: 40%; left: 50%;
  transform: translate(-50%, -50%);
}
```
