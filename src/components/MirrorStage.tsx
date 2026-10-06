import { AnimatePresence, animate, motion, useAnimationFrame, useMotionValue, useScroll, useTransform, type MotionValue } from "framer-motion";
import { useEffect, useLayoutEffect, useRef, useState, type ReactNode } from "react";
import { ChevronDown } from "lucide-react";
import { useIsDesktop, useReducedMotion } from "../lib/hooks";
import { springFor } from "../lib/physics";
import { GlassButton, GlassChip, GlassSwitch } from "./ui/Glass";
import { Logo, Mark } from "./Logo";
import { DemoControls, DemoFace, DemoFooter, useDemoState, type DemoState, type Mode, type Sub } from "./demo/Demo";

const ease = [0.22, 1, 0.36, 1] as const;

/* ============================================================
   The horizon: a blue arc of light at the foot of the hero.
   ============================================================ */
function Horizon({ opacity }: { opacity?: MotionValue<number> }) {
  return (
    <motion.div aria-hidden className="pointer-events-none absolute inset-x-0 bottom-0 h-[70vh] overflow-hidden" style={{ opacity }}>
      {/* the atmosphere glow, drawn as a gradient halo: a large blurred box-shadow here
          renders with a hard horizontal seam on retina screens */}
      <div className="absolute left-1/2 top-[58%] h-[140vh] w-[170vw] rounded-[50%]"
        style={{
          transform: "translateX(-50%) scale(1.3)",
          background: "radial-gradient(closest-side, rgba(77,141,255,0) 76.6%, rgba(160,206,255,0.62) 76.9%, rgba(142,197,255,0.45) 78.6%, rgba(77,141,255,0.27) 82%, rgba(77,141,255,0.12) 88%, rgba(77,141,255,0.035) 95%, rgba(77,141,255,0) 100%)",
        }} />
      <div className="absolute left-1/2 top-[58%] h-[140vh] w-[170vw] -translate-x-1/2 rounded-[50%]"
        style={{
          background: "radial-gradient(ellipse at 50% 0%, rgba(142,197,255,0.55) 0%, rgba(77,141,255,0.35) 12%, rgba(139,124,255,0.18) 28%, rgba(5,6,10,0) 52%)",
          boxShadow: "0 -2px 0 0 rgba(200,228,255,0.9)",
        }} />
      <div className="absolute left-1/2 top-[58%] h-[140vh] w-[170vw] -translate-x-1/2 rounded-[50%]" style={{ background: "var(--bg)", transform: "translate(-50%, 6px)" }} />
    </motion.div>
  );
}

/* ============================================================
   What the mirror shows before it becomes the demo.
   ============================================================ */
const WORDS = ["reflect", "understand", "act"];
/* Nudges the lockup off the geometric centre so the ink, not the boxes, sits centred. */
const LOCK_NUDGE = "0px";
function HeroFace() {
  const [i, setI] = useState(0);
  useEffect(() => { const id = setInterval(() => setI((n) => (n + 1) % WORDS.length), 2400); return () => clearInterval(id); }, []);
  return (
    <div className="absolute inset-0 flex items-center justify-center">
      {[1, 2, 3].map((r) => (
        <motion.div key={r} aria-hidden className="absolute rounded-full border border-sky/20"
          style={{ width: `${34 + r * 22}%`, aspectRatio: "1" }}
          animate={{ scale: [1, 1.08, 1], opacity: [0.35, 0.7, 0.35] }} transition={{ duration: 5 + r, repeat: Infinity, ease: "easeInOut", delay: r * 0.6 }} />
      ))}
      {/* The rings stay on the face's centre; the lockup is its own group so that
          what gets centred is the ink rather than three boxes full of leading. */}
      <div className="relative flex flex-col items-center" style={{ transform: `translateY(${LOCK_NUDGE})` }}>
        <Mark tight size="clamp(3.4rem, 8.2vw, 6rem)" />
        <div className="mt-[clamp(1.9rem,4.5vw,3.4rem)] flex"><Logo size="xl" glint /></div>
        <div className="mt-[0.9rem] h-7 overflow-hidden text-[0.95rem] font-medium tracking-[0.22em] uppercase text-mute pl-[0.22em]">
        <AnimatePresence mode="wait">
          <motion.div key={WORDS[i]} initial={{ y: 22, opacity: 0, filter: "blur(4px)" }} animate={{ y: 0, opacity: 1, filter: "blur(0px)" }} exit={{ y: -22, opacity: 0, filter: "blur(4px)" }} transition={{ duration: 0.55, ease }}>
            {WORDS[i]}
          </motion.div>
        </AnimatePresence>
        </div>
      </div>
    </div>
  );
}

