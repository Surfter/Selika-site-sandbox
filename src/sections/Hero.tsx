import { lazy, Suspense, useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion, useMotionValue, useSpring, useTransform } from "motion/react";
import { useSite, type Product } from "../lib/store";
import { PRODUCTS } from "../lib/content";
import { frame } from "../lib/frame";
import { addTick, useLenis } from "../lib/motion";
import { Icon } from "../lib/icons";
import { isCoarse, reducedMotion } from "../lib/perf";
import { Button, SceneBoundary } from "../components/ui";
import { avoidRects, hitsMirror, mirrorRect, orbHide, orbScreen, useHeroUI } from "../gl/heroBridge";

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

/* Labels under each orb, and the orb's own card. Hovering a bubble (tapping it on a touch screen) makes the
   bubble itself swell and morph into its card, on a soft spring; the card rides along with the bubble's float
   and drift, and the moment the pointer leaves the card it folds straight back into the bubble. Everything
   here is driven per frame from the shared clock (no React renders while it moves). */
type Shell = { m: number; v: number; mh: number; vh: number; c: number; open: boolean; live: boolean; dx: number; dy: number; ch: number; armed: boolean };
const CARD_W = 296, CARD_R = 25.6;
const sstep = (a: number, b: number, x: number) => { const t = Math.max(0, Math.min(1, (x - a) / (b - a))); return t * t * (3 - 2 * t); };

