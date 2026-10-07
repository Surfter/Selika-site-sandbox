/* The site's one gradient: a slow, grainy field of out-of-focus light in the
   product's colours, and an aurora that runs the length of the page. The
   aurora's path is worked out on the CPU from the sections (smoothed, so it is
   one continuous curve) and handed to the shader as 17 points down the screen.
   Time is integrated on the CPU too, so nothing jumps when you scroll.
   GLSL ES 1.0 so it runs on every WebGL device. Noise: Ashima Arts / Ian
   McEwan simplex (MIT). */

export const BG_VERT = /* glsl */ `
attribute vec2 aPos;
varying vec2 vUv;
void main() { vUv = aPos * 0.5 + 0.5; gl_Position = vec4(aPos, 0.0, 1.0); }
`;

export const BG_FRAG = /* glsl */ `
precision highp float;
varying vec2 vUv;
uniform vec2 uRes;
uniform float uTime;      // seconds, for grain only
uniform float uDrift;     // integrated motion time (calm, never jumps)
uniform vec2 uMouse;      // 0..1, y up, heavily smoothed
uniform float uScroll;    // scrollY in viewport heights (Lenis-smoothed)
uniform float uWorld;     // 0 Beauty, 1 Dev
uniform float uHero;      // 0..1 progress of the hero transition
uniform float uAspect;    // width / height
uniform float uOct;       // noise octaves (quality)
uniform float uAur;       // aurora strength (quality / reduced transparency)
uniform float uPath[17];  // aurora centre x (0..1) at 17 rows from the top of the screen to the bottom
uniform float uAurW;      // aurora width scale (narrower on phones)

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

// two worlds, five lights each
vec3 base() { return mix(vec3(0.020, 0.016, 0.046), vec3(0.008, 0.020, 0.052), uWorld); }
vec3 light(int i) {
  if (i == 0) return mix(vec3(0.545, 0.486, 1.000), vec3(0.302, 0.553, 1.000), uWorld); // violet  | azure
  if (i == 1) return mix(vec3(0.690, 0.486, 1.000), vec3(0.557, 0.773, 1.000), uWorld); // orchid  | sky
  if (i == 2) return mix(vec3(0.900, 0.860, 1.000), vec3(0.860, 0.930, 1.000), uWorld); // lilac   | ice
  if (i == 3) return mix(vec3(0.200, 0.120, 0.520), vec3(0.050, 0.160, 0.470), uWorld); // indigo  | navy
  return mix(vec3(0.302, 0.553, 1.000), vec3(0.545, 0.486, 1.000), uWorld);              // azure   | violet
}

float hash(vec2 p) { return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453); }

// the aurora's centre at a screen row (v: 0 top .. 1 bottom), Catmull-Rom through uPath
float pathAt(float v) {
  float f = clamp(v, 0.0, 1.0) * 16.0;
  float i = min(floor(f), 15.0);
  float fr = f - i;
  float a = 0.0, b = 0.0, c = 0.0, d = 0.0;
  for (int k = 0; k < 17; k++) {
    float fk = float(k);
    float val = uPath[k];
    if (fk == i - 1.0) a = val;
    if (fk == i) b = val;
    if (fk == i + 1.0) c = val;
    if (fk == i + 2.0) d = val;
  }
  if (i < 0.5) a = b;
  if (i > 14.5) d = c;
  float t2 = fr * fr, t3 = t2 * fr;
  return 0.5 * ((2.0 * b) + (-a + c) * fr + (2.0 * a - 5.0 * b + 4.0 * c - d) * t2 + (-a + 3.0 * b - 3.0 * c + d) * t3);
}

void main() {
  vec2 uv = vUv;
  float t = uDrift;
  vec2 p = (uv - 0.5) * vec2(uAspect, 1.0);
  vec2 m = (uMouse - 0.5) * vec2(uAspect, 1.0);

  // ---------- the field ----------
  float heroZone = 1.0 - smoothstep(0.55, 1.5, uScroll);
  vec2 q = p * 0.55 + vec2(0.0, uScroll * 0.10);
  vec2 w1 = vec2(fbm(q + vec2(t * 0.018, -t * 0.014)), fbm(q + vec2(4.7, 1.3) - t * 0.016));
  // the cursor leans on the field gently, like a hand near frosted glass
  vec2 dm = p - m;
  float md2 = dot(dm, dm);
  w1 += vec2(-dm.y, dm.x) * exp(-md2 * 3.0) * 0.16;
  float warp = mix(0.9, 1.5, heroZone);
  vec2 w2 = vec2(snoise(q * 0.9 + warp * w1 + vec2(1.7, 9.2) + t * 0.010), snoise(q * 0.9 + warp * w1 + vec2(8.3, 2.8) - t * 0.012));
  float n = snoise(q * 0.7 + mix(1.0, 1.7, heroZone) * w2) * 0.5 + 0.5;

  vec3 col = base();
  vec2 focus = vec2(0.13 * uAspect, 0.03) * heroZone;
  float spread = mix(0.62, 0.36, heroZone);
  for (int i = 0; i < 5; i++) {
    float fi = float(i);
    vec2 c = focus + vec2(sin(t * 0.045 * (1.0 + fi * 0.31) + fi * 2.1) * spread * uAspect * 0.7,
                          cos(t * 0.039 * (1.0 + fi * 0.27) + fi * 1.7) * spread * 0.75 - fi * 0.03);
    c = mix(c, m, 0.03 + 0.02 * mod(fi, 2.0));
    float r = 0.34 + 0.12 * sin(fi * 1.3 + t * 0.06);
    vec2 d = p + w2 * 0.22 - c;
    float g = exp(-dot(d, d) / (r * r));
    float amp = (i == 2) ? 0.32 : (i == 3) ? 0.8 : 0.5;
    col += light(i) * g * amp;
  }
  col *= mix(0.88, 0.78, heroZone) + mix(0.18, 0.34, heroZone) * n;
  col += light(1) * exp(-md2 * 7.0) * 0.07;
  col *= mix(1.0, 0.42 + 0.58 * smoothstep(0.02, 0.62, uv.x), heroZone);
  col *= mix(0.6, 1.0, heroZone);

  // ---------- the aurora ----------
  // A curtain of light hanging in the page margin: a soft bright edge on the outer side and
  // rays that reach inward and fade, folding gently along its length. Which way it faces is
  // blended by where it is (left margin, right margin, crossing), so it never flips or seams.
  float yPage = uScroll + (1.0 - uv.y);
  float emerge = smoothstep(0.85, 1.45, yPage) * uAur;
  if (emerge > 0.001) {
    float asp = max(uAspect, 0.5);
    float cx = pathAt(1.0 - uv.y);
    cx += (0.016 * snoise(vec2(yPage * 0.8, t * 0.03)) + 0.006 * snoise(vec2(yPage * 2.6, 4.0 + t * 0.045))) / asp;
    float wR = smoothstep(0.3, 0.7, cx);                 // 0 on the left margin, 1 on the right
    float d = (uv.x - cx) * uAspect;                      // across, in screen heights
    float breathe = snoise(vec2(yPage * 0.4, 7.3 + t * 0.025)) * 0.5 + 0.5;
    float W = mix(0.12, 0.22, breathe) * uAurW;            // how far the rays reach
    float E = 0.014 * uAurW;                               // the soft outer edge
    float inL = d, inR = -d;                               // distance inward, for a curtain on each side
    float pL = inL < 0.0 ? exp(-inL * inL / (E * E)) : exp(-inL / W);
    float pR = inR < 0.0 ? exp(-inR * inR / (E * E)) : exp(-inR / W);
    float prof = mix(pL, pR, wR);
    float inw = abs(d);                                    // colour and rays only depend on distance from the edge
    // rays: fine streaks reaching in from the edge, drifting slowly along it
    float r1 = snoise(vec2(yPage * 9.0 - t * 0.04, inw * 1.6 - t * 0.025)) * 0.5 + 0.5;
    float r2 = snoise(vec2(yPage * 23.0 + t * 0.03, inw * 3.2 + 3.0)) * 0.5 + 0.5;
    float rays = 0.42 + 0.8 * r1 * r1 + 0.28 * r2 * r2;
    // light travels along the curtain in slow pulses
    float pulse = 0.5 + 0.7 * (snoise(vec2(yPage * 0.45 - t * 0.06, 2.7)) * 0.5 + 0.5);
    // pale at the edge, violet in the body, azure where the rays thin out
    float k = inw / W;
    vec3 ac = mix(mix(light(2), vec3(1.0), 0.3), light(0), smoothstep(0.0, 0.45, k));
    ac = mix(ac, light(4), smoothstep(0.6, 1.7, k));
    ac = mix(ac, light(1), 0.25 * (snoise(vec2(yPage * 0.25, 11.0 + t * 0.02)) * 0.5 + 0.5));
    float sky = exp(-d * d / (W * W * 4.0)) * 0.09;       // the glow it casts around itself
    vec3 aur = ac * (prof * rays * pulse * 0.8 + sky);
    // softer where it passes behind the reading column
    aur *= 0.4 + 0.6 * smoothstep(0.12, 0.38, abs(uv.x - 0.5));
    col += aur * emerge;
  }

  // ---------- the hero transition: a soft bloom where the mirror is ----------
  float bloom = smoothstep(0.15, 0.55, uHero) * (1.0 - smoothstep(0.6, 0.95, uHero));
  vec2 mp = p - vec2(0.08 * uAspect * step(1.15, uAspect), 0.0);
  col += light(1) * exp(-dot(mp, mp) * 3.0) * bloom * 0.35;

  // tone, vignette, grain
  col = 1.0 - exp(-col * 1.25);
  col *= 1.0 - 0.38 * smoothstep(0.45, 1.25, length(p * vec2(0.85, 1.0)));
  float gr = hash(gl_FragCoord.xy + fract(uTime * 7.0) * 113.0) - 0.5;
  col += gr * 0.04;
  gl_FragColor = vec4(max(col, 0.0), 1.0);
}
`;
