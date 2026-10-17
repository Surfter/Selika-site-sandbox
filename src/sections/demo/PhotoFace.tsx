/* The demo face from a photograph (an AI-generated portrait, not a real person).
   The photo itself never bends: an eyes-closed copy makes it blink, makeup is painted
   from its landmarks and laid into the skin's own light and texture, the chosen light
   changes its colour temperature, a soft key light (from the depth map's normals)
   leans toward the cursor, and the guides glow on top. Plain WebGL in one pass, so it
   is light enough for phones. */
import { useEffect, useRef } from "react";
import gsap from "gsap";
import { frame } from "../../lib/frame";
import { addTick } from "../../lib/motion";
import { getTier, reducedMotion } from "../../lib/perf";
import { kelvinToRGB } from "../../lib/physics";
import { useSite } from "../../lib/store";
import { LIGHTS, STEPS, useDemo, type Region } from "./state";
import { paintGuides, paintMakeup, regionAt, type FaceMarks } from "./photoMakeup";
import { FACE_PACKS, facePath } from "./facePacks";

const VERT = `
attribute vec2 aPos;
uniform vec2 uScale;
uniform float uZoom;
varying vec2 vUv;
void main() {
  vUv = vec2(0.5, 0.48) + vec2(aPos.x, -aPos.y) * 0.5 * uScale / uZoom;
  gl_Position = vec4(aPos, 0.0, 1.0);
}`;

