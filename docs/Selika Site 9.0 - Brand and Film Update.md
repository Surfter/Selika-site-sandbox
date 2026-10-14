---
tags:
  - selika
  - web-dev
  - design
  - react
  - reference
type: reference
status: active
date: 2026-10-14
source: selika site source, branch v8-overhaul, build 9.0 (14 Oct 2026)
key: What changed from site 8.9 to 9.0 (14 Oct 2026): the brand identity applied (Geist type, lilac accent words, accessible button fills, the logo at weight 560) and the showreel added as a new "The film" section with a hero button and a nav link. Lists every file touched, the new tokens, the video files and how the player behaves. Read with the v8 notes, which still describe everything else.
---

# Selika Site 9.0 - Brand and Film Update

> [!abstract] Key
> What changed from site 8.9 to 9.0 (14 Oct 2026): the brand identity applied (Geist type, lilac accent words, accessible button fills, the logo at weight 560) and the showreel added as a new "The film" section with a hero button and a nav link. Lists every file touched, the new tokens, the video files and how the player behaves. Read with the v8 notes, which still describe everything else.

**Related:** [[Selika Site v8 - Build Bible]] | [[Selika Brand Identity]] | [[Selika Showreel]] | [[Selika Site v8 - Design System]] | [[Selika Site v8 - Sections and Copy]] | [[Selika]]

---

## Why

The CoCreate deadline moved to 16 October 2026 (finalists selected 23 October), so the site can carry the new brand and the film before screeners see it. Everything in the v8 notes still holds except what is listed here. Where a v8 note says Outfit or Plus Jakarta Sans, read Geist.

## Brand applied

- **Type:** Outfit and Plus Jakarta Sans are removed; `@fontsource-variable/geist` 5.3.0 (exact pin) sets both `font-display` and `font-body` in `tailwind.config.js` (`"Geist Variable", "Suisse Intl", system-ui, sans-serif`). The canvas HUD textures (`src/gl/hud.ts`) and the hardware diagram's "S3" label (`src/sections/Inside.tsx`) use Geist too. Instrument Serif and Geist Mono are unchanged.
- **New tokens** in `src/index.css`, swapped with the product like `--accent`:
  - `--accent-strong`: solid fills that carry white text. Beauty `106 87 240` (#6A57F0, 4.96:1 with white), Dev `47 111 224` (#2F6FE0). Used by `.btn-accent`, the selected tick in Compare and the Dev layer's hint chip. Tailwind colour `accent-strong`.
  - `--accent-word`: the italic accent word and the logo mark. Beauty lilac `217 184 255`, Dev ice `169 211 255` (was orchid and sky).
- **Logo:** `Logo` in `src/components/ui.tsx` is Geist weight 560, tracking -0.05em, mark in `--accent-word`, matching the outlined brand wordmark.

## The film

- **Section:** `src/sections/Film.tsx`, placed straight after the hero in `App.tsx`, id `#film`. Eyebrow "The film · About a minute, with sound", headline "The whole idea, *in one film.*", line "The problem, the mirror, a demo and the outcome.", and under the player: "Selika is in development. The film uses concept visualisations and AI-generated people, an AI narrator and an original score."
- **Player:** a poster and a glass play button with a pulsing light ring and a "Sound on · 1:04" pill. Nothing but the poster downloads until it is pressed (`preload="none"`). The first press plays with sound (falls back to muted if a browser refuses) and turns on the native controls. Phones (639 px wide or less) get the 9:16 cut in a 9:16 frame; larger screens get 16:9. It pauses when scrolled out of view. English captions are attached as a track. The frame is lit like the mirror (`.film-frame`, `.film-ring` in `index.css`), and the ring holds still for reduced motion.
- **Files** in `public/visuals/` (addressed through `pub()` so updates bust caches): `selika-film-16x9.mp4` (about 12.9 MB, CRF 23, fast start), `selika-film-9x16.mp4`, posters `selika-film-16x9.jpg` (frame at 24.5 s, the guided face) and `selika-film-9x16.jpg`, and `selika-film.vtt`.
- **Entry points:** a "Watch the film" glass button with a play icon beside the hero's main call to action (on phones too), and "Film" first in the nav. The hero's "Meet Selika Dev/Beauty" button now shows from the large breakpoint up, so the row fits on tablets.

## Checks

Type check and production build pass; a clean `npm ci` and build from the zip pass. Headless Chromium cannot decode H.264 (no proprietary codecs), so playback was checked on the files with ffprobe, and the layout with screenshots at 1440 x 900 and 390 x 844.
