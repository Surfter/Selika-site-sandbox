import { useEffect, useRef, useState } from "react";
import gsap from "gsap";
import { useSite } from "../lib/store";
import { reducedMotion } from "../lib/perf";
import { mirrorRect } from "../gl/heroBridge";
import { Mark } from "./ui";

/* The mirror's light ring counts the page in. When it is full, the ring opens out into the
   outline of the mirror itself, the night behind it lifts to show the page, and the outline
   hands over to the mirror's own light as the glass powers on (the hero takes it from there).
   It waits for fonts and the hero scene's code, with a short minimum so the count reads, and a
   cap so it never stalls. */

type P = [number, number];
const K = 0.5523; // cubic Bezier arc constant: four corners with r = half the side make a circle

/* a closed outline through four corners (clockwise from top left), each rounded with radius r */
function roundedQuad(c: P[], r: number) {
  const len = (a: P, b: P) => Math.hypot(b[0] - a[0], b[1] - a[1]);
  const minSide = Math.min(len(c[0], c[1]), len(c[1], c[2]), len(c[2], c[3]), len(c[3], c[0]));
  const R = Math.min(r, minSide / 2);
  const dir = (a: P, b: P): P => { const l = len(a, b) || 1; return [(b[0] - a[0]) / l, (b[1] - a[1]) / l]; };
  const pts = c.map((p, i) => {
    const u = dir(c[(i + 3) % 4], p), v = dir(p, c[(i + 1) % 4]);
    const A: P = [p[0] - R * u[0], p[1] - R * u[1]], B: P = [p[0] + R * v[0], p[1] + R * v[1]];
    return { A, B, c1: [A[0] + K * R * u[0], A[1] + K * R * u[1]] as P, c2: [B[0] - K * R * v[0], B[1] - K * R * v[1]] as P };
  });
  const f = (p: P) => `${p[0].toFixed(1)} ${p[1].toFixed(1)}`;
  let d = `M${f(pts[0].B)}`;
  for (let i = 1; i <= 4; i++) { const q = pts[i % 4]; d += ` L${f(q.A)} C${f(q.c1)} ${f(q.c2)} ${f(q.B)}`; }
  return d + " Z";
}
const ring = (cx: number, cy: number, r: number): P[] => [[cx - r, cy - r], [cx + r, cy - r], [cx + r, cy + r], [cx - r, cy + r]];

export function Preloader() {
  const enter = useSite((s) => s.enter);
  const [done, setDone] = useState(false);
  const [n, setN] = useState(0);
  const target = useRef(0.15);
  const root = useRef<HTMLDivElement>(null), night = useRef<HTMLDivElement>(null), center = useRef<HTMLDivElement>(null);
  const line = useRef<SVGPathElement>(null), track = useRef<SVGPathElement>(null);
  const [vp] = useState(() => ({ w: window.innerWidth, h: window.innerHeight }));
  const R0 = 46;

  useEffect(() => {
    const t0 = performance.now();
    let raf = 0, cur = 0, last = performance.now(), opened = false;
    const ready = Promise.all([
      document.fonts?.ready ?? Promise.resolve(),
      import("../gl/HeroScene").then(() => { target.current = Math.max(target.current, 0.8); }),
    ]);
    ready.then(() => { target.current = 1; });

    const open = () => {
      if (opened) return; opened = true;
      const vw = window.innerWidth, vh = window.innerHeight;
      const q = mirrorRect.q, w = mirrorRect.x1 - mirrorRect.x0, h = mirrorRect.y1 - mirrorRect.y0;
      const seen = w > 60 && h > 60 && mirrorRect.x0 > -vw && mirrorRect.x1 < vw * 2;
      if (reducedMotion || !seen || !line.current) {
        enter();
        gsap.to(root.current, { opacity: 0, duration: reducedMotion ? 0.01 : 0.6, ease: "power2.inOut", onComplete: () => setDone(true) });
        return;
      }
      // from the ring at the centre to the glass's four corners on screen (its quad: 0 bl, 1 br, 2 tr, 3 tl)
      const from = ring(vw / 2, vh / 2, R0), to: P[] = [[q[6], q[7]], [q[4], q[5]], [q[2], q[3]], [q[0], q[1]]];
      const rEnd = Math.min(w, h) * 0.12, m = { p: 0 };
      const draw = () => {
        const e = m.p, c = from.map((a, i) => [a[0] + (to[i][0] - a[0]) * e, a[1] + (to[i][1] - a[1]) * e] as P);
        line.current?.setAttribute("d", roundedQuad(c, R0 + (rEnd - R0) * e));
      };
      gsap.timeline({ onComplete: () => setDone(true) })
        .to(center.current, { opacity: 0, scale: 0.85, duration: 0.28, ease: "power2.in" }, 0)
        .to(track.current, { opacity: 0, duration: 0.3 }, 0)
        .to(m, { p: 1, duration: 0.95, ease: "expo.inOut", onUpdate: draw }, 0.05)
        .call(() => enter(), [], 0.42)
        .to(night.current, { opacity: 0, duration: 0.85, ease: "power2.inOut" }, 0.45)
        .to(line.current, { opacity: 0, duration: 0.7, ease: "power1.out" }, 1.0);
    };

    const loop = () => {
      const now = performance.now(); const dt = Math.min(0.1, (now - last) / 1000); last = now;
      const elapsed = now - t0;
      const cap = reducedMotion ? 1 : Math.min(1, elapsed / 1150); // never faster than ~1.1 s
      const goal = elapsed > 6000 ? 1 : Math.min(target.current, cap); // and never stuck past 6 s
      cur += (goal - cur) * (1 - Math.exp(-dt * 7));
      if (goal >= 1 && cur > 0.995) cur = 1;
      setN(cur);
      if (cur >= 1) { setTimeout(open, reducedMotion ? 0 : 140); return; }
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [enter]);

  if (done) return null;
  const d0 = roundedQuad(ring(vp.w / 2, vp.h / 2, R0), R0);
  return (
    <div ref={root} className="pointer-events-none fixed inset-0 z-[60]" role="status" aria-label="Loading selika">
      <div ref={night} className="pointer-events-auto absolute inset-0 bg-night" />
      <svg className="absolute inset-0 h-full w-full" viewBox={`0 0 ${vp.w} ${vp.h}`} preserveAspectRatio="none" aria-hidden>
        <path ref={track} d={d0} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="1.5" />
        <path ref={line} d={d0} fill="none" stroke="rgb(var(--accent2))" strokeWidth="2" strokeLinecap="round" pathLength={1}
          strokeDasharray={`${Math.min(1, n)} 1`} style={{ filter: "drop-shadow(0 0 6px rgb(var(--accent2) / 0.8))" }} />
      </svg>
      <div ref={center} className="absolute inset-0 grid place-items-center">
        <div className="relative grid place-items-center">
          <Mark size={30} className="text-accent2" />
          <div className="absolute top-[4.6rem] whitespace-nowrap font-display text-[0.8rem] font-medium tracking-[0.08em] text-mute tabular">{Math.round(n * 100)}%</div>
        </div>
      </div>
    </div>
  );
}
