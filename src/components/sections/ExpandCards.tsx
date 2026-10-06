import { motion, AnimatePresence } from "framer-motion";
import { useState, type ReactNode } from "react";
import { springFor } from "../../lib/physics";

export type ExpandItem = { key: string; tag?: string; title: string; body: string; more?: string; icon?: ReactNode; accent?: boolean };

/**
 * A row of glass cards. Hover (or focus) one and it grows to take the room,
 * the others breathe in, and its extra line unfolds. Layout springs, not fixed durations.
 */
export function ExpandCards({ items, minHeight = "15rem" }: { items: ExpandItem[]; minHeight?: string }) {
  const [hot, setHot] = useState<string | null>(null);
  return (
    <div className="flex flex-col gap-4 lg:flex-row" style={{ minHeight }} onPointerLeave={() => setHot(null)}>
      {items.map((it) => {
        const on = hot === it.key, dimmed = hot !== null && !on;
        return (
          <motion.div
            key={it.key}
            layout
            /* pointermove, not mouseenter: scrolling moves cards under a still cursor and
               fires enter/leave, whose layout animation cancels an in-flight smooth scroll */
            onPointerMove={() => { if (hot !== it.key) setHot(it.key); }}
            onFocus={() => setHot(it.key)} onBlur={() => setHot(null)}
            tabIndex={0}
            className={`glass relative flex cursor-default flex-col overflow-hidden rounded-3xl p-6 lg:p-7 ${on ? "glass-tint" : ""}`}
            style={{ flex: on ? 1.65 : 1 }}
            animate={{ opacity: dimmed ? 0.62 : 1, y: on ? -4 : 0 }}
            transition={springFor(0.55, 0.92)}
          >
            {it.icon && <div className="mb-5 h-10">{it.icon}</div>}
            {it.tag && <div className="eyebrow mb-3">{it.tag}</div>}
            <motion.h3 layout="position" className="h-card text-[1.35rem] text-ink">{it.title}</motion.h3>
            <motion.p layout="position" className="mt-3 text-[0.9rem] leading-relaxed text-mute">{it.body}</motion.p>
            <AnimatePresence initial={false}>
              {on && it.more && (
                <motion.p key="more" className="mt-3 text-[0.9rem] leading-relaxed text-sky/90"
                  initial={{ opacity: 0, height: 0, y: 8 }} animate={{ opacity: 1, height: "auto", y: 0 }} exit={{ opacity: 0, height: 0, y: 8 }} transition={springFor(0.45, 1)}>
                  {it.more}
                </motion.p>
              )}
            </AnimatePresence>
            <motion.div aria-hidden className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full"
              style={{ background: "radial-gradient(circle, rgba(142,197,255,0.35), transparent 65%)", filter: "blur(18px)" }}
              animate={{ opacity: on ? 1 : 0, scale: on ? 1 : 0.6 }} transition={springFor(0.6, 1)} />
          </motion.div>
        );
      })}
    </div>
  );
}

/* ---------- little animated icons for the cards ---------- */
export function IconReflect() {
  return (
    <svg viewBox="0 0 48 48" className="h-10 w-10" fill="none">
      <rect x="14" y="6" width="20" height="36" rx="6" stroke="#8EC5FF" strokeWidth="1.6" />
      <motion.path d="M18 34 L30 12" stroke="#B07CFF" strokeWidth="1.8" strokeLinecap="round" animate={{ pathLength: [0, 1, 1, 0], opacity: [0, 1, 1, 0] }} transition={{ duration: 3, repeat: Infinity, times: [0, 0.3, 0.7, 1] }} />
    </svg>
  );
}
export function IconUnderstand() {
  return (
    <svg viewBox="0 0 48 48" className="h-10 w-10" fill="none">
      <circle cx="24" cy="24" r="16" stroke="#8EC5FF" strokeWidth="1.6" strokeDasharray="3 5" />
      <motion.line x1="8" x2="40" stroke="#B07CFF" strokeWidth="1.6" initial={{ y1: 12, y2: 12, opacity: 0.3 }} animate={{ y1: [12, 36, 12], y2: [12, 36, 12], opacity: [0.3, 1, 0.3] }} transition={{ duration: 2.6, repeat: Infinity, ease: "easeInOut" }} />
      <circle cx="24" cy="24" r="3" fill="#EEF2FF" />
    </svg>
  );
}
export function IconAct() {
  return (
    <svg viewBox="0 0 48 48" className="h-10 w-10" fill="none">
      {[0, 1].map((i) => (
        <motion.circle key={i} cx="24" cy="24" stroke="#8EC5FF" strokeWidth="1.4" initial={{ r: 6, opacity: 0.9 }} animate={{ r: [6, 20], opacity: [0.9, 0] }} transition={{ duration: 2.2, repeat: Infinity, delay: i * 1.1, ease: "easeOut" }} />
      ))}
      <circle cx="24" cy="24" r="5" fill="#B07CFF" />
    </svg>
  );
}
