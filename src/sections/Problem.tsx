import { useRef } from "react";
import { motion, useMotionValue, useSpring, useTransform } from "motion/react";
import { ONLY_MIRROR, PROBLEM } from "../lib/content";
import { Icon } from "../lib/icons";
import { isCoarse, reducedMotion } from "../lib/perf";
import { FlipCard, Headline, Reveal, Section } from "../components/ui";
import { LightArt, ReflectArt, ReturnArt } from "./OnlyMirrorArt";

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
          <p className="body-lg mt-4 max-w-[46rem]">{PROBLEM.body}</p>
        </Reveal>
        <div className="mt-10 grid gap-4 md:grid-cols-3">
          {PROBLEM.cards.map((c, i) => (
            <Reveal key={c.n} delay={0.08 * i} className="h-full">
              <FlipCard label={c.front} className="h-full"
                front={
                  <div className="sg-glass tile-hover flex h-full flex-col rounded-[1.6rem] p-6">
                    <div className="flex items-start justify-between">
                      <span className="grid h-11 w-11 place-items-center rounded-2xl bg-accent/15 text-accent2 transition-colors duration-700"><Icon name={c.icon} size={21} /></span>
                      <span className="grid h-8 w-8 place-items-center rounded-full border border-white/12 text-mute transition-transform duration-500 group-hover/flip:rotate-180" aria-hidden><Icon name="RotateCcw" size={13} /></span>
                    </div>
                    <h3 className="h-card mt-5 text-[1.3rem] leading-[1.18] text-ink">{c.front}</h3>
                    <p className="mt-2.5 text-[0.95rem] leading-relaxed text-mute">{c.text}</p>
                  </div>
                }
                back={
                  <div className="sg-glass sg-glass-strong flex h-full flex-col rounded-[1.6rem] p-6" style={{ boxShadow: "inset 0 0 0 1px rgb(var(--accent2) / .35)" }}>
                    <span className="grid h-11 w-11 place-items-center rounded-2xl bg-accent/25 text-accent2"><Icon name="Sparkles" size={20} /></span>
                    <p className="mt-5 text-[0.82rem] font-medium text-accent2">How Selika helps</p>
                    <p className="mt-2 text-[1.02rem] leading-relaxed text-ink/90">{c.fix}</p>
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
                <div className="sg-glass tile-hover flex h-full flex-col rounded-[1.6rem] p-3">
                  {it.k === "Reflect" ? <ReflectArt /> : it.k === "Light" ? <LightArt /> : <ReturnArt />}
                  <div className="flex items-center gap-2.5 px-3 pt-5">
                    <span className="grid h-8 w-8 flex-none place-items-center rounded-xl bg-accent/15 text-accent2"><Icon name={it.icon} size={16} /></span>
                    <h3 className="h-card text-[1.22rem] leading-[1.18]">{it.title}</h3>
                  </div>
                  <p className="mt-auto px-3 pb-3 pt-3 text-[0.92rem] leading-relaxed text-mute">{it.body}</p>
                </div>
              </TiltCard>
            </Reveal>
          ))}
        </div>
      </div>
    </Section>
  );
}
