---
tags:
  - selika
  - web-dev
  - design
  - ai-images
type: reference
status: active
date: 2026-10-09
source: selika site v8 source (branch v8-overhaul, final build 8.9), Projects/Selika Site/selika 8.9 and Projects/Selika Site/selika-source-assets
key: Every file in the Selika v8 site's public folder, with size, purpose, how it was made (Higgsfield model and job where known), where its full-resolution original is archived, the exact commands to rebuild it, and the licences of third-party code and models. Read before replacing or regenerating any image, video, face or icon.
---

# Selika Site v8 - Assets and Provenance

> [!abstract] Key
> Every file in the Selika v8 site's public folder, with size, purpose, how it was made (Higgsfield model and job where known), where its original is archived, the exact commands to rebuild it, and the licences of third-party code and models. Read before replacing or regenerating any image, video, face or icon.

**Related:** [[Selika Site v8 - Build Bible]] | [[Selika Site v8 - Interactive Demo]] | [[Selika Site v8 - Hero and Mirror Scene]] | [[Selika Site v8 - Sections and Copy]] | [[Selika Site v8 - Rebuild and QA Playbook]] | [[Selika]]

---

## 1. Rules for assets

- Every face and the hologram are AI-generated (Higgsfield) and are labelled on the site as not real people (demo caption and footer: "The faces, the hologram and the concept images are AI-generated. No real people are shown.").
- Concept images are captioned "Concept visualisation" and show the planned product, not a working one.
- Mo rejected a slick, smiling medium face as uncanny (Higgsfield job 5159be89). Keep faces neutral, front-facing, studio-lit on a dark backdrop.
- Higgsfield credits are limited (236.07 left on 9 Oct 2026 out of about 280 bought). Costs seen: Nano Banana Pro edit 2, Soul 2 image 0.12, Soul Location 0.12, GPT Image 2.5 low 0.25 / medium 2k 1 / high 2k 2.75, Nano Banana 2 1.5, Kling 3.0 std 5 s silent 7.5, Seedance 2.5 720p 5 s 35 (too dear).
- `public/` files keep plain names; `src/lib/pub.ts` appends a content hash so updates are never served stale. Just replace a file and rebuild.

## 2. Inventory of `public/`

