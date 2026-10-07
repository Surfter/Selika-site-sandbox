import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { useSite } from "../lib/store";
import { reducedMotion } from "../lib/perf";
import { Mark } from "./ui";

/* The mirror's light ring counts the page in, then the whole thing folds
   away toward the logo. It waits for fonts and the hero scene's code, with
   a short minimum so the count reads, and a cap so it never stalls. */
export function Preloader() {
  const enter = useSite((s) => s.enter);
  const [done, setDone] = useState(false);
  const [n, setN] = useState(0);
  const target = useRef(0.15);

  useEffect(() => {
    const t0 = performance.now();
    const ready = Promise.all([
      document.fonts?.ready ?? Promise.resolve(),
      import("../gl/HeroScene").then(() => { target.current = Math.max(target.current, 0.8); }),
    ]);
    ready.then(() => { target.current = 1; });
    let raf = 0, cur = 0, last = performance.now();
    const loop = () => {
      const now = performance.now(); const dt = Math.min(0.1, (now - last) / 1000); last = now;
      const elapsed = now - t0;
      const cap = reducedMotion ? 1 : Math.min(1, elapsed / 1150); // never faster than ~1.1 s
      const goal = elapsed > 6000 ? 1 : Math.min(target.current, cap); // and never stuck past 6 s
      cur += (goal - cur) * (1 - Math.exp(-dt * 7));
      if (goal >= 1 && cur > 0.995) cur = 1;
      setN(cur);
      if (cur >= 1) { setTimeout(() => { setDone(true); enter(); }, reducedMotion ? 0 : 160); return; }
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [enter]);

  const R = 46, C = 2 * Math.PI * R;
  return (
    <AnimatePresence>
      {!done && (
        <motion.div className="fixed inset-0 z-[60] grid place-items-center bg-night" role="status" aria-label="Loading selika"
          exit={{ opacity: 0, transition: { duration: 0.75, delay: 0.25, ease: [0.7, 0, 0.3, 1] } }}>
          <motion.div className="relative grid place-items-center" exit={{ scale: 0.22, x: "-42vw", y: "-44vh", opacity: 0, transition: { duration: 0.9, ease: [0.7, 0, 0.2, 1] } }}>
            <svg width="132" height="132" viewBox="0 0 120 120" className="-rotate-90" aria-hidden>
              <circle cx="60" cy="60" r={R} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="1.5" />
              <circle cx="60" cy="60" r={R} fill="none" stroke="rgb(var(--accent2))" strokeWidth="2" strokeLinecap="round" strokeDasharray={C} strokeDashoffset={C * (1 - n)} />
            </svg>
            <div className="absolute grid place-items-center text-ink">
              <Mark size={30} className="text-accent2" />
            </div>
            <div className="absolute top-[9.2rem] font-display text-[0.8rem] font-medium tracking-[0.08em] text-mute tabular">{Math.round(n * 100)}%</div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
