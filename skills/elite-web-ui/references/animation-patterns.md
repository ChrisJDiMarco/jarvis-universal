# Animation Patterns — Elite Web UI

Complete, working animation implementations for 2026-level interfaces.

---

## 1. GSAP + ScrollTrigger Setup

### CDN Load Order (HTML)
```html
<script src="https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.5/gsap.min.js"></script>
<script src="https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.5/ScrollTrigger.min.js"></script>
<script>
  gsap.registerPlugin(ScrollTrigger);
</script>
```

### Lenis Smooth Scroll + GSAP Integration
Lenis replaces browser scroll with a physics-based smooth version. Always integrate with GSAP ticker so ScrollTrigger stays synced.

```js
// Initialize Lenis
const lenis = new Lenis({
  duration: 1.2,
  easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
  direction: 'vertical',
  smooth: true,
});

// Connect to GSAP ticker — critical: without this, ScrollTrigger breaks
gsap.ticker.add((time) => {
  lenis.raf(time * 1000);
});
gsap.ticker.lagSmoothing(0);

// Pause/resume for modals or overlays
// lenis.stop() / lenis.start()
```

---

## 2. Scroll-Triggered Entrance Animations

### Staggered Card/Item Reveal
Elements start invisible, stagger in as the container enters view.

```js
// Batch — more performant than individual ScrollTriggers
ScrollTrigger.batch('.reveal-item', {
  onEnter: (elements) => {
    gsap.fromTo(elements,
      { opacity: 0, y: 40 },
      {
        opacity: 1,
        y: 0,
        duration: 0.8,
        stagger: 0.12,
        ease: 'power3.out',
        overwrite: true
      }
    );
  },
  once: true // Only animate in, don't reset on scroll back
});
```

### Hero Entrance (on page load, not scroll)
```js
const heroTl = gsap.timeline({ defaults: { ease: 'power4.out' } });
heroTl
  .fromTo('.hero-label',    { opacity: 0, y: 20 }, { opacity: 1, y: 0, duration: 0.6 })
  .fromTo('.hero-headline', { opacity: 0, y: 50 }, { opacity: 1, y: 0, duration: 0.9 }, '-=0.3')
  .fromTo('.hero-sub',      { opacity: 0, y: 30 }, { opacity: 1, y: 0, duration: 0.7 }, '-=0.5')
  .fromTo('.hero-cta',      { opacity: 0, scale: 0.9 }, { opacity: 1, scale: 1, duration: 0.5 }, '-=0.4');
```

---

## 3. Text Character Reveal (No SplitText Plugin)

This pattern manually splits text into spans — no paid GSAP plugin needed.

```js
function splitAndReveal(selector, trigger) {
  const elements = document.querySelectorAll(selector);
  elements.forEach(el => {
    const text = el.textContent;
    el.textContent = '';
    el.style.overflow = 'hidden';

    const words = text.split(' ');
    words.forEach((word, wi) => {
      const wordSpan = document.createElement('span');
      wordSpan.style.display = 'inline-block';
      wordSpan.style.overflow = 'hidden';

      const innerSpan = document.createElement('span');
      innerSpan.textContent = word + (wi < words.length - 1 ? '\u00A0' : '');
      innerSpan.style.display = 'inline-block';
      innerSpan.style.transform = 'translateY(110%)';

      wordSpan.appendChild(innerSpan);
      el.appendChild(wordSpan);
    });

    const spans = el.querySelectorAll('span > span');
    gsap.to(spans, {
      y: '0%',
      duration: 0.8,
      stagger: 0.05,
      ease: 'power4.out',
      scrollTrigger: {
        trigger: trigger || el,
        start: 'top 80%',
        once: true
      }
    });
  });
}

// Usage
splitAndReveal('.reveal-headline', '.hero-section');
splitAndReveal('.reveal-subhead');
```

---

## 4. Parallax Depth Layers

```js
// Multiple elements moving at different scroll speeds
gsap.utils.toArray('.parallax').forEach(el => {
  const speed = el.dataset.speed || 0.3; // data-speed="0.5" in HTML
  gsap.to(el, {
    y: () => -(window.innerHeight * speed),
    ease: 'none',
    scrollTrigger: {
      trigger: el.closest('section'),
      start: 'top bottom',
      end: 'bottom top',
      scrub: true // scrub: true = perfectly tied to scroll position
    }
  });
});
```

HTML usage:
```html
<div class="hero-section">
  <!-- Background layer: slow (0.1x) -->
  <div class="parallax" data-speed="0.1" style="position:absolute; inset:0; z-index:0;">
    <!-- grain, gradient, or Three.js canvas -->
  </div>
  <!-- Midground: normal scroll -->
  <div class="hero-content" style="position:relative; z-index:1;">
    <h1>Headline</h1>
  </div>
  <!-- Foreground: fast (1.2x creates depth illusion) -->
  <div class="parallax" data-speed="-0.15" style="position:absolute; z-index:2;">
    <!-- floating badge or decorative element -->
  </div>
</div>
```

---

## 5. Pinned Horizontal Scroll Section

Scroll vertically, content moves horizontally — cinematic storytelling pattern.

```js
const horizontalSection = document.querySelector('.horizontal-scroll');
const panels = horizontalSection.querySelectorAll('.panel');
const totalWidth = panels.length * 100; // vw

gsap.to(panels, {
  xPercent: -100 * (panels.length - 1),
  ease: 'none',
  scrollTrigger: {
    trigger: horizontalSection,
    pin: true,
    scrub: 1,
    snap: 1 / (panels.length - 1),
    end: () => '+=' + horizontalSection.offsetWidth * (panels.length - 1)
  }
});
```

