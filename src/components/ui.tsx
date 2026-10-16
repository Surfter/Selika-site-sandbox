import { Component, useEffect, useRef, useState, type ReactNode, type CSSProperties, type MouseEvent as RME } from "react";
import { motion, useMotionValue, useSpring, type HTMLMotionProps } from "motion/react";
import { Icon } from "../lib/icons";
import { isCoarse, reducedMotion, supportsRefraction } from "../lib/perf";

/* ------------------------------------------------------------------
   The SVG filters behind the glass lens, mounted once. Chromium only
   (url() in backdrop-filter); every other browser keeps the CSS blur.
   ------------------------------------------------------------------ */
/* liquid glass: the highlight inside the glass (.lg-spec) follows the pointer */
export const specMove = (e: React.PointerEvent<HTMLElement>) => {
  const r = e.currentTarget.getBoundingClientRect();
  e.currentTarget.style.setProperty("--mx", `${e.clientX - r.left}px`); e.currentTarget.style.setProperty("--my", `${e.clientY - r.top}px`);
};

export function GlassFilters() {
  useEffect(() => { if (supportsRefraction) document.documentElement.classList.add("sg-refract"); }, []);
  // displacement ramps that are neutral in the middle and bend only near the edges
  const rampX = "data:image/svg+xml;utf8," + encodeURIComponent(`<svg xmlns='http://www.w3.org/2000/svg' width='100' height='100'><linearGradient id='g'><stop offset='0' stop-color='#000'/><stop offset='.18' stop-color='#808080'/><stop offset='.82' stop-color='#808080'/><stop offset='1' stop-color='#fff'/></linearGradient><rect width='100' height='100' fill='url(#g)'/></svg>`);
  const rampY = "data:image/svg+xml;utf8," + encodeURIComponent(`<svg xmlns='http://www.w3.org/2000/svg' width='100' height='100'><linearGradient id='g' x2='0' y2='1'><stop offset='0' stop-color='#000'/><stop offset='.18' stop-color='#808080'/><stop offset='.82' stop-color='#808080'/><stop offset='1' stop-color='#fff'/></linearGradient><rect width='100' height='100' fill='url(#g)'/></svg>`);
  return (
    <svg aria-hidden width="0" height="0" style={{ position: "absolute" }}>
      <defs>
        <filter id="sg-refract" x="0" y="0" width="100%" height="100%" colorInterpolationFilters="sRGB">
          <feTurbulence type="fractalNoise" baseFrequency="0.02" numOctaves="1" seed="3" result="n" />
          <feGaussianBlur in="n" stdDeviation="3" result="nb" />
          <feDisplacementMap in="SourceGraphic" in2="nb" scale="22" xChannelSelector="R" yChannelSelector="G" />
        </filter>
        <filter id="lg-lens" x="0" y="0" width="100%" height="100%" primitiveUnits="objectBoundingBox" colorInterpolationFilters="sRGB">
          <feImage href={rampX} x="0" y="0" width="1" height="1" preserveAspectRatio="none" result="rx" />
          <feImage href={rampY} x="0" y="0" width="1" height="1" preserveAspectRatio="none" result="ry" />
          <feComposite in="rx" in2="ry" operator="arithmetic" k1="0" k2="1" k3="1" k4="-0.5" result="map" />
          <feDisplacementMap in="SourceGraphic" in2="map" scale="0.3" xChannelSelector="R" yChannelSelector="G" />
        </filter>
        <filter id="sg-lens" x="0" y="0" width="100%" height="100%" primitiveUnits="objectBoundingBox" colorInterpolationFilters="sRGB">
          <feImage href={rampX} x="0" y="0" width="1" height="1" preserveAspectRatio="none" result="rx" />
          <feImage href={rampY} x="0" y="0" width="1" height="1" preserveAspectRatio="none" result="ry" />
          <feComposite in="rx" in2="ry" operator="arithmetic" k1="0" k2="1" k3="1" k4="-0.5" result="map" />
          <feDisplacementMap in="SourceGraphic" in2="map" scale="0.16" xChannelSelector="R" yChannelSelector="G" />
        </filter>
      </defs>
    </svg>
  );
}

