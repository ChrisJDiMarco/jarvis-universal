# Vanilla Animation Patterns — Zero External JS Dependencies

Complete, copy-paste animations using only CSS `@keyframes`, `IntersectionObserver`, and vanilla JS `requestAnimationFrame`. These work in every environment including Cowork's local HTML preview (where CDN JS is blocked).

**Fonts CDN still works** — Fontshare/Google Fonts are CSS `<link>` tags, not `<script>` tags, so they load fine.

---

## 1. Hero Entrance — CSS Timeline

The cleanest zero-dependency hero entrance. CSS `animation` with staggered `animation-delay` and `animation-fill-mode: both` (holds the final state, so nothing flashes invisible after the animation ends).

```css
/* Core keyframes */
@keyframes fadeUp {
  from { opacity: 0; transform: translateY(28px); }
  to   { opacity: 1; transform: translateY(0); }
}
@keyframes fadeRight {
  from { opacity: 0; transform: translateX(36px); }
  to   { opacity: 1; transform: translateX(0); }
}
@keyframes fadeIn {
  from { opacity: 0; }
  to   { opacity: 1; }
}

/* Apply to hero elements with staggered delays */
.hero-badge  { animation: fadeUp .55s .15s both ease-out; }
.hero-h1     { animation: fadeUp .70s .30s both ease-out; }
.hero-sub    { animation: fadeUp .65s .45s both ease-out; }
.hero-ctas   { animation: fadeUp .60s .58s both ease-out; }
.hero-trust  { animation: fadeUp .60s .70s both ease-out; }
.hero-visual { animation: fadeRight .80s .50s both ease-out; }
```

**Why `both`?** `animation-fill-mode: both` = element starts at the `from` state before the delay begins AND holds the `to` state after the animation ends. Without it, elements flash in at full opacity before their delay fires.

---

## 2. Scroll Reveal — IntersectionObserver

Replaces GSAP ScrollTrigger for all scroll-triggered entrance animations. Works in every browser, zero deps.

### CSS setup (all reveal classes start invisible)
```css
/* Single element reveal */
.reveal {
  opacity: 0;
  transform: translateY(26px);
  transition: opacity .7s ease-out, transform .7s ease-out;
}
.reveal.vis { opacity: 1; transform: translateY(0); }

/* Slide in from right */
.reveal-x {
  opacity: 0;
  transform: translateX(36px);
  transition: opacity .8s ease-out, transform .8s ease-out;
}
.reveal-x.vis { opacity: 1; transform: translateX(0); }

/* Stagger: parent gets .stagger, children animate in sequence */
.stagger > * {
  opacity: 0;
  transform: translateY(28px);
  transition: opacity .6s ease-out, transform .6s ease-out;
}
/* nth-child delays — extend as needed */
.stagger.vis > *:nth-child(1)  { transition-delay: .04s; }
.stagger.vis > *:nth-child(2)  { transition-delay: .12s; }
.stagger.vis > *:nth-child(3)  { transition-delay: .20s; }
.stagger.vis > *:nth-child(4)  { transition-delay: .28s; }
.stagger.vis > *:nth-child(5)  { transition-delay: .36s; }
.stagger.vis > *:nth-child(6)  { transition-delay: .44s; }
.stagger.vis > *:nth-child(7)  { transition-delay: .52s; }
.stagger.vis > *:nth-child(8)  { transition-delay: .60s; }
.stagger.vis > * { opacity: 1; transform: translateY(0); }
```

### JS setup
```js
const io = new IntersectionObserver(entries => {
  entries.forEach(e => {
    if (!e.isIntersecting) return;
    e.target.classList.add('vis');
    // Optional: fire counters when stats section enters view
    e.target.querySelectorAll('.counter').forEach(animCounter);
    io.unobserve(e.target); // unobserve after first trigger (animate-once)
  });
}, { threshold: 0.1 });

// Observe all reveal elements
document.querySelectorAll('.reveal, .reveal-x, .stagger').forEach(el => io.observe(el));
```

