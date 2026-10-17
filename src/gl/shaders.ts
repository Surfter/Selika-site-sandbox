/* Shaders for the hero scene. Colours are designed in display space, so
   these materials skip three's tone mapping and colour conversion. */

export const GLASS_VERT = /* glsl */ `
varying vec2 vUv;
void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }
`;

export const GLASS_FRAG = /* glsl */ `
varying vec2 vUv;
uniform sampler2D uHud0;
uniform sampler2D uHud1;
uniform float uWhich;
uniform float uSmear;
uniform float uTime;
uniform float uReveal;
uniform vec2 uMouse;
uniform vec3 uC1;
uniform vec3 uC2;
vec4 hudAt(vec2 uv) { return mix(texture2D(uHud0, uv), texture2D(uHud1, uv), uWhich); }
void main() {
  vec2 uv = vUv;
  vec2 rp = uv - 0.5 + uMouse * vec2(-0.07, -0.05);
  vec3 col = vec3(0.020, 0.022, 0.034);
  vec2 a = rp - vec2(-0.30, 0.30), b = rp - vec2(0.28, -0.22);
  col += uC1 * 0.24 * exp(-dot(a, a) * 7.0);
  col += uC2 * 0.15 * exp(-dot(b, b) * 6.0);
  col += vec3(0.055, 0.06, 0.08) * (1.0 - uv.y) * 0.45;
  // a sheen that slides as the mirror turns toward the cursor
  float d = (uv.x * 0.78 + uv.y * 0.62) - 0.74 - uMouse.x * 0.24 + uMouse.y * 0.08;
  col += vec3(0.95, 0.97, 1.0) * (exp(-d * d * 260.0) * 0.15 + exp(-d * d * 14.0) * 0.045);
  // the HUD, smeared while the mirror spins
  vec4 h = hudAt(uv);
  if (uSmear > 0.01) {
    vec2 o = vec2(0.03 * uSmear, 0.0);
    h = h * 0.34 + hudAt(uv + o) * 0.22 + hudAt(uv - o) * 0.22 + hudAt(uv + o * 2.0) * 0.11 + hudAt(uv - o * 2.0) * 0.11;
  }
  float scan = exp(-pow((uv.y - (1.0 - fract(uTime * 0.07))) * 22.0, 2.0));
  float rv = 1.0 - smoothstep(uReveal * 1.25 - 0.2, uReveal * 1.25, 1.0 - uv.y);
  col += h.rgb * h.a * rv * (0.94 + 0.06 * sin(uTime * 1.7)) * (1.0 + scan * 0.45);
  col += uC2 * scan * 0.05 * rv;
  // the edge of the glass: slightly darker, with a lit bevel
  vec2 e = min(uv, 1.0 - uv);
  float edge = min(e.x * 1.4, e.y);
  col *= 0.82 + 0.18 * smoothstep(0.0, 0.06, edge);
  col += vec3(1.0) * 0.07 * (1.0 - smoothstep(0.0, 0.01, edge));
  gl_FragColor = vec4(col, 1.0);
}
`;

export const HALO_FRAG = /* glsl */ `
varying vec2 vUv;
uniform vec3 uColor;
uniform float uStrength;
uniform vec2 uHalf;  // mirror half-size in the halo plane's UV units
uniform float uRadius;
float sdRound(vec2 p, vec2 b, float r) { vec2 q = abs(p) - b + r; return length(max(q, 0.0)) + min(max(q.x, q.y), 0.0) - r; }
void main() {
  vec2 p = vUv - 0.5;
  float d = max(sdRound(p, uHalf, uRadius), 0.0);
  float g = exp(-d * 9.0) * 0.55 + exp(-d * 26.0) * 0.6;
  gl_FragColor = vec4(uColor * g * uStrength, 1.0);
}
`;

export const ORB_VERT = /* glsl */ `
varying vec3 vN;
varying vec3 vV;
void main() {
  vec4 mv = modelViewMatrix * vec4(position, 1.0);
  vN = normalize(normalMatrix * normal);
  vV = normalize(-mv.xyz);
  gl_Position = projectionMatrix * mv;
}
`;

