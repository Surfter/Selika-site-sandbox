import { useRef } from "react";
import { motion, useMotionValue, useSpring, useTransform } from "motion/react";
import { ONLY_MIRROR, PROBLEM } from "../lib/content";
import { Icon } from "../lib/icons";
import { isCoarse, reducedMotion } from "../lib/perf";
import { FlipCard, Headline, Reveal, Section } from "../components/ui";

/* ---------------- The problem: three flip cards ---------------- */
export function Problem() {
  return (
    <Section id="problem" stream={1} className="z-10 -mt-[40svh] md:-mt-[50svh]">
      <div className="wrap">
        <Reveal>
          <h2 className="h-section text-[clamp(1.75rem,4.5vw,4.3rem)]">
            <span className="block">{PROBLEM.title[0]}</span>
            <span className="block accent-word">{PROBLEM.title[1]}</span>
          </h2>
          <p className="body-lg mt-5 max-w-[46rem]">{PROBLEM.body}</p>
        </Reveal>
        <div className="mt-10 grid gap-4 md:grid-cols-3">
          {PROBLEM.cards.map((c, i) => (
            <Reveal key={c.n} delay={0.08 * i}>
              <FlipCard label={c.front} className="h-[12.5rem]"
                front={
                  <div className="sg-glass tile-hover flex h-[12.5rem] flex-col justify-between rounded-[1.6rem] p-6">
                    <div className="flex items-start justify-between">
                      <span className="grid h-11 w-11 place-items-center rounded-2xl bg-accent/15 text-accent2 transition-colors duration-700"><Icon name={c.icon} size={21} /></span>
                      <span className="grid h-8 w-8 place-items-center rounded-full border border-white/12 text-mute transition-transform duration-500 group-hover/flip:rotate-180" aria-hidden><Icon name="RotateCcw" size={13} /></span>
                    </div>
                    <h3 className="h-card text-[1.4rem] leading-[1.15] text-ink">{c.front}</h3>
                  </div>
                }
                back={
                  <div className="sg-glass sg-glass-strong flex h-[12.5rem] items-center rounded-[1.6rem] p-6">
                    <p className="text-[0.98rem] leading-relaxed text-ink/90">{c.back}</p>
                  </div>
                }
              />
            </Reveal>
          ))}
        </div>
      </div>
    </Section>
  );
}

