import { useEffect, useRef } from "react";
import { BG_FRAG, BG_VERT } from "./backgroundShader";
import { frame } from "../lib/frame";
import { addTick } from "../lib/motion";
import { bgScale, getTier, onTier, reducedMotion, type Tier } from "../lib/perf";

/** Sections mark where the stream of light runs with data-stream="-1|0|1". */
function measureSections(): Float32Array<ArrayBuffer> {
  const out = new Float32Array(32);
  const vh = window.innerHeight || 1;
  const els = Array.from(document.querySelectorAll<HTMLElement>("[data-stream]"));
  const list = els.map((el) => ({ y: (el.getBoundingClientRect().top + window.scrollY) / vh, s: Number(el.dataset.stream) || 0 }))
    .sort((a, b) => a.y - b.y).slice(0, 16);
  list.forEach((v, i) => { out[i * 2] = v.y; out[i * 2 + 1] = v.s; });
  return out.slice(0, Math.max(2, list.length * 2));
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
    const u = { res: U("uRes"), time: U("uTime"), mouse: U("uMouse"), mouseV: U("uMouseV"), scroll: U("uScroll"), scrollV: U("uScrollV"), world: U("uWorld"), hero: U("uHero"), aspect: U("uAspect"), oct: U("uOct"), streamN: U("uStreamN"), sec: U("uSec[0]") ?? U("uSec"), secN: U("uSecN") };

    let tier: Tier = getTier();
    let scale = bgScale(tier);
    const setQuality = () => {
      gl.uniform1f(u.oct, tier === "high" ? 5 : tier === "mid" ? 4 : 3);
      gl.uniform1f(u.streamN, tier === "high" ? 6 : tier === "mid" ? 5 : 3);
    };
    const resize = () => {
      const s = Math.min(scale, 1600 / Math.max(1, window.innerWidth));
      canvas.width = Math.max(1, Math.round(window.innerWidth * s));
      canvas.height = Math.max(1, Math.round(window.innerHeight * s));
      gl.viewport(0, 0, canvas.width, canvas.height);
      gl.uniform2f(u.res, canvas.width, canvas.height);
      gl.uniform1f(u.aspect, window.innerWidth / Math.max(1, window.innerHeight));
      remeasure();
    };
    let secs: Float32Array<ArrayBuffer> = new Float32Array(2);
    const remeasure = () => { secs = measureSections(); gl.uniform2fv(u.sec, secs); gl.uniform1f(u.secN, secs.length / 2); };
    setQuality(); resize();
    const offTier = onTier((t) => { tier = t; scale = bgScale(t); setQuality(); resize(); });
    window.addEventListener("resize", resize);
    const ro = new ResizeObserver(() => remeasure()); ro.observe(document.body);
    const settle = setTimeout(remeasure, 1500);

    let lastDraw = -1;
    const draw = (t: number) => {
      gl.uniform1f(u.time, reducedMotion ? 40 : t);
      gl.uniform2f(u.mouse, frame.pointer.nx * 0.5 + 0.5, frame.pointer.ny * 0.5 + 0.5);
      gl.uniform2f(u.mouseV, frame.pointer.vx, frame.pointer.vy);
      gl.uniform1f(u.scroll, frame.scroll.y / Math.max(1, frame.vh));
      gl.uniform1f(u.scrollV, frame.scroll.v);
      gl.uniform1f(u.world, frame.world);
      gl.uniform1f(u.hero, frame.hero);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
    };
    const off = addTick((t) => {
      if (document.hidden) return;
      // under reduced motion, redraw only when something the shader reads has changed
      if (reducedMotion) {
        const key = frame.scroll.y * 1e-3 + frame.world * 7 + frame.hero * 13;
        if (key === lastDraw) return; lastDraw = key;
      }
      draw(t);
    });
    canvas.style.opacity = "1";

    return () => { off(); offTier(); ro.disconnect(); clearTimeout(settle); window.removeEventListener("resize", resize); };
  }, []);

  return <canvas ref={ref} aria-hidden className="pointer-events-none fixed inset-0 -z-10 h-[100lvh] w-full opacity-0 transition-opacity duration-1000" />;
}