/* ============================================================
   The glass slab. Front face carries the content, a thin edge
   gives it depth when it turns, and a glint sweeps across it.
   ============================================================ */
function Slab({ hero, back, demo, heroOpacity, demoOpacity, footer, footerOpacity, footerHeight }:
  { hero: ReactNode; back?: ReactNode; demo: ReactNode; heroOpacity: MotionValue<number> | number; demoOpacity: MotionValue<number> | number; footer?: ReactNode; footerOpacity?: MotionValue<number> | number; footerHeight?: MotionValue<number> | number }) {
  const reduce = useReducedMotion();
  return (
    <div className="relative h-full w-full" style={{ transformStyle: "preserve-3d" }}>
      {/* edge / thickness: only reads when the slab is turned */}
      <div className="absolute inset-0 rounded-[28px]" style={{ transform: "translateZ(-10px)", background: "linear-gradient(160deg, rgba(142,197,255,0.22), rgba(139,124,255,0.18))" }} />
      {/* back face: the same face again, so the slab reads the same from either side */}
      <div className="absolute inset-0 rounded-[28px] glass glass-strong overflow-hidden" style={{ position: "absolute", transform: "rotateY(180deg) translateZ(1px)", backfaceVisibility: "hidden", background: "linear-gradient(135deg, rgba(20,24,40,0.86), rgba(12,14,24,0.92))" }}>
        <div className="absolute inset-2 overflow-hidden rounded-[20px]" style={{ background: "#07080D" }}>{back}</div>
        <div className="pointer-events-none absolute inset-2 rounded-[20px]" style={{ boxShadow: "inset 0 0 0 1.5px rgba(142,197,255,0.35), inset 0 0 28px -6px rgba(139,124,255,0.6)" }} />
      </div>
      {/* front face */}
      <div className="absolute inset-0 flex flex-col rounded-[28px] glass glass-strong overflow-hidden" style={{ position: "absolute", backfaceVisibility: "hidden", background: "linear-gradient(135deg, rgba(20,24,40,0.86), rgba(12,14,24,0.92))", boxShadow: "inset 0 1px 0 rgba(255,255,255,0.22), 0 0 0 1px rgba(142,197,255,0.25), 0 0 80px -12px rgba(77,141,255,0.55), 0 40px 90px -30px rgba(0,0,0,0.9)" }}>
        <div className="relative w-full min-h-0 flex-1">
          <div className="absolute inset-2 overflow-hidden rounded-[20px]" style={{ background: "#07080D" }}>
            <motion.div className="absolute inset-0" style={{ opacity: heroOpacity }}>{hero}</motion.div>
            <motion.div className="absolute inset-0" style={{ opacity: demoOpacity }}>{demo}</motion.div>
          </div>
          {/* rim light */}
          <div className="pointer-events-none absolute inset-2 rounded-[20px]" style={{ boxShadow: "inset 0 0 0 1.5px rgba(142,197,255,0.35), inset 0 0 28px -6px rgba(139,124,255,0.6)" }} />
          {/* glint */}
          {!reduce && (
            <motion.div aria-hidden className="pointer-events-none absolute -inset-1/2"
              style={{ background: "linear-gradient(115deg, transparent 42%, rgba(255,255,255,0.13) 50%, transparent 58%)" }}
              animate={{ x: ["-60%", "60%"] }} transition={{ duration: 4.5, repeat: Infinity, repeatDelay: 3, ease: "easeInOut" }} />
          )}
        </div>
        {footer && <motion.div className="flex-none overflow-hidden" style={{ opacity: footerOpacity ?? 1, height: footerHeight ?? 126 }}>{footer}</motion.div>}
      </div>
    </div>
  );
}

/* ============================================================
   Demo header (mode + sub switches)
   ============================================================ */
