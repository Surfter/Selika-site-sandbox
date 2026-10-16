---
tags:
  - selika
  - web-dev
  - design
  - react
type: reference
status: active
date: 2026-10-09
source: selika site v8 source (branch v8-overhaul, final build 8.9), Projects/Selika Site/selika 8.9
key: The visual and interaction system of the Selika v8 site, covering colour tokens and the Beauty/Dev accent swap, typography and type scale, layout and spacing, the glass materials, every shared UI component, the Preloader, motion language, iconography, brand mark and favicons, and copy rules, with the full CSS verbatim. Read it when recreating the look or adding anything new to the site.
---

# Selika Site v8 - Design System

> [!abstract] Key
> The visual and interaction system of the Selika v8 site, covering colour tokens and the Beauty/Dev accent swap, typography and type scale, layout and spacing, the glass materials, every shared UI component, the Preloader, motion language, iconography, brand mark and favicons, and copy rules, with the full CSS verbatim. Read it when recreating the look or adding anything new to the site.

**Related:** [[Selika Site v8 - Build Bible]] | [[Selika Site v8 - Architecture and Stack]] | [[Selika Site v8 - Sections and Copy]] | [[Selika Site v8 - Hero and Mirror Scene]] | [[Selika Site v8 - Aurora Background]] | [[Selika Site v8 - Interactive Demo]] | [[Selika Site v8 - Assets and Provenance]] | [[Selika]]

---

## 1. Principles visible in the code

- **Dark only.** `color-scheme: dark`; the page sits on `#05060a` with the aurora shader behind everything (`src/gl/Background.tsx`). There is no light theme.
- **One glass material everywhere** (comment in `src/index.css`: "One material everywhere: a faint white fill, a hairline rim, a lit top edge and a 16px backdrop blur"; the actual blur value in the rule is 14px), plus a clearer "liquid glass" (`.lg-glass`) for controls that answer the pointer.
- **Two products, one accent slot.** All product colour flows through `--accent` and `--accent2`; switching product swaps them on `:root`.
- **Display sans + italic serif accent.** Every headline is a sans lead with the final phrase in Instrument Serif italic in the accent colour.
- **Everything answers the pointer** (lift, press, tilt, highlight), and everything stands still under reduced motion.

## 2. Colour

### 2.1 Tailwind tokens (`tailwind.config.js`)

| Token | Value | RGB | Role |
| --- | --- | --- | --- |
| `night` | `#05060A` | 5 6 10 | Page background, text on white pills (`text-night`), preloader, theme colour |
| `ink` | `#EEF2FF` | 238 242 255 | Primary text (`text-ink`, often with opacity: `/75`, `/80`, `/85`, `/90`) |
| `mute` | `#A3ACC2` | 163 172 194 | Secondary text, body copy, eyebrow |
| `dim` | `#6E7891` | 110 120 145 | Tertiary text: footnotes, disclaimers, inactive marks |
| `azure` | `#4D8DFF` | 77 141 255 | Equals Selika Dev `--accent` |
| `skyb` | `#8EC5FF` | 142 197 255 | Equals Selika Dev `--accent2` |
| `iris` | `#8B7CFF` | 139 124 255 | Equals Selika Beauty `--accent` |
| `orchid` | `#B07CFF` | 176 124 255 | Equals Selika Beauty `--accent2` |
| `accent` | `rgb(var(--accent) / <alpha-value>)` | swaps | Current product's primary |
| `accent2` | `rgb(var(--accent2) / <alpha-value>)` | swaps | Current product's secondary (lighter) |

The four named hues (`azure`, `skyb`, `iris`, `orchid`) are defined but no component uses them as Tailwind classes; components use `accent` / `accent2` (or `rgb(var(--accent...))` in CSS) so they follow the product. White (`bg-white`, `text-white`) and black (`bg-black/45`, `/50`, `/55`) come from Tailwind defaults.

### 2.2 CSS variables (`src/index.css`)

```css
:root {
  --accent: 139 124 255;
  --accent2: 176 124 255;
  --night: 5 6 10;
  --nav-h: 4.5rem;
  color-scheme: dark;
}
:root[data-product="dev"] {
  --accent: 77 141 255;
  --accent2: 142 197 255;
}
```

| Product | `--accent` | `--accent2` | Names in code comments |
| --- | --- | --- | --- |
| Selika Beauty (default) | `139 124 255` (`#8B7CFF`) | `176 124 255` (`#B07CFF`) | "violet and orchid" |
| Selika Dev | `77 141 255` (`#4D8DFF`) | `142 197 255` (`#8EC5FF`) | "azure and sky" |

How they swap: `useSite.setProduct()` sets `document.documentElement.dataset.product` (`src/lib/store.ts`); `src/main.tsx` sets `beauty` at boot. Values are bare channel triples so they compose with alpha: `rgb(var(--accent) / .35)`. `--night` is defined but not referenced anywhere; `--nav-h` drives the nav height, `scroll-padding-top` and hero copy offsets.

Smooth colour changes: `.accent-word` (`color .9s`), `.btn-accent` (`background-color .9s`), `.dot-accent` (`background-color .9s`), `.cmp .cmp-sel` (`background-color .9s`), all `cubic-bezier(.16,1,.3,1)`; the Logo mark and Problem icon tiles use Tailwind `transition-colors duration-700`. Properties without a transition (box-shadows, borders) switch instantly.

### 2.3 Fixed per-product colours (not from the variables)

| Where | Beauty | Dev |
| --- | --- | --- |
| `MiniMirror` (`src/sections/Hero.tsx`) | `#B9A9FF` | `#8EC5FF` |
| Product panel headline accent (`src/sections/TwoProducts.tsx`) | `#C9B6FF` | `#A9D3FF` |
| Panel tint shadow | `rgba(139,124,255,0.16)` | `rgba(77,141,255,0.16)` |
| Panel active ring | `rgba(185,169,255,0.55)` | `rgba(142,197,255,0.55)` |
| AskPill orb colour (`AskPill.tsx`) | `#c7b6ff` | `#9fd0ff` |
| PhotoFace guide colour (linear 0..1) | `[0.78, 0.71, 1.0]` | `[0.62, 0.82, 1.0]` |
| Hero 3D `COLORS.c1 / c2 / deep / led` (`HeroScene.tsx`) | (0.545,0.486,1.0) / (0.69,0.486,1.0) / (0.2,0.12,0.52) / (0.78,0.7,1.0) | (0.302,0.553,1.0) / (0.557,0.773,1.0) / (0.05,0.16,0.47) / (0.66,0.84,1.0) |

The aurora's own palette is documented in [[Selika Site v8 - Aurora Background]].

### 2.4 Other fixed colours

- Surfaces inside glass: demo mirror interior `#07080d`, mini-mirror stages `#06070c`, mini mirror fill `#0d0f18`, camera housing `#0b0d15`, shutter `#1b1f2e`.
- Code syntax colours in the Dev panel (`Panels.tsx`): keyword `#8ec5ff`, string `#d3b8ff`, function `text-white`, punctuation `text-white/60`.
- Light colours: `kelvinToRGB()` produces swatch colours for 2700 K to 6500 K; the Light tile keyframes use `#ffb46b`, `#ffc992`, `#ffe2c2`, `#f4f0ff`, `#d6e4ff` (ring) and `#ff9a4a`, `#ffbe80`, `#ffe2c2`, `#f4f0ff`, `#b9d0ff` (tint).
- Demo looks and tones: see [[Selika Site v8 - Interactive Demo]].
- Hairlines and dividers: `border-white/10`, `border-white/[0.08]`, `ring-white/10`, `border-white/12`, `border-white/15`.
- Selection: `::selection { background: rgb(var(--accent) / 0.35); color: #fff; }`.
- Focus: `:focus-visible { outline: 2px solid rgb(var(--accent2)); outline-offset: 3px; border-radius: 10px; }`.

## 3. Typography

### 3.1 Families (`tailwind.config.js`, loaded in `src/index.css`)

| Tailwind | Stack | Fontsource import | Used for |
| --- | --- | --- | --- |
| `font-display` | `"Outfit Variable", system-ui, sans-serif` | `@fontsource-variable/outfit/index.css` | Headlines (`.h-display`, `.h-section`, `.h-card`), logo wordmark, numbers, small caps labels on the glass, preloader percentage, HUD canvas |
| `font-body` | `"Plus Jakarta Sans Variable", system-ui, sans-serif` | `@fontsource-variable/plus-jakarta-sans/index.css` | Body (set on `body`), buttons, UI text |
| `font-serif` | `"Instrument Serif", Georgia, serif` | `@fontsource/instrument-serif/400.css` and `400-italic.css` | Only via `.accent-word` (italic, weight 400) |
| `font-mono` | `"Geist Mono", ui-monospace, monospace` | `@fontsource/geist-mono/400.css` and `500.css` | `.eyebrow`, hero orb labels, AskPill state line, code block and file name in the Dev panel |

`body` gets `font-body text-ink antialiased` and `font-feature-settings: "ss01", "cv11"`. The HUD drawn on the 3D mirror (`src/gl/hud.ts`) uses the same families on canvas and waits for them with `document.fonts.load(...)`; small caps and numbers there use Outfit ("the display face, not the mono one").

### 3.2 Utility classes (verbatim from `src/index.css`)

```css
.h-display { @apply font-display font-semibold; letter-spacing: -0.045em; line-height: 0.92; }
.h-section { @apply font-display font-semibold; letter-spacing: -0.04em; line-height: 0.98; }
.h-card { @apply font-display font-medium; letter-spacing: -0.02em; }
/* the italic accent word inside a headline */
.accent-word { @apply font-serif italic font-normal; letter-spacing: -0.01em; color: rgb(var(--accent2)); transition: color .9s cubic-bezier(.16,1,.3,1); padding-right: 0.06em; }
.eyebrow { @apply font-mono text-[0.68rem] uppercase text-mute; letter-spacing: 0.16em; }
.body-lg { @apply text-[clamp(1rem,1.15vw+0.6rem,1.2rem)] leading-relaxed text-mute; }
.tabular { font-variant-numeric: tabular-nums; }
```