/* ---------------- logo ---------------- */
export function Mark({ size = 22, className = "" }: { size?: number; className?: string }) {
  return (
    <svg width={size * 0.74} height={size} viewBox="12.5 5.5 39 53" className={className} aria-hidden fill="none" stroke="currentColor">
      <rect x="15" y="8" width="34" height="48" rx="10" strokeWidth="3" />
      <path d="M23 44 L41 18" strokeWidth="3" strokeLinecap="round" />
      <path d="M23 52 L47 26" strokeWidth="2" strokeLinecap="round" opacity=".45" />
    </svg>
  );
}
export function Logo({ size = "md" }: { size?: "sm" | "md" | "lg" }) {
  const cls = size === "lg" ? "text-[2rem]" : size === "sm" ? "text-[1.08rem]" : "text-[1.3rem]";
  const m = size === "lg" ? 34 : size === "sm" ? 19 : 23;
  return (
    <span className={`inline-flex items-center gap-2 font-display font-medium tracking-[-0.045em] text-ink ${cls}`}>
      <Mark size={m} className="text-accent2 transition-colors duration-700" />
      <span>selika</span>
    </span>
  );
}

/* ---------------- headline with an italic accent ----------------
   One line where it fits (it wraps naturally only when it has to); `stack`
   puts the accent on its own line, for the hero. */
export function Headline({ lead, accent, className = "", as: Tag = "h2", stack = false }: { lead: string; accent: string; className?: string; as?: "h1" | "h2" | "h3"; stack?: boolean }) {
  return (
    <Tag className={className}>
      <span className={stack ? "block" : ""}>{lead}</span>{stack ? null : " "}
      <span className={`accent-word ${stack ? "block" : ""}`}>{accent}</span>
    </Tag>
  );
}

export function Eyebrow({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <span className={`eyebrow inline-flex items-center gap-2 ${className}`}>
      <i className="dot-accent block h-1.5 w-1.5 rounded-full" />
      {children}
    </span>
  );
}

/* ---------------- arrive and settle ----------------
   Plain CSS transitions on opacity and position, toggled once the element is
   on screen. No filters: they are costly to animate and can get stuck. If the
   observer never fires (an old browser, a print view), the content shows anyway. */
export function Reveal({ children, delay = 0, y = 22, className = "", style, once = true }: { children: ReactNode; delay?: number; y?: number; className?: string; style?: CSSProperties; once?: boolean }) {
  const ref = useRef<HTMLDivElement>(null);
  const [shown, setShown] = useState(reducedMotion);
  useEffect(() => {
    if (reducedMotion) return;
    const el = ref.current; if (!el) return;
    if (typeof IntersectionObserver === "undefined") { setShown(true); return; }
    const io = new IntersectionObserver(([e]) => {
      if (e.isIntersecting) { setShown(true); if (once) io.disconnect(); }
      else if (!once) setShown(false);
    }, { rootMargin: "0px 0px -8% 0px" });
    io.observe(el);
    return () => io.disconnect();
  }, [once]);
  return (
    <div ref={ref} className={`reveal ${shown ? "is-in" : ""} ${className}`}
      style={{ ...style, ["--ry" as string]: `${y}px`, transitionDelay: shown && delay ? `${delay}s` : undefined }}>
      {children}
    </div>
  );
}

