---
tags:
  - selika
  - brand
  - design
  - reference
type: reference
status: active
date: 2026-10-14
source: Selika brand system built 14 Oct 2026 from the v8 site; published as the private Claude Design System artifact "Selika"
key: Selika's fixed brand identity (14 Oct 2026): the idea (Guided on you.), voice and copy rules, logo and lockups, the full colour palette with hex values for dark and paper, Geist + Instrument Serif + Geist Mono type scale, liquid glass, light and chrome materials, layout, imagery, motion springs, sonic logo and voice, and where every brand file lives. Read before making anything for Selika.
---

# Selika Brand Identity

> [!abstract] Key
> Selika's fixed brand identity (14 Oct 2026): the idea (Guided on you.), voice and copy rules, logo and lockups, the full colour palette with hex values for dark and paper, Geist + Instrument Serif + Geist Mono type scale, liquid glass, light and chrome materials, layout, imagery, motion springs, sonic logo and voice, and where every brand file lives. Read before making anything for Selika.

**Related:** [[Selika]] | [[Selika Showreel]] | [[Selika Site 9.0 - Brand and Film Update]] | [[Selika Site v8 - Design System]] | [[Cinematic Glass Website Playbook]] | [[Projects]]

---

## Where it lives

- **Brand book (living):** the Claude Design System artifact "Selika" (https://claude.ai/artifact/HMBoYmHyTzMefByxspe4dZ). Private until shared from claude.ai. It holds this text, the tokens, fonts, components (Button, GlassPanel, AccentHeadline, LightPreset, AskPill), logos and imagery, and other Claude artifacts (decks, designs) can be built from it.
- **Files:** `Projects/Selika Site/selika-brand/` holds the logo SVGs and PNGs, fonts, `tokens.json`, the business card and poster sources and exports.
- **Font choice:** Geist (free, open licence) stands in for Suisse Intl, which Mo likes. If we license Suisse Intl it goes first in the `sans` stack and nothing else changes.

## Brand book

Selika is one mirror platform with two products: **Selika Beauty**, which guides your makeup step by step on your own reflection in light you control, and **Selika Dev**, which opens the same mirror to developers and makers. The brand feels like the moment a mirror lights up: dark, calm and precise, then a ring of light, glass and one warm human word. Build everything from the tokens, fonts and marks in this system.

### The idea in one line

**Guided on you.** The help belongs where you are already looking. Every piece of Selika work shows that idea: guidance drawn onto a reflection, light that changes the real face, a mirror that becomes a platform.

| Line | Use |
| --- | --- |
| Guided on you. | Master tagline: end cards, business card back, poster sign-offs. |
| A mirror that guides you. | Selika Beauty headline. |
| A mirror you can build on. | Selika Dev headline. |
| Beauty proves why the mirror needs to exist. Dev proves what the mirror can become. | The one sentence that explains two products. |
| Walk out sure. | The outcome. Use it to close emotional pieces (showreel, posters). |

### Content fundamentals

- Write for a smart 12-year-old: short sentences, everyday words, one idea per line. "Step by step, drawn right onto your own reflection," not "AR-anchored procedural overlays."
- Speak as **we** and **our** for the company; speak to **you**. Never describe Selika as one person.
- Sell outcomes and identity, never features alone: "Walk out sure," "See it in the light you're heading into."
- Contrast with today's reality honestly: "A lit mirror gives you light. A phone gives you another screen. Selika guides you." Name competitors only with evidence and scope ("Not listed"), never in ads.
- Never claim what is not true. Selika is in development: say "concept visualisation" on generated product imagery, "AI-generated" on faces, and keep prices as "price hypothesis £249 to £299".
- No em dashes in any copy. Use a colon, a comma or a new sentence.
- Casing: the wordmark is lowercase **selika**; in sentences write **Selika**, **Selika Beauty**, **Selika Dev**. Headlines use sentence case and end with a full stop.
- One accent per headline: the emotional end of the line in `accent` (Instrument Serif italic) in `lilac`, for example "A mirror that *guides you.*" Dev uses `ice`.
- No emoji. Icons are Lucide line icons at 1.75 to 2px stroke.

### Logo

- The mark is a mirror outline (a rounded rectangle) with two diagonal glints: the long one full strength, the short one at 45%. Use the files in **Logos**; never redraw it.
- Lockups: `selika-lockup-dark.svg` on `obsidian`, `selika-lockup-light.svg` on paper. The wordmark is Geist at weight 560, tracked -0.05em, outlined in the files.
- Clear space around the mark is the width of the mirror's corner radius on every side; around a lockup, half the mark's height.
- Minimum sizes: mark 16px tall on screen, 5mm in print; lockup 96px wide on screen, 22mm in print.
- Colour: the mark is `lilac` on obsidian, `glass` when it sits on a photograph, `ink`/`iris-strong` on paper. Never recolour it outside this palette, never stretch, rotate or outline it, never put it on a busy photo without a dark scrim.
- `selika-chrome-mark.jpg` is the hero mark: liquid chrome with sky, violet and lilac reflections. Use it only large (end cards, the back of the business card, posters), only on `obsidian`, and only once per piece.
- `selika-app-icon.png` is the square icon for favicons, search results, app tiles and social avatars.

### Colour

- `obsidian` is the ground of everything. Tint, do not lighten: raised surfaces are `midnight` and `graphite`.
- `iris` is the Selika colour; `orchid` and `lilac` are its family for Selika Beauty. `azure`, `sky` and `ice` are Selika Dev's family and replace the violet family whenever Dev is the subject. Never mix the two families in one panel; a piece may move from one to the other (the world colour shift).
- Text: `glass` for primary, `mist` for secondary, `dusk` for fine print only. Accent words in `lilac` (Dev: `ice`).
- Buttons: primary is `iris-strong` with white text; never white text on plain `iris`.
- `warm-light` exists only to show 2700K to 3000K light. Never decoration.
- Gradients are allowed in exactly two places: **light** (the aurora: soft radial glows of iris, orchid or azure on obsidian, never a linear gradient behind text) and **chrome** (the four chrome stops, on the mark and on hero objects only). No purple-to-blue UI gradients, no gradient text.

### Typography

- **Geist** (variable) for everything: headlines at 600 with tight tracking (`display-xl`, `display`, `heading`), text at 400 (`body-lg`, `body`). Geist is our free, open-licence Swiss grotesk; if we license **Suisse Intl** later it drops into the `sans` stack first with no other change.
- **Instrument Serif italic** for the accent word only (`accent`), never for full sentences or body copy.
- **Geist Mono** uppercase for labels and measurements (`label`, `spec`): STEP 3 OF 5 · EYES, 5000K · CRI 95+.
- Numbers in Geist, never in the serif. Use tabular figures where they line up.
- Headlines are short and break by meaning; keep two lines or fewer.

### Materials

- **Liquid glass** (`glass-fill`, `glass-rim`, `shadow-glass`, radius `radius-lg`): a faint fill, a hairline rim, a lit top edge and an 18px backdrop blur. Every panel, chip, pill and card is glass. On video, double the rim to 2px.
- **Light**: the mirror's light ring is a 4px `lilac` line with `shadow-glow`. Light reveals, it never decorates: rings, glows and the aurora appear when something becomes visible.
- **Chrome (Y2K)**: liquid metal with iridescent sky and lilac reflections, for the mark and single hero objects. Chrome is the jewellery; glass is the clothing. One chrome object per composition.
- **The mirror shape**: a portrait rounded rectangle at `radius-mirror` (4:5). Frame faces, demos and product moments in it.

### Layout

- Dark, spacious, anchored: pin content to the left or bottom with generous margins (`space-24` on video and large screens, `space-4` minimum on phones), and leave the right or centre for the mirror.
- One focal object per view (the mirror, the face, the chrome mark), one headline, one line of support.
- Grids of equal cards only when the content is a true set (three problems, three permissions).

### Imagery

- Real-feeling people in real rooms, cinematic and slightly dark: cool morning bathroom light for the problem, soft violet-white mirror light for Selika, warm evening light for the outcome. See **Imagery**.
- Faces are AI-generated and labelled as such; product shots are labelled "Concept visualisation" until the hardware exists.
- No stock-photo smiles at the camera, no visible third-party brands, no clutter in the mirror.

### Motion

- Everything moves on springs. Default spring: stiffness 170, damping 14 (settles with one gentle overshoot). Pop for small objects arriving: 260 / 13. Soft for large panels: 120 / 17. Heavy, with a little bounce, for falling cards: 140 / 11.
- Entrances ease out (`cubic-bezier(0.16, 1, 0.3, 1)`), exits ease in and are faster than entrances.
- Lines of text arrive word by word or line by line, rising 40 to 60% of their height; never letter-spacing tweens.
- Light leads: a ring draws, a glint sweeps, then the content appears.
- Hold every readable line at least 0.8s settled (0.3s per word for sentences).
- Respect reduced motion: no springs or sweeps, just crossfades.

### Sound and voice

- **Sonic logo**: a three-note glass chime, F#5, A5, D6, played up the scale in 0.2s, on every end card and at the reveal.
- **Music**: 112 BPM, D major, airy glass pads, a plucked arpeggio, a soft punchy kit and a warm sub. It ducks under the voice.
- **UI sounds**: glass ticks for guides and checks, a soft click for selections, a mechanical double click for the camera shutter.
- **Voice**: a warm, clear, friendly female voice (our current narration uses the "Imogen" preset), playful but steady, never salesy.

### Applications

- **Website**: `obsidian` ground with the aurora, glass panels, Geist type, Instrument Serif accents, the 3D mirror in the hero.
- **Showreel**: 16:9 and 9:16, 112 BPM, the story is problem, reveal, demo, contrast, Dev, privacy, outcome, tagline.
- **Business card**: 85 x 55mm. Front on paper with the name and role; back on obsidian with the chrome mark, the wordmark and "Guided on you."
- **Posters and ads**: one headline with one accent word, one image or the mirror, the lockup bottom left, the small honesty line bottom right.

## Colour tokens

| Token | Dark (primary) | Paper | Use |
| --- | --- | --- | --- |
| `obsidian` | `#05060a` | `#f4f5fb` | Ground. Every Selika screen, video frame and the back of the business card sits on Obsidian; Paper is its print and document counterpart. |
| `midnight` | `#0b0c18` | `#ffffff` | Raised surface under glass panels, cards and the mirror's glass. |
| `graphite` | `#161827` | `#e7e9f3` | Second raised surface: inputs, inactive chips, code blocks. |
| `glass` | `#eef2ff` | `#0b0c18` | Primary text and the wordmark. 18:1 on obsidian and midnight in both themes. |
| `mist` | `#a3acc2` | `#4a5068` | Secondary text: body copy under a headline, captions. 8.5:1 or better on obsidian and midnight. |
| `dusk` | `#6e7891` | `#6b7186` | Tertiary text: fine print, mono metadata, disclaimers. 4.4 to 4.6:1, so keep it to 14px+ text that is not essential. |
| `iris` | `#8b7cff` | `#5b45e8` | The Selika colour. Glows, the light ring, focus rings, links and accent marks. Text in iris reads on obsidian (6.2:1) and paper (5.6:1). |
| `iris-strong` | `#6a57f0` | `#5b45e8` | Fill of the primary button and solid brand blocks. White text on it (4.96:1); never white on plain iris (3.3:1). |
| `orchid` | `#b07cff` | `#7a3fd9` | Selika Beauty's second colour: aurora light, gradients of light, the second glow. |
| `lilac` | `#d9b8ff` | `#7a3fd9` | Accent words in Instrument Serif italic, makeup guides drawn on the reflection, checkmarks. 11.8:1 on obsidian. |
| `azure` | `#4d8dff` | `#2f6fe0` | Selika Dev's colour. Swaps in for iris whenever Dev is the subject. On paper keep azure to 24px+ text or marks (4.3:1). |
| `sky` | `#8ec5ff` | `#2f6fe0` | Selika Dev's second colour: aurora light and module glows. |
| `ice` | `#a9d3ff` | `#2f6fe0` | Dev accent words and code highlights; Dev's equivalent of lilac. |
| `warm-light` | `#ffb46b` | `#b8621a` | 2700K to 3000K light only: restaurant and evening presets, the warm side of a light comparison. Never decoration. |
| `chrome-hi` | `#ffffff` | `#ffffff` | Chrome stop 1 of 4 (the highlight). The chrome finish is used on the mark only. |
| `chrome-sky` | `#c9e4ff` | `#c9e4ff` | Chrome stop 2 of 4: the cool reflection. |
| `chrome-mid` | `#8a90a8` | `#8a90a8` | Chrome stop 3 of 4: the body of the metal. |
| `chrome-lilac` | `#c7a4ff` | `#c7a4ff` | Chrome stop 4 of 4: the iridescent edge. |
| `glass-fill` | `rgba(255,255,255,0.06)` | `rgba(11,12,24,0.04)` | Liquid glass panel fill, always with backdrop blur 18px and saturate 150%. |
| `glass-rim` | `rgba(255,255,255,0.16)` | `rgba(11,12,24,0.14)` | Hairline rim of every glass panel and chip. |
| `focus` | `#d9b8ff` | `#5b45e8` | Focus ring, 2px solid with 3px offset; 3:1 or better on every surface. |
| `success` | `#7fe0b4` | `#137a50` | Positive state with a word or icon (e.g. Build passing). Never the only signal. |

Contrast checks: white on `iris` is 3.27:1 (fails), so solid fills that carry white text use `iris-strong` (4.96:1); Dev uses `#2F6FE0` for the same job on the site.

## Type scale

| Style | Family | Size | Weight | Tracking | Use |
| --- | --- | --- | --- | --- | --- |
| `display-xl` | sans | 96px | 600 | -0.05em | Hero headlines, video titles, poster headlines. One per view. |
| `display` | sans | 64px | 600 | -0.045em | Section headlines and end cards. |
| `heading` | sans | 40px | 600 | -0.035em | Card and panel titles. |
| `title` | sans | 24px | 550 | -0.02em | Step cards, module names, list titles. |
| `accent` | serif | 1.2em | 400 | -0.01em | The emotional word or phrase at the end of a headline, in lilac (ice for Dev). One accent per headline, sized 1.15 to 1.2 times the headline. |
| `body-lg` | sans | 20px | 400 | -0.005em | Lead paragraph under a headline, in mist. |
| `body` | sans | 16px | 400 | 0 | Running text. |
| `small` | sans | 14px | 400 | 0 | Captions, disclaimers, fine print in dusk. |
| `label` | mono | 12px | 500 | 0.16em | Uppercase metadata: steps, Kelvin values, permissions, eyebrows. Always uppercase, always tracked. |
| `spec` | mono | 14px | 400 | 0.04em | Numbers that are measurements: Kelvin, CRI, prices, times. |

## Business card and posters (first versions, 14 Oct 2026)

- **Business card:** 85 x 55 mm, print PDF with 3 mm bleed (91 x 61 mm pages, keep text 3 mm inside the trim). Front on paper: lockup, Mahmudul H. Sikdar, FOUNDER & CEO, TEL 07401 760062, WEB selika.site, "Guided on you." and a nine-colour palette strip along the bottom edge. Back on obsidian: the chrome mark in an iris aurora, the wordmark, "Guided on you." and SELIKA BEAUTY · SELIKA DEV. The PDF is RGB; most online printers (Moo, Vistaprint, Solopress) accept it, ask for a proof if colour matters.
- **Posters (4:5, 1620 x 2025 px):** "Would you rather follow a phone, or your own reflection?" (the contrast), "A mirror that guides you." (Beauty), "Walk out sure." (the outcome, warm evening light) and "A mirror you can build on." (Dev, azure). Each carries the lockup bottom left and its honesty line bottom right (AI-generated imagery, concept visualisation, in development). No competitors named.
