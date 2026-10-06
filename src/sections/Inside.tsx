import { useRef, useState } from "react";
import { motion, useMotionValueEvent, useScroll, useTransform, type MotionValue } from "motion/react";
import { INSIDE } from "../lib/content";
import { isNarrow, reducedMotion } from "../lib/perf";
import { Eyebrow, Reveal } from "../components/ui";

/* what each layer looks like on its glass pane */
function PaneArt({ id }: { id: string }) {
  const A = "rgb(var(--accent2))";
  switch (id) {
    case "mirror":
      return <svg viewBox="0 0 300 400" className="absolute inset-0 h-full w-full" aria-hidden><path d="M-20 300 L240 -20" stroke="rgba(255,255,255,.35)" strokeWidth="18" /><path d="M30 380 L320 60" stroke="rgba(255,255,255,.14)" strokeWidth="6" /></svg>;
    case "display":
      return (
        <svg viewBox="0 0 300 400" className="absolute inset-0 h-full w-full" aria-hidden>
          <defs><pattern id="px" width="12" height="12" patternUnits="userSpaceOnUse"><path d="M12 0 H0 V12" fill="none" stroke="rgba(142,197,255,.22)" strokeWidth="1" /></pattern></defs>
          <rect x="22" y="22" width="256" height="356" rx="14" fill="url(#px)" />
          <rect x="52" y="70" width="110" height="10" rx="5" fill={A} opacity=".8" /><rect x="52" y="92" width="170" height="8" rx="4" fill="rgba(255,255,255,.4)" />
        </svg>
      );
    case "light":
      return (
        <svg viewBox="0 0 300 400" className="absolute inset-0 h-full w-full" aria-hidden>
          {Array.from({ length: 34 }).map((_, i) => {
            const per = 2 * (256 + 356), d = (i / 34) * per; let x = 22, y = 22;
            if (d < 256) { x = 22 + d; } else if (d < 256 + 356) { x = 278; y = 22 + d - 256; } else if (d < 512 + 356) { x = 278 - (d - 612); y = 378; } else { y = 378 - (d - 868); }
            return <circle key={i} cx={x} cy={y} r="4" fill={A} style={{ filter: "drop-shadow(0 0 6px rgb(var(--accent2)))" }} />;
          })}
        </svg>
      );
    case "camera":
      return (
        <svg viewBox="0 0 300 400" className="absolute inset-0 h-full w-full" aria-hidden>
          <circle cx="150" cy="60" r="26" fill="#05060a" stroke="rgba(255,255,255,.5)" strokeWidth="2" />
          <circle cx="150" cy="60" r="11" fill={A} opacity=".7" />
          <rect x="112" y="24" width="76" height="22" rx="6" fill="rgba(255,255,255,.18)" stroke="rgba(255,255,255,.35)" />
        </svg>
      );
    case "audio":
      return (
        <svg viewBox="0 0 300 400" className="absolute inset-0 h-full w-full" aria-hidden>
          {Array.from({ length: 11 }).map((_, i) => <rect key={i} x={90 + i * 11} y={200 - [10, 22, 40, 28, 54, 70, 50, 34, 44, 20, 12][i] / 2} width="6" height={[10, 22, 40, 28, 54, 70, 50, 34, 44, 20, 12][i]} rx="3" fill={A} />)}
          <rect x="125" y="330" width="50" height="18" rx="9" fill="none" stroke="rgba(255,255,255,.5)" strokeWidth="2" />
        </svg>
      );
    case "controller":
      return (
        <svg viewBox="0 0 300 400" className="absolute inset-0 h-full w-full" aria-hidden>
          <rect x="100" y="150" width="100" height="100" rx="10" fill="rgba(255,255,255,.08)" stroke={A} strokeWidth="2" />
          {Array.from({ length: 6 }).map((_, i) => (<g key={i} stroke="rgba(255,255,255,.4)" strokeWidth="2"><path d={`M${112 + i * 16} 150 v-16`} /><path d={`M${112 + i * 16} 250 v16`} /><path d={`M100 ${162 + i * 16} h-16`} /><path d={`M200 ${162 + i * 16} h16`} /></g>))}
          <text x="150" y="206" textAnchor="middle" fontFamily="Geist Mono, monospace" fontSize="15" fill="rgba(255,255,255,.75)">S3</text>
        </svg>
      );
    default:
      return <svg viewBox="0 0 300 400" className="absolute inset-0 h-full w-full" aria-hidden><rect x="8" y="8" width="284" height="384" rx="26" fill="none" stroke="rgba(220,226,240,.75)" strokeWidth="10" /></svg>;
  }
}

function Pane({ i, n, id, p, active }: { i: number; n: number; id: string; p: MotionValue<number>; active: number }) {
  // stacked as one slab, then fanned out; the active layer lifts and brightens
  const spread = useTransform(p, [0, 0.16, 0.9, 1], [8, 74, 74, 60]);
  const z = useTransform(spread, (s) => (n - 1 - i) * s - ((n - 1) * s) / 2 + (active === i ? 34 : 0));
  const transform = useTransform(z, (zz) => `rotateX(56deg) rotateZ(-36deg) translateZ(${zz}px)`);
  const on = active === i;
  return (
    <motion.div className="absolute left-1/2 top-1/2 h-[25rem] w-[18.75rem] -ml-[9.375rem] -mt-[12.5rem] rounded-[1.6rem] transition-[opacity,box-shadow,background-color] duration-500 [transform-style:preserve-3d]"
      style={{ transform, opacity: active < 0 || on ? 1 : 0.45, background: on ? "rgba(255,255,255,0.09)" : "rgba(255,255,255,0.045)", border: `1px solid ${on ? "rgb(var(--accent2) / .7)" : "rgba(255,255,255,.14)"}`, boxShadow: on ? "0 0 40px rgb(var(--accent) / .35), inset 0 1px 0 rgba(255,255,255,.3)" : "inset 0 1px 0 rgba(255,255,255,.18)" }}>
      <PaneArt id={id} />
    </motion.div>
  );
}

