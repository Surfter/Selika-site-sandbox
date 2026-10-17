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
key: Complete reference for the "Try it on the glass" demo section of the Selika v8 site (src/sections/demo/* and tools/build_face_pack.py), covering layout and copy, state data (looks, lights, steps, modules), the photographic WebGL face, makeup and guide painting, the face pack pipeline, the ICT-FaceKit 3D fallback, the Dev modules and the Ask Selika pill. Read it when rebuilding, extending or debugging the demo or making new face packs.
---

# Selika Site v8 - Interactive Demo

> [!abstract] Key
> Complete reference for the "Try it on the glass" demo section of the Selika v8 site (src/sections/demo/* and tools/build_face_pack.py), covering layout and copy, state data (looks, lights, steps, modules), the photographic WebGL face, makeup and guide painting, the face pack pipeline, the ICT-FaceKit 3D fallback, the Dev modules and the Ask Selika pill. Read it when rebuilding, extending or debugging the demo or making new face packs.

**Related:** [[Selika Site v8 - Build Bible]] | [[Selika Site v8 - Architecture and Stack]] | [[Selika Site v8 - Design System]] | [[Selika Site v8 - Sections and Copy]] | [[Selika Site v8 - Hero and Mirror Scene]] | [[Selika Site v8 - Aurora Background]] | [[Selika Site v8 - Assets and Provenance]] | [[Selika]]

---

## Overview

The demo is a browser simulation of both products on a 4:5 "mirror":

- **Selika Beauty**: a photographic face (an **AI-generated portrait, not a real person**; the README says the portraits were made with Higgsfield) that blinks, is relit by a key light following the cursor, takes makeup step by step and shows glowing guides. Hovering (or tapping) a feature shows a tip.
- **Selika Dev**: the reflection dims and draggable glass modules sit on it, each with permissions, plus a model switch and illustrative module code.
- **Ask Selika**: a pill at the bottom of the mirror that simulates voice commands with tappable prompts.

If no face packs are listed, the photographic face is replaced by a 3D head (ICT-FaceKit) with painted makeup, lashes and shader hair.

### Files

| File | Role |
|---|---|
| `src/sections/demo/DemoSection.tsx` | Section layout, header, product tabs, the `Mirror`, hover tips, footnote |
| `src/sections/demo/Panels.tsx` | `BeautyPanel`, `DevPanel`, the `Segments` drawer control, illustrative code |
| `src/sections/demo/state.ts` | Zustand store `useDemo`; `LIGHTS`, `LOOKS`, `TONES`, `STEPS`, `MODULES`, defaults |
| `src/sections/demo/PhotoFace.tsx` | The photographic face: one-pass WebGL renderer |
| `src/sections/demo/photoMakeup.ts` | Makeup and guide painting from landmarks, `regionAt` hover regions |
| `src/sections/demo/facePacks.ts` | The list of face packs and their file paths |
| `tools/build_face_pack.py` | Offline face pack builder (MediaPipe + OpenCV) |
| `src/sections/demo/FaceScene.tsx` | 3D fallback (React Three Fiber) |
| `src/sections/demo/makeup.ts` | Painting in the 3D face's UV space, lashes, eye texture |
| `src/sections/demo/hair.ts` | Shader hair for the bald ICT head |
| `src/sections/demo/landmarks.json` | 68 UV and position landmarks of the ICT face (`uv`, `pos`, 68 each) |
| `src/sections/demo/DevLayer.tsx` | Draggable Dev modules, masonry layout, camera indicator |
| `src/sections/demo/AskPill.tsx` | Ask Selika pill, prompts per product, reply area |

Libraries (versions from `package.json`): `three` 0.186.1, `@react-three/fiber` 9.8.1, `@react-three/drei` 10.7.9, `gsap` 3.15.0, `motion` 14.0.0, `zustand` 5.0.15, `thinking-orbs` 0.3.2, `lenis` 1.3.26.

---

## Section layout and copy (`DemoSection.tsx`)

```
<section id="demo" data-stream="1" class="relative py-24 md:py-32">
  .wrap
    header row (column on mobile, row with items-end and justify-between from lg)
      Reveal: Headline lead="Try it on" accent="the glass."  (class h-section, text clamp(1.9rem, 4.4vw, 4.2rem))
      Reveal delay 0.1: Tabs + helper line (right-aligned and nowrap from lg)
    grid mt-8, 1 column; from lg: minmax(0,1fr) and minmax(0,0.92fr), gap-6, items-start
      Reveal: Mirror
      Reveal delay 0.08: sg-glass panel rounded-[2rem] p-5 sm:p-7 with BeautyPanel or DevPanel
    footnote
```

- The `Headline` renders `<h2>` with "Try it on" and an `accent-word` span "the glass.".
- **Tabs**: `lg-glass lg-glass-dark` pill, `h-12`, two buttons (`min-w-[9rem]`), labels from `PRODUCTS[p].name`: **"Selika Beauty"** and **"Selika Dev"**. The active one has a white pill (`layoutId="demo-tab"`, spring stiffness 380, damping 32) and `text-night`. Switching sets the site-wide product (`useSite.setProduct`), which also turns the whole background violet or blue.
- **Helper line** under the tabs:

| Product | Pointer | Copy |
|---|---|---|
| Beauty | fine (mouse) | "The face follows your cursor. Hover a feature for its guide." |
| Beauty | coarse (`isCoarse`, touch) | "Tap a feature for its guide, step through a look, relight it." |
| Dev | any | "Drag modules around, set what each may access, swap the model." |

- **Panel swap**: `AnimatePresence mode="wait"` keyed by product; enter from `x: 18, blur(6px)` with a spring (stiffness 220, damping 26), exit to `x: -14, blur(6px)` in 0.2 s.
- **Footnote** (`text-[0.78rem] text-dim`, max 52rem): "A browser simulation of the planned products, with illustrative lighting values and sample data. The face is AI-generated, not a real person. On the device, the guidance is drawn on your own reflection." (With no packs the middle sentence is "The face is ICT-FaceKit's generic 3D model, not a real person.")

### The Mirror

- Outer: `sg-glass relative mx-auto aspect-[4/5] w-full max-w-[36rem] rounded-[2.4rem] p-2.5`; inner: `rounded-[1.95rem] bg-[#07080d] overflow-hidden`.
- **Lazy start**: two IntersectionObservers. `near` (rootMargin `150% 0px`) mounts the face once the mirror is within 1.5 screens; `visible` (rootMargin `80px 0px`) is passed as `active`, so the face only renders while on screen. Until `near`, a `ThinkingOrb state="searching" size={64}` placeholder shows.
- `PhotoFace` and `FaceScene` are `React.lazy` chunks, wrapped in `SceneBoundary` (an error boundary). Fallback text: "The 3D face could not start in this browser (it needs WebGL). The steps, light and looks alongside still show what Selika Beauty guides."
- **Dev dimming**: the reflection layer animates to `opacity 0.28`, `saturate(0.35) brightness(0.8)` over 0.7 s in Dev, then `DevLayer` fades in on top.
- **Status pills (Beauty)**: top-left "Step {min(step+1, 5)} of 5 · {step name}", top-right "{light name} · {K}K" (`text-[0.64rem]`, uppercase, `bg-black/45` blurred).
- **Hover tip**: `sg-glass sg-glass-strong`, `w-56`, positioned at the pointer plus 16 px, with left clamped to `mirrorWidth - 240`. Copy (`TIPS`):

| Region | Tip |
|---|---|
| brows | "Brows: start above the nose wing, arch through the centre of the eye, tail at the outer corner." |
| eyes | "Eyes: the liner hugs the lash line, and the wing follows the guide up toward the brow tail." |
| cheeks | "Cheeks: blush sits on the cheekbone and blends up toward the temple." |
| lips | "Lips: line first along the guide, then fill." |
| nose | "Selika maps the centre of your face first, so every other guide lines up." |
| skin | "Base and shade are checked in controlled 5000K light." |

- The Ask Selika pill sits at `bottom-4`, centred, `z-20`.

---

## State (`state.ts`)

### LIGHTS

| id | name | K | CRI | intensity | note |
|---|---|---|---|---|---|
| selika | Selika | 5000 | 95+ | 1.0 | "The mirror's own high-CRI light: the reference for choosing colour." |
| daylight | Daylight | 6500 | ~100 | 1.1 | "Cool and bright. How a look reads by a window at midday." |
| office | Office | 4000 | ~82 | 0.9 | "Flat overhead panels. Warm tones go a little grey." |
| restaurant | Restaurant | 3000 | ~90 | 0.7 | "Warm and low. Reds deepen, blush reads stronger." |
| evening | Evening | 2700 | ~90 | 0.6 | "The warm end of the range. Check the look holds up." |

### LOOKS

| id | name | lip | lipA | blush | blushA | liner | wing | shadow | shadowA | brow |
|---|---|---|---|---|---|---|---|---|---|---|
| natural | Natural | `#c47d7a` | 0.42 | `#e58f86` | 0.22 | 0.6 | 0.2 | `#a88a7a` | 0.18 | 0.55 |
| office | Office | `#a65a62` | 0.6 | `#d9867f` | 0.26 | 0.8 | 0.45 | `#8c7468` | 0.3 | 0.7 |
| evening | Evening | `#8c2a3d` | 0.8 | `#c96f7e` | 0.3 | 1 | 1 | `#6b3f6e` | 0.5 | 0.8 |
| bold | Bold | `#a8264c` | 0.74 | `#d8708c` | 0.28 | 1.1 | 1.15 | `#5b4699` | 0.42 | 0.85 |

### TONES (3D fallback skin only)

`["#f2d6c6", "#e3b89f", "#c78f6f", "#9a6446", "#613d29"]`

### STEPS

| # | id | name | region | line (panel copy) | voice (Selika's reply) |
|---|---|---|---|---|---|
| 0 | prep | Prep | skin | "Selika maps your face and sets the light to 5000K, so colour is chosen in light you can trust." | "Ready when you are." |
| 1 | brows | Brows | brows | "Follow the three guides: start above the nose, arch through the centre of your eye, tail at the outer corner." | "Brows first. Follow the arch." |
| 2 | eyes | Eyes | eyes | "Trace the liner along the lash line, then flick it out along the wing guide." | "Liner next. Flick out at the end." |
| 3 | cheeks | Cheeks | cheeks | "Blush lands on the highlighted zone, blended up toward the temple." | "Blush on the glowing zone." |
| 4 | lips | Lips | lips | "Line the lips along the guide, then fill in." | "Lips last. Line, then fill." |
| 5 | done | Done | null | "Look complete. Check it under office, restaurant and evening light before you leave." | "Done. Want to see it in evening light?" |

The step index is also the makeup level: makeup for step N and every earlier step is painted (`paintMakeup(..., upTo = step)`).

### MODULES (Dev)

| id | name | needs | icon |
|---|---|---|---|
| clock | Clock | none | Clock |
| weather | Weather | network | CloudSun |
| calendar | Calendar | calendar | Calendar |
| build | Build status | network | GitBranch |
| agent | Agent brief | calendar, mic, network | Bot |
| home | Home | network | House |

Permissions are `camera`, `mic`, `calendar`, `network`. Models are `device`, `endpoint`, `agent`.

### Defaults

```ts
step: 0, look: "office", light: "selika", tone: 1, face: 2, hover: null, smile: 0, reply: null, moved: false,
// a phone's mirror is small: it starts with four modules (the others are a tap away)
on: { clock: true, weather: true, calendar: true, build: !narrowScreen, agent: true, home: !narrowScreen },
perms: each module gets exactly what it needs, and camera is always false,
selected: "agent", model: "device",
pos: clock (0.05, 0.075), weather (0.51, 0.075), calendar (0.05, 0.325), build (0.51, 0.325), agent (0.05, 0.575), home (0.51, 0.575)
```

- **Face 2 is "warm"** (the third pack), and the default look is **Office** (but at step 0 no makeup shows until steps advance or a look is chosen).
- `narrowScreen = window.innerWidth < 640` at load: phones start with **four** modules (Build status and Home off).
- `say(text)` sets `reply: { text, id: previousId + 1 }`, which the Ask pill shows.

---

## Panels (`Panels.tsx`)

### Segments control

A row of option buttons; one opens its drawer at a time, and choosing another closes the first.

- Grid: 4 items `grid-cols-2 sm:grid-cols-4`; otherwise `grid-cols-3`.
- Each button: icon tile (`h-8 w-8 rounded-xl`), label, and on `sm` and up a value line and a chevron. On phones the button stacks vertically (icon above label, centred) and the value and chevron are hidden.
- Open button: white with `text-night`; closed: `lg-glass lg-glass-dark` with a specular highlight (`lg-spec`, `specMove` on pointer move).
- Drawer: `AnimatePresence mode="wait"`, height 0 to auto and opacity, 0.3 s, ease `[0.16, 1, 0.3, 1]`; it extends `-mx-2 -mb-2` so rings and hover lifts are never clipped.

### BeautyPanel

Segments:

| id | label | value shown | icon |
|---|---|---|---|
| look | Look | look name | Palette |
| light | Light | "{K}K" | SunMedium |
| skin | Skin tone | face pack label (or "Tone N" in 3D) | ScanFace |

- **Look drawer**: 4 buttons (`grid-cols-2 sm:grid-cols-4`, `h-11`), each with a dot in the look's lip colour (scaled 1.2 when active). Choosing sets `look` and `step = max(step, 4)` (so the full look is visible except the "done" step) and says "{name} look.".
- **Light drawer**: 5 buttons (`grid-cols-5`) with a colour dot `hex(kelvinToRGB(K))` glowing `0 0 14px` when active (6 px otherwise), name and "{K}K"; the light's note below. Choosing only sets `light`.
- **Skin tone drawer**: with packs, round chips with a 30 x 30 thumbnail (`face-{id}-thumb.jpg`) and the label (Fair, Medium, Warm, Deep), `aria-label "Skin tone: {label}"`; without packs, five `h-9 w-9` swatches from `TONES`.
- **Guided steps**: heading "Guided steps", six tabs (number and name). Active white; done steps `sg-glass text-ink`; future `text-mute`. Clicking a step sets it, says its voice line, and on "Done" increments `smile` (the 3D face smiles). Below, the step's `line` fades in (0.35 s, `min-h-[3.2rem]`).
- **Buttons**: "Next step" (`btn-accent`, arrow icon, disabled on the last step; full width on phones, auto from `sm`) and "Start again" (sets step 0).

### DevPanel

Segments:

| id | label | value shown | icon |
|---|---|---|---|
| modules | Modules | "{count} on the glass" | LayoutGrid |
| perms | Permissions | selected module name | ShieldCheck |
| model | Model | model label | Cpu |

- **Modules drawer**: six toggles (`grid-cols-2 sm:grid-cols-3`); toggling also selects the module.
- **Permissions drawer**: "What {module} may use. Pick a module on the glass to change another." Four switches (Camera, Microphone, Calendar, Network) with a sliding knob (`.toggle-knob`, transform 0.32 s `cubic-bezier(.22,1,.36,1)`, 16 px travel). Footer: "Turn off something a module needs and it says so, rather than finding another way in."
- **Model drawer**: On-device ("Runs on your phone. Nothing leaves your devices."), Your endpoint ("Point modules at a model API you choose."), Your agent ("Hand the brief to an agent you run.").
- **Illustrative code** card (`sg-glass-solid`), header "{id}.ts" and "Illustrative code", generated per module:

```ts
import { module } from "@selika/sdk"

export default module({
  name: "<id>",
  permissions: [<granted perms>],
  model: "on-device" | env("MODEL_URL") | agent("brief"),
  voice: "read my brief",          // agent module only
  render: (ctx) => ctx.brief(),    // brief for agent, status for build, card otherwise
})
```

Token colours: keywords `#8ec5ff`, strings `#d3b8ff`, functions white, punctuation `white/60`.

---

## The photographic face (`PhotoFace.tsx`)

Header comment:

> The demo face from a photograph (an AI-generated portrait, not a real person). The photo itself never bends: an eyes-closed copy makes it blink, makeup is painted from its landmarks and laid into the skin's own light and texture, the chosen light changes its colour temperature, a soft key light (from the depth map's normals) leans toward the cursor, and the guides glow on top. Plain WebGL in one pass, so it is light enough for phones.

### Pipeline

1. A **fresh canvas per mount** is appended to the host div (`absolute inset-0`, `touch-action: pan-y` so vertical page scrolling still works over the face on touch screens).
2. WebGL 1 context `{ antialias: false, alpha: false, premultipliedAlpha: false, powerPreference: "high-performance" }`. Failure throws, which the `SceneBoundary` turns into the fallback text.
3. One full-screen triangle, one program.
4. **Five textures** (units 0 to 4): `uPhoto`, `uClosed`, `uDepth`, `uMakeup` (uploaded premultiplied), `uGuide`. All LINEAR, CLAMP_TO_EDGE, initialised to 1 x 1 transparent. Images are uploaded without `UNPACK_FLIP_Y`, so texture v runs top to bottom like the photo.
5. Two 2D canvases: **makeup 512 x 640**, **guides 768 x 960** (512 x 640 on the low tier). `uTexel` = 1 / guide size.
6. Resize via `ResizeObserver`: DPR capped at **2** (1.25 on low tier).
7. Drawing is on the shared ticker (`addTick`), only while `active` and the tab is visible; on the low tier capped at **30 fps**.
8. On unmount: tweens killed, `WEBGL_lose_context`, canvas removed.

### Vertex mapping (object-fit: cover, ZOOM 1.12)

```glsl
attribute vec2 aPos;
uniform vec2 uScale;
uniform float uZoom;
varying vec2 vUv;
void main() {
  vUv = vec2(0.5, 0.48) + vec2(aPos.x, -aPos.y) * 0.5 * uScale / uZoom;
  gl_Position = vec4(aPos, 0.0, 1.0);
}
```

```ts
// object-fit: cover for a 4:5 photo
const ca = r.width / Math.max(1, r.height), pa = 0.8;
gl.uniform2f(u.scale, ca > pa ? 1 : ca / pa, ca > pa ? pa / ca : 1);
```

- The photo is 4:5 (aspect `pa = 0.8`). If the canvas is wider than 4:5, the full width shows and height is cropped; otherwise the height shows and width is cropped (cover).
- `ZOOM = 1.12` crops in a further 12%, and the view is centred at **(0.5, 0.48)**, slightly above the photo's centre (toward the eyes).
- `-aPos.y` flips y so screen-up matches the top of the photo.
- Pointer mapping uses the same transform (`toPhoto`) so hover regions line up.

### Fragment shader (verbatim)

```glsl
precision highp float;
varying vec2 vUv;
uniform sampler2D uPhoto, uClosed, uDepth, uMakeup, uGuide;
uniform vec2 uTilt;      // a gentle turn toward the cursor, in uv per unit of depth (kept small, so nothing stretches)
uniform float uBlink;    // 0 open .. 1 closed
uniform vec3 uKey;       // the light's colour relative to the photo's own
uniform float uLevel;    // the light's brightness
uniform vec3 uLight;     // where the key light comes from
uniform vec3 uGuideCol;
uniform float uPulse;
uniform float uTime;
uniform float uFade;
uniform vec2 uTexel;     // one guide texel
float dep(vec2 p) { return texture2D(uDepth, p).r; }
void main() {
  vec2 uv = vUv, p = uv;
  for (int i = 0; i < 3; i++) p = uv - uTilt * (dep(p) - 0.35);
  // the lids close quickly through the in-between, as a real blink does
  vec3 col = mix(texture2D(uPhoto, p).rgb, texture2D(uClosed, p).rgb, smoothstep(0.15, 0.85, uBlink));
  // makeup, as pigment over skin: light shades take the skin's own light and texture (a colour blend),
  // dark ones deepen it (a multiply), so pores and highlights show through either way
  vec4 m = texture2D(uMakeup, p);
  if (m.a > 0.002) {
    vec3 mc = m.rgb / m.a;
    float l = dot(col, vec3(0.299, 0.587, 0.114)), lm = max(dot(mc, vec3(0.299, 0.587, 0.114)), 0.04);
    vec3 tint = mc * clamp(l / lm, 0.6, 1.3), deep = col * mc * 1.35;
    col = mix(col, mix(deep, tint, clamp(lm * 1.6, 0.0, 0.65)), m.a);
  }
  // the light: shading from the depth map's normals, tinted to the chosen colour temperature
  vec2 dt = vec2(1.0 / 256.0, 1.0 / 320.0) * 1.5;
  float dx = dep(p + vec2(dt.x, 0.0)) - dep(p - vec2(dt.x, 0.0));
  float dy = dep(p + vec2(0.0, dt.y)) - dep(p - vec2(0.0, dt.y));
  vec3 n = normalize(vec3(-dx * 7.0, dy * 7.0, 1.0));
  float shade = 0.84 + 0.3 * dot(n, normalize(uLight));
  col *= uKey * uLevel * shade;
  // the guides glow and pulse, a soft halo around each line
  vec3 g = texture2D(uGuide, p).rgb;
  float halo = (texture2D(uGuide, p + uTexel * vec2(3.0, 3.0)).r + texture2D(uGuide, p + uTexel * vec2(-3.0, 3.0)).r
              + texture2D(uGuide, p + uTexel * vec2(3.0, -3.0)).r + texture2D(uGuide, p + uTexel * vec2(-3.0, -3.0)).r) * 0.25;
  float sheen = 0.8 + 0.45 * smoothstep(0.55, 1.0, sin((p.x * 0.7 + p.y) * 26.0 - uTime * 2.6));
  col += uGuideCol * (g.r * (0.78 + 0.3 * uPulse) * sheen + halo * 0.35 + g.g * (0.22 + 0.16 * uPulse));
  // settle into the dark of the mirror at the edges
  vec2 e = (uv - vec2(0.5, 0.48)) * vec2(1.25, 1.0);
  col *= 1.0 - 0.45 * smoothstep(0.35, 0.75, length(e));
  gl_FragColor = vec4(col * uFade, 1.0);
}
```

### Tilt (parallax, the photo never warps)

```ts
const ZOOM = 1.12;
const TILT_X = 0.013, TILT_Y = 0.01; // about a third of 8.2's turn: the face answers the cursor without the photo stretching
```

- `p = uv - uTilt * (dep(p) - 0.35)`, iterated 3 times (a fixed-point solve): pixels nearer than depth 0.35 shift one way, farther ones the other, giving a small "turn" toward the cursor. Every texture (photo, closed eyes, makeup, guides, depth) is sampled at the same `p`, so makeup stays locked to the skin.
- `uTilt = (yaw * 0.013, pitch * 0.01)`.

### Key light following the cursor

```ts
if (P.seen) {
  lx = clamp((P.x - (r.left + r.width / 2)) / (r.width * 0.75), -1, 1);
  ly = clamp(-(P.y - (r.top + r.height * 0.42)) / (r.height * 0.75), -1, 1);
}
const k = 1 - Math.exp(-dt * 3.2);
s.yaw   += (lx + Math.sin(t * 0.45) * 0.08 * sway - s.yaw) * k;
s.pitch += (-ly + Math.sin(t * 0.7) * 0.06 * sway - s.pitch) * k;
gl.uniform3f(u.light, -0.55 + s.yaw * 0.35, 0.5 + s.pitch * 0.25, 0.8);
```

- The cursor is measured relative to the face's centre (x at 50%, y at 42% of the canvas), normalised by 75% of the canvas size and clamped to ±1. It uses the page-wide pointer, so the face reacts even when the cursor is outside the mirror.
- Followed at rate **3.2 per second**, with an idle sway (0.08 at 0.45 rad/s in yaw, 0.06 at 0.7 rad/s in pitch; off under reduced motion).
- The light starts at `(-0.55, 0.5, 0.8)` (upper left, in front). Shading: normals from central differences of the 256 x 320 depth map (step 1.5 texels, slope scale 7), `shade = 0.84 + 0.3 * dot(n, L)`, so the light only ever modulates the photo by roughly ±30%.

### Colour temperature (k = 0.72)

```ts
const ref5200 = kelvinToRGB(5200);
const setLight = (id: string, instant = false) => {
  const L = LIGHTS.find((l) => l.id === id)!; const c = kelvinToRGB(L.k);
  let r = c[0] / ref5200[0], g = c[1] / ref5200[1], b = c[2] / ref5200[2];
  const lum = 0.299 * r + 0.587 * g + 0.114 * b; r /= lum; g /= lum; b /= lum;
  const k = 0.72; // how far the photo is pushed toward the light's colour
  gsap.to(keyTarget, { r: 1 + (r - 1) * k, g: 1 + (g - 1) * k, b: 1 + (b - 1) * k, level: 0.5 + 0.5 * L.intensity, duration: instant || reducedMotion ? 0 : 0.9, ease: "power2.inOut" });
};
```

- The photo is assumed to be lit at about 5200 K. The light's black-body colour (`kelvinToRGB`, the standard Tanner Helland style approximation in `src/lib/physics.ts`) is divided by the 5200 K colour, normalised to unit luminance, then applied at 72% strength. Brightness `uLevel = 0.5 + 0.5 * intensity`. Tween 0.9 s `power2.inOut`.
- Resulting multipliers (computed from the code):

| Light | K | `kelvinToRGB` | uKey (r, g, b) | uLevel |
|---|---|---|---|---|
| reference | 5200 | (255, 232, 213) | n/a | n/a |
| Selika | 5000 | (255, 228, 206) | 1.010, 0.998, 0.986 | 1.0 |
| Daylight | 6500 | (255, 254, 250) | 0.949, 1.013, 1.066 | 1.05 |
| Office | 4000 | (255, 206, 166) | 1.072, 0.983, 0.897 | 0.95 |
| Restaurant | 3000 | (255, 177, 110) | 1.174, 0.962, 0.741 | 0.85 |
| Evening | 2700 | (255, 167, 87) | 1.217, 0.955, 0.663 | 0.8 |

### Blink

```ts
// a quick close, a beat shut, a slower open; every few seconds, now and then twice
s.nextBlink = t + 3.2 + Math.random() * 3.6;
tl.to(s, { blink: 1, duration: 0.06, ease: "power2.in" }).to(s, { blink: 1, duration: 0.05 }).to(s, { blink: 0, duration: 0.13, ease: "power2.out" });
if (Math.random() < 0.12) tl.to(s, { blink: 1, duration: 0.06, ease: "power2.in", delay: 0.12 }).to(s, { blink: 0, duration: 0.13, ease: "power2.out" });
```

| Constant | Value |
|---|---|
| First blink | at t > 2.5 s |
| Interval | 3.2 s + random 0 to 3.6 s |
| Close | 0.06 s `power2.in` |
| Hold shut | 0.05 s |
| Open | 0.13 s `power2.out` |
| Double blink | 12% chance, after a 0.12 s pause, 0.06 s close and 0.13 s open |
| Shader cross-fade | `smoothstep(0.15, 0.85, uBlink)` from the open photo to the eyes-closed photo, so the in-between is brief |
| Disabled | under reduced motion, or if the pack has no closed image |

### Makeup pigment blend

From the shader: `mc = m.rgb / m.a` un-premultiplies the makeup colour. With `l` the skin luminance and `lm` the makeup luminance (min 0.04):

- `tint = mc * clamp(l / lm, 0.6, 1.3)`: the makeup hue at the skin's own brightness (a colour blend, so pores and highlights survive).
- `deep = col * mc * 1.35`: a multiply that darkens the skin.
- `mix(deep, tint, clamp(lm * 1.6, 0, 0.65))`: light pigments lean toward the colour blend (at most 65%), dark ones toward the multiply.
- Finally `mix(col, that, m.a)`.

### Guides, pulse, vignette, fade

- Guide colour: Beauty **(0.78, 0.71, 1.0)**, Dev **(0.62, 0.82, 1.0)** (guides are only painted in Beauty).
- `uPulse = 0.5 + 0.5 sin(2.4 t)` (fixed 0.5 under reduced motion). Lines (red channel) glow at `0.78 + 0.3 pulse` times a travelling diagonal `sheen` (frequency 26, speed 2.6); a 4-tap halo at ±3 guide texels adds 0.35; soft zones (green channel) add `0.22 + 0.16 pulse`.
- Vignette: `1 - 0.45 * smoothstep(0.35, 0.75, |(uv - (0.5, 0.48)) * (1.25, 1)|)` so the photo settles into the dark of the mirror.
- `uFade` multiplies everything (face switching).

### Face switching

```ts
const show = async (index: number) => {
  const f = FACE_PACKS[clamp(index)]; want = f.id;
  const pack = await loadPack(f.id, f.blink);
  if (want !== f.id) return;
  if (s.pack) await fade to 0 over 0.22 s power2.in;
  if (want !== f.id) return;
  s.pack = pack; upload photo, closed (or photo), depth; repaint makeup and guides;
  fade to 1 over 0.55 s power2.out;
};
```

- Packs are cached per id (`Map<string, Promise<Pack>>`); JSON, photo, depth and the closed photo load in parallel (the closed image failing is tolerated).
- `want` guards against races when the visitor clicks several tones quickly.
- `preloadFaces()` is exported to warm all packs, but nothing in `src` calls it in this build.
- Subscriptions: face change calls `show`; look or step repaints makeup; step, hover or product repaints guides (deduplicated by a `region|hover|id` key); light change calls `setLight`.

---

## Painting makeup and guides (`photoMakeup.ts`)

All drawing is in the photo's own frame (x right, y down, 0 to 1) from the pack's landmarks. Sizes are given for a 1024-wide canvas and scaled by `k = W / 1024`. Curves are quadratic through midpoints (`path`, closed or open).

### `paintMakeup(ctx, marks, look, upTo)` (makeup canvas 512 x 640)

| Level | What | Blur (x k) | Alpha | Colour | Shape |
|---|---|---|---|---|---|
| ≥ 1 brows | fill each brow | 2.2 px | `0.42 * brow + 0.18` | `#3a2418` | `browR` + reversed `browRLow` (and left) |
| ≥ 2 shadow | lid under the crease | 9 px | `shadowA * 0.9` | `L.shadow` | `lidR` + reversed `creaseR` (and left) |
| ≥ 2 liner | upper lash line, inner to outer, flicked out | 0.9 px | 0.82 | `#140d0d` | lid points raised by 0.002; width `(1.6 + liner * 3.0) * k`; wing tip = outer corner + unit vector toward the brow tail x `0.024 * wing` (only if `wing > 0.05`); round caps and joins |
| ≥ 3 blush | cheekbone, swept to temple | 26 px | `blushA * 0.95` | `L.blush` | ellipse 0.075 W x 0.042 H at the cheek centre raised 0.012, rotated `-0.35` rad (right) and `+0.35` (left) |
| ≥ 4 lips | inside the outline, mouth line left clear | 1.4 px | `lipA` | `L.lip` | fill `lipsOuter`, then `destination-out` `lipsInner` at alpha 0.85, blur 1.2 |

`wing(lid, brow)`: outer corner is `lid[0]`, direction toward `brow[0]` (the brow tail).

### `paintGuides(ctx, marks, region, hover)` (guide canvas 768 x 960, or 512 x 640 on low)

Black background; **red** = lines and dots, **green** = soft zones.

- **Hover zone** (when hovering a region other than the step's own, and not skin): blur 14, alpha 0.55, green; brows: brow shapes; eyes: eye outlines; lips: outer lips; cheeks: ellipse 0.07 W x 0.045 H; nose: bridge stroked 18 wide.
- **skin (Prep)**: dashed face oval (alpha 0.55, width 1.3, dash 2/7), dots at every `all` landmark (radius 1.6, alpha 0.75), dashed eyes and lips (width 1.6, dash 3/5).
- **brows**: per side, three dashed lines (width 2.2, dash 9/7) from the nose wing (`noseBase[0]` or last) to the brow start (raised 0.012), to the arch (toward the iris x at the arch height, extended 1.06), and to the tail (extended 1.05); dots radius 5 at start, arch (`b[2]`) and tail; solid brow strokes (width 2.4, alpha 0.85).
- **eyes**: dashed upper lid raised 0.006 (width 2.4, dash 8/6), wing guide from the outer corner toward the brow tail, length 0.05 (dash 4/6), dot radius 4.5 at the tip.
- **cheeks**: dashed ellipse 0.066 W x 0.04 H (width 2.2, dash 3/7) rotated `s * -0.35`, plus a solid sweep line toward the temple from `(c.x - s*0.05, c.y - 0.03)` to `(c.x - s*0.1, c.y - 0.085)` with a dot.
- **lips**: dashed outer lips (width 2.4, dash 8/6), dots at `lipsOuter[0, 5, 10, 15]`.

### `regionAt(marks, u, v)` (hover regions)

Returns `null` outside the face oval (point-in-polygon), else the first match of these ellipses (centre = mean of the landmark group, radii in frame units):

| Order | Region | Centre | rx | ry |
|---|---|---|---|---|
| 1 | brows | each brow (upper + lower points) | 0.075 | 0.03 |
| 2 | eyes | each eye outline | 0.06 | 0.03 |
| 3 | lips | outer lips | 0.075 | 0.045 |
| 4 | cheeks | each cheek group | 0.07 | 0.06 |
| 5 | nose | nose bridge | 0.035 | 0.09 |
| 6 | skin | anywhere else inside the oval | | |

Hover only works in Beauty. `pointerdown` also triggers it, so on touch a **tap** selects a region and shows its tip; `pointerleave` clears it.

---

## Face packs (`facePacks.ts`)

```ts
let packs: FacePack[] = [
  { id: "fair", label: "Fair", blink: true },
  { id: "medium", label: "Medium", blink: true },
  { id: "warm", label: "Warm", blink: true },
  { id: "deep", label: "Deep", blink: true },
];
export const facePath = (id: string, part = "") => pub(`/faces/face-${id}${part}`);
```

- Development only: `?faces=a,b` replaces the list with those ids (blink on unless the id starts with `test`).
- `pub()` appends a content hash (`?v=...`, computed in `vite.config.ts`) so updated images are never served stale.
- If the list is empty, the demo uses the 3D fallback.

### Pack file format (`public/faces/`)

| File | Content |
|---|---|
| `face-{id}.jpg` | Aligned photo, 1024 x 1280 (4:5), JPEG quality 86, progressive |
| `face-{id}-closed.jpg` | Same frame with closed eyes blended into the eye band, JPEG 84, progressive |
| `face-{id}-depth.png` | 256 x 320 8-bit greyscale depth (brighter = nearer) |
| `face-{id}-thumb.jpg` | 112 x 112 thumbnail, JPEG 82 |
| `face-{id}.json` | Landmarks, normalised 0 to 1 (x right, y down), rounded to 4 decimals |

In this build the packs are `fair`, `medium`, `warm`, `deep` (photos about 117 to 156 KB, depth about 16 KB, JSON about 6.5 KB each). All four are AI-generated portraits, not real people.

### Landmark JSON groups (MediaPipe Face Mesh indices)

| Key | Indices |
|---|---|
| lipsOuter | 61, 185, 40, 39, 37, 0, 267, 269, 270, 409, 291, 375, 321, 405, 314, 17, 84, 181, 91, 146 |
| lipsInner | 78, 191, 80, 81, 82, 13, 312, 311, 310, 415, 308, 324, 318, 402, 317, 14, 87, 178, 88, 95 |
| eyeR | 33, 246, 161, 160, 159, 158, 157, 173, 133, 155, 154, 153, 145, 144, 163, 7 |
| eyeL | 263, 466, 388, 387, 386, 385, 384, 398, 362, 382, 381, 380, 374, 373, 390, 249 |
| browR / browRLow | 70, 63, 105, 66, 107 / 46, 53, 52, 65, 55 |
| browL / browLLow | 300, 293, 334, 296, 336 / 276, 283, 282, 295, 285 |
| irisR | [centre 468], [radius = half the distance 469 to 471, divided by W; 0] |
| irisL | [centre 473], [radius = half the distance 474 to 476, divided by W; 0] |
| cheekR | 116, 117, 118, 101, 36, 205, 187, 123 |
| cheekL | 345, 346, 347, 330, 266, 425, 411, 352 |
| noseBridge | 168, 6, 197, 195, 5, 4, 1 |
| noseBase | 98, 97, 2, 326, 327 |
| oval | 10, 338, 297, 332, 284, 251, 389, 356, 454, 323, 361, 288, 397, 365, 379, 378, 400, 377, 152, 148, 176, 149, 150, 136, 172, 58, 132, 93, 234, 127, 162, 21, 54, 103, 67, 109 |
| lidR | 33, 246, 161, 160, 159, 158, 157, 173, 133 |
| lidL | 263, 466, 388, 387, 386, 385, 384, 398, 362 |
| creaseR | 226, 247, 30, 29, 27, 28, 56, 190, 243 |
| creaseL | 446, 467, 260, 259, 257, 258, 286, 414, 463 |
| all | every third landmark of the first 468 (156 points) |

---

## Building a face pack (`tools/build_face_pack.py`)

### Command (from `README.md`)

```
pip install mediapipe==0.10.14 opencv-python numpy
python3 -I tools/build_face_pack.py portrait.png portrait-closed.png public/faces face-NAME
```

Arguments: `<open.png> <closed.png or -> <out_dir> <name>`. The name includes the `face-` prefix so the files match `facePath`. Pass `-` for no eyes-closed image. Then add `{ id: "NAME", label: "...", blink: true }` to `FACE_PACKS`. (The script's own docstring calls it `build_pack.py`; the file in the repo is `tools/build_face_pack.py`.)

Environment overrides: `EYE_Y` (default **0.40**, eye line as a fraction of H) and `EYE_D` (default **0.26**, inter-pupil distance as a fraction of W). Output frame **W x H = 1024 x 1280**.

Input: a front-facing AI-generated portrait, plus optionally an eyes-closed edit of the same image.

### Steps

1. **Landmarks.** MediaPipe Face Mesh: `static_image_mode=True, max_num_faces=1, refine_landmarks=True, min_detection_confidence=0.3` (refine adds the iris points 468 to 477). Exits with "no face found" if none.
2. **Align by the irises.** Iris centres 468 (subject's right) and 473 (left). Rotate about their midpoint by the angle between them, scale so their distance becomes `EYE_D * W` (266 px), translate the midpoint to `(W/2, EYE_Y * H)` = (512, 512). `cv2.warpAffine`, cubic, `BORDER_REPLICATE`.
3. **`coverage`**: warp a white mask with the same matrix (nearest, constant 0) to know which output pixels the source actually covers.
4. **`fill_outside`**: where the frame reaches beyond the source, replicate streaks are replaced. Distance from the covered area (`distanceTransform`, L2, 5); a Gaussian-blurred copy (sigma 22) fading over 70 px into the backdrop colour (6th percentile of covered pixels per channel); Gaussian noise (sigma 2.2, seed 7) so it doesn't band; blended in with a mask softened by sigma 3.
5. **`extend_top`** (crown continuation, when the source stops short of the top, for example a crop through the hair):
   - `yc` = the lowest first-covered row among the central columns (W/5 to 4W/5), plus 3.
   - **`head_ellipse`**: MediaPipe Selfie Segmentation (`model_selection=0`), mask > 0.5; for every second row between `yc + 22` and `min(H - 1, yc + 260)`, take the widest run of "person" and its two ends; least-squares fit of `A x² + B y² + C x + D y = 1`; reject if not an ellipse; return centre `(cx, cy)` and semi-axes `(a, b)`. Crown = `cy - b`.
   - For each missing row `y < yc`, sample the mirrored row `yr = 2 yc - y` (so hair and backdrop carry on seamlessly), squeezed horizontally from the head's half-width at `yr` to the ellipse half-width at `y`; outside the head, the backdrop is stretched to fit. Above the crown the half-width goes negative (`-2 * (crown - y)`) so the outline closes over the top of the head.
   - Head mask with a 3 px soft edge. Where the squeeze is strong, sample horizontally blurred copies (sigma 1.5 and 4.0) chosen by `q = clip((log2(squeeze) - 1) / 2, 0, 1) * 2` to avoid aliasing.
   - Darken toward the crown: `hair *= 1 - 0.28 * k^1.5` ("the dome turns away from the light").
6. **Re-detect landmarks** on the aligned photo (these are what the JSON and depth use). Write the photo (JPEG 86, progressive).
7. **Thumbnail**: a square of half-size `0.25 W` (512 px square) centred at `(W/2, EYE_Y * H + 0.07 H)` (between the eyes and the mouth), resized to 112 x 112 with `INTER_AREA`, JPEG 82.
8. **Eyes closed** (if given): landmarks on the closed image; align with `estimateAffinePartial2D` (LMEDS) on the outer eye corners and brows and nose line, ids `[33, 133, 362, 263, 70, 105, 334, 300, 168, 6, 197, 1]` (the irises are hidden). Build an **eye band**: each eye ring (16 points) scaled about its centre by **(1.45, 2.3)**, filled, Gaussian sigma 9. Inside the band (> 40), match each channel's mean and standard deviation to the open photo so only the lids change. Blend `photo * (1 - band) + closed * band`. JPEG 84, progressive.
9. **Depth map** at 256 x 320:
   - Rebuild triangles from `FACEMESH_TESSELATION` edges (every edge pair sharing a neighbour).
   - `z = -lm.z`, normalised 0 (far) to 1 (near, nose tip).
   - Rasterise every triangle with barycentric weights (tolerance -0.01), keeping the nearest value (z-buffer by max).
   - Extend over the head: the face oval (36 points) scaled **(1.18, 1.22)** about its centre and raised 6 px, filled with `0.55 * edge_val`; a neck ellipse centred `0.1 * dh` below the chin (landmark 152), semi-axes `(0.62 * half face width, 0.16 * dh)`, at `0.35 * edge_val`; `edge_val` = 8th percentile of the rasterised depth. Take the max, then Gaussian blur sigma 3.2. Save as 8-bit PNG.
10. **Landmark JSON** (groups above) and a console line `NAME ok (1280, 1024, 3) closed depth (320, 256)`.

---

## 3D fallback (when `FACE_PACKS` is empty)

### `FaceScene.tsx`

| Item | Value |
|---|---|
| Model | `public/models/face.glb` (ICT-FaceKit, MIT, USC Institute for Creative Technologies; converted by `tools/ict2glb.py` with 23 morph targets, cm to m; about 1.1 MB), loaded with `useGLTF(MODEL, false, true)` and preloaded |
| Canvas | `frameloop="never"`, advanced by the shared ticker only while `active`; `dpr = dprFor(tier)` (high [1, 1.75], mid [1, 1.4], low [0.8, 1.15]); antialias off on low; alpha |
| Camera | fov 21, position (0, 0.024, 0.76), near 0.01, far 10 |
| Environment | resolution 64, 1 frame; two rect Lightformers: intensity 1.6 at (-1.5, 1, 2) scale (2, 1, 1) white; 0.8 at (1.5, 0, 1.5) scale (1.5, 1, 1) `#e8e4ff` |
| Key light | directional at (-0.6, 0.55, 0.9), intensity 2.4, tweened to `2.6 * intensity` and the light's black-body colour over 0.9 s |
| Fill | directional at (0.8, 0.1, 0.6), 0.55, key colour mixed 50% with white |
| Rim | directional at (0.2, 0.8, -1), 1.6, `#b7a6ff` (Beauty) or `#8ec5ff` (Dev) |
| Ambient | 0.18 |
| Skin material | MeshPhysicalMaterial: map = face canvas, emissiveMap = guide canvas, roughness 0.5, sheen 0.6 (roughness 0.55, colour `#ffd6cc`), clearcoat 0.06 (roughness 0.5), specularIntensity 0.4; emissive intensity pulses `0.75 + 0.35 sin(2.4 t)` |
| Eye material | map = painted eye, roughness 0.12, clearcoat 1 (roughness 0.04) |
| Lash material | `#140e0c`, alphaMap = lash strands, roughness 0.7, double-sided, transparent, no depth write, alphaTest 0.02, renderOrder 2 |
| Eye pivots | eyes rotate about true centres `eye_L (0.0319, 0.0362, 0.0843)`, `eye_R (-0.0319, 0.0362, 0.0843)` |

Behaviour:

- **Head turn**: yaw `x * 0.42`, pitch `-y * 0.2` (pointer relative to the canvas, as for the photo), rate 3.2; idle rotation `sin(0.7t) * 0.012`, `sin(0.45t) * 0.02`, roll `sin(0.5t) * 0.008`, bob `sin(1.1t) * 0.0012`.
- **Eyes lead the head** (rate 9): eyeball rotation `ex = (gx - yaw/0.42) * 0.45 + gx * 0.15`, `ey = gy * 0.32`; lid morphs follow the gaze (look out/in 0.5, up 0.45, down 0.6).
- **Blink**: every 2.2 + random 3.6 s, close 0.07 s, open 0.13 s, 20% double.
- **Hover reactions**: brows raise (inner 0.45, outer 0.36) over brows, eyes widen 0.35 over eyes, mouth puckers 0.28 over lips.
- **Smile** on reaching "Done": smile 0.7 over 0.45 s, hold 1.3 s, release over 0.8 s (cheek squint 0.6x, eye squint 0.45x).
- **Guides repaint** at 12 / 24 / 30 fps (low / mid / high) with dashes travelling at 26 px per second.
- Hover regions come from the UV under the pointer (`makeup.regionAt`).

### `makeup.ts` (UV painting)

- `TEX = 1024`. Landmarks: 68 UV points from `landmarks.json` (jaw 0 to 16, brows 17 to 26, nose bridge 27 to 30, nose base 31 to 35, eyes 36 to 47, outer lips 48 to 59, inner lips 60 to 67). Cheek centres fixed at (0.285, 0.47) and (0.715, 0.47).
- `paintFace`: skin colour from `TONES`, soft shading ellipses (cheeks, nose `#d98b7a`, under the jaw, forehead), a 128 px grain tile at alpha 0.07, natural lips and brows (darker brows `#1a110c` for tones above index 2, else `#3a271d`), then makeup by step: stronger brows (`brow * 0.55`), lid shadow ellipses, liner with wing `0.022 * wing + 0.004` out and `0.012 * wing` up, width `2 + liner * 3.5`, blush ellipses (rotated ±0.35), lips with outline and a white highlight.
- `paintGuides`: the same regions as the photo guides, plus a scanning line for Prep and moving dashes.
- `paintLashes`: six bands of strands (46 per upper band side, 20 per lower), drawn white on black as an alpha map.
- `paintEye`: procedural eye, iris `#5a3a22`, 48 radial fibres, pupil `#070505`.

### `hair.ts`

Hair is drawn in the skin shader (`onBeforeCompile`), in the head's own space: a hairline curve `hairLineY(theta)` by angle from the front (0.100 m at the forehead down to -0.045 m at the nape), strands from layered 1D noise, glossier roughness `0.32 + 0.18 (1 - strand)`, a 2.8 mm lift off the scalp, emissive and sheen cancelled under the hair. Default colour `#1a120e`; program cache key `selika-hair`.

---

## Dev modules (`DevLayer.tsx`)

### Module bodies (sample data)

| Module | Content |
|---|---|
| Clock | Live time `en-GB` HH:MM (updates every 15 s) and the long date |
| Weather | "12°", "Light rain / London" |
| Calendar | 09:00 Stand-up (highlighted), 13:30 Design review, 18:00 Gym |
| Build status | "Passing" with a dot, 10 bars of heights 8, 14, 10, 18, 12, 16, 9, 20, 13, 17 px (last one accent) |
| Agent brief | `ThinkingOrb state="working" size 32 color #9fd0ff`, "Brief ready", "3 items · “read it”" |
| Home | Lights 40%, Heating 19° |

### Widgets

- `sg-glass`, `w-[44%]`, `rounded-2xl p-3`, absolutely positioned at `pos.x`, `pos.y` (fractions of the glass).
- Header: icon and uppercase name; a **Lock** icon if any needed permission is missing, else a **Move** icon.
- **Missing permissions**: the body is blurred 2 px at 25% opacity and a line reads "Needs {perm} and {perm} access".
- Selected module has an `accent2` ring; pointer down or drag start selects it (and so the Permissions drawer edits it).
- Enter and exit: opacity and scale, spring stiffness 300, damping 26.

### Dragging

```ts
drag dragConstraints={frame} dragElastic={0.05} dragMomentum={false}
whileDrag={{ scale: 1.04, boxShadow: "0 24px 60px -20px rgba(0,0,0,0.8)", zIndex: 40 }}
```

On release (`settle`) the drag offset is folded into `pos`, clamped to x in `[0.02, 1 - w/fw - 0.02]` and y in `[0.04, 1 - h/fh - 0.12]`, and `moved` becomes true. `touch-none` on widgets so dragging works on touch.

**Drag hint**: until something is moved, the Clock has a pulsing ring (`.drag-me`, 1.8 s, starts after 0.9 s; off under reduced motion) and a "Drag to move" accent pill (left arrow, hand, right arrow swaying 3 px every 1.6 s) that appears after 0.9 s.

### Masonry auto layout

```ts
// Until a module is dragged, the modules sit in two columns from the top of the glass, each as tall as
// its content, with the same gap everywhere; a module that is switched on goes to the shorter column.
const gap = Math.round(Math.max(8, fw * 0.022)), top = Math.round(Math.max(fh * 0.07, 46)); // clear of the camera pill
const cols = [top, top], xs = [0.05, 0.51];
```

Modules are placed in `MODULES` order, each into the shorter column; re-run on resize of the glass or any widget (`ResizeObserver`) and whenever modules, permissions or `moved` change. After the first frame, a 500 ms `left/top` transition (`ease-out-expo`, `cubic-bezier(0.16, 1, 0.3, 1)`) makes re-layouts glide. Once the visitor drags anything, auto layout stops.

### Camera indicator

A pill at the top centre: "Shutter closed" with a grey dot, or "Camera · {module names}" with a glowing `accent2` dot when any visible module has camera permission. No module needs the camera and camera defaults to off, so it reads "Shutter closed" until the visitor grants it.

---

## Ask Selika pill (`AskPill.tsx`)

> "Ask Selika": the voice interaction, simulated with prompts you can tap. Selika's answer appears inside the same pill, above the prompt, so it never lands on top of the glass.

### Prompts

Beauty:

| Prompt | Action | Reply |
|---|---|---|
| Next step | step + 1 (max 5); smile on Done | that step's voice line |
| Show me the evening look | look evening, step max(step, 4) | "Evening look. Darker lip, winged liner." |
| Warmer light | light restaurant | "Restaurant light, 3000K. Reds deepen here." |
| Try it in office light | light office | "Office light, 4000K. Flat and overhead." |
| Repeat that | none | current step's voice line |
| Something bolder | look bold, step max(step, 4) | "Bold look. Graphic liner, bright lip." |

Dev:

| Prompt | Action | Reply |
|---|---|---|
| Read my brief | select agent | "Three items: stand-up at nine, a design review, and the gym at six." |
| Show my build status / Hide the build module | toggles build on (and selects it) or off | "Build status on. It only gets network access." / "Build status hidden." |
| Show my home | home on, selected | "Home module on. It only gets network access." |
| Use my own model | model endpoint | "Switched to your endpoint. Nothing else changes." |

### Behaviour

- Shown as “Selika, {prompt with a lower-case first letter}” in a 20 px high slot that slides (in from y 14, out to y -12, 0.3 s).
- Label above: "Say, or tap" (breathing), "Listening", "On it" (working).
- **Cycling**: every **3.2 s** the next prompt shows, only while breathing, with no reply on screen, and not under reduced motion. Resets to the first prompt on product change.
- **Tap**: state `listening` for **640 ms**, then `working` for **520 ms**, then the action runs, state returns to `breathing` and the next prompt shows.
- **Reply**: shown for **4.2 s** (`aria-live="polite"`), with a message icon and "Selika:" in `accent2`. Replies cross-fade (`mode="wait"`, 0.18 s).
- **Measured-height reply area**: a `ResizeObserver` keeps `replyH` equal to the reply wrapper's natural height; the outer span animates `height` between 0 and `replyH` over 0.32 s with `[0.16, 1, 0.3, 1]`, so the pill grows and shrinks once, straight to size, without overshoot.
- Button: `lg-glass lg-glass-deep`, `max-w-[22rem]`, `rounded-[1.75rem]`; hover scale 1.02, tap 0.97 (spring 380 / 28), off under reduced motion.

### ThinkingOrb states used

| Where | State | Size | Colour |
|---|---|---|---|
| Mirror placeholder before the face loads | searching | 64 | default, dark theme |
| Ask pill idle | breathing | 32 | `#c7b6ff` (Beauty) or `#9fd0ff` (Dev) |
| Ask pill after tap | listening, then working | 32 | as above |
| Agent brief module | working | 32 | `#9fd0ff` |

---

## Phones and touch

| Area | Behaviour |
|---|---|
| Layout | Single column below `lg`: header, then the mirror (max 36rem, 4:5), then the panel |
| Copy | Coarse pointers get "Tap a feature for its guide, step through a look, relight it." |
| Hover tips | `pointerdown` picks the region, so a tap shows the tip and guide zone |
| Scrolling | The face canvas has `touch-action: pan-y`, so swiping over the face still scrolls the page |
| Rendering (low tier) | Photo face: DPR capped at 1.25, guide canvas 512 x 640, drawing capped at 30 fps. 3D fallback: low DPR range, no antialias, 512 guide and 256 lash textures, guides repaint at 12 fps |
| Off screen | The face stops drawing when the mirror leaves the viewport (80 px margin) and only mounts within 1.5 screens |
| Panels | Segment buttons stack icon over label with values hidden; looks in 2 columns; Next step full width |
| Dev | Phones under 640 px start with four modules (no Build status, no Home); widgets are 44% wide; auto layout gap is at least 8 px and the top offset at least 46 px; `touch-none` widgets drag with a finger |
| Pointer light | The key light follows the last touch point (`frame.pointer`), and idles with a slow sway when there is none |
