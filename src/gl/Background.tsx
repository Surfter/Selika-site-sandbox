import { useEffect, useRef } from "react";
import { BG_FRAG, BG_VERT } from "./backgroundShader";
import { frame } from "../lib/frame";
import { addTick } from "../lib/motion";
import { bgScale, getTier, onTier, reducedMotion, type Tier } from "../lib/perf";

/* The aurora's route down the page. Sections mark their side with data-stream="-1|0|1"
   (left margin, centre, right margin). The route is sampled every 0.05 viewport heights
   and smoothed three times, so it is one continuous S-curve between sections. */
type Route = { step: number; data: Float32Array };
function buildRoute(): Route {
  const vh = Math.max(1, window.innerHeight), vw = Math.max(1, window.innerWidth);
  const page = Math.max(document.documentElement.scrollHeight, vh) / vh;
  const pad = vw >= 1024 ? 48 : vw >= 640 ? 32 : 20;
  const contentLeft = (vw - Math.min(vw, 1320)) / 2 + pad;
  const edge = Math.max(vw < 640 ? 0.025 : 0.04, (contentLeft / vw) * 0.5); // centre of the margin
  const heroX = vw >= 1024 && vw / vh > 1.15 ? 0.56 : 0.5;
  const secs = Array.from(document.querySelectorAll<HTMLElement>("[data-stream]"))
    .map((el) => ({ y: (el.getBoundingClientRect().top + window.scrollY) / vh, s: Number(el.dataset.stream) || 0 }))
    .sort((a, b) => a.y - b.y);
  const step = 0.05;
  const n = Math.ceil(page / step) + 4;
  let a = new Float32Array(n), b = new Float32Array(n);
  let k = 0;
  for (let i = 0; i < n; i++) {
    const y = i * step;
    while (k + 1 < secs.length && secs[k + 1].y <= y) k++;
    const s = secs.length && secs[k].y <= y ? secs[k].s : 0;
    a[i] = s === 0 ? (i * step < 2 ? heroX : 0.5) : s < 0 ? edge : 1 - edge;
  }
  const w = Math.round(0.4 / step);
  for (let pass = 0; pass < 3; pass++) {
    for (let i = 0; i < n; i++) {
      let sum = 0, cnt = 0;
      for (let j = i - w; j <= i + w; j++) { const jj = Math.min(n - 1, Math.max(0, j)); sum += a[jj]; cnt++; }
      b[i] = sum / cnt;
    }
    [a, b] = [b, a];
  }
  return { step, data: a };
}
function routeAt(r: Route, y: number) {
  const f = Math.max(0, y / r.step), i = Math.min(r.data.length - 2, Math.floor(f)), t = Math.min(1, f - i);
  return r.data[i] * (1 - t) + r.data[i + 1] * t;
}

