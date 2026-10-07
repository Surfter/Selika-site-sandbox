/* The site's one gradient: a slow, grainy field of out-of-focus light in the
   product's colours, and an aurora that zigzags down the length of the page:
   one continuous curtain whose bright base runs from one side of the page to
   the other and back, turning in the margins. The zigzag's size is worked out
   on the CPU from the viewport. Time is integrated on the CPU too, so nothing
   jumps when you scroll.
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
uniform vec4 uZig;        // the zigzag: first turn (page y, viewport heights), leg height (vh), left and right turn x (0..1)
uniform float uAurW;      // ray length scale (shorter on phones)
uniform vec2 uCss;        // viewport in CSS px

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

// crisp value noise for the aurora's rays
float h21(vec2 p) { p = fract(p * vec2(233.34, 851.73)); p += dot(p, p + 23.45); return fract(p.x * p.y); }
float vn(vec2 p) {
  vec2 i = floor(p), f = fract(p), u = f * f * (3.0 - 2.0 * f);
  return mix(mix(h21(i), h21(i + vec2(1.0, 0.0)), u.x), mix(h21(i + vec2(0.0, 1.0)), h21(i + vec2(1.0, 1.0)), u.x), u.y);
}
// One curtain of the aurora, as in the intro video: a bright base with fine vertical rays rising from
// it in clusters and folds, sky blue at the base turning violet at the tips. x runs across the screen
// (0..1, offset per curtain), qy is the pixel's height and yb the base's (CSS px, y down); lengths
// are in design px on a 1080-high frame, k converts them.
vec3 curtain(float x, float qy, float yb, float k, float t, float hgt, float rpx, float sd, float gain) {
  float th = t * 0.0982;
  float d = (yb - qy) / k;
  if (d < -160.0 || d > hgt * 2.6) return vec3(0.0);
  float sway = 2.6 * sin(th + sd) + 1.2 * sin(2.0 * th + sd * 0.7);
  float xr = x * (uCss.x / rpx) + sway + 0.0035 * max(d, 0.0) * sin(2.0 * th + x * 5.0 + sd);
  float ta = t * 0.25;
  float r = 0.62 * vn(vec2(xr, ta + sd * 7.0)) + 0.38 * vn(vec2(xr * 2.7 + 13.0, ta * 2.0 + sd * 3.0));
  r = r * r * 1.5;
  float cl = smoothstep(0.15, 0.95, vn(vec2(x * 26.0 + sway * 0.6 + sd * 9.0, ta + sd * 4.0)));
  float m = smoothstep(0.18, 0.85, vn(vec2(x * 5.0 + sway * 0.12 + sd * 4.0, t * 0.125 + sd)));
  float H = hgt * (0.45 + 0.8 * vn(vec2(xr * 0.35 + 5.0, ta + sd * 2.0))) * (0.7 + 0.5 * cl);
  float dh = max(d, 0.0) / H;
  float up = exp(-dh * sqrt(dh + 0.05) * 1.1);
  float lo = exp(min(d, 0.0) / 15.0);
  float band = exp(-abs(d) / 13.0);
  float below = exp(-abs(d) / 70.0);
  float haze = exp(-abs(d - 0.45 * H) / (1.3 * H));
  float I = (up * (0.38 + 0.62 * r) * (0.45 + 0.55 * cl) + 0.75 * band * (0.45 + 0.55 * r)) * lo * m
          + (0.10 * below + 0.14 * haze) * (0.35 + 0.65 * m);
  I *= smoothstep(-160.0, -100.0, d) * (1.0 - smoothstep(hgt * 1.8, hgt * 2.6, d));   // no hard edge where it ends
  float hv = vn(vec2(x * 3.0 + sd * 2.0, t * 0.0625 + sd * 3.0));
  // Beauty: sky blue at the base to violet and orchid at the tips; Dev: ice to azure and sky
  vec3 c0 = mix(vec3(0.557, 0.773, 1.0), vec3(0.72, 0.9, 1.0), uWorld);
  vec3 c1 = mix(vec3(0.545, 0.486, 1.0), vec3(0.302, 0.553, 1.0), uWorld);
  vec3 b0 = mix(c0, mix(vec3(0.302, 0.553, 1.0), vec3(0.557, 0.773, 1.0), uWorld), 0.45 * hv);
  vec3 b1 = mix(c1, mix(vec3(0.690, 0.486, 1.0), vec3(0.45, 0.66, 1.0), uWorld), 0.5 * (1.0 - hv));
  return mix(b0, b1, clamp(d / (H * 0.9), 0.0, 1.0)) * I * gain;
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
  // The intro video's aurora, swinging down the page: its base runs across from one margin to the other
  // and back in smooth S-curves (a sine, so each turn is a rounded fold, seen edge-on as a curtain folds),
  // rays rising from it. The fainter layers behind sit higher in the middle of each run and close in to
  // the base at the turns, so the layers fold together and never cross. Faint stars between.
  float emerge = smoothstep(0.55, 1.25, uScroll) * uAur;
  if (emerge > 0.001) {
    vec2 q = vec2(uv.x, 1.0 - uv.y) * uCss;
    float k = uCss.y / 1080.0, kr = k * uAurW, th = t * 0.0982;
    float L = uZig.y * uCss.y, top = (uZig.x - uScroll) * uCss.y;   // one run's height and the first turn, CSS px
    float cx = 0.5 * (uZig.z + uZig.w), A = 0.5 * (uZig.w - uZig.z);  // the swing's centre and half-width
    float rel = (q.y - top) / L;
    float tE = acos(clamp((cx - uv.x) / A, -1.0, 1.0)) / 3.14159;      // how far along a left-to-right run this column is
    float edge = 1.0 - smoothstep(A - 0.012, A + 0.03, abs(uv.x - cx)); // nothing past the turns
    vec3 aur = vec3(0.0);
    for (int n = -1; n < 2; n++) {
      float j = floor(rel) + float(n);
      if (j < -0.5) continue;
      float tl = mix(tE, 1.0 - tE, mod(j, 2.0));   // runs alternate direction
      float s = sin(3.14159 * tl);                  // 0 at the turns, 1 mid-run
      float sd = 1.3 + j * 2.71;
      float wv = s * (60.0 * sin(uv.x * 4.3 + th + sd) + 33.0 * sin(uv.x * 9.7 - 2.0 * th + sd * 1.7) + 18.0 * sin(uv.x * 21.0 + 3.0 * th + sd * 2.9));
      float yb = top + (j + tl) * L + k * wv;
      float xs = uv.x + j * 0.37;
      aur += curtain(xs, q.y, yb, kr, t, 200.0, 12.8, sd, 1.05)
           + curtain(xs + 0.21, q.y, yb - 120.0 * kr * s, kr, t, 150.0, 10.1, sd + 2.8, 0.62)
           + curtain(xs + 0.53, q.y, yb - 230.0 * kr * s, kr, t, 115.0, 16.0, sd + 7.4, 0.34);
    }
    aur *= edge;
    float lum = dot(aur, vec3(0.3, 0.4, 0.3));
    aur = 1.0 - exp(-aur * 1.1);
    // faint stars that fade where the curtains are
    vec2 cell = floor(q / 26.0);
    float hs = h21(cell + 0.5);
    float star = 0.0;
    if (hs > 0.86) {
      vec2 sp = (cell + 0.2 + 0.6 * vec2(h21(cell + 3.1), h21(cell + 7.7))) * 26.0;
      vec2 dv = q - sp;
      float n = 2.0 + floor(h21(cell + 5.3) * 4.0);
      star = (0.35 + 0.65 * (hs - 0.86) / 0.14) * (0.55 + 0.45 * sin(t * 0.098 * n + 6.283 * h21(cell + 11.3))) * exp(-dot(dv, dv) / 2.2);
    }
    star *= 1.0 - smoothstep(0.08, 0.4, lum);
    // softer where it passes behind the reading column
    float column = 0.5 + 0.5 * smoothstep(0.08, 0.34, abs(uv.x - 0.5));
    col = col * (1.0 - 0.35 * emerge) + (aur * 0.9 * column + vec3(0.8, 0.88, 1.0) * star * 0.35) * emerge;
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
