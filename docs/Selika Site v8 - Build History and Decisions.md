---
tags:
  - selika
  - web-dev
  - design
  - decisions
type: reference
status: active
date: 2026-10-09
source: Selika site v8 build sessions, 6 to 9 October 2026; claude/selika-site-v8-brief.md; Projects/Selika.md progress log
key: The decision record of the Selika v8 site, round by round from 8.0 to 8.9: what Mo asked for in each review, what changed (with commits), the approaches tried and rejected, the bugs and their root causes, the research the design came from, and the standing rules. Read before changing anything so old mistakes are not repeated.
---

# Selika Site v8 - Build History and Decisions

> [!abstract] Key
> The decision record of the Selika v8 site, round by round from 8.0 to 8.9: what Mo asked for, what changed (with commits), approaches tried and rejected, bugs and their root causes, the research behind the design, and the standing rules. Read before changing anything so old mistakes are not repeated.

**Related:** [[Selika Site v8 - Build Bible]] | [[Selika Site v8 - Rebuild and QA Playbook]] | [[Selika Site v8 - Hero and Mirror Scene]] | [[Selika Site v8 - Aurora Background]] | [[Selika Site v8 - Interactive Demo]] | [[Selika Site v8 - Assets and Provenance]] | [[Selika]] | [[Cinematic Glass Website Playbook]]

---

## 1. The brief

Remake selika.site as an interactive, cursor-reactive, fluid product site for two products on one mirror. The hero follows the getlayers "Soda" pattern: the product in the middle in 3D, its "ingredients" floating around it, and a switcher that spins the product and shifts the colour of the whole world.

Mo's calls on 6 Oct: visuals built in code (Three.js, shaders, SVG) with Higgsfield stills later; the demo face is a face, no camera mode; delivery as folder plus zip that Mo pushes himself (sandbox repo first, then live); phones are a first-class target.

### Research that shaped it

| Reference | Taken for Selika |
| --- | --- |
| getlayers Soda | mirror in the middle, features as orbs, product cards, spin plus world colour shift on switching (about 1 s) |
| getlayers Relay | one stream of light running the whole site (became the aurora); a ring that counts the page in; sections that arrive out of focus; sans headlines with italic serif accent words |
| getlayers AI Studio | the camera dives "through the mirror" between hero and next section |
| igloo.inc | features encased in glass, frost and scramble ideas |
| sirup.online/5th | blurred grainy light field behind everything; the only gradient on the site |
| pear.no | fluid zoom-through, kept short |
| cosmos.so | calm product feel; the "Ask Selika" pill with rotating prompts |
| inkwell.tech | the hardware section as an exploded stack of glass layers |
| KokonutUI | an accessible card flip (rebuilt); liquid glass ideas (own `.sg-glass` and `.lg-glass` instead) |
| thinking-orbs | the assistant's state orb |

## 2. Round by round