function Exploded() {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end end"] });
  const n = INSIDE.layers.length;
  const [active, setActive] = useState(-1);
  useMotionValueEvent(scrollYProgress, "change", (v) => {
    const a = v < 0.18 ? -1 : Math.min(n - 1, Math.floor(((v - 0.18) / 0.8) * n));
    setActive(a);
  });
  const L = active >= 0 ? INSIDE.layers[active] : null;
  return (
    <div ref={ref} className="relative h-[340svh]">
      <div className="sticky top-0 flex h-[100svh] items-center">
        <div className="wrap grid items-center gap-10 lg:grid-cols-[0.85fr_1.15fr]">
          <div>
            <Eyebrow>{INSIDE.eyebrow}</Eyebrow>
            <h2 className="h-section mt-5 text-[clamp(2.2rem,4.6vw,4.2rem)]">
              <span className="block">{INSIDE.title[0]}</span><span className="block accent-word">{INSIDE.title[1]}</span>
            </h2>
            <ol className="mt-8 flex flex-col gap-1.5">
              {INSIDE.layers.map((l, i) => (
                <li key={l.id} className={`flex items-center justify-between rounded-full border px-4 py-2 text-[0.88rem] transition-all duration-500 ${active === i ? "border-accent2/60 bg-white/10 text-ink" : "border-white/10 text-mute"}`}>
                  <span className="flex items-center gap-3"><span className="font-mono text-[0.62rem] tracking-[0.14em] text-dim">{String(i + 1).padStart(2, "0")}</span>{l.name}</span>
                  <span className="font-mono text-[0.66rem] tracking-[0.06em] text-dim">{l.cost}</span>
                </li>
              ))}
            </ol>
            <div className="mt-5 min-h-[4.5rem]">
              <motion.p key={active} initial={{ opacity: 0, y: 6, filter: "blur(6px)" }} animate={{ opacity: 1, y: 0, filter: "blur(0px)" }} transition={{ duration: 0.45 }} className="text-[0.95rem] leading-relaxed text-ink/85">
                {L ? L.spec : INSIDE.body}
              </motion.p>
            </div>
          </div>
          <div className="relative h-[34rem] [perspective:2200px]" aria-hidden>
            <div className="absolute inset-0 [transform-style:preserve-3d]">
              {INSIDE.layers.map((l, i) => <Pane key={l.id} i={i} n={n} id={l.id} p={scrollYProgress} active={active} />)}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function Stacked() {
  return (
    <div className="wrap">
      <Reveal>
        <Eyebrow>{INSIDE.eyebrow}</Eyebrow>
        <h2 className="h-section mt-5 text-[clamp(2.2rem,8vw,3.4rem)]"><span className="block">{INSIDE.title[0]}</span><span className="block accent-word">{INSIDE.title[1]}</span></h2>
        <p className="body-lg mt-5">{INSIDE.body}</p>
      </Reveal>
      <div className="mt-8 flex flex-col gap-3">
        {INSIDE.layers.map((l, i) => (
          <Reveal key={l.id} delay={0.03 * i}>
            <div className="sg-glass flex gap-4 rounded-[1.4rem] p-4">
              <div className="relative h-24 w-[4.5rem] flex-none overflow-hidden rounded-xl border border-white/15 bg-white/5"><PaneArt id={l.id} /></div>
              <div>
                <div className="flex items-baseline justify-between gap-2"><h3 className="h-card text-[1.05rem]">{l.name}</h3><span className="font-mono text-[0.62rem] text-dim">{l.cost}</span></div>
                <p className="mt-1 text-[0.86rem] leading-relaxed text-mute">{l.spec}</p>
              </div>
            </div>
          </Reveal>
        ))}
      </div>
    </div>
  );
}

export function Inside() {
  return (
    <section id="inside" data-stream="1" className="relative">
      {isNarrow || reducedMotion ? <div className="py-24"><Stacked /></div> : <Exploded />}
      <div className="wrap pb-24 md:pb-36">
        <div className="grid gap-3 sm:grid-cols-3">
          {INSIDE.stats.map((s, i) => (
            <Reveal key={s.k} delay={0.06 * i}>
              <div className="sg-glass rounded-[1.4rem] p-6">
                <div className="font-display text-[clamp(1.6rem,2.6vw,2.2rem)] font-medium tracking-[-0.03em]">{s.k}</div>
                <div className="mt-1 font-mono text-[0.64rem] uppercase tracking-[0.14em] text-mute">{s.v}</div>
              </div>
            </Reveal>
          ))}
        </div>
        <Reveal><p className="mt-5 max-w-[56rem] text-[0.8rem] leading-relaxed text-dim">{INSIDE.costNote}</p></Reveal>
      </div>
    </section>
  );
}
