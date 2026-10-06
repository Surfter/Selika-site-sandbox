/* The site's one gradient: a slow, grainy field of out-of-focus light in the
   product's colours, with a stream of light anchored to the page that runs
   from under the hero mirror down through every section. GLSL ES 1.0 so it
   runs on every WebGL device. Noise: Ashima Arts / Ian McEwan simplex (MIT). */

export const BG_VERT = /* glsl */ `
attribute vec2 aPos;
varying vec2 vUv;
void main() { vUv = aPos * 0.5 + 0.5; gl_Position = vec4(aPos, 0.0, 1.0); }
`;

export const BG_FRAG = /* glsl */ `
precision highp float;
varying vec2 vUv;
uniform vec2 uRes;
uniform float uTime;
uniform vec2 uMouse;      // 0..1, y up, smoothed
uniform vec2 uMouseV;     // viewport units / s
uniform float uScroll;    // scrollY in viewport heights
uniform float uScrollV;   // viewport heights / s
uniform float uWorld;     // 0 Beauty, 1 Dev
uniform float uHero;      // 0..1 dive through the hero mirror
uniform float uAspect;    // width / height
uniform float uOct;       // noise octaves (quality)
uniform float uStreamN;   // filaments in the stream (quality)
uniform vec2 uSec[16];    // x: section top (vh units from page top), y: side (-1 left, 0 centre, 1 right)
uniform float uSecN;

vec3 permute(vec3 x) { return mod(((x * 34.0) + 1.0) * x, 289.0); }
float snoise(vec2 v) {
  const vec4 C = vec4(0.211324865405187, 0.366025403784439, -0.577350269189626, 0.024390243902439);
  vec2 i = floor(v + dot(v, C.yy));
  vec2 x0 = v - i + dot(i, C.xx);
  vec2 i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
  vec4 x12 = x0.xyxy + C.xxzz;
  x12.xy -= i1;
  i = mod(i, 289.0);
  vec3 p = permute(permute(i.y + vec3(0.0, i1.y, 1.0)) + i.x + vec3(0.0, i1.x, 1.0));
  vec3 m = max(0.5 - vec3(dot(x0, x0), dot(x12.xy, x12.xy), dot(x12.zw, x12.zw)), 0.0);
  m = m * m; m = m * m;
  vec3 x = 2.0 * fract(p * C.www) - 1.0;
  vec3 h = abs(x) - 0.5;
  vec3 ox = floor(x + 0.5);
  vec3 a0 = x - ox;
  m *= 1.79284291400159 - 0.85373472095314 * (a0 * a0 + h * h);
  vec3 g;
  g.x = a0.x * x0.x + h.x * x0.y;
  g.yz = a0.yz * x12.xz + h.yz * x12.yw;
  return 130.0 * dot(m, g);
}
float fbm(vec2 p) {
  float s = 0.0, a = 0.5;
  for (int i = 0; i < 5; i++) {
    if (float(i) >= uOct) break;
    s += a * snoise(p);
    p = p * 2.03 + vec2(17.1, 9.2);
    a *= 0.5;
  }
  return s;
}

// two worlds, five lights each: base, key, second, highlight, deep, contrast
vec3 base() { return mix(vec3(0.020, 0.016, 0.046), vec3(0.008, 0.020, 0.052), uWorld); }
vec3 light(int i) {
  if (i == 0) return mix(vec3(0.545, 0.486, 1.000), vec3(0.302, 0.553, 1.000), uWorld); // violet  | azure
  if (i == 1) return mix(vec3(0.690, 0.486, 1.000), vec3(0.557, 0.773, 1.000), uWorld); // orchid  | sky
  if (i == 2) return mix(vec3(0.900, 0.860, 1.000), vec3(0.860, 0.930, 1.000), uWorld); // lilac   | ice
  if (i == 3) return mix(vec3(0.200, 0.120, 0.520), vec3(0.050, 0.160, 0.470), uWorld); // indigo  | navy
  return mix(vec3(0.302, 0.553, 1.000), vec3(0.545, 0.486, 1.000), uWorld);              // azure   | violet
}

float hash(vec2 p) { return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453); }

// the stream's centre line, in screen x (0..1), at a page height y (vh units)
float streamX(float y) {
  float side0 = 0.0, side1 = 0.0, y1 = 1e5;
  for (int k = 0; k < 16; k++) {
    if (float(k) >= uSecN) break;
    vec2 s = uSec[k];
    if (s.x <= y) { side0 = s.y; side1 = s.y; y1 = 1e5; }
    else if (y1 > 9e4) { y1 = s.x; side1 = s.y; }
  }
  float tr = smoothstep(y1 - 0.85, y1 + 0.05, y);
  float reach = mix(0.47, 0.41, smoothstep(0.7, 1.0, uAspect)); // phones: hug the screen edges, clear of the text
  float x = mix(0.5 + side0 * reach, 0.5 + side1 * reach, tr);
  x += 0.022 * sin(y * 2.7 + uTime * 0.35) + 0.010 * sin(y * 6.9 - uTime * 0.6);
  return x;
}

void main() {
  vec2 uv = vUv;
  float t = uTime;
  vec2 p = (uv - 0.5) * vec2(uAspect, 1.0);
  vec2 m = (uMouse - 0.5) * vec2(uAspect, 1.0);

  // ---------- the field ----------
  // calmer behind the reading sections, alive in the hero
  float heroZone = 1.0 - smoothstep(0.55, 1.5, uScroll);
  float drift = t * (1.0 + min(abs(uScrollV), 3.0) * 0.6);
  vec2 q = p * 0.55 + vec2(0.0, uScroll * 0.12);
  vec2 w1 = vec2(fbm(q + vec2(drift * 0.018, -drift * 0.014)), fbm(q + vec2(4.7, 1.3) - drift * 0.016));
  // the cursor stirs the field: a soft swirl that strengthens when the pointer moves fast
  vec2 dm = p - m;
  float md2 = dot(dm, dm);
  float stir = exp(-md2 * 4.0) * (0.45 + min(length(uMouseV), 2.5) * 0.8);
  w1 += vec2(-dm.y, dm.x) * stir * 0.7;
  float warp = mix(0.9, 1.6, heroZone);   // smoother, calmer flow behind the reading sections
  vec2 w2 = vec2(snoise(q * 0.9 + warp * w1 + vec2(1.7, 9.2) + drift * 0.010), snoise(q * 0.9 + warp * w1 + vec2(8.3, 2.8) - drift * 0.012));
  float n = snoise(q * 0.7 + mix(1.0, 1.8, heroZone) * w2) * 0.5 + 0.5;

  vec3 col = base();
  // the lights gather behind the product in the hero, then drift free further down
  vec2 focus = vec2(0.13 * uAspect, 0.03) * heroZone;
  float spread = mix(0.62, 0.36, heroZone);
  for (int i = 0; i < 5; i++) {
    float fi = float(i);
    vec2 c = focus + vec2(sin(t * 0.045 * (1.0 + fi * 0.31) + fi * 2.1) * spread * uAspect * 0.7,
                          cos(t * 0.039 * (1.0 + fi * 0.27) + fi * 1.7) * spread * 0.75 - fi * 0.03);
    c = mix(c, m, 0.06 + 0.05 * mod(fi, 2.0));          // lean toward the cursor
    float r = 0.34 + 0.12 * sin(fi * 1.3 + t * 0.06);
    vec2 d = p + w2 * 0.22 - c;
    float g = exp(-dot(d, d) / (r * r));
    float amp = (i == 2) ? 0.32 : (i == 3) ? 0.8 : 0.5;
    col += light(i) * g * amp;
  }
  col *= mix(0.88, 0.78, heroZone) + mix(0.18, 0.34, heroZone) * n;
  // a lit patch where the cursor is, like a lamp moved behind frosted glass
  col += light(1) * exp(-md2 * 8.0) * 0.12;
  // keep the copy side of the hero dark enough to read
  col *= mix(1.0, 0.42 + 0.58 * smoothstep(0.02, 0.62, uv.x), heroZone);
  col *= mix(0.6, 1.0, heroZone);

  // ---------- the stream of light ----------
  float yPage = uScroll + (1.0 - uv.y);
  float emerge = smoothstep(0.78, 1.15, yPage);
  if (emerge > 0.001 && uStreamN > 0.5) {
    float cx = streamX(yPage);
    float px = 1.0 / uRes.x;
    vec3 sc = vec3(0.0);
    for (int j = 0; j < 7; j++) {
      if (float(j) >= uStreamN) break;
      float fj = float(j) - (uStreamN - 1.0) * 0.5;
      float off = fj * (0.0075 + 0.004 * sin(yPage * 2.3 + float(j) * 1.7 + t * 0.4));
      float dx = (uv.x - (cx + off)) * uAspect;
      float core = exp(-dx * dx / (0.0000035 + px * px * 1.4));
      float glow = exp(-dx * dx / 0.0016) * 0.11;
      float pulse = fract(yPage * 0.32 - t * 0.075 + float(j) * 0.137);
      float travel = smoothstep(0.0, 0.03, pulse) * exp(-pulse * 6.0) * 1.6 + 0.35;
      sc += mix(light(1), vec3(1.0), core * 0.6) * (core * 0.55 + glow) * travel;
    }
    // quieter where it crosses the reading column, brighter at the margins
    float margin = 0.45 + 0.55 * smoothstep(0.12, 0.36, abs(uv.x - 0.5));
    col += sc * emerge * 0.85 * margin;
  }

  // ---------- the dive through the hero mirror ----------
  float flash = smoothstep(0.55, 0.86, uHero) * (1.0 - smoothstep(0.86, 1.0, uHero));
  col += mix(light(2), vec3(1.0), 0.4) * exp(-dot(p, p) * (2.5 - flash * 1.8)) * flash * 0.9;

  // tone, vignette, grain
  col = 1.0 - exp(-col * 1.25);
  col *= 1.0 - 0.38 * smoothstep(0.45, 1.25, length(p * vec2(0.85, 1.0)));
  float gr = hash(gl_FragCoord.xy + fract(t * 7.0) * 113.0) - 0.5;
  col += gr * 0.045;
  gl_FragColor = vec4(max(col, 0.0), 1.0);
}
`;
