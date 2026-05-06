# 3D Patterns — Elite Web UI

Complete, working 3D implementations using Three.js (CDN r128) and CSS 3D.

---

## CDN Setup

```html
<script src="https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js"></script>
```

**Critical notes for r128:**
- No `THREE.CapsuleGeometry` (added in r142) — use `CylinderGeometry` + `SphereGeometry`
- No ES module imports — use `const { Scene, PerspectiveCamera, ... } = THREE`
- OrbitControls not on CDN for r128 — implement manual rotation instead

---

## 1. Floating Particle Field (Hero Background)

The most versatile 3D hero pattern. Works for any brand.

```html
<canvas id="particle-canvas" style="position:fixed; top:0; left:0; width:100%; height:100%; z-index:0; pointer-events:none;"></canvas>
```

```js
function initParticleField() {
  const canvas = document.getElementById('particle-canvas');
  const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(window.innerWidth, window.innerHeight);

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 100);
  camera.position.z = 30;

  // Create particles
  const count = 3000;
  const positions = new Float32Array(count * 3);
  const colors = new Float32Array(count * 3);

  for (let i = 0; i < count; i++) {
    const i3 = i * 3;
    positions[i3]     = (Math.random() - 0.5) * 80;
    positions[i3 + 1] = (Math.random() - 0.5) * 80;
    positions[i3 + 2] = (Math.random() - 0.5) * 50;

    // Purple to cyan gradient
    const t = Math.random();
    colors[i3]     = 0.4 + t * 0.2;  // R
    colors[i3 + 1] = 0.2 + t * 0.4;  // G
    colors[i3 + 2] = 0.8 + t * 0.2;  // B
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

  const material = new THREE.PointsMaterial({
    size: 0.15,
    vertexColors: true,
    transparent: true,
    opacity: 0.8,
    sizeAttenuation: true
  });

  const particles = new THREE.Points(geometry, material);
  scene.add(particles);

  // Mouse parallax
  let mouseX = 0, mouseY = 0;
  document.addEventListener('mousemove', (e) => {
    mouseX = (e.clientX / window.innerWidth - 0.5) * 2;
    mouseY = (e.clientY / window.innerHeight - 0.5) * 2;
  });

  // Animation loop
  const clock = new THREE.Clock();
  function animate() {
    requestAnimationFrame(animate);
    const elapsed = clock.getElapsedTime();

    particles.rotation.y = elapsed * 0.03;
    particles.rotation.x = elapsed * 0.01;

    // Mouse parallax — smooth lerp
    camera.position.x += (mouseX * 3 - camera.position.x) * 0.05;
    camera.position.y += (-mouseY * 2 - camera.position.y) * 0.05;
    camera.lookAt(scene.position);

    renderer.render(scene, camera);
  }
  animate();

  // Responsive
  window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  });
}

// Lazy load — only init when canvas is visible
const observer = new IntersectionObserver((entries) => {
  if (entries[0].isIntersecting) {
    initParticleField();
    observer.disconnect();
  }
});
observer.observe(document.getElementById('particle-canvas'));
```

---

## 2. Floating Geometric Shape (Hero Object)

Wireframe icosahedron with slow rotation + mouse tracking. Brand-agnostic.

```js
function initHeroSphere(containerId) {
  const container = document.getElementById(containerId);
  const w = container.offsetWidth;
  const h = container.offsetHeight;

  const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(w, h);
  container.appendChild(renderer.domElement);

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(45, w / h, 0.1, 100);
  camera.position.z = 5;

  // Main wireframe sphere
  const geometry = new THREE.IcosahedronGeometry(1.8, 1);
  const wireframe = new THREE.WireframeGeometry(geometry);
  const material = new THREE.LineSegmentsGeometry
    ? new THREE.LineSegmentsGeometry()  // r128 may not have this
    : null;

  // Use standard line material for r128 compatibility
  const lines = new THREE.LineSegments(wireframe, new THREE.LineBasicMaterial({
    color: 0x6366f1,
    transparent: true,
    opacity: 0.6
  }));
  scene.add(lines);

  // Inner solid with glass-like material
  const solidGeo = new THREE.IcosahedronGeometry(1.6, 1);
  const solidMat = new THREE.MeshPhongMaterial({
    color: 0x1a1a2e,
    transparent: true,
    opacity: 0.4,
    shininess: 100
  });
  const solid = new THREE.Mesh(solidGeo, solidMat);
  scene.add(solid);

  // Lighting
  const ambientLight = new THREE.AmbientLight(0xffffff, 0.3);
  scene.add(ambientLight);
  const pointLight1 = new THREE.PointLight(0x6366f1, 2, 10);
  pointLight1.position.set(3, 3, 3);
  scene.add(pointLight1);
  const pointLight2 = new THREE.PointLight(0xec4899, 1.5, 10);
  pointLight2.position.set(-3, -2, 2);
  scene.add(pointLight2);

  let targetRotX = 0, targetRotY = 0;
  document.addEventListener('mousemove', (e) => {
    targetRotY = (e.clientX / window.innerWidth - 0.5) * Math.PI * 0.4;
    targetRotX = (e.clientY / window.innerHeight - 0.5) * Math.PI * 0.2;
  });

  const clock = new THREE.Clock();
  function animate() {
    requestAnimationFrame(animate);
    const elapsed = clock.getElapsedTime();

    // Auto-rotate + mouse influence
    lines.rotation.y += (targetRotY * 0.3 + elapsed * 0.15 - lines.rotation.y) * 0.05;
    lines.rotation.x += (targetRotX * 0.2 - lines.rotation.x) * 0.05;
    solid.rotation.copy(lines.rotation);

    // Breathing scale
    const scale = 1 + Math.sin(elapsed * 0.8) * 0.03;
    lines.scale.setScalar(scale);
    solid.scale.setScalar(scale * 0.95);

    renderer.render(scene, camera);
  }
  animate();
}
```