| Build | Commit | Date | What changed |
| --- | --- | --- | --- |
| 8.0 | 31830bc | 6 Oct | First v8: R3F mirror, seven glass orbs per product, spin switch, scroll dive, shader background, ICT-FaceKit 3D demo face with painted makeup, lashes and hair, Dev modules, all sections |
| 8.1 | f52524f | 7 Oct | From 12 annotated screenshots: background no longer jumps on scroll (time integrated on the CPU); blur stuck after the hardware section fixed; new headlines ("A mirror that guides you." / "A mirror you can build on."); holographic face; orbs rise from below and avoid the copy (`[data-avoid]`); dive bursts the hologram toward the viewer; aurora curtain with soft edge; tighter sections; Compare as one table; direct dragging in Dev; photographic face pipeline built (`build_face_pack.py`, `PhotoFace.tsx`) |
| 8.2 | 67d1e84 | 7 Oct | Higgsfield visuals in: four face packs, hologram loop, concept images, tile portraits; orbs in two columns with smarter labels; liquid glass on switch cards and bubble card with "More detail"; big phrase split around the mirror; two-turn spin over 1.55 s; problem flip cards; segmented demo controls; animated "only a mirror" tiles |
| 8.3 | 417e1c0 | 7 Oct | No leftover bubbles after quick switches; card hides 0.1 s after the pointer leaves (bridge between bubble and card); liquid glass rims everywhere; aurora zigzags margin to margin down the page as one curtain; demo photo no longer warped, the key light leans to the cursor instead; pigment-style makeup; Dev modules size to content; Outfit for all numerals; new medium face (Mo picked m2) and softer hologram |
| 8.4 | beea254 | 7 Oct | Entrance: the preloader ring morphs into the mirror outline and the glass powers on; bubble cards open away from the mirror; Dev panes re-spaced; aurora runs become sine S-curves; demo starts on Warm and Office; gentle tilt and natural blink; deep face's out-of-frame area filled; one-line demo header; new Beauty concept matching the Dev one; slower flip cards on phones; comparison text wraps on phones |
| 8.5 | c056549 | 7 Oct | Bubbles shoot up from below the screen, fast; each aurora layer folds in its own place with round tips (true-distance edge); Ask pill eases to its new height without overshoot |
| 8.6 | 6500fab | 7 Oct | Bubble overshoot calmed (back.out 1.05 over 0.78 s) and paths scatter outward mid-flight before settling |
| 8.7 | a27f799 | 7 Oct | Deep face: the head continues to the top of the frame (mirrored hair narrowed to a fitted head ellipse); every `public/` file versioned by content hash after Mo saw a stale cached image |
| 8.8 | d5ffbca | 7 Oct | Hero headline masks no longer clip the italic "g", descenders or the "t" of "that" |
| 8.9 | 4aa8c7f | 9 Oct | Square search and app icons (`favicon.ico`, PNG sizes, manifest, Organization JSON-LD logo); full documentation in `docs/`; QA scripts in `tools/qa/` |
| 9.3 | (built on 8.9) | 16 Oct | The product video (16:9, 1:54) streamed as HLS from `public/visuals/film/` (`film.m3u8`, `init.mp4`, 19 `.m4s` segments, the approved encode split with `ffmpeg -c copy`, bit-identical, largest segment 3.8 MB so GitHub's 25 MB web-upload limit never applies; Safari plays it natively, other browsers lazy-load `hls.js` in its own chunk on the first press of play), poster `selika-film.jpg` (logo and "A mirror that understands you." on black), headline "Meet *Selika.*"; the headline row shares the video frame's width so the heading and description line up with its left and right edges is now the highlight: a new `#film` section straight after the hero (it takes over the hero dive's negative top margin), then the demo, then the problem cards. Every "Try the demo" style button now reads "Watch the product video" and scrolls to `#film`; nav gains "Video". Phones held upright open the film full screen and ask for landscape (Android locks; iOS uses its own player). No 9:16 cut yet. (The earlier 9.0 film embed is set aside.) |
| 9.4 | (built on 9.3) | 16 Oct | Hero bubbles morph into their cards: hovering a bubble swells it on a spring (`OrbOverlay` in `Hero.tsx`, one glass shell per feature, driven per frame) into its card, which keeps the bubble's offset and rides its float and drift; the 3D orb hands over in the first 10% (`orbHide` in `heroBridge.ts`) and the icon flies from the bubble into the card's header. Leaving the card's bounds folds it straight back into the bubble (firm spring, about 0.15 s, no hold or bridge); touch screens open on a tap as before. (Demo face eyes-closed change here was a misunderstanding, reverted in 9.5.) Every "Watch the product video" button (and the nav's Video link and the skip link) lands on `#film-start`, so "Meet Selika." sits just under the nav with the whole player in view. Aurora: no more hard vertical cut-offs at fold tips (the early-outs only skip where every term is zero, and the edge glow fades softly past a tip), each run fades out before it leaves the three runs a pixel samples, cluster and brightness gaps never drop to nothing and change more slowly (no dark columns between rays, no branch blinking to a new shape), sizes come from the canvas's steady 100lvh height (a phone's address bar no longer makes the whole aurora jump), and the field's detail is fixed for the visit (a tier drop only lowers resolution). |
| 9.5 | (built on 9.4) | 16 Oct | Fixes after review. The morphing cards were landing away from their bubbles (and some vanished at once): `.lg-glass` sets `position: relative`, which beat the shells' `absolute`, so every card sat in the normal flow below the earlier (hidden) ones while the hit test used the true place. Each shell is now pinned `position: absolute` (inline and in `.orb-card.lg-glass`); all 7 bubbles open in place and stay open while the pointer is on the card. The demo faces are back to 9.3 exactly (blinking, original thumbnails): the eyes-closed request was for the hero mirror's hologram. `visuals/holo.mp4` is re-made with her eyes closed in every frame (the closed frame of the original's blink, frame 31, feathered over the eye band of each frame; nothing else in the clip moves beyond its shimmer, measured), same size, 24 fps, H.264; `holo.jpg` poster re-taken from it. |
| 9.6 | (built on 9.5) | 17 Oct | The hero hologram comes alive (eyes closed made it feel empty). A new additive layer over the glass (`BEAUTYFX_FRAG`, same glass mesh as the video) runs a five-step loop, 3.8 s a step (Prep, Brows, Eyes, Cheeks, Lips): a face analysis from `visuals/holo-scan.png` (MediaPipe Face Landmarker on the closed-eye hologram: the 478-point mesh in red, the points in green, the feature outlines in blue, in HUD pixels, so it sits exactly on the face) lit by a scan line that sweeps the whole face on Prep and the step's region on the others, with twinkling points; focus brackets that glide and breathe to each step's region, labelled (FACE · 478 POINTS, BROWS, EYES, CHEEKS, LIPS); the step card's text sliding up and away while the next rises behind a wipe (atlas drawn at runtime by `drawBeautySteps` in `hud.ts`), the progress bar filling through each step, the voice meter moving while Selika "speaks" each instruction, and a pulsing live dot. The static HUD keeps only the card glass and the LISTENING caption. Pauses with the hero; reduced motion holds the Eyes step still. |
| 9.7 | (built on 9.6) | 17 Oct | Hologram: the analysis now reads on the bright face: it is composited "over" (premultiplied, `overBlend`; alpha 0 still adds light) in a deep ink violet with a light glow, labels sit on dark pills sized to each label, brackets are thicker; the scan waits for the brackets to arrive (starts at 1.0 s), runs from the box's top edge to its bottom edge and is clipped to the box. Demo face: each face has a baked landmark mesh (`faces/face-*-mesh.png`, MediaPipe, 512x640, R mesh, G points, B outlines). A new step scans its region (0.9 s, the mesh lighting behind the line), then the guides draw out from the region's centre with a bright head, then shimmer (sparks travelling along them, the region's mesh breathing, points twinkling); coming into view replays it. Changing skin tone rebuilds the face: the old face waits as a lilac, scanlined hologram while the new one is rebuilt top to bottom behind a beam (1.5 s, the fresh mesh glowing above it, slight colour split, flickering cells). Changing look (and adding a step's makeup) is a targeted rebuild: only where the makeup changes, top to bottom across the face (look, 1.35 s) or the step's region (1.0 s), with the mesh lit, scanlines and a bright edge at the front. Light changes unchanged. Eight texture units in the demo shader (photo, closed, depth, makeup, guides, mesh, previous face, previous makeup). |
| 9.8 | (built on 9.7) | 17 Oct | Hologram: the face label reads just FACE (no point count); the brackets and the scan line are toned down (thinner, about half the ink and glow); what the scan has lit stays lit and eases down after the line finishes instead of dropping at once. Demo face: only the mapping step (Prep) keeps a scan line (now 1.4 s down the face); every other step blooms the mesh out from the region's centre instead. Either way the highlight rises, holds, then glides down to the resting glow (exponential, about 1.2 s), so nothing snaps to a lower tone. |

## 3. Things tried and rejected

| Area | Tried | Why it went |
| --- | --- | --- |
| Demo face | ICT-FaceKit 3D face with painted makeup, lashes and hair (8.0) | replaced from 8.2 by AI-generated photographs; the 3D face stays as the fallback |
| Demo face | warping the photo toward the cursor (parallax) | stretched; replaced by a key light that leans toward the cursor plus a very small tilt (TILT_X 0.013, TILT_Y 0.01, about a third of 8.2's) |
| Faces | a slick smiling medium face (job 5159be89) | uncanny to Mo |
| Hero | a face drawn on the HUD (8.0), then a point-cloud hologram from ICT-FaceKit (8.1) | replaced in 8.2 by the Kling hologram video, softened in 8.3 |
| Bubbles | launching out of the mirror | Mo wanted them from the bottom of the screen |
| Bubbles | back.out(1.9) plus an upward impulse | overshot and went too high; settled on back.out(1.05) with a sideways swing |
| Aurora | rotated curtains | looked like a comb |
| Aurora | zigzag with vertical rays and hard turns | crossing "X" lines at the folds |
| Aurora | S-curves meeting at one point | a "chip" where all layers converged |
| Aurora | perpendicular distance via cos of the angle | full-height vertical streaks |
| Aurora | final: per-layer sine S-curves, offsets, two Newton steps to the true curve distance, soft tip fade | kept |
| Concepts | a woman doing her own makeup with a corner instruction | did not show the product; replaced by hallway-mirror edits matching the Dev concept |

## 4. Bugs worth remembering

| Symptom | Root cause | Fix |
| --- | --- | --- |
| Background jumped when scrolling | time multiplied by scroll speed in the shader | integrate motion time on the CPU |
| Sections after the hardware view stayed blurred | Reveal chose blur per render; the performance tier dropped mid-page | Reveal is opacity and translate only |
| Feature cards jumped to the top left | a motion transform overrode the position | position on a wrapper, motion inside |
| Hover card ran away from the cursor and clicks missed | the card re-placed itself under the pointer | `holdCard` freezes placement while hovered, 90 ms hide grace, bridge element |
| Flip cards flipped in 0.28 s | a global `button:not(.no-press)` transition rule | `no-press` plus an explicit 0.7 s (1.05 s on touch) transition |
| Dev demo widened the page on phones | a `pre` code block in an auto grid track | `grid-cols-[minmax(0,1fr)]` |
| Ask pill overshot when the answer changed | `layout` spring on the button | measured-height answer area (ResizeObserver), AnimatePresence `mode="wait"` |
| Vertical brown streaks over the deep face | the portrait is cropped through the hair; BORDER_REPLICATE smeared the edge; later a stale cached image | soft fill, then `extend_top` crown continuation, then content-hashed asset URLs |
| The italic "g" in the headline was cut | line masks (`overflow-hidden`) at the text's exact box; Instrument Serif Italic "g" sits 0.068 em left of its origin and descends 0.216 em | masks padded 0.14 em each side and 0.16 em below with matching negative margins; hidden start at y 125% |
| Generic globe in Google results | SVG-only favicon with transparent corners | square ICO and PNG icons, manifest, JSON-LD logo |
| Many 3D chunks loading up front | Rollup folded shared modules into the 3D chunk | `manualChunks`: `three` and `vendor` |

## 5. Standing rules

- No em dashes anywhere. Never state anything false; leaving something out is fine.
- "We" and "our"; never that the company is one person; keep Mo's employer off the site.
- Competitor claims scoped to evidence ("Not listed").
- AI faces and the hologram labelled as AI-generated; concept images captioned "Concept visualisation".
- Spend Higgsfield credits carefully.
- Mobile must work: touch replaces hover, lighter rendering tier, layouts checked at 390 px.
- Each build ships as `selika 8.x` folder plus zip in Downloads and `Brainvault/Projects/Selika Site/`, with an entry in [[Selika]].