export const ORB_FRAG = /* glsl */ `
varying vec3 vN;
varying vec3 vV;
uniform vec3 uColor;
uniform vec3 uDeep;
uniform float uHover;
uniform float uAlpha;
void main() {
  vec3 n = normalize(vN), v = normalize(vV);
  float ndv = clamp(dot(n, v), 0.0, 1.0);
  float fres = pow(1.0 - ndv, 3.0);
  // clear through the middle, a faint tint, a thin bright rim that warms toward white
  vec3 body = mix(uDeep, uColor, 0.55) * 0.09 * (0.5 + 0.5 * ndv);
  vec3 rim = mix(uColor, vec3(1.0), 0.3 + 0.5 * fres) * fres * (1.2 + uHover * 0.9);
  // one sharp highlight up and to the left, a soft bounce opposite, a caustic along the lower edge
  vec3 L = normalize(vec3(-0.5, 0.72, 0.6));
  float spec = pow(max(dot(n, normalize(L + v)), 0.0), 150.0);
  float spec2 = pow(max(dot(n, normalize(vec3(0.55, -0.6, 0.6) + v)), 0.0), 26.0) * 0.2;
  float caustic = smoothstep(0.45, 0.85, 1.0 - ndv) * smoothstep(0.15, -0.65, n.y) * 0.3;
  vec3 col = body + rim + vec3(1.0) * (spec * 1.25 + spec2) + mix(uColor, vec3(1.0), 0.4) * caustic;
  float a = (0.06 + fres * 0.82 + spec * 0.9 + spec2 * 0.5 + caustic * 0.5 + uHover * 0.06) * uAlpha;
  gl_FragColor = vec4(col, min(a, 1.0));
}
`;

export const ICON_VERT = /* glsl */ `
varying vec2 vUv;
void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }
`;

export const ICON_FRAG = /* glsl */ `
varying vec2 vUv;
uniform sampler2D uAtlas;
uniform vec4 uCell;   // x, y offset and w, h scale in atlas UV
uniform vec3 uColor;
uniform float uAlpha;
void main() {
  vec4 t = texture2D(uAtlas, uCell.xy + vUv * uCell.zw);
  gl_FragColor = vec4(mix(uColor, vec3(1.0), 0.6) * t.a * uAlpha, t.a * uAlpha);
}
`;

export const SPARK_VERT = /* glsl */ `
attribute float aLife;
attribute float aSize;
varying float vLife;
void main() {
  vLife = aLife;
  vec4 mv = modelViewMatrix * vec4(position, 1.0);
  gl_PointSize = aSize * (1.0 - aLife) * (300.0 / -mv.z);
  gl_Position = projectionMatrix * mv;
}
`;

export const SPARK_FRAG = /* glsl */ `
varying float vLife;
uniform vec3 uColor;
void main() {
  vec2 c = gl_PointCoord - 0.5;
  float d = length(c);
  float a = smoothstep(0.5, 0.0, d) * (1.0 - vLife);
  gl_FragColor = vec4(mix(uColor, vec3(1.0), 0.5) * a, a);
}
`;

/* a Dev module pane: its canvas, glowing, fading with the product and the transition */
export const PANE_VERT = /* glsl */ `
varying vec2 vUv;
void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }
`;
export const PANE_FRAG = /* glsl */ `
varying vec2 vUv;
uniform sampler2D uTex;
uniform float uAlpha;
uniform float uTime;
uniform float uSeed;
void main() {
  vec4 t = texture2D(uTex, vUv);
  float scan = 0.9 + 0.1 * sin((vUv.y * 40.0) - uTime * 2.0 + uSeed);
  float a = t.a * uAlpha;
  gl_FragColor = vec4(t.rgb * a * scan * 1.15, a);
}
`;

/* The Beauty hologram: a looping video on the glass, placed by uMap (glass UV of the video's left
   edge and top, then its width and height), added onto the glass with its black crushed out. */
