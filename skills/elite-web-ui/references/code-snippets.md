# Code Snippets — Elite Web UI

20 complete, copy-paste-ready implementations. Every pattern is GPU-optimized and production-tested.

---

## 1. Magnetic Button

Button is attracted to the cursor — premium interaction design.

```html
<button class="magnetic-btn">
  <span>Get Started</span>
</button>
```

```css
.magnetic-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 14px 32px;
  background: #6366f1;
  color: white;
  font-weight: 600;
  border: none;
  border-radius: 100px;
  cursor: pointer;
  position: relative;
  transition: transform 0.1s ease, box-shadow 0.3s ease;
  will-change: transform;
}
.magnetic-btn:hover {
  box-shadow: 0 8px 32px rgba(99,102,241,0.4);
}
```

```js
document.querySelectorAll('.magnetic-btn').forEach(btn => {
  const strength = 0.4; // 0 = no effect, 1 = full follow

  btn.addEventListener('mousemove', (e) => {
    const rect = btn.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    const dx = (e.clientX - cx) * strength;
    const dy = (e.clientY - cy) * strength;
    btn.style.transform = `translate(${dx}px, ${dy}px)`;
  });

  btn.addEventListener('mouseleave', () => {
    btn.style.transform = 'translate(0, 0)';
    btn.style.transition = 'transform 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275)';
    setTimeout(() => {
      btn.style.transition = 'transform 0.1s ease, box-shadow 0.3s ease';
    }, 500);
  });
});
```

---

## 2. Custom Cursor + Follower

Replaces default cursor with a dot + slow-following circle.

```html
<div class="cursor-dot"></div>
<div class="cursor-ring"></div>
```

```css
.cursor-dot, .cursor-ring {
  position: fixed;
  pointer-events: none;
  z-index: 99999;
  border-radius: 50%;
  transform: translate(-50%, -50%);
  transition: opacity 0.3s ease;
}
.cursor-dot {
  width: 6px; height: 6px;
  background: white;
}
.cursor-ring {
  width: 36px; height: 36px;
  border: 1.5px solid rgba(255,255,255,0.5);
  transition: width 0.3s ease, height 0.3s ease, border-color 0.3s ease;
}
/* Expand on hover over links/buttons */
a:hover ~ .cursor-ring,
button:hover ~ .cursor-ring {
  width: 60px; height: 60px;
  border-color: rgba(99,102,241,0.8);
}
/* Hide default cursor on body */
body { cursor: none; }
body * { cursor: none; }
```

```js
const dot = document.querySelector('.cursor-dot');
const ring = document.querySelector('.cursor-ring');
let ringX = 0, ringY = 0;
let cursorX = 0, cursorY = 0;

document.addEventListener('mousemove', (e) => {
  cursorX = e.clientX;
  cursorY = e.clientY;
  dot.style.left = cursorX + 'px';
  dot.style.top = cursorY + 'px';
});

// Smooth lag for ring
function animateCursor() {
  ringX += (cursorX - ringX) * 0.12;
  ringY += (cursorY - ringY) * 0.12;
  ring.style.left = ringX + 'px';
  ring.style.top = ringY + 'px';
  requestAnimationFrame(animateCursor);
}
animateCursor();

// Expand on interactive elements
document.querySelectorAll('a, button, [data-cursor="expand"]').forEach(el => {
  el.addEventListener('mouseenter', () => {
    ring.style.width = '60px';
    ring.style.height = '60px';
    ring.style.borderColor = 'rgba(99,102,241,0.8)';
  });
  el.addEventListener('mouseleave', () => {
    ring.style.width = '36px';
    ring.style.height = '36px';
    ring.style.borderColor = 'rgba(255,255,255,0.5)';
  });
});
```

---

## 3. Animated Counter / Number Rollup

```html
<span class="counter" data-target="2847" data-suffix="+">0</span>
```

```js
function initCounters() {
  const counters = document.querySelectorAll('.counter');

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;

      const el = entry.target;
      const target = parseInt(el.dataset.target);
      const suffix = el.dataset.suffix || '';
      const duration = 1800; // ms
      const startTime = performance.now();

      function update(currentTime) {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);
        // Ease out cubic
        const eased = 1 - Math.pow(1 - progress, 3);
        const value = Math.floor(eased * target);
        el.textContent = value.toLocaleString() + suffix;

        if (progress < 1) requestAnimationFrame(update);
      }

      requestAnimationFrame(update);
      observer.unobserve(el);
    });
  }, { threshold: 0.5 });

  counters.forEach(c => observer.observe(c));
}
initCounters();
```

