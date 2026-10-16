---
tags:
  - selika
  - web-dev
  - react
  - animation
type: reference
status: active
date: 2026-10-09
source: selika site v8 source (branch v8-overhaul, final build 8.9), Projects/Selika Site/selika 8.9
key: Everything about the first screen of the Selika v8 site, covering the hero DOM layer (copy, line masks, split phrase, switchers, orb labels and feature cards), the Three.js mirror scene (geometry, shaders, HUD textures, hologram, Dev panes, feature orbs, sparks, product spin, scroll dive) and the preloader handoff, with every constant and a second-by-second entrance timeline. Read it before touching Hero.tsx, HeroScene.tsx, hud.ts, shaders.ts, heroBridge.ts or Preloader.tsx.
---

# Selika Site v8 - Hero and Mirror Scene

> [!abstract] Key
> Everything about the first screen of the Selika v8 site, covering the hero DOM layer (copy, line masks, split phrase, switchers, orb labels and feature cards), the Three.js mirror scene (geometry, shaders, HUD textures, hologram, Dev panes, feature orbs, sparks, product spin, scroll dive) and the preloader handoff, with every constant and a second-by-second entrance timeline. Read it before touching Hero.tsx, HeroScene.tsx, hud.ts, shaders.ts, heroBridge.ts or Preloader.tsx.

**Related:** [[Selika Site v8 - Build Bible]] | [[Selika Site v8 - Architecture and Stack]] | [[Selika Site v8 - Design System]] | [[Selika Site v8 - Sections and Copy]] | [[Selika Site v8 - Aurora Background]] | [[Selika Site v8 - Interactive Demo]] | [[Selika Site v8 - Assets and Provenance]] | [[Selika]]

---

## 1. Files and how they talk

| File | Role |
|---|---|
| src/components/Preloader.tsx | Counts the page in, morphs its ring into the mirror's outline, calls `enter()` |
| src/sections/Hero.tsx | DOM layer: scroll wrapper, copy, BigPhrase, switchers, OrbOverlay (labels and feature card), dive fades |
| src/gl/HeroScene.tsx | React Three Fiber canvas: Mirror, HoloVideo, DevPanes, Orbs, Rig, Spinner, Driver |
| src/gl/heroBridge.ts | Shared plain objects between WebGL and DOM: `orbScreen`, `mirrorRect`, `avoidRects`, `hitsMirror()`, `useHeroUI` store, `MIRROR`, `ORBS_WIDE`, `ORBS_TALL` |
| src/gl/hud.ts | Canvas drawings for the glass HUDs and the five Dev panes |
| src/gl/shaders.ts | GLSL for glass, halo, orb, icon, spark, pane, hologram video and burst points |
| src/lib/frame.ts | Per-frame values outside React: `pointer`, `scroll`, `world`, `hero`, `heroBox`, `vw`, `vh` |
| src/lib/motion.tsx | The single GSAP ticker that drives Lenis and every `addTick` callback (including the R3F canvas) |
| src/lib/store.ts | Zustand `useSite`: `product`, `switchCount`, `switching`, `entered`, `setProduct`, `toggleProduct`, `enter` |

Data flow every frame:

1. GSAP ticker (src/lib/motion.tsx) eases `frame.pointer.nx/ny` (`k = 1 - exp(-dt * 7.5)`), steps Lenis, then calls every `addTick` callback.
2. Hero's tick computes `frame.hero` (dive progress) from the wrapper's rect.
3. HeroScene's `Driver` calls R3F `advance(t)` (the canvas uses `frameloop="never"`), so the scene renders on the same clock, and only while the hero is active.
4. The Mirror writes `mirrorRect` (projected glass corners); Orbs write `orbScreen[i]` (x, y, r, alpha, z).
5. OrbOverlay's tick reads those to place labels and the feature card, and refreshes `avoidRects` from every `[data-avoid]` element; Orbs read `avoidRects` next frame to drift clear of the text.
6. BigPhrase's tick reads `mirrorRect.q` to split the phrase around the glass.

### `useSite` store (src/lib/store.ts)

| Field / action | Behaviour |
|---|---|
| `product` | `"beauty"` initially |
| `setProduct(p)` | No-op if unchanged; sets `document.documentElement.dataset.product = p` (swaps CSS `--accent`/`--accent2`), increments `switchCount`, sets `switching: true`, clears it after `1250` ms |
| `toggleProduct()` | Beauty to Dev and back |
| `entered` | `false` until the preloader calls `enter()` |

World colour (src/lib/motion.tsx): on a product change `frame.worldTarget` becomes 1 (Dev) or 0 (Beauty) and `gsap.to(frame, { world, duration: 1.15, ease: "power2.inOut", overwrite: true })` (0.01 s under reduced motion). Every hero colour mixes Beauty to Dev by `frame.world`.

---

## 2. Preloader handoff (src/components/Preloader.tsx)

### Markup

- Root `pointer-events-none fixed inset-0 z-[60]`, `role="status"`, `aria-label="Loading selika"`.
- `night` div: `pointer-events-auto absolute inset-0 bg-night` (blocks the page until it fades).
- Full-viewport SVG (`viewBox 0 0 vw vh`, `preserveAspectRatio="none"`): `track` path (`rgba(255,255,255,0.08)`, 1.5 px) and `line` path (`rgb(var(--accent2))`, 2 px, round cap, `pathLength={1}`, `strokeDasharray = "${min(1, n)} 1"`, glow `drop-shadow(0 0 6px rgb(var(--accent2) / 0.8))`).
- Centre: `Mark size={30}` in `text-accent2`, percentage label at `top-[4.6rem]` (`font-display text-[0.8rem] font-medium tracking-[0.08em] text-mute tabular`).

### Geometry

- `R0 = 46` px: the ring is drawn by `roundedQuad(ring(cx, cy, R0), R0)`, a rounded square whose corner radius equals half its side, which is a circle. Corners use the cubic arc constant `K = 0.5523`.
- `roundedQuad(corners, r)` clamps the radius to half the shortest side and draws `M B0 (L A C c1 c2 B) x4 Z`, so the same function draws both the circle and any skewed quad.

### Counting

| Constant | Value |
|---|---|
| Initial target | `0.15` |
| After `import("../gl/HeroScene")` resolves | target `max(target, 0.8)` |
| After fonts (`document.fonts.ready`) and the scene import both resolve | target `1` |
| Minimum count time | `cap = min(1, elapsed / 1150)` (reduced motion: cap 1) |
| Stall cap | after `6000` ms the goal is forced to 1 |
| Easing of the shown value | `cur += (goal - cur) * (1 - exp(-dt * 7))`, `dt` capped at 0.1 s |
| Snap | when goal is 1 and `cur > 0.995`, `cur = 1` |
| Pause before opening | `setTimeout(open, 140)` (0 under reduced motion) |

### `open()`