const FRAG = `
precision highp float;
varying vec2 vUv;
uniform sampler2D uPhoto, uClosed, uDepth, uMakeup, uGuide, uMesh, uPrev, uPrevMk;
uniform vec2 uTilt;      // a gentle turn toward the cursor, in uv per unit of depth (kept small, so nothing stretches)
uniform float uBlink;    // 0 open .. 1 closed
uniform vec3 uKey;       // the light's colour relative to the photo's own
uniform float uLevel;    // the light's brightness
uniform vec3 uLight;     // where the key light comes from
uniform vec3 uGuideCol;
uniform float uPulse;
uniform float uTime;
uniform float uFade;
uniform vec2 uTexel;     // one guide texel
uniform float uRecon;    // a new face being rebuilt, 0..1 (1 and over: done)
uniform float uMk;       // makeup being rebuilt, 0..1 (1 and over: done)
uniform vec4 uMkB;       // the box it is rebuilt across, top to bottom (photo uv, y down)
uniform vec4 uRB;        // the step's region (photo uv, y down); all zero when there is none
uniform float uScanT;    // the analysis scan over the region, 0..1 while it runs
uniform float uLine;     // 1 on the mapping step (a scan line), 0 on the others (a bloom from the centre)
uniform float uGuideT;   // seconds since the guides changed region
uniform vec2 uGC;        // the region's centre, where the guides draw out from
float dep(vec2 p) { return texture2D(uDepth, p).r; }
float h2(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
float boxIn(vec2 p, vec4 b, float soft) { vec2 c = (b.xy + b.zw) * 0.5, h = (b.zw - b.xy) * 0.5; vec2 q = abs(p - c) - h; float d = length(max(q, 0.0)) + min(max(q.x, q.y), 0.0); return 1.0 - smoothstep(-soft, soft, d); }
void main() {
  vec2 uv = vUv, p = uv;
  for (int i = 0; i < 3; i++) p = uv - uTilt * (dep(p) - 0.35);
  vec3 hol = mix(uGuideCol, vec3(1.0), 0.35);

  // ---- a face switch: the new face is rebuilt top to bottom behind a beam; the old one waits as a hologram ----
  float recOn = step(uRecon, 0.999);
  float cell = h2(floor(p * vec2(70.0, 88.0)));
  float by = mix(-0.08, 1.08, clamp(uRecon, 0.0, 1.0)) + (h2(floor(p * vec2(150.0, 188.0))) - 0.5) * 0.02;
  float dB = p.y - by;
  float isNew = mix(1.0, step(p.y, by), recOn);
  vec2 ca = vec2(0.006 * exp(-abs(dB) * 25.0) * recOn, 0.0);
  vec3 col = mix(texture2D(uPhoto, p).rgb, texture2D(uClosed, p).rgb, smoothstep(0.15, 0.85, uBlink));
  col.r = mix(col.r, texture2D(uPhoto, p + ca).r, recOn); col.b = mix(col.b, texture2D(uPhoto, p - ca).b, recOn);
  if (recOn > 0.5) {
    vec3 old = texture2D(uPrev, p).rgb;
    float lum = dot(old, vec3(0.299, 0.587, 0.114));
    vec3 oldH = mix(old, uGuideCol * lum * 1.5, 0.5) * (0.78 + 0.22 * sin(p.y * 900.0 + uTime * 26.0)) * (0.92 + 0.08 * step(0.5, h2(vec2(floor(p.y * 160.0), floor(uTime * 18.0)))));
    col = mix(oldH, col, isNew);
  }

  // ---- makeup, as pigment over skin; a change is rebuilt top to bottom across uMkB, only where it changes ----
  float mkOn = step(uMk, 0.999);
  vec4 mN = texture2D(uMakeup, p), mO = texture2D(uPrevMk, p);
  float th = clamp((p.y - uMkB.y) / max(0.001, uMkB.w - uMkB.y), 0.0, 1.0) * 0.86 + h2(floor(p * vec2(96.0, 120.0))) * 0.14;
  float fr = clamp(uMk, 0.0, 1.0) * 1.3 - 0.15;
  float nw = mix(1.0, smoothstep(th - 0.012, th + 0.012, fr), mkOn);
  vec4 m = mix(mO, mN, nw) * isNew;
  float chg = mkOn * smoothstep(0.012, 0.07, abs(mN.a - mO.a) + length(mN.rgb - mO.rgb));
  if (m.a > 0.002) {
    vec3 mc = m.rgb / m.a;
    float l = dot(col, vec3(0.299, 0.587, 0.114)), lm = max(dot(mc, vec3(0.299, 0.587, 0.114)), 0.04);
    vec3 tint = mc * clamp(l / lm, 0.6, 1.3), deep = col * mc * 1.35;
    col = mix(col, mix(deep, tint, clamp(lm * 1.6, 0.0, 0.65)), m.a);
  }
  // the light: shading from the depth map's normals, tinted to the chosen colour temperature
  vec2 dt = vec2(1.0 / 256.0, 1.0 / 320.0) * 1.5;
  float dx = dep(p + vec2(dt.x, 0.0)) - dep(p - vec2(dt.x, 0.0));
  float dy = dep(p + vec2(0.0, dt.y)) - dep(p - vec2(0.0, dt.y));
  vec3 n = normalize(vec3(-dx * 7.0, dy * 7.0, 1.0));
  float shade = 0.84 + 0.3 * dot(n, normalize(uLight));
  col *= uKey * uLevel * shade;

  // ---- the holographic layer ----
  vec3 msh = texture2D(uMesh, p).rgb;
  if (recOn > 0.5) {
    float above = step(dB, 0.0) * exp(dB * 12.0);
    col += mix(uGuideCol, hol, 0.4) * (msh.r * 0.45 + msh.g * 0.7 + msh.b * 0.45) * above;
    col += mix(uGuideCol, vec3(1.0), 0.65) * exp(-dB * dB / 0.00003) * 1.5 + uGuideCol * exp(-abs(dB) / 0.025) * 0.22;
    col += uGuideCol * step(0.86, h2(floor(p * vec2(150.0, 188.0)) + floor(uTime * 12.0))) * exp(-abs(dB) * 120.0) * 0.4;
  }
  if (mkOn > 0.5) {
    float edge = exp(-pow((fr - th) / 0.018, 2.0)) * chg;
    float waiting = chg * (1.0 - nw);
    float lines = 0.55 + 0.45 * sin(p.y * 700.0 - uTime * 18.0);
    col += mix(uGuideCol, hol, 0.4) * ((msh.r * 0.5 + msh.g * 0.7) * chg * (0.3 + 0.7 * (1.0 - nw)) + waiting * 0.08 * lines + edge * 1.1);
  }
  // the analysis of a new step: the mesh in its region lights up, then glides back down to its resting glow.
  // Mapping the face (the first step) does it behind a scan line; the other steps bloom out from the centre.
  float inR = boxIn(p, uRB, 0.02) * step(0.001, uRB.z - uRB.x);
  float since = uGuideT;
  float env = smoothstep(0.0, 0.35, since) * exp(-max(0.0, since - mix(0.9, 1.5, uLine)) * 0.85);
  float sOn = step(0.0, uScanT) * step(uScanT, 1.0) * uLine;
  float sy = mix(uRB.y, uRB.w, clamp(uScanT, 0.0, 1.0)), ds = p.y - sy;
  float front = exp(-ds * ds / 0.0001) * inR * sOn;
  float bloom = smoothstep(since * 0.7, since * 0.7 - 0.08, length((p - uGC) * vec2(1.0, 0.8)));
  float reach = mix(bloom, smoothstep(0.012, -0.03, ds) * step(0.0, uScanT), uLine);
  float hi = env * reach * inR * mix(1.0, 0.75, uLine);
  col += mix(uGuideCol, hol, 0.5) * (msh.r * (hi * 0.42 + front * 0.5) + msh.g * (hi * 0.6 + front * 0.75) + msh.b * (hi * 0.3 + front * 0.35));
  col += mix(uGuideCol, vec3(1.0), 0.5) * exp(-ds * ds / 0.000004) * inR * sOn * 0.55;
  float tw = h2(floor(p * vec2(256.0, 320.0)));
  col += uGuideCol * inR * (msh.r * 0.07 * (0.6 + 0.4 * sin(uTime * 1.6)) + msh.g * 0.4 * pow(0.5 + 0.5 * sin(uTime * (1.2 + tw * 2.0) + tw * 40.0), 12.0));

  // ---- the guides: they draw out from the region's centre, a bright head at the front, then shimmer ----
  vec3 g = texture2D(uGuide, p).rgb * isNew;
  float halo = (texture2D(uGuide, p + uTexel * vec2(3.0, 3.0)).r + texture2D(uGuide, p + uTexel * vec2(-3.0, 3.0)).r
              + texture2D(uGuide, p + uTexel * vec2(3.0, -3.0)).r + texture2D(uGuide, p + uTexel * vec2(-3.0, -3.0)).r) * 0.25 * isNew;
  float rad = max(0.0, uGuideT - 0.35) * 0.55;
  float dist = length((p - uGC) * vec2(1.0, 0.8));
  float rev = smoothstep(rad, rad - 0.025, dist);
  float head = exp(-pow((dist - rad) / 0.014, 2.0)) * step(rad, 0.7);
  float sheen = 0.8 + 0.45 * smoothstep(0.55, 1.0, sin((p.x * 0.7 + p.y) * 26.0 - uTime * 2.6));
  float spark = pow(0.5 + 0.5 * sin((p.x * 0.8 + p.y) * 70.0 - uTime * 6.0), 12.0);
  col += uGuideCol * ((g.r * (0.78 + 0.3 * uPulse) * sheen + halo * 0.35) * rev + g.r * rev * spark * 0.7 + g.g * (0.22 + 0.16 * uPulse));
  col += mix(uGuideCol, vec3(1.0), 0.6) * (g.r + halo) * head * 1.6;
  // settle into the dark of the mirror at the edges
  vec2 e = (uv - vec2(0.5, 0.48)) * vec2(1.25, 1.0);
  col *= 1.0 - 0.45 * smoothstep(0.35, 0.75, length(e));
  gl_FragColor = vec4(col * uFade, 1.0);
}`;