/* ---------------- magnetic pill buttons ---------------- */
type BtnProps = { children: ReactNode; onClick?: (e: RME) => void; href?: string; variant?: "accent" | "glass" | "ghost"; icon?: string; className?: string; ariaLabel?: string; lens?: boolean; small?: boolean; pressed?: boolean };
export function Button({ children, onClick, href, variant = "glass", icon, className = "", ariaLabel, lens, small, pressed }: BtnProps) {
  const ref = useRef<HTMLElement>(null);
  const x = useMotionValue(0), y = useMotionValue(0);
  const sx = useSpring(x, { stiffness: 260, damping: 18, mass: 0.6 }), sy = useSpring(y, { stiffness: 260, damping: 18, mass: 0.6 });
  const onMove = (e: React.PointerEvent) => {
    if (variant === "glass") specMove(e as React.PointerEvent<HTMLElement>);
    if (isCoarse || reducedMotion || !ref.current) return;
    const r = ref.current.getBoundingClientRect();
    x.set(((e.clientX - r.left) / r.width - 0.5) * 10); y.set(((e.clientY - r.top) / r.height - 0.5) * 8);
  };
  const reset = () => { x.set(0); y.set(0); };
  const base = `group relative inline-flex select-none items-center justify-center gap-2 rounded-full font-medium transition-[background-color,border-color,color,box-shadow] duration-300 ease-out-expo ${small ? "h-10 px-4 text-[0.86rem]" : "h-12 px-6 text-[0.95rem]"}`;
  const look = variant === "accent" ? "btn-accent text-white" : variant === "glass" ? `lg-glass lg-glass-dark overflow-hidden ${lens ? "sg-lens" : ""} text-ink hover:bg-white/10` : "text-mute hover:text-ink";
  const inner = (
    <>
      {variant === "glass" && <span aria-hidden className="lg-spec" />}
      <span className="relative z-[1]">{children}</span>
      {icon && <Icon name={icon} size={small ? 16 : 18} className="relative z-[1] transition-transform duration-300 ease-out-expo group-hover:translate-x-1" />}
    </>
  );
  const press = reducedMotion ? {} : { whileHover: { scale: 1.035 }, whileTap: { scale: 0.95 }, transition: { type: "spring", stiffness: 420, damping: 24 } };
  const common = { ref: ref as never, onPointerMove: onMove, onPointerLeave: reset, style: { x: sx, y: sy }, className: `${base} ${look} no-press ${className}`, "aria-label": ariaLabel, ...press };
  return href
    ? <motion.a {...(common as HTMLMotionProps<"a">)} href={href} onClick={onClick as never}>{inner}</motion.a>
    : <motion.button {...(common as HTMLMotionProps<"button">)} type="button" onClick={onClick as never} aria-pressed={pressed}>{inner}</motion.button>;
}

/* ------------------------------------------------------------------
   Flip card: a simple fact on the front, the detail on the back.
   A real button: tap, click, Enter or Space flips it, Escape flips it
   back; mouse users also get flip-on-hover. The hidden face is inert.
   ------------------------------------------------------------------ */
export function FlipCard({ front, back, className = "", hoverFlip = true, label }: { front: ReactNode; back: ReactNode; className?: string; hoverFlip?: boolean; label: string }) {
  const [flipped, setFlipped] = useState(false);
  const frontRef = useRef<HTMLDivElement>(null), backRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    frontRef.current?.toggleAttribute("inert", flipped);
    backRef.current?.toggleAttribute("inert", !flipped);
  }, [flipped]);
  const canHover = hoverFlip && !isCoarse;
  return (
    <div className={`group/flip [perspective:1600px] ${className}`}
      onMouseEnter={canHover ? () => setFlipped(true) : undefined} onMouseLeave={canHover ? () => setFlipped(false) : undefined}>
      <button type="button" aria-pressed={flipped} aria-label={`${label}: ${flipped ? "show summary" : "show detail"}`}
        onClick={() => setFlipped((f) => !f)} onKeyDown={(e) => { if (e.key === "Escape") setFlipped(false); }}
        className="no-press relative grid h-full w-full text-left [transform-style:preserve-3d] motion-reduce:!transition-none"
        style={{ transform: flipped ? "rotateY(180deg)" : "none", transition: `transform ${isCoarse ? 1.05 : 0.7}s cubic-bezier(0.76, 0, 0.24, 1)` }}>
        <div ref={frontRef} className="[grid-area:1/1] [backface-visibility:hidden]">{front}</div>
        <div ref={backRef} className="[grid-area:1/1] [backface-visibility:hidden] [transform:rotateY(180deg)]">{back}</div>
      </button>
    </div>
  );
}