function DemoHeader({ s }: { s: DemoState }) {
  return (
    <div className="flex flex-col items-center gap-3">
      <GlassSwitch<Mode> id="mode" value={s.mode} onChange={s.setMode} options={[{ value: "product", label: "Selika Beauty" }, { value: "dev", label: "Selika Dev" }]} />
      <div className="min-h-9">
        <AnimatePresence mode="wait">
          {s.mode === "product" ? (
            <motion.div key="subs" className="flex flex-wrap justify-center gap-2" initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.25 }}>
              {([["hud", "Guidance"], ["tx", "Try-on"], ["env", "Light"]] as [Sub, string][]).map(([v, l]) => (
                <GlassChip key={v} active={s.sub === v} onClick={() => s.setSub(v)}>{l}</GlassChip>
              ))}
            </motion.div>
          ) : (
            <motion.p key="devnote" className="text-[0.72rem] uppercase tracking-[0.2em] text-dim" initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }}>Platform · looks, modules, agents, your own systems</motion.p>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

/* ============================================================
   Hero copy
   ============================================================ */
function HeroCopy({ style }: { style?: React.CSSProperties | any }) {
  return (
    <motion.div className="relative z-10 mx-auto flex max-w-4xl flex-col items-center px-5 text-center" style={style}>
      {/* a soft shade behind the copy, so the aurora never competes with the words */}
      <div aria-hidden className="pointer-events-none absolute -inset-x-12 -inset-y-10 -z-10" style={{ background: "radial-gradient(closest-side, rgba(5,6,10,0.5), rgba(5,6,10,0.28) 55%, rgba(5,6,10,0))" }} />
      <h1 className="h-display text-[clamp(2.6rem,6.6vw,5.4rem)] text-ink" aria-label="From reflection to interaction.">
        {["From", "reflection", "to"].map((w, i) => (
          <span key={w} className="inline-block overflow-hidden align-bottom pb-[0.08em] -mb-[0.08em]">
            <motion.span className="inline-block" initial={{ y: "105%", opacity: 0 }} animate={{ y: "0%", opacity: 1 }} transition={{ duration: 0.95, ease, delay: 0.45 + i * 0.07 }}>{w}&nbsp;</motion.span>
          </span>
        ))}
        <span className="inline-block overflow-hidden align-bottom pb-[0.08em] -mb-[0.08em]">
          <motion.span className="inline-block text-gradient" initial={{ y: "105%", opacity: 0 }} animate={{ y: "0%", opacity: 1 }} transition={{ duration: 0.95, ease, delay: 0.68 }}>interaction.</motion.span>
        </span>
      </h1>
      <motion.p className="mt-5 max-w-xl text-[clamp(0.95rem,1.4vw,1.1rem)] leading-relaxed text-mute"
        initial={{ opacity: 0, y: 16, filter: "blur(6px)" }} animate={{ opacity: 1, y: 0, filter: "blur(0px)" }} transition={{ duration: 0.9, ease, delay: 0.95 }}>
        Two products, one mirror. <span className="text-ink">Selika Beauty</span> guides your makeup on your own reflection, in light it controls. <span className="text-ink">Selika Dev</span> opens the same glass to anyone who wants to build on it.
      </motion.p>
      <motion.div className="mt-6 flex flex-wrap justify-center gap-3" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.9, ease, delay: 1.15 }}>
        <GlassButton primary href="#demo">Try the demo</GlassButton>
        <GlassButton href="#hardware">Why hardware</GlassButton>
      </motion.div>
    </motion.div>
  );
}

/* ============================================================
   DESKTOP: hero and demo share one mirror. Scroll carries it
   from the hero into the demo, unwinding its spin on the way.
   ============================================================ */
type Rect = { x: number; y: number; w: number; h: number };
const rectOf = (el: HTMLElement | null): Rect => { const r = el?.getBoundingClientRect(); return r ? { x: r.left, y: r.top, w: r.width, h: r.height } : { x: 0, y: 0, w: 1, h: 1 }; };