### Usage in HTML
```html
<!-- Single element -->
<h2 class="reveal">Our Services</h2>

<!-- From the right -->
<div class="reveal-x">...</div>

<!-- Staggered grid — children animate in sequence automatically -->
<div class="services-grid stagger">
  <div class="card">...</div>
  <div class="card">...</div>
  <div class="card">...</div>
</div>
```

---

## 3. Animated Counter / Number Roll-Up

Replaces GSAP ticker. Pure `requestAnimationFrame` with ease-out cubic curve.

```js
function animCounter(el) {
  const target = parseInt(el.dataset.target);
  const duration = 2100; // ms
  const start = performance.now();

  (function tick(now) {
    const p = Math.min((now - start) / duration, 1);
    const eased = 1 - Math.pow(1 - p, 3); // ease-out cubic
    el.textContent = Math.round(eased * target).toLocaleString();
    if (p < 1) requestAnimationFrame(tick);
  })(start);
}
```

**HTML:**
```html
<!-- data-target = the end number -->
<span class="counter" data-target="4800">0</span>+

<!-- Trigger via IntersectionObserver (see pattern 2) or directly: -->
<script>
  document.querySelectorAll('.counter').forEach(el => {
    new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) { animCounter(el); }
    }, { threshold: 0.5 }).observe(el);
  });
</script>
```

---

## 4. Infinite Marquee / Ticker

Pure CSS — no JS needed at all.

```css
.marquee-wrap {
  overflow: hidden;
  /* optional: fade edges */
  mask-image: linear-gradient(90deg, transparent, black 8%, black 92%, transparent);
}
.marquee-track {
  display: flex;
  width: max-content;
  animation: marquee 28s linear infinite;
}
@keyframes marquee {
  from { transform: translateX(0); }
  to   { transform: translateX(-50%); }
}
/* Pause on hover (optional) */
.marquee-wrap:hover .marquee-track { animation-play-state: paused; }
```

**HTML — duplicate items for seamless loop:**
```html
<div class="marquee-wrap">
  <div class="marquee-track">
    <!-- Original set -->
    <div class="m-item">Item A</div>
    <div class="m-item">Item B</div>
    <div class="m-item">Item C</div>
    <!-- Exact duplicate for seamless loop -->
    <div class="m-item">Item A</div>
    <div class="m-item">Item B</div>
    <div class="m-item">Item C</div>
  </div>
</div>
```

**Speed control:** Lower the `28s` value for faster scroll.

---

## 5. Custom Cursor + Ring Follower

The classic two-element cursor: a dot that tracks exactly, and a ring that lags behind (lerp for smoothness).

```js
const dot  = document.getElementById('cur-dot');
const ring = document.getElementById('cur-ring');
let mx = 0, my = 0, rx = 0, ry = 0;

// Dot follows exactly
document.addEventListener('mousemove', e => {
  mx = e.clientX; my = e.clientY;
  dot.style.left = mx + 'px';
  dot.style.top  = my + 'px';
});

// Ring lags (lerp = linear interpolation)
(function loop() {
  rx += (mx - rx) * 0.11;
  ry += (my - ry) * 0.11;
  ring.style.left = rx + 'px';
  ring.style.top  = ry + 'px';
  requestAnimationFrame(loop);
})();

// Scale dot on hover over interactive elements
document.querySelectorAll('a, button, .card').forEach(el => {
  el.addEventListener('mouseenter', () => {
    dot.style.transform  = 'translate(-50%,-50%) scale(.4)';
    ring.style.width     = '50px';
    ring.style.height    = '50px';
    ring.style.borderColor = 'rgba(255,255,255,.3)';
  });
  el.addEventListener('mouseleave', () => {
    dot.style.transform  = 'translate(-50%,-50%)';
    ring.style.width     = '34px';
    ring.style.height    = '34px';
    ring.style.borderColor = 'rgba(99,102,241,.5)';
  });
});
```

