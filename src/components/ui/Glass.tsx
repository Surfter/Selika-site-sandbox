import { motion, type HTMLMotionProps } from "framer-motion";
import { forwardRef, type ReactNode } from "react";
import { springFor } from "../../lib/physics";

const press = springFor(0.28, 1);

/**
 * Native smooth scrolling gets cancelled whenever the document reflows mid-flight, and
 * this page reflows constantly: cards expand under the cursor, sections reveal, the
 * sticky stage re-measures. So we tween it ourselves and re-read the destination every
 * frame, which means a shift on the way there moves the target rather than stranding us.
 * A wheel or touch cancels it, the way an interruptible animation should.
 */
const NAV_OFFSET = 88;
let scrollRaf = 0;
export function scrollToId(href: string) {
  cancelAnimationFrame(scrollRaf);
  const el = href === "#top" ? null : document.querySelector<HTMLElement>(href);
  if (href !== "#top" && !el) return;
  const destination = () => (el ? Math.max(0, el.getBoundingClientRect().top + window.scrollY - NAV_OFFSET) : 0);

  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) { window.scrollTo({ top: destination(), behavior: "instant" }); return; }

  const from = window.scrollY, t0 = performance.now(), duration = 720;
  const easeOutCubic = (x: number) => 1 - Math.pow(1 - x, 3);
  const stop = () => { cancelAnimationFrame(scrollRaf); detach(); };
  const detach = () => {
    window.removeEventListener("wheel", stop);
    window.removeEventListener("touchstart", stop);
    window.removeEventListener("keydown", stop);
  };
  window.addEventListener("wheel", stop, { passive: true, once: true });
  window.addEventListener("touchstart", stop, { passive: true, once: true });
  window.addEventListener("keydown", stop, { once: true });

  const step = (now: number) => {
    const k = Math.min(1, (now - t0) / duration);
    window.scrollTo({ top: from + (destination() - from) * easeOutCubic(k), behavior: "instant" });
    if (k < 1) scrollRaf = requestAnimationFrame(step); else detach();
  };
  scrollRaf = requestAnimationFrame(step);
}

type CardProps = HTMLMotionProps<"div"> & { tint?: boolean; strong?: boolean; hover?: boolean; children?: ReactNode };

/** A frosted panel. `hover` lifts it a touch and brightens the edge. */
export const GlassCard = forwardRef<HTMLDivElement, CardProps>(function GlassCard(
  { tint, strong, hover, className = "", children, ...rest }, ref) {
  return (
    <motion.div
      ref={ref}
      className={`glass rounded-3xl ${tint ? "glass-tint" : ""} ${strong ? "glass-strong" : ""} ${className}`}
      whileHover={hover ? { y: -3, borderColor: "rgba(255,255,255,0.22)" } : undefined}
      transition={springFor(0.4, 1)}
      {...rest}
    >
      {children}
    </motion.div>
  );
});

type BtnProps = HTMLMotionProps<"button"> & { primary?: boolean; small?: boolean; children?: ReactNode; href?: string };

/** A glassy pill. Feedback on press, not on release; lift on hover. */
export function GlassButton({ primary, small, className = "", children, href, ...rest }: BtnProps) {
  const cls = `glass ${primary ? "glass-strong" : ""} inline-flex items-center gap-2 rounded-full font-medium text-ink select-none
    ${small ? "px-4 py-2 text-[0.8rem]" : "px-6 py-3 text-[0.9rem]"} ${className}`;
  const motionProps = {
    whileHover: { y: -2, scale: 1.02, boxShadow: primary
      ? "inset 0 1px 0 rgba(255,255,255,0.3), 0 0 0 1px rgba(255,255,255,0.2), 0 14px 40px -10px rgba(0,0,0,0.75)"
      : "inset 0 1px 0 rgba(255,255,255,0.22), 0 14px 36px -12px rgba(0,0,0,0.7), 0 0 0 1px rgba(255,255,255,0.14)" },
    whileTap: { scale: 0.965, y: 0 },
    transition: press,
  };
  if (href) {
    return (
      <motion.a href={href} className={cls} {...motionProps} onClick={(e) => {
        if (href.startsWith("#")) {
          e.preventDefault();
          /* a focused anchor far down the page gets scrolled back into view by the
             browser, which fights the tween; drop focus before starting */
          (e.currentTarget as HTMLElement).blur();
          scrollToId(href);
        }
      }}>{children}</motion.a>
    );
  }
  return <motion.button type="button" className={cls} {...motionProps} {...rest}>{children}</motion.button>;
}

/** Small glass chip used for options; `active` lights it. */
export function GlassChip({ active, className = "", children, ...rest }: HTMLMotionProps<"button"> & { active?: boolean; children?: ReactNode }) {
  return (
    <motion.button
      type="button"
      aria-pressed={!!active}
      className={`glass rounded-full px-4 py-2 text-[0.8rem] font-medium transition-colors ${active ? "glass-tint text-ink" : "text-mute hover:text-ink"} ${className}`}
      whileHover={{ y: -1.5 }}
      whileTap={{ scale: 0.96 }}
      transition={press}
      {...rest}
    >
      {children}
    </motion.button>
  );
}

/** Segmented glass switch with a sliding tinted thumb (shared layout). */
export function GlassSwitch<T extends string>({ value, options, onChange, id, className = "" }:
  { value: T; options: { value: T; label: string }[]; onChange: (v: T) => void; id: string; className?: string }) {
  return (
    <div role="tablist" aria-label={id} className={`glass rounded-full p-1.5 inline-flex relative ${className}`}>
      {options.map((o) => {
        const on = o.value === value;
        return (
          <motion.button
            key={o.value} type="button" role="tab" aria-selected={on}
            onClick={() => onChange(o.value)}
            className={`relative z-10 rounded-full px-5 py-2.5 text-[0.86rem] font-medium transition-colors ${on ? "text-ink" : "text-mute hover:text-ink"}`}
            whileTap={{ scale: 0.97 }} transition={press}
          >
            {on && (
              <motion.span
                layoutId={`${id}-thumb`}
                className="absolute inset-0 rounded-full glass-tint glow-ring"
                style={{ position: "absolute", zIndex: -1 }}
                transition={springFor(0.42, 0.86)}
              />
            )}
            {o.label}
          </motion.button>
        );
      })}
    </div>
  );
}
