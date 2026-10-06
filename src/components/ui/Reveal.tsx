import { motion, type Variants } from "framer-motion";
import type { ReactNode } from "react";

const ease = [0.22, 1, 0.36, 1] as const;

export const rise: Variants = {
  hidden: { opacity: 0, y: 26, filter: "blur(10px)" },
  show: { opacity: 1, y: 0, filter: "blur(0px)", transition: { duration: 0.9, ease } },
};
export const stagger = (delay = 0, gap = 0.08): Variants => ({
  hidden: {},
  show: { transition: { staggerChildren: gap, delayChildren: delay } },
});

/** Wrap any block: it drifts up out of blur when it scrolls into view. */
export function Reveal({ children, delay = 0, className = "", once = true, amount = 0.35 }:
  { children: ReactNode; delay?: number; className?: string; once?: boolean; amount?: number }) {
  return (
    <motion.div
      className={className}
      initial="hidden"
      whileInView="show"
      viewport={{ once, amount }}
      variants={{ hidden: rise.hidden, show: { ...(rise.show as object), transition: { duration: 0.9, ease, delay } } }}
    >
      {children}
    </motion.div>
  );
}

/** Headline that arrives one word at a time. */
export function Words({ text, className = "", delay = 0, as: Tag = "h2", gradientFrom }:
  { text: string; className?: string; delay?: number; as?: "h1" | "h2" | "h3" | "p"; gradientFrom?: number }) {
  const words = text.split(" ");
  const MTag = motion[Tag];
  return (
    <MTag className={className} initial="hidden" whileInView="show" viewport={{ once: true, amount: 0.5 }}
      variants={stagger(delay, 0.055)} aria-label={text}>
      {words.map((w, i) => (
        <span key={i} className="inline-block overflow-hidden align-bottom" style={{ paddingBottom: "0.08em", marginBottom: "-0.08em" }}>
          <motion.span
            className={`inline-block ${gradientFrom !== undefined && i >= gradientFrom ? "text-gradient" : ""}`}
            variants={{ hidden: { y: "105%", opacity: 0, rotateX: -18 }, show: { y: "0%", opacity: 1, rotateX: 0, transition: { duration: 0.8, ease } } }}
          >
            {w}
          </motion.span>
          {i < words.length - 1 ? " " : ""}
        </span>
      ))}
    </MTag>
  );
}

/** Children reveal in sequence. */
export function Stagger({ children, className = "", delay = 0, gap = 0.1, amount = 0.25 }:
  { children: ReactNode; className?: string; delay?: number; gap?: number; amount?: number }) {
  return (
    <motion.div className={className} initial="hidden" whileInView="show" viewport={{ once: true, amount }} variants={stagger(delay, gap)}>
      {children}
    </motion.div>
  );
}
export function Item({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <motion.div className={className} variants={rise}>{children}</motion.div>;
}
