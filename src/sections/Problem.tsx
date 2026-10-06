import { useRef } from "react";
import { motion, useMotionValue, useSpring, useTransform } from "motion/react";
import { ONLY_MIRROR, PROBLEM } from "../lib/content";
import { Icon } from "../lib/icons";
import { isCoarse, reducedMotion } from "../lib/perf";
import { Eyebrow, FlipCard, Reveal, Section } from "../components/ui";

/* ---------------- The problem: three flip cards ---------------- */
export function Problem() {
  return (
    <Section id="problem" stream={1} className="z-10 -mt-[40svh] md:-mt-[50svh]">
      <div className="wrap">
        <div className="grid gap-10 lg:grid-cols-[1.1fr_0.9fr] lg:items-end">
          <Reveal>
            <Eyebrow>{PROBLEM.eyebrow}</Eyebrow>
            <h2 className="h-section mt-5 text-[clamp(2.3rem,5.2vw,4.8rem)]">
              <span className="block">{PROBLEM.title[0]}</span>
              <span className="block accent-word">{PROBLEM.title[1]}</span>
            </h2>
          </Reveal>
          <Reveal delay={0.1}><p className="body-lg max-w-[30rem]">{PROBLEM.body}</p></Reveal>
        </div>
        <div className="mt-14 grid gap-4 md:grid-cols-3">
          {PROBLEM.cards.map((c, i) => (
            <Reveal key={c.n} delay={0.08 * i}>
              <FlipCard label={c.front} className="h-[19rem]"
                front={
                  <div className="sg-glass flex h-[19rem] flex-col justify-between rounded-[1.75rem] p-7">
                    <div className="flex items-start justify-between">
                      <span className="grid h-12 w-12 place-items-center rounded-2xl bg-accent/15 text-accent2 transition-colors duration-700"><Icon name={c.icon} size={22} /></span>
                      <span className="font-mono text-[0.72rem] tracking-[0.18em] text-dim">{c.n}</span>
                    </div>
                    <div>
                      <h3 className="h-card text-[1.55rem] leading-[1.12] text-ink">{c.front}</h3>
                      <p className="mt-4 inline-flex items-center gap-2 font-mono text-[0.62rem] uppercase tracking-[0.16em] text-mute">
                        <Icon name="RotateCcw" size={12} /> {isCoarse ? "Tap" : "Hover"} for why
                      </p>
                    </div>
                  </div>
                }
                back={
                  <div className="sg-glass sg-glass-strong flex h-[19rem] flex-col justify-between rounded-[1.75rem] p-7">
                    <span className="font-mono text-[0.72rem] tracking-[0.18em] text-accent2">{c.n} · WHY IT MATTERS</span>
                    <p className="text-[1.02rem] leading-relaxed text-ink/90">{c.back}</p>
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
    <svg viewBox="0 0 160 110" className="h-24 w-auto" aria-hidden>
      <rect x="44" y="6" width="72" height="98" rx="16" fill="none" stroke="rgba(255,255,255,.28)" strokeWidth="1.5" />
      <motion.path d="M60 44 q10 -8 20 -2 M84 42 q10 -6 20 2" fill="none" stroke="rgb(var(--accent2))" strokeWidth="2.2" strokeLinecap="round"
        initial={{ pathLength: 0 }} whileInView={{ pathLength: 1 }} viewport={{ once: false, amount: 0.6 }} transition={{ duration: 1.4, ease: "easeInOut" }} />
      <motion.path d="M66 74 q14 10 28 0" fill="none" stroke="rgb(var(--accent2))" strokeWidth="2.2" strokeDasharray="4 4" strokeLinecap="round"
        initial={{ pathLength: 0 }} whileInView={{ pathLength: 1 }} viewport={{ once: false, amount: 0.6 }} transition={{ duration: 1.2, delay: 0.5, ease: "easeInOut" }} />
    </svg>
  );
  if (k === "Light") return (
    <div className="flex h-24 items-end gap-1.5" aria-hidden>
      {[2700, 3200, 4000, 5000, 6500].map((kk, i) => {
        const c = ["#FFB46B", "#FFC992", "#FFE2C2", "#F4F0FF", "#D6E4FF"][i];
        return (
          <motion.div key={kk} className="flex flex-col items-center gap-1.5" initial={{ opacity: 0.25, y: 8 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: false, amount: 0.6 }} transition={{ delay: i * 0.12, duration: 0.6 }}>
            <span className="block w-7 rounded-full" style={{ height: 22 + i * 9, background: c, boxShadow: `0 0 18px ${c}55` }} />
            <span className="font-mono text-[0.52rem] tracking-[0.08em] text-dim">{kk}K</span>
          </motion.div>
        );
      })}
    </div>
  );
  return (
    <div className="relative grid h-24 w-24 place-items-center" aria-hidden>
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
        <Reveal className="max-w-[46rem]">
          <Eyebrow>{ONLY_MIRROR.eyebrow}</Eyebrow>
          <h2 className="h-section mt-5 text-[clamp(2.3rem,5.2vw,4.8rem)]">
            <span className="block">{ONLY_MIRROR.title[0]}</span>
            <span className="block accent-word">{ONLY_MIRROR.title[1]}</span>
          </h2>
          <p className="body-lg mt-6 max-w-[34rem]">{ONLY_MIRROR.body}</p>
        </Reveal>
        <div className="mt-14 grid gap-4 lg:grid-cols-3 [&:hover>*]:opacity-60 [&>*]:transition-opacity [&>*]:duration-500 [&>*:hover]:!opacity-100">
          {ONLY_MIRROR.items.map((it, i) => (
            <Reveal key={it.k} delay={0.08 * i}>
              <TiltCard className="h-full">
                <div className="sg-glass flex h-full min-h-[22rem] flex-col justify-between rounded-[1.75rem] p-7">
                  <div className="flex items-center justify-between">
                    <span className="eyebrow">{String(i + 1).padStart(2, "0")} · {it.k}</span>
                    <Icon name={it.icon} size={18} className="text-accent2" />
                  </div>
                  <div className="my-6"><Illustration k={it.k} /></div>
                  <div>
                    <h3 className="h-card text-[1.45rem] leading-[1.15]">{it.title}</h3>
                    <p className="mt-3 text-[0.92rem] leading-relaxed text-mute">{it.body}</p>
                  </div>
                </div>
              </TiltCard>
            </Reveal>
          ))}
        </div>
      </div>
    </Section>
  );
}