function StageDesktop({ s }: { s: DemoState }) {
  const reduce = useReducedMotion();
  const wrapRef = useRef<HTMLDivElement>(null);
  const heroSlot = useRef<HTMLDivElement>(null);
  const demoSlot = useRef<HTMLDivElement>(null);
  const rects = useRef<{ hero: Rect; demo: Rect }>({ hero: { x: 0, y: 0, w: 1, h: 1 }, demo: { x: 0, y: 0, w: 1, h: 1 } });
  const [, bump] = useState(0);

  useLayoutEffect(() => {
    const measure = () => { rects.current = { hero: rectOf(heroSlot.current), demo: rectOf(demoSlot.current) }; bump((n) => n + 1); };
    measure();
    const ro = new ResizeObserver(measure); if (wrapRef.current) ro.observe(wrapRef.current);
    window.addEventListener("resize", measure);
    const t = setTimeout(measure, 300);
    return () => { ro.disconnect(); window.removeEventListener("resize", measure); clearTimeout(t); };
  }, []);

  const { scrollYProgress: p } = useScroll({ target: wrapRef, offset: ["start start", "end end"] });
  /* phase: 0-0.30 hero, 0.30-0.60 transition, 0.60-1 demo */
  const q = useTransform(p, [0.3, 0.6], [0, 1]);

  /* spin runs while the hero is up, then unwinds to zero through the transition */
  const spin = useMotionValue(-22);
  useAnimationFrame((_, dt) => { if (reduce) return; if (p.get() < 0.3) spin.set(spin.get() + (dt / 1000) * 20); });
  const rotateY = useTransform([spin, q], ([a, k]) => { let d = (a as number) % 360; if (d > 180) d -= 360; if (d < -180) d += 360; return d * (1 - (k as number)); });
  const rotateX = useTransform(q, [0, 1], [7, 0]);

  const left = useTransform(q, (k) => { const { hero: h, demo: d } = rects.current; return (h.x + h.w / 2) * (1 - k) + (d.x + d.w / 2) * k - d.w / 2; });
  const top = useTransform(q, (k) => { const { hero: h, demo: d } = rects.current; return (h.y + h.h / 2) * (1 - k) + (d.y + d.h / 2) * k - d.h / 2; });
  const scale = useTransform(q, (k) => { const { hero: h, demo: d } = rects.current; const hs = h.w / d.w; return hs * (1 - k) + 1 * k; });
  const width = rects.current.demo.w, height = rects.current.demo.h;

  const heroCopyOpacity = useTransform(p, [0.12, 0.34], [1, 0]);
  const heroCopyY = useTransform(p, [0.12, 0.34], [0, -70]);
  const horizonOpacity = useTransform(p, [0.2, 0.5], [1, 0.25]);
  const heroFace = useTransform(q, [0.25, 0.6], [1, 0]);
  const demoFace = useTransform(q, [0.4, 0.75], [0, 1]);
  const footerOpacity = useTransform(q, [0.55, 0.9], [0, 1]);
  const footerHeight = useTransform(q, [0.4, 0.85], [0, 126]);
  /* developer mode needs no temperature track, so the glass takes that room back */
  const modeF = useMotionValue(1);
  useEffect(() => { animate(modeF, s.mode === "dev" ? 0.42 : 1, springFor(0.5, 1)); }, [s.mode, modeF]);
  const footerH = useTransform([footerHeight, modeF], ([h, f]) => (h as number) * (f as number));
  const controlsOpacity = useTransform(q, [0.6, 1], [0, 1]);
  const controlsX = useTransform(q, [0.6, 1], [60, 0]);
  const headerOpacity = useTransform(q, [0.5, 0.9], [0, 1]);
  const headerY = useTransform(q, [0.5, 0.9], [-18, 0]);
  const hintOpacity = useTransform(p, [0.0, 0.08, 0.2], [1, 1, 0]);
  const endHint = useTransform(p, [0.88, 0.98], [0, 1]);
  const controlsPE = useTransform(q, (k) => (k > 0.85 ? "auto" : "none"));
  const heroPE = useTransform(p, (v) => (v < 0.22 ? "auto" : "none"));

  return (
    <div ref={wrapRef} id="top" className="relative" style={{ height: "300vh" }}>
      {/* anchor target: landing here puts the mirror fully in its demo position */}
      <div id="demo" aria-hidden className="absolute left-0 top-[52%] h-px w-px" />
      <div className="sticky top-0 h-screen overflow-hidden">
        <Horizon opacity={horizonOpacity} />

        {/* ---- hero layer ---- */}
        <motion.div className="absolute inset-0" style={{ pointerEvents: heroPE }}>
          {/* where the mirror lives while the hero is up */}
          {/* The slab's top edge lines up with the headline's cap height, not its line box,
              so the two read as sitting on the same line. Aspect matches the demo slot, or
              the shared-element scale would not land the top where it is measured. */}
          <div ref={heroSlot} aria-hidden className="absolute" style={{ left: "clamp(2rem, 9vw, 10rem)", top: "calc(15vh + 1.2rem)", width: "min(40vh, 22rem)", aspectRatio: "4 / 5.9" }} />
          <div className="absolute inset-0 flex items-start justify-center pt-[17vh]" style={{ paddingLeft: "calc(min(40vh, 22rem) + clamp(2rem, 9vw, 10rem) + 2.5rem)" }}>
            <HeroCopy style={{ opacity: heroCopyOpacity, y: heroCopyY }} />
          </div>
          <motion.div className="absolute bottom-7 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1 text-[0.66rem] uppercase tracking-[0.2em] text-dim" style={{ opacity: hintOpacity }}>
            <span>Scroll</span><motion.span animate={{ y: [0, 5, 0] }} transition={{ duration: 1.6, repeat: Infinity, ease: "easeInOut" }}><ChevronDown size={14} /></motion.span>
          </motion.div>
        </motion.div>

        {/* ---- demo layer ---- */}
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center pt-24 pb-6">
          <motion.div className="mb-5" style={{ opacity: headerOpacity, y: headerY, pointerEvents: controlsPE }}><DemoHeader s={s} /></motion.div>
          <div className="wrap grid grid-cols-[minmax(0,0.92fr)_minmax(0,1fr)] items-start gap-12">
            <div className="flex justify-center">
              <div ref={demoSlot} aria-hidden style={{ width: "min(46vh, 25rem)", aspectRatio: "4 / 5.9" }} />
            </div>
            <motion.div className="max-h-[calc(100vh-12rem)] overflow-y-auto pb-4 pr-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden" style={{ opacity: controlsOpacity, x: controlsX, pointerEvents: controlsPE }}><DemoControls s={s} /></motion.div>
          </div>
          <motion.div className="absolute bottom-5 right-8 flex items-center gap-2 text-[0.66rem] uppercase tracking-[0.2em] text-dim" style={{ opacity: endHint }}>
            Keep scrolling <ChevronDown size={14} />
          </motion.div>
        </div>

        {/* ---- the mirror ---- */}
        <motion.div className="absolute z-20" style={{ left, top, width, height, scale, rotateY, rotateX, transformPerspective: 1500, transformStyle: "preserve-3d", willChange: "transform" }}>
          <Slab hero={<HeroFace />} back={<HeroFace />} demo={<DemoFace s={s} />} heroOpacity={heroFace} demoOpacity={demoFace} footer={<DemoFooter s={s} />} footerOpacity={footerOpacity} footerHeight={footerH} />
        </motion.div>
      </div>
    </div>
  );
}