| Class | Family / weight | Tracking | Leading | Notes |
| --- | --- | --- | --- | --- |
| `.h-display` | Outfit 600 | -0.045em | 0.92 | Hero h1 and the big phrase |
| `.h-section` | Outfit 600 | -0.04em | 0.98 | Section h2s, product panel h3, statement |
| `.h-card` | Outfit 500 | -0.02em | inherited (set per use, often `leading-[1.18]`) | Card titles |
| `.accent-word` | Instrument Serif italic 400 | -0.01em | inherited | Colour `rgb(var(--accent2))`, `padding-right: 0.06em` so the italic overhang is not clipped |
| `.eyebrow` | Geist Mono 400, 0.68rem, uppercase, `text-mute` | 0.16em | | Defined; the `Eyebrow` component is exported but not used by any v8 section |
| `.body-lg` | body, `clamp(1rem, 1.15vw + 0.6rem, 1.2rem)` | | `leading-relaxed` (1.625) | `text-mute` |

### 3.3 Display sizes (all `clamp()` from the section files)

| Element | Class and size | File |
| --- | --- | --- |
| Hero h1 | `h-display text-[clamp(2.6rem,4.6vw,5.6rem)]` | `src/sections/Hero.tsx` |
| Hero big phrase | `h-display text-[clamp(4.5rem,8vw,9rem)] leading-[0.9] text-white/95`, container `h-[clamp(4.5rem,8vw,9rem)]` | `Hero.tsx` |
| Problem h2 | `h-section text-[clamp(1.75rem,4.5vw,4.3rem)]` (two block lines) | `Problem.tsx` |
| Demo h2 | `h-section text-[clamp(1.9rem,4.4vw,4.2rem)]` | `DemoSection.tsx` |
| Only a mirror h2 | `h-section text-[clamp(1.9rem,4.2vw,4rem)]` | `Problem.tsx` |
| Two products h2 | `h-section text-[clamp(2.2rem,5.4vw,5rem)]` centred | `TwoProducts.tsx` |
| Product panel h3 | `h-section text-[clamp(1.8rem,3vw,2.6rem)]` | `TwoProducts.tsx` |
| Scroll statement | `h-section text-[clamp(1.9rem,4.4vw,4rem)] leading-[1.05]` | `TwoProducts.tsx` |
| Compare h2 | `h-section text-[clamp(1.9rem,4vw,3.9rem)]` | `Compare.tsx` |
| Inside h2 (exploded) | `h-section text-[clamp(1.9rem,3.6vw,3.6rem)]` | `Inside.tsx` |
| Inside h2 (stacked) | `h-section text-[clamp(1.9rem,8vw,3.4rem)]` | `Inside.tsx` |
| Privacy, Roadmap, About h2 | `h-section text-[clamp(1.9rem,4.2vw,4rem)]` | `Privacy.tsx`, `Roadmap.tsx` |
| Inside stat numbers | `font-display text-[clamp(1.6rem,2.6vw,2.2rem)] font-medium tracking-[-0.03em]` | `Inside.tsx` |
| Mobile menu links | `font-display text-[1.6rem] tracking-[-0.03em]` | `Nav.tsx` |

### 3.4 Small type scale in use

| Size | Typical use |
| --- | --- |
| 1.45rem / 1.3rem / 1.22rem / 1.2rem / 1.15rem / 1.08rem / 1.05rem | `h-card` titles (Roadmap, Problem, Only a mirror, About, orb card, Privacy points, Inside stacked) |
| 1.02rem / 1rem / 0.98rem / 0.95rem | Card body and lead lines, button text (0.95rem) |
| 0.92rem / 0.9rem / 0.88rem / 0.86rem | Card body, tabs, small buttons (0.86rem), nav pills (0.86rem) |
| 0.84rem / 0.82rem / 0.8rem / 0.78rem | Panel text, notes, chips (0.8rem), disclaimers (0.78rem) |
| 0.74rem / 0.72rem / 0.7rem / 0.68rem / 0.66rem / 0.64rem / 0.62rem / 0.6rem / 0.58rem | Code (0.74rem, `leading-[1.7]`), footer legal (0.72rem), captions (0.64 to 0.68rem), glass status pills (0.64rem caps), orb labels (0.62rem mono), module headers (0.6rem caps), AskPill state (0.58rem mono) |

Caps label recipe on glass: `font-display text-[0.6rem to 0.64rem] font-medium uppercase tracking-[0.1em to 0.12em]`, often `tabular-nums`, inside `rounded-full bg-black/45 to /50 px-2.5 py-1 backdrop-blur`. Mono label recipe: `font-mono text-[0.58rem to 0.62rem] uppercase tracking-[0.14em to 0.16em]`.

Hero line masks (`Hero.tsx`): each headline line is wrapped in `-mx-[0.14em] -mb-[0.08em] block overflow-hidden px-[0.14em] pb-[0.16em]` so the mask reaches past italic overhangs and descenders (latest commit fixed this).

## 4. Layout and spacing

### 4.1 Container

```css
.wrap { @apply mx-auto w-full max-w-[1320px] px-5 sm:px-8 lg:px-12; }
```

Max width 1320px; gutters 1.25rem, 2rem from 640px, 3rem from 1024px. The nav bar uses the same gutters (`px-5 sm:px-8`).

### 4.2 Breakpoints

Tailwind defaults (no custom screens): `sm` 640px, `md` 768px, `lg` 1024px (the desktop switch for most layouts), `xl` 1280px (not used). JS thresholds: `isNarrow` `innerWidth < 768` (`perf.ts`), demo `narrowScreen` `< 640` (`state.ts`), hero banded layout and camera fit `< 1024` (`Hero.tsx`), aspect ratio bands `>= 1.15` (wide), `>= 0.8`, below 0.8 (tall) in the camera rig and the background zigzag. Media features: `(pointer: coarse)`, `(pointer: fine)`, `(hover: hover)`, `(hover: hover) and (pointer: fine)`, `prefers-reduced-motion`, `prefers-reduced-transparency`.

### 4.3 Vertical rhythm

| Block | Padding |
| --- | --- |
| `Section` component | `py-20 md:py-28` (5rem, 7rem) |
| Demo section | `py-24 md:py-32` |
| Inside stacked view | `py-24`; stats block `pb-24 md:pb-36` |
| Footer | `pt-6 pb-6` |
| Hero | wrapper `h-[190svh] md:h-[220svh]`, sticky stage `h-[100svh]` |
| Problem | `-mt-[40svh] md:-mt-[50svh]` and `z-10`, so it rides up over the end of the hero dive |
| Inside exploded | wrapper `h-[340svh]`, sticky `h-[100svh]` |
| Heading to content | typically `mt-10` (grids), `mt-4` to `mt-6` (body under h2), `mt-12` / `mt-14` (About, Roadmap) |
| `html` | `scroll-padding-top: var(--nav-h)` (4.5rem) |

### 4.4 Grids

| Section | Grid |
| --- | --- |
| Problem | `grid gap-4 md:grid-cols-3` |
| Only a mirror | `grid gap-4 lg:grid-cols-3` |
| Demo | `grid grid-cols-[minmax(0,1fr)] gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,0.92fr)]`; mirror `aspect-[4/5] max-w-[36rem]` |
| Two products | `grid gap-4 lg:grid-cols-2` with a centred "One core" badge |
| Compare | table `min-w-[46rem]`, first column `w-[22%]`; footnote `md:grid-cols-[1fr_1.2fr] md:gap-8` |
| Inside | `lg:grid-cols-[0.85fr_1.15fr] gap-10`; stats `sm:grid-cols-3 gap-3` |
| Privacy | `gap-12 lg:grid-cols-[0.95fr_1.05fr]`; points `sm:grid-cols-2 gap-3` |
| Roadmap | `gap-4 lg:grid-cols-3`, `mt-14` |
| About | `gap-4 lg:grid-cols-[1.1fr_0.9fr]`; status row `grid-cols-3 gap-3` |

### 4.5 Radii

Tailwind extends `4xl` 2rem and `5xl` 2.5rem (defined, not used as classes). Arbitrary radii in use: 2.6rem (static mirror), 2.4rem / 1.95rem (demo mirror outer / inner), 2rem (big panels, compare table, mobile menu), 1.8rem (shutter card), 1.75rem (AskPill), 1.7rem (switch cards), 1.6rem (standard cards, orb card, footer, flip cards, Inside panes), 1.4rem (small cards, concept image), 1.2rem (art stages), `rounded-2xl` (1rem: segments, module cards), `rounded-xl` (0.75rem: options, icon tiles), `rounded-full` (all buttons, pills, chips, toggles).

### 4.6 Z-index ladder

Background canvas `-z-10`; Problem `z-10`; hero stage `z-10`, overlay text `z-20`, orb overlay `z-30`; nav `z-40`; mobile menu `z-50`; preloader `z-[60]`; skip link on focus `z-[70]`.

## 5. Materials

### 5.1 `sg-glass` (standard glass panel)

```css
.sg-glass {
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.15);
  /* the liquid glass rim on every panel: a lit edge top left, a softer one bottom right, a
     little light caught inside the top and a tinted caustic along the bottom */
  box-shadow:
    inset 1.5px 1.5px 0 -0.5px rgba(255, 255, 255, 0.42),
    inset -1px -1px 0 -0.5px rgba(255, 255, 255, 0.14),
    inset 0 0 0 1px rgba(255, 255, 255, 0.035),
    inset 0 12px 22px -16px rgba(255, 255, 255, 0.24),
    inset 0 -16px 26px -18px rgb(var(--accent2) / 0.3),
    0 18px 40px -18px rgba(0, 0, 0, 0.7);
  -webkit-backdrop-filter: blur(14px) saturate(170%) brightness(1.04);
  backdrop-filter: blur(14px) saturate(170%) brightness(1.04);
}
.sg-glass-strong { background: rgba(14, 16, 26, 0.62); }
.sg-glass-solid {
  background: rgba(12, 14, 22, 0.86);
  border: 1px solid rgba(255, 255, 255, 0.1);
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.18), 0 18px 40px -18px rgba(0, 0, 0, 0.7);
}
```

