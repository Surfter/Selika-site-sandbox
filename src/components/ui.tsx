import { Component, useEffect, useRef, useState, type ReactNode, type CSSProperties, type MouseEvent as RME } from "react";
import { motion, useInView, useMotionValue, useSpring, type HTMLMotionProps } from "motion/react";
import { Icon } from "../lib/icons";
import { isCoarse, reducedMotion, supportsRefraction, getTier } from "../lib/perf";

/* ------------------------------------------------------------------
   The SVG filters behind the glass lens, mounted once. Chromium only
   (url() in backdrop-filter); every other browser keeps the CSS blur.
   ------------------------------------------------------------------ */
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

/* ---------------- headline with an italic accent ---------------- */
export function Headline({ lead, accent, className = "", as: Tag = "h2" }: { lead: string; accent: string; className?: string; as?: "h1" | "h2" | "h3" }) {
  return (
    <Tag className={className}>
      <span className="block">{lead}</span>
      <span className="block accent-word">{accent}</span>
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

/* ---------------- arrive out of focus, then settle ---------------- */
export function Reveal({ children, delay = 0, y = 26, className = "", style, once = true }: { children: ReactNode; delay?: number; y?: number; className?: string; style?: CSSProperties; once?: boolean }) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once, margin: "0px 0px -12% 0px" });
  if (reducedMotion) return <div className={className} style={style}>{children}</div>;
  // a soft focus-in on capable screens; phones and slow machines skip the blur, which is costly to animate
  const soft = !isCoarse && getTier() !== "low";
  return (
    <motion.div ref={ref} className={className} style={style}
      initial={soft ? { opacity: 0, y, scale: 0.985, filter: "blur(8px)" } : { opacity: 0, y }}
      animate={inView ? (soft ? { opacity: 1, y: 0, scale: 1, filter: "blur(0px)" } : { opacity: 1, y: 0 }) : undefined}
      transition={{ duration: 1.05, delay, ease: [0.16, 1, 0.3, 1] }}>
      {children}
    </motion.div>
  );
}

/* ---------------- magnetic pill buttons ---------------- */
type BtnProps = { children: ReactNode; onClick?: (e: RME) => void; href?: string; variant?: "accent" | "glass" | "ghost"; icon?: string; className?: string; ariaLabel?: string; lens?: boolean; small?: boolean; pressed?: boolean };
export function Button({ children, onClick, href, variant = "glass", icon, className = "", ariaLabel, lens, small, pressed }: BtnProps) {
  const ref = useRef<HTMLElement>(null);
  const x = useMotionValue(0), y = useMotionValue(0);
  const sx = useSpring(x, { stiffness: 260, damping: 18, mass: 0.6 }), sy = useSpring(y, { stiffness: 260, damping: 18, mass: 0.6 });
  const onMove = (e: React.PointerEvent) => {
    if (isCoarse || reducedMotion || !ref.current) return;
    const r = ref.current.getBoundingClientRect();
    x.set(((e.clientX - r.left) / r.width - 0.5) * 10); y.set(((e.clientY - r.top) / r.height - 0.5) * 8);
  };
  const reset = () => { x.set(0); y.set(0); };
  const base = `group relative inline-flex select-none items-center justify-center gap-2 rounded-full font-medium transition-[transform,background-color,border-color,color] duration-300 ease-out-expo active:scale-[0.97] ${small ? "h-10 px-4 text-[0.86rem]" : "h-12 px-6 text-[0.95rem]"}`;
  const look = variant === "accent" ? "btn-accent text-white" : variant === "glass" ? `sg-glass ${lens ? "sg-lens" : ""} text-ink hover:bg-white/10` : "text-mute hover:text-ink";
  const inner = (
    <>
      <span className="relative z-[1]">{children}</span>
      {icon && <Icon name={icon} size={small ? 16 : 18} className="relative z-[1] transition-transform duration-300 ease-out-expo group-hover:translate-x-0.5" />}
    </>
  );
  const common = { ref: ref as never, onPointerMove: onMove, onPointerLeave: reset, style: { x: sx, y: sy }, className: `${base} ${look} ${className}`, "aria-label": ariaLabel };
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
        className="relative grid h-full w-full text-left [transform-style:preserve-3d] transition-transform duration-700 ease-in-out-quart motion-reduce:transition-none"
        style={{ transform: flipped ? "rotateY(180deg)" : "none" }}>
        <div ref={frontRef} className="[grid-area:1/1] [backface-visibility:hidden]">{front}</div>
        <div ref={backRef} className="[grid-area:1/1] [backface-visibility:hidden] [transform:rotateY(180deg)]">{back}</div>
      </button>
    </div>
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
    <section id={id} data-stream={stream} className={`relative py-24 md:py-36 ${className}`}>
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
