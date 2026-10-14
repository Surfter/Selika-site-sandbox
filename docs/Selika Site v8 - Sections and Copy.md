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
key: A top-to-bottom walk through every section of the Selika v8 site in the order App.tsx renders it, with anchors, desktop and phone layouts, components, interactions and animations, plus the complete verbatim copy from src/lib/content.ts and every inline string. Read it when rebuilding a section, editing copy, or checking what the site says and how it is worded.
---

# Selika Site v8 - Sections and Copy

> [!abstract] Key
> A top-to-bottom walk through every section of the Selika v8 site in the order App.tsx renders it, with anchors, desktop and phone layouts, components, interactions and animations, plus the complete verbatim copy from src/lib/content.ts and every inline string. Read it when rebuilding a section, editing copy, or checking what the site says and how it is worded.

**Related:** [[Selika Site v8 - Build Bible]] | [[Selika Site v8 - Architecture and Stack]] | [[Selika Site v8 - Design System]] | [[Selika Site v8 - Hero and Mirror Scene]] | [[Selika Site v8 - Aurora Background]] | [[Selika Site v8 - Interactive Demo]] | [[Selika Site v8 - Assets and Provenance]] | [[Selika]]

---

## 1. Page order (src/App.tsx)

`App.tsx` renders, in this exact order:

| # | Element | Source | Anchor id | `data-stream` |
|---|---|---|---|---|
| 1 | `<MotionDriver />` (Lenis smooth scroll, pointer tracking, one shared GSAP ticker, world colour tween) | src/lib/motion.tsx | none | none |
| 2 | `<GlassFilters />` (hidden SVG with `#sg-refract`, `#lg-lens`, `#sg-lens` filters) | src/components/ui.tsx | none | none |
| 3 | `<Background />` (full-screen aurora shader canvas, see [[Selika Site v8 - Aurora Background]]) | src/gl/Background.tsx | none | none |
| 4 | `<Preloader />` | src/components/Preloader.tsx | none | none |
| 5 | Skip link `<a href="#demo">` | src/App.tsx | none | none |
| 6 | `<Nav />` | src/components/Nav.tsx | none | none |
| 7 | `<main>`: `<Hero />` | src/sections/Hero.tsx | `top` | `0` |
| 8 | `<Problem />` | src/sections/Problem.tsx | `problem` | `1` |
| 9 | `<DemoSection />` | src/sections/demo/DemoSection.tsx | `demo` | `1` |
| 10 | `<OnlyMirror />` | src/sections/Problem.tsx | none | `-1` |
| 11 | `<TwoProducts />` | src/sections/TwoProducts.tsx | `products` | `1` |
| 12 | `<Compare />` | src/sections/Compare.tsx | none | `-1` |
| 13 | `<Inside />` | src/sections/Inside.tsx | `inside` | `1` |
| 14 | `<Privacy />` | src/sections/Privacy.tsx | `privacy` | `-1` |
| 15 | `<Roadmap />` | src/sections/Roadmap.tsx | `roadmap` | `1` |
| 16 | `<About />` | src/sections/Roadmap.tsx | `about` | `-1` |
| 17 | `<Footer />` (outside `<main>`) | src/sections/Roadmap.tsx | none | `0` |

> [!note] Order
> The demo comes straight after the problem cards, and the "What can only a mirror do?" tiles come after the demo (App.tsx renders `<Problem />`, `<DemoSection />`, `<OnlyMirror />`). `data-stream` (1, -1 or 0) is read by the aurora background, see [[Selika Site v8 - Aurora Background]].

`src/main.tsx` sets `document.documentElement.dataset.product = "beauty"` before render and mounts `<App />` inside `<StrictMode>`.

### Skip link (src/App.tsx)

- Text: `Skip to the demo`, `href="#demo"`.
- Classes: `sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[70] focus:rounded-full focus:bg-white focus:px-4 focus:py-2 focus:text-night`.

### `<head>` copy (index.html)

| Field | Text |
|---|---|
| `<title>` | `selika` |
| meta description | `Selika is one mirror platform with two products: Selika Beauty guides your makeup step by step on your own reflection, and Selika Dev opens the same mirror to developers and makers.` |
| og:title | `selika: one mirror, two products` |
| og:description | `Selika Beauty guides makeup on your own reflection, in light you control. Selika Dev opens the mirror to developers.` |
| og:url | `https://selika.site` |
| theme-color | `#05060A` |
| noscript | `Selika is one mirror platform with two products, Selika Beauty and Selika Dev. This site needs JavaScript for its interactive demo.` |
| JSON-LD | Organization, name `selika`, url `https://selika.site/`, logo `https://selika.site/icon-512.png` |

---

## 2. Shared building blocks (src/components/ui.tsx, src/index.css)

These are used by nearly every section, so their behaviour is documented once here.

| Component | Behaviour (exact values) |
|---|---|
| `Section` | `<section id data-stream className="relative py-20 md:py-28 ...">`. Default `stream = -1`. |
| `.wrap` | `mx-auto w-full max-w-[1320px] px-5 sm:px-8 lg:px-12` (index.css). |
| `Reveal` | Adds `.reveal`, then `.is-in` when an IntersectionObserver (rootMargin `0px 0px -8% 0px`) sees it; `once = true` by default (disconnects). Start state: `opacity: 0; transform: translate3d(0, var(--ry, 22px), 0)` with `--ry` = `y` prop (default 22 px). Transition: `opacity .9s cubic-bezier(.16,1,.3,1), transform 1s cubic-bezier(.16,1,.3,1)`. `delay` prop sets `transitionDelay` only once shown. Reduced motion: shown immediately, no transition. No IntersectionObserver: shown. |
| `Headline` | `<h2>` (or `as`) with `<span>{lead}</span>` + space + `<span class="accent-word">{accent}</span>`; `stack` puts each on its own block line. |
| `.accent-word` | Instrument Serif italic 400, `letter-spacing: -0.01em`, `color: rgb(var(--accent2))`, `transition: color .9s cubic-bezier(.16,1,.3,1)`, `padding-right: 0.06em`. |
| `.h-section` | Outfit semibold, `letter-spacing: -0.04em`, `line-height: 0.98`. |
| `.h-display` | Outfit semibold, `letter-spacing: -0.045em`, `line-height: 0.92`. |
| `.h-card` | Outfit medium, `letter-spacing: -0.02em`. |
| `.body-lg` | `text-[clamp(1rem,1.15vw+0.6rem,1.2rem)] leading-relaxed text-mute`. |
| `Button` | Magnetic pill. Pointer offset spring `stiffness 260, damping 18, mass 0.6`; x offset `(px - 0.5) * 10`, y offset `(py - 0.5) * 8` px (off on coarse pointers and reduced motion). Hover `scale 1.035`, tap `scale 0.95`, spring `420 / 24`. Sizes: normal `h-12 px-6 text-[0.95rem]`, small `h-10 px-4 text-[0.86rem]`. Variants: `accent` = `.btn-accent text-white`; `glass` = `lg-glass lg-glass-dark` with a `.lg-spec` pointer highlight (optional `sg-lens`); `ghost` = `text-mute hover:text-ink`. Icon nudges `translate-x-1` on hover. |
| `FlipCard` | A real `<button>` with `aria-pressed`. Hover flips on fine pointers (`hoverFlip && !isCoarse`), click/tap/Enter/Space toggles, Escape un-flips. `transform: rotateY(180deg)`, `transition: transform 0.7s cubic-bezier(0.76, 0, 0.24, 1)` (1.05 s on coarse pointers), `perspective: 1600px`. Hidden face gets `inert`. aria-label: `` `${label}: show detail` `` or `` `${label}: show summary` ``. |
| `Reactive` | Card that tilts toward the pointer: `rotateY = (px - 0.5) * max * 2`, `rotateX = -(py - 0.5) * max * 1.6` (default `max = 4`), spring `220 / 20`, `transformPerspective: 1000`; hover lift `y: -lift` (default 5 px), spring `300 / 24`; touch gets `whileTap scale 0.985`. Sets `--mx/--my` for `.rc-glow` (18rem blurred accent2 disc at 0.16 alpha, blur 44 px, fades in 0.45 s on hover). `.rc:hover` brightens border to `accent2 / .5`. |
| `Logo` | `Mark` (rounded-rect mirror glyph with two diagonal glints) + the word `selika`, Outfit medium, `tracking-[-0.045em]`. Sizes sm/md/lg: text `1.08rem / 1.3rem / 2rem`, mark `19 / 23 / 34`. |
| `.tile-hover` | On hover: background `rgba(255,255,255,0.085)`, border `accent2 / .38`, glow shadow, `translateY(-3px)`; all `.4s cubic-bezier(.16,1,.3,1)`. |

