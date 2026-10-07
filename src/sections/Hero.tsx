import { lazy, Suspense, useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion, useMotionValue, useSpring, useTransform } from "motion/react";
import { useSite, type Product } from "../lib/store";
import { PRODUCTS } from "../lib/content";
import { frame } from "../lib/frame";
import { addTick, useLenis } from "../lib/motion";
import { Icon } from "../lib/icons";
import { isCoarse, reducedMotion } from "../lib/perf";
import { Button, SceneBoundary } from "../components/ui";
import { avoidRects, hitsMirror, mirrorRect, orbScreen, useHeroUI } from "../gl/heroBridge";

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

/* one product card in liquid glass: tilts toward the pointer, a highlight follows it, a sheen sweeps across */
function SwitchCard({ p, on, onPick }: { p: Product; on: boolean; onPick: () => void }) {
  const ref = useRef<HTMLButtonElement>(null);
  const rx = useMotionValue(0), ry = useMotionValue(0);
  const srx = useSpring(rx, { stiffness: 240, damping: 18 }), sry = useSpring(ry, { stiffness: 240, damping: 18 });
  const onMove = (e: React.PointerEvent) => {
    if (isCoarse || reducedMotion || !ref.current) return;
    const r = ref.current.getBoundingClientRect();
    const px = (e.clientX - r.left) / r.width, py = (e.clientY - r.top) / r.height;
    ry.set((px - 0.5) * 18); rx.set(-(py - 0.5) * 16);
    ref.current.style.setProperty("--mx", `${px * 100}%`); ref.current.style.setProperty("--my", `${py * 100}%`);
  };
  const reset = () => { rx.set(0); ry.set(0); };
  return (
    <motion.button ref={ref} type="button" role="radio" aria-checked={on} onClick={onPick} onPointerMove={onMove} onPointerLeave={reset}
      style={{ rotateX: srx, rotateY: sry, transformPerspective: 700 }}
      whileHover={reducedMotion ? undefined : { scale: 1.05, y: -4 }} whileTap={reducedMotion ? undefined : { scale: 0.95 }}
      transition={{ type: "spring", stiffness: 380, damping: 24 }}
      className={`no-press lg-glass group flex w-[10.25rem] flex-col items-center gap-1.5 overflow-hidden rounded-[1.7rem] px-3 pb-4 pt-4 text-center transition-[opacity,box-shadow,background-color] duration-500 ${on ? "lg-glass-dark shadow-[0_18px_50px_-18px_rgb(var(--accent)/0.8)]" : "opacity-75 hover:opacity-100"}`}>
      <span aria-hidden className="lg-spec" />
      <span aria-hidden className="lg-sheen" />
      <span className="transition-transform duration-500 ease-out-expo group-hover:-translate-y-0.5 group-hover:scale-[1.07]"><MiniMirror product={p} active={on} /></span>
      <span className="font-display text-[0.98rem] font-medium tracking-[-0.02em] text-ink">{PRODUCTS[p].name}</span>
      <span className="text-[0.7rem] leading-snug text-mute">{PRODUCTS[p].card}</span>
      {on && <motion.span layoutId="switch-ring" className="absolute inset-0 rounded-[1.7rem] border border-accent2/70" transition={{ type: "spring", stiffness: 300, damping: 30 }} />}
    </motion.button>
  );
}

