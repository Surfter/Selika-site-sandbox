# QA scripts

Headless Chromium checks used while building v8. They need Playwright (`npm i -D playwright` or a global
install, plus a Chromium) and a running dev server (`npm run dev`) or preview (`npm run build && npm run preview`).

- `shoot.mjs`: screenshots of each section at a given viewport (desktop and `M=1` phone).
- `clipdiff.mjs`: proves the hero headline masks cut no glyphs (italic overhangs, descenders).

Headless runs use SwiftShader for WebGL (1 to 5 fps), so use them for layout and stills; check motion and
timing on a real laptop and phone. `?tier=low` forces the light rendering tier.