Six shadow layers: (1) bright top-left inner rim, (2) dim bottom-right inner rim, (3) faint full inner hairline, (4) light caught under the top edge, (5) accent2 caustic along the bottom (follows the product), (6) soft drop shadow.

Modifiers: `.sg-glass-strong` (darker fill for overlays: mobile menu, tooltips, flip card backs, static mirror, inactive roadmap numbers) and `.sg-glass-solid` (near-opaque, used for the Dev code block).

Phones (`@media (pointer: coarse)`): `.sg-glass` becomes `background: rgba(20, 22, 34, 0.72)` with `blur(10px) saturate(140%)`.

### 5.2 `lg-glass` (liquid glass for controls)

```css
.lg-glass {
  position: relative;
  isolation: isolate;
  background: rgba(255, 255, 255, 0.035);
  border: 1px solid rgba(255, 255, 255, 0.2);
  box-shadow:
    inset 1.5px 1.5px 0 -0.5px rgba(255, 255, 255, 0.6),
    inset -1px -1px 0 -0.5px rgba(255, 255, 255, 0.22),
    inset 0 0 0 1px rgba(255, 255, 255, 0.05),
    inset 0 12px 22px -16px rgba(255, 255, 255, 0.35),
    inset 0 -16px 26px -18px rgb(var(--accent2) / 0.45),
    0 22px 50px -22px rgba(0, 0, 0, 0.8),
    0 2px 8px rgba(0, 0, 0, 0.22);
  -webkit-backdrop-filter: blur(7px) saturate(185%) brightness(1.08);
  backdrop-filter: blur(7px) saturate(185%) brightness(1.08);
}
html.sg-refract .lg-glass { -webkit-backdrop-filter: url(#lg-lens) blur(3px) saturate(185%) brightness(1.08); backdrop-filter: url(#lg-lens) blur(3px) saturate(185%) brightness(1.08); }
.lg-glass-dark { background: rgba(10, 12, 22, 0.42); }
.lg-glass-deep { background: rgba(10, 12, 22, 0.6); }
```

Clearer than `sg-glass` (fill 0.035, blur 7px), brighter rim (0.6), stronger caustic (0.45), extra contact shadow. Fill variants: `.lg-glass-dark` (nav pills before scrolling, glass buttons, demo tabs, segment buttons) and `.lg-glass-deep` (nav after scrolling past 60% of the viewport, AskPill, orb feature card, "One core" badge). The nav swaps dark to deep with `transition-[background-color] duration-500`.

Where used: Nav logo pill and section pill bar, menu button, glass `Button`, hero `SwitchCard`s and chevrons, demo `Tabs`, segment buttons, AskPill, orb card, "One core" badge.

### 5.3 Specular highlight and sheen

```css
.lg-spec { position: absolute; left: var(--mx, 30%); top: var(--my, 20%); width: 9rem; height: 6rem; translate: -50% -50%; border-radius: 9999px; background: rgba(255, 255, 255, 0.16); filter: blur(22px); pointer-events: none; z-index: -1; opacity: 0.55; transition: opacity .4s ease; }
.lg-sheen { position: absolute; inset: -40% auto -40% -30%; width: 22%; background: rgba(255, 255, 255, 0.16); filter: blur(10px); transform: translateX(-120%) rotate(18deg); pointer-events: none; z-index: -1; opacity: 0; }
@media (hover: hover) {
  .lg-glass:hover .lg-spec { opacity: 1; }
  .lg-glass:hover .lg-sheen { animation: lg-sweep 1.1s cubic-bezier(.16, 1, .3, 1) both; }
}
@keyframes lg-sweep { 0% { transform: translateX(-120%) rotate(18deg); opacity: 0; } 15% { opacity: 1; } 100% { transform: translateX(620%) rotate(18deg); opacity: 0; } }
```

Markup pattern: `<span aria-hidden className="lg-spec" />` as the first child of an `lg-glass` element with `overflow-hidden`. The spot sits at 30% / 20% by default (55% opacity) and follows the pointer at full opacity on hover. `--mx` / `--my` are written by `specMove` (pixels) or by inline handlers (percentages). `lg-sheen` is used only on the hero `SwitchCard`s.

```ts
export const specMove = (e: React.PointerEvent<HTMLElement>) => {
  const r = e.currentTarget.getBoundingClientRect();
  e.currentTarget.style.setProperty("--mx", `${e.clientX - r.left}px`); e.currentTarget.style.setProperty("--my", `${e.clientY - r.top}px`);
};
```

### 5.4 SVG lens refraction (Chromium desktop only)

`GlassFilters` (`src/components/ui.tsx`) mounts a 0x0 SVG with three filters and adds `html.sg-refract` when `supportsRefraction` (`"userAgentData" in navigator && !isCoarse`, see `perf.ts`).

```css
html.sg-refract .sg-lens { -webkit-backdrop-filter: url(#sg-lens) blur(1.5px) saturate(160%); backdrop-filter: url(#sg-lens) blur(1.5px) saturate(160%); }
html.sg-refract .sg-ripple { backdrop-filter: url(#sg-refract) blur(2px) saturate(150%); }
```

- `#lg-lens` and `#sg-lens`: `primitiveUnits="objectBoundingBox"`. Two `feImage` displacement ramps (data-URI SVG linear gradients: black at 0, mid grey `#808080` from 0.18 to 0.82, white at 1; one horizontal, one vertical) are combined with `feComposite operator="arithmetic" k1=0 k2=1 k3=1 k4=-0.5`, then `feDisplacementMap` (R to x, G to y) with `scale="0.3"` (`lg-lens`) or `scale="0.16"` (`sg-lens`). Neutral in the middle, bending only within 18% of each edge.
- `#sg-refract`: `feTurbulence type="fractalNoise" baseFrequency="0.02" numOctaves="1" seed="3"`, `feGaussianBlur stdDeviation="3"`, `feDisplacementMap scale="22"`. Only referenced by `.sg-ripple`, which no v8 component uses.
- `.sg-lens` is applied by `Button` when `lens` is set and the variant is `glass` (the hero CTA passes `lens` on an `accent` button, where it has no effect).

### 5.5 Reduced transparency

```css
@media (prefers-reduced-transparency: reduce) {
  .sg-glass, .sg-glass-strong { background: rgba(14, 16, 26, 0.94); -webkit-backdrop-filter: none; backdrop-filter: none; }
}
@media (prefers-reduced-transparency: reduce) { .lg-glass { background: rgba(14, 16, 26, 0.94); -webkit-backdrop-filter: none; backdrop-filter: none; } }
```

### 5.6 Hover surfaces

```css
.tile-hover { transition: background-color .4s cubic-bezier(.16,1,.3,1), border-color .4s cubic-bezier(.16,1,.3,1), box-shadow .4s cubic-bezier(.16,1,.3,1), transform .4s cubic-bezier(.16,1,.3,1); }
@media (hover: hover) {
  .tile-hover:hover { background: rgba(255, 255, 255, 0.085); border-color: rgb(var(--accent2) / .38); box-shadow: inset 0 1px 0 rgba(255,255,255,.34), 0 0 0 1px rgb(var(--accent2) / .12), 0 22px 50px -20px rgb(var(--accent) / .45); transform: translateY(-3px); }
}
```

Used on Problem flip-card fronts and Only-a-mirror tiles. `Reactive` cards use `.rc` / `.rc-glow` instead (section 6.8).

### 5.7 Noise and grain

There is no CSS noise texture or grain overlay. Grain exists only inside the background fragment shader ("tone, vignette, grain" in `src/gl/backgroundShader.ts`, `uTime` "for grain only"), and turbulence only in the unused `#sg-refract` filter.

## 6. Components

All from `src/components/ui.tsx` unless stated.

### 6.1 `Mark` and `Logo`

```tsx
export function Mark({ size = 22, className = "" }) {
  return (
    <svg width={size * 0.74} height={size} viewBox="12.5 5.5 39 53" className={className} aria-hidden fill="none" stroke="currentColor">
      <rect x="15" y="8" width="34" height="48" rx="10" strokeWidth="3" />
      <path d="M23 44 L41 18" strokeWidth="3" strokeLinecap="round" />
      <path d="M23 52 L47 26" strokeWidth="2" strokeLinecap="round" opacity=".45" />
    </svg>
  );
}
```

A rounded-rectangle mirror (34 x 48, radius 10) with a bright diagonal glint and a fainter second glint at 45% opacity, drawn in `currentColor`. The viewBox is cropped to the ink so the mark centres on its strokes.

`Logo({ size: "sm" | "md" | "lg" = "md" })`: `inline-flex items-center gap-2 font-display font-medium tracking-[-0.045em] text-ink`, mark `text-accent2 transition-colors duration-700`, then the lowercase word `selika`.

| size | text | mark size |
| --- | --- | --- |
| sm | 1.08rem | 19 |
| md | 1.3rem | 23 |
| lg | 2rem | 34 |

### 6.2 `Headline`

Props: `lead`, `accent`, `className`, `as` (`"h1" | "h2" | "h3"`, default `h2`), `stack` (default false). Renders `<span>{lead}</span> <span className="accent-word">{accent}</span>`; with `stack`, both spans are `block` (accent on its own line) and no space is inserted.

### 6.3 `Eyebrow`

`<span className="eyebrow inline-flex items-center gap-2">` with a 6px `dot-accent` dot (`h-1.5 w-1.5 rounded-full`). Exported, not used in v8 sections.

