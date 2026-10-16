---
tags:
  - selika
  - web-dev
  - webgl
  - react
type: reference
status: active
date: 2026-10-09
source: selika site v8 source (branch v8-overhaul, final build 8.9), Projects/Selika Site/selika 8.9
key: Complete reference for the full-page WebGL background of the Selika v8 site (src/gl/Background.tsx and src/gl/backgroundShader.ts), covering the soft colour field per product, the zigzag aurora curtain and its maths, every uniform and constant, scroll coupling and performance tiers. Read it when rebuilding, tuning or debugging the background.
---

# Selika Site v8 - Aurora Background

> [!abstract] Key
> Complete reference for the full-page WebGL background of the Selika v8 site (src/gl/Background.tsx and src/gl/backgroundShader.ts), covering the soft colour field per product, the zigzag aurora curtain and its maths, every uniform and constant, scroll coupling and performance tiers. Read it when rebuilding, tuning or debugging the background.

**Related:** [[Selika Site v8 - Build Bible]] | [[Selika Site v8 - Architecture and Stack]] | [[Selika Site v8 - Design System]] | [[Selika Site v8 - Sections and Copy]] | [[Selika Site v8 - Hero and Mirror Scene]] | [[Selika Site v8 - Interactive Demo]] | [[Selika Site v8 - Assets and Provenance]] | [[Selika]]

---

## Overview

The whole site sits on one fixed, full-viewport WebGL canvas that paints two things in a single fragment-shader pass:

1. **The field**: a slow, grainy, out-of-focus wash of five coloured lights over a near-black base, violet for Selika Beauty and blue for Selika Dev, warped by fractal noise and nudged by the cursor.
2. **The aurora**: one continuous curtain (drawn as three layers) whose bright base runs from one margin of the page to the other and back, in smooth S-curves, all the way down the length of the page. Fine vertical rays rise from that base. It fades in once you scroll past the hero.

The header comment of `src/gl/backgroundShader.ts` sums it up:

> The site's one gradient: a slow, grainy field of out-of-focus light in the product's colours, and an aurora that zigzags down the length of the page: one continuous curtain whose bright base runs from one side of the page to the other and back, turning in the margins. The zigzag's size is worked out on the CPU from the viewport. Time is integrated on the CPU too, so nothing jumps when you scroll. GLSL ES 1.0 so it runs on every WebGL device. Noise: Ashima Arts / Ian McEwan simplex (MIT).

| Item | Value | Source |
|---|---|---|
| Mounted in | `<Background />` in `src/App.tsx`, after `<MotionDriver />` and `<GlassFilters />`, before `<Preloader />` | `src/App.tsx` |
| API | Raw WebGL 1 (no Three.js), GLSL ES 1.0 | `src/gl/Background.tsx` |
| Geometry | One oversized triangle `[-1,-1, 3,-1, -1,3]` | `Background.tsx` line 37 |
| Clock | Shared GSAP ticker via `addTick` (no own rAF) | `src/lib/motion.tsx` |
| Noise | Ashima Arts / Ian McEwan 2D simplex (MIT), plus a hash value noise for rays | `backgroundShader.ts` |

---

## Canvas setup (`src/gl/Background.tsx`)

### The element

```tsx
<canvas ref={ref} aria-hidden className="pointer-events-none fixed inset-0 -z-10 h-[100lvh] w-full opacity-0 transition-opacity duration-1000" />
```

- `fixed inset-0 -z-10`: behind all content, never scrolls.
- `h-[100lvh]`: the *large* viewport height, so the canvas stays covering the screen when mobile browser toolbars collapse.
- Starts at `opacity-0` and fades to `1` over 1000 ms (`canvas.style.opacity = "1"` once the program is running).
- `pointer-events-none` and `aria-hidden`.

### Context and program

```ts
const gl = canvas.getContext("webgl", { antialias: false, alpha: false, depth: false, stencil: false, powerPreference: "high-performance", preserveDrawingBuffer: false });
```

- If there is no context, or a shader fails to compile, or the program fails to link, the canvas is hidden (`canvas.style.display = "none"`) and a warning is logged. The page keeps working on its CSS background.
- One buffer with the full-screen triangle, attribute `aPos` (2 floats).

### Vertex shader (verbatim)

```glsl
attribute vec2 aPos;
varying vec2 vUv;
void main() { vUv = aPos * 0.5 + 0.5; gl_Position = vec4(aPos, 0.0, 1.0); }
```

`vUv` is 0 to 1 across the screen, y **up** (GL convention).

### Resolution

```ts
const resize = () => {
  const s = Math.min(scale, 1600 / Math.max(1, window.innerWidth));
  canvas.width = Math.max(1, Math.round(window.innerWidth * s));
  canvas.height = Math.max(1, Math.round(window.innerHeight * s));
  gl.viewport(0, 0, canvas.width, canvas.height);
  gl.uniform2f(u.res, canvas.width, canvas.height);
  const aspect = window.innerWidth / Math.max(1, window.innerHeight);
  gl.uniform1f(u.aspect, aspect);
  gl.uniform1f(u.aurW, aspect < 0.8 ? 0.55 : aspect < 1.15 ? 0.8 : 1);
  gl.uniform2f(u.css, window.innerWidth, window.innerHeight);
  gl.uniform4f(u.zig, ...zigzag(window.innerWidth, window.innerHeight));
};
```

- The canvas is rendered at a fraction of CSS pixels (never device pixels): `bgScale(tier)` = **0.72** (high), **0.55** (mid), **0.4** (low) (`src/lib/perf.ts`), and the internal width is capped at **1600 px** whatever the screen. The browser upscales it; the field is soft and grainy, so this is invisible.
- `resize` runs on start, on `window` `resize`, and whenever the performance tier changes.