1. Reads `mirrorRect` (already written by the running scene). `seen = w > 60 && h > 60 && x0 > -vw && x1 < vw * 2`.
2. Fallback (reduced motion, mirror not on screen, or no SVG line): `enter()` at once and fade the whole preloader `opacity 0` over `0.6` s (`0.01` s reduced), `power2.inOut`, then unmount.
3. Normal path: morph from the centre ring's four corners (TL, TR, BR, BL) to the glass's projected corners `to = [q[6],q[7]] (TL), [q[4],q[5]] (TR), [q[2],q[3]] (BR), [q[0],q[1]] (BL)`, the corner radius going from `R0` to `rEnd = min(w, h) * 0.12`. One GSAP timeline:

| Time (s) | Tween |
|---|---|
| 0.00 | centre mark and % `opacity 0, scale 0.85`, `0.28` s, `power2.in` |
| 0.00 | track `opacity 0`, `0.3` s |
| 0.05 | morph `m.p` 0 to 1, `0.95` s, `expo.inOut`, redrawing the path every update |
| **0.42** | **`enter()`**: `useSite.entered = true`, the page entrance starts |
| 0.45 | night layer `opacity 0`, `0.85` s, `power2.inOut` (page fully visible at 1.30) |
| 1.00 | outline `opacity 0`, `0.7` s, `power1.out` (the mirror's own LED ring takes over) |
| 1.70 | timeline completes, preloader unmounts (`setDone(true)`) |

The hero scene is mounted under the preloader the whole time, so the glass is already in its pose when the outline lands on it.

---

## 3. Hero DOM layer (src/sections/Hero.tsx)

### Structure and z-order

```tsx
<div ref={wrap} id="top" data-stream="0" className="relative h-[190svh] md:h-[220svh]">
  <div className="sticky top-0 h-[100svh] overflow-hidden">
    <div ref={fade} className="absolute inset-0"><BigPhrase /></div>              {/* behind */}
    <div ref={stage} className="absolute inset-0 z-10"><HeroScene active /></div> {/* SceneBoundary fallback StaticMirror */}
    <OrbOverlay />                                                               {/* z-30 */}
    <motion.div className="pointer-events-none absolute inset-0 z-20" ...>      {/* fades in on entered */}
      <HeroFade> copy, desktop switcher, mobile switcher </HeroFade>
    </motion.div>
  </div>
</div>
```

- Shared easing: `const ease = [0.16, 1, 0.3, 1]`.
- `HeroScene` is `lazy(() => import("../gl/HeroScene"))` inside `Suspense fallback={null}` and `SceneBoundary` (fallback `StaticMirror`: a `sg-glass sg-glass-strong rounded-[2.6rem] p-6` card with the product's `MiniMirror` at `h-[38svh]`, placed `pt-[22svh] lg:pl-[18vw] lg:pt-0`).
- `active` comes from an IntersectionObserver on the wrapper with `rootMargin: "100px"`; the canvas stops rendering when the hero is off screen.
- Overlay wrapper: `initial { opacity: 0 }`, `animate { opacity: entered ? 1 : 0 }`, `duration 0.35, ease`.

### Positions

| Element | Phones and tablets (below `lg`, 1024 px) | Desktop (`lg` and up) |
|---|---|---|
| Copy (`copyRef`) | `absolute left-5 right-5 top-[calc(var(--nav-h)+1.25rem)]`, `sm:left-8` | `lg:left-[5vw] lg:right-auto lg:top-[19svh]` |
| Desktop switcher | hidden | `absolute right-[4vw] top-[calc(var(--nav-h)+1.5rem)]` |
| Mobile switcher (`switchRef`) | `absolute bottom-[max(1.25rem,env(safe-area-inset-bottom))] left-0 right-0 flex justify-center px-5` | `lg:hidden` |
| BigPhrase | hidden | `absolute inset-x-0 bottom-[4svh] z-0` |
| Body paragraph | hidden below `sm` | shown |
| "Meet ..." button | hidden below `sm` | shown |

**Portrait band.** A ResizeObserver (on copy and switcher) plus `resize` writes `frame.heroBox.top = copy.offsetTop + copy.offsetHeight` and `frame.heroBox.bottom = switcher.offsetTop` (or `innerHeight` if the switcher is not laid out). Skipped while the copy is under 80 px tall. The Rig fits the mirror into this band below 1024 px; labels must stay inside it.

### HeroCopy

- `AnimatePresence mode="wait"` keyed by product; `initial="out"`, `animate={entered ? "in" : "out"}`, `exit="gone"`; container `max-w-[36rem]`.
- `<h1 data-avoid className="h-display w-fit text-[clamp(2.6rem,4.6vw,5.6rem)] text-ink">` with two lines.
- **Line masks with the italic-overhang fix** (commit `d5ffbca` "Stop the hero headline's line masks clipping italic overhangs"): each line sits in

```tsx
<span className="-mx-[0.14em] -mb-[0.08em] block overflow-hidden px-[0.14em] pb-[0.16em]">
  <motion.span className={`block ${i === 1 ? "accent-word" : ""}`} variants={...}>{line}</motion.span>
</span>
```

  The mask is padded `0.14em` left and right and `0.16em` at the bottom, and negative margins (`-0.14em` sides, `-0.08em` bottom) take the space back, so layout is unchanged but the italic serif's overhangs and descenders (the tail of the "g" in "guides") are not clipped by `overflow-hidden`.

| Part | `out` | `in` | `gone` (product switch exit) |
|---|---|---|---|
| Headline line i | `y: "125%"`, `blur(10px)` | `y: "0%"`, `blur(0px)`, `0.9` s, delay `0.08 + i * 0.08`, `ease` | `y: "-60%"`, `opacity 0`, `blur(8px)`, `0.28` s, `ease [0.7, 0, 0.84, 0]` |
| Body (`body-lg mt-6 max-w-[27rem]`, `data-avoid`) | `opacity 0, y 12, blur(6px)` | to rest, `0.8` s, delay `0.22` | `opacity 0`, `0.2` s |
| Buttons row (`mt-6 sm:mt-8`, `data-avoid`) | `opacity 0, y 10` | to rest, `0.7` s, delay `0.32` | `opacity 0`, `0.15` s |

- Buttons: accent `Button` with `lens`, text `P.cta`, scrolls `lenis.scrollTo("#demo", { duration: 1.6 })`; glass `Button` `Meet {other.name}` calls `toggleProduct`.

### BigPhrase (split around the mirror)

- `P.big[0]` is split on spaces: `first` goes left, the rest plus the accent `P.big[1]` go right. Beauty: `Guided` | `on you.`; Dev: `Built` | `by you.`
- Both spans: `h-display absolute left-0 top-0 whitespace-nowrap text-[clamp(4.5rem,8vw,9rem)] leading-[0.9] text-white/95 opacity-0`, `data-avoid`; left `origin-right`, right `origin-left`. Container `relative h-[clamp(4.5rem,8vw,9rem)]`.
- Per-frame placement (addTick, re-registered per product):
  - Height sampled at `y = left.top + left.offsetHeight * 0.55`.
  - Glass edges at that height interpolated along the left edge (corners 0 BL to 3 TL) and the right edge (2 TR to 1 BR); `xl` = min, `xr` = max.
  - Smoothing: `k = 1` on the first frame, then `1 - exp(-dt * 2.2)`.
  - `gap = 0.018 * vw`, `minX = 0.05 * vw`, `maxX = 0.965 * vw`.
  - Scale each side to fit, clamped `0.35` to `1`: `sl = (sm.l - gap - minX) / L.offsetWidth`, `sr = (maxX - sm.r - gap) / R.offsetWidth`; both use `sc = min(sl, sr)`.
  - `L: translate3d(sm.l - gap - L.offsetWidth, 0, 0) scale(sc)`; `R: translate3d(sm.r + gap, 0, 0) scale(sc)`; then opacity set to 1.
- Entrance: `initial { opacity 0, y 30, blur(16px) }`, on `entered` to rest over `1.1` s, delay `0.55`, `ease`; exit `{ opacity 0, y -20, blur(12px) }` in `0.3` s.

### Desktop ProductSwitcher

- `data-avoid` column; `role="radiogroup" aria-label="Choose a product"` with two `SwitchCard`s, then two `lg-glass h-10 w-10` chevron buttons (`Previous product` ChevronUp, `Next product` ChevronDown), both calling `toggleProduct`.
- Entrance: `initial { opacity 0, x 48, blur(8px) }`, to rest on `entered`, `0.9` s, delay `0.5`, `ease`.
- **SwitchCard** (`motion.button role="radio" aria-checked`): `lg-glass w-[10.25rem] rounded-[1.7rem] px-3 pb-4 pt-4`, contains `.lg-spec`, `.lg-sheen` (hover sweep `lg-sweep 1.1s`), the `MiniMirror` SVG (`viewBox 0 0 60 82`, `h-[4.6rem]`, Beauty colour `#B9A9FF`, Dev `#8EC5FF`; lifts `-translate-y-0.5 scale-[1.07]` on hover), the product name (`text-[0.98rem]`) and `card` caption (`text-[0.7rem] text-mute`).
  - Tilt: `rotateY = (px - 0.5) * 18`, `rotateX = -(py - 0.5) * 16`, springs `240 / 18`, `transformPerspective 700`; sets `--mx/--my`.
  - `whileHover { scale 1.05, y -4 }`, `whileTap { scale 0.95 }`, spring `380 / 24`.
  - Selected: `lg-glass-dark` with `shadow-[0_18px_50px_-18px_rgb(var(--accent)/0.8)]` and a ring `motion.span layoutId="switch-ring"` (`border-accent2/70`, spring `300 / 30`). Unselected: `opacity-75 hover:opacity-100`.

### MobileSwitcher

- `sg-glass grid h-12 w-full max-w-[22rem] grid-cols-2 rounded-full p-1`, `role="radiogroup"`; white thumb `layoutId="m-switch"`, spring `380 / 32`; text `text-night` selected, `text-ink/80` otherwise.
- Entrance: `initial { opacity 0, y 24 }` to rest on `entered`, `0.8` s, delay `0.55`.

### OrbOverlay: labels and the feature card

`pointer-events-none absolute inset-0 z-30`. Holds 14 labels (7 Beauty features then 7 Dev features, index matches the orb index) and one card.

**Labels** (`font-mono text-[0.62rem] uppercase tracking-[0.14em] text-ink/75`, `transition-opacity duration-300`). Each frame:

1. `avoidRects` is cleared and, only while `frame.hero < 0.3`, refilled from every visible `[data-avoid]` element padded by 6 px sideways and 4 px vertically.
2. Orbs are processed nearest first (sort by `orbScreen[i].z` descending).
3. Alpha: 0 if the orb's centre is on the glass (`hitsMirror([x,y,x,y], 0)`) or the orb is not the current product's; else `s.alpha * (1 - min(1, frame.hero * 4))` (labels gone by 25% of the dive).
4. Candidate positions: below at `y + r + 10`, above at `y - r - 22`, each with sideways offsets `0, 22, 44` px away from the mirror's centre. Last frame's choice is tried first so labels do not hop.
5. A candidate rect `[x - w/2 - 6, y - 4, x + w/2 + 6, y + 16]` fails if it leaves the screen (2 px sides, top below 72 px, 6 px bottom), leaves the portrait band (below 1024 px when `heroBox.bottom > 0`), hits the mirror (`hitsMirror(r)` with default pad 4), another placed label, an avoid rect, or another orb of the product (closest-point distance `< r + 2`).
6. If nothing fits, the label hides. Shown opacity `min(1, a * 1.2)`, and 0 for the orb whose card is open.

**`hitsMirror(r, pad = 4)`** (heroBridge.ts): separating-axis test between the padded rect and the projected glass quad, using axes (1,0), (0,1) and the four edge normals.

**Card visibility logic**

- `fine = matchMedia("(hover: hover) and (pointer: fine)")`, evaluated once.
- `shown`: on touch, the selected orb if any, else the hovered one; on fine pointers, the hovered one. When nothing is hovered and the pointer is not on the card, `shown` clears after a **90 ms grace** (`setTimeout(..., 90)`), long enough to cross from bubble to card.
- **Bridge div** (fine pointers only): an invisible `pointer-events-auto` strip inside the card container that spans the gap between the card and the bubble (reaching to `0.35 * r` inside the bubble), sized each frame for the side, below or above placement, so the pointer never leaves "bubble or card" while travelling.
- **`holdCard`** (ref): true while the pointer is on the card container. While held, the card stops following the bubble; it only moves up if expanding it would run off the bottom (`y = min(P.y, vh - ch - 12)`).
- Product change resets `shown` and `cardHover`. A new focus closes the detail.
- Fine pointers: clicking the bubble (sets `selected`) opens the detail of the focused card, then clears `selected`. Touch: tapping a bubble selects it (card pinned); the card button toggles detail; tapping empty canvas (`onPointerMissed`) clears the selection.

**Card placement** (when not held), card `w-[18.5rem]`, `gap = 16`:

- `out = -1` if the bubble is left of the mirror's centre, else `+1` (the card always goes away from the glass).
- `cy(y) = clamp(y, 76, vh - ch - 12)`, `cx(x) = clamp(x, 12, vw - cw - 12)`.
- `ax = cx(out < 0 ? s.x + s.r - cw : s.x - s.r)` (flush with the bubble's outer side).
- Candidates in order:

| Side | x | y |
|---|---|---|
| `side` | `out < 0 ? s.x - s.r - gap - cw : s.x + s.r + gap` | `cy(s.y - ch / 2)` |
| `below` | `ax` | `s.y + s.r + gap` |
| `above` | `ax` | `s.y - s.r - gap - ch` |

- A candidate is accepted if inside `12` px side margins, `y >= 76`, `y + ch <= vh - 12`, and `clear`: `mirrorRect.x1 <= 0 || !hitsMirror([x, y, x + cw, y + ch], 6)`. Fallback: `[cx(side.x), side.y, "side"]`.

**Card content and motion**

- `lg-glass lg-glass-deep rounded-[1.6rem] p-5`, `.lg-spec` follows the pointer.
- Icon chip `h-10 w-10 rounded-full bg-accent/25 text-accent2`, label `text-[1.15rem]`, `short` `text-[0.9rem] text-ink/90`, `detail` `text-[0.88rem] text-ink/80`.
- Enter `{ opacity 0, scale 0.94, y 6 }` to rest in `0.32` s `ease`; exit `{ opacity 0, scale 0.96 }` in `0.15` s.
- Detail expands `height 0 to auto`, `opacity`, `marginTop 0 to 10`, `0.35` s `ease`.
- Button `More detail` / `Show less` (`aria-expanded`), `.detail-btn` pulses twice on arrival (`detail-pulse 1.6s cubic-bezier(.16,1,.3,1) .35s 2`, a ring growing to 12 px), chevron rotates 180 degrees when open.

### The dive (scroll sequence)

`frame.hero = clamp01(-wrap.top / (wrap.height - innerHeight))`. With `h-[190svh]` on phones and `h-[220svh]` from `md`, the dive spans `90svh` or `120svh` of scroll. The next section (`#problem`) has `-mt-[40svh] md:-mt-[50svh]` and `z-10`, so it rides up over the end of the dive.

| `frame.hero` | DOM effect (Hero.tsx) |
|---|---|
| 0 to 0.18 | HeroFade (copy and switchers): `opacity = 1 - h / 0.18`, `blur((1 - o) * 10px)`, `visibility hidden` at 0 |
| 0 to 0.22 | BigPhrase layer: `opacity = 1 - h / 0.22`, `blur((1 - o) * 12px)` |
| 0 to 0.25 | Orb labels fade (`1 - h * 4`) |
| below 0.3 | `avoidRects` refreshed; above it they are empty |
| 0.84 to 0.97 | Scene stage `opacity = 1 - (h - 0.84) / 0.13` |

The 3D side of the dive is in section 5.

---

## 4. Mirror scene (src/gl/HeroScene.tsx)

### Canvas

```tsx
<Canvas frameloop="never" dpr={dprFor(tier)}
  gl={{ antialias: tier !== "low", alpha: true, powerPreference: "high-performance" }}
  camera={{ fov: 30, position: [0, 0, 4.35], near: 0.05, far: 40 }}
  style={{ position: "absolute", inset: 0 }}
  onPointerMissed={() => useHeroUI.getState().setSelected(-1)}>
```

- `dprFor`: high `[1, 1.75]`, mid `[1, 1.4]`, low `[0.8, 1.15]` (src/lib/perf.ts).
- Tier: `?tier=` override; coarse or narrow (`< 768`) devices are `mid` with 8+ cores and 6+ GB, else `low`; desktops are `high` with 8+ cores and 8+ GB, else `mid`. It steps down at runtime when more than 45% of 120 frames exceed 26 ms.
- Environment (`resolution 128`, `frames 1`) Lightformers:

| form | intensity | position | scale | color |
|---|---|---|---|---|
| rect | 3 | [-3, 2.5, 3] | [5, 1.4, 1] | #ffffff |
| rect | 1.6 | [3.5, -1, 2] | [3, 1.2, 1] | #c7bbff |
| rect | 1.2 | [0, 3, -3] | [6, 1, 1] | #8ec5ff |
| ring | 0.8 | [0, 0, -5] | 5 | #4d8dff |

- Lights: directional `[-3, 4, 5]` 1.4 `#ffffff`; directional `[4, -2, 3]` 0.7 `#c9c0ff`; ambient 0.25.
- Children: `Driver`, `Rig`, `Spinner`, `Environment`, lights, `Mirror`, `Orbs`.

### Colour sets (`COLORS`)

| Key | Beauty (RGB 0 to 1) | Dev (RGB 0 to 1) | Used for |
|---|---|---|---|
| c1 | 0.545, 0.486, 1.0 | 0.302, 0.553, 1.0 | glass glow blob 1 |
| c2 | 0.69, 0.486, 1.0 | 0.557, 0.773, 1.0 | glass blob 2, scan tint, orbs, icons, sparks |
| deep | 0.2, 0.12, 0.52 | 0.05, 0.16, 0.47 | orb body |
| led | 0.78, 0.7, 1.0 | 0.66, 0.84, 1.0 | LED ring and halo |

All mixed by `frame.world`. Glow materials use `glowBlend()`: `CustomBlending`, `AddEquation`, src `One`, dst `One`, src alpha `Zero`, dst alpha `One`, transparent, no depth write; light is added without touching canvas alpha so it composites over the aurora.

Helpers: `ease(t)` is cubic in-out (`t < 0.5 ? 4t^3 : 1 - (-2t + 2)^3 / 2`); `smooth(a, b, v)` is smoothstep.

### `MIRROR` constants (src/gl/heroBridge.ts)

```ts
export const MIRROR = { w: 1.05, h: 1.75, bezel: 0.046, corner: 0.15, depth: 0.03, bevel: 0.012 };
```

| Derived | Value |
|---|---|
| Glass width `gw = w - 2 * bezel` | 0.958 |
| Glass height `gh = h - 2 * bezel` | 1.658 |
| Glass corner `corner - bezel * 0.7` | 0.1178 |
| Front face `front = depth / 2 + bevel` | 0.027 |
| HUD canvas `HUD_W x HUD_H` | 1024 x 1772 (`round(1024 * gh / gw)`) |

### Geometry and materials (Mirror component)

| Mesh | Geometry | Material | z / order |
|---|---|---|---|
| Halo | plane 4.2 x 4.2 | `HALO_FRAG`, glow blend; `uHalf = (w/2/4.2, h/2/4.2)`, `uRadius = corner/4.2` | z -0.3, renderOrder -1 |
| Body | `ExtrudeGeometry` of a rounded rect `(w - 2 bevel) x (h - 2 bevel)`, radius `corner - bevel`; `depth 0.03`, bevel thickness and size `0.012`, `bevelSegments 4`, `curveSegments 40`; translated `-depth/2` | `MeshPhysicalMaterial` color `#454a60`, metalness 0.72, roughness 0.26, clearcoat 1, clearcoatRoughness 0.18, envMapIntensity 1.5 | 0 |
| LED ring | rounded rect `gw + 0.016` x `gh + 0.016` (radius `+0.008`) with a hole `gw + 0.004` x `gh + 0.004` (radius `+0.002`), 40 segments | `MeshBasicMaterial`, `toneMapped: false` | `front + 0.0008` |
| Glass | `ShapeGeometry` rounded rect `gw x gh`, 40 segments, UVs normalised to its bounding box | `GLASS_FRAG` | `front + 0.0015` |
| Hologram (Beauty) | the glass geometry again | `HOLOVID_FRAG`, glow blend | `front + 0.0022`, renderOrder 2 |
| Burst points (Beauty dive) | sampled points | `BURST_*`, glow blend | renderOrder 3, no frustum culling |
| Dev panes | 5 planes | `PANE_*`, glow blend | `front + pane.z`, renderOrder 3 |

**LED ring and halo per frame**

- `pulse = 0.85 + 0.15 * sin(1.6 t)`.
- LED colour = `led * (0.55 + 0.75 * reveal) * pulse`.
- Halo colour = `led`, strength `(0.22 + 0.28 * reveal) * pulse * (1 - recede * 0.7)`.
- `HALO_FRAG`: distance `d` outside a rounded box; glow `exp(-d * 9) * 0.55 + exp(-d * 26) * 0.6`.

**Glass reveal**: once `entered` and the HUD textures exist, `gsap.to(reveal, { v: 1, duration: 2.2, ease: "power2.out", delay: 0.25 })` (0.01 s reduced motion).

### Pose (Mirror `useFrame`)

```ts
const dive = ease(smooth(0.04, 0.5, frame.hero));
const recede = ease(smooth(0.3, 0.95, frame.hero));
const ty = (-0.3 + p.nx * 0.3) * (1 - dive);   // three-quarter turn toward the copy, follows cursor
const tx = (0.06 - p.ny * 0.16) * (1 - dive);
const k = 1 - Math.exp(-dt * 4);                // rotation easing
rotation = (rot.x, rot.y + spin, (-0.05 + sin(0.4 t) * 0.012) * (1 - dive));
const xOff = aspect > 1.15 && width >= 1024 ? 0.3 : 0;
position = (xOff * (1 - dive) + p.nx * 0.05 * (1 - dive),
            sin(0.6 t) * 0.022 * (1 - dive) + (aspect < 1 ? 0.04 : 0) * (1 - dive),
            -recede * 1.6);
scale = 1 - recede * 0.18;
```

**`mirrorRect` projection**: every frame the glass outline corners `(+-w/2, +-h/2, 0)` (the body's full size) are transformed by the group's world matrix, projected, and written to `mirrorRect.q` in the order 0 bottom-left, 1 bottom-right, 2 top-right, 3 top-left, plus the bounding box `x0, y0, x1, y1`, all in CSS px.

### Rig (camera)

| Aspect | Base camera z |
|---|---|
| `>= 1.15` | 4.35 |
| `>= 0.8` | 5.2 |
| else | `min(8.4, 3.55 / aspect)` |

- Below 1024 px wide with a band taller than 160 px: `top = heroBox.top + 6`, `bottom = heroBox.bottom - 6`, `tall = aspect < 1`; `ppu = min((bottom - top) / (tall ? 2.2 : 2.0), width / (tall ? 2.05 : 2.4))`; `z0 = height / ppu / (2 * tan(15 deg))`; `y0 = ((top + bottom) / 2 - height / 2) / ppu`.
- Smoothing: snap on the first frame, then `1 - exp(-dt * 5)`.
- Dive: `d = ease(smooth(0, 0.5, frame.hero))`; `cam.position = (0, y * (1 - d), z * (1 - 0.2 * d))`, looking at `(0, y * (1 - d), 0)`.

### Glass shader (`GLASS_FRAG`, src/gl/shaders.ts)

Colours are designed in display space; these materials skip tone mapping.

| Term | Formula |
|---|---|
| Parallax origin | `rp = uv - 0.5 + uMouse * (-0.07, -0.05)` |
| Base | `vec3(0.020, 0.022, 0.034)` |
| Glow blob 1 | `uC1 * 0.24 * exp(-|rp - (-0.30, 0.30)|^2 * 7)` |
| Glow blob 2 | `uC2 * 0.15 * exp(-|rp - (0.28, -0.22)|^2 * 6)` |
| Bottom lift | `vec3(0.055, 0.06, 0.08) * (1 - uv.y) * 0.45` |
| Sheen | `d = (uv.x * 0.78 + uv.y * 0.62) - 0.74 - uMouse.x * 0.24 + uMouse.y * 0.08`; add `vec3(0.95, 0.97, 1.0) * (exp(-d^2 * 260) * 0.15 + exp(-d^2 * 14) * 0.045)` |
| HUD | `mix(uHud0, uHud1, uWhich)`; while spinning (`uSmear > 0.01`) a 5-tap horizontal smear with offset `0.03 * uSmear`, weights 0.34, 0.22, 0.22, 0.11, 0.11 |
| Scan line | `exp(-((uv.y - (1 - fract(uTime * 0.07))) * 22)^2)`: a band sweeping down about every 14.3 s |
| Reveal | `rv = 1 - smoothstep(uReveal * 1.25 - 0.2, uReveal * 1.25, 1 - uv.y)`: the HUD appears top to bottom |
| HUD add | `h.rgb * h.a * rv * (0.94 + 0.06 sin(1.7 t)) * (1 + scan * 0.45)`, plus `uC2 * scan * 0.05 * rv` |
| Edge | `edge = min(e.x * 1.4, e.y)`; darken `0.82 + 0.18 * smoothstep(0, 0.06, edge)`; lit bevel `+0.07 * (1 - smoothstep(0, 0.01, edge))` |

### HUD textures (src/gl/hud.ts)

Fonts (`loadHudFonts` waits for Outfit 300/500/400, Plus Jakarta Sans 500, Geist Mono 400): `display` and `caps` = Outfit Variable, `body` = Plus Jakarta Sans Variable, `mono` = Geist Mono. Canvas textures get anisotropy `min(8, max)`, mipmaps, `LinearMipmapLinearFilter`.

**Status bar (both):** `selika` at (70, 96) Outfit 500 38 px `rgba(255,255,255,0.86)`; left tag at (196, 95) caps 500 19 px, accent, letter-spacing 3; right tag right-aligned at `HUD_W - 70`, caps 400 19 px `rgba(255,255,255,0.62)`, spacing 2; rule at y 122, `HUD_W - 140` wide, 1.5 px, `rgba(255,255,255,0.12)`.

**Beauty HUD** (accent `A2 = #D9B8FF`):

| Item | Values |
|---|---|
| Status | `BEAUTY` / `5000K · CRI 95+` |
| Viewfinder brackets | (120, 210) to (`HUD_W - 120`, `HUD_H - 470`), arm 46 px, 3 px, `rgba(217,184,255,0.55)` |
| Labels | `FACE MAPPED` (150, 262) and `LIVE` (right, `HUD_W - 150`), caps 17 px |
| Step card | `y0 = HUD_H - 340`; rounded rect (70, y0, `HUD_W - 140`, 250), radius 34, fill `rgba(255,255,255,0.05)`, stroke `rgba(255,255,255,0.16)` 2 px |
| Card text | `STEP 3 OF 5 · EYES` (caps 21, A2), `Flick the liner out` (Outfit 500 56 px, white), `Follow the line from the outer corner.` (body 500 27 px, 0.62 white) |
| Progress | 5 pills 70 x 8 at x `118 + i * 82`, first three A2 |
| Voice meter | 7 bars heights `14, 30, 52, 38, 58, 26, 16` at `HUD_W - 150`, label `LISTENING` |

**Dev HUD** (accent `#A9D3FF`): status `DEV` / `5 MODULES · LOCAL`; three permission chips at `x = 64 + i * 300`, `y = HUD_H - 150`, 280 x 66, radius 33: `CAMERA · OFF` (grey dot), `MIC · ON`, `CALENDAR · ON` (accent dots).

**`DEV_PANES`** (mirror units, canvases at 900 px per unit, the glass's inner half-width is about 0.48):

| id | x | y | w | h | z |
|---|---|---|---|---|---|
| clock | -0.17 | 0.5 | 0.46 | 0.3 | 0.036 |
| weather | 0.235 | 0.52 | 0.29 | 0.22 | 0.04 |
| calendar | -0.17 | 0.13 | 0.46 | 0.34 | 0.04 |
| build | 0.235 | 0.13 | 0.29 | 0.34 | 0.036 |
| code | 0.0175 | -0.33 | 0.785 | 0.44 | 0.038 |

Each pane canvas: rounded rect inset 4 px, radius 34, fill `rgba(160,200,255,0.06)`, stroke `rgba(169,211,255,0.55)` 3 px with a `rgba(127,178,255,0.8)` glow (blur 14); label at (36, 58) caps 19 px `#A9D3FF`. Content strings are listed in [[Selika Site v8 - Sections and Copy]] section 16. Pane textures use `SRGBColorSpace`.

### HoloVideo (Beauty hologram)

- Source `/visuals/holo.mp4` (looping, muted, `playsInline`, `preload auto`), poster `/visuals/holo.jpg`, both via `pub()` for content-hashed URLs. Made with Higgsfield (file comment).
- The `<video>` is appended to `document.body` as a fixed 1 x 1 px, opacity 0 element because some mobile browsers only autoplay attached videos.
- The poster texture is used until the video's `loadeddata`, then a `VideoTexture` (linear filters, no mipmaps).
- **Mapping:** `vh = 1.7`, `vw = vh * (716 / 1284) = 0.948` mirror units (the clip is 716 x 1284). `uMap = (0.5 - vw / gw / 2, (gh - 0.09) / gh, vw / gw, vh / gh)` = `(0.0052, 0.9457, 0.9895, 1.0253)`: centred, almost full glass width, top `0.09` below the glass top (just under the status bar); it is slightly taller than the glass, so the bottom is cut by the glass shape.
- `HOLOVID_FRAG`: maps glass UV into video UV, discards outside; crushes black `c = max(c - 0.035, 0) * 1.12`; scan band `exp(-((v.y - (fract(t * 0.11) * 1.3 - 0.15)) * 24)^2)` adds up to 55%; flicker `0.97 + 0.03 * sin(21 t) * sin(3.3 t)`; top-down reveal like the glass.
- Visibility `vis` eases toward 1 while `which.v < 0.5` (Beauty) with `1 - exp(-dt * 10)`.
- `uAlpha = vis * (1 - dissolve) * (1 - smear * 0.6)`, `dissolve = smooth(0.07, 0.22, frame.hero)`.
- Reveal: on `entered`, `gsap.to(reveal, { v: 1, duration: 2.4, ease: "power2.out", delay: 0.45 })`.
- Plays only while `active && !reducedMotion && vis > 0.02 && dissolve < 0.99`.

### Light-point dissolve (the dive, Beauty)

- Built once from the poster: drawn to a 200 px wide canvas; point count by tier `high 9500`, `mid 7000`, `low 3600`; up to `n * 60` random tries; a pixel is kept with probability `pow(max(0, lum - 0.06) * 1.3, 1.1)` (bright pixels only).
- Position on the glass from the same `uMap`, z `0.004` to `0.016`; colour = pixel RGB `* 1.6` clamped; `aRand` random.
- Uniforms: `uSize 0.0056`, `uPx = height * pixelRatio / (2 * tan(15 deg))`, `uBurst = smooth(0.1, 0.8, hero)`, `uAlpha = vis * smooth(0.02, 0.12, hero)`.
- `BURST_VERT`: direction `normalize(vec3(rel.xy * 3.2, 1.0) + jit * 0.8)` (outward and toward the camera); displacement `dir * uBurst^2 * (-c0.z) * (0.5 + aRand * 0.8)`; point size `uSize * (1 + uBurst * 2.4) * uPx / max(0.2, -mv.z)`; twinkle `0.82 + 0.18 sin(t * (1.5 + aRand * 2) + aRand * 30)`; fade `1 - smoothstep(0.55, 1.0, uBurst)`.
- `BURST_FRAG`: soft disc squared, colour `* 1.5`.
- Net effect: points fade in over the face from 2% to 12% of the dive while the video dissolves from 7% to 22%, then fly at the viewer from 10% to 80% and are gone by the end.

### DevPanes (Dev modules)

- `vis` eases toward 1 while `which.v > 0.5`, `1 - exp(-dt * 10)`; meshes hidden below 0.01.
- `burst = smooth(0.16, 0.82, hero)`; per pane `b = burst^2 * (0.9 + i * 0.12)`.
- Position: `x * (1 + b * 1.6)`, `y * (1 + b * 1.2) + sin(0.55 t + 1.3 i) * 0.006`, `front + z + sin(0.6 t + i) * 0.006 + b * 2.6`.
- Alpha `vis * (1 - smooth(0.6, 0.95, hero))`, 0 until textures exist.
- `PANE_FRAG`: scan lines `0.9 + 0.1 sin(vUv.y * 40 - 2 t + uSeed)`, `uSeed = i * 1.7`, colour `* 1.15`.

### Spinner (product switch)

```ts
gsap.to(o, { p: 1, duration: 1.55, ease: "power3.inOut",
  onUpdate: () => {
    spin.current = start + o.p * Math.PI * 4;          // two full turns
    which.current.smear = Math.sin(o.p * Math.PI) ** 2; // HUD smear peaks mid-spin
    if (!swapped && o.p > 0.5) { swapped = true; which.current.v = target; } // swap HUD at the midpoint
  },
  onComplete: () => { spin.current = 0; which.current.smear = 0; } });
```

First render sets `which.v` without spinning; reduced motion swaps instantly.

---

## 5. The dive in 3D (all thresholds)

| Range of `frame.hero` | Effect |
|---|---|
| 0 to 0.5 | Camera eases in (`z * (1 - 0.2 d)`) and centres vertically |
| 0.04 to 0.5 | Mirror turns square-on, stops following the cursor, x offset goes to 0 |
| 0.02 to 0.12 | Light points fade in (Beauty) |
| 0.07 to 0.22 | Hologram video dissolves |
| 0.08 to 0.7 | Orbs spread outward (`base * (1 + dive * 1.6)`), `HOME.xOff` goes to 0, avoidance shift fades |
| 0.1 to 0.8 | Light points fly out toward the viewer |
| 0.16 to 0.82 | Dev panes fly apart and toward the camera |
| 0.2 to 0.55 | Orbs fade out |
| 0.3 to 0.95 | Mirror recedes (`z -1.6`, scale to 0.82), halo dims by up to 70% |
| 0.6 to 0.95 | Dev panes fade |
| 0.84 to 0.97 | Whole scene stage fades (DOM) |

---

## 6. Feature orbs (Orbs component)

### Layouts (src/gl/heroBridge.ts), relative to the mirror centre

`ORBS_WIDE` (aspect `>= 1`):

| slot | p | r |
|---|---|---|
| 0 | [-0.6, 0.61, 0.42] | 0.105 |
| 1 | [-0.62, 0.09, 0.5] | 0.11 |
| 2 | [-0.6, -0.43, 0.42] | 0.105 |
| 3 | [0.68, 0.66, 0.36] | 0.1 |
| 4 | [0.71, 0.25, 0.46] | 0.105 |
| 5 | [0.7, -0.165, 0.4] | 0.105 |
| 6 | [0.68, -0.58, 0.42] | 0.1 |

`ORBS_TALL` (aspect `< 1`):

| slot | p | r |
|---|---|---|
| 0 | [-0.74, 0.8, 0.42] | 0.15 |
| 1 | [0.76, 0.58, 0.36] | 0.135 |
| 2 | [-0.76, -0.56, 0.5] | 0.13 |
| 3 | [0.72, -0.72, 0.32] | 0.15 |
| 4 | [0.02, 1.04, -0.42] | 0.1 |
| 5 | [-0.06, -1.02, 0.46] | 0.11 |
| 6 | [0.86, 0.04, -0.52] | 0.1 |

- 14 orbs: index 0 to 6 are Beauty's features, 7 to 13 Dev's, slot `i % 7`, in content order (guided, light, voice, tryon, presets, creators, shutter / modules, models, agents, voice, perms, hardware, ecosystem).
- Narrow screens (`width < 640`): positions `* 0.92`, radius `* 1.12`.
- Each orb is a group: a sphere (`sphereGeometry [1, 48, 32]`, `ORB_*` shader, transparent, no depth write) and an icon plane (`1.05 x 1.05`, `ICON_*`, glow blend, renderOrder 2) always turned to face the camera.
- Icon atlas: the 14 lucide icons rasterised (`iconAtlas(icons, 128, "#ffffff", 1.4)`), 4 x 4 cells (`cols = ceil(sqrt(14))`), padding `0.16 * cell`.

### Constants

| Name | Value | Meaning |
|---|---|---|
| `RISE` | 2.9 | world units below its place where a bubble starts (below the screen) |
| `HOME.xOff` | 0.3 on wide desktop (`aspect > 1.15 && width >= 1024`), else 0, times `(1 - dive)` | sideways layout offset, matches the mirror's |
| `MAX_SPARKS` | 220 | spark pool size |
| Entrance delay | `0.95` s first time, `0.18` s on a product switch | before the first bubble launches |
| Stagger | `0.055` s per bubble | |
| Rise | `appear` 0 to 1, `0.78` s, `back.out(1.05)` (overshoots about 4%) | |
| Kick | set to 1 on start; tween to 0 over `1.1` s `power2.out` starting `d + 0.3` | stiffer spring while flying |
| Arrival spark | `delayedCall(d + 0.5)`, 10 sparks, only if the product has not changed | |
| Exit pop | `pop` 0 to 1, `0.24` s `power2.in`, stagger `0.03` s, then 16 sparks and park | for the outgoing product's visible bubbles |

### Launch vectors (per flight)

```ts
const out = (o.base.x < 0 ? -1 : 1) * (Math.random() < 0.8 ? 1 : -1);   // mostly away from the mirror
o.from.set((Math.random() - 0.5) * 0.6, -(RISE + Math.random() * 0.5), 0);
o.scat.set(out * (0.18 + Math.random() * 0.28), (Math.random() - 0.35) * 0.3, (Math.random() - 0.5) * 0.25);
```

`park(o)` resets `appear`, `pop`, `kick`, `shift` and places the orb at `base + HOME.xOff + from`. Reduced motion: `appear = 1` at once, no flight.

### Per-frame motion

- Target: `tgt = base * (1 + dive * 1.6)` with `dive = smooth(0.08, 0.7, hero)`; plus `xOff * (1 - dive)`; plus `from * (1 - appear)` (x clamped at rise `>= 0`); plus `scat * sin(PI * clamp01(appear))` (swings out mid-flight and back).
- Float: `x + sin(0.7 t + phase) * 0.03`, `y + cos(0.55 t + phase * 1.3) * 0.035`, `z + sin(0.4 t + phase) * 0.025` (`phase` random 0 to 6.28).
- Parallax: `depth = 0.5 + base.z`; `x + nx * 0.05 * depth`, `y + ny * 0.035 * depth`.
- Avoidance (only when `appear > 0.6`, on screen, current product): push away from each `avoidRect` closer than `r + 10` px (centre inside a box: leave by the nearest side) and from other bubbles closer than `r1 + r2 + 14` px (half the push each); convert px to world with `pxPerUnit = sc.r / (o.r * max(0.05, appear))`; ease with `1 - exp(-dt * 5)`; relax back by `(1 - min(1, dt * 0.8))` only when nothing is within an extra 14 px. Shift applies times `(1 - dive)`.
- Cursor nudge (mouse only, `appear > 0.9`, not the hovered orb): within `R = 0.22` NDC, push `(1 - d / R)^2 * 0.08` away.
- **Spring**: `k = 16 + 70 * kick`, `c = 6.2 + 9.5 * kick`; semi-implicit Euler in fixed steps of at most `1/120` s, total `dt` capped at `0.25`; non-finite positions snap to the target.
- Scale `r * appear * (1 + pop * 0.3 + hover * 0.12)`; `hover` eases with `1 - exp(-dt * 10)`; `rotation.y = 0.2 t + phase`.
- Alpha `min(1, appear * 2.5) * (1 - pop) * (1 - smooth(0.2, 0.55, hero))`; icon alpha `alpha * (0.85 + hover * 0.15)`.
- Screen data: `orbScreen[i] = { x, y, r: s / (dist * tan(15 deg)) * height * 0.5, alpha, z }`.

### Pointer events

- Hover only if the orb belongs to the current product and `appear > 0.5`; sets `useHeroUI.hovered` and the body cursor to `pointer`.
- Click sets `selected` (current product only). Empty canvas clicks clear it.

### Orb shader (`ORB_FRAG`)

- `fres = (1 - n.v)^3`; body `mix(uDeep, uColor, 0.55) * 0.09 * (0.5 + 0.5 ndv)`; rim `mix(uColor, white, 0.3 + 0.5 fres) * fres * (1.2 + uHover * 0.9)`.
- Key highlight `L = normalize(-0.5, 0.72, 0.6)`, power 150, `* 1.25`; bounce `(0.55, -0.6, 0.6)` power 26 `* 0.2`; caustic on the lower rim `smoothstep(0.45, 0.85, 1 - ndv) * smoothstep(0.15, -0.65, n.y) * 0.3`.
- Alpha `(0.06 + fres * 0.82 + spec * 0.9 + spec2 * 0.5 + caustic * 0.5 + uHover * 0.06) * uAlpha`.
- `ICON_FRAG`: atlas cell sample, colour `mix(uColor, white, 0.6)`.

### Sparks

- `burst(at, n)`: ring buffer; size `5` to `14`; random unit direction times speed `0.6` to `2.0`.
- Per frame: `life += dt * 1.25` (about 0.8 s), position `+= vel * dt`, `vel *= 0.96`.
- `SPARK_VERT`: `gl_PointSize = aSize * (1 - aLife) * (300 / -mv.z)`; `SPARK_FRAG`: soft disc times `(1 - life)`, colour `mix(uColor, white, 0.5)`; `uColor` starts `(0.8, 0.75, 1)` and then follows `c2`.

---

## 7. Entrance timeline, second by second

Time 0 is the start of the preloader's `open()` (after the count reaches 100% and the 140 ms pause). `enter()` fires at **0.42 s**; Motion delays count from that moment and GSAP delays from the effect that runs on it, so they line up to within a frame.

| t (s) | What happens | Source |
|---|---|---|
| 0.00 | Centre mark and % shrink and fade (0.28 s); track fades (0.3 s) | Preloader |
| 0.05 | Ring begins morphing into the glass outline (0.95 s, `expo.inOut`) | Preloader |
| **0.42** | **`enter()`**; hero overlay starts fading in (0.35 s, done 0.77) | Preloader, Hero |
| 0.45 | Night layer starts lifting (0.85 s, gone 1.30) | Preloader |
| 0.50 | Headline line 1 rises (0.9 s, to 1.40) | HeroCopy delay 0.08 |
| 0.52 | Nav slides down (0.9 s, to 1.42) | Nav delay 0.1 |
| 0.58 | Headline line 2 (italic accent) rises (to 1.48) | delay 0.16 |
| 0.64 | Body paragraph fades up (0.8 s, to 1.44) | delay 0.22 |
| 0.67 | Glass HUD reveal starts sweeping top to bottom, LED ring and halo brighten (2.2 s, to about 2.87) | Mirror delay 0.25 (needs HUD textures) |
| 0.74 | CTA buttons fade up (0.7 s, to 1.44) | delay 0.32 |
| 0.87 | Hologram face reveal starts (2.4 s, to about 3.27) | HoloVideo delay 0.45 |
| 0.92 | Desktop product switcher slides in from the right (0.9 s, to 1.82) | delay 0.5 |
| 0.97 | Big phrase un-blurs and rises (1.1 s, to 2.07); mobile switcher rises (0.8 s, to 1.77) | delay 0.55 |
| 1.00 | Preloader outline fades (0.7 s) as the LED ring takes over | Preloader |
| 1.37 | First bubble launches from below the screen | Orbs delay 0.95 |
| 1.37 to 1.70 | Bubbles 1 to 7 launch every 0.055 s | stagger |
| 1.67 | Kick begins easing off on bubble 1 (1.1 s) | `d + 0.3` |
| 1.70 | Preloader unmounts | Preloader |
| 1.87 to 2.20 | Arrival sparks (10 each) as bubbles reach their places | `d + 0.5` |
| 2.15 to 2.48 | Bubbles settle (0.78 s rise each, slight overshoot) | |
| about 2.87 | HUD fully revealed | |
| about 3.27 | Hologram fully revealed | |

Before `enter()` the scene is already rendering under the night layer: mirror posed, LED at its base level (`0.55 * pulse`), HUD and hologram hidden (reveal 0), orbs parked below the screen.

### Product switch timeline (from the click)

| t (s) | Event |
|---|---|
| 0 | `data-product` flips (CSS accents transition over 0.9 s), `switching` true, world colour tween starts (1.15 s); mirror starts its two-turn spin (1.55 s, `power3.inOut`) with HUD smear; outgoing copy exits (headline 0.28 s); outgoing bubbles pop (0.24 s, 0.03 s stagger) with 16 sparks each; feature card closes |
| about 0.3 | New headline lines start rising (exit finishes, then delays 0.08 and 0.16) |
| 0.18 to 0.51 | New bubbles launch (0.18 + k * 0.055) |
| about 0.78 | Spin passes its midpoint: HUD texture swaps, hologram and Dev panes cross-fade (`vis` rate 10/s) |
| 1.25 | `switching` returns to false |
| 1.55 | Spin ends, smear 0 |
| about 0.85 to 1.95 | New big phrase enters (after a 0.3 s exit, then delay 0.55 and 1.1 s) |

---

## 8. Beauty vs Dev

| Aspect | Selika Beauty | Selika Dev |
|---|---|---|
| CSS `--accent` / `--accent2` (index.css) | `139 124 255` / `176 124 255` | `77 141 255` / `142 197 255` |
| `frame.world` | 0 | 1 |
| Scene colours | violet set (`COLORS.beauty`) | azure set (`COLORS.dev`) |
| Glass HUD (`uWhich`) | 0: `BEAUTY`, viewfinder brackets, step card, voice meter | 1: `DEV`, three permission chips |
| In front of the glass | Hologram face video (HoloVideo), which dissolves into light points in the dive | Five module panes at slightly different depths (DevPanes), which fly apart in the dive |
| Orbs | indices 0 to 6, Beauty features | indices 7 to 13, Dev features |
| Headline | A mirror that / *guides you.* | A mirror you can / *build on.* |
| Big phrase | Guided \| on *you.* | Built \| by *you.* |
| MiniMirror drawing | face oval, brows, lip arc, step bar, `#B9A9FF` | module tiles, `#8EC5FF` |
| CTA / secondary | Try Selika Beauty / Meet Selika Dev | Try Selika Dev / Meet Selika Beauty |

---

## 9. Reduced motion and fallbacks

- Preloader: count is not capped by time, opens with no pause, skips the morph and fades in 0.01 s.
- Glass and hologram reveals: 0.01 s. Spin: instant swap. Orbs: placed instantly, no sparks. Video does not play (poster frame shows). World colour: 0.01 s.
- Tilt and magnetic effects on the switch cards and buttons are off on coarse pointers and under reduced motion.
- No WebGL or a scene error: `SceneBoundary` shows `StaticMirror`; the preloader's `seen` test fails, so it simply fades out.
