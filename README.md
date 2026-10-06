# selika

Site for **Selika**: one mirror, two products. **Selika Beauty** draws step-by-step makeup guidance on your own reflection, in light you control. **Selika Dev** opens the same mirror to developers as a platform. Concept stage, first prototype specified.

Vite + React 19 + TypeScript, Tailwind CSS, Motion, GSAP (one shared clock), Lenis smooth scroll, and three.js through React Three Fiber for the hero mirror and the 3D demo face. No backend. Deploys as a static site.

## Run locally

```bash
npm install
npm run dev        # http://localhost:5173
npm run build      # production build -> dist/
npm run preview    # serve dist/ locally
```

Add `?tier=low`, `?tier=mid` or `?tier=high` to the URL to force a performance tier while testing.

## Deploy to Vercel

1. Push this folder to the GitHub repository (sandbox first, then the live repo).
2. In Vercel: **Add New → Project → Import** the repo. Framework preset *Vite*, build command `npm run build`, output directory `dist`.
3. `vercel.json` carries the SPA rewrite and long-lived caching for the hashed files in `/assets`.

## How it fits together

```
src/
  lib/
    frame.ts        per-frame values outside React: pointer, scroll, product world, hero dive
    motion.tsx      the one clock: GSAP's ticker drives Lenis, the 3D scenes and every DOM effect
    perf.ts         performance tiers (high / mid / low), downgraded at runtime on slow frames
    store.ts        which product is showing (Beauty or Dev)
    content.ts      all copy, from the final application answers
    icons.tsx       Lucide icons for the DOM and for the 3D icon atlas
  gl/
    Background.tsx  full-screen shader: the soft field (Beauty violet, Dev blue) and the stream of
                    light that runs the length of the page, routed by [data-stream] markers
    HeroScene.tsx   the mirror, its HUD, the feature orbs, the product spin and the dive through the glass
  sections/         hero, problem, demo, why a mirror, two products, comparison, hardware, privacy, roadmap, about
    demo/           the interactive demo: 3D face (makeup, guides, lashes, hair), lighting, looks, Dev modules
  components/       nav, preloader, glass, buttons, flip cards, reveal, error boundary for the 3D scenes
public/models/face.glb   ICT-FaceKit face, converted and compressed (meshopt), 1.1 MB
```

## Notes

- The demo is a simulation. Lighting values are illustrative, and the face is ICT-FaceKit's generic model, not a real person. Makeup and guidance are painted in the face's own UV space from the model's 68 landmarks, so they follow blinks and expressions.
- Phones get their own hero layout (the mirror sits between the copy and the product switcher), a lighter rendering tier, touch wording and no blur animations.
- If WebGL is unavailable the page still works: the hero shows a static mirror and the demo explains what it would show.
- Reduced motion and reduced transparency are honoured.
- Third-party code, models and fonts are listed in `THIRD_PARTY_NOTICES.md`.