const ZOOM = 1.12;
const TILT_X = 0.013, TILT_Y = 0.01; // about a third of 8.2's turn: the face answers the cursor without the photo stretching

type Pack = { marks: FaceMarks; photo: HTMLImageElement; closed: HTMLImageElement | null; depth: HTMLImageElement; mesh: HTMLImageElement | null };
const cache = new Map<string, Promise<Pack>>();
function loadImage(src: string) {
  return new Promise<HTMLImageElement>((res, rej) => { const i = new Image(); i.decoding = "async"; i.onload = () => res(i); i.onerror = rej; i.src = src; });
}
function loadPack(id: string, blink: boolean): Promise<Pack> {
  let p = cache.get(id);
  if (!p) {
    p = (async () => {
      const [marks, photo, depth, closed, mesh] = await Promise.all([
        fetch(facePath(id, ".json")).then((r) => r.json() as Promise<FaceMarks>),
        loadImage(facePath(id, ".jpg")), loadImage(facePath(id, "-depth.png")),
        blink ? loadImage(facePath(id, "-closed.jpg")).catch(() => null) : Promise.resolve(null),
        loadImage(facePath(id, "-mesh.png")).catch(() => null),   // the face's landmark mesh, for the holographic effects
      ]);
      return { marks, photo, closed, depth, mesh };
    })();
    cache.set(id, p);
  }
  return p;
}
/** Warm the next faces so switching is instant. */
export function preloadFaces() { for (const f of FACE_PACKS) loadPack(f.id, f.blink).catch(() => {}); }