---

## 4. Infinite Marquee / Ticker

Auto-scrolling text/logo strip. Pure CSS — no JS.

```html
<div class="marquee">
  <div class="marquee__track">
    <span>Design</span>
    <span>·</span>
    <span>Development</span>
    <span>·</span>
    <span>Animation</span>
    <span>·</span>
    <span>3D Interfaces</span>
    <span>·</span>
    <!-- Duplicate for seamless loop -->
    <span>Design</span>
    <span>·</span>
    <span>Development</span>
    <span>·</span>
    <span>Animation</span>
    <span>·</span>
    <span>3D Interfaces</span>
    <span>·</span>
  </div>
</div>
```

```css
.marquee {
  overflow: hidden;
  white-space: nowrap;
  border-top: 1px solid rgba(255,255,255,0.08);
  border-bottom: 1px solid rgba(255,255,255,0.08);
  padding: 16px 0;
}
.marquee__track {
  display: inline-flex;
  gap: 32px;
  align-items: center;
  animation: marquee-scroll 20s linear infinite;
}
.marquee__track span {
  font-size: 1.1rem;
  font-weight: 500;
  letter-spacing: 0.04em;
  color: rgba(255,255,255,0.4);
  text-transform: uppercase;
}
.marquee:hover .marquee__track {
  animation-play-state: paused;
}
@keyframes marquee-scroll {
  from { transform: translateX(0); }
  to   { transform: translateX(-50%); } /* -50% because content is doubled */
}
```

---

## 5. Scroll-Triggered Parallax Hero (Three-Layer)

```html
<section class="parallax-hero" style="position:relative; overflow:hidden; height:100vh;">
  <!-- Background (slowest) -->
  <div class="p-layer" data-speed="0.1" style="position:absolute; inset:0; z-index:0;">
    <div class="mesh-gradient" style="width:100%; height:100%;"></div>
  </div>
  <!-- Midground (normal) -->
  <div style="position:relative; z-index:1; display:flex; align-items:center; height:100%;">
    <div class="container">
      <h1 class="hero-title">Build Without Limits</h1>
    </div>
  </div>
  <!-- Foreground (fastest — creates depth) -->
  <div class="p-layer" data-speed="-0.2" style="position:absolute; top:20%; right:10%; z-index:2;">
    <div class="floating-badge">New in 2026</div>
  </div>
</section>
```

```js
// Requires GSAP + ScrollTrigger
const layers = document.querySelectorAll('.p-layer');
layers.forEach(layer => {
  const speed = parseFloat(layer.dataset.speed);
  gsap.to(layer, {
    y: () => window.innerHeight * speed * -1,
    ease: 'none',
    scrollTrigger: {
      trigger: layer.closest('section'),
      start: 'top top',
      end: 'bottom top',
      scrub: true
    }
  });
});
```

---

## 6. Staggered Card Grid Reveal

```js
// Requires GSAP + ScrollTrigger
// Add class "stagger-item" to every card in your grid
gsap.set('.stagger-item', { opacity: 0, y: 50 });

ScrollTrigger.batch('.stagger-item', {
  onEnter: batch => gsap.to(batch, {
    opacity: 1,
    y: 0,
    stagger: 0.08,
    duration: 0.7,
    ease: 'power3.out',
    overwrite: true
  }),
  start: 'top 88%',
  once: true
});
```

```css
/* Prevent flash of unstyled content */
.stagger-item { opacity: 0; }
```

---

## 7. Sticky Navigation with Scroll Blur

Nav appears transparent at top, blurs in on scroll.

```html
<nav class="site-nav" id="main-nav">
  <div class="container" style="display:flex; justify-content:space-between; align-items:center;">
    <div class="logo">JARVIS</div>
    <div class="nav-links">...</div>
  </div>
</nav>
```

```css
.site-nav {
  position: fixed;
  top: 0; left: 0; right: 0;
  z-index: 100;
  padding: 20px 0;
  transition: padding 0.3s ease, background 0.3s ease, backdrop-filter 0.3s ease;
}
.site-nav.scrolled {
  padding: 12px 0;
  background: rgba(8, 8, 8, 0.75);
  backdrop-filter: blur(20px) saturate(180%);
  -webkit-backdrop-filter: blur(20px) saturate(180%);
  border-bottom: 1px solid rgba(255,255,255,0.06);
}
```