export function Background() {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current!;
    const gl = canvas.getContext("webgl", { antialias: false, alpha: false, depth: false, stencil: false, powerPreference: "high-performance", preserveDrawingBuffer: false });
    if (!gl) { canvas.style.display = "none"; return; }

    const sh = (type: number, src: string) => {
      const s = gl.createShader(type)!; gl.shaderSource(s, src); gl.compileShader(s);
      if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) { console.warn(gl.getShaderInfoLog(s)); return null; }
      return s;
    };
    const vs = sh(gl.VERTEX_SHADER, BG_VERT), fs = sh(gl.FRAGMENT_SHADER, BG_FRAG);
    const prog = gl.createProgram()!;
    if (!vs || !fs) { canvas.style.display = "none"; return; }
    gl.attachShader(prog, vs); gl.attachShader(prog, fs); gl.linkProgram(prog);
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) { console.warn(gl.getProgramInfoLog(prog)); canvas.style.display = "none"; return; }
    gl.useProgram(prog);
    const buf = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    const loc = gl.getAttribLocation(prog, "aPos"); gl.enableVertexAttribArray(loc); gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
    const U = (n: string) => gl.getUniformLocation(prog, n);
    const u = { res: U("uRes"), time: U("uTime"), drift: U("uDrift"), mouse: U("uMouse"), scroll: U("uScroll"), world: U("uWorld"), hero: U("uHero"), aspect: U("uAspect"), oct: U("uOct"), aur: U("uAur"), aurW: U("uAurW"), css: U("uCss"), path: U("uPath[0]") ?? U("uPath") };

    let tier: Tier = getTier();
    let scale = bgScale(tier);
    const setQuality = () => {
      gl.uniform1f(u.oct, tier === "high" ? 5 : tier === "mid" ? 4 : 3);
      gl.uniform1f(u.aur, matchMedia("(prefers-reduced-transparency: reduce)").matches ? 0.6 : 1);
    };
    let route: Route = { step: 0.05, data: new Float32Array(4).fill(0.5) };
    const remeasure = () => { route = buildRoute(); };
    const resize = () => {
      const s = Math.min(scale, 1600 / Math.max(1, window.innerWidth));
      canvas.width = Math.max(1, Math.round(window.innerWidth * s));
      canvas.height = Math.max(1, Math.round(window.innerHeight * s));
      gl.viewport(0, 0, canvas.width, canvas.height);
      gl.uniform2f(u.res, canvas.width, canvas.height);
      const aspect = window.innerWidth / Math.max(1, window.innerHeight);
      gl.uniform1f(u.aspect, aspect);
      gl.uniform1f(u.aurW, aspect < 0.8 ? 0.55 : aspect < 1.15 ? 0.8 : 1);
      gl.uniform2f(u.css, window.innerWidth, window.innerHeight);
      remeasure();
    };
    setQuality(); resize();
    const offTier = onTier((t) => { tier = t; scale = bgScale(t); setQuality(); resize(); });
    window.addEventListener("resize", resize);
    let roTimer = 0;
    const ro = new ResizeObserver(() => { clearTimeout(roTimer); roTimer = window.setTimeout(remeasure, 120); });
    ro.observe(document.body);
    const settle = setTimeout(remeasure, 1500);

    // calm inputs: time is integrated (never jumps), the cursor is followed slowly
    let drift = 0, last = -1, mx = 0.5, my = 0.5;
    const path = new Float32Array(17);
    let lastKey = -1;
    const off = addTick((t, dt) => {
      if (document.hidden) return;
      const step = last < 0 ? 0 : Math.min(0.05, Math.max(0, t - last)); last = t;
      if (!reducedMotion) drift += step;
      const k = 1 - Math.exp(-(dt || step) * 1.8);
      mx += (frame.pointer.nx * 0.5 + 0.5 - mx) * k; my += (frame.pointer.ny * 0.5 + 0.5 - my) * k;
      const sv = frame.scroll.y / Math.max(1, frame.vh);
      if (reducedMotion) {
        const key = Math.round(sv * 400) + frame.world * 7 + frame.hero * 13;
        if (key === lastKey) return; lastKey = key;
      }
      for (let i = 0; i < 17; i++) path[i] = routeAt(route, sv + i / 16);
      gl.uniform1f(u.time, t);
      gl.uniform1f(u.drift, drift + 40);
      gl.uniform2f(u.mouse, mx, my);
      gl.uniform1f(u.scroll, sv);
      gl.uniform1f(u.world, frame.world);
      gl.uniform1f(u.hero, frame.hero);
      gl.uniform1fv(u.path, path);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
    });
    canvas.style.opacity = "1";

    return () => { off(); offTier(); ro.disconnect(); clearTimeout(settle); clearTimeout(roTimer); window.removeEventListener("resize", resize); };
  }, []);

  return <canvas ref={ref} aria-hidden className="pointer-events-none fixed inset-0 -z-10 h-[100lvh] w-full opacity-0 transition-opacity duration-1000" />;
}