function ProductSwitcher() {
  const product = useSite((s) => s.product);
  const setProduct = useSite((s) => s.setProduct);
  const toggle = useSite((s) => s.toggleProduct);
  return (
    <div data-avoid className="flex flex-col items-center gap-3">
      <div className="flex flex-col gap-3" role="radiogroup" aria-label="Choose a product">
        {(["beauty", "dev"] as Product[]).map((p) => <SwitchCard key={p} p={p} on={product === p} onPick={() => setProduct(p)} />)}
      </div>
      <div className="flex gap-2">
        <button type="button" onClick={toggle} aria-label="Previous product" className="lg-glass grid h-10 w-10 place-items-center rounded-full text-ink hover:bg-white/10"><Icon name="ChevronUp" size={16} /></button>
        <button type="button" onClick={toggle} aria-label="Next product" className="lg-glass grid h-10 w-10 place-items-center rounded-full text-ink hover:bg-white/10"><Icon name="ChevronDown" size={16} /></button>
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
  if (import.meta.env.DEV) Object.assign(window, { __orbScreen: orbScreen });
  const product = useSite((s) => s.product);
  const hovered = useHeroUI((s) => s.hovered), selected = useHeroUI((s) => s.selected);
  const setSelected = useHeroUI((s) => s.setSelected);
  const labels = useRef<(HTMLDivElement | null)[]>([]);
  const card = useRef<HTMLDivElement>(null);
  const all = [...PRODUCTS.beauty.features, ...PRODUCTS.dev.features];
  // With a mouse the card follows the pointer: it shows while the pointer is on the bubble or on the card
  // (a bridge joins the two, so the pointer can travel across) and goes as soon as it leaves both,
  // expanded or not. On touch screens a tap opens it and a tap elsewhere closes it.
  const fine = useMemo(() => typeof window !== "undefined" && window.matchMedia("(hover: hover) and (pointer: fine)").matches, []);
  const [cardHover, setCardHover] = useState(false);
  const holdCard = useRef(false); // the pointer is on the card: it stays put so its button can be pressed
  const [shown, setShown] = useState(-1);
  useEffect(() => {
    const now = !fine && selected >= 0 ? selected : hovered;
    if (now >= 0) { setShown(now); return; }
    if (cardHover) return;
    const id = window.setTimeout(() => setShown(-1), 90);
    return () => window.clearTimeout(id);
  }, [hovered, selected, cardHover, fine]);
  useEffect(() => { setShown(-1); setCardHover(false); }, [product]);
  const focus = shown;
  const [open, setOpen] = useState(false);
  useEffect(() => setOpen(false), [focus]);
  // with a mouse, clicking the bubble opens the detail instead of pinning the card
  useEffect(() => {
    if (!fine || selected < 0) return;
    if (selected === focus) setOpen(true);
    setSelected(-1);
  }, [selected, fine, focus, setSelected]);
  const bridge = useRef<HTMLDivElement>(null);

  const widths = useRef<number[]>([]);
  const side = useRef<number[]>([]);
  useEffect(() => addTick(() => {
    // labels only where they can be read: off the glass, inside the screen (and the band on phones), never on
    // another label. Each tries below its orb, then above; nearer orbs choose first.
    const placed: number[][] = [];
    const box = frame.heroBox, vw = window.innerWidth, banded = vw < 1024 && box.bottom > 0;
    // the copy, the switcher and the big phrase are off limits too
    const avoid = avoidRects; avoid.length = 0;
    if (frame.hero < 0.3) document.querySelectorAll<HTMLElement>("[data-avoid]").forEach((el) => {
      if (getComputedStyle(el).visibility === "hidden") return;
      const b = el.getBoundingClientRect(); if (b.width > 0 && b.height > 0) avoid.push([b.left - 6, b.top - 4, b.right + 6, b.bottom + 4]);
    });
    const hits = (r: number[], q: number[]) => r[0] < q[2] && r[2] > q[0] && r[1] < q[3] && r[3] > q[1];
    const beauty = useSite.getState().product === "beauty";
    const mine = (i: number) => (i < 7) === beauty;
    // a label never sits on a bubble either
    const onOrb = (r: number[], self: number) => {
      for (let j = 0; j < 14; j++) {
        if (j === self || !mine(j)) continue; const o = orbScreen[j]; if (o.alpha < 0.1 || o.r <= 1) continue;
        const cx = Math.max(r[0], Math.min(o.x, r[2])), cy = Math.max(r[1], Math.min(o.y, r[3]));
        if (Math.hypot(o.x - cx, o.y - cy) < o.r + 2) return true;
      }
      return false;
    };
    const order = Array.from({ length: 14 }, (_, i) => i).sort((a, b) => orbScreen[b].z - orbScreen[a].z);
    for (const i of order) {
      const el = labels.current[i]; if (!el) continue;
      const s = orbScreen[i];
      const onGlass = hitsMirror([s.x, s.y, s.x, s.y], 0);
      let a = onGlass || !mine(i) ? 0 : s.alpha * (1 - Math.min(1, frame.hero * 4));
      const w = widths.current[i] || (widths.current[i] = el.offsetWidth) || 80;
      let ly = s.y + s.r + 10, lx = s.x;
      if (a > 0.02) {
        const fits = (x: number, y: number) => {
          const r = [x - w / 2 - 6, y - 4, x + w / 2 + 6, y + 16];
          if (r[0] < 2 || r[2] > vw - 2 || r[1] < 72 || r[3] > window.innerHeight - 6) return null;
          if (banded && (r[3] > box.bottom || r[1] < box.top)) return null;
          if (hitsMirror(r) || placed.some((q) => hits(r, q)) || avoid.some((q) => hits(r, q)) || onOrb(r, i)) return null;
          return r;
        };
        // below, then above; if the glass is in the way, slide away from it a little.
        // Keep last frame's choice while it still fits, so labels don't hop as the orbs float.
        const yBelow = s.y + s.r + 10, yAbove = s.y - s.r - 22;
        const away = s.x < (mirrorRect.x0 + mirrorRect.x1) / 2 ? -1 : 1;
        const cand: [number, number, number][] = [];
        for (const dx of [0, 22, 44]) { cand.push([s.x + away * dx, yBelow, 1 + dx], [s.x + away * dx, yAbove, 100 + dx]); }
        const prev = side.current[i];
        cand.sort((p, q) => (p[2] === prev ? -1 : q[2] === prev ? 1 : 0));
        let r: number[] | null = null;
        for (const [x, y, id] of cand) { r = fits(x, y); if (r) { lx = x; ly = y; side.current[i] = id; break; } }
        if (r) placed.push(r); else { a = 0; side.current[i] = 0; }
      }
      el.style.opacity = String(a > 0.02 ? Math.min(1, a * 1.2) * (focus === i ? 0 : 1) : 0);
      el.style.transform = `translate3d(${lx}px, ${ly}px, 0) translateX(-50%)`;
    }
    if (card.current && focus >= 0 && !holdCard.current) {
      const s = orbScreen[focus]; const w = window.innerWidth;
      const left = s.x > w * 0.5;
      const cw = card.current.offsetWidth, ch = card.current.offsetHeight;
      let x = left ? s.x - s.r - 18 - cw : s.x + s.r + 18; x = Math.max(12, Math.min(w - cw - 12, x));
      let y = s.y - ch / 2; y = Math.max(76, Math.min(window.innerHeight - ch - 12, y));
      card.current.style.transform = `translate3d(${x}px, ${y}px, 0)`;
      // the bridge: an invisible strip from the card to the bubble's edge, so the pointer can cross the gap
      const b = bridge.current;
      if (b) {
        const reach = left ? s.x - s.r * 0.35 - (x + cw) : x - (s.x + s.r * 0.35);
        const top = s.y - s.r - y, h = s.r * 2;
        b.style.width = `${Math.max(0, reach)}px`; b.style.height = `${h}px`; b.style.top = `${top}px`;
        b.style.left = left ? `${cw}px` : `${-Math.max(0, reach)}px`;
      }
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
      <div ref={card} className="absolute left-0 top-0 w-[18.5rem]" style={{ visibility: f ? "visible" : "hidden" }}
        onPointerEnter={() => { holdCard.current = true; setCardHover(true); }} onPointerLeave={() => { holdCard.current = false; setCardHover(false); }}>
        {fine && <div ref={bridge} aria-hidden className={`absolute ${f ? "pointer-events-auto" : ""}`} />}
        <AnimatePresence>
          {f && (
            <motion.div key={focus} className="lg-glass lg-glass-deep pointer-events-auto overflow-hidden rounded-[1.6rem] p-5"
              onPointerMove={(e) => { const r = e.currentTarget.getBoundingClientRect(); e.currentTarget.style.setProperty("--mx", `${((e.clientX - r.left) / r.width) * 100}%`); e.currentTarget.style.setProperty("--my", `${((e.clientY - r.top) / r.height) * 100}%`); }}
              initial={{ opacity: 0, scale: 0.94, y: 6 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.96, transition: { duration: 0.15 } }} transition={{ duration: 0.32, ease }}>
              <span aria-hidden className="lg-spec" />
              <div className="flex items-center gap-3">
                <span className="grid h-10 w-10 flex-none place-items-center rounded-full bg-accent/25 text-accent2 shadow-[inset_0_1px_0_rgba(255,255,255,0.25)]"><Icon name={f.icon} size={19} /></span>
                <span className="font-display text-[1.15rem] font-medium leading-tight tracking-[-0.02em]">{f.label}</span>
              </div>
              <p className="mt-3 text-[0.9rem] leading-relaxed text-ink/90">{f.short}</p>
              <AnimatePresence initial={false}>
                {open && (
                  <motion.p key="more" className="text-[0.88rem] leading-relaxed text-ink/80" initial={{ height: 0, opacity: 0, marginTop: 0 }} animate={{ height: "auto", opacity: 1, marginTop: 10 }} exit={{ height: 0, opacity: 0, marginTop: 0 }} transition={{ duration: 0.35, ease }}>
                    {f.detail}
                  </motion.p>
                )}
              </AnimatePresence>
              <button type="button" onClick={() => { setOpen((v) => !v); if (!fine && selected < 0) setSelected(focus); }} aria-expanded={open}
                className="detail-btn mt-4 inline-flex h-10 items-center gap-2 rounded-full bg-white/[0.1] pl-4 pr-3 text-[0.86rem] font-medium text-ink ring-1 ring-accent2/50 hover:bg-white/[0.16]">
                {open ? "Show less" : "More detail"}
                <Icon name="ChevronDown" size={16} className={`text-accent2 transition-transform duration-300 ${open ? "rotate-180" : ""}`} />
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
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
      <motion.div key={product} initial="out" animate="in" exit="gone" className="max-w-[36rem]">
        <h1 data-avoid className="h-display w-fit text-[clamp(2.6rem,4.6vw,5.6rem)] text-ink">
          {[P.headline[0], P.headline[1]].map((line, i) => (
            <span key={i} className="block overflow-hidden pb-[0.08em]">
              <motion.span className={`block ${i === 1 ? "accent-word" : ""}`}
                variants={{ out: { y: "105%", filter: "blur(10px)" }, in: { y: "0%", filter: "blur(0px)", transition: { duration: 0.9, delay: 0.08 + i * 0.08, ease } }, gone: { y: "-60%", opacity: 0, filter: "blur(8px)", transition: { duration: 0.28, ease: [0.7, 0, 0.84, 0] } } }}>
                {line}
              </motion.span>
            </span>
          ))}
        </h1>
        <motion.p data-avoid className="body-lg mt-6 hidden max-w-[27rem] sm:block" variants={{ out: { opacity: 0, y: 12, filter: "blur(6px)" }, in: { opacity: 1, y: 0, filter: "blur(0px)", transition: { duration: 0.8, delay: 0.22, ease } }, gone: { opacity: 0, transition: { duration: 0.2 } } }}>
          {P.body}
        </motion.p>
        <motion.div data-avoid className="mt-6 flex w-fit flex-wrap gap-3 sm:mt-8" variants={{ out: { opacity: 0, y: 10 }, in: { opacity: 1, y: 0, transition: { duration: 0.7, delay: 0.32, ease } }, gone: { opacity: 0, transition: { duration: 0.15 } } }}>
          <Button variant="accent" icon="ArrowRight" lens onClick={() => lenis?.scrollTo("#demo", { duration: 1.6 })}>{P.cta}</Button>
          <Button variant="glass" className="hidden sm:inline-flex" onClick={toggle}>Meet {other.name}</Button>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

/* The big phrase, split around the mirror ("Guided [mirror] on you."), so the glass never hides a word.
   Each half hugs its side of the mirror and shrinks to fit the space there. */
function BigPhrase() {
  const product = useSite((s) => s.product);
  const P = PRODUCTS[product];
  const left = useRef<HTMLSpanElement>(null), right = useRef<HTMLSpanElement>(null);
  const [first, ...rest] = P.big[0].split(" ");
  useEffect(() => {
    const sm = { l: -1, r: -1 };
    return addTick((_t, dt) => {
      const L = left.current, R = right.current; if (!L || !R || mirrorRect.x1 <= 0) return;
      const q = mirrorRect.q, vw = window.innerWidth, y = L.getBoundingClientRect().top + L.offsetHeight * 0.55;
      // the glass's left and right edges at the phrase's height (corners: 0 bottom-left, 1 bottom-right, 2 top-right, 3 top-left)
      const at = (ax: number, ay: number, bx: number, by: number) => { const t = Math.max(0, Math.min(1, (y - ay) / ((by - ay) || 1))); return ax + (bx - ax) * t; };
      const xl = Math.min(at(q[0], q[1], q[6], q[7]), at(q[2], q[3], q[4], q[5]));
      const xr = Math.max(at(q[0], q[1], q[6], q[7]), at(q[2], q[3], q[4], q[5]));
      const k = sm.l < 0 ? 1 : 1 - Math.exp(-dt * 2.2);
      sm.l += (xl - sm.l) * k; sm.r += (xr - sm.r) * k;
      const gap = vw * 0.018, minX = vw * 0.05, maxX = vw * 0.965;
      const sl = Math.min(1, Math.max(0.35, (sm.l - gap - minX) / Math.max(1, L.offsetWidth)));
      const sr = Math.min(1, Math.max(0.35, (maxX - sm.r - gap) / Math.max(1, R.offsetWidth)));
      const sc = Math.min(sl, sr);
      L.style.transform = `translate3d(${sm.l - gap - L.offsetWidth}px, 0, 0) scale(${sc})`;
      R.style.transform = `translate3d(${sm.r + gap}px, 0, 0) scale(${sc})`;
      L.style.opacity = R.style.opacity = "1";
    });
  }, [product]);
  return (
    <div className="pointer-events-none absolute inset-x-0 bottom-[4svh] z-0 hidden select-none lg:block" aria-hidden>
      <AnimatePresence mode="wait">
        <motion.div key={product} className="relative h-[clamp(4.5rem,8vw,9rem)]"
          initial={{ opacity: 0, y: 30, filter: "blur(16px)" }} animate={{ opacity: 1, y: 0, filter: "blur(0px)", transition: { duration: 1.1, delay: 0.45, ease } }} exit={{ opacity: 0, y: -20, filter: "blur(12px)", transition: { duration: 0.3 } }}>
          <span ref={left} data-avoid className="h-display absolute left-0 top-0 origin-right whitespace-nowrap text-[clamp(4.5rem,8vw,9rem)] leading-[0.9] text-white/95 opacity-0">{first}</span>
          <span ref={right} data-avoid className="h-display absolute left-0 top-0 origin-left whitespace-nowrap text-[clamp(4.5rem,8vw,9rem)] leading-[0.9] text-white/95 opacity-0">{rest.join(" ")} <span className="accent-word">{P.big[1]}</span></span>
        </motion.div>
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
              <div ref={copyRef} className="pointer-events-auto absolute left-5 right-5 top-[calc(var(--nav-h)+1.25rem)] sm:left-8 lg:left-[5vw] lg:right-auto lg:top-[19svh]">
                <HeroCopy />
              </div>
              <div className="pointer-events-auto absolute right-[4vw] top-[calc(var(--nav-h)+1.5rem)] hidden lg:block">
                <ProductSwitcher />
              </div>
              <div ref={switchRef} className="pointer-events-auto absolute bottom-[max(1.25rem,env(safe-area-inset-bottom))] left-0 right-0 flex justify-center px-5 lg:hidden">
                <MobileSwitcher />
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