```js
const nav = document.getElementById('main-nav');
window.addEventListener('scroll', () => {
  nav.classList.toggle('scrolled', window.scrollY > 40);
}, { passive: true });
```

---

## 8. Text Scramble Effect

Text "decodes" to reveal the real content. Hacker/tech aesthetic.

```js
class TextScramble {
  constructor(el) {
    this.el = el;
    this.chars = '!<>-_\\/[]{}—=+*^?#________';
    this.update = this.update.bind(this);
  }

  setText(newText) {
    const length = Math.max(this.el.textContent.length, newText.length);
    const promise = new Promise(resolve => this.resolve = resolve);
    this.queue = [];
    for (let i = 0; i < length; i++) {
      const from = this.el.textContent[i] || '';
      const to = newText[i] || '';
      const start = Math.floor(Math.random() * 20);
      const end = start + Math.floor(Math.random() * 20);
      this.queue.push({ from, to, start, end });
    }
    cancelAnimationFrame(this.frameRequest);
    this.frame = 0;
    this.update();
    return promise;
  }

  update() {
    let output = '', complete = 0;
    for (let i = 0, n = this.queue.length; i < n; i++) {
      const { from, to, start, end } = this.queue[i];
      let char;
      if (this.frame >= end) { complete++; char = to; }
      else if (this.frame >= start) {
        if (!this.queue[i].char || Math.random() < 0.28) {
          this.queue[i].char = this.chars[Math.floor(Math.random() * this.chars.length)];
        }
        char = `<span style="color:rgba(99,102,241,0.7)">${this.queue[i].char}</span>`;
      } else { char = from; }
      output += char;
    }
    this.el.innerHTML = output;
    if (complete === this.queue.length) this.resolve();
    else { this.frameRequest = requestAnimationFrame(this.update); this.frame++; }
  }
}

// Usage
const el = document.querySelector('.scramble-text');
const fx = new TextScramble(el);
const phrases = ['Build the future.', 'Ship what matters.', 'Move fast.'];
let counter = 0;
const next = () => {
  fx.setText(phrases[counter]).then(() => {
    setTimeout(next, 2000);
  });
  counter = (counter + 1) % phrases.length;
};
next();
```

---

## 9. Gradient Hover Card

Card reveals a gradient glow on hover following the cursor.

```html
<div class="glow-card">
  <div class="glow-card__content">
    <h3>Feature Title</h3>
    <p>Description text here.</p>
  </div>
</div>
```

```css
.glow-card {
  position: relative;
  background: #111;
  border: 1px solid rgba(255,255,255,0.08);
  border-radius: 16px;
  overflow: hidden;
  padding: 28px;
  cursor: default;
}
.glow-card::before {
  content: '';
  position: absolute;
  inset: 0;
  background: radial-gradient(
    400px circle at var(--mouse-x, 50%) var(--mouse-y, 50%),
    rgba(99,102,241,0.12),
    transparent 60%
  );
  opacity: 0;
  transition: opacity 0.3s ease;
}
.glow-card:hover::before { opacity: 1; }
.glow-card__content { position: relative; z-index: 1; }
```

```js
document.querySelectorAll('.glow-card').forEach(card => {
  card.addEventListener('mousemove', (e) => {
    const rect = card.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    card.style.setProperty('--mouse-x', x + '%');
    card.style.setProperty('--mouse-y', y + '%');
  });
});
```

---

## 10. Smooth Accordion / FAQ

```html
<div class="accordion-item">
  <button class="accordion-trigger" aria-expanded="false">
    <span>What is this?</span>
    <svg class="accordion-icon" width="16" height="16" viewBox="0 0 16 16">
      <path d="M3 6l5 5 5-5" stroke="currentColor" stroke-width="1.5" fill="none"/>
    </svg>
  </button>
  <div class="accordion-body">
    <div class="accordion-content">
      <p>Answer text goes here.</p>
    </div>
  </div>
</div>
```

