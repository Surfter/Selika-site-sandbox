import { motion } from "framer-motion";
import { BASELINE, ENVS } from "../../lib/environments";
import { hex, kelvinToRGB, springFor } from "../../lib/physics";
import { GlassCard } from "../ui/Glass";
import { Item, Reveal, Stagger, Words } from "../ui/Reveal";

const ROWS = [BASELINE, ...ENVS.slice().sort((a, b) => b.k - a.k)];

/** One environment, as a lit glass tile. The light disc breathes; the baseline row is the one you actually get ready in. */
function EnvTile({ e, base }: { e: typeof ROWS[number]; base?: boolean }) {
  const c = hex(kelvinToRGB(e.k));
  return (
    <GlassCard tint={base} hover className="flex items-start gap-4 p-5">
      <motion.span className="mt-0.5 h-7 w-7 flex-none rounded-full" style={{ background: c }}
        animate={{ boxShadow: [`0 0 12px ${c}`, `0 0 26px ${c}`, `0 0 12px ${c}`] }} transition={{ duration: 3.4, repeat: Infinity, ease: "easeInOut" }} />
      <div className="min-w-0">
        <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
          <span className="h-card text-[1.05rem]">{e.name}</span>
          <span className="tabular text-[0.7rem] uppercase tracking-[0.12em] text-dim">{e.k}K · CRI {e.cri} · {e.lux}</span>
          {base && <span className="rounded-full bg-sky/15 px-2 py-0.5 text-[0.62rem] font-semibold uppercase tracking-[0.12em] text-sky">Where you get ready</span>}
        </div>
        <p className="mt-1.5 text-[0.86rem] leading-relaxed text-mute">{e.note}</p>
      </div>
    </GlassCard>
  );
}

const GAPS = [
  { k: "01", t: "The help isn't on the mirror", b: "Tutorials play on a phone you prop up, pause and scroll with product on your fingers. The guidance and the face it is meant for are in two different places." },
  { k: "02", t: "Colour is chosen in the wrong light", b: "Shade and colour are decided under whatever light the bathroom has, then judged under different light once you have left." },
  { k: "03", t: "The mirror never gets better", b: "Every other screen you own gains new tools after you buy it. The surface you stand in front of every day is finished the day it is made." },
];

export function Problem() {
  return (
    <section id="problem" className="relative py-28 md:py-36">
      <div className="wrap">
        <Reveal><p className="eyebrow mb-4">The problem</p></Reveal>
        <Words as="h2" className="h-section text-[clamp(2rem,5vw,3.6rem)] text-ink" text="You get ready in a mirror. The help is everywhere else." />
        <Reveal delay={0.2}>
          <p className="mt-6 max-w-2xl text-[clamp(1rem,1.4vw,1.15rem)] leading-relaxed text-mute">
            The mirror is where makeup and grooming actually happen, and it is the one thing in the room that does nothing to help. Three gaps follow from that.
          </p>
        </Reveal>

        <Stagger className="mt-12 grid gap-3 md:grid-cols-3" gap={0.08} amount={0.15}>
          {GAPS.map((g) => (
            <Item key={g.k}>
              <GlassCard hover className="h-full p-6">
                <div className="eyebrow mb-3">Gap {g.k}</div>
                <h3 className="h-card text-[1.12rem] text-ink">{g.t}</h3>
                <p className="mt-2.5 text-[0.86rem] leading-relaxed text-mute">{g.b}</p>
              </GlassCard>
            </Item>
          ))}
        </Stagger>

        <Reveal delay={0.1}><p className="eyebrow mb-3 mt-16">Gap 02, in light</p></Reveal>
        <Reveal delay={0.15}>
          <p className="max-w-2xl text-[0.98rem] leading-relaxed text-mute">
            You get ready under one light and are seen under another. These are typical conditions, and the one you get ready in matches none of them.
          </p>
        </Reveal>

        <Stagger className="mt-8 grid gap-3 md:grid-cols-2" gap={0.08} amount={0.15}>
          {ROWS.map((e) => <Item key={e.id}><EnvTile e={e} base={e.id === "bathroom"} /></Item>)}
        </Stagger>

        <Reveal delay={0.1}>
          <p className="mt-6 max-w-2xl border-l border-white/10 pl-4 text-[0.78rem] leading-relaxed text-dim">
            Colour temperature and colour rendering index are standard lighting measures. The values are typical published ranges used to drive the simulation; they are illustrative, not measurements of a specific venue.
          </p>
        </Reveal>
      </div>
    </section>
  );
}

