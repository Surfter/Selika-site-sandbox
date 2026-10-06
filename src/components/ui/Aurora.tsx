import { useEffect, useRef } from "react";

/* ============================================================
   The aurora: curtains of light in the brand colours, sky blue
   at the base and violet to orchid at the top, swaying slowly
   over the hero's horizon, with a few faint stars. It is one
   small WebGL shader on a fixed canvas behind everything, drawn
   at reduced resolution and about 30 frames a second. All of
   its motion repeats every 64 seconds.
   ============================================================ */

const VS = `
attribute vec2 p;
void main() { gl_Position = vec4(p, 0.0, 1.0); }`;

const FS = `
#ifdef GL_FRAGMENT_PRECISION_HIGH
precision highp float;
#else
precision mediump float;
#endif
uniform vec2 uRes;     // drawing buffer, px
uniform vec2 uCss;     // canvas, CSS px
uniform float uA;      // phase, 0..1 over 64 s
uniform float uI;      // aurora strength: 1 in the hero, lower further down
const float TAU = 6.28318530718;
const vec3 SKY = vec3(0.557, 0.773, 1.0);     // #8EC5FF
const vec3 AZURE = vec3(0.302, 0.553, 1.0);   // #4D8DFF
const vec3 VIOLET = vec3(0.545, 0.486, 1.0);  // #8B7CFF
const vec3 ORCHID = vec3(0.690, 0.486, 1.0);  // #B07CFF

float h21(vec2 p) { p = fract(p * vec2(233.34, 851.73)); p += dot(p, p + 23.45); return fract(p.x * p.y); }

// value noise whose second axis is time and wraps every P cells, so the motion loops
float vn(vec2 p, float P) {
  vec2 i = floor(p), f = fract(p), u = f * f * (3.0 - 2.0 * f);
  float y0 = mod(i.y, P), y1 = mod(i.y + 1.0, P);
  return mix(mix(h21(vec2(i.x, y0)), h21(vec2(i.x + 1.0, y0)), u.x),
             mix(h21(vec2(i.x, y1)), h21(vec2(i.x + 1.0, y1)), u.x), u.y);
}

// One curtain. Lengths are in "design px" on a 1080-high frame; k converts them to CSS px.
vec3 curtain(vec2 q, float k, float base, float amp, float hgt, float rpx, float sd, vec3 c0, vec3 c1, float gain) {
  float x = q.x / uCss.x, th = TAU * uA;
  float yb = k * (base + 240.0 * (x - 0.5) * (x - 0.5)
           + amp * sin(x * 4.3 + th + sd)
           + amp * 0.55 * sin(x * 9.7 - 2.0 * th + sd * 1.7)
           + amp * 0.3 * sin(x * 21.0 + 3.0 * th + sd * 2.9));
  float d = (yb - q.y) / k;
  float sway = 2.6 * sin(th + sd) + 1.2 * sin(2.0 * th + sd * 0.7);
  float xr = x * (uCss.x / rpx) + sway + 0.0035 * max(d, 0.0) * sin(2.0 * th + x * 5.0 + sd);
  float ta = uA * 16.0;
  // fine rays, gathered into brighter clusters, inside a few broad folds
  float r = 0.62 * vn(vec2(xr, ta + sd * 7.0), 16.0) + 0.38 * vn(vec2(xr * 2.7 + 13.0, ta * 2.0 + sd * 3.0), 32.0);
  r = r * r * 1.5;
  float cl = smoothstep(0.15, 0.95, vn(vec2(x * 26.0 + sway * 0.6 + sd * 9.0, ta + sd * 4.0), 16.0));
  float m = smoothstep(0.18, 0.85, vn(vec2(x * 5.0 + sway * 0.12 + sd * 4.0, uA * 8.0 + sd), 8.0));
  float H = hgt * (0.45 + 0.8 * vn(vec2(xr * 0.35 + 5.0, ta + sd * 2.0), 16.0)) * (0.7 + 0.5 * cl);
  float dh = max(d, 0.0) / H;
  float up = exp(-dh * sqrt(dh + 0.05) * 1.1);
  float lo = exp(min(d, 0.0) / 15.0);
  float band = exp(-abs(d) / 13.0);
  float below = exp(-abs(d) / 70.0);
  float haze = exp(-abs(d - 0.45 * H) / (1.3 * H));
  float I = (up * (0.38 + 0.62 * r) * (0.45 + 0.55 * cl) + 0.75 * band * (0.45 + 0.55 * r)) * lo * m
          + (0.10 * below + 0.14 * haze) * (0.35 + 0.65 * m);
  float hv = vn(vec2(x * 3.0 + sd * 2.0, uA * 4.0 + sd * 3.0), 4.0);
  vec3 b0 = mix(c0, AZURE, 0.45 * hv), b1 = mix(c1, ORCHID, 0.5 * (1.0 - hv));
  return mix(b0, b1, clamp(d / (H * 0.9), 0.0, 1.0)) * I * gain;
}

float stars(vec2 q) {
  vec2 cell = floor(q / 26.0);
  float h = h21(cell + 0.5);
  if (h < 0.86) return 0.0;
  vec2 pos = (cell + 0.2 + 0.6 * vec2(h21(cell + 3.1), h21(cell + 7.7))) * 26.0;
  vec2 dv = q - pos;
  float b = 0.35 + 0.65 * (h - 0.86) / 0.14;
  float n = 2.0 + floor(h21(cell + 5.3) * 4.0);
  float tw = 0.55 + 0.45 * sin(TAU * (uA * n + h21(cell + 11.3)));
  return b * tw * exp(-dot(dv, dv) / 2.2);
}

void main() {
  vec2 q = vec2(gl_FragCoord.x, uRes.y - gl_FragCoord.y) * (uCss / uRes);   // CSS px, y down
  float k = uCss.y / 1080.0;
  vec3 bg = vec3(0.0196, 0.0235, 0.0392) + vec3(0.006, 0.012, 0.035) * smoothstep(0.23, 0.74, q.y / uCss.y);
  vec3 a = curtain(q, k, 615.0, 75.0, 200.0, 12.8, 1.3, SKY, VIOLET, 1.05)
         + curtain(q, k, 470.0, 55.0, 150.0, 10.1, 4.1, AZURE, ORCHID, 0.65)
         + curtain(q, k, 335.0, 40.0, 115.0, 16.0, 8.7, VIOLET, ORCHID, 0.34);
  a *= uI;
  float lum = dot(a, vec3(0.3, 0.4, 0.3));
  // stars fade with the aurora, so behind the sections they never sit on text like stray dots
  float s = stars(q) * (1.0 - smoothstep(0.08, 0.4, lum)) * mix(0.22, 1.0, smoothstep(0.45, 1.0, uI));
  a = 1.0 - exp(-a * 1.1);
  gl_FragColor = vec4(bg + a + vec3(0.8, 0.88, 1.0) * s * 0.6, 1.0);
}`;

