---
tags:
  - selika
  - video
  - motion-design
  - brand
  - reference
type: reference
status: active
date: 2026-10-14
source: Selika showreel built 14 Oct 2026 with Hyperframes 0.8.157, Higgsfield (gpt_image_2_5, Kling 3.0, ElevenLabs v4) and a score written in code
key: The Selika showreel (1:04, 16:9 and 9:16, 14 Oct 2026). The story and full narration script, scene timings on a 112 BPM grid, voice, the original score and sound design, every AI-generated asset and credit spend, files, how to re-render and how to swap the voice or music. Read before editing or re-cutting the film.
---

# Selika Showreel

> [!abstract] Key
> The Selika showreel (1:04, 16:9 and 9:16, 14 Oct 2026). The story and full narration script, scene timings on a 112 BPM grid, voice, the original score and sound design, every AI-generated asset and credit spend, files, how to re-render and how to swap the voice or music. Read before editing or re-cutting the film.

**Related:** [[Selika]] | [[Selika Brand Identity]] | [[Selika Site 9.0 - Brand and Film Update]] | [[Selika CoCreate Application Plan]] | [[Selika Site v8 - Build Bible]] | [[Projects]]

---

## What it is

A 64.3 second narrated film that sells Selika as a complete product and company: the problem, the reveal, a demo, the contrast with what people use today, Selika Dev, privacy, the outcome and the tagline. It is on the website from build 9.0 (section "The film", `#film`) and ships as two cuts: 16:9 (1920 x 1080) and 9:16 (1080 x 1920). Both are 30 fps H.264 with AAC audio.

Honesty: faces are AI-generated and product shots are concept visualisations; the clips carry those tags and the end card says "In development · Concept visualisations and AI-generated imagery". No competitor is named.

## Story and principles

Hook (a relatable bathroom moment) → pain (pause, rewind, foundation on your fingers; colours that change outside) → reveal on the drop ("Meet Selika") → demo (guides drawn on the reflection, hands-free, light presets) → contrast ("Which would you rather?": a lit mirror, a phone, Selika) → Selika Dev (modules, models, rules) → privacy (a shutter you can see) → outcome ("Walk out sure") → tagline and sonic logo. It repeats the master idea (guidance on you, in your mirror) in the reveal, the contrast and the tagline, sells outcomes and identity, and uses loss aversion in the contrast.

## Narration script (voice "Imogen", ElevenLabs v4 via Higgsfield)

1. You do your makeup in a mirror. So why is all the help... somewhere else?
2. Pause. Rewind. Foundation on your fingers.
3. And colours that look perfect in the bathroom look different the second you leave.
4. Meet Selika. The mirror that guides you.
5. Step by step, drawn right onto your own reflection. Hands-free. Just ask.
6. Then see your look in the light you're heading into. Office. Restaurant. Evening.
7. A lit mirror gives you light. A phone gives you another screen. Selika guides you, right on the mirror you already own.
8. And for builders, Selika Dev opens up the same glass. Your modules. Your models. Your rules.
9. Private by design, with a camera shutter you can actually see.
10. So stop guessing, and walk out sure.
11. Selika. Guided on you.

Auditioned voices (in `gen/vo/`): imogen (chosen), sienna, maya, nora, skye. The narrator says "Selika" the way ElevenLabs reads it; a speech-to-text check hears it as "Celica", so if the pronunciation matters, re-record that word or the lines with a phonetic spelling.

## Timing (112 BPM, D major; beat 0.536 s, bar 2.143 s, 30 bars)

| Scene | Starts (s) | Line |
| --- | --- | --- |
| Hook | 0 (voice 1.07) | 1 |
| Pain | 6.35 | 2 |
| Light problem | 10.51 | 3 |
| Build to the drop | 15.20 | (chime at 16.34) |
| Reveal (the drop) | 17.14 | 4 |
| Step-by-step demo | 20.21 | 5 |
| Mirror and light presets | 21.36 to 32.98 | 6 |
| Contrast | 32.98 | 7 |
| Selika Dev | 41.45 | 8 |
| Privacy | 49.51 | 9 |
| Outcome | 53.85 | 10 |
| End card | 57.74 (tagline 57.86, chime 59.98) | 11 |

Every narration line starts on the beat grid. Motion uses the brand springs (170/14 default, 260/13 pop, 120/17 soft, 140/11 heavy) and hits beats and the drop; text and objects react to the music's level and bass, frame by frame.

## Score and sound design

Original, written in code (Python, numpy and Spotify's pedalboard; `build/score.py`), so there are no licensing questions. Glassy supersaw pads, a plucked arpeggio, a soft punchy kit, sub bass, risers and whooshes into the drop, an impact under the reveal, glass ticks for guides and checks, a soft click for selections, a mechanical double click for the camera shutter and a tape stop before the outro. The sonic logo is a three-note glass chime, F#5, A5, D6 ("se-li-ka"), placed before the drop and after the last word so it never masks the voice. The music ducks under the narration (sidechain) and the mix is normalised to -14 LUFS (the delivered file measures about -15 LUFS after AAC encoding). Stems: `build/music_stem.wav`, `build/vo_placed.wav`, final `build/mix.wav`.

## AI-generated assets (Higgsfield)

- Stills (gpt_image_2_5): hook frame `shotA2.png` (job 0b4c3a34; the first try `shotA.png` showed a real brand logo and is not used), concept mirror `shotC.png` (529658e1), outcome `shotD.png` (95866a78), chrome mark `chrome.png` (62cb7f7b).
- Clips (Kling 3.0, 5 s, silent, 7.5 credits each): hook, mirror, outcome, chrome.
- Narration: `full.mp3` (job 0caa4799), word timings in `words.json`.
- Credits: 236.07 before this work, 190.67 after (45.40 used, including the brand imagery).

## Files

- Videos: `selika-showreel-16x9.mp4` and `selika-showreel-9x16.mp4` (high quality, CRF 19), plus the web encodes in the site (`public/visuals/selika-film-16x9.mp4`, `selika-film-9x16.mp4`) with posters and captions (`selika-film.vtt`).
- Project: `Projects/Selika Site/selika-showreel/` holds the composition (`src/template.html`, `src/prep.py`), the build scripts (`build/plan.py`, `build/score.py`), the generated assets, stems and voice auditions.

## Re-render

1. `npm i hyperframes@0.8.157` in the project folder; Chrome or Chromium on the path (`HYPERFRAMES_BROWSER_PATH`).
2. `python3 build/plan.py` (narration on the beat) then `python3 build/score.py` (music, mix, events), then `python3 src/prep.py` (builds `comp-land` and `comp-port`).
3. In each comp folder: `npx hyperframes lint`, then `npx hyperframes render -o out.mp4 -q delivery`. On a 2-core cloud machine 16:9 took about 23 minutes.
4. To swap the voice: generate the eleven lines with the new voice into `gen/vo/full.mp3`, transcribe for `words.json`, rerun steps 2 and 3. To swap the music: replace `music_stem.wav` and keep the drop at 17.14 s.