/** Two pillars, arriving from opposite sides, with something alive inside each. */
export function Pillars() {
  return (
    <section className="relative py-24 md:py-32">
      <div className="wrap">
        <Reveal><p className="eyebrow mb-4">What Selika is</p></Reveal>
        <Words as="h2" className="h-section text-[clamp(2rem,5vw,3.6rem)] text-ink" text="One mirror. Two products." />
        <Reveal delay={0.2}>
          <p className="mt-6 max-w-2xl text-[clamp(1rem,1.4vw,1.15rem)] leading-relaxed text-mute">
            Selika comes as two products on the same hardware. Selika Beauty guides your makeup and grooming on your own reflection; Selika Dev opens the same glass to developers who want to build on it. Each one makes the other more useful.
          </p>
        </Reveal>

        <div className="relative mt-14 grid gap-5 lg:grid-cols-[1fr_auto_1fr] lg:items-stretch">
          <Pillar side="left" k="Selika Beauty" title="Your makeup, guided on your reflection"
            body="Step-by-step guidance drawn onto your own reflection while both hands are busy, in steady, high-colour-rendering light, so colour decisions are made in controlled light rather than whatever the bathroom has."
            bullets={["Guided steps for makeup and grooming, on the reflection", "Shade and undertone compared in controlled, high-CRI light", "Try a look, hairstyle, beard or glasses before you commit", "Check a look under office, restaurant or evening presets"]}
            visual={<GuideSketch />} />
          <Connector />
          <Pillar side="right" k="Selika Dev" title="An open mirror to build on"
            body="You already stand here twice a day with both hands busy. Selika Dev opens that surface to developers: modules in a few lines, your own models and agents, and looks, lessons and tools published for every Selika owner."
            bullets={["Modules as small declarative definitions", "Bring your own model, API and agent endpoints", "Per-module permissions: each sees only what you allow", "Publish what you build for every Selika owner"]}
            visual={<ModuleShuffle />} />
        </div>
      </div>
    </section>
  );
}

function Pillar({ side, k, title, body, bullets, visual }: { side: "left" | "right"; k: string; title: string; body: string; bullets: string[]; visual: React.ReactNode }) {
  return (
    <motion.div initial={{ opacity: 0, x: side === "left" ? -60 : 60, filter: "blur(8px)" }} whileInView={{ opacity: 1, x: 0, filter: "blur(0px)" }} viewport={{ once: true, amount: 0.3 }} transition={springFor(0.9, 1)}>
      <GlassCard hover className="flex h-full flex-col p-7 lg:p-8">
        <div className="mb-6 h-28 overflow-hidden rounded-2xl border border-white/10 bg-black/30">{visual}</div>
        <div className="eyebrow mb-3">{k}</div>
        <h3 className="h-card text-[1.45rem] text-ink">{title}</h3>
        <p className="mt-3 text-[0.92rem] leading-relaxed text-mute">{body}</p>
        <ul className="mt-5 flex flex-col gap-2.5">
          {bullets.map((b) => (
            <li key={b} className="flex items-start gap-3 text-[0.86rem] text-ink/85">
              <span className="mt-[0.55em] h-px w-3 flex-none bg-gradient-to-r from-sky to-orchid" />{b}
            </li>
          ))}
        </ul>
      </GlassCard>
    </motion.div>
  );
}

/** The link between the two pillars: one line, a pulse travelling along it. */
function Connector() {
  return (
    <div className="relative hidden w-10 lg:block" aria-hidden>
      <div className="absolute left-1/2 top-8 bottom-8 w-px -translate-x-1/2 bg-gradient-to-b from-transparent via-sky/40 to-transparent" />
      <motion.div className="absolute left-1/2 h-2 w-2 -translate-x-1/2 rounded-full bg-sky shadow-[0_0_14px_#8EC5FF]"
        animate={{ top: ["10%", "88%", "10%"] }} transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }} />
      <div className="glass absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full px-2.5 py-1 text-[0.6rem] font-semibold uppercase tracking-[0.16em] text-mute">same glass</div>
    </div>
  );
}