CSS:
```css
.horizontal-scroll {
  display: flex;
  width: 400vw; /* panels.length * 100vw */
  height: 100vh;
}
.panel {
  width: 100vw;
  height: 100vh;
  flex-shrink: 0;
}
```

---

## 6. Scroll Progress Indicator

```js
gsap.to('.progress-bar', {
  scaleX: 1,
  ease: 'none',
  scrollTrigger: {
    start: 'top top',
    end: 'bottom bottom',
    scrub: 0
  }
});
```

```css
.progress-bar {
  position: fixed;
  top: 0; left: 0;
  width: 100%; height: 3px;
  background: linear-gradient(90deg, #6366f1, #a855f7, #ec4899);
  transform-origin: left;
  transform: scaleX(0);
  z-index: 100;
}
```

---

## 7. CSS Scroll-Driven Animations (Native 2026)

No JavaScript needed. Pure CSS tied to scroll position. Modern browsers only.

```css
/* Fade + slide in as element enters viewport */
@keyframes fade-in-up {
  from { opacity: 0; transform: translateY(40px); }
  to   { opacity: 1; transform: translateY(0); }
}

.scroll-reveal {
  animation: fade-in-up linear both;
  animation-timeline: view();
  animation-range: entry 0% entry 40%;
}

/* Scale from center as section enters */
@keyframes scale-in {
  from { opacity: 0; transform: scale(0.85); }
  to   { opacity: 1; transform: scale(1); }
}

.scale-reveal {
  animation: scale-in linear both;
  animation-timeline: view();
  animation-range: entry 10% entry 50%;
}

/* Scroll progress bar — pure CSS */
@keyframes progress {
  from { transform: scaleX(0); }
  to   { transform: scaleX(1); }
}
.progress-bar {
  position: fixed; top: 0; left: 0;
  width: 100%; height: 3px;
  background: linear-gradient(90deg, #6366f1, #ec4899);
  transform-origin: left;
  animation: progress linear;
  animation-timeline: scroll(root);
}
```

**Note**: Check caniuse.com for `animation-timeline` support. Pair with GSAP fallback for full coverage.

---

## 8. View Transitions API (Page Transitions)

Native browser API for smooth route transitions. No library needed.

```js
// Wrap any DOM change in startViewTransition
async function navigateTo(url) {
  if (!document.startViewTransition) {
    // Fallback for unsupported browsers
    window.location.href = url;
    return;
  }

  document.startViewTransition(async () => {
    // Fetch and swap content
    const response = await fetch(url);
    const html = await response.text();
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');
    document.getElementById('main-content').innerHTML =
      doc.getElementById('main-content').innerHTML;
  });
}

// Link click handler
document.querySelectorAll('a[data-transition]').forEach(link => {
  link.addEventListener('click', e => {
    e.preventDefault();
    navigateTo(link.href);
  });
});
```

CSS for the transition:
```css
/* Default cross-fade */
::view-transition-old(root) {
  animation: 300ms ease-in both fade-out;
}
::view-transition-new(root) {
  animation: 300ms ease-out both fade-in;
}

/* Slide transition instead */
@keyframes slide-out {
  to { transform: translateX(-100%); opacity: 0; }
}
@keyframes slide-in {
  from { transform: translateX(100%); opacity: 0; }
}
::view-transition-old(root) {
  animation: 400ms cubic-bezier(0.4, 0, 0.2, 1) both slide-out;
}
::view-transition-new(root) {
  animation: 400ms cubic-bezier(0.4, 0, 0.2, 1) both slide-in;
}
```

---

## 9. Section Reveal with Line Clip

Reveal text by clipping a line that sweeps across — cinematic.

```css
.clip-reveal {
  clip-path: inset(0 100% 0 0);
  transition: clip-path 1s cubic-bezier(0.16, 1, 0.3, 1);
}
.clip-reveal.visible {
  clip-path: inset(0 0% 0 0);
}
```

```js
const observer = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add('visible');
    }
  });
}, { threshold: 0.1 });

document.querySelectorAll('.clip-reveal').forEach(el => observer.observe(el));
```

---

## 10. Sticky Section with Pinned Title

Classic agency pattern: headline stays fixed while content scrolls beside it.

```js
gsap.to('.sticky-title', {
  scrollTrigger: {
    trigger: '.sticky-section',
    start: 'top top',
    end: 'bottom bottom',
    pin: '.sticky-title',
    pinSpacing: false
  }
});

// Content items reveal as they enter
gsap.utils.toArray('.sticky-content-item').forEach((item, i) => {
  gsap.fromTo(item,
    { opacity: 0, x: 60 },
    {
      opacity: 1, x: 0,
      duration: 0.7,
      ease: 'power3.out',
      scrollTrigger: {
        trigger: item,
        start: 'top 70%',
        once: true
      }
    }
  );
});
```

---

## GSAP Easing Cheat Sheet

| Ease | Feel | Best For |
|------|------|---------|
| `power4.out` | Fast start, slow end | Entrances, reveals |
| `power3.inOut` | Smooth acceleration + deceleration | Transitions |
| `elastic.out(1, 0.3)` | Bouncy, springy | Playful hover states |
| `back.out(1.7)` | Slight overshoot | Buttons, badges |
| `expo.out` | Explosive start | Hero entrances |
| `none` | Linear | Scrub animations tied to scroll |
| `circ.out` | Circular easing | Cards, modals |

---

## ScrollTrigger Markers (Debug Mode)
```js
ScrollTrigger.defaults({ markers: true }); // Show start/end markers
// Remove before shipping
```
