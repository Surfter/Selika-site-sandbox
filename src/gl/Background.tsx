import { useEffect, useRef } from "react";
import { BG_FRAG, BG_VERT } from "./backgroundShader";
import { frame } from "../lib/frame";
import { addTick } from "../lib/motion";
import { bgScale, getTier, onTier, reducedMotion, type Tier } from "../lib/perf";

/* The aurora's zigzag: legs that run from one margin to the other and back, all the way down the
   page, each at a gentle slope (steeper on narrow screens, where the page is taller than it is wide).
   [first turn (page y, viewport heights), leg height (vh), left turn x, right turn x] */
function zigzag(vw: number, vh: number): [number, number, number, number] {
  const aspect = vw / Math.max(1, vh);
  const xl = vw < 640 ? 0.08 : 0.06, xr = 1 - xl;
  const deg = aspect >= 1.15 ? 30 : aspect >= 0.8 ? 38 : 50;
  return [0.85, ((xr - xl) * vw * Math.tan((deg * Math.PI) / 180)) / Math.max(1, vh), xl, xr];
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
    const u = { res: U("uRes"), time: U("uTime"), drift: U("uDrift"), mouse: U("uMouse"), scroll: U("uScroll"), world: U("uWorld"), hero: U("uHero"), aspect: U("uAspect"), oct: U("uOct"), aur: U("uAur"), aurW: U("uAurW"), css: U("uCss"), zig: U("uZig") };

    let tier: Tier = getTier();
    let scale = bgScale(tier);
    const setQuality = () => {
      gl.uniform1f(u.oct, tier === "high" ? 5 : tier === "mid" ? 4 : 3);
      gl.uniform1f(u.aur, matchMedia("(prefers-reduced-transparency: reduce)").matches ? 0.6 : 1);
    };
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
      gl.uniform4f(u.zig, ...zigzag(window.innerWidth, window.innerHeight));
    };
    setQuality(); resize();
    const offTier = onTier((t) => { tier = t; scale = bgScale(t); setQuality(); resize(); });
    window.addEventListener("resize", resize);

    // calm inputs: time is integrated (never jumps), the cursor is followed slowly
    let drift = 0, last = -1, mx = 0.5, my = 0.5;
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
      gl.uniform1f(u.time, t);
      gl.uniform1f(u.drift, drift + 40);
      gl.uniform2f(u.mouse, mx, my);
      gl.uniform1f(u.scroll, sv);
      gl.uniform1f(u.world, frame.world);
      gl.uniform1f(u.hero, frame.hero);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
    });
    canvas.style.opacity = "1";

    return () => { off(); offTier(); window.removeEventListener("resize", resize); };
  }, []);

  return <canvas ref={ref} aria-hidden className="pointer-events-none fixed inset-0 -z-10 h-[100lvh] w-full opacity-0 transition-opacity duration-1000" />;
}
