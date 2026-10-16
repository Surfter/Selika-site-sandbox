---
tags:
  - selika
  - web-dev
  - react
  - checklist
type: framework
status: active
date: 2026-10-09
source: Selika site v8 build process, 6 to 9 October 2026; tools/qa in the source
key: Step-by-step order for rebuilding the Selika v8 site from nothing, or building a new site in the same style for another product, with the prompt to hand an agent, the headless-browser verification loop, the acceptance checklist and the delivery routine. Read when starting a rebuild, a sibling site, or a review round.
---

# Selika Site v8 - Rebuild and QA Playbook

> [!abstract] Key
> Step-by-step order for rebuilding the Selika v8 site from nothing, or building a new site in the same style for another product, with the prompt to hand an agent, the headless-browser verification loop, the acceptance checklist and the delivery routine.

**Related:** [[Selika Site v8 - Build Bible]] | [[Selika Site v8 - Architecture and Stack]] | [[Selika Site v8 - Design System]] | [[Selika Site v8 - Sections and Copy]] | [[Selika Site v8 - Hero and Mirror Scene]] | [[Selika Site v8 - Aurora Background]] | [[Selika Site v8 - Interactive Demo]] | [[Selika Site v8 - Assets and Provenance]] | [[Selika Site v8 - Build History and Decisions]] | [[Cinematic Glass Website Playbook]]

---

## 1. The quickest exact copy

Unzip `Brainvault/Projects/Selika Site/selika 8.9.zip`, then `npm ci` and `npm run build`. Done: same code, same packages (lockfile), same assets. Everything below is for rebuilding by hand or adapting.

## 2. Prompt to hand an agent

> Read [[Selika Site v8 - Build Bible]] and the notes it maps, and use `selika 8.9` as the reference implementation. Build [product] in the same architecture, design system and motion language. Keep the rules in the Bible's section 6. Verify with the loop in [[Selika Site v8 - Rebuild and QA Playbook]] at 1440x900, the reviewer's own width and 390x844 touch before delivering, and deliver as a numbered folder plus zip.

## 3. Build order

Each step names the note with the exact values.

1. **Scaffold:** Vite 5 + React 19 + TypeScript + Tailwind 3; pin the versions from [[Selika Site v8 - Architecture and Stack]]; `manualChunks` for `three` and `vendor`; the `pub()` content-hash helper; self-hosted fonts via Fontsource.
2. **Tokens and materials:** copy `index.css` and the Tailwind config from [[Selika Site v8 - Design System]] (night #05060A, per-product `--accent` / `--accent2`, Outfit, Plus Jakarta Sans, Instrument Serif italic accents, Geist Mono for code only, `.sg-glass`, `.lg-glass`, `.lg-spec`).
3. **The single clock:** gsap ticker drives Lenis, `addTick` subscribers, and R3F canvases with `frameloop="never"` plus `advance()`; perf tiers with `?tier=` override; zustand stores.
4. **Background:** the full-page shader and its zigzag aurora ([[Selika Site v8 - Aurora Background]]); test at desktop, tall and phone aspects.
5. **Shell:** Nav, Section, Reveal (opacity and translate only), Button, FlipCard, Preloader.
6. **Hero:** mirror geometry, HUD textures, hologram video, bubbles and cards, switcher spin and colour shift, scroll dive, entrance from the preloader ([[Selika Site v8 - Hero and Mirror Scene]]).
7. **Sections:** in page order with the copy from `content.ts` ([[Selika Site v8 - Sections and Copy]]).
8. **Demo:** face packs and PhotoFace, panels, steps, lights, Dev layer, Ask pill ([[Selika Site v8 - Interactive Demo]]).
9. **Assets and icons:** [[Selika Site v8 - Assets and Provenance]].
10. **Fallbacks and accessibility:** error boundaries around each canvas, WebGL-less fallback, reduced motion, keyboard access, aria labels.

## 4. Verification loop

Headless Chromium on SwiftShader renders WebGL at 1 to 5 fps, so use it for layout and stills; judge smoothness on a real laptop and phone.

- Start the dev server (`npm run dev`) or the production preview (`npm run build && npm run preview`).
- `node tools/qa/shoot.mjs` for section screenshots; `W=390 H=844 M=1` for a phone; add `?tier=low` to force the light tier.
- `node tools/qa/clipdiff.mjs` proves no headline glyph is clipped.
- To see a fast animation, slow it: in development `window.__gsap` is exposed, so `__gsap.globalTimeline.timeScale(0.07)` (gsap animations) and take a screenshot series.
- To test a state directly in development, import the store in the page: `const m = await import('/src/lib/store.ts'); m.useSite.setState({...})`.
- For a visual bug in an image or shader, crop and enlarge the area, and boost contrast to reveal faint streaks or seams.
- Compare before and after with `git stash` to prove layout did not move (measure element rects).

## 5. Acceptance checklist

- [ ] `npm ci` and `npm run build` pass from the delivered zip, in a clean folder.
- [ ] No page errors in the console at 1440x900, the reviewer's width (Mo uses about 1762 px) and 390x844 touch.
- [ ] No horizontal scroll on phones (`scrollWidth == innerWidth`).
- [ ] Both products: switch, spin, colour shift, bubbles land without leftovers, cards open away from the mirror.
- [ ] Demo: all skin tones (check the top of each face), all looks, lights and steps; Dev drag, permissions, model swap; Ask pill.
- [ ] Text: no clipped glyphs, no orphan words in headings, no em dashes.
- [ ] Honesty: AI labels and "Concept visualisation" captions present; claims match the current stage.
- [ ] Reduced motion works.

## 6. Delivery routine (each round)

1. Commit on the working branch with a plain message.
2. `git archive --format=zip --prefix="selika 8.x/" -o "selika 8.x.zip" HEAD`.
3. Unzip into a clean folder, `npm ci`, `npm run build`.
4. Put the zip and its extracted folder in `Downloads` and `Brainvault/Projects/Selika Site/`.
5. Add a dated entry at the top of the Notes & Progress log in [[Selika]].
6. Update this documentation set if anything it describes changed.
7. Reply in one or two sentences.
