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
uniform sampler2D uPhoto, uClosed, uDepth, uMakeup, uGuide;
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
float dep(vec2 p) { return texture2D(uDepth, p).r; }
void main() {
  vec2 uv = vUv, p = uv;
  for (int i = 0; i < 3; i++) p = uv - uTilt * (dep(p) - 0.35);
  // the lids close quickly through the in-between, as a real blink does
  vec3 col = mix(texture2D(uPhoto, p).rgb, texture2D(uClosed, p).rgb, smoothstep(0.15, 0.85, uBlink));
  // makeup, as pigment over skin: light shades take the skin's own light and texture (a colour blend),
  // dark ones deepen it (a multiply), so pores and highlights show through either way
  vec4 m = texture2D(uMakeup, p);
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
  // the guides glow and pulse, a soft halo around each line
  vec3 g = texture2D(uGuide, p).rgb;
  float halo = (texture2D(uGuide, p + uTexel * vec2(3.0, 3.0)).r + texture2D(uGuide, p + uTexel * vec2(-3.0, 3.0)).r
              + texture2D(uGuide, p + uTexel * vec2(3.0, -3.0)).r + texture2D(uGuide, p + uTexel * vec2(-3.0, -3.0)).r) * 0.25;
  float sheen = 0.8 + 0.45 * smoothstep(0.55, 1.0, sin((p.x * 0.7 + p.y) * 26.0 - uTime * 2.6));
  col += uGuideCol * (g.r * (0.78 + 0.3 * uPulse) * sheen + halo * 0.35 + g.g * (0.22 + 0.16 * uPulse));
  // settle into the dark of the mirror at the edges
  vec2 e = (uv - vec2(0.5, 0.48)) * vec2(1.25, 1.0);
  col *= 1.0 - 0.45 * smoothstep(0.35, 0.75, length(e));
  gl_FragColor = vec4(col * uFade, 1.0);
}`;

const ZOOM = 1.12;
const TILT_X = 0.013, TILT_Y = 0.01; // about a third of 8.2's turn: the face answers the cursor without the photo stretching

type Pack = { marks: FaceMarks; photo: HTMLImageElement; closed: HTMLImageElement | null; depth: HTMLImageElement };
const cache = new Map<string, Promise<Pack>>();
function loadImage(src: string) {
  return new Promise<HTMLImageElement>((res, rej) => { const i = new Image(); i.decoding = "async"; i.onload = () => res(i); i.onerror = rej; i.src = src; });
}
function loadPack(id: string, blink: boolean): Promise<Pack> {
  let p = cache.get(id);
  if (!p) {
    p = (async () => {
      const [marks, photo, depth, closed] = await Promise.all([
        fetch(facePath(id, ".json")).then((r) => r.json() as Promise<FaceMarks>),
        loadImage(facePath(id, ".jpg")), loadImage(facePath(id, "-depth.png")),
        blink ? loadImage(facePath(id, "-closed.jpg")).catch(() => null) : Promise.resolve(null),
      ]);
      return { marks, photo, closed, depth };
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

    // five textures: photo, eyes closed, depth, makeup (premultiplied), guides
    const units = ["uPhoto", "uClosed", "uDepth", "uMakeup", "uGuide"];
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

    const u = { scale: U("uScale"), zoom: U("uZoom"), tilt: U("uTilt"), blink: U("uBlink"), key: U("uKey"), level: U("uLevel"), light: U("uLight"), gcol: U("uGuideCol"), pulse: U("uPulse"), time: U("uTime"), fade: U("uFade") };
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
    const s = { pack: null as Pack | null, id: "", fade: 0, blink: 0, nextBlink: 2.5, yaw: 0, pitch: 0, zoom: ZOOM };
    const keyTarget = { r: 1, g: 1, b: 1, level: 1 };
    const ref5200 = kelvinToRGB(5200);
    const setLight = (id: string, instant = false) => {
      const L = LIGHTS.find((l) => l.id === id)!; const c = kelvinToRGB(L.k);
      let r = c[0] / ref5200[0], g = c[1] / ref5200[1], b = c[2] / ref5200[2];
      const lum = 0.299 * r + 0.587 * g + 0.114 * b; r /= lum; g /= lum; b /= lum;
      const k = 0.72; // how far the photo is pushed toward the light's colour
      gsap.to(keyTarget, { r: 1 + (r - 1) * k, g: 1 + (g - 1) * k, b: 1 + (b - 1) * k, level: 0.5 + 0.5 * L.intensity, duration: instant || reducedMotion ? 0 : 0.9, ease: "power2.inOut" });
    };

    const repaintMakeup = () => {
      const p = s.pack; if (!p) return;
      const d = useDemo.getState();
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
      if (s.pack) await new Promise<void>((res) => gsap.to(s, { fade: 0, duration: reducedMotion ? 0 : 0.22, ease: "power2.in", onComplete: () => res() }));
      if (want !== f.id) return;
      s.pack = pack; s.id = f.id; guideKey = "";
      upload(0, pack.photo); upload(1, pack.closed ?? pack.photo); upload(2, pack.depth);
      repaintMakeup(); repaintGuides();
      gsap.to(s, { fade: 1, duration: reducedMotion ? 0 : 0.55, ease: "power2.out" });
    };
    show(useDemo.getState().face);
    setLight(useDemo.getState().light, true);

    const unsubDemo = useDemo.subscribe((d, prev) => {
      if (d.face !== prev.face) show(d.face);
      if (d.look !== prev.look || d.step !== prev.step) repaintMakeup();
      if (d.step !== prev.step || d.hover !== prev.hover) repaintGuides();
      if (d.light !== prev.light) setLight(d.light);
    });
    const unsubSite = useSite.subscribe((st, prev) => { if (st.product !== prev.product) repaintGuides(); });

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
      if (!activeRef.current || document.hidden) return;
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
