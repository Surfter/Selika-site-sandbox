import { useEffect, useRef } from "react";
import gsap from "gsap";
import { ReactLenis, useLenis, type LenisRef } from "lenis/react";
import { frame } from "./frame";
import { reportFrame, reducedMotion } from "./perf";
import { useSite } from "./store";

/* ------------------------------------------------------------------
   One clock. GSAP's ticker runs first (its own tweens), then Lenis,
   then every registered per-frame callback (the
   background shader, the 3D scenes, DOM effects). Nothing on the page
   runs its own requestAnimationFrame.
   ------------------------------------------------------------------ */
type Tick = (t: number, dt: number) => void;
const ticks = new Set<Tick>();
export function addTick(fn: Tick) { ticks.add(fn); return () => { ticks.delete(fn); }; }
/** Run fn every frame while the component is mounted. */
export function useTick(fn: Tick, active = true) {
  const ref = useRef(fn); ref.current = fn;
  useEffect(() => { if (!active) return; return addTick((t, dt) => ref.current(t, dt)); }, [active]);
}

const LENIS_OPTIONS = { autoRaf: false, lerp: 0.1, smoothWheel: true, syncTouch: false, anchors: true, stopInertiaOnNavigate: true } as const;

function ScrollBridge() {
  useLenis((l) => {
    const y = l.scroll;
    frame.scroll.v += ((l.velocity / Math.max(1, frame.vh)) * 60 - frame.scroll.v) * 0.2;
    frame.scroll.y = y;
  });
  return null;
}

/** Mount once at the root: smooth scroll, pointer tracking, the world colour and the shared clock. */
export function MotionDriver() {
  const lenisRef = useRef<LenisRef>(null);

  useEffect(() => {
    const p = frame.pointer;
    let lastX = 0, lastY = 0, lastT = performance.now();
    const onMove = (e: PointerEvent) => {
      const now = performance.now();
      const w = window.innerWidth, h = window.innerHeight;
      p.x = e.clientX; p.y = e.clientY;
      p.tx = (e.clientX / w) * 2 - 1; p.ty = -((e.clientY / h) * 2 - 1);
      const dtm = Math.max(8, now - lastT);
      if (p.seen) { p.vx += (((e.clientX - lastX) / w) * (1000 / dtm) - p.vx) * 0.3; p.vy += ((-(e.clientY - lastY) / h) * (1000 / dtm) - p.vy) * 0.3; }
      lastX = e.clientX; lastY = e.clientY; lastT = now; p.seen = true; p.touch = e.pointerType === "touch";
    };
    const onResize = () => { frame.vw = window.innerWidth; frame.vh = window.innerHeight; };
    window.addEventListener("pointermove", onMove, { passive: true });
    window.addEventListener("pointerdown", onMove, { passive: true });
    window.addEventListener("resize", onResize, { passive: true });

    // the world colour follows the product with a soft, slightly slow ease
    const unsub = useSite.subscribe((s, prev) => {
      if (s.product !== prev.product) {
        frame.worldTarget = s.product === "dev" ? 1 : 0;
        gsap.to(frame, { world: frame.worldTarget, duration: reducedMotion ? 0.01 : 1.15, ease: "power2.inOut", overwrite: true });
      }
    });

    let last = performance.now();
    const tick = (time: number) => {
      const now = performance.now();
      const dt = Math.min(0.05, (now - last) / 1000); last = now;
      reportFrame(dt * 1000);
      frame.time = time; frame.dt = dt;
      const k = 1 - Math.exp(-dt * 7.5);
      p.nx += (p.tx - p.nx) * k; p.ny += (p.ty - p.ny) * k;
      const decay = Math.exp(-dt * 3); p.vx *= decay; p.vy *= decay;
      lenisRef.current?.lenis?.raf(time * 1000);
      if (!lenisRef.current?.lenis) frame.scroll.y = window.scrollY;
      frame.scroll.v *= Math.exp(-dt * 4);
      ticks.forEach((fn) => fn(time, dt));
    };
    gsap.ticker.add(tick);
    gsap.ticker.lagSmoothing(0);
    return () => {
      gsap.ticker.remove(tick); unsub();
      window.removeEventListener("pointermove", onMove); window.removeEventListener("pointerdown", onMove); window.removeEventListener("resize", onResize);
    };
  }, []);

  return (
    <>
      <ReactLenis root options={LENIS_OPTIONS} ref={lenisRef} />
      <ScrollBridge />
    </>
  );
}

/** Smoothly scroll to an anchor or y position through Lenis (falls back to native). */
export function scrollToTarget(target: string | number, lenis?: { scrollTo: (t: string | number, o?: object) => void }) {
  if (lenis) lenis.scrollTo(target, { duration: 1.4, easing: (t: number) => 1 - Math.pow(1 - t, 4) });
  else if (typeof target === "number") window.scrollTo({ top: target, behavior: "smooth" });
  else document.querySelector(target)?.scrollIntoView({ behavior: "smooth" });
}
export { useLenis };