---

## Uniforms

All declared in `BG_FRAG`; set in `Background.tsx`.

| Uniform | Type | Set when | Value / formula | Meaning |
|---|---|---|---|---|
| `uRes` | vec2 | resize | canvas width, height (device buffer px) | Declared, not used in the shader body |
| `uTime` | float | every tick | `t` (ticker seconds) | Grain only |
| `uDrift` | float | every tick | `drift + 40` | Integrated, calm motion time. All animation uses this (`t = uDrift` in `main`) |
| `uMouse` | vec2 | every tick | smoothed pointer, 0 to 1, y up | Cursor influence on the field |
| `uScroll` | float | every tick | `frame.scroll.y / frame.vh` | Scroll in viewport heights (Lenis-smoothed) |
| `uWorld` | float | every tick | `frame.world` | 0 Beauty, 1 Dev (eased) |
| `uHero` | float | every tick | `frame.hero` | 0 to 1 progress of the hero "through the mirror" dive |
| `uAspect` | float | resize | `innerWidth / innerHeight` | Width over height |
| `uOct` | float | quality | 5 high, 4 mid, 3 low | fbm octaves |
| `uAur` | float | quality | `0.6` if `prefers-reduced-transparency: reduce`, else `1` | Aurora strength |
| `uZig` | vec4 | resize | `zigzag(vw, vh)` | First turn (page y, vh), leg height (vh), left turn x, right turn x |
| `uAurW` | float | resize | 0.55 if aspect < 0.8, 0.8 if aspect < 1.15, else 1 | Ray length scale (shorter on phones and portrait tablets) |
| `uCss` | vec2 | resize | `innerWidth, innerHeight` (CSS px) | Viewport in CSS px |

---

## Driving it: the tick (`Background.tsx`)

```ts
// calm inputs: time is integrated (never jumps), the cursor is followed slowly
let drift = 0, last = -1, mx = 0.5, my = 0.5;
let lastKey = -1;
const off = addTick((t, dt) => {
  if (document.hidden) return;
  const step = last < 0 ? 0 : Math.min(0.05, Math.max(0, t - last)); last = t;
  if (!reducedMotion) drift += step;
  const k = 1 - Math.exp(-(dt || step) * 1.8);
  mx += (frame.pointer.nx * 0.5 + 0.5 - mx) * k; my += (frame.pointer.ny * 0.5 + 0.5 - my) * k;
  const sv = frame.scroll.y / Math.max(1, frame.vh);
  if (reducedMotion) {
    const key = Math.round(sv * 400) + frame.world * 7 + frame.hero * 13;
    if (key === lastKey) return; lastKey = key;
  }
  gl.uniform1f(u.time, t);
  gl.uniform1f(u.drift, drift + 40);
  gl.uniform2f(u.mouse, mx, my);
  gl.uniform1f(u.scroll, sv);
  gl.uniform1f(u.world, frame.world);
  gl.uniform1f(u.hero, frame.hero);
  gl.drawArrays(gl.TRIANGLES, 0, 3);
});
```

What it does:

- **Integrated time.** `drift` advances by the frame step, clamped to at most **0.05 s**, so a tab switch or a long frame never makes the picture jump. It starts at an offset of **+40 s** so the first frame is already "mid-motion".
- **Hidden tab**: nothing is drawn.
- **Cursor**: the already-smoothed pointer (`frame.pointer.nx/ny`, which the motion driver eases at rate 7.5 per second) is followed again with an exponential rate of **1.8 per second**, so the field leans very lazily.
- **Reduced motion**: `drift` is frozen, and the canvas only redraws when a key built from scroll (to 1/400 vh), world and hero changes. The picture becomes a still that only changes as you scroll or switch product.

### Inputs from the rest of the site

| Input | Origin | Behaviour |
|---|---|---|
| `frame.scroll.y` | `ScrollBridge` in `src/lib/motion.tsx` from Lenis (`lerp: 0.1`, `smoothWheel: true`, `syncTouch: false`) | Smoothed scroll on desktop wheels; native on touch |
| `frame.world` | `MotionDriver` subscribes to `useSite` product; `gsap.to(frame, { world: target, duration: reducedMotion ? 0.01 : 1.15, ease: "power2.inOut", overwrite: true })` | Beauty to Dev cross-fade takes **1.15 s** |
| `frame.hero` | Hero scene (`src/gl/HeroScene.tsx`) | 0 to 1 during the dive |
| `frame.pointer.nx/ny` | `MotionDriver`, `k = 1 - exp(-dt * 7.5)` | -1 to 1, y up |

---

## Part 1: the soft colour field

### Palette per product

```glsl
// two worlds, five lights each
vec3 base() { return mix(vec3(0.020, 0.016, 0.046), vec3(0.008, 0.020, 0.052), uWorld); }
vec3 light(int i) {
  if (i == 0) return mix(vec3(0.545, 0.486, 1.000), vec3(0.302, 0.553, 1.000), uWorld); // violet  | azure
  if (i == 1) return mix(vec3(0.690, 0.486, 1.000), vec3(0.557, 0.773, 1.000), uWorld); // orchid  | sky
  if (i == 2) return mix(vec3(0.900, 0.860, 1.000), vec3(0.860, 0.930, 1.000), uWorld); // lilac   | ice
  if (i == 3) return mix(vec3(0.200, 0.120, 0.520), vec3(0.050, 0.160, 0.470), uWorld); // indigo  | navy
  return mix(vec3(0.302, 0.553, 1.000), vec3(0.545, 0.486, 1.000), uWorld);              // azure   | violet
}
```

