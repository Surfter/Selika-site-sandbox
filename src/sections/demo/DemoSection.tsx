import { lazy, Suspense, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { ThinkingOrb } from "thinking-orbs";
import { useSite, type Product } from "../../lib/store";
import { PRODUCTS } from "../../lib/content";
import { Eyebrow, Reveal, SceneBoundary } from "../../components/ui";
import { isCoarse } from "../../lib/perf";
import { AskPill, Reply } from "./AskPill";
import { BeautyPanel, DevPanel } from "./Panels";
import { DevLayer } from "./DevLayer";
import { LIGHTS, STEPS, useDemo, type Region } from "./state";

const FaceScene = lazy(() => import("./FaceScene"));

const TIPS: Record<Exclude<Region, null>, string> = {
  brows: "Brows: start above the nose wing, arch through the centre of the eye, tail at the outer corner.",
  eyes: "Eyes: the liner hugs the lash line, and the wing follows the guide up toward the brow tail.",
  cheeks: "Cheeks: blush sits on the cheekbone and blends up toward the temple.",
  lips: "Lips: line first along the guide, then fill.",
  nose: "Selika maps the centre of your face first, so every other guide lines up.",
  skin: "Base and shade are checked in controlled 5000K light.",
};

function Tabs() {
  const product = useSite((s) => s.product);
  const setProduct = useSite((s) => s.setProduct);
  return (
    <div className="sg-glass relative inline-grid h-12 grid-cols-2 rounded-full p-1" role="tablist" aria-label="Demo product">
      {(["beauty", "dev"] as Product[]).map((p) => (
        <button key={p} type="button" role="tab" aria-selected={product === p} onClick={() => setProduct(p)} className="relative z-[1] min-w-[9rem] rounded-full px-5 text-[0.9rem] font-medium">
          {product === p && <motion.span layoutId="demo-tab" className="absolute inset-0 -z-[1] rounded-full bg-white" transition={{ type: "spring", stiffness: 380, damping: 32 }} />}
          <span className={product === p ? "text-night" : "text-ink/75"}>{PRODUCTS[p].name}</span>
        </button>
      ))}
    </div>
  );
}

function Mirror() {
  const product = useSite((s) => s.product);
  const ref = useRef<HTMLDivElement>(null);
  const [near, setNear] = useState(false);
  const [visible, setVisible] = useState(false);
  const [tip, setTip] = useState<{ r: Exclude<Region, null>; x: number; y: number } | null>(null);
  const step = useDemo((s) => s.step), light = useDemo((s) => s.light);
  useEffect(() => {
    const el = ref.current; if (!el) return;
    const ioNear = new IntersectionObserver(([e]) => { if (e.isIntersecting) setNear(true); }, { rootMargin: "150% 0px" });
    const ioVis = new IntersectionObserver(([e]) => setVisible(e.isIntersecting), { rootMargin: "80px 0px" });
    ioNear.observe(el); ioVis.observe(el);
    return () => { ioNear.disconnect(); ioVis.disconnect(); };
  }, []);
  const onHover = (r: Region, at?: { x: number; y: number }) => {
    useDemo.getState().set({ hover: r });
    if (!r || !at || !ref.current || product !== "beauty") { setTip(null); return; }
    const b = ref.current.getBoundingClientRect();
    setTip({ r, x: at.x - b.left, y: at.y - b.top });
  };
  const L = LIGHTS.find((l) => l.id === light)!;
  return (
    <div ref={ref} className="sg-glass relative mx-auto aspect-[4/5] w-full max-w-[36rem] rounded-[2.4rem] p-2.5">
      <div className="relative h-full w-full overflow-hidden rounded-[1.95rem] bg-[#07080d]">
        {/* the reflection; Selika Dev dims it and draws modules over it */}
        <motion.div className="absolute inset-0" animate={{ opacity: product === "dev" ? 0.28 : 1, filter: product === "dev" ? "saturate(0.35) brightness(0.8)" : "saturate(1) brightness(1)" }} transition={{ duration: 0.7 }}>
          {near && (
            <SceneBoundary fallback={<p className="absolute inset-x-8 top-1/2 -translate-y-1/2 text-center text-[0.9rem] leading-relaxed text-mute">The 3D face could not start in this browser (it needs WebGL). The steps, light and looks alongside still show what Selika Beauty guides.</p>}>
              <Suspense fallback={null}><FaceScene active={visible} onHover={onHover} /></Suspense>
            </SceneBoundary>
          )}
        </motion.div>
        {!near && <div className="absolute inset-0 grid place-items-center"><ThinkingOrb state="searching" size={64} theme="dark" /></div>}

        {/* status along the top of the glass */}
        <AnimatePresence mode="wait">
          {product === "beauty" ? (
            <motion.div key="b" className="pointer-events-none absolute inset-x-4 top-4 z-10 flex items-center justify-between font-mono text-[0.56rem] uppercase tracking-[0.14em] text-ink/80" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <span className="rounded-full bg-black/45 px-2.5 py-1 backdrop-blur">Step {Math.min(step + 1, 5)} of 5 · {STEPS[step].name}</span>
              <span className="rounded-full bg-black/45 px-2.5 py-1 backdrop-blur">{L.name} · {L.k}K</span>
            </motion.div>
          ) : null}
        </AnimatePresence>
        <AnimatePresence>{product === "dev" && <motion.div key="dev" className="absolute inset-0" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}><DevLayer /></motion.div>}</AnimatePresence>
        <Reply />

        {/* what the cursor is over */}
        <AnimatePresence>
          {tip && product === "beauty" && (
            <motion.div key={tip.r} className="sg-glass sg-glass-strong pointer-events-none absolute z-20 w-56 rounded-2xl p-3 text-[0.78rem] leading-snug text-ink/90"
              style={{ left: Math.min(tip.x + 16, (ref.current?.offsetWidth ?? 400) - 240), top: tip.y + 16 }}
              initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}>
              {TIPS[tip.r]}
            </motion.div>
          )}
        </AnimatePresence>

        <div className="absolute inset-x-0 bottom-4 z-20 flex justify-center px-4"><AskPill /></div>
      </div>
    </div>
  );
}