### 6.4 `Reveal`

Props: `delay = 0` (s), `y = 22` (px), `className`, `style`, `once = true`. IntersectionObserver with `rootMargin: "0px 0px -8% 0px"`; toggles `.is-in`; delay is applied as `transitionDelay` only once shown; `--ry` carries the offset. Starts shown under reduced motion; shows immediately if `IntersectionObserver` is missing.

```css
.reveal { opacity: 0; transform: translate3d(0, var(--ry, 22px), 0); transition: opacity .9s cubic-bezier(.16,1,.3,1), transform 1s cubic-bezier(.16,1,.3,1); }
.reveal.is-in { opacity: 1; transform: none; }
@media (prefers-reduced-motion: reduce) { .reveal { opacity: 1; transform: none; transition: none; } }
```

No blur in `Reveal` by design (comment: "No filters: they are costly to animate and can get stuck"). Stagger convention in sections: `delay={0.08 * i}` (cards), `0.05 * i`, `0.06 * i`, `0.03 * i`, `0.12 * i` (roadmap), `0.1` for a second column.

### 6.5 `Button`

Props: `children`, `onClick`, `href` (renders `motion.a`, else `motion.button type="button"`), `variant` (`"accent" | "glass" | "ghost"`, default `glass`), `icon` (Lucide name, rendered after the label), `className`, `ariaLabel`, `lens`, `small`, `pressed` (sets `aria-pressed`).

Base classes: `group relative inline-flex select-none items-center justify-center gap-2 rounded-full font-medium transition-[background-color,border-color,color,box-shadow] duration-300 ease-out-expo`, plus size:

| | Height | Padding | Text | Icon |
| --- | --- | --- | --- | --- |
| default | `h-12` (3rem) | `px-6` | 0.95rem | 18 |
| `small` | `h-10` (2.5rem) | `px-4` | 0.86rem | 16 |

Variants:

| Variant | Classes | Extra |
| --- | --- | --- |
| `accent` | `btn-accent text-white` | Solid accent fill with glow (below) |
| `glass` | `lg-glass lg-glass-dark overflow-hidden text-ink hover:bg-white/10` (+ `sg-lens` if `lens`) | Renders an `lg-spec` span and calls `specMove` on pointer move |
| `ghost` | `text-mute hover:text-ink` | |

All variants carry `no-press` (they opt out of the global button rule because Motion owns their transform).

Behaviour:

- Magnetic follow (not on coarse pointers or reduced motion): offset `x = ((px - 0.5) * 10)`, `y = ((py - 0.5) * 8)` pixels, through `useSpring({ stiffness: 260, damping: 18, mass: 0.6 })`; resets on pointer leave.
- `whileHover: { scale: 1.035 }`, `whileTap: { scale: 0.95 }`, `transition: { type: "spring", stiffness: 420, damping: 24 }` (none under reduced motion).
- Icon nudges right on hover: `transition-transform duration-300 ease-out-expo group-hover:translate-x-1`.

```css
.btn-accent { background: rgb(var(--accent)); color: #fff; transition: background-color .9s cubic-bezier(.16,1,.3,1), transform .25s cubic-bezier(.16,1,.3,1), box-shadow .35s cubic-bezier(.16,1,.3,1); box-shadow: inset 0 1px 0 rgba(255,255,255,.35), 0 10px 30px -10px rgb(var(--accent) / .7); }
@media (hover: hover) { .btn-accent:not(:disabled):hover { box-shadow: inset 0 1px 0 rgba(255,255,255,.45), 0 14px 38px -8px rgb(var(--accent) / .95), 0 0 0 4px rgb(var(--accent) / .18); } }
```

`.btn-accent` is also used directly on plain buttons (demo "Next step", first Roadmap number).

### 6.6 Global button press rule and `no-press`

```css
button:not(.no-press) { transition-property: transform, background-color, border-color, color, box-shadow, opacity, outline-color; transition-duration: .28s; transition-timing-function: cubic-bezier(.16,1,.3,1); }
@media (hover: hover) { button:not(.no-press):not(:disabled):hover { transform: translateY(-1.5px); } }
button:not(.no-press):not(:disabled):active { transform: translateY(0) scale(.95); transition-duration: .09s; }
/* icons that act out what the button does */
.icon-nudge { transition: transform .35s cubic-bezier(.16,1,.3,1); }
@media (hover: hover) { button:hover .icon-nudge { transform: translateX(3px); } button:hover .icon-spin { transform: rotate(-120deg); } }
.icon-spin { transition: transform .55s cubic-bezier(.16,1,.3,1); }
```

Every plain `<button>` lifts 1.5px on hover and presses to 95% in 0.09s. Elements that move by other means add `no-press`: `Button`, `FlipCard`'s inner button, hero `SwitchCard`, `AskPill`, the mobile menu backdrop, the Privacy shutter button (which uses its own `active:scale-[0.98]`). `.icon-nudge` (arrow moves 3px right) is on "Next step"; `.icon-spin` (rotate -120deg) is on "Start again".

### 6.7 `FlipCard`

Props: `front`, `back`, `className`, `hoverFlip = true`, `label` (required).

- Outer `div.group/flip [perspective:1600px]`; on fine pointers (not `isCoarse`) mouse enter flips and mouse leave unflips.
- Inner `<button type="button" aria-pressed={flipped} aria-label={`${label}: ${flipped ? "show summary" : "show detail"}`}>` with classes `no-press relative grid h-full w-full text-left [transform-style:preserve-3d] motion-reduce:!transition-none`.
- Click toggles; Escape unflips.
- Transform `rotateY(180deg)` when flipped. **Transition: `transform 0.7s cubic-bezier(0.76, 0, 0.24, 1)` on fine pointers, `1.05s` on coarse pointers** (the in-out-quart curve).
- Faces stacked with `[grid-area:1/1] [backface-visibility:hidden]`; back face pre-rotated `[transform:rotateY(180deg)]`. The hidden face gets the `inert` attribute.

Problem usage: front `sg-glass tile-hover rounded-[1.6rem] p-6` with an accent icon tile (`h-11 w-11 rounded-2xl bg-accent/15 text-accent2`) and a `RotateCcw` hint that rotates 180deg on `group-hover/flip` (500ms); back `sg-glass sg-glass-strong` with `inset 0 0 0 1px rgb(var(--accent2) / .35)`, a `Sparkles` tile, the label "How Selika helps" in `text-accent2` and the fix text.

### 6.8 `Reactive`

Props: `children`, `className` (give it the glass, radius and padding), `max = 4` (tilt degrees), `lift = 5` (px), `style`.

- Tilt: `rotateY = (px - 0.5) * max * 2`, `rotateX = -(py - 0.5) * max * 1.6`, springs `{ stiffness: 220, damping: 20 }`, `transformPerspective: 1000`. Writes `--mx` / `--my` as percentages.
- `whileHover: { y: -lift }` (not on coarse or reduced motion); `whileTap: { scale: 0.985 }` on coarse pointers; `transition: { type: "spring", stiffness: 300, damping: 24 }`.
- Classes `rc relative isolate overflow-hidden` plus an `rc-glow` span.

```css
.rc { transition: border-color .35s ease, box-shadow .35s ease, background-color .35s ease; }
.rc-glow { position: absolute; left: var(--mx, 50%); top: var(--my, 50%); width: 18rem; height: 18rem; translate: -50% -50%; border-radius: 9999px; background: rgb(var(--accent2) / .16); filter: blur(44px); opacity: 0; transition: opacity .45s ease; pointer-events: none; z-index: -1; }
@media (hover: hover) {
  .rc:hover { border-color: rgb(var(--accent2) / .5); background-color: rgba(255, 255, 255, .075); box-shadow: inset 1.5px 1.5px 0 -0.5px rgba(255, 255, 255, .55), inset -1px -1px 0 -0.5px rgba(255, 255, 255, .2), inset 0 -16px 26px -18px rgb(var(--accent2) / .45), 0 0 0 1px rgb(var(--accent2) / .22), 0 26px 60px -24px rgb(var(--accent) / .65); }
  .rc:hover .rc-glow { opacity: 1; }
}
```

Instances: product panels (`max={3} lift={6}`), Inside stats, Privacy shutter card (`max={4}`) and points, Roadmap stage cards, About main card (`max={2.5} lift={3}`) and side cards (`max={4}`). Titles inside often add `transition-colors duration-300 group-hover:text-white`.

### 6.9 `TiltCard` (local to `src/sections/Problem.tsx`)

Tilt `rotateY = (px - 0.5) * 9`, `rotateX = -(py - 0.5) * 7`, springs `{ stiffness: 200, damping: 20 }`, `[perspective:1200px]`, plus a cursor-following spot `h-40 w-40 rounded-full bg-white/[0.07] blur-2xl` that fades in over 500ms on hover. Used for the three Only-a-mirror tiles.

### 6.10 `Chip`

`inline-flex h-9 items-center gap-2 rounded-full px-3.5 text-[0.8rem] transition-all duration-300 ease-out-expo`; active `bg-white text-night`, inactive `sg-glass text-ink/85 hover:bg-white/10`. Renders a button with `aria-pressed` when `onClick` is given. Exported, not used in v8 sections.

### 6.11 `Section`

```tsx
<section id={id} data-stream={stream} className={`relative py-20 md:py-28 ${className}`}>
```

`stream` (`-1 | 0 | 1`, default -1) is written as `data-stream` ("an anchor for the stream of light"); nothing in v8 reads it.

### 6.12 `SceneBoundary` and `GlassFilters`

See [[Selika Site v8 - Architecture and Stack]] (error boundary) and section 5.4 (filters).

### 6.13 `Nav` (`src/components/Nav.tsx`)