export const HOLOVID_FRAG = /* glsl */ `
varying vec2 vUv;
uniform sampler2D uVid;
uniform vec4 uMap;
uniform float uAlpha;
uniform float uTime;
uniform float uReveal;
void main() {
  vec2 v = vec2((vUv.x - uMap.x) / uMap.z, (uMap.y - vUv.y) / uMap.w);
  if (v.x < 0.0 || v.x > 1.0 || v.y < 0.0 || v.y > 1.0) discard;
  vec3 c = texture2D(uVid, vec2(v.x, 1.0 - v.y)).rgb;
  c = max(c - 0.035, 0.0) * 1.12;
  float scan = exp(-pow((v.y - (fract(uTime * 0.11) * 1.3 - 0.15)) * 24.0, 2.0));
  float flick = 0.97 + 0.03 * sin(uTime * 21.0) * sin(uTime * 3.3);
  float rv = 1.0 - smoothstep(uReveal * 1.25 - 0.2, uReveal * 1.25, v.y);
  gl_FragColor = vec4(c * (1.0 + scan * 0.55) * flick * uAlpha * rv, 1.0);
}
`;

/* The same face as light points, for the dive: they sit exactly on the video's bright pixels,
   take over as it fades, and fly out toward the viewer. */
export const BURST_VERT = /* glsl */ `
attribute vec3 aColor;
attribute float aRand;
uniform float uBurst;
uniform float uPx;
uniform float uSize;
uniform float uTime;
varying vec3 vColor;
varying float vA;
void main() {
  vec4 mv = modelViewMatrix * vec4(position, 1.0);
  vec3 c0 = (modelViewMatrix * vec4(0.0, 0.0, 0.0, 1.0)).xyz;
  vec3 rel = mv.xyz - c0;
  vec3 jit = vec3(aRand, fract(aRand * 7.13), fract(aRand * 3.71)) - 0.5;
  vec3 dir = normalize(vec3(rel.xy * 3.2, 1.0) + jit * 0.8);
  float b = uBurst * uBurst;
  mv.xyz += dir * b * (-c0.z) * (0.5 + aRand * 0.8);
  gl_PointSize = uSize * (1.0 + uBurst * 2.4) * uPx / max(0.2, -mv.z);
  gl_Position = projectionMatrix * mv;
  vColor = aColor;
  vA = (0.82 + 0.18 * sin(uTime * (1.5 + aRand * 2.0) + aRand * 30.0)) * (1.0 - smoothstep(0.55, 1.0, uBurst));
}
`;
export const BURST_FRAG = /* glsl */ `
uniform float uAlpha;
varying vec3 vColor;
varying float vA;
void main() {
  float d = length(gl_PointCoord - 0.5);
  float disc = smoothstep(0.5, 0.0, d);
  float a = disc * disc * vA * uAlpha;
  gl_FragColor = vec4(vColor * a * 1.5, a);
}
`;

/* The Beauty hologram's live layer, added over the glass in HUD pixels (y down): the face analysis
   (the landmark mesh, points and feature outlines baked into uScan, lit by a scanning line and twinkling),
   focus brackets that glide to each step's region with its label, the step card's text sliding and wiping
   between steps, its progress filling and the voice meter moving while Selika speaks. */