| Slot | Beauty (uWorld 0) | Dev (uWorld 1) | Strength `amp` |
|---|---|---|---|
| base | (0.020, 0.016, 0.046) deep violet-black | (0.008, 0.020, 0.052) deep blue-black | n/a |
| 0 | violet (0.545, 0.486, 1.0) | azure (0.302, 0.553, 1.0) | 0.5 |
| 1 | orchid (0.690, 0.486, 1.0) | sky (0.557, 0.773, 1.0) | 0.5 |
| 2 | lilac (0.90, 0.86, 1.0) | ice (0.86, 0.93, 1.0) | 0.32 |
| 3 | indigo (0.20, 0.12, 0.52) | navy (0.05, 0.16, 0.47) | 0.8 |
| 4 | azure (0.302, 0.553, 1.0) | violet (0.545, 0.486, 1.0) | 0.5 |

**Transition**: every colour is a `mix(beauty, dev, uWorld)`, and `uWorld` is tweened over 1.15 s with `power2.inOut`, so switching product washes the whole page from violet to blue (or back) smoothly. Note slot 4 swaps azure and violet, so each world keeps an accent of the other.

### Field code (verbatim from `main`)

```glsl
  vec2 uv = vUv;
  float t = uDrift;
  vec2 p = (uv - 0.5) * vec2(uAspect, 1.0);
  vec2 m = (uMouse - 0.5) * vec2(uAspect, 1.0);

  // ---------- the field ----------
  float heroZone = 1.0 - smoothstep(0.55, 1.5, uScroll);
  vec2 q = p * 0.55 + vec2(0.0, uScroll * 0.10);
  vec2 w1 = vec2(fbm(q + vec2(t * 0.018, -t * 0.014)), fbm(q + vec2(4.7, 1.3) - t * 0.016));
  // the cursor leans on the field gently, like a hand near frosted glass
  vec2 dm = p - m;
  float md2 = dot(dm, dm);
  w1 += vec2(-dm.y, dm.x) * exp(-md2 * 3.0) * 0.16;
  float warp = mix(0.9, 1.5, heroZone);
  vec2 w2 = vec2(snoise(q * 0.9 + warp * w1 + vec2(1.7, 9.2) + t * 0.010), snoise(q * 0.9 + warp * w1 + vec2(8.3, 2.8) - t * 0.012));
  float n = snoise(q * 0.7 + mix(1.0, 1.7, heroZone) * w2) * 0.5 + 0.5;

  vec3 col = base();
  vec2 focus = vec2(0.13 * uAspect, 0.03) * heroZone;
  float spread = mix(0.62, 0.36, heroZone);
  for (int i = 0; i < 5; i++) {
    float fi = float(i);
    vec2 c = focus + vec2(sin(t * 0.045 * (1.0 + fi * 0.31) + fi * 2.1) * spread * uAspect * 0.7,
                          cos(t * 0.039 * (1.0 + fi * 0.27) + fi * 1.7) * spread * 0.75 - fi * 0.03);
    c = mix(c, m, 0.03 + 0.02 * mod(fi, 2.0));
    float r = 0.34 + 0.12 * sin(fi * 1.3 + t * 0.06);
    vec2 d = p + w2 * 0.22 - c;
    float g = exp(-dot(d, d) / (r * r));
    float amp = (i == 2) ? 0.32 : (i == 3) ? 0.8 : 0.5;
    col += light(i) * g * amp;
  }
  col *= mix(0.88, 0.78, heroZone) + mix(0.18, 0.34, heroZone) * n;
  col += light(1) * exp(-md2 * 7.0) * 0.07;
  col *= mix(1.0, 0.42 + 0.58 * smoothstep(0.02, 0.62, uv.x), heroZone);
  col *= mix(0.6, 1.0, heroZone);
```

### What it looks like, step by step

| Step | Visual effect |
|---|---|
| `p` | Centred, aspect-correct coordinates (height 1). |
| `heroZone` | 1 at the top of the page, falling to 0 between 0.55 and 1.5 viewport heights of scroll. It separates the "hero look" from the "rest of the page look". |
| `q` | Noise domain at 0.55 scale; it drifts up by 0.10 per viewport scrolled, so the field moves gently with the page (parallax). |
| `w1` | Two fbm samples drifting at 0.018, 0.014, 0.016 per second: slow first warp. |
| cursor swirl | Near the cursor (`exp(-md2 * 3.0)`), `w1` is pushed along the tangent `(-dm.y, dm.x)` by up to 0.16: the field swirls softly around the pointer like a hand near frosted glass. |
| `w2` | Second domain warp with simplex noise; strength `warp` 1.5 in the hero, 0.9 below it. |
| `n` | 0 to 1 cloud brightness used to modulate the lights. |
| five lights | Five Gaussian blobs (radius 0.34 ± 0.12, breathing at 0.06) wander on Lissajous paths (`sin(t*0.045*(1+0.31i))`, `cos(t*0.039*(1+0.27i))`). In the hero they cluster around `focus = (0.13*aspect, 0.03)` (right of centre and slightly up) with `spread` 0.36; below the hero they spread to 0.62. Each blob is pulled 3% (even i) or 5% (odd i) toward the cursor, and its sample point is displaced by `w2 * 0.22` so blobs look melted, not round. |
| cloud modulation | `col *= 0.78 + 0.34 n` in the hero (more contrast), `0.88 + 0.18 n` below. |
| cursor glow | A faint orchid/sky glow (0.07) right under the cursor, `exp(-md2 * 7)`. |
| left darkening | In the hero only, the left side is darkened to 42% (smoothstep over uv.x 0.02 to 0.62) so the headline on the left reads against a darker ground. |
| page dimming | Below the hero the whole field is dimmed to 60% so the aurora and content lead. |

