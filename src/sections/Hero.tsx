import { lazy, Suspense, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { useSite, type Product } from "../lib/store";
import { PRODUCTS } from "../lib/content";
import { frame } from "../lib/frame";
import { addTick, useLenis } from "../lib/motion";
import { Icon } from "../lib/icons";
import { isCoarse, reducedMotion } from "../lib/perf";
import { Button, Eyebrow, SceneBoundary } from "../components/ui";
import { hitsMirror, orbScreen, useHeroUI } from "../gl/heroBridge";

const HeroScene = lazy(() => import("../gl/HeroScene"));
const ease = [0.16, 1, 0.3, 1] as const;

/* a tiny drawing of each product, for the switcher cards */
function MiniMirror({ product, active }: { product: Product; active: boolean }) {
  const c = product === "beauty" ? "#B9A9FF" : "#8EC5FF";
  return (
    <svg viewBox="0 0 60 82" className="h-[4.6rem] w-auto" aria-hidden>
      <rect x="3" y="3" width="54" height="76" rx="11" fill="#0d0f18" stroke={active ? c : "rgba(255,255,255,.25)"} strokeWidth={active ? 2 : 1.4} />
      {product === "beauty" ? (
        <g stroke={c} strokeWidth="1.6" fill="none" strokeLinecap="round" opacity={active ? 1 : 0.6}>
          <ellipse cx="30" cy="36" rx="13" ry="17" strokeDasharray="2 3" opacity=".6" />
          <path d="M21 30 q4 -3 8 -1 M31 29 q4 -2 8 1" />
          <path d="M23 47 q7 4 14 0" strokeDasharray="3 2" />
          <rect x="11" y="62" width="38" height="8" rx="4" fill={c} stroke="none" opacity=".35" />
        </g>
      ) : (
        <g fill={c} opacity={active ? 1 : 0.6}>
          <rect x="10" y="12" width="18" height="12" rx="3" opacity=".9" />
          <rect x="32" y="12" width="18" height="12" rx="3" opacity=".45" />
          <rect x="10" y="28" width="40" height="14" rx="3" opacity=".3" />
          <rect x="10" y="46" width="40" height="22" rx="3" opacity=".18" />
          <rect x="14" y="52" width="20" height="2.5" rx="1.2" opacity=".9" />
          <rect x="14" y="58" width="28" height="2.5" rx="1.2" opacity=".6" />
        </g>
      )}
    </svg>
  );
}

/* shown in place of the 3D mirror if WebGL is unavailable */
function StaticMirror() {
  const product = useSite((s) => s.product);
  return (
    <div className="absolute inset-0 grid place-items-center pt-[22svh] lg:pl-[18vw] lg:pt-0" aria-hidden>
      <div className="sg-glass sg-glass-strong rounded-[2.6rem] p-6 [&_svg]:h-[38svh]"><MiniMirror product={product} active /></div>
    </div>
  );
}

function ProductSwitcher() {
  const product = useSite((s) => s.product);
  const setProduct = useSite((s) => s.setProduct);
  const toggle = useSite((s) => s.toggleProduct);
  return (
    <div className="flex flex-col items-end gap-3">
      <div className="flex gap-3" role="radiogroup" aria-label="Choose a product">
        {(["beauty", "dev"] as Product[]).map((p) => {
          const on = product === p;
          return (
            <button key={p} type="button" role="radio" aria-checked={on} onClick={() => setProduct(p)}
              className={`group relative flex w-[9.4rem] flex-col items-center gap-2 rounded-[1.6rem] px-3 pb-3.5 pt-4 text-center transition-all duration-500 ease-out-expo ${on ? "sg-glass sg-glass-strong sg-lens" : "sg-glass sg-glass-strong opacity-70 hover:opacity-100"}`}
              style={{ transform: on ? "translateY(-4px)" : undefined }}>
              <MiniMirror product={p} active={on} />
              <span className="font-display text-[0.98rem] font-medium tracking-[-0.02em] text-ink">{PRODUCTS[p].name}</span>
              <span className="text-[0.7rem] leading-snug text-mute">{PRODUCTS[p].card}</span>
              {on && <motion.span layoutId="switch-ring" className="absolute inset-0 rounded-[1.6rem] border border-accent2/60" transition={{ type: "spring", stiffness: 300, damping: 30 }} />}
            </button>
          );
        })}
      </div>
      <div className="flex gap-2">
        <button type="button" onClick={toggle} aria-label="Previous product" className="sg-glass grid h-10 w-10 place-items-center rounded-full text-ink hover:bg-white/10"><Icon name="ArrowLeft" size={16} /></button>
        <button type="button" onClick={toggle} aria-label="Next product" className="sg-glass grid h-10 w-10 place-items-center rounded-full text-ink hover:bg-white/10"><Icon name="ArrowRight" size={16} /></button>
      </div>
    </div>
  );
}

function MobileSwitcher() {
  const product = useSite((s) => s.product);
  const setProduct = useSite((s) => s.setProduct);
  return (
    <div className="sg-glass relative grid h-12 w-full max-w-[22rem] grid-cols-2 rounded-full p-1" role="radiogroup" aria-label="Choose a product">
      {(["beauty", "dev"] as Product[]).map((p) => (
        <button key={p} type="button" role="radio" aria-checked={product === p} onClick={() => setProduct(p)} className="relative z-[1] rounded-full text-[0.9rem] font-medium">
          {product === p && <motion.span layoutId="m-switch" className="absolute inset-0 -z-[1] rounded-full bg-white" transition={{ type: "spring", stiffness: 380, damping: 32 }} />}
          <span className={product === p ? "text-night" : "text-ink/80"}>{PRODUCTS[p].name}</span>
        </button>
      ))}
    </div>
  );
}

/* labels under each orb, and the feature card for the hovered or selected one */
function OrbOverlay() {
  const product = useSite((s) => s.product);
  const hovered = useHeroUI((s) => s.hovered), selected = useHeroUI((s) => s.selected);
  const setSelected = useHeroUI((s) => s.setSelected);
  const labels = useRef<(HTMLDivElement | null)[]>([]);
  const card = useRef<HTMLDivElement>(null);
  const focus = selected >= 0 ? selected : hovered;
  const all = [...PRODUCTS.beauty.features, ...PRODUCTS.dev.features];
  const [flipped, setFlipped] = useState(false);
  useEffect(() => setFlipped(selected >= 0), [selected]);

  const widths = useRef<number[]>([]);
  const side = useRef<number[]>([]);
  useEffect(() => addTick(() => {
    // labels only where they can be read: off the glass, inside the screen (and the band on phones), never on
    // another label. Each tries below its orb, then above; nearer orbs choose first.
    const placed: number[][] = [];
    const box = frame.heroBox, vw = window.innerWidth, banded = vw < 1024 && box.bottom > 0;
    const order = Array.from({ length: 14 }, (_, i) => i).sort((a, b) => orbScreen[b].z - orbScreen[a].z);
    for (const i of order) {
      const el = labels.current[i]; if (!el) continue;
      const s = orbScreen[i];
      const onGlass = hitsMirror([s.x, s.y, s.x, s.y], 0);
      let a = onGlass ? 0 : s.alpha * (1 - Math.min(1, frame.hero * 4));
      const w = widths.current[i] || (widths.current[i] = el.offsetWidth) || 80;
      let ly = s.y + s.r + 10;
      if (a > 0.02) {
        const fits = (y: number) => {
          const r = [s.x - w / 2 - 6, y - 4, s.x + w / 2 + 6, y + 16];
          if (r[0] < 2 || r[2] > vw - 2 || r[1] < 72 || r[3] > window.innerHeight - 6) return null;
          if (banded && (r[3] > box.bottom || r[1] < box.top)) return null;
          if (hitsMirror(r) || placed.some((q) => r[0] < q[2] && r[2] > q[0] && r[1] < q[3] && r[3] > q[1])) return null;
          return r;
        };
        // keep last frame's choice while it still fits, so labels don't hop as the orbs float
        const yBelow = ly, yAbove = s.y - s.r - 22;
        const tries = side.current[i] === 2 ? [yAbove, yBelow] : [yBelow, yAbove];
        let r: number[] | null = null;
        for (const y of tries) { r = fits(y); if (r) { ly = y; break; } }
        if (r) { placed.push(r); side.current[i] = ly === yAbove ? 2 : 1; } else { a = 0; side.current[i] = 0; }
      }
      el.style.opacity = String(a > 0.02 ? Math.min(1, a * 1.2) * (focus === i ? 0 : 1) : 0);
      el.style.transform = `translate3d(${s.x}px, ${ly}px, 0) translateX(-50%)`;
    }
    if (card.current && focus >= 0) {
      const s = orbScreen[focus]; const w = window.innerWidth;
      const left = s.x > w * 0.5;
      const cw = card.current.offsetWidth, ch = card.current.offsetHeight;
      let x = left ? s.x - s.r - 18 - cw : s.x + s.r + 18; x = Math.max(12, Math.min(w - cw - 12, x));
      let y = s.y - ch / 2; y = Math.max(76, Math.min(window.innerHeight - ch - 12, y));
      card.current.style.transform = `translate3d(${x}px, ${y}px, 0)`;
    }
  }), [focus]);

  const f = focus >= 0 ? all[focus] : null;
  return (
    <div className="pointer-events-none absolute inset-0 z-30">
      {all.map((ft, i) => (
        <div key={ft.id + i} ref={(el) => { labels.current[i] = el; }} className="absolute left-0 top-0 whitespace-nowrap font-mono text-[0.62rem] uppercase tracking-[0.14em] text-ink/75 opacity-0 transition-opacity duration-300" aria-hidden>
          {ft.label}
        </div>
      ))}
      <AnimatePresence>
        {f && (
          <motion.div key={focus} ref={card} className="pointer-events-auto absolute left-0 top-0 w-[17.5rem] [perspective:1200px]"
            initial={{ opacity: 0, scale: 0.94, filter: "blur(8px)" }} animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }} exit={{ opacity: 0, scale: 0.96, filter: "blur(6px)", transition: { duration: 0.18 } }} transition={{ duration: 0.35, ease }}>
            <button type="button" onClick={() => (selected >= 0 ? setFlipped((v) => !v) : setSelected(focus))} aria-label={`${f.label}: ${flipped ? "show summary" : "show detail"}`}
              className="relative grid w-full text-left [transform-style:preserve-3d] transition-transform duration-700 ease-in-out-quart" style={{ transform: flipped ? "rotateY(180deg)" : "none" }}>
              <div className="sg-glass sg-glass-strong rounded-3xl p-5 [backface-visibility:hidden] [grid-area:1/1]">
                <div className="flex items-center gap-3">
                  <span className="grid h-9 w-9 place-items-center rounded-full bg-accent/20 text-accent2"><Icon name={f.icon} size={18} /></span>
                  <span className="font-display text-[1.1rem] font-medium tracking-[-0.02em]">{f.label}</span>
                </div>
                <p className="mt-3 text-[0.88rem] leading-relaxed text-ink/85">{f.short}</p>
                <p className="mt-3 font-mono text-[0.6rem] uppercase tracking-[0.16em] text-mute">{isCoarse ? "Tap" : "Click"} for more</p>
              </div>
              <div className="sg-glass sg-glass-strong rounded-3xl p-5 [backface-visibility:hidden] [grid-area:1/1] [transform:rotateY(180deg)]">
                <p className="eyebrow mb-2">{f.label}</p>
                <p className="text-[0.86rem] leading-relaxed text-ink/90">{f.detail}</p>
              </div>
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* the product's copy, swapped with a soft blur when the product changes */
function HeroCopy() {
  const product = useSite((s) => s.product);
  const toggle = useSite((s) => s.toggleProduct);
  const P = PRODUCTS[product];
  const other = PRODUCTS[product === "beauty" ? "dev" : "beauty"];
  const lenis = useLenis();
  return (
    <AnimatePresence mode="wait">
      <motion.div key={product} initial="out" animate="in" exit="gone" className="max-w-[34rem]">
        <motion.div variants={{ out: { opacity: 0, y: 10 }, in: { opacity: 1, y: 0, transition: { duration: 0.6, ease } }, gone: { opacity: 0, y: -8, transition: { duration: 0.2 } } }}>
          <Eyebrow>{P.eyebrow}</Eyebrow>
        </motion.div>
        <h1 className="h-display mt-5 text-[clamp(2.6rem,5.5vw,6rem)] text-ink">
          {[P.headline[0], P.headline[1]].map((line, i) => (
            <span key={i} className="block overflow-hidden pb-[0.08em]">
              <motion.span className={`block ${i === 1 ? "accent-word" : ""}`}
                variants={{ out: { y: "105%", filter: "blur(10px)" }, in: { y: "0%", filter: "blur(0px)", transition: { duration: 0.9, delay: 0.08 + i * 0.08, ease } }, gone: { y: "-60%", opacity: 0, filter: "blur(8px)", transition: { duration: 0.28, ease: [0.7, 0, 0.84, 0] } } }}>
                {line}
              </motion.span>
            </span>
          ))}
        </h1>
        <motion.p className="body-lg mt-6 hidden max-w-[27rem] sm:block" variants={{ out: { opacity: 0, y: 12, filter: "blur(6px)" }, in: { opacity: 1, y: 0, filter: "blur(0px)", transition: { duration: 0.8, delay: 0.22, ease } }, gone: { opacity: 0, transition: { duration: 0.2 } } }}>
          {P.body}
        </motion.p>
        <motion.div className="mt-6 flex flex-wrap gap-3 sm:mt-8" variants={{ out: { opacity: 0, y: 10 }, in: { opacity: 1, y: 0, transition: { duration: 0.7, delay: 0.32, ease } }, gone: { opacity: 0, transition: { duration: 0.15 } } }}>
          <Button variant="accent" icon="ArrowRight" lens onClick={() => lenis?.scrollTo("#demo", { duration: 1.6 })}>{P.cta}</Button>
          <Button variant="glass" className="hidden sm:inline-flex" onClick={toggle}>Meet {other.name}</Button>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

function BigPhrase() {
  const product = useSite((s) => s.product);
  const P = PRODUCTS[product];
  return (
    <div className="pointer-events-none absolute bottom-[7svh] right-[4vw] z-0 hidden select-none text-right lg:block" aria-hidden>
      <AnimatePresence mode="wait">
        <motion.p key={product} className="h-display text-[clamp(4.5rem,10.5vw,11.5rem)] leading-[0.86] text-white/95"
          initial={{ opacity: 0, y: 30, filter: "blur(16px)" }} animate={{ opacity: 1, y: 0, filter: "blur(0px)", transition: { duration: 1.1, delay: 0.45, ease } }} exit={{ opacity: 0, y: -20, filter: "blur(12px)", transition: { duration: 0.3 } }}>
          {P.big[0]} <span className="accent-word">{P.big[1]}</span>
        </motion.p>
      </AnimatePresence>
    </div>
  );
}

export function Hero() {
  const wrap = useRef<HTMLDivElement>(null);
  const fade = useRef<HTMLDivElement>(null);
  const stage = useRef<HTMLDivElement>(null);
  const copyRef = useRef<HTMLDivElement>(null);
  const switchRef = useRef<HTMLDivElement>(null);

  // on portrait screens the mirror sits in the band between the copy and the switcher
  useEffect(() => {
    const measure = () => {
      const c = copyRef.current, sw = switchRef.current; if (!c || c.offsetHeight < 80) return;
      frame.heroBox.top = c.offsetTop + c.offsetHeight;
      frame.heroBox.bottom = sw && sw.offsetParent ? sw.offsetTop : window.innerHeight;
    };
    const ro = new ResizeObserver(measure);
    if (copyRef.current) ro.observe(copyRef.current);
    if (switchRef.current) ro.observe(switchRef.current);
    window.addEventListener("resize", measure); measure();
    return () => { ro.disconnect(); window.removeEventListener("resize", measure); };
  }, []);
  const [active, setActive] = useState(true);
  const entered = useSite((s) => s.entered);
  const lenis = useLenis();

  // the dive: progress through the tall wrapper drives frame.hero
  useEffect(() => addTick(() => {
    const el = wrap.current; if (!el) return;
    const r = el.getBoundingClientRect();
    const span = Math.max(1, r.height - window.innerHeight);
    frame.hero = Math.min(1, Math.max(0, -r.top / span));
    const h = frame.hero;
    if (fade.current) {
      const o = 1 - Math.min(1, h / 0.22);
      fade.current.style.opacity = String(o);
      fade.current.style.filter = o < 1 ? `blur(${(1 - o) * 12}px)` : "none";
      fade.current.style.visibility = o <= 0.001 ? "hidden" : "visible";
    }
    if (stage.current) stage.current.style.opacity = String(1 - Math.min(1, Math.max(0, (h - 0.84) / 0.13)));
  }), []);
  useEffect(() => {
    const io = new IntersectionObserver(([e]) => setActive(e.isIntersecting), { rootMargin: "100px" });
    if (wrap.current) io.observe(wrap.current);
    return () => io.disconnect();
  }, []);

  return (
    <div ref={wrap} id="top" data-stream="0" className="relative h-[190svh] md:h-[220svh]">
      <div className="sticky top-0 h-[100svh] overflow-hidden">
        {/* the phrase sits behind the mirror */}
        <div ref={fade} className="absolute inset-0">
          <BigPhrase />
        </div>
        <div ref={stage} className="absolute inset-0 z-10">
          <SceneBoundary fallback={<StaticMirror />}><Suspense fallback={null}><HeroScene active={active} /></Suspense></SceneBoundary>
        </div>
        <OrbOverlay />
        <motion.div className="pointer-events-none absolute inset-0 z-20" initial={{ opacity: 0 }} animate={{ opacity: entered ? 1 : 0 }} transition={{ duration: 1.1, delay: 0.2, ease }}>
          <div ref={undefined} className="h-full w-full">
            <HeroFade>
              {/* copy: top left on desktop, top on phones */}
              <div ref={copyRef} className="pointer-events-auto absolute left-5 right-5 top-[calc(var(--nav-h)+1.25rem)] sm:left-8 lg:left-[5vw] lg:right-auto lg:top-[24svh]">
                <HeroCopy />
              </div>
              <div className="pointer-events-auto absolute right-[4vw] top-[calc(var(--nav-h)+2.5rem)] hidden lg:block">
                <ProductSwitcher />
              </div>
              <div ref={switchRef} className="pointer-events-auto absolute bottom-[max(1.25rem,env(safe-area-inset-bottom))] left-0 right-0 flex justify-center px-5 lg:hidden">
                <MobileSwitcher />
              </div>
              <div className="pointer-events-auto absolute bottom-[4.5svh] left-[5vw] hidden items-center gap-4 lg:flex">
                <button type="button" onClick={() => lenis?.scrollTo("#problem", { duration: 1.8 })} aria-label="Scroll down" className="sg-glass grid h-12 w-12 place-items-center rounded-2xl text-ink hover:bg-white/10">
                  <motion.span animate={reducedMotion ? undefined : { y: [0, 3, 0] }} transition={{ duration: 2.2, repeat: Infinity, ease: "easeInOut" }}><Icon name="ChevronDown" size={18} /></motion.span>
                </button>
                <div className="font-mono text-[0.62rem] uppercase leading-[1.6] tracking-[0.16em] text-mute">
                  <div className="text-ink/90">One mirror · Two products</div>
                  <div>Concept stage · prototype specified</div>
                </div>
              </div>
            </HeroFade>
          </div>
        </motion.div>
      </div>
    </div>
  );
}

/* the copy fades and blurs away as the dive begins */
function HeroFade({ children }: { children: React.ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => addTick(() => {
    const el = ref.current; if (!el) return;
    const o = 1 - Math.min(1, frame.hero / 0.18);
    el.style.opacity = String(o);
    el.style.filter = o < 1 && o > 0 ? `blur(${(1 - o) * 10}px)` : "none";
    el.style.visibility = o <= 0.001 ? "hidden" : "visible";
  }), []);
  return <div ref={ref} className="h-full w-full">{children}</div>;
}