- `motion.header` `fixed inset-x-0 top-0 z-40`, enters on `entered` from `{ y: -24, opacity: 0 }` over 0.9s, delay 0.1, ease `[0.16, 1, 0.3, 1]`.
- Bar: `h-[var(--nav-h)]` (4.5rem), `justify-between gap-2.5 px-5 sm:px-8 lg:justify-center`.
- Logo pill: `lg-glass flex h-11 items-center overflow-hidden rounded-full px-4` + `lg-spec`, `Logo size="md"`, scrolls to `#top`.
- Section pills (desktop `lg:flex`): `lg-glass h-11 gap-0.5 rounded-full p-1`; each link `h-9 rounded-full px-4 text-[0.86rem]`, active `text-night` over a white `motion.span layoutId="nav-thumb"` (spring 380 / 34), inactive `text-ink/75 hover:text-ink`. Active section from IntersectionObserver `rootMargin: "-45% 0px -50% 0px"`.
- Glass fill: `lg-glass-dark` until `scrollY > innerHeight * 0.6`, then `lg-glass-deep`.
- CTA (`hidden sm:block`): `Button variant="accent" icon="ArrowRight" small className="!h-11 !px-5"` "Try the demo".
- Menu button (`lg:hidden`): `lg-glass lg-glass-dark grid h-11 w-11 rounded-full`, `Menu` icon 18.
- Mobile menu: `AnimatePresence` overlay `fixed inset-0 z-50`; backdrop button `bg-night/60 backdrop-blur-sm` (`no-press`); panel `sg-glass sg-glass-strong absolute inset-x-3 top-3 rounded-[2rem] p-5`, spring 340 / 30 from `{ y: -20, opacity: 0, scale: 0.98 }`; links `font-display text-[1.6rem] tracking-[-0.03em] py-4 border-b border-white/10` with `ArrowUpRight` 20, staggered `delay: 0.05 + i * 0.04` from `x: -10`; full-width accent CTA. Lenis is stopped while open.
- All links scroll with `lenis.scrollTo(href, { duration: 1.6, offset: 0 })`.

### 6.14 Other recurring patterns

- **Segmented switch** (hero mobile, demo tabs): container `lg-glass lg-glass-dark` or `sg-glass`, `h-12 rounded-full p-1 grid-cols-2`, a white `motion.span layoutId` thumb (spring 380 / 32), active text `text-night`, inactive `text-ink/75` or `/80`.
- **Icon tile**: `grid place-items-center rounded-xl` or `rounded-2xl`, `bg-accent/15 text-accent2` (25% on emphasis), sizes `h-8 w-8` to `h-11 w-11`.
- **Toggle switch** (Dev permissions): track `h-5 w-9 rounded-full` `bg-accent` / `bg-white/15`, knob `h-4 w-4 bg-white`, `translateX(16px)`; `.toggle-knob { transition: transform .32s cubic-bezier(.22,1,.36,1); }`.
- **Selected option**: `bg-white/[0.12 to 0.14] ring-1 ring-white/40`; strongest selection is solid `bg-white text-night`.
- **Glass status pill on imagery**: `rounded-full bg-black/45 to /55 px-2.5 py-1 backdrop-blur`.
- **Attention pulses**: `.detail-btn` (orb card button: two 12px accent2 rings, 1.6s, delay .35s), `.drag-me` (first Dev module: repeating ring, 1.8s, delay .9s), `.drag-hint` / `.drag-hint-arrows` (sway 3px, 1.6s).

## 7. Preloader (`src/components/Preloader.tsx`)

Concept (source comment): "The mirror's light ring counts the page in. When it is full, the ring opens out into the outline of the mirror itself, the night behind it lifts to show the page, and the outline hands over to the mirror's own light as the glass powers on."

### 7.1 Geometry

```ts
type P = [number, number];
const K = 0.5523; // cubic Bezier arc constant: four corners with r = half the side make a circle

function roundedQuad(c: P[], r: number) {
  const len = (a: P, b: P) => Math.hypot(b[0] - a[0], b[1] - a[1]);
  const minSide = Math.min(len(c[0], c[1]), len(c[1], c[2]), len(c[2], c[3]), len(c[3], c[0]));
  const R = Math.min(r, minSide / 2);
  const dir = (a: P, b: P): P => { const l = len(a, b) || 1; return [(b[0] - a[0]) / l, (b[1] - a[1]) / l]; };
  const pts = c.map((p, i) => {
    const u = dir(c[(i + 3) % 4], p), v = dir(p, c[(i + 1) % 4]);
    const A: P = [p[0] - R * u[0], p[1] - R * u[1]], B: P = [p[0] + R * v[0], p[1] + R * v[1]];
    return { A, B, c1: [A[0] + K * R * u[0], A[1] + K * R * u[1]] as P, c2: [B[0] - K * R * v[0], B[1] - K * R * v[1]] as P };
  });
  const f = (p: P) => `${p[0].toFixed(1)} ${p[1].toFixed(1)}`;
  let d = `M${f(pts[0].B)}`;
  for (let i = 1; i <= 4; i++) { const q = pts[i % 4]; d += ` L${f(q.A)} C${f(q.c1)} ${f(q.c2)} ${f(q.B)}`; }
  return d + " Z";
}
const ring = (cx: number, cy: number, r: number): P[] => [[cx - r, cy - r], [cx + r, cy - r], [cx + r, cy + r], [cx - r, cy + r]];
```

A square of half-side `R0 = 46` px with corner radius 46 is a circle; interpolating its four corners to the projected glass corners (`mirrorRect.q`, reordered to top-left, top-right, bottom-right, bottom-left) while the radius goes from 46 to `rEnd = min(w, h) * 0.12` turns the ring into the mirror's rounded outline in one continuous path.

### 7.2 Visuals

- Root: `pointer-events-none fixed inset-0 z-[60]`, `role="status" aria-label="Loading selika"`.
- Night layer: `pointer-events-auto absolute inset-0 bg-night` (blocks the page).
- Full-screen SVG (`viewBox` = viewport size at mount, `preserveAspectRatio="none"`):
  - track: `stroke="rgba(255,255,255,0.08)" strokeWidth="1.5"`
  - progress line: `stroke="rgb(var(--accent2))" strokeWidth="2" strokeLinecap="round" pathLength={1} strokeDasharray={`${n} 1`}`, `filter: drop-shadow(0 0 6px rgb(var(--accent2) / 0.8))`.
- Centre: `Mark size={30} className="text-accent2"` with the percentage below it (`absolute top-[4.6rem] font-display text-[0.8rem] font-medium tracking-[0.08em] text-mute tabular`).

### 7.3 Timing

Counting loop (own `requestAnimationFrame`, before the shared clock matters):

- Target starts at 0.15; becomes at least 0.8 when `import("../gl/HeroScene")` resolves; becomes 1 when that and `document.fonts.ready` both resolve.
- Speed cap: `min(1, elapsed / 1150)` ms ("never faster than ~1.1 s"); none under reduced motion.
- Stall cap: after 6000 ms the goal is 1 ("never stuck past 6 s").
- Easing: `cur += (goal - cur) * (1 - exp(-dt * 7))`, snaps to 1 above 0.995.
- At 1: `setTimeout(open, 140)` (0 under reduced motion).

Open timeline (GSAP, seconds from start):

| t | Tween |
| --- | --- |
| 0 | centre (mark + %) to `opacity 0, scale 0.85`, 0.28s `power2.in` |
| 0 | track to opacity 0, 0.3s |
| 0.05 | morph `p` 0 to 1, 0.95s `expo.inOut`, redrawing `roundedQuad` each update |
| 0.42 | `enter()` (page entrance starts) |
| 0.45 | night layer to opacity 0, 0.85s `power2.inOut` |
| 1.0 | outline to opacity 0, 0.7s `power1.out` |
| end | component unmounts (`setDone(true)`) |

Fallback: if reduced motion, no path, or the mirror rect is not usable (`w > 60 && h > 60 && x0 > -vw && x1 < 2 vw` fails), it calls `enter()` and fades the whole overlay out over 0.6s `power2.inOut` (0.01s under reduced motion).

## 8. Motion language

### 8.1 Easing curves

| Name | Value | Where |
| --- | --- | --- |
| out-expo (house curve) | `cubic-bezier(0.16, 1, 0.3, 1)` / `[0.16, 1, 0.3, 1]` | Tailwind `ease-out-expo`, every CSS transition in `index.css`, Motion `ease` in Hero, Nav, Panels, AskPill, Roadmap line |
| in-out-quart | `cubic-bezier(0.76, 0, 0.24, 1)` | FlipCard (Tailwind token `in-out-quart` is defined but the class is not used) |
| exit accelerate | `[0.7, 0, 0.84, 0]` | Hero headline lines leaving on product switch |
| toggle | `cubic-bezier(.22,1,.36,1)` | `.toggle-knob` |
| back-out pop | `cubic-bezier(.34,1.56,.64,1)` | `.cmp-pop` checkmarks |
| draw | `cubic-bezier(.45, 0, .2, 1)` | `.om-draw` |
| scan | `cubic-bezier(.45, 0, .55, 1)` | `.om-scan` |
| GSAP | `power2.inOut` (world colour 1.15s), `power3.inOut` (mirror spin 1.55s), `expo.inOut` (preloader morph), `power2.out` (scene reveals 2.2 to 2.4s), `back.out(1.05)` (orb arrivals 0.78s), `power2.in` (orb pops) | `motion.tsx`, `HeroScene.tsx`, `Preloader.tsx` |

### 8.2 Springs (Motion)

| Use | stiffness / damping (mass) |
| --- | --- |
| Button magnetic follow | 260 / 18 (0.6) |
| Button hover/tap scale | 420 / 24 |
| Reactive tilt | 220 / 20; hover lift 300 / 24 |
| SwitchCard tilt | 240 / 18; hover/tap 380 / 24; selection ring 300 / 30 |
| TiltCard | 200 / 20 |
| Nav thumb | 380 / 34 |
| Demo tab and mobile switch thumbs | 380 / 32 |
| Mobile menu panel | 340 / 30 |
| Demo panel swap | 220 / 26 |
| AskPill hover/tap | 380 / 28 |
| Dev module enter/exit | 300 / 26 |
| Roadmap chip hover (`y: -3`) | 400 / 22 |
| Camera shutter slide | 230 / 24 |