export const BEAUTYFX_FRAG = /* glsl */ `
varying vec2 vUv;
uniform sampler2D uScan;
uniform sampler2D uAtlas;
uniform float uAlpha;
uniform float uTime;
uniform float uT;          // 0..1 eased progress of the change from step A to step B
uniform float uFill;       // 0..1 through the current step
uniform float uSpeak;      // 0..1 how much the voice meter moves
uniform float uStepA;
uniform float uStepB;
uniform vec4 uFocus;       // focus box, HUD px (x0, y0, x1, y1)
uniform vec4 uSweepBox;    // where the scan line runs
uniform float uSweep;      // 0..1 while it runs, outside that it is off
uniform vec2 uHud;
uniform vec4 uCard;        // the step text box (x, y, w, h), HUD px
uniform vec4 uAtlasSz;     // atlas w, h, label row y, label row h
uniform float uRowH;
uniform float uCardY;
uniform vec3 uA;           // lilac
uniform vec3 uB;           // the analysis ink (deep violet)
uniform vec2 uLabelW;      // label widths, step A and B

float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
float sdSeg(vec2 p, vec2 a, vec2 b) { vec2 pa = p - a, ba = b - a; float h = clamp(dot(pa, ba) / dot(ba, ba), 0.0, 1.0); return length(pa - ba * h); }
float sdBox(vec2 p, vec2 c, vec2 hs, float r) { vec2 q = abs(p - c) - hs + r; return length(max(q, 0.0)) + min(max(q.x, q.y), 0.0) - r; }
vec4 over(vec4 dst, vec3 c, float a) { return vec4(c * a + dst.rgb * (1.0 - a), a + dst.a * (1.0 - a)); }
vec4 atlas(vec2 a) {
  if (a.x < 0.0 || a.y < 0.0 || a.x > uAtlasSz.x || a.y > uAtlasSz.y) return vec4(0.0);
  return texture2D(uAtlas, vec2(a.x / uAtlasSz.x, 1.0 - a.y / uAtlasSz.y));
}
float meterH(float i) {
  if (i < 0.5) return 14.0; if (i < 1.5) return 30.0; if (i < 2.5) return 52.0; if (i < 3.5) return 38.0;
  if (i < 4.5) return 58.0; if (i < 5.5) return 26.0; return 16.0;
}
void main() {
  vec2 P = vec2(vUv.x * uHud.x, (1.0 - vUv.y) * uHud.y);
  vec3 col = vec3(0.0);

  // ---- the face analysis: drawn "over" in a deep ink violet (it darkens the bright hologram, so it reads on
  // white), with a light glow added so it still shows where the face is dark ----
  vec4 ov = vec4(0.0);   // premultiplied, composited over the glass
  vec3 s = texture2D(uScan, vUv).rgb;
  vec2 fc = (uFocus.xy + uFocus.zw) * 0.5, fh = (uFocus.zw - uFocus.xy) * 0.5;
  float foc = 1.0 - smoothstep(-6.0, 22.0, sdBox(P, fc, fh, 14.0));
  // the scan runs inside the box only, top edge to bottom edge, after the box has arrived
  float on = step(0.0, uSweep) * step(uSweep, 1.0);
  float sy = mix(uSweepBox.y, uSweepBox.w, clamp(uSweep, 0.0, 1.0));
  float d = P.y - sy;
  float box = 1.0 - smoothstep(-2.0, 2.0, sdBox(P, (uSweepBox.xy + uSweepBox.zw) * 0.5, (uSweepBox.zw - uSweepBox.xy) * 0.5, 0.0));
  float inB = box * on;
  float front = exp(-d * d / 420.0) * inB;
  // what the line has passed stays lit, then eases down after it finishes (no sudden drop)
  float after = step(0.0, uSweep) * exp(-max(0.0, uSweep - 1.0) * 1.4);
  float trail = smoothstep(4.0, -8.0, d) * (0.35 + 0.65 * exp(d / 140.0)) * box * after;
  float tw = hash(floor(P / 5.0));
  float twinkle = pow(0.5 + 0.5 * sin(uTime * (1.1 + tw * 2.2) + tw * 40.0), 10.0);
  float mA = s.r * clamp(0.07 + 0.26 * foc + front * 0.55 + trail * 0.22, 0.0, 0.8);
  float dA = s.g * clamp(0.12 + 0.45 * foc + 0.55 * twinkle + front, 0.0, 1.0);
  float cA = s.b * clamp(0.1 + 0.55 * foc + 0.6 * front, 0.0, 0.95);
  vec3 ink = uB;
  ov = over(ov, ink, mA * 0.85);
  ov = over(ov, mix(ink, vec3(0.05, 0.02, 0.2), 0.3), cA * 0.9);
  ov = over(ov, ink * 0.8, dA);
  col += uA * (mA * 0.25 + dA * 0.35 + cA * 0.2);
  // the scan line: an ink band with a bright core
  float band = exp(-d * d / 40.0) * inB;
  ov = over(ov, ink, band * 0.32);
  col += vec3(0.8, 0.9, 1.0) * exp(-d * d / 1.6) * inB * 0.4;

  // ---- the focus brackets, breathing, with the region's label on a dark pill above ----
  vec2 bh = fh + 3.0 * sin(uTime * 2.2);
  vec2 l = bh - abs(P - fc);
  float L = min(62.0, min(bh.x, bh.y) * 0.55);
  float bd = min(sdSeg(l, vec2(0.0), vec2(L, 0.0)), sdSeg(l, vec2(0.0), vec2(0.0, L)));
  float br = smoothstep(3.6, 1.8, bd);
  ov = over(ov, ink, br * 0.55);
  col += uA * (smoothstep(1.6, 0.5, bd) * 0.35 + exp(-bd * bd / 40.0) * 0.08);
  vec2 lo = vec2(uFocus.x - (bh.x - fh.x), uFocus.y - (bh.y - fh.y) - uAtlasSz.w - 10.0);
  vec2 lp = P - lo;
  float lw = mix(uLabelW.x, uLabelW.y, smoothstep(0.3, 0.7, uT)) + 22.0;
  float pill = 1.0 - smoothstep(-1.0, 1.0, sdBox(P, lo + vec2(lw * 0.5 - 8.0, 27.0), vec2(lw * 0.5, 15.0), 15.0));
  ov = over(ov, vec3(0.06, 0.03, 0.14), pill * 0.5);
  if (lp.y >= 0.0 && lp.y <= uAtlasSz.w && lp.x >= 0.0 && lp.x <= 420.0) {
    vec4 la = atlas(vec2(lp.x, uAtlasSz.z + uStepA * uAtlasSz.w + lp.y));
    vec4 lb = atlas(vec2(lp.x, uAtlasSz.z + uStepB * uAtlasSz.w + lp.y));
    col += (la.rgb * la.a * (1.0 - smoothstep(0.0, 0.4, uT)) + lb.rgb * lb.a * smoothstep(0.5, 1.0, uT)) * 0.72;
  }

  // ---- the step card: the old step slides up and away, the new one rises in behind a wipe ----
  vec2 lc = P - uCard.xy;
  if (lc.x >= 0.0 && lc.x <= uCard.z && lc.y >= 0.0 && lc.y <= uCard.w) {
    float ya = lc.y + 28.0 * uT;
    if (ya <= uRowH) { vec4 a = atlas(vec2(lc.x, uStepA * uRowH + ya)); col += a.rgb * a.a * (1.0 - smoothstep(0.0, 0.55, uT)); }
    float yb = lc.y - 28.0 * (1.0 - uT);
    if (yb >= 0.0) {
      float wipe = 1.0 - smoothstep(uT * (uCard.z + 140.0) - 140.0, uT * (uCard.z + 140.0), lc.x);
      vec4 b = atlas(vec2(lc.x, uStepB * uRowH + yb)); col += b.rgb * b.a * wipe * smoothstep(0.15, 0.5, uT);
    }
  }
  // progress: done steps full, the current one filling
  float pi = clamp(floor((P.x - 118.0) / 82.0), 0.0, 4.0);
  vec2 pc = vec2(118.0 + pi * 82.0 + 35.0, uCardY + 214.0);
  float pd = sdBox(P, pc, vec2(35.0, 4.0), 4.0);
  if (pd < 2.0) {
    float fx = (P.x - (pc.x - 35.0)) / 70.0;
    float filled = pi < uStepB - 0.5 ? 1.0 : (pi < uStepB + 0.5 ? step(fx, uFill) : 0.0);
    float a = smoothstep(1.0, -0.5, pd);
    col += mix(vec3(0.18), uA, filled) * a;
    if (pi > uStepB - 0.5 && pi < uStepB + 0.5) col += uA * a * exp(-pow((fx - uFill) * 14.0, 2.0)) * 0.8;
  }
  // the voice meter
  float mx = uHud.x - 150.0 - 36.0, my = uCardY + 80.0;
  float bi = floor((P.x - mx) / 11.0);
  if (bi >= 0.0 && bi <= 6.0) {
    float lv = 0.22 + 0.78 * uSpeak * (0.4 + 0.6 * abs(sin(uTime * (6.0 + bi * 1.9) + bi * 1.3))) * (0.65 + 0.35 * sin(uTime * 1.7 + bi * 0.8));
    float h = max(6.0, meterH(bi) * lv);
    float md = sdBox(P, vec2(mx + bi * 11.0 + 3.0, my), vec2(3.0, h * 0.5), 3.0);
    col += uA * smoothstep(1.0, -0.5, md) * (0.75 + 0.25 * uSpeak);
  }
  // the over part darkens; the added part (alpha 0) brightens
  gl_FragColor = vec4((ov.rgb + col) * uAlpha, ov.a * uAlpha);
}
`;