```css
/* Hide default cursor on desktop */
body { cursor: none; }
@media (pointer: coarse) { body { cursor: auto; } } /* restore on touch */

#cur-dot, #cur-ring {
  position: fixed;
  border-radius: 50%;
  pointer-events: none;
  z-index: 9999;
  transform: translate(-50%, -50%);
}
#cur-dot {
  width: 7px; height: 7px;
  background: #6366f1;
  transition: transform .15s;
}
#cur-ring {
  width: 34px; height: 34px;
  border: 1.5px solid rgba(99,102,241,.5);
  transition: width .3s, height .3s, border-color .3s;
}
/* Hide on touch devices */
@media (pointer: coarse) { #cur-dot, #cur-ring { display: none; } }
```

```html
<div id="cur-dot"></div>
<div id="cur-ring"></div>
```

---

## 6. Magnetic Button

Button "pulls" toward the cursor when hovered. Elastic snap back on leave.

```js
document.querySelectorAll('.magnetic').forEach(btn => {
  btn.addEventListener('mousemove', e => {
    const r = btn.getBoundingClientRect();
    const dx = (e.clientX - r.left - r.width  / 2) * 0.28;
    const dy = (e.clientY - r.top  - r.height / 2) * 0.28;
    btn.style.transform = `translate(${dx}px, ${dy}px)`;
  });

  btn.addEventListener('mouseleave', () => {
    // Elastic snap back via CSS transition
    btn.style.transition = 'transform .5s cubic-bezier(.34,1.56,.64,1)';
    btn.style.transform  = '';
    // Remove transition override after snap completes
    setTimeout(() => btn.style.transition = '', 520);
  });
});
```

**Note:** The magnetic pull uses `transform: translate()` inline — make sure the button's CSS `transition` only covers other properties (background, box-shadow, etc.) and not `transform`, otherwise it'll fight with the mousemove handler.

---

## 7. Parallax on Scroll

Simple parallax that moves elements at different speeds as the user scrolls.

```js
// Mouse parallax (moves with cursor — good for hero background grids)
const grid = document.querySelector('.hero-bg-grid');
window.addEventListener('mousemove', e => {
  const x = (e.clientX / window.innerWidth  - 0.5) * 14;
  const y = (e.clientY / window.innerHeight - 0.5) * 9;
  grid.style.transform = `translate(${x}px, ${y}px)`;
}, { passive: true });

// Scroll parallax (element moves slower than scroll — good for hero visuals)
const heroVisual = document.querySelector('.hero-visual');
window.addEventListener('scroll', () => {
  heroVisual.style.transform =
    `translateY(calc(-50% + ${window.scrollY * 0.15}px))`;
}, { passive: true });
```

**Always use `{ passive: true }` on scroll/mousemove handlers** — tells the browser the handler won't call `preventDefault()`, enabling scroll optimization.

---

## 8. Sticky Nav with Scroll Blur

Nav gains frosted glass + border as soon as user scrolls past 60px.

```js
window.addEventListener('scroll', () => {
  document.querySelector('nav').classList.toggle('scrolled', window.scrollY > 60);
}, { passive: true });
```

```css
nav {
  position: fixed; top: 0; left: 0; right: 0;
  transition: background .35s, backdrop-filter .35s, border-color .35s;
  border-bottom: 1px solid transparent;
}
nav.scrolled {
  background: rgba(7, 13, 26, 0.88);
  backdrop-filter: blur(18px) saturate(180%);
  border-color: rgba(99, 102, 241, 0.09);
}
```

---

## 9. Reduced Motion — Always Include

```css
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}
```

For JS-driven animations (counters, parallax, cursor), wrap in a guard:
```js
const noMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
if (!noMotion) {
  // kick off counters, parallax, cursor animations
}
```

---