`physics.ts` also has `springFor(response, dampingRatio)` (unused in v8).

### 8.3 Durations

- Micro: 0.09s press, 0.15 to 0.2s exits, 0.28s button transitions, 0.3s drawers and text swaps, 0.32s orb card in.
- UI: 0.35 to 0.5s hovers and state fades; 0.7s flip; 0.9s colour glides and reveal opacity; 1s reveal transform.
- Entrances: 0.8 to 1.1s (hero pieces), 1.6s roadmap line draw.
- Scroll jumps (Lenis): 1.6s for nav, CTA and footer; 1.5s from product panels; 2s back to top.

### 8.4 Blur-in and blur-out

Used for entrances and swaps (never in `Reveal`):

- Hero headline lines: `y: "125%"`, `blur(10px)` to `0`, 0.9s, delays `0.08 + i * 0.08`; exit `y: "-60%"`, `blur(8px)`, 0.28s.
- Hero body: `y: 12`, `blur(6px)`, 0.8s, delay 0.22. CTAs: `y: 10`, 0.7s, delay 0.32.
- Desktop switcher: `x: 48`, `blur(8px)`, 0.9s, delay 0.5.
- Big phrase: `y: 30`, `blur(16px)`, 1.1s, delay 0.55; exit `y: -20`, `blur(12px)`, 0.3s.
- Demo panel swap: in from `x: 18, blur(6px)`, out to `x: -14, blur(6px)` in 0.2s.
- Scroll-lit statement (`TwoProducts.tsx`): each word goes from opacity 0.16 and `blur(6px)` to 1 and `blur(0)` across its slice of `scrollYProgress` (offset `["start 0.85", "end 0.45"]`).
- Hero dive: the big phrase fades over `frame.hero` 0 to 0.22 with up to `blur(12px)`; hero copy over 0 to 0.18 with up to `blur(10px)`; the 3D stage fades over 0.84 to 0.97.

### 8.5 Hover vocabulary

Lift (`translateY(-1.5px)` buttons, `-3px` tiles, `-lift` Reactive, `-4px` switch cards), brighter rim and accent glow (`tile-hover`, `rc:hover`, `btn-accent:hover` 4px ring), pointer-following light (`lg-spec`, `rc-glow`, TiltCard spot), sheen sweep (`lg-sheen`), icon acting (arrow nudge, reset spin, flip hint rotation, icon tile `scale-110 -rotate-6` on Privacy points), image zoom (`group-hover/panel:scale-[1.04]` over 1.2s on concept images). All hover CSS is inside `@media (hover: hover)` or Tailwind's `hoverOnlyWhenSupported`.

### 8.6 Keyframes defined in `index.css`

Used: `lg-sweep`, `hint-glow`, `hint-sway`, `detail-pulse`, `drag-me`, `om-draw`, `om-dot`, `om-scan`, `om-ring`, `om-tint`, `om-k`, `om-ghost`, `om-day`. Defined but unused in v8: `pulse-ring`, `marquee`, `caret`, and the classes `.hairline`, `.sg-ripple`.

## 9. Iconography

- Source: vanilla `lucide` 0.453.0 data, wrapped in `src/lib/icons.tsx` (one set for DOM and WebGL).
- DOM defaults: `size 18`, `stroke 1.75`, `currentColor`, round caps and joins, `aria-hidden`. Common sizes 11 to 21; checkmarks in Compare use `stroke={2.6}` at size 11.
- Canvas: `iconSvg()` default stroke 1.6; `iconAtlas()` stroke 1.5, 128px cells with 16% padding (hero orb icons).
- The 53 icons available: ListChecks, SunMedium, Mic, WandSparkles, MoonStar, Palette, CameraOff, LayoutGrid, Cpu, Bot, AudioLines, ShieldCheck, Layers, Share2, Smartphone, Lightbulb, Hourglass, ScanFace, Repeat, Aperture, CircleDot, HardDrive, KeyRound, CloudOff, VideoOff, ArrowRight, ArrowLeft, ArrowUpRight, ChevronDown, X, Plus, Check, Sparkles, Camera, Calendar, CloudSun, GitBranch, House, Clock, Code, Lock, Unlock, Play, Pause, RotateCcw, Menu, Eye, Scan, Minus, Move, Hand, ChevronUp, MessageCircle. Unknown names fall back to `Sparkles`.
- `thinking-orbs` `ThinkingOrb` is the only non-Lucide glyph: demo loading (`state="searching" size={64}`) and AskPill (`breathing` / `listening` / `working`, size 32).

## 10. Brand mark and favicon set

| File | Spec |
| --- | --- |
| `public/favicon.svg` | 512 x 512 viewBox. Background `radialGradient` (cx 0.5, cy 0.42, r 0.75): `#1A1433` at 0, `#0B0C18` at 0.6, `#05060A` at 1. Mark strokes use a diagonal `linearGradient` `#A9D3FF` to `#C9A6FF`, a glow filter (`feGaussianBlur stdDeviation="9"` merged under the source), and the same three shapes as `Mark` placed with `translate(256 256) scale(6.1) translate(-32 -32)` |
| `public/favicon.ico` | Three PNG entries: 16, 32 and 48 px; linked with `sizes="48x48"` |
| `public/icon-192.png` | 192 x 192 RGB PNG (visually the SVG design), linked as `rel="icon"` and in the manifest |
| `public/icon-512.png` | 512 x 512 RGB PNG, manifest and JSON-LD `logo` |
| `public/apple-touch-icon.png` | 180 x 180 RGB PNG |
| `public/site.webmanifest` | `name`/`short_name` "selika", icons 192 and 512, `theme_color` and `background_color` `#05060A`, `display: standalone`, `start_url: /` |

Favicon SVG (verbatim):

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><defs><radialGradient id="bg" cx="0.5" cy="0.42" r="0.75"><stop offset="0" stop-color="#1A1433"/><stop offset="0.6" stop-color="#0B0C18"/><stop offset="1" stop-color="#05060A"/></radialGradient><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#A9D3FF"/><stop offset="1" stop-color="#C9A6FF"/></linearGradient><filter id="glow" x="-150%" y="-150%" width="400%" height="400%"><feGaussianBlur stdDeviation="9" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter></defs><rect width="512" height="512" fill="url(#bg)"/><g transform="translate(256 256) scale(6.1) translate(-32 -32)" fill="none" stroke="url(#g)" filter="url(#glow)"><rect x="15" y="8" width="34" height="48" rx="10" stroke-width="3"/><path d="M23 44 L41 18" stroke-width="3" stroke-linecap="round"/><path d="M23 52 L47 26" stroke-width="2" stroke-linecap="round" opacity=".45"/></g></svg>
```

In-page, the mark always renders in `text-accent2` (so it follows the product), at 19, 23, 30 (preloader) or 34 px tall. The wordmark is always lowercase `selika` in Outfit 500 at -0.045em. The hero mirror HUD draws "selika" in Outfit 500 38px at 86% white (`src/gl/hud.ts`).

## 11. Copy and style rules visible in code

- Brand in lowercase (`selika` in the logo, `<title>`, og title, JSON-LD name); products always "Selika Beauty" and "Selika Dev".
- Headlines are split into a lead and an accent (`headline: [string, string]` in `content.ts`, "the second part is set in the italic accent").
- British spelling (colour, visualisation, centre).
- Claims are framed as design intent: the Compare column is "Selika, designed to"; "Planned features are described as planned" (`content.ts`); concept images captioned "Concept visualisation"; demo disclaimer "A browser simulation of the planned products, with illustrative lighting values and sample data. The face is AI-generated, not a real person."
- Competitor cells cite sources ("From each product's own page or UK retailer listings, checked 30 September and 2 October 2026. Not listed means the pages we checked don't mention it.").
- Separators: the middle dot `·` in status pills ("Step 2 of 5 · Brows", "Selika · 5000K", "Camera · Clock"); curly quotes for spoken prompts ("Selika, ..."). No em or en dashes appear anywhere in `src/`, `index.html` or `README.md`.
- Microcopy is short and verb-led: "Try the demo", "Next step", "Start again", "More detail" / "Show less", "Close the shutter", "Drag to move", "Say, or tap".
- Touch-aware wording: `isCoarse` swaps "The face follows your cursor. Hover a feature for its guide." for "Tap a feature for its guide, step through a look, relight it."

## 12. Appendix: `src/index.css` verbatim

The complete stylesheet, so the look can be recreated exactly (requires the Tailwind config and Fontsource packages listed in [[Selika Site v8 - Architecture and Stack]]).

```css
@import "@fontsource-variable/outfit/index.css";
@import "@fontsource-variable/plus-jakarta-sans/index.css";
@import "@fontsource/instrument-serif/400.css";
@import "@fontsource/instrument-serif/400-italic.css";
@import "@fontsource/geist-mono/400.css";
@import "@fontsource/geist-mono/500.css";
@import "lenis/dist/lenis.css";

@tailwind base;
@tailwind components;
@tailwind utilities;

/* ------------------------------------------------------------------
   Tokens. --accent and --accent2 belong to the product being shown:
   violet and orchid for Selika Beauty, azure and sky for Selika Dev.
   ------------------------------------------------------------------ */
:root {
  --accent: 139 124 255;
  --accent2: 176 124 255;
  --night: 5 6 10;
  --nav-h: 4.5rem;
  color-scheme: dark;
}
:root[data-product="dev"] {
  --accent: 77 141 255;
  --accent2: 142 197 255;
}

