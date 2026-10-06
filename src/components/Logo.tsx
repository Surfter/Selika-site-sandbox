import { motion } from "framer-motion";

/**
 * The mark: a mirror slab catching a diagonal glint.
 *
 * `tight` crops the viewBox to the ink. The square box carries about a fifth of
 * dead space on every side, and centring a box centres the dead space with it,
 * which is how the mark ends up looking adrift from the wordmark beneath it.
 */
export function Mark({ size = 22, tight = false, className = "" }: { size?: number | string; tight?: boolean; className?: string }) {
  const id = "selika-mark-g";
  const h = typeof size === "number" ? `${size}px` : size;
  const w = tight ? `calc(${h} * 0.7358)` : h;
  return (
    <svg style={{ width: w, height: h }} viewBox={tight ? "12.5 5.5 39 53" : "0 0 64 64"} className={className} aria-hidden>
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#8EC5FF" /><stop offset="1" stopColor="#B07CFF" />
        </linearGradient>
      </defs>
      <rect x="15" y="8" width="34" height="48" rx="10" fill="rgba(142,197,255,0.08)" stroke={`url(#${id})`} strokeWidth="3" />
      <path d="M23 44 L41 18" stroke={`url(#${id})`} strokeWidth="3" strokeLinecap="round" />
      <path d="M23 52 L47 26" stroke={`url(#${id})`} strokeWidth="2" strokeLinecap="round" opacity=".45" />
    </svg>
  );
}

/** Lowercase wordmark. */
export function Logo({ size = "md", glint = false }: { size?: "sm" | "md" | "xl"; glint?: boolean }) {
  const px = size === "xl" ? "text-[clamp(3.4rem,10.5vw,7.6rem)] leading-[0.78] mb-[-0.033em]" : size === "sm" ? "text-[1.05rem]" : "text-[1.25rem]";
  const mark = size === "xl" ? 0 : size === "sm" ? 20 : 24;
  return (
    <span className={`inline-flex items-center gap-2.5 font-display font-medium tracking-[-0.04em] ${px} relative`}>
      {mark > 0 && <Mark size={mark} />}
      <span className="relative pr-[0.04em]">
        selika
        {glint && (
          <motion.span
            aria-hidden
            className="absolute inset-0 text-gradient"
            style={{ maskImage: "linear-gradient(110deg, transparent 30%, #000 50%, transparent 70%)", WebkitMaskImage: "linear-gradient(110deg, transparent 30%, #000 50%, transparent 70%)", maskSize: "260% 100%", WebkitMaskSize: "260% 100%" }}
            animate={{ maskPosition: ["180% 0%", "-80% 0%"], WebkitMaskPosition: ["180% 0%", "-80% 0%"] }}
            transition={{ duration: 3.4, repeat: Infinity, repeatDelay: 2.2, ease: "easeInOut" }}
          >
            selika
          </motion.span>
        )}
      </span>
    </span>
  );
}