---

## Part 2: the aurora

### Visual summary

The comment in `main`:

> The intro video's aurora, swinging down the page: its base runs across from one margin to the other and back in smooth S-curves, rays rising from it, each turn a rounded fold. Three layers, nearest first, each on a slightly narrower swing that turns a little lower, so they fold in different places. Faint stars between.

So, scrolling down the page you see a glowing horizontal-ish band (the "edge" or "base") that sweeps from the left margin to the right margin, turns in a rounded fold, sweeps back, turns again, and so on. Thin vertical rays rise above the band (upward on screen), sky blue at the base turning violet (Beauty) or azure (Dev) at the tips, swaying slowly, clustering and thinning like a real aurora curtain. Two further, dimmer, narrower layers follow slightly lower, folding at different points, giving depth.

### The zigzag path (CPU, `Background.tsx`)

```ts
/* The aurora's zigzag: legs that run from one margin to the other and back, all the way down the
   page, each at a gentle slope (steeper on narrow screens, where the page is taller than it is wide).
   [first turn (page y, viewport heights), leg height (vh), left turn x, right turn x] */
function zigzag(vw: number, vh: number): [number, number, number, number] {
  const aspect = vw / Math.max(1, vh);
  const xl = vw < 640 ? 0.08 : 0.06, xr = 1 - xl;
  const deg = aspect >= 1.15 ? 30 : aspect >= 0.8 ? 38 : 50;
  return [0.85, ((xr - xl) * vw * Math.tan((deg * Math.PI) / 180)) / Math.max(1, vh), xl, xr];
}
```

| Component (`uZig`) | Value | Meaning |
|---|---|---|
| `x` first turn | **0.85** | The first turn sits 0.85 viewport heights down the page (page coordinates, not screen) |
| `y` leg height | `(xr - xl) * vw * tan(deg) / vh` | Vertical drop of one leg, in viewport heights, so that the straight line between the two turns has slope `deg` |
| `z` xl | **0.06**, or **0.08** when `vw < 640` | Left turn x (fraction of width) |
| `w` xr | `1 - xl` (0.94 or 0.92) | Right turn x |

Slope angle `deg` by aspect (width over height):

| Aspect | deg |
|---|---|
| ≥ 1.15 (landscape desktop) | **30°** |
| 0.8 to 1.15 (square-ish, e.g. tablets) | **38°** |
| < 0.8 (portrait phones and tablets) | **50°** |

Worked examples (computed from the formula):

| Viewport | Aspect | deg | xl | Leg height (vh) | `uAurW` |
|---|---|---|---|---|---|
| 1920 x 1080 | 1.78 | 30 | 0.06 | 0.903 | 1 |
| 1440 x 900 | 1.60 | 30 | 0.06 | 0.813 | 1 |
| 1180 x 820 | 1.44 | 30 | 0.06 | 0.731 | 1 |
| 820 x 1180 | 0.69 | 50 | 0.06 | 0.729 | 0.55 |
| 390 x 844 | 0.46 | 50 | 0.08 | 0.463 | 0.55 |

In the shader:

```glsl
    float L = uZig.y * uCss.y, top = (uZig.x - uScroll) * uCss.y;   // one run's height and the first turn, CSS px
    float cx = 0.5 * (uZig.z + uZig.w), A = 0.5 * (uZig.w - uZig.z);  // the swing's centre and half-width
```

- `L`: one run's height in CSS px.
- `top`: screen y (CSS px, y down) of the first turn; it moves up as you scroll, so the zigzag is pinned to the **page**, not the viewport.
- `cx`: always 0.5. `A`: half-width, 0.44 on desktop, 0.42 on phones (fractions of width).

### The S-curve runs

Each run `j` (0, 1, 2, ...) is a half cosine:

```
X(tt) = cx + sg * A * cos(pi * tt)      Y(tt) = Y0 + tt * L,   tt in [0, 1]
sg = -1 for even j (left to right), +1 for odd j (right to left)
Y0 = top + (ph + j) * L
```

So the base is vertical-slope-free at the turns (the cosine is flat in x there, giving a rounded fold) and steepest mid-run. The slope chosen by `zigzag()` is that of the chord between turns, so mid-run the curve is steeper by a factor of pi/2 in x-speed.

**Inverse for a column.** For a pixel column `x`, how far along a left-to-right run it sits:

```glsl
  float tE = acos(clamp((cx - x) / amp, -1.0, 1.0)) / PI;   // how far along a left-to-right run this column is
```

`x = cx - amp` gives `tE = 0` (left turn), `x = cx + amp` gives `tE = 1` (right turn). For odd (right-to-left) runs the shader uses `tl = 1 - tE`. `s = sin(PI * tl)` is 0 at the turns and 1 mid-run, and is used to fade waves, lift and fold brightness.

For each pixel, the shader takes the run that passes through its row band and the runs above and below (`n = -1, 0, 1` around `floor(rel)`), skipping `j < 0` (nothing above the first turn).

### `layer()` (verbatim)