function OrbOverlay() {
  if (import.meta.env.DEV) Object.assign(window, { __orbScreen: orbScreen });
  const product = useSite((s) => s.product);
  const selected = useHeroUI((s) => s.selected);
  const setSelected = useHeroUI((s) => s.setSelected);
  const labels = useRef<(HTMLDivElement | null)[]>([]);
  const shells = useRef<(HTMLDivElement | null)[]>([]);
  const bodies = useRef<(HTMLDivElement | null)[]>([]);
  const icons = useRef<(HTMLSpanElement | null)[]>([]);
  const glints = useRef<(HTMLSpanElement | null)[]>([]);
  const all = [...PRODUCTS.beauty.features, ...PRODUCTS.dev.features];
  const fine = useMemo(() => typeof window !== "undefined" && window.matchMedia("(hover: hover) and (pointer: fine)").matches, []);
  const st = useRef<Shell[]>(Array.from({ length: 14 }, () => ({ m: 0, v: 0, mh: 0, vh: 0, c: 0, open: false, live: false, dx: 0, dy: 0, ch: 0, armed: true })));
  const rects = useRef<number[][]>(Array.from({ length: 14 }, () => [0, 0, 0, 0]));
  const openRef = useRef(-1);
  if (import.meta.env.DEV) Object.assign(window, { __shells: st, __shellRects: rects });
  const [openIdx, setOpenIdx] = useState(-1);   // which card is interactive (for React: pointer events, aria, its detail)
  const [detail, setDetail] = useState(-1);

  const openShell = (i: number) => {
    const cur = openRef.current; if (cur === i) return;
    if (cur >= 0) st.current[cur].open = false;
    const S = st.current[i], s = orbScreen[i];
    // the card grows away from the mirror, from the bubble's own place, and keeps that offset from it as it floats
    const out = s.x < (mirrorRect.x0 + mirrorRect.x1) / 2 ? -1 : 1, pad = 10;
    if (!S.live) { S.dx = out < 0 ? s.r + pad - CARD_W : -s.r - pad; S.dy = -s.r - pad; }
    S.open = true; S.live = true; openRef.current = i; setOpenIdx(i); setDetail(-1);
  };
  const closeShell = (i: number) => {
    const S = st.current[i]; S.open = false; S.armed = false;
    if (openRef.current === i) { openRef.current = -1; setOpenIdx(-1); }
  };

  // touch screens: a tap on a bubble opens its card, a tap elsewhere closes it
  useEffect(() => {
    if (fine) return;
    const cur = openRef.current;
    const mine = (i: number) => (i < 7) === (useSite.getState().product === "beauty");
    if (selected >= 0 && mine(selected)) openShell(selected);
    else if (cur >= 0) closeShell(cur);
  }, [selected, fine]); // eslint-disable-line react-hooks/exhaustive-deps
  // a product switch folds every card away at once
  useEffect(() => {
    st.current.forEach((S, i) => { S.open = false; S.m = S.mh = S.c = S.v = S.vh = 0; S.live = false; S.armed = true; orbHide[i] = 0; const el = shells.current[i]; if (el) el.style.visibility = "hidden"; });
    openRef.current = -1; setOpenIdx(-1); setDetail(-1);
  }, [product]);

  const widths = useRef<number[]>([]);
  const side = useRef<number[]>([]);
  useEffect(() => addTick((_t, dt) => {
    const vw = window.innerWidth, vh = window.innerHeight;
    const beauty = useSite.getState().product === "beauty";
    const mine = (i: number) => (i < 7) === beauty;
    // ---- open and close (mouse): open on a bubble, close the instant the pointer is outside the card ----
    if (fine) {
      const P = frame.pointer, hov = useHeroUI.getState().hovered, cur = openRef.current;
      for (let i = 0; i < 14; i++) { const S = st.current[i]; if (!S.armed && !S.open) { const s = orbScreen[i]; if (Math.hypot(P.x - s.x, P.y - s.y) > s.r * 1.1) S.armed = true; } }
      if (cur >= 0) {
        const r = rects.current[cur];
        if (!P.seen || P.x < r[0] || P.x > r[2] || P.y < r[1] || P.y > r[3] || frame.hero > 0.04 || !mine(cur)) closeShell(cur);
      }
      if (openRef.current < 0 && hov >= 0 && mine(hov) && st.current[hov].armed && frame.hero < 0.04) {
        const s = orbScreen[hov];
        if (s.alpha > 0.5 && Math.hypot(P.x - s.x, P.y - s.y) <= s.r * 1.05) openShell(hov);
      }
    } else if (openRef.current >= 0 && frame.hero > 0.04) { closeShell(openRef.current); setSelected(-1); }

    // ---- the cards ----
    const h = Math.min(dt, 0.05);
    for (let i = 0; i < 14; i++) {
      const S = st.current[i], el = shells.current[i];
      if (!el || (!S.live && !S.open)) continue;
      const s = orbScreen[i], tgt = S.open ? 1 : 0;
      if (reducedMotion) { S.m = S.mh = tgt; S.v = S.vh = 0; }
      else {
        // opening: a soft, springy swell (height trails width a touch, so it pours open); closing: quick and firm, no wobble
        const [k1, c1, k2, c2] = S.open ? [230, 19, 165, 16.5] : [760, 52, 760, 52];
        let rem = h;
        while (rem > 1e-5) {
          const st_ = Math.min(rem, 1 / 240); rem -= st_;
          S.v += ((tgt - S.m) * k1 - S.v * c1) * st_; S.m += S.v * st_;
          S.vh += ((tgt - S.mh) * k2 - S.vh * c2) * st_; S.mh += S.vh * st_;
        }
      }
      if (!S.open && S.m < 0.006 && Math.abs(S.v) < 0.2) {
        S.m = S.mh = S.v = S.vh = S.c = 0; S.live = false; orbHide[i] = 0; el.style.visibility = "hidden"; el.style.pointerEvents = "none"; continue;
      }
      const m = Math.max(0, S.m), mh = Math.max(0, S.mh), r = Math.max(4, s.r);
      const body = bodies.current[i];
      const meas = body ? body.offsetHeight : 180;
      S.ch = S.ch ? S.ch + (meas - S.ch) * (1 - Math.exp(-dt * 14)) : meas;
      // the card's place: the bubble's position plus the offset it opened with, kept on screen
      const X = Math.max(12, Math.min(vw - CARD_W - 12, s.x + S.dx));
      const Y = Math.max(76, Math.min(vh - S.ch - 12, s.y + S.dy));
      const bx = s.x - r, by = s.y - r, d = 2 * r;
      const w = d + (CARD_W - d) * m, hh = d + (S.ch - d) * mh;
      const x = bx + (X - bx) * m, y = by + (Y - by) * mh;
      const rad = Math.min(w / 2, hh / 2, r + (CARD_R - r) * Math.min(1, m));
      el.style.visibility = "visible";
      el.style.pointerEvents = S.open ? "auto" : "none";
      el.style.transform = `translate3d(${x}px, ${y}px, 0)`;
      el.style.width = `${w}px`; el.style.height = `${hh}px`; el.style.borderRadius = `${rad}px`;
      // the 3D bubble hands over to the card in the first few percent, where the two are the same shape
      const hand = sstep(0, 0.1, m);
      el.style.opacity = String(hand); orbHide[i] = hand;
      el.style.setProperty("--fill", String(sstep(0.05, 0.6, m)));
      // the text is pinned where the finished card will be, so the growing glass uncovers it
      S.c = S.open ? Math.max(S.c, sstep(0.45, 0.92, m)) : Math.max(0, Math.min(S.c - dt * 16, sstep(0.3, 0.8, m)));
      if (body) { body.style.transform = `translate3d(${X - x}px, ${Y - y}px, 0)`; body.style.opacity = String(S.c); }
      // the icon flies from the bubble's centre to its place in the card's header
      const ic = icons.current[i];
      if (ic) {
        const icx = s.x + (X + 40 - s.x) * m, icy = s.y + (Y + 40 - s.y) * mh;
        const sc = (r * 1.15) / 40 + (1 - (r * 1.15) / 40) * Math.min(1.08, m);
        ic.style.transform = `translate3d(${icx - x - 20}px, ${icy - y - 20}px, 0) scale(${sc})`;
        ic.style.setProperty("--chip", String(sstep(0.2, 0.8, m)));
      }
      const gl = glints.current[i]; if (gl) gl.style.opacity = String(1 - sstep(0, 0.55, m));
      rects.current[i] = [x - 1, y - 1, x + w + 1, y + hh + 1];
    }

    // ---- labels: only where they can be read: off the glass, inside the screen (and the band on phones), never on
    // another label. Each tries below its orb, then above; nearer orbs choose first. ----
    const placed: number[][] = [];
    const box = frame.heroBox, banded = vw < 1024 && box.bottom > 0;
    const avoid = avoidRects; avoid.length = 0;
    if (frame.hero < 0.3) document.querySelectorAll<HTMLElement>("[data-avoid]").forEach((el) => {
      if (getComputedStyle(el).visibility === "hidden") return;
      const b = el.getBoundingClientRect(); if (b.width > 0 && b.height > 0) avoid.push([b.left - 6, b.top - 4, b.right + 6, b.bottom + 4]);
    });
    const hits = (r: number[], q: number[]) => r[0] < q[2] && r[2] > q[0] && r[1] < q[3] && r[3] > q[1];
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
          if (r[0] < 2 || r[2] > vw - 2 || r[1] < 72 || r[3] > vh - 6) return null;
          if (banded && (r[3] > box.bottom || r[1] < box.top)) return null;
          if (hitsMirror(r) || placed.some((q) => hits(r, q)) || avoid.some((q) => hits(r, q)) || onOrb(r, i)) return null;
          return r;
        };
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
      // a label steps aside while its bubble is a card, and while any open card covers it
      const covered = openRef.current >= 0 && openRef.current !== i && hits([lx - w / 2, ly, lx + w / 2, ly + 14], rects.current[openRef.current]);
      el.style.opacity = String(a > 0.02 ? Math.min(1, a * 1.2) * (1 - orbHide[i]) * (covered ? 0 : 1) : 0);
      el.style.transform = `translate3d(${lx}px, ${ly}px, 0) translateX(-50%)`;
    }
  }), [fine]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="pointer-events-none absolute inset-0 z-30">
      {all.map((ft, i) => (
        <div key={ft.id + i} ref={(el) => { labels.current[i] = el; }} className="absolute left-0 top-0 whitespace-nowrap font-mono text-[0.62rem] uppercase tracking-[0.14em] text-ink/75 opacity-0 transition-opacity duration-300" aria-hidden>
          {ft.label}
        </div>
      ))}
      {all.map((f, i) => {
        const on = openIdx === i, more = on && detail === i;
        return (
          <div key={"card" + f.id + i} ref={(el) => { shells.current[i] = el; }} aria-hidden={!on} role={on ? "dialog" : undefined} aria-label={on ? f.label : undefined}
            className="orb-card lg-glass lg-glass-deep overflow-hidden" style={{ position: "absolute", left: 0, top: 0, visibility: "hidden", pointerEvents: "none", width: 0, height: 0 }}
            onPointerMove={(e) => { const r = e.currentTarget.getBoundingClientRect(); e.currentTarget.style.setProperty("--mx", `${((e.clientX - r.left) / r.width) * 100}%`); e.currentTarget.style.setProperty("--my", `${((e.clientY - r.top) / r.height) * 100}%`); }}>
            <span aria-hidden className="lg-spec" />
            {/* the bubble's own look: a clear middle, a bright rim, one sharp highlight */}
            <span ref={(el) => { glints.current[i] = el; }} aria-hidden className="orb-card-bubble pointer-events-none absolute inset-0 rounded-[inherit]" />
            <div ref={(el) => { bodies.current[i] = el; }} className="absolute left-0 top-0 p-5" style={{ width: CARD_W, opacity: 0 }}>
              <div className="flex items-center gap-3">
                <span className="h-10 w-10 flex-none" aria-hidden />
                <span className="font-display text-[1.15rem] font-medium leading-tight tracking-[-0.02em]">{f.label}</span>
              </div>
              <p className="mt-3 text-[0.9rem] leading-relaxed text-ink/90">{f.short}</p>
              <AnimatePresence initial={false}>
                {more && (
                  <motion.p key="more" className="overflow-hidden text-[0.88rem] leading-relaxed text-ink/80" initial={{ height: 0, opacity: 0, marginTop: 0 }} animate={{ height: "auto", opacity: 1, marginTop: 10 }} exit={{ height: 0, opacity: 0, marginTop: 0 }} transition={{ duration: 0.35, ease }}>
                    {f.detail}
                  </motion.p>
                )}
              </AnimatePresence>
              <button type="button" tabIndex={on ? 0 : -1} onClick={() => setDetail((v) => (v === i ? -1 : i))} aria-expanded={more}
                className="detail-btn mt-4 inline-flex h-10 items-center gap-2 rounded-full bg-white/[0.1] pl-4 pr-3 text-[0.86rem] font-medium text-ink ring-1 ring-accent2/50 hover:bg-white/[0.16]">
                {more ? "Show less" : "More detail"}
                <Icon name="ChevronDown" size={16} className={`text-accent2 transition-transform duration-300 ${more ? "rotate-180" : ""}`} />
              </button>
            </div>
            {/* the bubble's icon, which flies into the card's header */}
            <span ref={(el) => { icons.current[i] = el; }} aria-hidden className="orb-card-icon absolute left-0 top-0 grid h-10 w-10 place-items-center rounded-full text-accent2">
              <Icon name={f.icon} size={19} />
            </span>
          </div>
        );
      })}
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
  const entered = useSite((s) => s.entered);
  return (
    <AnimatePresence mode="wait">
      <motion.div key={product} initial="out" animate={entered ? "in" : "out"} exit="gone" className="max-w-[36rem]">
        <h1 data-avoid className="h-display w-fit text-[clamp(2.6rem,4.6vw,5.6rem)] text-ink">
          {/* each line rises out of a mask; the mask reaches a little past the text on every side (and the
              margins take it back), so italic overhangs and descenders, like the tail of the "g", aren't cut */}
          {[P.headline[0], P.headline[1]].map((line, i) => (
            <span key={i} className="-mx-[0.14em] -mb-[0.08em] block overflow-hidden px-[0.14em] pb-[0.16em]">
              <motion.span className={`block ${i === 1 ? "accent-word" : ""}`}
                variants={{ out: { y: "125%", filter: "blur(10px)" }, in: { y: "0%", filter: "blur(0px)", transition: { duration: 0.9, delay: 0.08 + i * 0.08, ease } }, gone: { y: "-60%", opacity: 0, filter: "blur(8px)", transition: { duration: 0.28, ease: [0.7, 0, 0.84, 0] } } }}>
                {line}
              </motion.span>
            </span>
          ))}
        </h1>
        <motion.p data-avoid className="body-lg mt-6 hidden max-w-[27rem] sm:block" variants={{ out: { opacity: 0, y: 12, filter: "blur(6px)" }, in: { opacity: 1, y: 0, filter: "blur(0px)", transition: { duration: 0.8, delay: 0.22, ease } }, gone: { opacity: 0, transition: { duration: 0.2 } } }}>
          {P.body}
        </motion.p>
        <motion.div data-avoid className="mt-6 flex w-fit flex-wrap gap-3 sm:mt-8" variants={{ out: { opacity: 0, y: 10 }, in: { opacity: 1, y: 0, transition: { duration: 0.7, delay: 0.32, ease } }, gone: { opacity: 0, transition: { duration: 0.15 } } }}>
          <Button variant="accent" icon="ArrowRight" lens onClick={() => lenis?.scrollTo("#film-start", { duration: 1.6 })}>Watch the product video</Button>
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
  const entered = useSite((s) => s.entered);
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
          initial={{ opacity: 0, y: 30, filter: "blur(16px)" }} animate={entered ? { opacity: 1, y: 0, filter: "blur(0px)", transition: { duration: 1.1, delay: 0.55, ease } } : undefined} exit={{ opacity: 0, y: -20, filter: "blur(12px)", transition: { duration: 0.3 } }}>
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
        <motion.div className="pointer-events-none absolute inset-0 z-20" initial={{ opacity: 0 }} animate={{ opacity: entered ? 1 : 0 }} transition={{ duration: 0.35, ease }}>
          <div ref={undefined} className="h-full w-full">
            <HeroFade>
              {/* copy: top left on desktop, top on phones */}
              <div ref={copyRef} className="pointer-events-auto absolute left-5 right-5 top-[calc(var(--nav-h)+1.25rem)] sm:left-8 lg:left-[5vw] lg:right-auto lg:top-[19svh]">
                <HeroCopy />
              </div>
              <motion.div className="pointer-events-auto absolute right-[4vw] top-[calc(var(--nav-h)+1.5rem)] hidden lg:block"
                initial={{ opacity: 0, x: 48, filter: "blur(8px)" }} animate={entered ? { opacity: 1, x: 0, filter: "blur(0px)" } : undefined} transition={{ duration: 0.9, delay: 0.5, ease }}>
                <ProductSwitcher />
              </motion.div>
              <motion.div ref={switchRef} className="pointer-events-auto absolute bottom-[max(1.25rem,env(safe-area-inset-bottom))] left-0 right-0 flex justify-center px-5 lg:hidden"
                initial={{ opacity: 0, y: 24 }} animate={entered ? { opacity: 1, y: 0 } : undefined} transition={{ duration: 0.8, delay: 0.55, ease }}>
                <MobileSwitcher />
              </motion.div>
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