```css
.accordion-trigger {
  display: flex; justify-content: space-between; align-items: center;
  width: 100%; padding: 20px 0;
  background: none; border: none;
  color: white; font-size: 1rem; font-weight: 500;
  cursor: pointer; text-align: left;
  border-bottom: 1px solid rgba(255,255,255,0.08);
}
.accordion-icon {
  transition: transform 0.3s cubic-bezier(0.16, 1, 0.3, 1);
  flex-shrink: 0;
}
.accordion-trigger[aria-expanded="true"] .accordion-icon {
  transform: rotate(180deg);
}
.accordion-body {
  display: grid;
  grid-template-rows: 0fr;
  transition: grid-template-rows 0.4s cubic-bezier(0.16, 1, 0.3, 1);
}
.accordion-trigger[aria-expanded="true"] ~ .accordion-body {
  grid-template-rows: 1fr;
}
.accordion-content { overflow: hidden; padding-bottom: 0; }
.accordion-trigger[aria-expanded="true"] ~ .accordion-body .accordion-content {
  padding-bottom: 20px;
}
```

```js
document.querySelectorAll('.accordion-trigger').forEach(trigger => {
  trigger.addEventListener('click', () => {
    const isOpen = trigger.getAttribute('aria-expanded') === 'true';
    // Close all
    document.querySelectorAll('.accordion-trigger').forEach(t =>
      t.setAttribute('aria-expanded', 'false')
    );
    // Open clicked (if it was closed)
    if (!isOpen) trigger.setAttribute('aria-expanded', 'true');
  });
});
```

---

## 11. Loading / Preloader Animation

```html
<div class="preloader" id="preloader">
  <div class="preloader__inner">
    <div class="preloader__bar"></div>
    <span class="preloader__label">Loading</span>
  </div>
</div>
```

```css
.preloader {
  position: fixed; inset: 0; z-index: 10000;
  background: #080808;
  display: flex; align-items: center; justify-content: center;
  transition: opacity 0.6s ease, visibility 0.6s ease;
}
.preloader.hidden { opacity: 0; visibility: hidden; }
.preloader__inner { text-align: center; }
.preloader__bar {
  width: 200px; height: 1px;
  background: rgba(255,255,255,0.1);
  border-radius: 1px; overflow: hidden; margin-bottom: 16px;
}
.preloader__bar::after {
  content: '';
  display: block; height: 100%;
  background: linear-gradient(90deg, #6366f1, #a855f7);
  animation: preloader-fill 1.5s cubic-bezier(0.4, 0, 0.2, 1) forwards;
}
.preloader__label {
  font-size: 0.75rem; letter-spacing: 0.2em;
  text-transform: uppercase; color: rgba(255,255,255,0.3);
}
@keyframes preloader-fill {
  from { width: 0%; }
  to   { width: 100%; }
}
```

```js
window.addEventListener('load', () => {
  setTimeout(() => {
    document.getElementById('preloader').classList.add('hidden');
  }, 1800); // Match animation duration
});
```

---

## 12. Reveal on Scroll (Lightweight, No GSAP)

For projects without GSAP. Pure IntersectionObserver.

```css
.reveal {
  opacity: 0;
  transform: translateY(40px);
  transition: opacity 0.7s cubic-bezier(0.16, 1, 0.3, 1),
              transform 0.7s cubic-bezier(0.16, 1, 0.3, 1);
}
.reveal.visible {
  opacity: 1;
  transform: translateY(0);
}
/* Stagger delay via CSS */
.reveal:nth-child(2) { transition-delay: 0.1s; }
.reveal:nth-child(3) { transition-delay: 0.2s; }
.reveal:nth-child(4) { transition-delay: 0.3s; }
.reveal:nth-child(5) { transition-delay: 0.4s; }
```

```js
const revealObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add('visible');
      revealObserver.unobserve(entry.target); // once only
    }
  });
}, { threshold: 0.1, rootMargin: '0px 0px -60px 0px' });

document.querySelectorAll('.reveal').forEach(el => revealObserver.observe(el));
```

---

## 13. Floating Label Form Input

```html
<div class="field">
  <input type="email" id="email" class="field__input" placeholder=" " required>
  <label for="email" class="field__label">Email address</label>
</div>
```