/** Pillar 01's visual: guide marks drawing themselves onto a face in the mirror, with light passing over it. */
function GuideSketch() {
  const draw = (delay: number) => ({ animate: { pathLength: [0, 1, 1, 0], opacity: [0, 1, 1, 0] }, transition: { duration: 3.2, repeat: Infinity, times: [0, 0.35, 0.75, 1], delay } });
  return (
    <div className="relative h-full w-full">
      <svg viewBox="0 0 200 112" className="absolute inset-0 h-full w-full" aria-hidden>
        <rect x="64" y="4" width="72" height="86" rx="12" fill="rgba(255,255,255,0.04)" stroke="rgba(255,255,255,0.2)" />
        <ellipse cx="100" cy="45" rx="19" ry="24" fill="rgba(217,172,139,0.16)" stroke="rgba(238,242,255,0.32)" strokeWidth=".8" />
        <motion.path d="M89 53 Q82 47 79 38" stroke="#B9D9FF" strokeWidth="1.4" fill="none" strokeLinecap="round" {...draw(0)} />
        <motion.path d="M111 53 Q118 47 121 38" stroke="#B9D9FF" strokeWidth="1.4" fill="none" strokeLinecap="round" {...draw(0.15)} />
        <motion.path d="M94 59 q6 3.6 12 0" stroke="#E9858C" strokeWidth="1.8" fill="none" strokeLinecap="round" {...draw(0.3)} />
        {[93, 107].map((x, i) => <motion.circle key={x} cx={x} cy={40} r={1.9} fill="#EEF2FF" animate={{ opacity: [0.25, 1, 0.25] }} transition={{ duration: 2.4, repeat: Infinity, delay: i * 0.3 }} />)}
      </svg>
      <motion.div className="absolute inset-y-0 w-1/3" style={{ background: "linear-gradient(90deg, transparent, rgba(255,214,170,0.16), rgba(200,225,255,0.18), transparent)", filter: "blur(6px)" }}
        animate={{ x: ["-120%", "420%"] }} transition={{ duration: 5.2, repeat: Infinity, ease: "easeInOut" }} />
      <div className="absolute bottom-2 left-0 right-0 flex justify-center gap-2.5 text-[0.5rem] uppercase tracking-[0.16em] text-dim">
        {["base", "brows", "blush", "liner", "lips"].map((w, i) => (
          <motion.span key={w} animate={{ opacity: [0.3, 1, 0.3] }} transition={{ duration: 2.5, repeat: Infinity, delay: i * 0.5 }}>{w}</motion.span>
        ))}
      </div>
    </div>
  );
}

/** The earlier pillar visual: a warm-to-cool sweep passing over a mirror silhouette. Kept for reuse. */
export function LightSweep() {
  const stops = [1900, 2400, 3000, 4000, 5000, 6500].map((k) => hex(kelvinToRGB(k)));
  return (
    <div className="relative h-full w-full">
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="h-[78%] w-[26%] rounded-xl border border-white/20 bg-white/5" />
      </div>
      <motion.div className="absolute inset-y-0 w-1/3" style={{ background: `linear-gradient(90deg, transparent, ${stops[0]}55, ${stops[3]}66, ${stops[5]}55, transparent)`, filter: "blur(6px)" }}
        animate={{ x: ["-120%", "420%"] }} transition={{ duration: 4.2, repeat: Infinity, ease: "easeInOut" }} />
      <div className="absolute bottom-2 left-0 right-0 flex justify-center gap-2">
        {stops.map((c, i) => (
          <motion.span key={i} className="h-1.5 w-1.5 rounded-full" style={{ background: c }} animate={{ opacity: [0.3, 1, 0.3] }} transition={{ duration: 2.4, repeat: Infinity, delay: i * 0.25 }} />
        ))}
      </div>
    </div>
  );
}

/** Pillar 02's visual: module tiles that keep re-arranging themselves. */
import { useEffect, useState } from "react";
function ModuleShuffle() {
  const [order, setOrder] = useState([0, 1, 2, 3, 4, 5]);
  useEffect(() => {
    const id = setInterval(() => setOrder((o) => { const n = o.slice(); const i = Math.floor(Math.random() * n.length), j = Math.floor(Math.random() * n.length); [n[i], n[j]] = [n[j], n[i]]; return n; }), 2200);
    return () => clearInterval(id);
  }, []);
  const labels = ["looks", "calendar", "lessons", "home", "shades", "agents"];
  return (
    <div className="grid h-full grid-cols-3 gap-1.5 p-3">
      {order.map((i) => (
        <motion.div key={labels[i]} layout transition={springFor(0.7, 0.85)} className="glass flex items-center justify-center rounded-lg text-[0.58rem] uppercase tracking-[0.12em] text-mute">
          {labels[i]}
        </motion.div>
      ))}
    </div>
  );
}