export function DemoSection() {
  const product = useSite((s) => s.product);
  return (
    <section id="demo" data-stream="1" className="relative py-24 md:py-32">
      <div className="wrap">
        <div className="flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
          <Reveal>
            <Eyebrow>Interactive demo · simulation</Eyebrow>
            <h2 className="h-section mt-5 text-[clamp(2.3rem,5.2vw,4.8rem)]"><span className="block">Try it on</span><span className="block accent-word">the glass.</span></h2>
          </Reveal>
          <Reveal delay={0.1} className="flex flex-col gap-4 lg:items-end">
            <Tabs />
            <p className="max-w-[26rem] text-[0.9rem] leading-relaxed text-mute lg:text-right">
              {product === "beauty"
                ? (isCoarse ? "Touch the face and it turns to you. Tap a feature for its guide, step through a look, and relight it." : "Move your cursor and the face follows it. Hover a feature for its guide, step through a look, and relight it.")
                : "Drag modules around the glass, change what each one may access, and swap the model behind them."}
            </p>
          </Reveal>
        </div>
        <div className="mt-12 grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,0.92fr)]">
          <Reveal><Mirror /></Reveal>
          <Reveal delay={0.08}>
            <div className="sg-glass rounded-[2rem] p-5 sm:p-7">
              <AnimatePresence mode="wait">
                <motion.div key={product} initial={{ opacity: 0, x: 18, filter: "blur(6px)" }} animate={{ opacity: 1, x: 0, filter: "blur(0px)" }} exit={{ opacity: 0, x: -14, filter: "blur(6px)", transition: { duration: 0.2 } }} transition={{ type: "spring", stiffness: 220, damping: 26 }}>
                  {product === "beauty" ? <BeautyPanel /> : <DevPanel />}
                </motion.div>
              </AnimatePresence>
            </div>
          </Reveal>
        </div>
        <p className="mt-6 max-w-[52rem] text-[0.78rem] leading-relaxed text-dim">
          A browser simulation of the planned products, with illustrative lighting values and sample data. The face is ICT-FaceKit's generic 3D model, not a real person. On the device, the guidance is drawn on your own reflection.
        </p>
      </div>
    </section>
  );
}