const PERIOD = 64;          // seconds
const STILL = 30 / PERIOD;  // the frame shown when motion is reduced
const smooth = (a: number, b: number, x: number) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };

export function Aurora({ reduce, onFail }: { reduce: boolean; onFail: () => void }) {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const gl = canvas.getContext("webgl", { alpha: false, antialias: false, depth: false, stencil: false, powerPreference: "low-power" });
    if (!gl) { onFail(); return; }

    const compile = (type: number, src: string) => {
      const sh = gl.createShader(type)!;
      gl.shaderSource(sh, src); gl.compileShader(sh);
      return gl.getShaderParameter(sh, gl.COMPILE_STATUS) ? sh : null;
    };
    const vs = compile(gl.VERTEX_SHADER, VS), fs = compile(gl.FRAGMENT_SHADER, FS);
    const prog = gl.createProgram();
    if (!vs || !fs || !prog) { onFail(); return; }
    gl.attachShader(prog, vs); gl.attachShader(prog, fs); gl.linkProgram(prog);
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) { onFail(); return; }
    gl.useProgram(prog);
    gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    const loc = gl.getAttribLocation(prog, "p");
    gl.enableVertexAttribArray(loc); gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
    const uRes = gl.getUniformLocation(prog, "uRes"), uCss = gl.getUniformLocation(prog, "uCss");
    const uA = gl.getUniformLocation(prog, "uA"), uI = gl.getUniformLocation(prog, "uI");

    let strength = 1, phase = STILL, raf = 0, last = -1e9, shown = false;
    const draw = () => {
      gl.uniform1f(uA, phase); gl.uniform1f(uI, strength);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
      if (!shown) { shown = true; canvas.style.opacity = "1"; }
    };
    /* fixed cost whatever the screen: about 900 drawn pixels across, scaled up by CSS */
    const resize = () => {
      const w = canvas.clientWidth, h = canvas.clientHeight;
      if (!w || !h) return;
      const scale = Math.min(0.8, Math.max(0.45, 900 / w));
      canvas.width = Math.max(1, Math.round(w * scale)); canvas.height = Math.max(1, Math.round(h * scale));
      gl.viewport(0, 0, canvas.width, canvas.height);
      gl.uniform2f(uRes, canvas.width, canvas.height); gl.uniform2f(uCss, w, h);
      draw();
    };
    /* full strength in the hero, calmer behind the sections so text stays easy to read */
    const onScroll = () => {
      strength = 1 - 0.55 * smooth(0.3, 1.1, window.scrollY / Math.max(1, window.innerHeight));
      if (reduce) draw();
    };
    const fps = window.matchMedia("(pointer: coarse)").matches ? 24 : 30;
    const loop = (now: number) => {
      raf = requestAnimationFrame(loop);
      if (now - last < 1000 / fps - 2) return;
      last = now; phase = ((now / 1000) / PERIOD) % 1; draw();
    };
    const lost = (e: Event) => { e.preventDefault(); cancelAnimationFrame(raf); onFail(); };

    onScroll(); resize();
    const ro = new ResizeObserver(resize); ro.observe(canvas);
    window.addEventListener("scroll", onScroll, { passive: true });
    canvas.addEventListener("webglcontextlost", lost);
    if (!reduce) raf = requestAnimationFrame(loop);
    return () => {
      cancelAnimationFrame(raf); ro.disconnect();
      window.removeEventListener("scroll", onScroll);
      canvas.removeEventListener("webglcontextlost", lost);
    };
  }, [reduce, onFail]);

  return <canvas ref={ref} aria-hidden className="aurora-canvas" />;
}