```css
.field { position: relative; }
.field__input {
  width: 100%; padding: 20px 16px 8px;
  background: rgba(255,255,255,0.04);
  border: 1px solid rgba(255,255,255,0.1);
  border-radius: 10px; color: white;
  font-size: 1rem; outline: none;
  transition: border-color 0.2s ease;
  box-sizing: border-box;
}
.field__input:focus {
  border-color: rgba(99,102,241,0.6);
}
.field__label {
  position: absolute; left: 16px; top: 14px;
  color: rgba(255,255,255,0.4);
  font-size: 1rem; pointer-events: none;
  transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
  transform-origin: left;
}
/* Float up when input has value or is focused */
.field__input:not(:placeholder-shown) ~ .field__label,
.field__input:focus ~ .field__label {
  top: 6px;
  font-size: 0.7rem;
  color: rgba(99,102,241,0.8);
  transform: scale(0.95);
}
```

---

## 14. Tooltip Component

```html
<span class="tooltip-wrap">
  Hover me
  <span class="tooltip" data-tip="This is a tooltip">ⓘ</span>
</span>
```

```css
[data-tip] {
  position: relative;
  cursor: help;
}
[data-tip]::before {
  content: attr(data-tip);
  position: absolute;
  bottom: calc(100% + 8px);
  left: 50%;
  transform: translateX(-50%) translateY(4px);
  padding: 6px 10px;
  background: #1a1a1a;
  border: 1px solid rgba(255,255,255,0.1);
  border-radius: 6px;
  font-size: 0.75rem;
  white-space: nowrap;
  color: rgba(255,255,255,0.85);
  pointer-events: none;
  opacity: 0;
  transition: opacity 0.2s ease, transform 0.2s ease;
  z-index: 100;
}
[data-tip]:hover::before {
  opacity: 1;
  transform: translateX(-50%) translateY(0);
}
```

---

## 15. Animated Tab Switcher

Active indicator slides between tabs.

```html
<div class="tabs" role="tablist">
  <button class="tab active" data-tab="0" role="tab">Overview</button>
  <button class="tab" data-tab="1" role="tab">Features</button>
  <button class="tab" data-tab="2" role="tab">Pricing</button>
  <div class="tab-indicator"></div>
</div>
```

```css
.tabs {
  display: inline-flex;
  position: relative;
  background: rgba(255,255,255,0.06);
  border-radius: 10px;
  padding: 4px;
  gap: 2px;
}
.tab {
  position: relative;
  padding: 8px 18px;
  background: none; border: none;
  color: rgba(255,255,255,0.5);
  font-size: 0.875rem; font-weight: 500;
  cursor: pointer; border-radius: 7px;
  transition: color 0.2s ease; z-index: 1;
}
.tab.active { color: white; }
.tab-indicator {
  position: absolute;
  background: rgba(255,255,255,0.1);
  border-radius: 7px;
  transition: left 0.3s cubic-bezier(0.16, 1, 0.3, 1),
              width 0.3s cubic-bezier(0.16, 1, 0.3, 1),
              top 0.3s ease, height 0.3s ease;
  z-index: 0;
}
```

```js
function initTabs() {
  const tabGroup = document.querySelector('.tabs');
  const tabs = tabGroup.querySelectorAll('.tab');
  const indicator = tabGroup.querySelector('.tab-indicator');

  function moveIndicator(tab) {
    indicator.style.left = tab.offsetLeft + 'px';
    indicator.style.top = tab.offsetTop + 'px';
    indicator.style.width = tab.offsetWidth + 'px';
    indicator.style.height = tab.offsetHeight + 'px';
  }

  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      tabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      moveIndicator(tab);
    });
  });

  // Init position
  const active = tabGroup.querySelector('.tab.active');
  if (active) moveIndicator(active);
}
initTabs();
```

---

## 16. Scroll Snapping Full-Screen Sections

```css
.snap-container {
  height: 100vh;
  overflow-y: scroll;
  scroll-snap-type: y mandatory;
  scroll-behavior: smooth;
}
.snap-section {
  height: 100vh;
  scroll-snap-align: start;
  scroll-snap-stop: always; /* Don't skip sections on fast scroll */
  display: flex;
  align-items: center;
  justify-content: center;
}
```

---

## 17. Skeleton Loading State

```css
.skeleton {
  background: linear-gradient(
    90deg,
    rgba(255,255,255,0.05) 25%,
    rgba(255,255,255,0.1) 50%,
    rgba(255,255,255,0.05) 75%
  );
  background-size: 200% 100%;
  animation: skeleton-shimmer 1.5s infinite;
  border-radius: 6px;
}
.skeleton-text { height: 1rem; margin-bottom: 8px; }
.skeleton-text.wide { width: 80%; }
.skeleton-text.medium { width: 60%; }
.skeleton-text.narrow { width: 40%; }
.skeleton-avatar { width: 48px; height: 48px; border-radius: 50%; }
.skeleton-image { width: 100%; aspect-ratio: 16/9; }

@keyframes skeleton-shimmer {
  from { background-position: 200% 0; }
  to   { background-position: -200% 0; }
}
```

