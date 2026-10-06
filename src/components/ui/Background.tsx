import { useCallback, useState } from "react";
import { motion } from "framer-motion";
import { useReducedMotion } from "../../lib/hooks";
import { Aurora } from "./Aurora";

type Orb = { size: number; x: string; y: string; from: string; to: string; dur: number; dx: number; dy: number };
const ORBS: Orb[] = [
  { size: 620, x: "-8%",  y: "6%",  from: "rgba(77,141,255,0.30)",  to: "rgba(77,141,255,0)",  dur: 34, dx: 120, dy: 80 },
  { size: 520, x: "62%",  y: "-4%", from: "rgba(176,124,255,0.26)", to: "rgba(176,124,255,0)", dur: 40, dx: -90, dy: 110 },
  { size: 440, x: "72%",  y: "58%", from: "rgba(142,197,255,0.22)", to: "rgba(142,197,255,0)", dur: 30, dx: -70, dy: -90 },
  { size: 380, x: "10%",  y: "66%", from: "rgba(139,124,255,0.22)", to: "rgba(139,124,255,0)", dur: 36, dx: 100, dy: -60 },
];

/** The light behind everything: the aurora, or the old drifting orbs if WebGL is unavailable. */
export function Background() {
  const reduce = useReducedMotion();
  const [glFailed, setGlFailed] = useState(false);
  const fail = useCallback(() => setGlFailed(true), []);
  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 -z-10 overflow-hidden" style={{ background: "var(--bg)" }}>
      {glFailed ? ORBS.map((o, i) => (
        <motion.div
          key={i}
          className="absolute rounded-full"
          style={{
            width: o.size, height: o.size, left: o.x, top: o.y,
            background: `radial-gradient(circle at 50% 50%, ${o.from}, ${o.to} 70%)`,
            filter: "blur(40px)", willChange: "transform",
          }}
          animate={reduce ? undefined : { x: [0, o.dx, -o.dx * 0.5, 0], y: [0, o.dy, -o.dy * 0.6, 0] }}
          transition={{ duration: o.dur, repeat: Infinity, ease: "easeInOut" }}
        />
      )) : <Aurora reduce={reduce} onFail={fail} />}
      {/* fine grain so the gradients don't band */}
      <div className="absolute inset-0 opacity-[0.045]"
        style={{ backgroundImage: "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='160' height='160'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/></filter><rect width='100%' height='100%' filter='url(%23n)' opacity='1'/></svg>\")" }} />
    </div>
  );
}
