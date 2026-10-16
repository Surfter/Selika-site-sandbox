---
tags:
  - selika
  - web-dev
  - design
  - react
  - reference
type: reference
status: active
date: 2026-10-09
source: selika site v8 source (branch v8-overhaul, final build 8.9), Projects/Selika Site/selika 8.9
key: The front door to the finished Selika website v8 (build 8.9, 9 Oct 2026). Where the exact source and original assets live, how to run, build and deploy it, how to reproduce it exactly or make a new site like it, and a map of the nine detailed notes that document every part of it.
---

# Selika Site v8 - Build Bible

> [!abstract] Key
> The front door to the finished Selika website v8 (build 8.9, 9 Oct 2026). Where the exact source and original assets live, how to run, build and deploy it, how to reproduce it exactly or make a new site like it, and a map of the detailed notes that document every part of it.

**Related:** [[Selika]] | [[Selika Site v8 - Architecture and Stack]] | [[Selika Site v8 - Design System]] | [[Selika Site v8 - Sections and Copy]] | [[Selika Site v8 - Hero and Mirror Scene]] | [[Selika Site v8 - Aurora Background]] | [[Selika Site v8 - Interactive Demo]] | [[Selika Site v8 - Assets and Provenance]] | [[Selika Site v8 - Build History and Decisions]] | [[Selika Site v8 - Rebuild and QA Playbook]] | [[Cinematic Glass Website Playbook]]

---

## 1. What it is

The v8 overhaul of selika.site: one page for one mirror platform with two products, Selika Beauty (makeup guidance drawn on your own reflection, in light you control) and Selika Dev (the same mirror opened to developers). Built 6 to 9 October 2026 over ten review rounds (8.0 to 8.9) with Mo, after the CoCreate submission.

The page, top to bottom:

1. **Preloader:** the mirror's light ring counts the page in, then opens out into the outline of the mirror and hands over to it.
2. **Hero:** a 3D mirror (React Three Fiber) with a holographic face video on the glass (Beauty) or floating module panes (Dev), feature "bubbles" that shoot up from below the screen and settle around it with hover cards, a Beauty / Dev switcher that spins the mirror and shifts the colour of the whole world, and a scroll dive through the glass.
3. **Problem:** "You get ready in a mirror. The help is everywhere else." with three flip cards.
4. **Demo, "Try it on the glass.":** an AI-generated photographic face (four skin tones) with makeup, guides, light presets and blinks, or the Dev glass with draggable modules, permissions and a model swap; an "Ask Selika" voice pill.
5. **What can only a mirror do?:** three animated tiles (Reflect, Light, Return).
6. **Two products, one mirror,** with concept visualisations.
7. **Comparison:** "Isn't this a lit mirror with extra steps?"
8. **Inside the glass:** the exploded hardware stack.
9. **Privacy by design,** the physical shutter.
10. **Roadmap:** HUD, then mirror, then platform.
11. **About** and the footer.

Behind everything runs one full-page WebGL aurora: a curtain of light that zigzags margin to margin down the length of the page.

## 2. Where everything lives

| What | Where |
| --- | --- |
| Final source (exact) | `Brainvault/Projects/Selika Site/selika 8.9/` and `selika 8.9.zip`; the same in `Downloads`. This is the ground truth; these notes explain it. |
| Earlier builds | `selika 8.0` to `selika 8.8` beside it, one folder and zip per review round |
| Original asset files | `Brainvault/Projects/Selika Site/selika-source-assets/` (and its two zips): full-resolution portraits, hologram still and clips, concept sources, with a MANIFEST ([[Selika Site v8 - Assets and Provenance]]) |
| These notes | `Brainvault/Projects/Selika Site/Docs/`, and the same files in the source at `docs/` |
| Git history | the zips are `git archive` snapshots of branch `v8-overhaul`; the commit for each build is listed in [[Selika Site v8 - Build History and Decisions]] |
| Running sites | live: selika.site (still the earlier site until v8 is pushed to the live repo); v8 is tested on Mo's sandbox deployment first |

## 3. Run, build, deploy

```
npm ci            # Node 20 or 22; exact versions come from package-lock.json
npm run dev       # http://localhost:5173
npm run build     # tsc -b, then vite build into dist/
npm run preview   # serves dist/ on :4173
```

- Deploy: push the folder's contents to the GitHub repo the host builds from (sandbox first, then the live repo). Any static host works (Vercel used so far): build command `npm run build`, output `dist`. No server code, no environment variables.
- Files in `public/` are requested with a content hash on the end (`?v=xxxxxxxx`), so a changed photo or video always loads fresh after a deploy.
- The search-result icon comes from `public/favicon.ico` (16, 32, 48 px), `icon-192.png`, `icon-512.png`, `favicon.svg`, `apple-touch-icon.png`, `site.webmanifest` and the Organization JSON-LD `logo` in `index.html`. Google only refreshes it when it recrawls: after deploying to the live domain, use Search Console's URL Inspection and "Request indexing" on the home page to speed it up.

## 4. How to reproduce it

- **Exactly:** take `selika 8.9.zip`, `npm ci`, `npm run build`. The lockfile pins every package; the assets are in `public/`. Nothing is fetched at runtime from third parties (fonts are self-hosted).
- **Rebuild an asset:** follow [[Selika Site v8 - Assets and Provenance]] (face packs rebuild from the originals with one command).
- **From scratch, or a new site in the same style:** follow [[Selika Site v8 - Rebuild and QA Playbook]], which orders the work, points to the detailed note for each part, and includes the acceptance checks.

## 5. Map of the detailed notes

| Note | Read it for |
| --- | --- |
| [[Selika Site v8 - Architecture and Stack]] | dependency versions, build config, file tree, the single clock (gsap ticker driving Lenis and every scene), stores, performance tiers, fallbacks, accessibility |
| [[Selika Site v8 - Design System]] | colours, per-product accents, type scale, glass materials, every shared component, motion language, icons, favicon; full `index.css` and Tailwind config verbatim |
| [[Selika Site v8 - Sections and Copy]] | each section top to bottom: layout, phone behaviour, interactions, and every word of copy |
| [[Selika Site v8 - Hero and Mirror Scene]] | the 3D mirror, HUD, hologram, bubbles, cards, switcher, dive and the preloader handoff, with every constant and the entrance timeline |
| [[Selika Site v8 - Aurora Background]] | the full-page shader: colour field, zigzag curtain maths, layers, uniforms, verbatim GLSL |
| [[Selika Site v8 - Interactive Demo]] | the photographic face pipeline, makeup and guides, lights, steps, face pack builder, Dev modules, Ask pill |
| [[Selika Site v8 - Assets and Provenance]] | every file in `public/`, how it was made (Higgsfield models and jobs), the originals and rebuild commands, licences |
| [[Selika Site v8 - Build History and Decisions]] | the ten rounds of feedback and what changed, rejected approaches, bugs and their fixes, the standing rules |
| [[Selika Site v8 - Rebuild and QA Playbook]] | step-by-step rebuild order and the headless-browser checks |

## 6. Rules that shaped every page

- No em dashes anywhere (copy, code comments, docs).
- Never state anything false. Stage claims stay honest: concept and research stage, first prototype specified, components identified, price hypothesis.
- "We" and "our" for the company; never that it is one person; nothing about Mo's employer on the site.
- Competitor claims are scoped to evidence ("Not listed", not "doesn't have").
- Faces and the hologram are AI-generated and labelled so (demo caption and footer); concept images are captioned "Concept visualisation".
- Phones are a first-class target; touch replaces hover; motion respects reduced-motion.