```glsl
// One layer of the aurora on its own swing down the page: amp is its half-width (a fraction of the
// screen), ph moves its turns down the page (in runs) and lift raises it in the middle of each run, so the
// layers fold at different places instead of meeting at one point. For each column it takes the runs that
// pass above and below the pixel, and finds how far the pixel is from each one, square to the curve
// (two Newton steps along the swing), which rounds the folds and caps their tips.
vec3 layer(vec2 q, float x, float k, float kr, float t, float L, float top, float cx, float amp, float ph, float lift, float hgt, float rpx, float sdl, float gain, float xo) {
  const float PI = 3.14159265;
  if (abs(x - cx) - amp > 0.05) return vec3(0.0);           // well past the tip of a fold
  float th = t * 0.0982;
  float inside = 1.0 - smoothstep(amp - 0.035, amp, abs(x - cx));   // rays thin out toward the tip of a fold
  float Apx = amp * uCss.x, cxp = cx * uCss.x;
  float tE = acos(clamp((cx - x) / amp, -1.0, 1.0)) / PI;   // how far along a left-to-right run this column is
  float rel = (q.y - top) / L - ph;
  vec3 acc = vec3(0.0);
  for (int n = -1; n < 2; n++) {
    float j = floor(rel) + float(n);
    if (j < -0.5) continue;
    float odd = mod(j, 2.0), sg = odd > 0.5 ? 1.0 : -1.0;   // this run's swing: X(t) = cx + sg * A * cos(pi t)
    float tl = mix(tE, 1.0 - tE, odd);
    float s = sin(PI * tl);                                // 0 at the turns, 1 mid-run
    float sd = sdl + j * 2.71;
    float wv = s * (60.0 * sin(x * 4.3 + th + sd) + 33.0 * sin(x * 9.7 - 2.0 * th + sd * 1.7) + 18.0 * sin(x * 21.0 + 3.0 * th + sd * 2.9));
    float Y0 = top + (ph + j) * L, ybp = Y0 + tl * L;
    float yb = ybp + k * wv - kr * lift * s;
    // the pixel's distance from the swing (shifted by this column's waves and lift), square to it
    vec2 p = vec2(q.x, q.y - (yb - ybp));
    float tt = tl;
    for (int it = 0; it < 2; it++) {
      float c = cos(PI * tt), sn = sin(PI * tt);
      float X = cxp + sg * Apx * c, Y = Y0 + tt * L;
      float Xp = -sg * Apx * PI * sn, Xpp = -sg * Apx * PI * PI * c;
      float fp = (X - p.x) * Xp + (Y - p.y) * L;
      float fpp = Xp * Xp + L * L + (X - p.x) * Xpp;
      tt = clamp(tt - fp / max(fpp, 1.0), 0.0, 1.0);
    }
    float dp = length(p - vec2(cxp + sg * Apx * cos(PI * tt), Y0 + tt * L)) / kr;
    // where the two runs of a fold meet, each gives half, so the fold isn't brighter than the curtain
    float tipW = mix(0.5, 1.0, smoothstep(0.0, 0.3, s));
    acc += curtain(x + j * 0.37 + xo, q.y, yb, kr, t, hgt, rpx, sd, gain, dp, inside, tipW);
  }
  return acc;
}
```

Walkthrough:

| Piece | What it does visually |
|---|---|
| Early out `abs(x - cx) - amp > 0.05` | Columns more than 5% of width past a fold tip draw nothing (cheap margins). |
| `th = t * 0.0982` | Slow phase for waves and sway (one cycle about 64 s). |
| `inside` | `1 - smoothstep(amp - 0.035, amp, |x - cx|)`: 1 across the run, fading to 0 over the last 3.5% of width before the fold tip. Rays and haze are multiplied by it, so rays **thin out softly toward each fold's tip** and no rays rise beyond it; only the bright edge wraps round the fold. |
| `rel`, `j` | Which run(s) are near this row. `ph` shifts the whole layer down by a fraction of a run. |
| `sd = sdl + j * 2.71` | A per-run seed, so every leg has its own ray pattern. |
| `wv` | Three sine waves along x (amplitudes **60, 33, 18** design px; frequencies 4.3, 9.7, 21; phase speeds 1, -2, 3 times `th`), scaled by `s` so they vanish at the turns. Gives the base its ripples. |
| `yb` | Edge height in this column: the path `ybp`, plus waves `k * wv`, minus `kr * lift * s` (the layer is raised by `lift` design px mid-run, zero at the turns). |
| Newton step | Shifts the pixel by the same wave/lift offset (`p`), then does **two Newton iterations** on the squared distance `f(tt) = ½|C(tt) - p|²` along the cosine path, starting from the column's own `tl`, clamped to [0, 1]. `fp` is f', `fpp` is f'' (with `max(fpp, 1.0)` as a guard). |
| `dp` | True perpendicular distance from the pixel to the curve, in design px (divided by `kr`). Because it is measured square to the curve, the edge keeps one thickness all the way round a fold, and the fold tip is capped with a round end instead of a vertical smear. |
| `tipW` | `mix(0.5, 1.0, smoothstep(0.0, 0.3, s))`: near a turn (s < 0.3) both runs meeting at the fold contribute, so each is **halved** (down to 0.5 at the very tip). Without this the fold would be twice as bright as the curtain. It scales the edge and the glow below it. |
| `x + j * 0.37 + xo` | Shifts the ray noise per run and per layer so legs and layers don't share rays. |

### `curtain()` (verbatim)