| File | Size | Used by | What it is |
| --- | --- | --- | --- |
| `favicon.svg` | 1 KB | browser tab | square icon: the mirror mark (rounded rect plus two diagonal glints, gradient #A9D3FF to #C9A6FF, soft glow) on a dark radial field (#1A1433 to #0B0C18 to #05060A), 512 viewBox, mark scaled 6.1 |
| `favicon.ico` | 5 KB | Google search results, old browsers | 16, 32, 48 px, rendered from `favicon.svg` |
| `icon-192.png`, `icon-512.png` | 26 KB, 131 KB | manifest, JSON-LD logo | same art |
| `apple-touch-icon.png` | 24 KB | iOS home screen | 180 px |
| `site.webmanifest` | 0.3 KB | install metadata | name "selika", theme and background #05060A |
| `faces/face-{fair,medium,warm,deep}.jpg` | 117 to 156 KB | demo PhotoFace | aligned 1024x1280 portrait |
| `faces/face-*-closed.jpg` | 104 to 140 KB | demo blinks | the same frame with the eyes-closed edit blended into the eye band |
| `faces/face-*-depth.png` | 16 KB | demo shading and tilt | 256x320 depth map rasterised from the face mesh |
| `faces/face-*-thumb.jpg` | 3 KB | skin tone picker | 112x112 crop |
| `faces/face-*.json` | 6.5 KB | makeup, guides, hover regions | landmark groups normalised to the frame |
| `visuals/holo.mp4` | 93 KB | hero (Beauty) | 716x1284 looping hologram face, silent |
| `visuals/holo.jpg` | 51 KB | hero | poster frame of the loop |
| `visuals/concept-beauty.webp` | 21 KB | Two products panel | 1100x499 concept visualisation |
| `visuals/concept-dev.webp` | 17 KB | Two products panel | 1100x499 concept visualisation |
| `visuals/reflect.webp`, `light.webp`, `return.webp` | 13 to 18 KB | "Only a mirror" tiles | 400x500 portrait crops inside the tile mirrors |
| `models/face.glb` | 1.1 MB | demo fallback only | ICT-FaceKit Light face, converted by `tools/ict2glb.py`; loaded only if `FACE_PACKS` is empty |

## 3. Provenance and originals

All originals are in `Brainvault/Projects/Selika Site/selika-source-assets/` (47 MB, with `MANIFEST.md`), also kept as two zips: `selika-source-assets-1-faces.zip` and `selika-source-assets-2-hologram-concepts.zip`.

| Asset | Made with | Original in the archive |
| --- | --- | --- |
| Fair, warm, deep portraits | Higgsfield portrait generations, front-facing, dark studio backdrop, 1536x2048, each with an eyes-closed edit | `faces/NAME-open.png`, `faces/NAME-closed.png` |
| Medium portrait | Higgsfield Soul 2 (job 2fe9e66b), the "normal" face Mo picked, plus a Nano Banana Pro eyes-closed edit | `faces/medium-open.png`, `faces/medium-closed.png` |
| Hologram | a softer hologram still (job bcb28c97) animated with Kling 3.0 std, 5 s, start frame = end frame, then cut to a seamless loop with a crossfade (ffmpeg) and encoded small | `hologram/holo-still.png`, `holo-kling-raw.mp4`, `holo-loop-final.mp4` (byte-identical to `public/visuals/holo.mp4`) |
| Dev concept | Nano Banana Pro edit of a photoreal hallway mirror image: clock, weather, an Agent brief card and calendar on the glass | `concepts/hallway-mirror-base.png`, `concepts/concept-dev-source.png` |
| Beauty concept | Nano Banana Pro edit of the same hallway mirror for Beauty, so both concepts share lighting and style (job b1ce79f6, second of two edits) | `concepts/concept-beauty-source.png` |
| Tile portraits | crops used inside the three "only a mirror" tiles | repo only |
| Icons | drawn in code (SVG) and rendered to PNG/ICO with headless Chromium and Pillow | `public/favicon.svg` is the source |

Verified on 9 Oct 2026: rebuilding the fair and medium packs from the archived originals reproduces the shipped files (mean pixel difference 0.0 to 0.05).

## 4. Rebuild commands

**Face pack** (needs Python with `mediapipe==0.10.14`, `opencv-python`, `numpy`):

```
python3 -I tools/build_face_pack.py faces/NAME-open.png faces/NAME-closed.png public/faces face-NAME
```

Then list `{ id: "NAME", label: "...", blink: true }` in `src/sections/demo/facePacks.ts`. The builder aligns by the irises (eye line at 0.40 of the height, eye distance 0.26 of the width), fills anything outside the source softly, continues the head upward if the portrait is cropped through the hair (`extend_top`), blends the eyes-closed band, writes the depth map, thumbnail and landmarks. Details: [[Selika Site v8 - Interactive Demo]].

> [!warning] Deep pack
> MediaPipe's landmarks shift a few pixels (up to 12 px on the lips) whenever the input image changes. The shipped deep pack therefore keeps its 8.4 JSON, depth map and eye band; only `face-deep.jpg` and the top 104 rows of `face-deep-closed.jpg` came from the 8.7 rebuild (the continued crown). A fresh rebuild works but re-check lipstick alignment in the demo.

**Concept image:** crop the source with x from 0.20 to 0.88 of the width, top at 0.06 of the height, aspect 2.2:1; resize to 1100x499; save WebP (quality about 82).

**Hologram loop:** generate a still, run Kling with the still as both first and last frame, trim, crossfade the end into the start (about 0.5 s), scale to 716x1284, H.264, no audio, small CRF. Poster: first frame as JPEG. The scene maps the video at height 1.7 mirror units, width from the 716:1284 aspect ([[Selika Site v8 - Hero and Mirror Scene]]).

**Icons:** edit `public/favicon.svg`, render it to a 512 px PNG (any browser screenshot), then with Pillow save `icon-512.png`, `icon-192.png`, `apple-touch-icon.png` (180) and `favicon.ico` with sizes 16, 32, 48. Keep the mark well inside the circle Google crops to.

**Fallback 3D face:** `tools/ict2glb.py` (with `tools/objread.py`) converts ICT-FaceKit Light into `face.glb` (skin, eyes on pivots, lashes, 23 ARKit-named shapes; sparse, quantised and meshopt-compressed from 9.8 MB to 1.1 MB).

## 5. Licences

- ICT-FaceKit (USC ICT, MIT) and the npm packages are listed with their licences in `THIRD_PARTY_NOTICES.md` in the source: mostly MIT, lucide under ISC, gsap under GSAP's standard no-charge licence.
- Fonts (Outfit, Plus Jakarta Sans, Instrument Serif, Geist Mono) are self-hosted via Fontsource under the SIL Open Font License.
- Higgsfield outputs are ours to use under the account's plan; they are AI-generated and labelled as such.