---

## 18. Notification / Toast

```js
function showToast(message, type = 'default', duration = 3000) {
  const toast = document.createElement('div');
  toast.className = `toast toast--${type}`;
  toast.innerHTML = `<span>${message}</span>`;

  const container = document.getElementById('toast-container') || (() => {
    const c = document.createElement('div');
    c.id = 'toast-container';
    c.style.cssText = 'position:fixed;bottom:24px;right:24px;z-index:9999;display:flex;flex-direction:column;gap:8px;';
    document.body.appendChild(c);
    return c;
  })();

  container.appendChild(toast);
  requestAnimationFrame(() => toast.classList.add('visible'));

  setTimeout(() => {
    toast.classList.remove('visible');
    setTimeout(() => toast.remove(), 400);
  }, duration);
}
```

```css
.toast {
  padding: 12px 18px;
  background: #1a1a1a;
  border: 1px solid rgba(255,255,255,0.1);
  border-radius: 10px;
  color: white;
  font-size: 0.875rem;
  box-shadow: 0 8px 32px rgba(0,0,0,0.4);
  transform: translateX(20px); opacity: 0;
  transition: transform 0.4s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.4s ease;
  max-width: 320px;
}
.toast.visible { transform: translateX(0); opacity: 1; }
.toast--success { border-color: rgba(16,185,129,0.3); }
.toast--error   { border-color: rgba(244,63,94,0.3); }
```

---

## 19. Mobile-First Responsive Utility Classes

```css
/* Container with fluid padding */
.container {
  width: 100%;
  max-width: 1280px;
  margin: 0 auto;
  padding: 0 clamp(16px, 5vw, 80px);
}

/* Responsive grid */
.auto-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(min(280px, 100%), 1fr));
  gap: clamp(16px, 3vw, 32px);
}

/* Stack on mobile, side-by-side on desktop */
.split {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(min(400px, 100%), 1fr));
  gap: clamp(32px, 5vw, 80px);
  align-items: center;
}

/* Typography responsiveness */
.text-balance { text-wrap: balance; }
.text-pretty { text-wrap: pretty; }
```

---

## 20. Full Page Elite Template (Minimal Bones)

The fastest way to start a new premium page — includes all structural pieces.

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Page Title</title>
  <!-- Fonts -->
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link href="https://fonts.googleapis.com/css2?family=Syne:wght@400..800&family=Inter:wght@300..500&display=swap" rel="stylesheet">
  <!-- GSAP -->
  <script src="https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.5/gsap.min.js"></script>
  <script src="https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.5/ScrollTrigger.min.js"></script>
  <style>
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    @media (prefers-reduced-motion: reduce) {
      *, *::before, *::after {
        animation-duration: 0.01ms !important;
        transition-duration: 0.01ms !important;
      }
    }
    :root {
      --bg: #080808; --surface: #111;
      --accent: #6366f1; --accent-glow: rgba(99,102,241,0.25);
      --text: rgba(255,255,255,0.92); --text-muted: rgba(255,255,255,0.5);
      --border: rgba(255,255,255,0.08);
    }
    html { scroll-behavior: smooth; }
    body {
      background: var(--bg); color: var(--text);
      font-family: 'Inter', sans-serif; line-height: 1.6;
      overflow-x: hidden;
    }
    /* Grain */
    body::after {
      content: '';
      position: fixed; inset: -50%; width: 200%; height: 200%;
      background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E");
      opacity: 0.04; pointer-events: none; z-index: 9999;
      animation: grain-shift 0.5s steps(2) infinite;
    }
    @keyframes grain-shift {
      0%   { transform: translate(0,0); }
      25%  { transform: translate(-3%,-5%); }
      50%  { transform: translate(5%,3%); }
      75%  { transform: translate(-5%,7%); }
    }
  </style>
</head>
<body>
  <!-- CONTENT HERE -->
  <script>
    gsap.registerPlugin(ScrollTrigger);
    // Animations here
  </script>
</body>
</html>
```