/* ---------------- What can only a mirror do: tilting spotlight cards ---------------- */
function TiltCard({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const rx = useMotionValue(0), ry = useMotionValue(0), lx = useMotionValue(50), ly = useMotionValue(50);
  const srx = useSpring(rx, { stiffness: 200, damping: 20 }), sry = useSpring(ry, { stiffness: 200, damping: 20 });
  const glowX = useTransform(lx, (v) => `${v}%`), glowY = useTransform(ly, (v) => `${v}%`);
  const onMove = (e: React.PointerEvent) => {
    if (isCoarse || reducedMotion || !ref.current) return;
    const r = ref.current.getBoundingClientRect();
    const px = (e.clientX - r.left) / r.width, py = (e.clientY - r.top) / r.height;
    ry.set((px - 0.5) * 9); rx.set(-(py - 0.5) * 7); lx.set(px * 100); ly.set(py * 100);
  };
  const reset = () => { rx.set(0); ry.set(0); };
  return (
    <motion.div ref={ref} onPointerMove={onMove} onPointerLeave={reset} className={`group relative [perspective:1200px] ${className}`}>
      <motion.div style={{ rotateX: srx, rotateY: sry }} className="relative h-full [transform-style:preserve-3d]">
        {children}
        {/* a soft lit spot that follows the cursor across the glass */}
        <motion.span aria-hidden className="pointer-events-none absolute h-40 w-40 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white/[0.07] opacity-0 blur-2xl transition-opacity duration-500 group-hover:opacity-100" style={{ left: glowX, top: glowY }} />
      </motion.div>
    </motion.div>
  );
}

function Illustration({ k }: { k: string }) {
  if (k === "Reflect") return (
    <svg viewBox="0 0 160 110" className="h-20 w-auto" aria-hidden>
      <rect x="44" y="6" width="72" height="98" rx="16" fill="none" stroke="rgba(255,255,255,.28)" strokeWidth="1.5" />
      <motion.path d="M60 44 q10 -8 20 -2 M84 42 q10 -6 20 2" fill="none" stroke="rgb(var(--accent2))" strokeWidth="2.2" strokeLinecap="round"
        initial={{ pathLength: 0 }} whileInView={{ pathLength: 1 }} viewport={{ once: false, amount: 0.6 }} transition={{ duration: 1.4, ease: "easeInOut" }} />
      <motion.path d="M66 74 q14 10 28 0" fill="none" stroke="rgb(var(--accent2))" strokeWidth="2.2" strokeDasharray="4 4" strokeLinecap="round"
        initial={{ pathLength: 0 }} whileInView={{ pathLength: 1 }} viewport={{ once: false, amount: 0.6 }} transition={{ duration: 1.2, delay: 0.5, ease: "easeInOut" }} />
    </svg>
  );
  if (k === "Light") return (
    <div className="flex h-20 items-end gap-1.5" aria-hidden>
      {[2700, 3200, 4000, 5000, 6500].map((kk, i) => {
        const c = ["#FFB46B", "#FFC992", "#FFE2C2", "#F4F0FF", "#D6E4FF"][i];
        return (
          <motion.div key={kk} className="flex flex-col items-center gap-1.5" initial={{ opacity: 0.25, y: 8 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: false, amount: 0.6 }} transition={{ delay: i * 0.12, duration: 0.6 }}>
            <span className="block w-6 rounded-full" style={{ height: 18 + i * 8, background: c, boxShadow: `0 0 18px ${c}55` }} />
            <span className="font-mono text-[0.52rem] tracking-[0.08em] text-dim">{kk}K</span>
          </motion.div>
        );
      })}
    </div>
  );
  return (
    <div className="relative grid h-20 w-20 place-items-center" aria-hidden>
      {[0, 1, 2].map((i) => (
        <motion.span key={i} className="absolute rounded-full border border-accent2/50" style={{ width: 30 + i * 26, height: 30 + i * 26 }}
          animate={reducedMotion ? undefined : { opacity: [0.2, 0.9, 0.2], scale: [0.96, 1.03, 0.96] }} transition={{ duration: 3, repeat: Infinity, delay: i * 0.4, ease: "easeInOut" }} />
      ))}
      <span className="dot-accent block h-2.5 w-2.5 rounded-full" />
    </div>
  );
}

export function OnlyMirror() {
  return (
    <Section stream={-1}>
      <div className="wrap">
        <Reveal>
          <Headline lead={ONLY_MIRROR.title[0]} accent={ONLY_MIRROR.title[1]} className="h-section text-[clamp(1.9rem,4.2vw,4rem)]" />
          <p className="body-lg mt-5 max-w-[40rem]">{ONLY_MIRROR.body}</p>
        </Reveal>
        <div className="mt-10 grid gap-4 lg:grid-cols-3">
          {ONLY_MIRROR.items.map((it, i) => (
            <Reveal key={it.k} delay={0.08 * i} className="h-full">
              <TiltCard className="h-full">
                <div className="sg-glass tile-hover flex h-full flex-col rounded-[1.6rem] p-6">
                  <div className="flex items-start justify-between">
                    <Illustration k={it.k} />
                    <Icon name={it.icon} size={18} className="text-accent2" />
                  </div>
                  <h3 className="h-card mt-5 text-[1.32rem] leading-[1.18]">{it.title}</h3>
                  <p className="mt-2.5 text-[0.92rem] leading-relaxed text-mute">{it.body}</p>
                </div>
              </TiltCard>
            </Reveal>
          ))}
        </div>
      </div>
    </Section>
  );
}
