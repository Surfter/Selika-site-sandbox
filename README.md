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
    Background.tsx  full-screen shader: the soft field (Beauty violet, Dev blue) and the aurora, one
                    curtain that zigzags from margin to margin down the length of the page
    HeroScene.tsx   the mirror, its HUD, the feature orbs, the product spin and the dive through the glass
  sections/         hero, problem, demo, why a mirror, two products, comparison, hardware, privacy, roadmap, about
    demo/           the interactive demo: 3D face (makeup, guides, lashes, hair), lighting, looks, Dev modules;
                    PhotoFace.tsx is the photographic face, used once face packs are listed in facePacks.ts
  components/       nav, preloader, glass, buttons, flip cards, reveal, error boundary for the 3D scenes
public/models/face.glb   ICT-FaceKit face (the demo's fallback if no face packs are listed), 1.1 MB
public/visuals/          the hero hologram loop and poster, the two concept images and the tile portraits (AI-generated)
public/faces/            photographic face packs (fair, medium, warm, deep): NAME.jpg, NAME-closed.jpg, NAME-depth.png, NAME-thumb.jpg, NAME.json
tools/                   asset scripts: ict2glb.py (face.glb) and build_face_pack.py (face packs)
```

## Face packs

The demo can use a photograph instead of the 3D face. A pack is built offline from a front-facing,
AI-generated portrait (and, for blinks, an eyes-closed edit of it):

```
pip install mediapipe==0.10.14 opencv-python numpy
python3 -I tools/build_face_pack.py portrait.png portrait-closed.png public/faces face-NAME
```

It aligns the photo to a 4:5 frame by the irises, writes a soft depth map from the face mesh (for the
light's shading), the eyes-closed copy blended into the eye band, a thumbnail, and the landmarks the makeup and
guides are drawn from. Then add `{ id: "NAME", label: "...", blink: true }` to `FACE_PACKS` in
`src/sections/demo/facePacks.ts`. In development, `?faces=NAME` loads a pack without listing it.

## Notes

- The demo is a simulation. Lighting values are illustrative. The faces are AI-generated portraits (made with Higgsfield), not real people; makeup and guidance are drawn from each face's landmarks and laid into the skin's own light and texture, and a depth map shades the face as the key light leans toward the cursor. The photo itself is never warped.
- The hero's hologram is a looping video made with Higgsfield. For the dive it dissolves into light points sampled from the same image.
- Phones get their own hero layout (the mirror sits between the copy and the product switcher), a lighter rendering tier, touch wording and no blur animations.
- If WebGL is unavailable the page still works: the hero shows a static mirror and the demo explains what it would show.
- Reduced motion and reduced transparency are honoured.
- Third-party code, models and fonts are listed in `THIRD_PARTY_NOTICES.md`.