html { background: #05060a; scroll-padding-top: var(--nav-h); -webkit-text-size-adjust: 100%; }
body {
  @apply font-body text-ink antialiased;
  background: transparent;
  font-feature-settings: "ss01", "cv11";
  overflow-x: clip;
}
::selection { background: rgb(var(--accent) / 0.35); color: #fff; }
img, svg, canvas { display: block; }
button { -webkit-tap-highlight-color: transparent; }
:focus-visible { outline: 2px solid rgb(var(--accent2)); outline-offset: 3px; border-radius: 10px; }

/* ---------------- type ---------------- */
.h-display { @apply font-display font-semibold; letter-spacing: -0.045em; line-height: 0.92; }
.h-section { @apply font-display font-semibold; letter-spacing: -0.04em; line-height: 0.98; }
.h-card { @apply font-display font-medium; letter-spacing: -0.02em; }
/* the italic accent word inside a headline */
.accent-word { @apply font-serif italic font-normal; letter-spacing: -0.01em; color: rgb(var(--accent2)); transition: color .9s cubic-bezier(.16,1,.3,1); padding-right: 0.06em; }
.eyebrow { @apply font-mono text-[0.68rem] uppercase text-mute; letter-spacing: 0.16em; }
.body-lg { @apply text-[clamp(1rem,1.15vw+0.6rem,1.2rem)] leading-relaxed text-mute; }
.tabular { font-variant-numeric: tabular-nums; }

/* ------------------------------------------------------------------
   Glass. One material everywhere: a faint white fill, a hairline rim,
   a lit top edge and a 16px backdrop blur. Chromium also gets an SVG
   lens on the few elements marked .sg-lens (see GlassFilters).
   ------------------------------------------------------------------ */
.sg-glass {
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.15);
  /* the liquid glass rim on every panel: a lit edge top left, a softer one bottom right, a
     little light caught inside the top and a tinted caustic along the bottom */
  box-shadow:
    inset 1.5px 1.5px 0 -0.5px rgba(255, 255, 255, 0.42),
    inset -1px -1px 0 -0.5px rgba(255, 255, 255, 0.14),
    inset 0 0 0 1px rgba(255, 255, 255, 0.035),
    inset 0 12px 22px -16px rgba(255, 255, 255, 0.24),
    inset 0 -16px 26px -18px rgb(var(--accent2) / 0.3),
    0 18px 40px -18px rgba(0, 0, 0, 0.7);
  -webkit-backdrop-filter: blur(14px) saturate(170%) brightness(1.04);
  backdrop-filter: blur(14px) saturate(170%) brightness(1.04);
}
.sg-glass-strong { background: rgba(14, 16, 26, 0.62); }
.sg-glass-solid {
  background: rgba(12, 14, 22, 0.86);
  border: 1px solid rgba(255, 255, 255, 0.1);
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.18), 0 18px 40px -18px rgba(0, 0, 0, 0.7);
}
html.sg-refract .sg-lens { -webkit-backdrop-filter: url(#sg-lens) blur(1.5px) saturate(160%); backdrop-filter: url(#sg-lens) blur(1.5px) saturate(160%); }
html.sg-refract .sg-ripple { backdrop-filter: url(#sg-refract) blur(2px) saturate(150%); }
@media (prefers-reduced-transparency: reduce) {
  .sg-glass, .sg-glass-strong { background: rgba(14, 16, 26, 0.94); -webkit-backdrop-filter: none; backdrop-filter: none; }
}
/* ------------------------------------------------------------------
   Liquid glass: nearly clear in the middle, bent at the rim (Chromium's SVG
   lens), a bright specular edge top-left, a tinted caustic along the bottom,
   and a highlight that follows the pointer (--mx, --my set from script).
   ------------------------------------------------------------------ */
.lg-glass {
  position: relative;
  isolation: isolate;
  background: rgba(255, 255, 255, 0.035);
  border: 1px solid rgba(255, 255, 255, 0.2);
  box-shadow:
    inset 1.5px 1.5px 0 -0.5px rgba(255, 255, 255, 0.6),
    inset -1px -1px 0 -0.5px rgba(255, 255, 255, 0.22),
    inset 0 0 0 1px rgba(255, 255, 255, 0.05),
    inset 0 12px 22px -16px rgba(255, 255, 255, 0.35),
    inset 0 -16px 26px -18px rgb(var(--accent2) / 0.45),
    0 22px 50px -22px rgba(0, 0, 0, 0.8),
    0 2px 8px rgba(0, 0, 0, 0.22);
  -webkit-backdrop-filter: blur(7px) saturate(185%) brightness(1.08);
  backdrop-filter: blur(7px) saturate(185%) brightness(1.08);
}
html.sg-refract .lg-glass { -webkit-backdrop-filter: url(#lg-lens) blur(3px) saturate(185%) brightness(1.08); backdrop-filter: url(#lg-lens) blur(3px) saturate(185%) brightness(1.08); }
.lg-glass-dark { background: rgba(10, 12, 22, 0.42); }
.lg-glass-deep { background: rgba(10, 12, 22, 0.6); }
/* the pointer's highlight and a sheen that sweeps across on hover (blurred shapes, not gradients) */
.lg-spec { position: absolute; left: var(--mx, 30%); top: var(--my, 20%); width: 9rem; height: 6rem; translate: -50% -50%; border-radius: 9999px; background: rgba(255, 255, 255, 0.16); filter: blur(22px); pointer-events: none; z-index: -1; opacity: 0.55; transition: opacity .4s ease; }
.lg-sheen { position: absolute; inset: -40% auto -40% -30%; width: 22%; background: rgba(255, 255, 255, 0.16); filter: blur(10px); transform: translateX(-120%) rotate(18deg); pointer-events: none; z-index: -1; opacity: 0; }
@media (hover: hover) {
  .lg-glass:hover .lg-spec { opacity: 1; }
  .lg-glass:hover .lg-sheen { animation: lg-sweep 1.1s cubic-bezier(.16, 1, .3, 1) both; }
}
@keyframes lg-sweep { 0% { transform: translateX(-120%) rotate(18deg); opacity: 0; } 15% { opacity: 1; } 100% { transform: translateX(620%) rotate(18deg); opacity: 0; } }
@media (prefers-reduced-transparency: reduce) { .lg-glass { background: rgba(14, 16, 26, 0.94); -webkit-backdrop-filter: none; backdrop-filter: none; } }

/* phones: blur is the most expensive thing on the page, so glass goes mostly opaque there */
@media (pointer: coarse) {
  .sg-glass { background: rgba(20, 22, 34, 0.72); -webkit-backdrop-filter: blur(10px) saturate(140%); backdrop-filter: blur(10px) saturate(140%); }
}

/* the solid accent button */
.btn-accent { background: rgb(var(--accent)); color: #fff; transition: background-color .9s cubic-bezier(.16,1,.3,1), transform .25s cubic-bezier(.16,1,.3,1), box-shadow .35s cubic-bezier(.16,1,.3,1); box-shadow: inset 0 1px 0 rgba(255,255,255,.35), 0 10px 30px -10px rgb(var(--accent) / .7); }
@media (hover: hover) { .btn-accent:not(:disabled):hover { box-shadow: inset 0 1px 0 rgba(255,255,255,.45), 0 14px 38px -8px rgb(var(--accent) / .95), 0 0 0 4px rgb(var(--accent) / .18); } }

/* ------------------------------------------------------------------
   Every button answers the pointer: a small lift on hover, a press on
   click. Buttons that move by other means (springs, flips) opt out
   with .no-press or by carrying their own inline transform.
   ------------------------------------------------------------------ */
button:not(.no-press) { transition-property: transform, background-color, border-color, color, box-shadow, opacity, outline-color; transition-duration: .28s; transition-timing-function: cubic-bezier(.16,1,.3,1); }
@media (hover: hover) { button:not(.no-press):not(:disabled):hover { transform: translateY(-1.5px); } }
button:not(.no-press):not(:disabled):active { transform: translateY(0) scale(.95); transition-duration: .09s; }
/* icons that act out what the button does */
.icon-nudge { transition: transform .35s cubic-bezier(.16,1,.3,1); }
@media (hover: hover) { button:hover .icon-nudge { transform: translateX(3px); } button:hover .icon-spin { transform: rotate(-120deg); } }
.icon-spin { transition: transform .55s cubic-bezier(.16,1,.3,1); }

/* arrive and settle (see Reveal) */
.reveal { opacity: 0; transform: translate3d(0, var(--ry, 22px), 0); transition: opacity .9s cubic-bezier(.16,1,.3,1), transform 1s cubic-bezier(.16,1,.3,1); }
.reveal.is-in { opacity: 1; transform: none; }
@media (prefers-reduced-motion: reduce) { .reveal { opacity: 1; transform: none; transition: none; } }

/* a tile that lifts its rim and light when the pointer is over it */
.tile-hover { transition: background-color .4s cubic-bezier(.16,1,.3,1), border-color .4s cubic-bezier(.16,1,.3,1), box-shadow .4s cubic-bezier(.16,1,.3,1), transform .4s cubic-bezier(.16,1,.3,1); }
@media (hover: hover) {
  .tile-hover:hover { background: rgba(255, 255, 255, 0.085); border-color: rgb(var(--accent2) / .38); box-shadow: inset 0 1px 0 rgba(255,255,255,.34), 0 0 0 1px rgb(var(--accent2) / .12), 0 22px 50px -20px rgb(var(--accent) / .45); transform: translateY(-3px); }
}
.dot-accent { background: rgb(var(--accent2)); transition: background-color .9s cubic-bezier(.16,1,.3,1); }

/* hairline viewport frame with markers, in the manner of a HUD */
.hairline { background: rgba(255, 255, 255, 0.07); }

/* layout */
.wrap { @apply mx-auto w-full max-w-[1320px] px-5 sm:px-8 lg:px-12; }

/* reduced motion: anything that loops politely stops */
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after { animation-duration: 0.001ms !important; animation-iteration-count: 1 !important; scroll-behavior: auto !important; }
}

/* a quiet scrollbar */
@media (pointer: fine) {
  html { scrollbar-width: thin; scrollbar-color: rgba(255,255,255,.18) transparent; }
}

/* keyframes used by small UI pieces */
@keyframes pulse-ring { 0% { transform: scale(.8); opacity: .7 } 100% { transform: scale(2.2); opacity: 0 } }
@keyframes marquee { from { transform: translateX(0) } to { transform: translateX(-50%) } }
@keyframes caret { 50% { opacity: 0 } }

/* the comparison table: Selika's column glows, its checks arrive row by row once in view */
.cmp .cmp-sel { background: rgb(var(--accent) / .08); box-shadow: inset 1px 0 0 rgb(var(--accent2) / .35), inset -1px 0 0 rgb(var(--accent2) / .35); transition: background-color .9s cubic-bezier(.16,1,.3,1); }
.cmp thead .cmp-sel { box-shadow: inset 1px 0 0 rgb(var(--accent2) / .35), inset -1px 0 0 rgb(var(--accent2) / .35), inset 0 1px 0 rgb(var(--accent2) / .35); }
.cmp-row { transition: background-color .3s ease; }
@media (hover: hover) { .cmp-row:hover { background: rgba(255,255,255,.03); } }
.cmp-pop { transform: scale(.4); opacity: 0; transition: transform .6s cubic-bezier(.34,1.56,.64,1), opacity .4s ease; transition-delay: calc(.25s + var(--i, 0) * .14s); }
.is-in .cmp-pop { transform: none; opacity: 1; }
@media (prefers-reduced-motion: reduce) { .cmp-pop { transform: none; opacity: 1; } }

/* switches: the knob springs across */
.toggle-knob { transition: transform .32s cubic-bezier(.22,1,.36,1); }
/* the drag hint breathes, and its arrows sway */
.drag-hint { animation: hint-glow 2.4s ease-in-out infinite; box-shadow: 0 0 0 1px rgb(var(--accent2) / .35); }
.drag-hint-arrows { animation: hint-sway 1.6s ease-in-out infinite; }
@keyframes hint-glow { 0%, 100% { box-shadow: 0 0 0 1px rgb(var(--accent2) / .3), 0 0 0 0 rgb(var(--accent2) / .0); } 50% { box-shadow: 0 0 0 1px rgb(var(--accent2) / .7), 0 0 26px 2px rgb(var(--accent2) / .35); } }
@keyframes hint-sway { 0%, 100% { transform: translateX(-3px); } 50% { transform: translateX(3px); } }

/* the bubble card's button: noticed on arrival with two soft rings */
.detail-btn { animation: detail-pulse 1.6s cubic-bezier(.16,1,.3,1) .35s 2 both; }
@keyframes detail-pulse { 0% { box-shadow: 0 0 0 0 rgb(var(--accent2) / .55); } 100% { box-shadow: 0 0 0 12px rgb(var(--accent2) / 0); } }
@media (prefers-reduced-motion: reduce) { .detail-btn { animation: none; } }

/* ------------------------------------------------------------------
   The "only a mirror" visuals (CSS only)
   ------------------------------------------------------------------ */
.om-draw { stroke-dasharray: 1; stroke-dashoffset: 1; animation: om-draw 7s cubic-bezier(.45, 0, .2, 1) var(--d, 0s) infinite both; filter: drop-shadow(0 0 5px rgb(var(--accent2) / .9)); }
@keyframes om-draw { 0% { stroke-dashoffset: 1; opacity: 1; } 20% { stroke-dashoffset: 0; } 78% { stroke-dashoffset: 0; opacity: 1; } 90%, 100% { stroke-dashoffset: 0; opacity: 0; } }
.om-dot { transform-box: fill-box; transform-origin: center; animation: om-dot 7s cubic-bezier(.16, 1, .3, 1) var(--d, 0s) infinite both; filter: drop-shadow(0 0 6px rgb(var(--accent2))); }
@keyframes om-dot { 0% { opacity: 0; transform: scale(.3); } 9% { opacity: 1; transform: scale(1); } 78% { opacity: 1; transform: scale(1); } 90%, 100% { opacity: 0; transform: scale(.6); } }
.om-scan { top: 0; background: rgb(var(--accent2) / .22); filter: blur(10px); mix-blend-mode: screen; animation: om-scan 3.8s cubic-bezier(.45, 0, .55, 1) infinite; }
@keyframes om-scan { 0% { transform: translateY(-110%); } 100% { transform: translateY(560%); } }

.om-ring { animation: om-ring 10s linear infinite; }
@keyframes om-ring {
  0%, 100% { box-shadow: 0 0 0 2px #ffb46b, 0 0 34px 2px rgba(255, 180, 107, .55); }
  20% { box-shadow: 0 0 0 2px #ffc992, 0 0 34px 2px rgba(255, 201, 146, .5); }
  40% { box-shadow: 0 0 0 2px #ffe2c2, 0 0 34px 2px rgba(255, 226, 194, .45); }
  60% { box-shadow: 0 0 0 2px #f4f0ff, 0 0 34px 2px rgba(244, 240, 255, .45); }
  80% { box-shadow: 0 0 0 2px #d6e4ff, 0 0 34px 2px rgba(214, 228, 255, .5); }
}
.om-tint { animation: om-tint 10s linear infinite; opacity: .55; }
@keyframes om-tint { 0%, 100% { background: #ff9a4a; } 20% { background: #ffbe80; } 40% { background: #ffe2c2; } 60% { background: #f4f0ff; } 80% { background: #b9d0ff; } }
.om-k { opacity: 0; animation: om-k 10s cubic-bezier(.16, 1, .3, 1) calc(var(--i) * 2s) infinite both; }
@keyframes om-k { 0% { opacity: 0; transform: translateY(70%); } 4% { opacity: 1; transform: none; } 17% { opacity: 1; transform: none; } 21%, 100% { opacity: 0; transform: translateY(-70%); } }

.om-ghost { opacity: 0; animation: om-ghost 8s cubic-bezier(.16, 1, .3, 1) calc(var(--i) * 2.66s) infinite both; }
@keyframes om-ghost { 0% { opacity: 0; transform: translate(16%, -7%) rotate(7deg) scale(1.14); } 6% { opacity: .75; } 24% { opacity: 1; transform: none; } 30% { opacity: 1; transform: none; } 40%, 100% { opacity: 0; transform: none; } }
.om-day { animation: om-day 8s ease calc(var(--i) * 2s) infinite both; }
@keyframes om-day { 0%, 28%, 100% { background: rgba(0, 0, 0, .55); color: rgb(240 242 255 / .6); } 4%, 22% { background: rgb(var(--accent)); color: #fff; } }

@media (prefers-reduced-motion: reduce) {
  .om-draw { animation: none; stroke-dashoffset: 0; }
  .om-dot, .om-k:first-child { animation: none; opacity: 1; }
  .om-scan, .om-ghost, .om-day, .om-ring, .om-tint, .om-k { animation: none; }
  .om-ring { box-shadow: 0 0 0 2px #f4f0ff, 0 0 34px 2px rgba(244, 240, 255, .45); }
}

/* the first module wears the drag hint until something is moved */
.drag-me { animation: drag-me 1.8s cubic-bezier(.16, 1, .3, 1) .9s infinite; }
@keyframes drag-me { 0% { box-shadow: 0 0 0 0 rgb(var(--accent2) / .55); } 70%, 100% { box-shadow: 0 0 0 12px rgb(var(--accent2) / 0); } }
@media (prefers-reduced-motion: reduce) { .drag-me { animation: none; } }

/* Reactive cards: rim, fill and a pointer light on hover (see Reactive in ui.tsx) */
.rc { transition: border-color .35s ease, box-shadow .35s ease, background-color .35s ease; }
.rc-glow { position: absolute; left: var(--mx, 50%); top: var(--my, 50%); width: 18rem; height: 18rem; translate: -50% -50%; border-radius: 9999px; background: rgb(var(--accent2) / .16); filter: blur(44px); opacity: 0; transition: opacity .45s ease; pointer-events: none; z-index: -1; }
@media (hover: hover) {
  .rc:hover { border-color: rgb(var(--accent2) / .5); background-color: rgba(255, 255, 255, .075); box-shadow: inset 1.5px 1.5px 0 -0.5px rgba(255, 255, 255, .55), inset -1px -1px 0 -0.5px rgba(255, 255, 255, .2), inset 0 -16px 26px -18px rgb(var(--accent2) / .45), 0 0 0 1px rgb(var(--accent2) / .22), 0 26px 60px -24px rgb(var(--accent) / .65); }
  .rc:hover .rc-glow { opacity: 1; }
}
```

## 13. Appendix: `tailwind.config.js` verbatim

```js
/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  future: { hoverOnlyWhenSupported: true },
  theme: {
    extend: {
      colors: {
        night: "#05060A",
        ink: "#EEF2FF",
        mute: "#A3ACC2",
        dim: "#6E7891",
        azure: "#4D8DFF",
        skyb: "#8EC5FF",
        iris: "#8B7CFF",
        orchid: "#B07CFF",
        /* the current product's colours, swapped on :root when Beauty or Dev is chosen */
        accent: "rgb(var(--accent) / <alpha-value>)",
        accent2: "rgb(var(--accent2) / <alpha-value>)",
      },
      fontFamily: {
        display: ['"Outfit Variable"', "system-ui", "sans-serif"],
        body: ['"Plus Jakarta Sans Variable"', "system-ui", "sans-serif"],
        serif: ['"Instrument Serif"', "Georgia", "serif"],
        mono: ['"Geist Mono"', "ui-monospace", "monospace"],
      },
      borderRadius: { "4xl": "2rem", "5xl": "2.5rem" },
      transitionTimingFunction: { "out-expo": "cubic-bezier(0.16, 1, 0.3, 1)", "in-out-quart": "cubic-bezier(0.76, 0, 0.24, 1)" },
    },
  },
  plugins: [],
};
```