## 10. Anchor Smooth Scroll

Overrides the default jump-to with smooth scrolling. No library needed.

```js
document.querySelectorAll('a[href^="#"]').forEach(a => {
  a.addEventListener('click', e => {
    const target = document.querySelector(a.getAttribute('href'));
    if (target) {
      e.preventDefault();
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  });
});
```

---

## Full JS Bootstrap Block

Drop this at the bottom of every Cowork HTML build. It wires up all the patterns above in one block:

```html
<script>
// ── CURSOR ────────────────────────────────────
const dot = document.getElementById('cur-dot');
const ring = document.getElementById('cur-ring');
let mx=0,my=0,rx=0,ry=0;
if (dot && ring) {
  document.addEventListener('mousemove', e => {
    mx=e.clientX; my=e.clientY;
    dot.style.left=mx+'px'; dot.style.top=my+'px';
  });
  (function loop(){ rx+=(mx-rx)*.11; ry+=(my-ry)*.11; ring.style.left=rx+'px'; ring.style.top=ry+'px'; requestAnimationFrame(loop); })();
  document.querySelectorAll('a,button,.card').forEach(el=>{
    el.addEventListener('mouseenter',()=>{ dot.style.transform='translate(-50%,-50%) scale(.4)'; ring.style.width='50px'; ring.style.height='50px'; });
    el.addEventListener('mouseleave',()=>{ dot.style.transform='translate(-50%,-50%)'; ring.style.width='34px'; ring.style.height='34px'; });
  });
}

// ── STICKY NAV ────────────────────────────────
window.addEventListener('scroll',()=>{
  document.querySelector('nav')?.classList.toggle('scrolled', window.scrollY>60);
},{passive:true});

// ── SCROLL REVEAL ─────────────────────────────
const io = new IntersectionObserver(entries=>{
  entries.forEach(e=>{
    if(!e.isIntersecting) return;
    e.target.classList.add('vis');
    e.target.querySelectorAll('.counter').forEach(animCounter);
    io.unobserve(e.target);
  });
},{threshold:0.1});
document.querySelectorAll('.reveal,.reveal-x,.stagger').forEach(el=>io.observe(el));

// ── COUNTER ───────────────────────────────────
function animCounter(el){
  const target=+el.dataset.target, dur=2100, t0=performance.now();
  (function tick(now){
    const p=Math.min((now-t0)/dur,1);
    el.textContent=Math.round((1-Math.pow(1-p,3))*target).toLocaleString();
    if(p<1) requestAnimationFrame(tick);
  })(t0);
}

// ── MAGNETIC BUTTONS ──────────────────────────
document.querySelectorAll('.magnetic').forEach(btn=>{
  btn.addEventListener('mousemove',e=>{
    const r=btn.getBoundingClientRect();
    btn.style.transform=`translate(${(e.clientX-r.left-r.width/2)*.28}px,${(e.clientY-r.top-r.height/2)*.28}px)`;
  });
  btn.addEventListener('mouseleave',()=>{
    btn.style.transition='transform .5s cubic-bezier(.34,1.56,.64,1)';
    btn.style.transform='';
    setTimeout(()=>btn.style.transition='',520);
  });
});

// ── HERO GRID PARALLAX (mouse) ─────────────────
const hgrid = document.querySelector('.h-grid');
if (hgrid) {
  window.addEventListener('mousemove',e=>{
    hgrid.style.transform=`translate(${(e.clientX/innerWidth-.5)*14}px,${(e.clientY/innerHeight-.5)*9}px)`;
  },{passive:true});
}

// ── ANCHOR SMOOTH SCROLL ──────────────────────
document.querySelectorAll('a[href^="#"]').forEach(a=>{
  a.addEventListener('click',e=>{
    const t=document.querySelector(a.getAttribute('href'));
    if(t){e.preventDefault();t.scrollIntoView({behavior:'smooth',block:'start'});}
  });
});
</script>
```