Glass materials (`.sg-glass`, `.lg-glass` and variants) are documented in [[Selika Site v8 - Design System]].

---

## 3. Nav (src/components/Nav.tsx)

**Purpose:** fixed top navigation and mobile menu.

### Layout

- `<motion.header className="fixed inset-x-0 top-0 z-40">`, inner row `h-[var(--nav-h)]` (`--nav-h: 4.5rem`), `px-5 sm:px-8`, `justify-between`, and `lg:justify-center` with `gap-2.5`.
- Left: logo pill (`<a href="#top">`, `aria-label="selika, back to top"`), `lg-glass`, `h-11 rounded-full px-4`, Logo `md`.
- Centre (lg and up only, `hidden ... lg:flex`): `<nav aria-label="Sections">` glass pill `h-11 p-1`, links `h-9 px-4 text-[0.86rem]`.
- Right: `Try the demo` accent Button (small, forced `!h-11 !px-5`), shown from `sm` up only; menu button `Open menu` (`h-11 w-11`, `lg:hidden`).
- Phones (below `sm`): logo pill and menu button only. Tablets (`sm` to `lg`): logo, Try the demo, menu button. Desktop (`lg`): logo, centred link pill, Try the demo, no menu button.

### Interactions and animation

- Entrance: `initial { y: -24, opacity: 0 }`, animates to `{ y: 0, opacity: 1 }` only once `entered` is true; `duration 0.9, delay 0.1, ease [0.16, 1, 0.3, 1]`.
- Solid state: pills switch from `lg-glass-dark` to `lg-glass-deep` when `window.scrollY > window.innerHeight * 0.6` (`transition-[background-color] duration-500`).
- Active link: IntersectionObserver with `rootMargin "-45% 0px -50% 0px"` over the NAV section ids; active link text `text-night` on a white thumb `motion.span layoutId="nav-thumb"`, spring `stiffness 380, damping 34`; others `text-ink/75 hover:text-ink`; `aria-current="true"` on the active one.
- Clicks go through Lenis: `lenis.scrollTo(href, { duration: 1.6, offset: 0 })`.
- `onPointerMove={specMove}` moves the `.lg-spec` highlight with the pointer.
- Mobile menu: full-screen overlay (`fixed inset-0 z-50 lg:hidden`) fades in; backdrop button `aria-label="Close menu"` `bg-night/60 backdrop-blur-sm`; dialog (`role="dialog" aria-modal="true" aria-label="Menu"`), `sg-glass sg-glass-strong absolute inset-x-3 top-3 rounded-[2rem] p-5`, `initial { y: -20, opacity: 0, scale: 0.98 }`, exit `{ y: -14, opacity: 0, scale: 0.98 }`, spring `340 / 30`. Lenis is stopped while the menu is open.
- Menu items: `font-display text-[1.6rem] tracking-[-0.03em]`, border-bottom `white/10`, `py-4`, each with an `ArrowUpRight` icon; stagger `delay 0.05 + i * 0.04` from `{ opacity: 0, x: -10 }`. Footer of the menu: full-width `Try the demo` accent button.

### Copy