---

## 3. GLSL Noise Shader Background

Organic, animated gradient using WebGL fragment shader. Zero external dependencies.

```html
<canvas id="shader-bg" style="position:fixed; top:0; left:0; width:100%; height:100%; z-index:-1;"></canvas>
```

```js
function initShaderBackground() {
  const canvas = document.getElementById('shader-bg');
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: false });
  renderer.setSize(window.innerWidth, window.innerHeight);

  const scene = new THREE.Scene();
  const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0.1, 10);
  camera.position.z = 1;

  const vertexShader = `
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `;

  const fragmentShader = `
    uniform float u_time;
    uniform vec2 u_resolution;
    varying vec2 vUv;

    // Classic Perlin noise functions
    vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
    vec4 mod289(vec4 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
    vec4 permute(vec4 x) { return mod289(((x*34.0)+10.0)*x); }
    vec4 taylorInvSqrt(vec4 r) { return 1.79284291400159 - 0.85373472095314 * r; }
    vec3 fade(vec3 t) { return t*t*t*(t*(t*6.0-15.0)+10.0); }

    float cnoise(vec3 P) {
      vec3 Pi0 = floor(P); vec3 Pi1 = Pi0 + vec3(1.0);
      Pi0 = mod289(Pi0); Pi1 = mod289(Pi1);
      vec3 Pf0 = fract(P); vec3 Pf1 = Pf0 - vec3(1.0);
      vec4 ix = vec4(Pi0.x, Pi1.x, Pi0.x, Pi1.x);
      vec4 iy = vec4(Pi0.yy, Pi1.yy);
      vec4 iz0 = Pi0.zzzz; vec4 iz1 = Pi1.zzzz;
      vec4 ixy = permute(permute(ix) + iy);
      vec4 ixy0 = permute(ixy + iz0); vec4 ixy1 = permute(ixy + iz1);
      vec4 gx0 = ixy0 * (1.0 / 7.0); vec4 gy0 = fract(floor(gx0) * (1.0 / 7.0)) - 0.5;
      gx0 = fract(gx0); vec4 gz0 = vec4(0.5) - abs(gx0) - abs(gy0);
      vec4 sz0 = step(gz0, vec4(0.0));
      gx0 -= sz0 * (step(0.0, gx0) - 0.5); gy0 -= sz0 * (step(0.0, gy0) - 0.5);
      vec4 gx1 = ixy1 * (1.0 / 7.0); vec4 gy1 = fract(floor(gx1) * (1.0 / 7.0)) - 0.5;
      gx1 = fract(gx1); vec4 gz1 = vec4(0.5) - abs(gx1) - abs(gy1);
      vec4 sz1 = step(gz1, vec4(0.0));
      gx1 -= sz1 * (step(0.0, gx1) - 0.5); gy1 -= sz1 * (step(0.0, gy1) - 0.5);
      vec3 g000 = vec3(gx0.x,gy0.x,gz0.x); vec3 g100 = vec3(gx0.y,gy0.y,gz0.y);
      vec3 g010 = vec3(gx0.z,gy0.z,gz0.z); vec3 g110 = vec3(gx0.w,gy0.w,gz0.w);
      vec3 g001 = vec3(gx1.x,gy1.x,gz1.x); vec3 g101 = vec3(gx1.y,gy1.y,gz1.y);
      vec3 g011 = vec3(gx1.z,gy1.z,gz1.z); vec3 g111 = vec3(gx1.w,gy1.w,gz1.w);
      vec4 norm0 = taylorInvSqrt(vec4(dot(g000,g000),dot(g010,g010),dot(g100,g100),dot(g110,g110)));
      g000 *= norm0.x; g010 *= norm0.y; g100 *= norm0.z; g110 *= norm0.w;
      vec4 norm1 = taylorInvSqrt(vec4(dot(g001,g001),dot(g011,g011),dot(g101,g101),dot(g111,g111)));
      g001 *= norm1.x; g011 *= norm1.y; g101 *= norm1.z; g111 *= norm1.w;
      float n000 = dot(g000, Pf0);
      float n100 = dot(g100, vec3(Pf1.x, Pf0.yz));
      float n010 = dot(g010, vec3(Pf0.x, Pf1.y, Pf0.z));
      float n110 = dot(g110, vec3(Pf1.xy, Pf0.z));
      float n001 = dot(g001, vec3(Pf0.xy, Pf1.z));
      float n101 = dot(g101, vec3(Pf1.x, Pf0.y, Pf1.z));
      float n011 = dot(g011, vec3(Pf0.x, Pf1.yz));
      float n111 = dot(g111, Pf1);
      vec3 fade_xyz = fade(Pf0);
      vec4 n_z = mix(vec4(n000,n100,n010,n110), vec4(n001,n101,n011,n111), fade_xyz.z);
      vec2 n_yz = mix(n_z.xy, n_z.zw, fade_xyz.y);
      float n_xyz = mix(n_yz.x, n_yz.y, fade_xyz.x);
      return 2.2 * n_xyz;
    }

    void main() {
      vec2 uv = vUv;
      float time = u_time * 0.2;

      // Multi-octave noise
      float n = cnoise(vec3(uv * 2.5, time));
      n += 0.5 * cnoise(vec3(uv * 5.0, time * 1.3));
      n += 0.25 * cnoise(vec3(uv * 10.0, time * 1.7));
      n = n * 0.5 + 0.5;

      // Color palette: deep dark → indigo → purple
      vec3 col1 = vec3(0.03, 0.03, 0.06);   // near-black
      vec3 col2 = vec3(0.15, 0.1, 0.35);    // deep purple
      vec3 col3 = vec3(0.05, 0.08, 0.25);   // deep indigo

      vec3 color = mix(col1, mix(col2, col3, n), smoothstep(0.2, 0.8, n));
      gl_FragColor = vec4(color, 1.0);
    }
  `;

  const geometry = new THREE.PlaneGeometry(2, 2);
  const material = new THREE.ShaderMaterial({
    vertexShader,
    fragmentShader,
    uniforms: {
      u_time: { value: 0 },
      u_resolution: { value: new THREE.Vector2(window.innerWidth, window.innerHeight) }
    }
  });

  scene.add(new THREE.Mesh(geometry, material));

  function animate() {
    requestAnimationFrame(animate);
    material.uniforms.u_time.value += 0.016;
    renderer.render(scene, camera);
  }
  animate();

  window.addEventListener('resize', () => {
    renderer.setSize(window.innerWidth, window.innerHeight);
    material.uniforms.u_resolution.value.set(window.innerWidth, window.innerHeight);
  });
}
```

---

## 4. CSS 3D Card Tilt (No Three.js Needed)

Pure CSS + JS. Extremely performant. Works for any card/panel element.

```css
.tilt-card {
  transform-style: preserve-3d;
  transition: transform 0.1s ease;
  will-change: transform;
  cursor: pointer;
}
.tilt-card__inner {
  transform-style: preserve-3d;
}
.tilt-card__shine {
  position: absolute;
  inset: 0;
  background: radial-gradient(circle at var(--x, 50%) var(--y, 50%),
    rgba(255,255,255,0.15) 0%,
    transparent 60%);
  border-radius: inherit;
  opacity: 0;
  transition: opacity 0.3s ease;
  pointer-events: none;
}
.tilt-card:hover .tilt-card__shine {
  opacity: 1;
}
/* Floating content above card surface */
.tilt-card__content {
  transform: translateZ(40px);
  transform-style: preserve-3d;
}
```

```js
function initTiltCards() {
  const cards = document.querySelectorAll('.tilt-card');

  cards.forEach(card => {
    const shine = card.querySelector('.tilt-card__shine');
    const maxTilt = 15; // degrees

    card.addEventListener('mousemove', (e) => {
      const rect = card.getBoundingClientRect();
      const x = (e.clientX - rect.left) / rect.width;   // 0 to 1
      const y = (e.clientY - rect.top) / rect.height;   // 0 to 1

      const rotateX = (y - 0.5) * -maxTilt * 2;
      const rotateY = (x - 0.5) * maxTilt * 2;

      card.style.transform = `
        perspective(600px)
        rotateX(${rotateX}deg)
        rotateY(${rotateY}deg)
        scale3d(1.02, 1.02, 1.02)
      `;

      // Move shine highlight with cursor
      if (shine) {
        shine.style.setProperty('--x', `${x * 100}%`);
        shine.style.setProperty('--y', `${y * 100}%`);
      }
    });

    card.addEventListener('mouseleave', () => {
      card.style.transform = 'perspective(600px) rotateX(0) rotateY(0) scale3d(1,1,1)';
    });
  });
}
```

HTML:
```html
<div class="tilt-card" style="border-radius: 16px; background: #111; padding: 32px; position: relative; overflow: hidden;">
  <div class="tilt-card__shine"></div>
  <div class="tilt-card__content">
    <h3>Card Title</h3>
    <p>Content floats above the card surface.</p>
  </div>
</div>
```

---

## 5. Three.js Floating Object with Scroll Parallax

Object floats in world space, moves with scroll for depth effect.

```js
function initScrollObject(canvasId) {
  const canvas = document.getElementById(canvasId);
  const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(canvas.offsetWidth, canvas.offsetHeight);

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(40, canvas.offsetWidth / canvas.offsetHeight, 0.1, 100);
  camera.position.z = 6;

  // Torus knot — highly recognizable 3D shape
  const geometry = new THREE.TorusKnotGeometry(1, 0.35, 100, 16);
  const material = new THREE.MeshPhongMaterial({
    color: 0x6366f1,
    shininess: 120,
    specular: 0xffffff,
    wireframe: false
  });
  const mesh = new THREE.Mesh(geometry, material);
  scene.add(mesh);

  // Lighting setup for premium look
  scene.add(new THREE.AmbientLight(0xffffff, 0.2));
  const key = new THREE.DirectionalLight(0x6366f1, 2);
  key.position.set(5, 5, 5);
  scene.add(key);
  const fill = new THREE.DirectionalLight(0xec4899, 1);
  fill.position.set(-5, -3, 2);
  scene.add(fill);
  const rim = new THREE.DirectionalLight(0xffffff, 0.5);
  rim.position.set(0, -5, -5);
  scene.add(rim);

  let scrollY = 0;
  window.addEventListener('scroll', () => { scrollY = window.scrollY; });

  const clock = new THREE.Clock();
  function animate() {
    requestAnimationFrame(animate);
    const elapsed = clock.getElapsedTime();

    mesh.rotation.x = elapsed * 0.2;
    mesh.rotation.y = elapsed * 0.3;
    // Scroll parallax on y-axis
    mesh.position.y = -scrollY * 0.003;

    renderer.render(scene, camera);
  }
  animate();
}
```

---

## 6. Performance Rules for Three.js

```js
// 1. Dispose of geometry and material when done (prevents memory leaks)
function cleanup(mesh) {
  mesh.geometry.dispose();
  mesh.material.dispose();
  scene.remove(mesh);
}

// 2. Reuse geometries — don't create new ones per frame
const sharedGeo = new THREE.SphereGeometry(1, 32, 32); // Create once

// 3. Limit draw calls — merge static objects
// const merged = THREE.BufferGeometryUtils.mergeBufferGeometries([geo1, geo2]);

// 4. Use MeshBasicMaterial for unlit objects (faster than MeshPhongMaterial)

// 5. Limit pixel ratio to 2 — retina doesn't need 3x
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

// 6. Pause rendering when tab is not visible
document.addEventListener('visibilitychange', () => {
  if (document.hidden) renderer.setAnimationLoop(null);
  else renderer.setAnimationLoop(animate);
});

// 7. Don't call renderer.render() if nothing changed (for static scenes)
```

---

## 7. React Three.js Hook Pattern

For React JSX artifacts — manages lifecycle correctly.

```jsx
import { useEffect, useRef } from 'react';
import * as THREE from 'three';

function ThreeCanvas({ height = 400 }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
    renderer.setSize(canvas.offsetWidth, canvas.offsetHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, canvas.offsetWidth / canvas.offsetHeight, 0.1, 100);
    camera.position.z = 5;

    const geometry = new THREE.IcosahedronGeometry(1.5, 2);
    const material = new THREE.MeshPhongMaterial({ color: 0x6366f1, shininess: 100 });
    const mesh = new THREE.Mesh(geometry, material);
    scene.add(mesh);
    scene.add(new THREE.AmbientLight(0xffffff, 0.5));
    const light = new THREE.DirectionalLight(0xffffff, 1);
    light.position.set(5, 5, 5);
    scene.add(light);

    let animId;
    const clock = new THREE.Clock();
    function animate() {
      animId = requestAnimationFrame(animate);
      mesh.rotation.y = clock.getElapsedTime() * 0.4;
      renderer.render(scene, camera);
    }
    animate();

    // Cleanup — critical for React
    return () => {
      cancelAnimationFrame(animId);
      geometry.dispose();
      material.dispose();
      renderer.dispose();
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{ width: '100%', height: `${height}px`, display: 'block' }}
    />
  );
}
```
