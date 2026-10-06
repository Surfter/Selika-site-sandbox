# selika

Concept site for **Selika**, an AI smart mirror that turns a passive reflection into an interactive presence environment. Prototype and validation stage.

Built with Vite + React 18 + TypeScript, Tailwind CSS and Framer Motion. No backend. Deploys as a static site.

## Run locally

```bash
npm install
npm run dev        # http://localhost:5173
npm run build      # production build -> dist/
npm run preview    # serve dist/ locally
```

## Deploy to Vercel

1. Push this folder to a GitHub repository.
2. In Vercel: **Add New → Project → Import** the repo. Vercel auto-detects Vite. Framework preset: *Vite*, build command `npm run build`, output directory `dist`. `vercel.json` already carries the SPA rewrite.
3. Deploy. Add the custom domain under *Settings → Domains* once it is registered.

Alternatively, from this folder with the Vercel CLI: `npx vercel` then `npx vercel --prod`.

## Structure

```
src/
  lib/            physics (black-body colour, springs, momentum), environments, hooks
  components/
    ui/           Glass primitives, scroll reveals, ambient background
    demo/         the mirror: lit portrait, temperature track, product/developer demos
    MirrorStage   hero -> demo shared-element scroll transition
    sections/     problem, pillars, layers, objection, prototype, roadmap, about
```

## Notes

- The lighting in the demo is computed: colour temperature runs through the standard black-body approximation, and CRI drives saturation and contrast. It is a simulation, not a device recording.
- The temperature track is a real gesture control: 1:1 pointer tracking, rubber-banding, momentum projection, velocity handed to the spring.
- Reduced motion, reduced transparency and increased contrast are all honoured.
- Nothing on the site claims a prototype, customers, revenue or a supplier relationship exists. Keep it that way until they do.