export default function PhotoFace({ active, onHover }: { active: boolean; onHover: (r: Region, at?: { x: number; y: number }) => void }) {
  const host = useRef<HTMLDivElement>(null);
  const activeRef = useRef(active); activeRef.current = active;
  const hoverRef = useRef(onHover); hoverRef.current = onHover;

  useEffect(() => {
    // a fresh canvas per mount, so a remount never inherits a released context
    const canvas = document.createElement("canvas");
    canvas.className = "absolute inset-0 h-full w-full"; canvas.style.touchAction = "pan-y"; canvas.setAttribute("aria-hidden", "true");
    host.current!.appendChild(canvas);
    const gl = canvas.getContext("webgl", { antialias: false, alpha: false, premultipliedAlpha: false, powerPreference: "high-performance" });
    if (!gl) throw new Error("WebGL unavailable");
    const sh = (type: number, src: string) => { const s = gl.createShader(type)!; gl.shaderSource(s, src); gl.compileShader(s); if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s) || "shader"); return s; };
    const prog = gl.createProgram()!;
    gl.attachShader(prog, sh(gl.VERTEX_SHADER, VERT)); gl.attachShader(prog, sh(gl.FRAGMENT_SHADER, FRAG)); gl.linkProgram(prog);
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(prog) || "link");
    gl.useProgram(prog);
    const buf = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    const loc = gl.getAttribLocation(prog, "aPos"); gl.enableVertexAttribArray(loc); gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
    const U = (n: string) => gl.getUniformLocation(prog, n);

    // eight textures: photo, eyes closed, depth, makeup (premultiplied), guides, the landmark mesh, and the
    // previous face and previous makeup (for the holographic rebuilds)
    const units = ["uPhoto", "uClosed", "uDepth", "uMakeup", "uGuide", "uMesh", "uPrev", "uPrevMk"];
    const tex = units.map((name, i) => {
      const t = gl.createTexture()!; gl.activeTexture(gl.TEXTURE0 + i); gl.bindTexture(gl.TEXTURE_2D, t);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, new Uint8Array([0, 0, 0, 0]));
      gl.uniform1i(U(name), i);
      return t;
    });
    const upload = (i: number, src: TexImageSource, premultiply = false) => {
      gl.activeTexture(gl.TEXTURE0 + i); gl.bindTexture(gl.TEXTURE_2D, tex[i]);
      gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, premultiply);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, src);
    };
    const low = getTier() === "low";
    const mk = (w: number, h: number) => { const c = document.createElement("canvas"); c.width = w; c.height = h; return c.getContext("2d")!; };
    const makeup = mk(512, 640), guide = mk(low ? 512 : 768, low ? 640 : 960);
    gl.uniform2f(U("uTexel"), 1 / guide.canvas.width, 1 / guide.canvas.height);

    const u = { scale: U("uScale"), zoom: U("uZoom"), tilt: U("uTilt"), blink: U("uBlink"), key: U("uKey"), level: U("uLevel"), light: U("uLight"), gcol: U("uGuideCol"), pulse: U("uPulse"), time: U("uTime"), fade: U("uFade"),
      recon: U("uRecon"), mk: U("uMk"), mkB: U("uMkB"), rb: U("uRB"), scanT: U("uScanT"), line: U("uLine"), guideT: U("uGuideT"), gc: U("uGC") };
    gl.uniform3f(u.light, -0.55, 0.5, 0.8);

    let W = 1, H = 1;
    const resize = () => {
      const r = canvas.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, low ? 1.25 : 2);
      W = Math.max(1, Math.round(r.width * dpr)); H = Math.max(1, Math.round(r.height * dpr));
      canvas.width = W; canvas.height = H; gl.viewport(0, 0, W, H);
      // object-fit: cover for a 4:5 photo
      const ca = r.width / Math.max(1, r.height), pa = 0.8;
      gl.uniform2f(u.scale, ca > pa ? 1 : ca / pa, ca > pa ? pa / ca : 1);
    };
    resize();
    const ro = new ResizeObserver(resize); ro.observe(canvas);

    // state the shader reads
    const s = { pack: null as Pack | null, id: "", fade: 0, blink: 0, nextBlink: 2.5, yaw: 0, pitch: 0, zoom: ZOOM,
      recon: 1, mk: 1, mkB: [0, 0, 1, 1] as number[], rb: [0, 0, 0, 0] as number[], gc: [0.5, 0.5] as number[], guideT0: -100, now: 0, wasActive: false };
    const keyTarget = { r: 1, g: 1, b: 1, level: 1 };
    const ref5200 = kelvinToRGB(5200);
    const setLight = (id: string, instant = false) => {
      const L = LIGHTS.find((l) => l.id === id)!; const c = kelvinToRGB(L.k);
      let r = c[0] / ref5200[0], g = c[1] / ref5200[1], b = c[2] / ref5200[2];
      const lum = 0.299 * r + 0.587 * g + 0.114 * b; r /= lum; g /= lum; b /= lum;
      const k = 0.72; // how far the photo is pushed toward the light's colour
      gsap.to(keyTarget, { r: 1 + (r - 1) * k, g: 1 + (g - 1) * k, b: 1 + (b - 1) * k, level: 0.5 + 0.5 * L.intensity, duration: instant || reducedMotion ? 0 : 0.9, ease: "power2.inOut" });
    };

    // a region's box on the photo (uv, y down), padded
    const boxOf = (f: FaceMarks, r: Region): number[] => {
      const pts = r === "brows" ? [...f.browR, ...f.browL, ...f.browRLow, ...f.browLLow]
        : r === "eyes" ? [...f.eyeR, ...f.eyeL, ...f.creaseR, ...f.creaseL]
        : r === "cheeks" ? [...f.cheekR, ...f.cheekL]
        : r === "lips" ? f.lipsOuter : f.oval;
      const xs = pts.map((q) => q[0]), ys = pts.map((q) => q[1]);
      const pad = r === "cheeks" ? 0.06 : r === "skin" || r === null ? 0.005 : 0.025;
      return [Math.min(...xs) - pad, Math.min(...ys) - pad, Math.max(...xs) + pad, Math.max(...ys) + pad];
    };
    // the step's region: its box for the analysis scan, and where its guides draw out from
    const setRegion = (restart: boolean) => {
      const p = s.pack; if (!p) return;
      const product = useSite.getState().product;
      const region = product === "beauty" ? STEPS[useDemo.getState().step].region : null;
      if (!region) { s.rb = [0, 0, 0, 0]; return; }
      s.rb = boxOf(p.marks, region);
      s.gc = [(s.rb[0] + s.rb[2]) / 2, (s.rb[1] + s.rb[3]) / 2];
      if (restart) s.guideT0 = s.now;
    };
    // makeup changes are rebuilt as a hologram where they change: a look across the face, a step across its region
    const repaintMakeup = (rebuild: "" | "look" | "step" = "") => {
      const p = s.pack; if (!p) return;
      const d = useDemo.getState();
      if (rebuild && !reducedMotion) {
        upload(7, makeup.canvas, true);
        const r = STEPS[d.step].region;
        s.mkB = rebuild === "look" || !r ? boxOf(p.marks, "skin") : boxOf(p.marks, r);
        gsap.killTweensOf(s, "mk"); s.mk = 0; gsap.to(s, { mk: 1, duration: rebuild === "look" ? 1.35 : 1.0, ease: "none" });
      }
      paintMakeup(makeup, p.marks, d.look, d.step);
      upload(3, makeup.canvas, true);
    };
    let guideKey = "";
    const repaintGuides = () => {
      const p = s.pack; if (!p) return;
      const d = useDemo.getState(); const product = useSite.getState().product;
      const region = product === "beauty" ? STEPS[d.step].region : null; const hover = product === "beauty" ? d.hover : null;
      const k = `${region}|${hover}|${s.id}`; if (k === guideKey) return; guideKey = k;
      paintGuides(guide, p.marks, region, hover);
      upload(4, guide.canvas);
    };

    // load (and switch) faces with a short fade through the dark
    let want = "";
    const show = async (index: number) => {
      const f = FACE_PACKS[Math.max(0, Math.min(FACE_PACKS.length - 1, index))]; if (!f) return;
      want = f.id;
      const pack = await loadPack(f.id, f.blink);
      if (want !== f.id) return;
      // switching faces: a holographic rebuild (the old face waits as a hologram while the new one is
      // rebuilt behind a beam); the first face fades in from the dark
      const rebuild = !!s.pack && !reducedMotion;
      if (rebuild) upload(6, s.pack!.photo);
      else if (s.pack) await new Promise<void>((res) => gsap.to(s, { fade: 0, duration: reducedMotion ? 0 : 0.22, ease: "power2.in", onComplete: () => res() }));
      if (want !== f.id) return;
      s.pack = pack; s.id = f.id; guideKey = "";
      upload(0, pack.photo); upload(1, pack.closed ?? pack.photo); upload(2, pack.depth); if (pack.mesh) upload(5, pack.mesh);
      s.mk = 1; repaintMakeup(); repaintGuides(); setRegion(!rebuild);
      if (rebuild) { gsap.killTweensOf(s, "recon"); s.recon = 0; gsap.to(s, { recon: 1, duration: 1.5, ease: "power1.inOut" }); }
      gsap.to(s, { fade: 1, duration: reducedMotion ? 0 : 0.55, ease: "power2.out" });
    };
    show(useDemo.getState().face);
    setLight(useDemo.getState().light, true);

    const unsubDemo = useDemo.subscribe((d, prev) => {
      if (d.face !== prev.face) show(d.face);
      if (d.look !== prev.look) repaintMakeup("look");
      else if (d.step !== prev.step) repaintMakeup("step");
      if (d.step !== prev.step) setRegion(true);
      if (d.step !== prev.step || d.hover !== prev.hover) repaintGuides();
      if (d.light !== prev.light) setLight(d.light);
    });
    const unsubSite = useSite.subscribe((st, prev) => { if (st.product !== prev.product) { repaintGuides(); setRegion(true); } });

    // the cursor: where it is over the face, and which feature that is
    const toPhoto = (clientX: number, clientY: number) => {
      const r = canvas.getBoundingClientRect();
      const ca = r.width / Math.max(1, r.height), pa = 0.8;
      const sx = ca > pa ? 1 : ca / pa, sy = ca > pa ? pa / ca : 1;
      const ax = ((clientX - r.left) / r.width) * 2 - 1, ay = ((clientY - r.top) / r.height) * 2 - 1;
      return [0.5 + ax * 0.5 * sx / s.zoom, 0.48 + ay * 0.5 * sy / s.zoom] as const;
    };
    const onMove = (e: PointerEvent) => {
      const p = s.pack; if (!p || useSite.getState().product !== "beauty") return;
      const [x, y] = toPhoto(e.clientX, e.clientY);
      const r = regionAt(p.marks, x, y);
      if (r !== useDemo.getState().hover) hoverRef.current(r, { x: e.clientX, y: e.clientY });
    };
    const onLeave = () => hoverRef.current(null);
    canvas.addEventListener("pointermove", onMove); canvas.addEventListener("pointerdown", onMove); canvas.addEventListener("pointerleave", onLeave);

    let lastDraw = -1;
    const off = addTick((t, dt) => {
      s.now = t;
      if (!activeRef.current || document.hidden) { s.wasActive = false; return; }
      if (!s.wasActive) { s.wasActive = true; setRegion(true); }   // coming into view replays the step's analysis
      if (low && t - lastDraw < 1 / 30) return;
      lastDraw = t;
      // the key light leans toward the cursor (relative to the face), with a slow idle drift
      const r = canvas.getBoundingClientRect(), P = frame.pointer;
      let lx = 0, ly = 0;
      if (P.seen) {
        lx = Math.max(-1, Math.min(1, (P.x - (r.left + r.width / 2)) / (r.width * 0.75)));
        ly = Math.max(-1, Math.min(1, -(P.y - (r.top + r.height * 0.42)) / (r.height * 0.75)));
      }
      const k = 1 - Math.exp(-dt * 3.2);
      const sway = reducedMotion ? 0 : 1;
      s.yaw += (lx + Math.sin(t * 0.45) * 0.08 * sway - s.yaw) * k;
      s.pitch += (-ly + Math.sin(t * 0.7) * 0.06 * sway - s.pitch) * k;
      // blink every few seconds, sometimes twice
      if (!reducedMotion && s.pack?.closed && t > s.nextBlink) {
        // a quick close, a beat shut, a slower open; every few seconds, now and then twice
        s.nextBlink = t + 3.2 + Math.random() * 3.6;
        const tl = gsap.timeline();
        tl.to(s, { blink: 1, duration: 0.06, ease: "power2.in" }).to(s, { blink: 1, duration: 0.05 }).to(s, { blink: 0, duration: 0.13, ease: "power2.out" });
        if (Math.random() < 0.12) tl.to(s, { blink: 1, duration: 0.06, ease: "power2.in", delay: 0.12 }).to(s, { blink: 0, duration: 0.13, ease: "power2.out" });
      }
      const product = useSite.getState().product;
      const gc = product === "beauty" ? [0.78, 0.71, 1.0] : [0.62, 0.82, 1.0];
      gl.uniform2f(u.tilt, s.yaw * TILT_X, s.pitch * TILT_Y);
      gl.uniform3f(u.light, -0.55 + s.yaw * 0.35, 0.5 + s.pitch * 0.25, 0.8);
      gl.uniform1f(u.zoom, s.zoom);
      gl.uniform1f(u.blink, s.blink);
      gl.uniform3f(u.key, keyTarget.r, keyTarget.g, keyTarget.b);
      gl.uniform1f(u.level, keyTarget.level);
      gl.uniform3f(u.gcol, gc[0], gc[1], gc[2]);
      gl.uniform1f(u.pulse, reducedMotion ? 0.5 : 0.5 + 0.5 * Math.sin(t * 2.4));
      gl.uniform1f(u.time, reducedMotion ? 0 : t);
      gl.uniform1f(u.fade, s.fade);
      gl.uniform1f(u.recon, s.recon); gl.uniform1f(u.mk, s.mk);
      gl.uniform4f(u.mkB, s.mkB[0], s.mkB[1], s.mkB[2], s.mkB[3]);
      gl.uniform4f(u.rb, s.rb[0], s.rb[1], s.rb[2], s.rb[3]);
      const since = reducedMotion ? 99 : t - s.guideT0;
      const mapping = useSite.getState().product === "beauty" && STEPS[useDemo.getState().step].region === "skin";
      gl.uniform1f(u.line, mapping ? 1 : 0);
      gl.uniform1f(u.scanT, reducedMotion ? -1 : since / 1.4);
      gl.uniform1f(u.guideT, since);
      gl.uniform2f(u.gc, s.gc[0], s.gc[1]);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
    });

    if (import.meta.env.DEV) Object.assign(window, { __photo: { s, keyTarget } });
    return () => {
      off(); ro.disconnect(); unsubDemo(); unsubSite();
      canvas.removeEventListener("pointermove", onMove); canvas.removeEventListener("pointerdown", onMove); canvas.removeEventListener("pointerleave", onLeave);
      gsap.killTweensOf(s); gsap.killTweensOf(keyTarget);
      gl.getExtension("WEBGL_lose_context")?.loseContext();
      canvas.remove();
    };
  }, []);

  return <div ref={host} className="absolute inset-0" />;
}