```glsl
// One curtain of the aurora, as in the intro video: a bright edge with fine vertical rays rising from it
// in clusters and folds, sky blue at the edge turning violet at the tips. x runs across the screen (0..1,
// offset per curtain), qy is the pixel's height and yb the edge's height in this column (CSS px, y down);
// dp is the pixel's distance from the edge measured square to it (design px), so the edge keeps one
// thickness all the way round a fold; inside is 0 past the tip of a fold, where no rays rise. Lengths are
// in design px on a 1080-high frame; k converts them.
vec3 curtain(float x, float qy, float yb, float k, float t, float hgt, float rpx, float sd, float gain, float dp, float inside, float tipW) {
  float th = t * 0.0982;
  float d = (yb - qy) / k;
  if (dp > 160.0 && (d < -160.0 || d > hgt * 2.6 || inside < 0.5)) return vec3(0.0);
  float sway = 2.6 * sin(th + sd) + 1.2 * sin(2.0 * th + sd * 0.7);
  float xr = x * (uCss.x / rpx) + sway + 0.0035 * max(d, 0.0) * sin(2.0 * th + x * 5.0 + sd);
  float ta = t * 0.25;
  float r = 0.62 * vn(vec2(xr, ta + sd * 7.0)) + 0.38 * vn(vec2(xr * 2.7 + 13.0, ta * 2.0 + sd * 3.0));
  r = r * r * 1.5;
  float cl = smoothstep(0.15, 0.95, vn(vec2(x * 26.0 + sway * 0.6 + sd * 9.0, ta + sd * 4.0)));
  float m = smoothstep(0.18, 0.85, vn(vec2(x * 5.0 + sway * 0.12 + sd * 4.0, t * 0.125 + sd)));
  float H = hgt * (0.45 + 0.8 * vn(vec2(xr * 0.35 + 5.0, ta + sd * 2.0))) * (0.7 + 0.5 * cl);
  float dh = max(d, 0.0) / H;
  float vfade = smoothstep(-160.0, -100.0, d) * (1.0 - smoothstep(hgt * 1.8, hgt * 2.6, d));   // no hard edge where it ends
  float rays = exp(-dh * sqrt(dh + 0.05) * 1.1) * exp(min(d, 0.0) / 15.0) * (0.38 + 0.62 * r) * (0.45 + 0.55 * cl) * inside * vfade;
  float edge = 0.75 * exp(-dp / 12.0) * (0.45 + 0.55 * r) * tipW;
  float below = exp(-dp / 70.0) * tipW * (1.0 - smoothstep(100.0, 160.0, dp));
  float haze = exp(-abs(d - 0.45 * H) / (1.3 * H)) * inside * vfade;
  float I = (rays + edge) * m + (0.10 * below + 0.14 * haze) * (0.35 + 0.65 * m);
  float hv = vn(vec2(x * 3.0 + sd * 2.0, t * 0.0625 + sd * 3.0));
  // Beauty: sky blue at the base to violet and orchid at the tips; Dev: ice to azure and sky
  vec3 c0 = mix(vec3(0.557, 0.773, 1.0), vec3(0.72, 0.9, 1.0), uWorld);
  vec3 c1 = mix(vec3(0.545, 0.486, 1.0), vec3(0.302, 0.553, 1.0), uWorld);
  vec3 b0 = mix(c0, mix(vec3(0.302, 0.553, 1.0), vec3(0.557, 0.773, 1.0), uWorld), 0.45 * hv);
  vec3 b1 = mix(c1, mix(vec3(0.690, 0.486, 1.0), vec3(0.45, 0.66, 1.0), uWorld), 0.5 * (1.0 - hv));
  return mix(b0, b1, clamp(min(d, dp * 3.0) / (H * 0.9), 0.0, 1.0)) * I * gain;
}
```

Units: all lengths are **design px on a 1080-high frame**. `k = uCss.y / 1080` converts design px to CSS px; the layer passes `kr = k * uAurW` as the curtain's `k`, so on phones (`uAurW` 0.55) every ray length, edge thickness and glow is 55% as long in CSS px.

| Term | Formula | Visual meaning |
|---|---|---|
| `d` | `(yb - qy) / k` | Height above the edge (positive = above on screen) |
| early out | `dp > 160 && (d < -160 or d > 2.6 hgt or inside < 0.5)` | Skip pixels far from everything |
| `sway` | `2.6 sin(th + sd) + 1.2 sin(2th + 0.7 sd)` | Whole curtain drifts sideways by a few ray widths |
| `xr` | `x * (uCss.x / rpx) + sway + 0.0035 * max(d,0) * sin(2th + 5x + sd)` | Ray coordinate: one noise cell every `rpx` CSS px; the last term bends rays slightly as they rise (lean grows with height) |
| `r` | two octaves of value noise, then `r*r*1.5` | Individual ray brightness, contrasty (crisp rays) |
| `cl` | `smoothstep(0.15, 0.95, vn(x*26 ...))` | Clusters: groups of rays brighter and taller |
| `m` | `smoothstep(0.18, 0.85, vn(x*5 ..., t*0.125))` | Large-scale curtain mask: whole stretches brighten and fade over time |
| `H` | `hgt * (0.45 + 0.8 vn(...)) * (0.7 + 0.5 cl)` | Local ray height, varying per column |
| `vfade` | `smoothstep(-160,-100,d) * (1 - smoothstep(1.8 hgt, 2.6 hgt, d))` | No hard cut-offs below the edge or at the tops |
| `rays` | `exp(-dh*sqrt(dh+0.05)*1.1) * exp(min(d,0)/15) * (0.38+0.62r) * (0.45+0.55cl) * inside * vfade` | Rays decay upward faster than exponential; below the edge they die in about 15 design px |
| `edge` | `0.75 exp(-dp/12) (0.45+0.55r) tipW` | The bright base line, about 12 design px thick, measured square to the curve |
| `below` | `exp(-dp/70) tipW (1 - smoothstep(100,160,dp))` | Soft glow around the base (both sides), cut off by 160 |
| `haze` | `exp(-|d - 0.45H| / (1.3H)) * inside * vfade` | Diffuse glow in the body of the rays |
| `I` | `(rays + edge) * m + (0.10 below + 0.14 haze)(0.35 + 0.65 m)` | Total intensity |
| colour | `mix(b0, b1, clamp(min(d, 3dp)/(0.9H), 0, 1))` | Base colour at the edge to tip colour as rays rise; `min(d, 3dp)` keeps the edge itself in the base colour even round folds |

Curtain colours:

| | Beauty (uWorld 0) | Dev (uWorld 1) |
|---|---|---|
| `c0` base | sky (0.557, 0.773, 1.0) | ice (0.72, 0.9, 1.0) |
| `b0` base variation (mixed in by `0.45 * hv`) | azure (0.302, 0.553, 1.0) | sky (0.557, 0.773, 1.0) |
| `c1` tips | violet (0.545, 0.486, 1.0) | azure (0.302, 0.553, 1.0) |
| `b1` tip variation (mixed in by `0.5 * (1 - hv)`) | orchid (0.690, 0.486, 1.0) | (0.45, 0.66, 1.0) |

`hv` is a slow value noise along x (time rate 0.0625) so the hue wanders along the curtain.

### The three `layer()` calls (verbatim)

```glsl
    vec3 aur = layer(q, uv.x, k, kr, t, L, top, cx, A, 0.0, 0.0, 200.0, 12.8, 1.3, 1.05, 0.0)
             + layer(q, uv.x, k, kr, t, L, top, cx, A * 0.92, 0.07, 110.0, 150.0, 10.1, 4.1, 0.62, 0.21)
             + layer(q, uv.x, k, kr, t, L, top, cx, A * 0.84, 0.14, 210.0, 115.0, 16.0, 8.7, 0.34, 0.53);
```

| Layer | `amp` (half-width) | `ph` (runs down) | `lift` (design px) | `hgt` (ray height, design px) | `rpx` (CSS px per ray cell) | `sdl` (seed) | `gain` | `xo` (ray offset) |
|---|---|---|---|---|---|---|---|---|
| 1, nearest | A | 0 | 0 | 200 | 12.8 | 1.3 | 1.05 | 0 |
| 2 | 0.92 A | 0.07 | 110 | 150 | 10.1 | 4.1 | 0.62 | 0.21 |
| 3, farthest | 0.84 A | 0.14 | 210 | 115 | 16.0 | 8.7 | 0.34 | 0.53 |

Each successive layer is narrower (folds turn further from the margins), turns a little lower down the page (`ph`), is lifted higher mid-run, has shorter rays and is dimmer, so the three fold in different places instead of meeting at one point.

### Composite, stars and the reading column (verbatim)

```glsl
  float emerge = smoothstep(0.55, 1.25, uScroll) * uAur;
  if (emerge > 0.001) {
    vec2 q = vec2(uv.x, 1.0 - uv.y) * uCss;
    float k = uCss.y / 1080.0, kr = k * uAurW;
    ...the L / top / cx / A lines and the three layers above...
    float lum = dot(aur, vec3(0.3, 0.4, 0.3));
    aur = 1.0 - exp(-aur * 1.1);
    // faint stars that fade where the curtains are
    vec2 cell = floor(q / 26.0);
    float hs = h21(cell + 0.5);
    float star = 0.0;
    if (hs > 0.86) {
      vec2 sp = (cell + 0.2 + 0.6 * vec2(h21(cell + 3.1), h21(cell + 7.7))) * 26.0;
      vec2 dv = q - sp;
      float n = 2.0 + floor(h21(cell + 5.3) * 4.0);
      star = (0.35 + 0.65 * (hs - 0.86) / 0.14) * (0.55 + 0.45 * sin(t * 0.098 * n + 6.283 * h21(cell + 11.3))) * exp(-dot(dv, dv) / 2.2);
    }
    star *= 1.0 - smoothstep(0.08, 0.4, lum);
    // softer where it passes behind the reading column
    float column = 0.5 + 0.5 * smoothstep(0.08, 0.34, abs(uv.x - 0.5));
    col = col * (1.0 - 0.35 * emerge) + (aur * 0.9 * column + vec3(0.8, 0.88, 1.0) * star * 0.35) * emerge;
  }
```

- `q` here is the pixel in **CSS px, y down** (the shader flips `uv.y`).
- **Tone map** of the aurora: `1 - exp(-aur * 1.1)` so overlapping layers saturate softly rather than clip.
- **Stars**: a 26 CSS px grid; about 14% of cells (`hs > 0.86`) hold one star at a random spot in the inner 60% of the cell, a tiny Gaussian (`exp(-r²/2.2)`), brightness 0.35 to 1, twinkling at one of four rates (`n` = 2 to 5, times 0.098). Stars vanish where the aurora's luminance rises from 0.08 to 0.4. Colour (0.8, 0.88, 1.0) at 0.35.
- **Reading column**: the aurora is at 50% strength in the centre of the screen (|uv.x - 0.5| < 0.08), rising to full by 0.34 from centre, so text in the middle column stays readable.
- **Blend**: as `emerge` rises the field is dimmed by up to 35% and the aurora (x 0.9) is added.

### The hero bloom (verbatim)

```glsl
  // ---------- the hero transition: a soft bloom where the mirror is ----------
  float bloom = smoothstep(0.15, 0.55, uHero) * (1.0 - smoothstep(0.6, 0.95, uHero));
  vec2 mp = p - vec2(0.08 * uAspect * step(1.15, uAspect), 0.0);
  col += light(1) * exp(-dot(mp, mp) * 3.0) * bloom * 0.35;
```

During the hero dive (`uHero` 0.15 to 0.95) a soft orchid/sky bloom rises and falls where the mirror sits: offset right by `0.08 * aspect` on landscape screens (aspect ≥ 1.15), centred on portrait screens.

### Tone, vignette, grain (verbatim)

```glsl
  // tone, vignette, grain
  col = 1.0 - exp(-col * 1.25);
  col *= 1.0 - 0.38 * smoothstep(0.45, 1.25, length(p * vec2(0.85, 1.0)));
  float gr = hash(gl_FragCoord.xy + fract(uTime * 7.0) * 113.0) - 0.5;
  col += gr * 0.04;
  gl_FragColor = vec4(max(col, 0.0), 1.0);
```