/* ------------------------------------------------------------------
   A card that answers the pointer: it tilts a little toward it, a soft
   light follows it, and it lifts with a brighter rim on hover. Touch gets
   a small press instead. Give it the card's own classes (glass, radius,
   padding) through className.
   ------------------------------------------------------------------ */
export function Reactive({ children, className = "", max = 4, lift = 5, style }: { children: ReactNode; className?: string; max?: number; lift?: number; style?: CSSProperties }) {
  const ref = useRef<HTMLDivElement>(null);
  const rx = useMotionValue(0), ry = useMotionValue(0);
  const srx = useSpring(rx, { stiffness: 220, damping: 20 }), sry = useSpring(ry, { stiffness: 220, damping: 20 });
  const onMove = (e: React.PointerEvent) => {
    if (isCoarse || reducedMotion || !ref.current) return;
    const r = ref.current.getBoundingClientRect();
    const px = (e.clientX - r.left) / r.width, py = (e.clientY - r.top) / r.height;
    ry.set((px - 0.5) * max * 2); rx.set(-(py - 0.5) * max * 1.6);
    ref.current.style.setProperty("--mx", `${px * 100}%`); ref.current.style.setProperty("--my", `${py * 100}%`);
  };
  const onLeave = () => { rx.set(0); ry.set(0); };
  return (
    <motion.div ref={ref} onPointerMove={onMove} onPointerLeave={onLeave}
      style={{ ...style, rotateX: srx, rotateY: sry, transformPerspective: 1000 }}
      whileHover={reducedMotion || isCoarse ? undefined : { y: -lift }} whileTap={isCoarse ? { scale: 0.985 } : undefined}
      transition={{ type: "spring", stiffness: 300, damping: 24 }}
      className={`rc relative isolate overflow-hidden ${className}`}>
      <span aria-hidden className="rc-glow" />
      {children}
    </motion.div>
  );
}

/* a small glass chip */
export function Chip({ children, active, onClick, className = "" }: { children: ReactNode; active?: boolean; onClick?: () => void; className?: string }) {
  const Tag = onClick ? "button" : "span";
  return (
    <Tag type={onClick ? "button" : undefined} onClick={onClick} aria-pressed={onClick ? !!active : undefined}
      className={`inline-flex h-9 items-center gap-2 rounded-full px-3.5 text-[0.8rem] transition-all duration-300 ease-out-expo ${active ? "bg-white text-night" : "sg-glass text-ink/85 hover:bg-white/10"} ${className}`}>
      {children}
    </Tag>
  );
}

/* the section scaffold: an anchor for the stream of light and consistent spacing */
export function Section({ id, stream = -1, className = "", children }: { id?: string; stream?: -1 | 0 | 1; className?: string; children: ReactNode }) {
  return (
    <section id={id} data-stream={stream} className={`relative py-20 md:py-28 ${className}`}>
      {children}
    </section>
  );
}

/* ------------------------------------------------------------------
   If a 3D scene can't start (no WebGL, a lost context, a failed load),
   show its fallback instead of taking the page down with it.
   ------------------------------------------------------------------ */
export class SceneBoundary extends Component<{ fallback: ReactNode; children: ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  componentDidCatch(err: unknown) { if (import.meta.env.DEV) console.warn("3D scene unavailable:", err); }
  render() { return this.state.failed ? this.props.fallback : this.props.children; }
}