| Element | Text |
|---|---|
| NAV labels (content.ts `NAV`) | `Products` (#products), `Demo` (#demo), `Hardware` (#inside), `Privacy` (#privacy), `Roadmap` (#roadmap) |
| CTA | `Try the demo` |
| aria-labels | `selika, back to top`, `Sections`, `Open menu`, `Close menu`, `Menu` |

---

## 4. Preloader (src/components/Preloader.tsx)

**Purpose:** counts the page in while fonts and the hero scene code load, then opens into the outline of the hero mirror. Full timings and the handoff are in [[Selika Site v8 - Hero and Mirror Scene]].

- Root: `pointer-events-none fixed inset-0 z-[60]`, `role="status"`, `aria-label="Loading selika"`.
- A night layer (`bg-night`), an SVG with a faint track (`rgba(255,255,255,0.08)`, 1.5 px) and the progress line (`rgb(var(--accent2))`, 2 px, round caps, `drop-shadow(0 0 6px rgb(var(--accent2) / 0.8))`), drawn as a circle of radius `R0 = 46` at the viewport centre.
- Centre: the logo `Mark` at size 30 in `text-accent2`, and the percentage below it (`top-[4.6rem]`, Outfit medium `0.8rem`, `tracking-[0.08em]`, `text-mute`, tabular), text `{Math.round(n * 100)}%`.

---

## 5. Hero (`#top`, src/sections/Hero.tsx)

Brief here; everything else is in [[Selika Site v8 - Hero and Mirror Scene]].

- Wrapper `h-[190svh] md:h-[220svh]` with a sticky `h-[100svh]` stage; the extra height drives the "dive" through the mirror.
- Layers: BigPhrase (behind), 3D HeroScene (`z-10`), OrbOverlay (`z-30`), copy and switchers (`z-20`).
- Desktop: copy top left at `lg:left-[5vw] lg:top-[19svh]`, product switcher cards on the right (`right-[4vw]`), big phrase split around the mirror along the bottom. Phones: copy on top, mirror in the band below, pill switcher at the bottom.

### Hero copy (content.ts `PRODUCTS`)

| Field | Selika Beauty | Selika Dev |
|---|---|---|
| `name` | Selika Beauty | Selika Dev |
| `eyebrow` (not rendered) | Selika Beauty | Selika Dev |
| `headline[0]` | A mirror that | A mirror you can |
| `headline[1]` (italic accent) | guides you. | build on. |
| `body` | Step-by-step makeup guidance drawn on your own reflection. Hands-free with voice, in light you control. | Finished hardware and an open platform for developers and makers: modules, your own models and agents, voice, and permissions you set. |
| `big` (split phrase) | `Guided on` + accent `you.` | `Built by` + accent `you.` |
| `card` (switcher caption) | Makeup, guided on your reflection | An open mirror platform |
| `cta` | Try Selika Beauty | Try Selika Dev |
| Secondary button | `Meet Selika Dev` | `Meet Selika Beauty` |

Other hero strings: radiogroup `aria-label="Choose a product"`, chevron buttons `Previous product` / `Next product`, feature card button `More detail` / `Show less`.

### Feature orbs (content.ts `PRODUCTS[*].features`)

Each feature is a bubble in the hero. `label` shows as a mono caption under the bubble, `short` on the card, `detail` when the card is expanded.

**Selika Beauty**

| id | icon | label | short | detail |
|---|---|---|---|---|
| guided | ListChecks | Guided steps | One step at a time, on your reflection. | Selika draws each step onto your own reflection: where the liner goes, how far the blush reaches, when to move on. No phone to prop up and pause with product on your fingers. |
| light | SunMedium | High-CRI light | Colour chosen in light you control. | Tunable, high-colour-rendering light from 2700K to 6500K, built into the mirror, so colour decisions are made in controlled light rather than whatever the bathroom has. |
| voice | Mic | Hands-free | Next step, repeat, warmer light. | Your hands are busy, so you talk to it. Voice moves you through the steps and changes the light without touching a thing. |
| tryon | WandSparkles | Try-on | See a look before you commit. | After guidance comes try-on: preview a look on your reflection first, then follow the steps that create it. |
| presets | MoonStar | Light presets | Office, restaurant, evening. | Check how a look reads under office, restaurant and evening presets before you leave the house. |
| creators | Palette | Creator looks | New looks from artists. | New looks from makeup artists and creators arrive on the mirror over time, so it keeps getting better after you buy it. |
| shutter | CameraOff | Privacy shutter | A real shutter over the lens. | A physical shutter blocks the camera whenever you want it closed, and processing stays local by default. |

**Selika Dev**

| id | icon | label | short | detail |
|---|---|---|---|---|
| modules | LayoutGrid | Modules | Small, declarative, yours. | Build modules for the surface you stand at twice a day. A few lines describe what shows, where, and when. |
| models | Cpu | Your models | Bring your own AI. | Choose your own AI models and endpoints instead of being locked to ours. |
| agents | Bot | Agents | Your agents, on the glass. | Point the mirror at your own agents for briefings, reminders and routines, running only with the permissions you grant. |
| voice | AudioLines | Voice | Talk to what you build. | Voice interaction is part of the platform, so the modules you build can listen and answer, hands-free. |
| perms | ShieldCheck | Permissions | Each module sees only what you allow. | Explicit, per-module permissions for the camera, the microphone and your data. Nothing gets access you did not grant. |
| hardware | Layers | Finished hardware | No more DIY two-way mirrors. | Makers already build smart mirrors from a Raspberry Pi, a two-way mirror and MagicMirror², which has over 20,000 stars on GitHub. Selika Dev is designed to give them finished hardware and an open platform. |
| ecosystem | Share2 | Beyond beauty | A route well beyond beauty. | If Selika Beauty builds the first installed base, developers could later build tools, lessons and agents for those owners. In parallel, Selika Dev takes the mirror well beyond beauty. |

---

## 6. The problem (`#problem`, src/sections/Problem.tsx `Problem`)

**Purpose:** name the three pains of getting ready, each card flipping to show how Selika helps.

### Layout

- `Section id="problem" stream={1} className="z-10 -mt-[40svh] md:-mt-[50svh]"`: the negative top margin pulls the section up into the hero's tall scroll wrapper, so the problem cards arrive while the hero's dive is finishing, and `z-10` keeps them above the hero.
- Heading: `<h2 class="h-section text-[clamp(1.75rem,4.5vw,4.3rem)]">` with two block lines, the second as `.accent-word` (the whole sentence is italic serif).
- Body: `body-lg mt-4 max-w-[46rem]`.
- Cards: `mt-10 grid gap-4 md:grid-cols-3`. Phones and small tablets: one column stack; from `md` (768 px): three columns.

### Cards

- Each card is wrapped in `Reveal delay={0.08 * i}` and is a `FlipCard` (label = the card's `front` text).
- Front: `sg-glass tile-hover rounded-[1.6rem] p-6`; top row has the icon in `h-11 w-11 rounded-2xl bg-accent/15 text-accent2` and a small round `RotateCcw` hint (`h-8 w-8 border-white/12`) that rotates 180 degrees on hover (`group-hover/flip:rotate-180`, 500 ms). Title `h-card mt-5 text-[1.3rem] leading-[1.18]`, text `mt-2.5 text-[0.95rem] text-mute`.
- Back: `sg-glass sg-glass-strong rounded-[1.6rem] p-6` with inset ring `inset 0 0 0 1px rgb(var(--accent2) / .35)`; `Sparkles` icon in `bg-accent/25`; label `How Selika helps` (`text-[0.82rem] font-medium text-accent2`); fix text `text-[1.02rem] text-ink/90`.
- Interaction: hover flips on a mouse; tap, click, Enter or Space toggles; Escape returns to the front. Flip 0.7 s (1.05 s on touch) `cubic-bezier(0.76, 0, 0.24, 1)`.

### Copy (content.ts `PROBLEM`)

| Field | Text |
|---|---|
| eyebrow (not rendered) | The problem |
| title[0] | You get ready in a mirror. |
| title[1] (accent) | The help is everywhere else. |
| body | Three things get in the way every time you get ready. |
| Back-face label (inline) | How Selika helps |

| n | icon | front | text | fix (back) |
|---|---|---|---|---|
| 01 | Smartphone | The help isn't on the mirror. | Tutorials play on a phone you have to prop up, pause and scroll with makeup on your fingers. | Selika puts each step on your reflection, and you move on by voice, so your hands stay free. |
| 02 | Lightbulb | Colour is chosen in the wrong light. | Shades are picked under bathroom light, then seen in very different light once you leave. | Selika lights your face from the mirror itself and can switch to the light you'll be in: daylight, office, restaurant or evening. |
| 03 | Hourglass | The mirror never gets better. | Every other screen you own gets new features after you buy it. Your mirror stays exactly the same. | Selika is built to gain new looks and lessons over time, and Selika Dev lets people build their own tools for it. |

---

## 7. Demo (`#demo`, src/sections/demo/DemoSection.tsx), brief

Full detail in [[Selika Site v8 - Interactive Demo]].

- `<section id="demo" data-stream="1" className="relative py-24 md:py-32">`.
- Header row: `flex-col gap-6`, from `lg` `flex-row items-end justify-between`. Left: `Headline lead="Try it on" accent="the glass."` (`text-[clamp(1.9rem,4.4vw,4.2rem)]`). Right (`Reveal delay 0.1`): product tabs (`role="tablist" aria-label="Demo product"`, white thumb `layoutId="demo-tab"`, spring `380 / 32`, each tab `min-w-[9rem]`) and a hint line.
- Body: `grid-cols-[minmax(0,1fr)]`, from `lg` `grid-cols-[minmax(0,1fr)_minmax(0,0.92fr)]`, `gap-6`. Left: the mirror (`aspect-[4/5] max-w-[36rem] rounded-[2.4rem]`). Right (`Reveal delay 0.08`): the control panel in `sg-glass rounded-[2rem] p-5 sm:p-7`, swapped on product change with `{ opacity 0, x 18, blur 6px }` to rest (spring `220 / 26`) and exit `{ opacity 0, x -14, blur 6px }` in 0.2 s.
- The face scene lazy-loads when the mirror is within `rootMargin "150% 0px"`; a `ThinkingOrb` (`state="searching" size={64} theme="dark"`) shows until then. It renders only while visible (`rootMargin "80px 0px"`). `FACE_PACKS` has four packs (`fair`, `medium`, `warm`, `deep`), so the photographic `PhotoFace` is used.
- On Dev, the reflection dims to `opacity 0.28` with `saturate(0.35) brightness(0.8)` over 0.7 s and the module layer (`DevLayer`) fades in.

### Demo inline copy

| Where | Text |
|---|---|
| Heading | `Try it on` + accent `the glass.` |
| Tabs | `Selika Beauty`, `Selika Dev` |
| Hint, Beauty, mouse | `The face follows your cursor. Hover a feature for its guide.` |
| Hint, Beauty, touch | `Tap a feature for its guide, step through a look, relight it.` |
| Hint, Dev | `Drag modules around, set what each may access, swap the model.` |
| Status chips (Beauty) | `Step {n} of 5 · {step name}` and `{light name} · {K}K` |
| WebGL fallback | `The 3D face could not start in this browser (it needs WebGL). The steps, light and looks alongside still show what Selika Beauty guides.` |
| Disclaimer (PHOTO is true) | `A browser simulation of the planned products, with illustrative lighting values and sample data. The face is AI-generated, not a real person. On the device, the guidance is drawn on your own reflection.` |
| Disclaimer (fallback, no face packs) | `... The face is ICT-FaceKit's generic 3D model, not a real person. ...` |

Hover tips (`TIPS`):

| Region | Tip |
|---|---|
| brows | Brows: start above the nose wing, arch through the centre of the eye, tail at the outer corner. |
| eyes | Eyes: the liner hugs the lash line, and the wing follows the guide up toward the brow tail. |
| cheeks | Cheeks: blush sits on the cheekbone and blends up toward the temple. |
| lips | Lips: line first along the guide, then fill. |
| nose | Selika maps the centre of your face first, so every other guide lines up. |
| skin | Base and shade are checked in controlled 5000K light. |

---

## 8. What can only a mirror do? (src/sections/Problem.tsx `OnlyMirror`, src/sections/OnlyMirrorArt.tsx)

**Purpose:** justify the mirror form factor with three animated tiles.

### Layout

- `Section stream={-1}` (no id).
- `Headline lead="What can only" accent="a mirror do?"` with `h-section text-[clamp(1.9rem,4.2vw,4rem)]`; body `body-lg mt-5 max-w-[40rem]`.
- Tiles: `mt-10 grid gap-4 lg:grid-cols-3`. Below `lg` (1024 px) the three tiles stack in one column; from `lg` they sit in three columns.
- Each tile: `Reveal delay={0.08 * i}` > `TiltCard` > `sg-glass tile-hover flex h-full flex-col rounded-[1.6rem] p-3`, containing the art stage, then at the bottom (`mt-auto px-3 pt-6`) a row with the icon (`h-8 w-8 rounded-xl bg-accent/15 text-accent2`, size 16) and the title (`h-card text-[1.22rem] leading-[1.18]`), then the body (`mt-2 px-3 pb-3 text-[0.92rem] text-mute`).

### TiltCard interaction

- `perspective: 1200px`; rotateY `(px - 0.5) * 9` degrees, rotateX `-(py - 0.5) * 7` degrees; springs `stiffness 200, damping 20`; resets on leave. Off on coarse pointers and under reduced motion.
- A soft lit spot (`h-40 w-40 bg-white/[0.07] blur-2xl`) follows the cursor (`left/top` = pointer percentage) and fades in on hover (`duration-500`).

### Copy (content.ts `ONLY_MIRROR`)

| Field | Text |
|---|---|
| eyebrow (not rendered) | Why a mirror |
| title[0] | What can only |
| title[1] (accent) | a mirror do? |
| body | Every feature has to justify needing a mirror. Three answers held up. |

| k | icon | title | body | Stage caption (inline) |
|---|---|---|---|---|
| Reflect | ScanFace | Guides on your reflection | A phone shows you a camera image of yourself. Selika works on the reflection you already trust, while both hands are busy. | Drawn on your reflection |
| Light | SunMedium | Lights you from the glass | The light comes from the glass you are looking at, tuned from 2700K to 6500K with high colour rendering, so colour reads true. | Light from the glass, 2700K to 6500K |
| Return | Repeat | The same view every day | Same angle, same distance, same light every morning. A phone camera never gets that, and the heavy compute runs on your phone. | Same angle, same light, every day |

### Tile art (src/sections/OnlyMirrorArt.tsx, keyframes in src/index.css)

All three are pure CSS animation (the file comment: "animated with CSS so they cost nothing to run"). Each uses a portrait that is AI-generated, not a real person.

**Stage** (shared): `om-stage relative aspect-[16/10] overflow-hidden rounded-[1.2rem] bg-[#06070c] ring-1 ring-white/10`, `aria-hidden`; caption pill `absolute bottom-2.5 left-3 rounded-full bg-black/55 px-2.5 py-1 text-[0.68rem] text-ink/85 backdrop-blur`.
**MiniGlass** (shared): centred `aspect-[4/5] h-[86%] rounded-[0.9rem]` with an `<img>` (`loading="lazy" decoding="async"`, `object-cover`).

**ReflectArt** (`/visuals/reflect.webp`)

- MiniGlass ring `ring-1 ring-white/25` and shadow `0 0 0 3px rgba(255,255,255,0.04), 0 0 40px -6px rgb(var(--accent)/0.6)`.
- SVG `viewBox="0 0 400 500"` overlay with guide paths in `rgb(var(--accent2))`: two brow paths (stroke 5, `--d: 0s`), two liner paths (stroke 4.5, `--d: 0.9s`), one lip outline (stroke 4, `--d: 1.8s`), all `pathLength={1}`; ten white dots (`r="5.5"`) at the guide endpoints with `--d: 0.3s + i * 0.12s`.
- `.om-draw`: `stroke-dasharray: 1; stroke-dashoffset: 1; animation: om-draw 7s cubic-bezier(.45, 0, .2, 1) var(--d) infinite both;` glow `drop-shadow(0 0 5px rgb(var(--accent2) / .9))`. Keyframes: 0% offset 1, 20% offset 0 (drawn), 78% still visible, 90% to 100% opacity 0.
- `.om-dot`: `om-dot 7s cubic-bezier(.16, 1, .3, 1) var(--d) infinite both`: 0% `opacity 0, scale(.3)`, 9% `opacity 1, scale(1)`, 78% held, 90% to 100% `opacity 0, scale(.6)`.
- `.om-scan`: an 18%-tall band, `rgb(var(--accent2) / .22)`, `blur(10px)`, `mix-blend-mode: screen`, `om-scan 3.8s cubic-bezier(.45, 0, .55, 1) infinite` from `translateY(-110%)` to `translateY(560%)`.

**LightArt** (`/visuals/light.webp`)

- `.om-ring` (`aspect-[4/5] h-[92%] rounded-[1.15rem]`) behind the glass: `om-ring 10s linear infinite` box-shadow cycling `#ffb46b` (0%/100%), `#ffc992` (20%), `#ffe2c2` (40%), `#f4f0ff` (60%), `#d6e4ff` (80%), each `0 0 0 2px <c>, 0 0 34px 2px <c at .45 to .55>`.
- `.om-tint` over the photo, `mix-blend-soft-light`, `opacity .55`, `om-tint 10s linear infinite`: `#ff9a4a` (0%/100%), `#ffbe80` (20%), `#ffe2c2` (40%), `#f4f0ff` (60%), `#b9d0ff` (80%).
- Kelvin readout pill (top right, `h-6 w-16 bg-black/55`), five stacked labels `2700K`, `3500K`, `4000K`, `5000K`, `6500K` each with a dot (`#ffb46b`, `#ffc992`, `#ffe2c2`, `#f4f0ff`, `#d6e4ff`). `.om-k`: `om-k 10s cubic-bezier(.16, 1, .3, 1) calc(var(--i) * 2s) infinite both`: rises in from `translateY(70%)` (0% to 4%), holds to 17%, leaves to `translateY(-70%)` by 21%. So each label shows for about 2 s in sequence, in step with the ring and tint.

**ReturnArt** (`/visuals/return.webp`)

- MiniGlass `ring-1 ring-white/20` with the photo plus three ghost copies (`.om-ghost`, `--i` 0, 1, 2): `om-ghost 8s cubic-bezier(.16, 1, .3, 1) calc(var(--i) * 2.66s) infinite both`; each starts offset like a hand-held selfie `translate(16%, -7%) rotate(7deg) scale(1.14)` at opacity 0, reaches `.75` at 6%, settles to `transform: none` and opacity 1 at 24%, holds to 30%, fades by 40%.
- Fixed framing marks: SVG `viewBox="0 0 160 100"`, corner brackets `M58 12 h-6 v6 M102 12 h6 v6 M58 88 h-6 v-6 M102 88 h6 v-6` and a centre cross at `.55` opacity, stroke `rgb(var(--accent2))` 1.1.
- Day chips `Mon`, `Tue`, `Wed`, `Thu` (top right, `text-[0.62rem]`): `om-day 8s ease calc(var(--i) * 2s) infinite both`, lit with `rgb(var(--accent))` and white text from 4% to 22%.

Reduced motion (index.css): `.om-draw` shows fully drawn, dots and the first Kelvin label shown statically, scan/ghost/day/ring/tint/k animations off, ring fixed at `#f4f0ff`.

---

## 9. One mirror. Two products. (`#products`, src/sections/TwoProducts.tsx)

**Purpose:** present Selika Beauty and Selika Dev side by side and state the shared core.

### Layout

- `Section id="products" stream={1}`.
- Centred title `h-section text-[clamp(2.2rem,5.4vw,5rem)]`: `One mirror.` + accent `Two products.`
- Panels: `relative mt-10 grid gap-4 lg:grid-cols-2`; Beauty in `Reveal`, Dev in `Reveal delay={0.1}`. Below `lg` the panels stack.
- From `lg` only: a round `lg-glass lg-glass-deep` badge (`h-[4.5rem] w-[4.5rem]`, `text-[0.62rem] uppercase tracking-[0.1em]`) centred between the panels reading `One` / `core`.
- Shared line: `mx-auto mt-8 max-w-[44rem] text-center text-[0.95rem] text-mute`.
- Statement: `mt-20 md:mt-28`, `max-w-[62rem]` centred, `h-section text-[clamp(1.9rem,4.4vw,4rem)] leading-[1.05]`.

### Panel

- `Reactive` with `max={3} lift={6}`, `group/panel sg-glass rounded-[2rem] p-7 sm:p-9`.
- When the panel's product is the current product: `boxShadow: inset 0 0 0 1px <ring>, 0 30px 70px -30px <tint>`; Beauty ring `rgba(185,169,255,0.55)` tint `rgba(139,124,255,0.16)`; Dev ring `rgba(142,197,255,0.55)` tint `rgba(77,141,255,0.16)`.
- Concept image (`/visuals/concept-beauty.webp`, `/visuals/concept-dev.webp`, made with Higgsfield): `aspect-[11/5] object-cover`, scales to `1.04` on panel hover over `1.2s ease-out-expo`; caption pill `Concept visualisation` (`text-[0.64rem]`, `bg-black/50`).
- Heading: `headline[0]` + accent `headline[1]` (`text-[clamp(1.8rem,3vw,2.6rem)]`), accent colour forced to `#C9B6FF` (Beauty) or `#A9D3FF` (Dev), so each panel keeps its own colour whatever product is selected.
- `who` line (`font-medium text-ink/80`), body (`text-mute`), four check points (`Check` icon in a `h-5 w-5 bg-white/10` circle).
- Button: `Try {name} in the demo`, variant `accent` if current else `glass`; click sets the product and `lenis.scrollTo("#demo", { duration: 1.5 })`.

### Statement (scroll-linked)

- `useScroll({ target, offset: ["start 0.85", "end 0.45"] })`.
- Words: `line[0]` split on spaces, `line[1]` split on spaces, then `line[2]` as one accent word. 15 words in all (8 + 6 + 1).
- Each word `i` of `n`: opacity maps `[i/n, (i+1)/n]` to `[0.16, 1]`, blur maps to `[6px, 0px]`. Words are `inline-block pr-[0.22em]`.

### Copy (content.ts `TWO`)

| Field | Text |
|---|---|
| eyebrow (not rendered) | One platform |
| title | `One mirror.` + accent `Two products.` |
| line[0] | Beauty proves why the mirror needs to exist. |
| line[1] | Dev proves what the mirror can |
| line[2] (accent) | become. |
| shared | Both are designed around the same core hardware, so they can share one supply chain. Beauty launches first as the clearest physical demonstration; the hardware is designed for Dev from the start. |
| Centre badge (inline) | One core |
| Image caption (inline) | Concept visualisation |
| Buttons (inline) | Try Selika Beauty in the demo / Try Selika Dev in the demo |

| | Beauty panel | Dev panel |
|---|---|---|
| Heading | A mirror that *guides you.* | A mirror you can *build on.* |
| who | For people who do their own makeup and grooming | For developers and makers |
| body | Guidance on your reflection for the moments that matter, such as interviews, presentations and weddings, and for professional makeup artists, for whom consistent colour matters every working day. | People already build their own smart mirrors from a Raspberry Pi, a two-way mirror and open-source software. Selika Dev is designed to give them finished hardware and an open platform. |
| point 1 | Guided steps for makeup and grooming | Modules as small declarative definitions |
| point 2 | Shade and undertone in controlled, high-CRI light | Bring your own models, APIs and agents |
| point 3 | Try a look before you commit | Voice interaction built in |
| point 4 | Office, restaurant and evening presets | Per-module permissions: each sees only what you allow |

---

## 10. Isn't this a lit mirror with extra steps? (src/sections/Compare.tsx)

**Purpose:** an honest comparison table against products already on sale.

### Layout

- `Section stream={-1}` (no id). `Headline` with `text-[clamp(1.9rem,4vw,3.9rem)]`, body `body-lg mt-5 max-w-[44rem]`.
- One glass container `sg-glass overflow-hidden rounded-[2rem]` in a `Reveal className="mt-10"`.
- **Phones (below `md`, 768 px):** one card per row question (`divide-y divide-white/[0.08]`, `p-5`): the question (`text-[1rem] font-medium`), then Selika's answer first in a highlighted box (`bg-white/[0.06] ring-1 ring-accent2/35`, label `Selika, designed to`), then a `grid-cols-3 gap-2` of the three rivals under short names `Beautifect`, `simplehuman`, `MIRARI` (`text-[0.72rem]`, `hyphens-auto`, `lang="en"`).
- **From `md`:** a real `<table class="cmp">` (`min-w-[46rem]`, horizontal scroll if needed); first column `w-[22%]` with an `sr-only` header `Capability`; Selika's column header reads a dot + `Selika` + `, designed to` (muted). Selika's column (`.cmp-sel`) has `background: rgb(var(--accent) / .08)` and accent2 side rules; header also a top rule. Rows `.cmp-row` brighten to `rgba(255,255,255,.03)` on hover.
- Footer strip: `grid gap-3 p-5 text-[0.82rem]`, from `md` `grid-cols-[1fr_1.2fr] gap-8`: the moat line (`text-ink/80`) and the sources note (`text-dim`).

### Marks and animation

- `ok: true`: a filled check circle. In Selika's column it is `cmp-pop bg-accent text-white`, others `bg-white/12 text-ink/85`.
- `ok: false`: a bordered `X`. `ok: null`: a bordered `Minus` (used for "Not listed").
- `.cmp-pop`: starts `scale(.4)` opacity 0; once its `Reveal` is in view (`.is-in`) it springs to rest with `transform .6s cubic-bezier(.34,1.56,.64,1), opacity .4s ease`, `transition-delay: calc(.25s + var(--i) * .14s)` where `--i` is the row index, so Selika's checks arrive row by row.

### Copy (content.ts `COMPARE` and inline `ROWS`)

| Field | Text |
|---|---|
| eyebrow (not rendered) | The honest answer |
| title[0] | Isn't this a lit mirror |
| title[1] (accent) | with extra steps? |
| body | Fair question. Lit mirrors with named lighting already sell, and one adds a touchscreen with try-on. Here is how they compare with what Selika is designed to do. |
| moat (rendered) | Making guidance land precisely on your reflection, not just on the display behind it, is our core technical work and, once solved, a potential moat. |
| Sources note (inline) | From each product's own page or UK retailer listings, checked 30 September and 2 October 2026. Not listed means the pages we checked don't mention it. Selika's column is what it is designed to do. |

Comparison rows (inline in Compare.tsx; columns `Beautifect Glow Mirror`, `simplehuman Sensor Mirror Pro`, `MIRARI Smart Makeup Mirror`, `Selika`):

| Capability | Beautifect Glow Mirror | simplehuman Sensor Mirror Pro | MIRARI Smart Makeup Mirror | Selika, designed to |
|---|---|---|---|---|
| Light set for where you're going | yes: Evening, daylight, bright sun | yes: Light captured from real places, since 2016 | yes: 3500K to 6000K modes | yes: 2700K to 6500K, high colour rendering |
| Try a look before you commit | Not listed | Not listed | yes: AR try-on on an 8-inch touchscreen | yes: On your own reflection |
| Step-by-step makeup guidance | Not listed | Not listed | Not listed | yes: Drawn on your reflection, by voice |
| Attaches to the mirror you own | no: Standalone mirror | no: Standalone mirror | no: Tabletop unit | yes: Clamp or adhesive mount |
| Open to developers | Not listed | Not listed | Not listed | yes: Selika Dev: modules, models, permissions |

Defined in content.ts but **not rendered** by Compare.tsx:

| Field | Text |
|---|---|
| rivals[0] | Beautifect Glow Mirror: A lit mirror with named lighting environments. |
| rivals[1] | simplehuman Sensor Mirror Pro: Has recreated light captured from real places since 2016. |
| rivals[2] | MIRARI Smart Makeup Mirror: An 8-inch touchscreen with AR try-on and skin analysis on a tabletop unit, around £305. |
| selika | Guidance on your own reflection, in light it controls, on a mirror others can build on, attached to the mirror you already own. |
| note | None of the products we checked attaches to a mirror you already own or opens itself to developers. |

---

## 11. What's inside the glass. (`#inside`, src/sections/Inside.tsx)

**Purpose:** the hardware bill of materials as an exploded stack of glass panes, with cost ranges and stats.

### Two layouts

`<section id="inside" data-stream="1" className="relative">` chooses at load time: `isNarrow || reducedMotion ? <Stacked /> : <Exploded />` (`isNarrow` = `window.innerWidth < 768` at start-up, src/lib/perf.ts).

**Exploded (768 px and wider, motion allowed)**

- Scroll track `relative h-[340svh]`, sticky child `top-0 h-[100svh] flex items-center`.
- Grid `wrap grid items-center gap-10 lg:grid-cols-[0.85fr_1.15fr]` (below `lg` the pane stack drops under the list).
- Left: `Headline` (`text-[clamp(1.9rem,3.6vw,3.6rem)]`), an ordered list of the seven layers as pills (`rounded-full border px-4 py-2 text-[0.88rem] backdrop-blur-md`, `transition-all duration-500`) with a two-digit index and the cost; below it a `min-h-[4.5rem]` paragraph that shows `INSIDE.body` before the walk-through and the active layer's `spec` during it (re-keyed per layer, `{ opacity 0, y 6 }` to rest in 0.4 s).
- List states: before the walk-through (`active < 0`) every row is readable (`border-white/15 bg-[rgba(14,16,26,0.62)] text-ink/90`); during it the active row is `border-accent2/60 bg-white/[0.12] text-ink` with its index in `text-accent2`, others `border-white/10 bg-[rgba(14,16,26,0.35)] text-mute`.
- Right: a `h-[34rem]` stage with `perspective: 2200px` holding seven panes (`h-[25rem] w-[18.75rem]`, `rounded-[1.6rem]`) each transformed `rotateX(56deg) rotateZ(-36deg) translateZ(z px)`.
- Scroll mapping (`useScroll offset ["start start", "end end"]`):
  - `spread` = `[0, 0.16, 0.9, 1]` to `[8, 74, 74, 60]` px: the stack starts as one slab, fans out by 16% progress, holds, and closes slightly at the end.
  - Pane z: `(n - 1 - i) * spread - ((n - 1) * spread) / 2`, plus 34 px for the active pane.
  - Active layer: `-1` while progress `< 0.18`, then `min(n - 1, floor(((v - 0.18) / 0.8) * n))`.
  - Pane look: active `opacity 1`, `background rgba(255,255,255,0.09)`, border `rgb(var(--accent2) / .7)`, glow `0 0 40px rgb(var(--accent) / .35)`; inactive `opacity 0.45` (all at 1 before the walk-through), `rgba(255,255,255,0.045)`, border `rgba(255,255,255,.14)`. Transition 500 ms on opacity, shadow and background.
- Pane art (`PaneArt`, SVG `viewBox 0 0 300 400`): mirror (two diagonal glints), display (12 px pixel grid with two UI bars), light (34 glowing LED dots around the rectangle 22,22 to 278,378), camera (lens circles and a shutter rect), audio (11 level bars plus a USB-C outline), controller (a chip with 6 pins per side labelled `S3`), frame (a 10 px rounded outline).

**Stacked (phones or reduced motion)**

- `py-24` wrapper; `Headline` (`text-[clamp(1.9rem,8vw,3.4rem)]`) and `INSIDE.body`; then one `sg-glass rounded-[1.4rem] p-4` row per layer (`Reveal delay 0.03 * i`) with a `h-24 w-[4.5rem]` thumbnail of the pane art, the name, the cost and the spec.

**Stats and cost note (both layouts)**

- `wrap pb-24 md:pb-36`, `grid gap-3 sm:grid-cols-3`; each stat a `Reactive` `sg-glass rounded-[1.4rem] p-6` (`Reveal delay 0.06 * i`), value in Outfit `text-[clamp(1.6rem,2.6vw,2.2rem)]` turning white on hover.
- Cost note `mt-5 max-w-[56rem] text-[0.8rem] text-dim`.

### Copy (content.ts `INSIDE`)

| Field | Text |
|---|---|
| eyebrow (not rendered) | The hardware |
| title[0] | What's inside |
| title[1] (accent) | the glass. |
| body | Both products are designed around the same core hardware, with your phone doing the heavy compute. The first Selika Beauty prototype is specified, with candidate Alibaba.com suppliers identified for all nine components. |

| # | id | name | spec | cost |
|---|---|---|---|---|
| 01 | mirror | Two-way mirror | Acrylic or glass, about 35 × 45 cm. Reflection and transmission to be measured on samples. | £3 to £9 |
| 02 | display | Display | A 13.3-inch 1080p panel and driver board behind the two-way mirror. Brightness through the mirror is the first thing we test. | £22 to £37 |
| 03 | light | Light | 95+ CRI tunable LEDs, 2700K to 6500K, on a dual-channel driver. | £4 to £17 |
| 04 | camera | Camera & shutter | A 1080p wide-angle module behind a physical privacy shutter, which is a custom part. | £9 to £26 |
| 05 | audio | Microphone & power | A MEMS microphone for hands-free voice and a 12 V USB-C power supply. | £3 to £7 |
| 06 | controller | Controller | An ESP32-S3 runs the lighting and peripherals. Your phone does the heavy compute. | £1 to £4 |
| 07 | frame | Frame & mount | Aluminium profile, diffuser, and a clamp or adhesive mount for the mirror you own. | £3 to £9 |

| Stat value | Stat label |
|---|---|
| £249 to £299 | Price hypothesis |
| 9 of 9 | Components with candidate suppliers |
| £69 to £163 | Estimated landed cost a unit at 1,000 |

costNote: `Per-unit estimates at 1,000 units from Accio Work's sourcing of Alibaba.com listings, converted at $1 = £0.7474. With assembly, freight, duty and import VAT, roughly £69 to £163 a unit landed, against a price hypothesis of £249 to £299.`

---

## 12. Private by design. (`#privacy`, src/sections/Privacy.tsx)

**Purpose:** show the privacy commitments, with a working camera shutter toy.

### Layout

- `Section id="privacy" stream={-1}`; `wrap grid gap-12 lg:grid-cols-[0.95fr_1.05fr] lg:items-center`. Below `lg`: one column (text and shutter, then the points grid).
- Left: `Headline` (`text-[clamp(1.9rem,4.2vw,4rem)]`), body `body-lg mt-6 max-w-[32rem]`, and the shutter card (`Reactive max={4}`, `sg-glass mt-9 max-w-[30rem] rounded-[1.8rem] p-5 sm:p-6`).
- Right: `grid gap-3 sm:grid-cols-2` of six point cards (`Reactive`, `sg-glass rounded-[1.4rem] p-5`, `Reveal delay 0.05 * i`); icon tile `h-10 w-10 rounded-xl bg-accent/15` scales `1.1` and rotates `-6deg` on hover (`duration-500 ease-out-expo`). Phones: one column; from `sm`: two.

### Shutter interaction

- State `closed` (starts `false`). Two controls toggle it: the whole camera SVG (a button, `aria-pressed`, `active:scale-[0.98]`) and a white pill button.
- `CameraModule` SVG (`viewBox 0 0 360 140`): housing, lens at (166, 70), capture light at (244, 70), three mic/sensor dots at x 282, 296, 310.
- Shutter slides inside a clipped slot: `x: closed ? 0 : -96`, spring `stiffness 230, damping 24`.
- Lens core opacity `0.25` closed, `0.9` open (0.5 s). Capture light glow `0` / `0.7`, dot `0` / `1` (0.4 s).
- Status chip: dot `bg-white/25` closed, `bg-accent2` with glow open; label swaps with `AnimatePresence mode="wait"` (`y 4` in, `y -4` out, 0.2 s).

### Copy (content.ts `PRIVACY` and inline)

| Field | Text |
|---|---|
| eyebrow (not rendered) | Privacy |
| title[0] | Private |
| title[1] (accent) | by design. |
| body | A mirror with a camera lives in the most private rooms of a home, and an open platform means letting other people's software run on it. Both are security problems first, and deciding who and what gets access to what is our day job. |
| Status chip | `Camera on` / `Camera covered` |
| Button | `Close the shutter` (Lock icon) / `Open the shutter` (Unlock icon) |
| Camera aria-label | `Close the camera shutter` / `Open the camera shutter` |
| Caption (open) | While the camera can see, the light beside it stays on. |
| Caption (closed) | The shutter physically covers the lens. No software can see past it. |

| icon | t | d |
|---|---|---|
| Aperture | Physical shutter | A real shutter that blocks the lens, not a software toggle. |
| CircleDot | Visible capture light | You can always see when the camera is in use. |
| HardDrive | Local by default | Processing stays on your devices unless you choose otherwise. |
| KeyRound | Per-module permissions | Each module sees only what you allow, nothing more. |
| CloudOff | No surprise cloud | No cloud path you did not explicitly turn on. |
| VideoOff | No always-on recording | The mirror is not a security camera, and never acts like one. |

---

## 13. HUD, then mirror, then platform. (`#roadmap`, src/sections/Roadmap.tsx `Roadmap`)

**Purpose:** the three-stage product roadmap and the immediate next steps.

### Layout

- `Section id="roadmap" stream={1}`; `Headline` (`text-[clamp(1.9rem,4.2vw,4rem)]`).
- Stages: `relative mt-14 grid gap-4 lg:grid-cols-3` (stacked below `lg`), each in `Reveal delay={0.12 * i}`.
- Each stage: a numbered circle `h-[3.2rem] w-[3.2rem]` (the number is `i + 1`; stage 1 uses `btn-accent`, others `sg-glass sg-glass-strong border-white/15`), then a `Reactive` card `sg-glass rounded-[1.6rem] p-6` with the name (`h-card text-[1.45rem]`, white on hover) and the body (`text-[0.92rem] text-mute`). Stage 1's card gets `inset 0 0 0 1px rgb(var(--accent2) / .45)`.
- Timeline line (from `lg` only): `absolute left-6 right-6 top-[1.6rem] h-px bg-white/20 origin-left`, grows `scaleX 0` to `1` on first view (`viewport { once: true, amount: 0.6 }`, `duration 1.6, ease [0.16, 1, 0.3, 1]`).
- Next steps: `mt-10 flex flex-wrap gap-2` of `sg-glass h-10 rounded-full px-4 text-[0.86rem]` chips joined by `ArrowRight` icons; each chip lifts `y: -3` on hover (spring `400 / 22`) and brightens its border.

### Copy (content.ts `ROADMAP`)

| Field | Text |
|---|---|
| eyebrow (not rendered) | Roadmap |
| title[0] | HUD, then mirror, |
| title[1] (accent) | then platform. |

| k (not rendered) | name | tag (not rendered) | body |
|---|---|---|---|
| 01 | Selika HUD | First build | A modular attachment for an existing mirror, with your phone doing the compute. It tests the hardest part first: guidance that lands accurately on your reflection, in controlled light. |
| 02 | Selika Mirror | Next | Purpose-built hardware: an integrated display, tunable high-CRI lighting, better optics, a physical privacy shutter and industrial design that belongs in the room. |
| 03 | Selika Platform | Then | The mirror as an extensible surface: looks and lessons from artists and creators, a module SDK, and bring-your-own model and agent endpoints. |

Next chips, in order: `Supplier samples` > `A working Selika Beauty prototype` > `Testing with fifteen target users` > `Selika Dev opens the hardware`.

---

## 14. Where this actually is. (`#about`, src/sections/Roadmap.tsx `About`)

**Purpose:** founder story, project status and the CoCreate application.

### Layout

- `Section id="about" stream={-1}`; `Headline` (`text-[clamp(1.9rem,4.2vw,4rem)]`).
- `mt-12 grid gap-4 lg:grid-cols-[1.1fr_0.9fr]` (stacked below `lg`).
- Left card: `Reactive max={2.5} lift={3}`, `sg-glass rounded-[2rem] p-7 sm:p-9`: a `grid-cols-3` status strip (label `text-[0.78rem] text-mute`, value `h-card text-[1rem]`) with a bottom border; then the three origin paragraphs (first `text-ink/90`, others `mt-4 text-mute`); then buttons `Explore the demo` (accent, `lenis.scrollTo("#demo", { duration: 1.6 })`) and `Back to top` (glass, `lenis.scrollTo(0, { duration: 2 })`).
- Right column: two `Reactive max={4}` cards (`sg-glass rounded-[1.6rem] p-6 sm:p-7`, `Reveal delay 0.08 * i`), title `h-card text-[1.2rem]`, two paragraphs `text-[0.9rem] text-mute`.

### Copy (content.ts `ABOUT`)

| Field | Text |
|---|---|
| eyebrow (not rendered) | Founder & status |
| title[0] | Where this |
| title[1] (accent) | actually is. |
| origin[0] | Selika started with an ordinary moment. I looked fine in the mirror, took a photo, and the photo looked like someone else. I wanted a mirror that could capture what I actually saw. |
| origin[1] | That idea did not survive testing: capturing photos ranked last of six use cases, and the first version looked like an expensive phone stand. So we asked a better question: what can only a mirror do? Guidance on your reflection, light from the glass, and the same view every day. |
| origin[2] | I'm a cyber security degree apprentice working in identity and access management. That is why a camera-equipped mirror gets a physical shutter and local-first processing as requirements, and why every Selika Dev module only gets the permissions you grant it. |
| Buttons (inline) | Explore the demo / Back to top |

| Status k | Status v |
|---|---|
| Stage | Concept & research |
| Products | Beauty & Dev |
| Next | First prototype |

| Card t | a | b |
|---|---|---|
| Where it stands | Concept and research stage, with the first Selika Beauty prototype specified and its components identified on Alibaba.com. The demo on this page is an interactive simulation of the planned product. | Next: supplier samples, a working prototype, and a structured test with fifteen target users. |
| Alibaba CoCreate Pitch 2026 | Selika has applied to the CoCreate Pitch 2026 Students Track, with the London finals in November 2026. | Finalists are announced on 20 October 2026. |

---

## 15. Footer (src/sections/Roadmap.tsx `Footer`)

### Layout

- `<footer data-stream="0" className="relative pb-6 pt-6">`, `wrap`, one `Reveal` glass panel `sg-glass rounded-[1.6rem] px-6 py-5 sm:px-7`.
- Top row: `flex-col gap-4`, from `lg` `flex-row items-center justify-between`. Left: `Logo md` and the tagline (`text-[0.9rem] text-mute`), side by side from `sm`. Right: `<nav aria-label="Footer">` with the five NAV links (`text-[0.86rem] text-ink/80`), each scrolling with `lenis.scrollTo(href, { duration: 1.6 })`.
- Bottom row: `mt-4 border-t border-white/10 pt-3.5 text-[0.72rem] text-dim`, `flex-col`, from `lg` `flex-row justify-between gap-6`.

### Copy (content.ts `FOOTER`)

| Field | Text |
|---|---|
| line | Today, mirrors reflect you. Selika is designed to understand you. |
| Left small print | `© 2026 Selika · ` + note: The demo is an interactive simulation of the planned product. Lighting values are illustrative. |
| credits | The faces, the hologram and the concept images are AI-generated. No real people are shown. |
| Footer nav | Products, Demo, Hardware, Privacy, Roadmap |

---

## 16. Text drawn into the 3D hero (src/gl/hud.ts)

These strings are painted onto canvas textures on the hero mirror (details in [[Selika Site v8 - Hero and Mirror Scene]]). Listed here so all site words are searchable.

| Texture | Strings |
|---|---|
| Status bar (both) | `selika` |
| Beauty HUD | `BEAUTY`, `5000K · CRI 95+`, `FACE MAPPED`, `LIVE`, `STEP 3 OF 5 · EYES`, `Flick the liner out`, `Follow the line from the outer corner.`, `LISTENING` |
| Dev HUD | `DEV`, `5 MODULES · LOCAL`, `CAMERA · OFF`, `MIC · ON`, `CALENDAR · ON` |
| Dev pane: clock | `CLOCK`, `07:42`, `TUESDAY 6 OCTOBER` |
| Dev pane: weather | `WEATHER`, `12°`, `Light rain`, `London` |
| Dev pane: calendar | `CALENDAR`, `09:00 Stand-up`, `13:30 Design review`, `18:00 Gym` |
| Dev pane: build | `BUILD · MAIN`, `Passing`, `#482 · 2 min ago` |
| Dev pane: code | `MODULE · BRIEF.TS`, then the code `export default module({` / `  name: "brief",` / `  permissions: ["calendar"],` / `  voice: "read it",` / `  render: (ctx) => ctx.agent("brief")` / `})` |

---

## 17. Honesty rules visible in the copy

The source comment in content.ts reads: "Every line on the site lives here. Source of truth: the final CoCreate application text (Draft 8). Planned features are described as planned." The copy applies that consistently:

| Rule | Where it shows |
|---|---|
| Planned, not shipped | Selika's comparison column is headed `Selika, designed to`; copy uses "is designed to", "is built to", "could later build"; the sources note says "Selika's column is what it is designed to do." |
| Competitor claims are scoped | Every rival cell comes from the product's own page or a UK retailer listing (Compare.tsx comment); unknowns read `Not listed` with a neutral Minus mark, explained as "Not listed means the pages we checked don't mention it", with the check dates `30 September and 2 October 2026`. Only confirmed absences (Standalone mirror, Tabletop unit) get an X. |
| AI-generated faces labelled | Demo disclaimer: `The face is AI-generated, not a real person.`; footer credits: `The faces, the hologram and the concept images are AI-generated. No real people are shown.`; OnlyMirrorArt comment notes the portraits are AI-generated, not a real person; facePacks.ts notes the packs are built from AI-generated portraits. |
| Concept images captioned | Each product panel image carries `Concept visualisation`. |
| Simulation, not product | Demo: `A browser simulation of the planned products, with illustrative lighting values and sample data.`; footer: `The demo is an interactive simulation of the planned product. Lighting values are illustrative.`; About card: `The demo on this page is an interactive simulation of the planned product.` |
| Numbers are ranges and estimates | Costs as `£x to £y`, `Price hypothesis`, `Estimated landed cost`, explicit exchange rate `$1 = £0.7474` and source (`Accio Work's sourcing of Alibaba.com listings`). |
| Stage stated plainly | About status `Concept & research`, `Next: First prototype`; CoCreate card says "has applied" and gives the finalist date rather than implying selection. |
| No em dashes | Copy uses colons, commas and "to" for ranges; no em or en dash appears anywhere in src. |

### Content fields defined but not rendered

`PRODUCTS[*].eyebrow`, `PROBLEM.eyebrow`, `ONLY_MIRROR.eyebrow`, `TWO.eyebrow`, `COMPARE.eyebrow`, `COMPARE.rivals`, `COMPARE.selika`, `COMPARE.note`, `INSIDE.eyebrow`, `PRIVACY.eyebrow`, `ROADMAP.eyebrow`, `ROADMAP.stages[*].k` (numbers come from the index) and `ROADMAP.stages[*].tag`, `ABOUT.eyebrow`. The `Eyebrow` component and `.eyebrow` class exist in ui.tsx and index.css but no section uses them.