- Exponential tone map with exposure 1.25.
- Vignette: up to 38% darker toward the corners (elliptical, x weighted 0.85).
- Animated film grain: ±0.02, re-seeded with `uTime` (real time, so grain keeps moving even under reduced motion when redrawn).

---

## Scroll coupling summary

| Scroll (viewport heights) | Effect |
|---|---|
| 0 | Hero look: lights clustered right of centre, strong warp, left side darkened, full brightness. Aurora off. |
| 0.55 | `heroZone` starts falling; `emerge` starts rising. |
| 0.85 | The first turn of the aurora (page y) at the left margin. |
| 1.25 | Aurora fully emerged (`emerge` = 1, times `uAur`). |
| 1.5 | `heroZone` = 0: field spread out, dimmed to 60%, flat across x. |
| any | Field noise drifts up 0.10 per vh scrolled; aurora is fixed to the page and scrolls with content. |

---

## Performance tiers (`src/lib/perf.ts`)

| | high | mid | low |
|---|---|---|---|
| Chosen when | desktop with ≥ 8 cores and ≥ 8 GB | other desktops; coarse-pointer or narrow (< 768 px) devices with ≥ 8 cores and ≥ 6 GB | other coarse-pointer or narrow devices (most phones) |
| Background resolution scale | 0.72 | 0.55 | 0.4 |
| fbm octaves (`uOct`) | 5 | 4 | 3 |

- `?tier=high|mid|low` in the URL forces a tier.
- Runtime downgrade: `reportFrame` samples frame times from the shared ticker; after **120** samples, if more than **45%** took over **26 ms**, the tier steps down one level (never up) and listeners (including the background, which re-runs `setQuality` and `resize`) are notified.
- Internal width is always capped at 1600 px.
- The aurora layers early-out per pixel (`layer` beyond 5% past the fold tip, `curtain` far from edge and rays), so most pixels evaluate little.
- `prefers-reduced-transparency: reduce` sets `uAur` to 0.6 (dimmer aurora).
- `prefers-reduced-motion: reduce` freezes motion time and limits redraws (see the tick).

## Phones

- Lower tier (usually `low`): 0.4 resolution scale, 3 octaves.
- `zigzag()`: margins 0.08 (narrower swing, A = 0.42) when `vw < 640`; legs at 50° on portrait screens, so with a 390 x 844 phone one leg drops about 0.46 vh.
- `uAurW` 0.55 on portrait (aspect < 0.8): rays, edge and glow are 55% as long in CSS px.
- `h-[100lvh]` keeps the canvas covering the screen as the browser chrome collapses.
- Touch: the cursor terms follow the last touch point (pointer events), and Lenis does not smooth touch (`syncTouch: false`).

---

## Appendix: noise helpers (verbatim)

```glsl
vec3 permute(vec3 x) { return mod(((x * 34.0) + 1.0) * x, 289.0); }
float snoise(vec2 v) {
  const vec4 C = vec4(0.211324865405187, 0.366025403784439, -0.577350269189626, 0.024390243902439);
  vec2 i = floor(v + dot(v, C.yy));
  vec2 x0 = v - i + dot(i, C.xx);
  vec2 i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
  vec4 x12 = x0.xyxy + C.xxzz;
  x12.xy -= i1;
  i = mod(i, 289.0);
  vec3 p = permute(permute(i.y + vec3(0.0, i1.y, 1.0)) + i.x + vec3(0.0, i1.x, 1.0));
  vec3 m = max(0.5 - vec3(dot(x0, x0), dot(x12.xy, x12.xy), dot(x12.zw, x12.zw)), 0.0);
  m = m * m; m = m * m;
  vec3 x = 2.0 * fract(p * C.www) - 1.0;
  vec3 h = abs(x) - 0.5;
  vec3 ox = floor(x + 0.5);
  vec3 a0 = x - ox;
  m *= 1.79284291400159 - 0.85373472095314 * (a0 * a0 + h * h);
  vec3 g;
  g.x = a0.x * x0.x + h.x * x0.y;
  g.yz = a0.yz * x12.xz + h.yz * x12.yw;
  return 130.0 * dot(m, g);
}
float fbm(vec2 p) {
  float s = 0.0, a = 0.5;
  for (int i = 0; i < 5; i++) {
    if (float(i) >= uOct) break;
    s += a * snoise(p);
    p = p * 2.03 + vec2(17.1, 9.2);
    a *= 0.5;
  }
  return s;
}

float hash(vec2 p) { return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453); }

// crisp value noise for the aurora's rays
float h21(vec2 p) { p = fract(p * vec2(233.34, 851.73)); p += dot(p, p + 23.45); return fract(p.x * p.y); }
float vn(vec2 p) {
  vec2 i = floor(p), f = fract(p), u = f * f * (3.0 - 2.0 * f);
  return mix(mix(h21(i), h21(i + vec2(1.0, 0.0)), u.x), mix(h21(i + vec2(0.0, 1.0)), h21(i + vec2(1.0, 1.0)), u.x), u.y);
}
```

- `fbm` loops a constant 5 times (GLSL ES 1.0 needs constant loop bounds) and breaks at `uOct`; lacunarity 2.03, gain 0.5.
- `hash` is the classic sine hash, used for grain.
- `h21`/`vn` is a cheap, crisp value noise with smoothstep interpolation, used for rays, clusters, masks and stars.

The fragment shader also begins with `precision highp float;` and the uniform declarations listed in the Uniforms table. Together with the sections above, this note reproduces `BG_FRAG` in full.