/* ============================================================
   MOBILE / NARROW: the same pieces, stacked, no scroll pinning.
   ============================================================ */
function StageStacked({ s }: { s: DemoState }) {
  const reduce = useReducedMotion();
  const fh = useMotionValue(126);
  useEffect(() => { animate(fh, s.mode === "dev" ? 53 : 126, springFor(0.5, 1)); }, [s.mode, fh]);
  const spin = useMotionValue(-18);
  useAnimationFrame((_, dt) => { if (!reduce) spin.set(spin.get() + (dt / 1000) * 22); });
  const rotateY = useTransform(spin, (a) => a % 360);
  return (
    <>
      <section id="top" className="relative flex min-h-[100svh] flex-col items-center overflow-hidden pt-28 pb-16">
        <Horizon />
        <HeroCopy />
        <motion.div className="relative z-10 mt-12" style={{ width: "min(66vw, 17rem)", aspectRatio: "4 / 5.9", rotateY, rotateX: 7, transformPerspective: 1200, transformStyle: "preserve-3d" }}>
          <Slab hero={<HeroFace />} back={<HeroFace />} demo={null} heroOpacity={1} demoOpacity={0} />
        </motion.div>
      </section>
      <section id="demo" className="relative pt-16 pb-20">
        <div className="wrap flex flex-col items-center gap-6">
          <DemoHeader s={s} />
          <div style={{ width: "min(88vw, 24rem)", aspectRatio: "4 / 5.9" }}>
            <Slab hero={null} back={<HeroFace />} demo={<DemoFace s={s} />} heroOpacity={0} demoOpacity={1} footer={<DemoFooter s={s} />} footerHeight={fh} />
          </div>
          <div className="w-full max-w-lg"><DemoControls s={s} /></div>
        </div>
      </section>
    </>
  );
}

export function MirrorStage() {
  const s = useDemoState();
  const desktop = useIsDesktop();
  return desktop ? <StageDesktop s={s} /> : <StageStacked s={s} />;
}
