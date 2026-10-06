import { AnimatePresence, motion, useMotionValue, useMotionValueEvent, useTransform, animate, type MotionValue } from "framer-motion";
import { useEffect, useMemo, useState, type ReactNode } from "react";
import { BASELINE, DEFAULT_ENV, ENVS, kToT, nearestEnv, sampleAt, tToK, type Env } from "../../lib/environments";
import { hex, kelvinToRGB, springFor } from "../../lib/physics";
import { GlassCard, GlassChip } from "../ui/Glass";
import { LitPortrait } from "./Portrait";
import { TemperatureTrack } from "./TemperatureTrack";

export type Mode = "product" | "dev";
export type Sub = "env" | "hud" | "tx";
export type Tx = { makeup: string; hair: string; beard: string; glasses: string };

/* ---------------- state ---------------- */
export function useDemoState() {
  const t = useMotionValue(kToT(DEFAULT_ENV.k));
  const [mode, setMode] = useState<Mode>("product");
  const [sub, setSub] = useState<Sub>("hud");
  const [hud, setHud] = useState<Record<string, boolean>>({ steps: true, tone: true, guide: false, light: false, shift: false });
  const [tx, setTx] = useState<Tx>({ makeup: "natural", hair: "none", beard: "none", glasses: "none" });
  const [mods, setMods] = useState<Record<string, boolean>>({ clock: true, looks: true, calendar: true, tasks: false, github: false, home: false, agent: false });
  const [lastMod, setLastMod] = useState<string>("looks");
  const [near, setNear] = useState<Env>(DEFAULT_ENV);
  useMotionValueEvent(t, "change", (v) => { const n = nearestEnv(v); if (n.id !== near.id) setNear(n); });
  const goEnv = (e: Env) => animate(t, kToT(e.k), springFor(0.42, 1));
  return { t, mode, setMode, sub, setSub, hud, setHud, tx, setTx, mods, setMods, lastMod, setLastMod, near, goEnv };
}
export type DemoState = ReturnType<typeof useDemoState>;

/* ---------------- sway transition between options ---------------- */
const sway = {
  initial: (d: number) => ({ opacity: 0, x: 26 * d, rotate: 1.2 * d, filter: "blur(6px)" }),
  animate: { opacity: 1, x: 0, rotate: 0, filter: "blur(0px)", transition: springFor(0.55, 0.9) },
  exit: (d: number) => ({ opacity: 0, x: -22 * d, rotate: -1 * d, filter: "blur(6px)", transition: { duration: 0.22 } }),
};

/* ---------------- mirror content ---------------- */
export function DemoFace({ s }: { s: DemoState }) {
  const zero = useMotionValue(0);
  const camLabel = s.mode === "dev" ? "Shutter closed" : s.sub === "env" ? "Camera open" : s.sub === "hud" ? "Guiding" : "Simulating";
  return (
    <div className="absolute inset-0">
      {/* the reflection is always there; developer mode dims it and draws over it */}
      <motion.div className="absolute inset-0" animate={{ opacity: s.mode === "dev" ? 0.16 : 1, filter: s.mode === "dev" ? "saturate(.3) brightness(.6)" : "none" }} transition={{ duration: 0.6 }}>
        <LitPortrait t={s.t} id="main">
          {/* the chosen look stays on in Light, so you can see how it reads somewhere else */}
          <AnimatePresence>{s.mode === "product" && (s.sub === "tx" || s.sub === "env") && <TxOverlay key="tx" tx={s.tx} />}</AnimatePresence>
          <AnimatePresence>{s.mode === "product" && s.sub === "hud" && <HudOverlay key="hud" s={s} />}</AnimatePresence>
        </LitPortrait>
      </motion.div>

      <AnimatePresence>
        {s.mode === "product" && s.sub === "env" && (
          <motion.div key="base" className="absolute left-3 bottom-3 z-10 w-[30%] max-w-[7.5rem] overflow-hidden rounded-xl border border-white/20 shadow-2xl"
            initial={{ opacity: 0, y: 12, scale: 0.96 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 12, scale: 0.96 }} transition={springFor(0.5, 1)}>
            <div className="relative aspect-[4/5]"><LitPortrait t={zero} id="base" fixed={BASELINE}><TxOverlay tx={s.tx} /></LitPortrait></div>
            <div className="bg-black/70 px-1.5 py-1 text-center text-[0.5rem] uppercase tracking-[0.12em] text-mute backdrop-blur">Your bathroom · 5000K</div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>{s.mode === "dev" && <Dashboard key="dash" s={s} />}</AnimatePresence>

      {/* camera chip */}
      <div style={{ position: "absolute" }} className="absolute left-1/2 top-2.5 z-20 -translate-x-1/2 glass rounded-full px-2.5 py-1 text-[0.55rem] uppercase tracking-[0.14em] text-mute flex items-center gap-1.5">
        <motion.i className="block h-1.5 w-1.5 rounded-full" animate={{ backgroundColor: s.mode === "dev" ? "#3a4258" : "#7BD6A8", boxShadow: s.mode === "dev" ? "0 0 0 rgba(0,0,0,0)" : "0 0 8px #7BD6A8" }} />
        {camLabel}
      </div>
    </div>
  );
}

/** Everything under the glass: readout, and the track in environment mode. */
export function DemoFooter({ s }: { s: DemoState }) {
  const kText = useTransform(s.t, (v) => `${Math.round(sampleAt(tToK(Math.max(0, Math.min(1, v)))).k / 10) * 10}K`);
  const criText = useTransform(s.t, (v) => `${Math.round(sampleAt(tToK(Math.max(0, Math.min(1, v)))).cri)}`);
  return (
    <div className="flex h-full flex-col justify-center px-2 pb-1 pt-2">
      <AnimatePresence mode="wait">
        {s.mode === "product" ? (
          <motion.div key="p" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }}>
            <TemperatureTrack t={s.t} />
            <div className="mt-2.5 flex flex-col gap-0.5 px-1 text-[0.62rem] uppercase tracking-[0.1em] text-dim tabular">
              <div className="flex items-baseline justify-between gap-3">
                <span className="flex-none">Environment</span>
                <b className="truncate font-semibold text-ink">{s.near.name}</b>
              </div>
              <div className="flex items-baseline justify-between gap-3">
                <span className="flex-none">Condition</span>
                <span className="flex-none"><motion.b className="font-semibold text-ink">{kText}</motion.b> · CRI <motion.b className="font-semibold text-ink">{criText}</motion.b> · {s.near.lux}</span>
              </div>
            </div>
          </motion.div>
        ) : (
          <motion.div key="d" className="flex items-center justify-between px-1 text-[0.66rem] uppercase tracking-[0.12em] text-dim" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }}>
            <span>Runtime <b className="font-semibold text-ink">selika-os 0.4.1-dev</b></span>
            <span className="text-ink font-semibold">{(() => { const c = Object.values(s.mods).filter(Boolean).length; return `${c} ${c === 1 ? "module" : "modules"}`; })()}</span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ---------------- controls (right column) ---------------- */
export function DemoControls({ s }: { s: DemoState }) {
  const dir = s.mode === "dev" ? 1 : s.sub === "env" ? -1 : s.sub === "hud" ? 0.5 : 1;
  const key = s.mode === "dev" ? "dev" : s.sub;
  return (
    <div className="relative">
      <AnimatePresence mode="wait" custom={dir}>
        <motion.div key={key} custom={dir} variants={sway} initial="initial" animate="animate" exit="exit">
          {key === "env" && <EnvPanel s={s} />}
          {key === "hud" && <HudPanel s={s} />}
          {key === "tx" && <TxPanel s={s} />}
          {key === "dev" && <DevPanel s={s} />}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

const PanelH = ({ children }: { children: ReactNode }) => <p className="eyebrow mb-3">{children}</p>;
const Caveat = ({ children }: { children: ReactNode }) => <p className="mt-5 border-l border-white/10 pl-3.5 text-[0.76rem] leading-relaxed text-dim">{children}</p>;

function EnvPanel({ s }: { s: DemoState }) {
  return (
    <div>
      <PanelH>Where are you going?</PanelH>
      <div className="grid grid-cols-2 gap-2">
        {ENVS.slice().reverse().map((e) => {
          const c = hex(kelvinToRGB(e.k)); const on = s.near.id === e.id;
          return (
            <motion.button key={e.id} type="button" aria-pressed={on} onClick={() => s.goEnv(e)}
              className={`glass rounded-2xl p-3 text-left ${on ? "glass-tint" : ""}`}
              whileHover={{ y: -2 }} whileTap={{ scale: 0.97 }} transition={springFor(0.3, 1)}>
              <span className="flex items-center gap-2">
                <motion.span className="h-3 w-3 rounded-full" style={{ background: c }} animate={{ boxShadow: on ? `0 0 14px ${c}` : `0 0 6px ${c}` }} />
                <span className="text-[0.84rem] font-medium">{e.name}</span>
              </span>
              <span className="mt-1 block text-[0.62rem] tabular text-dim">{e.k}K · CRI {e.cri} · {e.lux}</span>
            </motion.button>
          );
        })}
      </div>
      <AnimatePresence mode="wait">
        <motion.p key={s.near.id} className="mt-4 text-[0.82rem] leading-relaxed text-mute" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.25 }}>
          {s.near.note}
        </motion.p>
      </AnimatePresence>
      <Caveat>A browser simulation using illustrative lighting values: colour temperature runs through the black-body approximation to RGB, and the colour rendering index drives saturation and contrast. It shows the direction of the shift, not a measurement. The planned device lights you from the front, so it approximates a destination's main light rather than reproducing a room: it cannot add light from above or behind you, or know a venue's exact spectrum, and does not claim to.</Caveat>
    </div>
  );
}

const HUD_ITEMS = [
  { id: "steps", label: "Guided steps", desc: "Step-by-step makeup guidance, drawn where each step applies on your reflection.", wide: true },
  { id: "tone", label: "Shade & undertone", desc: "Foundation shade and undertone, compared in controlled light." },
  { id: "guide", label: "Placement & symmetry", desc: "Registered markers for brows, liner, beard or product." },
  { id: "light", label: "Lighting map", desc: "Where the key light lands and what it does to contrast." },
  { id: "shift", label: "Colour shift warning", desc: "What changes between your bathroom and this destination." },
];
function Toggle({ on, label, desc, onClick }: { on: boolean; label: string; desc: string; onClick: () => void }) {
  return (
    <motion.button type="button" aria-pressed={on} onClick={onClick}
      className={`glass flex w-full items-start gap-3 rounded-2xl px-3.5 py-3 text-left ${on ? "glass-tint" : ""}`}
      whileHover={{ y: -2 }} whileTap={{ scale: 0.98 }} transition={springFor(0.3, 1)}>
      <motion.span className="mt-0.5 grid h-4 w-4 flex-none place-items-center rounded-md border border-white/30 text-[10px] text-night"
        animate={{ backgroundColor: on ? "#8EC5FF" : "rgba(0,0,0,0)", borderColor: on ? "#8EC5FF" : "rgba(255,255,255,0.3)" }}>{on ? "✓" : ""}</motion.span>
      <span><span className="block text-[0.84rem] font-medium">{label}</span><span className="block text-[0.74rem] leading-snug text-mute">{desc}</span></span>
    </motion.button>
  );
}
function HudPanel({ s }: { s: DemoState }) {
  return (
    <div>
      <PanelH>Reflection overlays</PanelH>
      <div className="grid gap-2 sm:grid-cols-2">
        {HUD_ITEMS.map((h) => <div key={h.id} className={h.wide ? "flex sm:col-span-2" : "flex"}><Toggle on={!!s.hud[h.id]} label={h.label} desc={h.desc} onClick={() => s.setHud({ ...s.hud, [h.id]: !s.hud[h.id] })} /></div>)}
      </div>
      <Caveat>On the planned device, guidance is drawn in register with your reflection so both hands stay free. Your reflection sits twice as far away as the glass, so landing it accurately is exactly what the first build tests. Rendered here from example values. Nothing in Selika makes a medical or diagnostic claim.</Caveat>
    </div>
  );
}

const TX_OPTS = {
  makeup: [{ id: "none", label: "Bare" }, { id: "natural", label: "Natural" }, { id: "evening", label: "Evening" }, { id: "bold", label: "Bold lip" }],
  hair: [{ id: "none", label: "As is" }, { id: "crop", label: "Short crop" }, { id: "long", label: "Longer" }, { id: "tied", label: "Tied back" }],
  beard: [{ id: "none", label: "Clean" }, { id: "stubble", label: "Stubble" }, { id: "full", label: "Full beard" }],
  glasses: [{ id: "none", label: "None" }, { id: "round", label: "Round" }, { id: "rect", label: "Rectangular" }],
} as const;
function TxPanel({ s }: { s: DemoState }) {
  return (
    <div>
      {(["makeup", "hair", "beard", "glasses"] as const).map((g) => (
        <div key={g} className="mb-5">
          <PanelH>{g === "makeup" ? "Makeup look" : g === "hair" ? "Hair" : g === "beard" ? "Facial hair" : "Eyewear"}</PanelH>
          <div className="flex flex-wrap gap-2">
            {TX_OPTS[g].map((o) => <GlassChip key={o.id} active={s.tx[g] === o.id} onClick={() => s.setTx({ ...s.tx, [g]: o.id })}>{o.label}</GlassChip>)}
          </div>
        </div>
      ))}
      <Caveat>Try-on is the most familiar smart-mirror feature and the least defensible on its own; a phone does it well. Here it is the preview before the guidance: pick a look, then the mirror walks you through it, step by step, on your own reflection. Switch to Light to see how the same look reads somewhere else.</Caveat>
    </div>
  );
}

export const MODULES = [
  { id: "clock", name: "Clock & date", desc: "Always-on time, date and the first thing on today.", wide: true },
  { id: "looks", name: "Looks & lessons", desc: "Step-by-step looks published by artists and creators you follow." },
  { id: "calendar", name: "Calendar", desc: "Next events, from whatever calendar you connect." },
  { id: "tasks", name: "Tasks", desc: "Your task system, read-only at a glance." },
  { id: "github", name: "Build status", desc: "Pipelines and open reviews from your own endpoints." },
  { id: "home", name: "Home control", desc: "Lights, heating and scenes on the local network." },
  { id: "agent", name: "Agent activity", desc: "What your own agents did overnight, in plain language.", wide: true },
];
function DevPanel({ s }: { s: DemoState }) {
  return (
    <div>
      <PanelH>Module registry</PanelH>
      <div className="grid gap-2 sm:grid-cols-2">
        {MODULES.map((m) => <Toggle key={m.id} on={!!s.mods[m.id]} label={m.name} desc={m.desc} onClick={() => { const on = !s.mods[m.id]; s.setMods({ ...s.mods, [m.id]: on }); if (on) s.setLastMod(m.id); }} />)}
      </div>
      <PanelH><span className="mt-5 block">A module is about this long</span></PanelH>
      <GlassCard className="rounded-2xl overflow-x-auto p-4">
        <pre className="code m-0 whitespace-pre text-mute">{`// modules/commute.js\n`}<span className="k">export default</span>{` defineModule({\n  id: `}<span className="s">'commute'</span>{`,\n  surface: `}<span className="s">'left-rail'</span>{`,\n  refresh: `}<span className="s">'60s'</span>{`,\n  `}<span className="k">async</span>{` render({ api, ui }) {\n    `}<span className="k">const</span>{` next = `}<span className="k">await</span>{` api.get(`}<span className="s">'transit/next'</span>{`)\n    `}<span className="k">return</span>{` ui.stack([\n      ui.label(`}<span className="s">'COMMUTE'</span>{`),\n      ui.metric(next.mins, `}<span className="s">'min'</span>{`),\n      ui.caption(next.line)\n    ])\n  }\n})`}</pre>
      </GlassCard>
      <Caveat>The platform layer is a direction, not a shipped product. What is real is the decision behind it: Selika does not need to own the looks, the model, the agent or the integrations. It needs to be the surface they run on, for makeup artists, creators, brands and developers alike.</Caveat>
    </div>
  );
}

/* ---------------- overlays inside the glass ---------------- */
/** A readout plate that rises into place; leader lines draw themselves. */
function Plate({ x, y, w, label, val, delay = 0 }: { x: number; y: number; w: number; label: string; val: string; delay?: number }) {
  return (
    <motion.g initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 6 }} transition={{ ...springFor(0.5, 1), delay }}>
      <rect x={x} y={y} width={w} height="30" rx="8" fill="rgba(8,10,18,.74)" stroke="rgba(142,197,255,.32)" strokeWidth=".7" />
      <text x={x + 10} y={y + 13} fill="#98A2B8" fontSize="8.5" letterSpacing=".08em" fontFamily="Plus Jakarta Sans, sans-serif" fontWeight="600">{label}</text>
      <text x={x + 10} y={y + 25} fill="#EEF2FF" fontSize="9" fontFamily="Plus Jakarta Sans, sans-serif" fontWeight="600">{val}</text>
    </motion.g>
  );
}
const TICK = "rgba(238,242,255,.62)";
function Leader({ d, delay = 0 }: { d: string; delay?: number }) {
  return <motion.path d={d} stroke={TICK} strokeWidth=".8" fill="none" strokeLinecap="round"
    initial={{ pathLength: 0, opacity: 0 }} animate={{ pathLength: 1, opacity: 1 }} exit={{ pathLength: 0, opacity: 0 }} transition={{ duration: 0.55, ease: "easeOut", delay }} />;
}
function Ring({ cx, cy, r, delay = 0, dash }: { cx: number; cy: number; r: number; delay?: number; dash?: string }) {
  return <motion.circle cx={cx} cy={cy} r={r} fill="none" stroke="rgba(142,197,255,.5)" strokeWidth={dash ? 1 : 1.2} strokeDasharray={dash}
    initial={{ pathLength: 0, opacity: 0, scale: 0.6 }} animate={{ pathLength: 1, opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.8 }}
    transition={{ duration: 0.9, ease: "easeOut", delay }} style={{ transformOrigin: `${cx}px ${cy}px`, transformBox: "fill-box" as any }} />;
}

/* ---------------- guided steps, drawn where each one applies ---------------- */
function GuideLine({ d, delay = 0, arrow }: { d: string; delay?: number; arrow?: boolean }) {
  return <motion.path d={d} stroke="#B9D9FF" strokeWidth="1.4" fill="none" strokeLinecap="round" markerEnd={arrow ? "url(#hud-arrow)" : undefined}
    initial={{ pathLength: 0, opacity: 0 }} animate={{ pathLength: 1, opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.75, ease: "easeOut", delay }} />;
}
function Dot({ cx, cy, delay = 0 }: { cx: number; cy: number; delay?: number }) {
  return <motion.circle cx={cx} cy={cy} r={3} fill="rgba(238,242,255,.9)" stroke="rgba(142,197,255,.9)" strokeWidth=".8"
    initial={{ opacity: 0, scale: 0 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} transition={{ ...springFor(0.45, 0.7), delay }} style={{ transformOrigin: `${cx}px ${cy}px`, transformBox: "fill-box" as any }} />;
}
const STEPS: { n: string; tip: string; g: ReactNode }[] = [
  { n: "BASE", tip: "Dot high points, blend out", g: <>
    <Dot cx={164} cy={244} /><Dot cx={236} cy={244} delay={0.08} /><Dot cx={200} cy={236} delay={0.16} /><Dot cx={200} cy={291} delay={0.24} />
    <GuideLine d="M164 244 L149 236" arrow delay={0.35} /><GuideLine d="M236 244 L251 236" arrow delay={0.4} /><GuideLine d="M200 291 L200 299" arrow delay={0.45} />
  </> },
  { n: "BROWS", tip: "Follow the arch to the tail", g: <>
    <GuideLine d="M187 185 Q169 176 151 187" /><GuideLine d="M213 185 Q231 176 249 187" delay={0.1} />
    <Ring cx={169} cy={180} r={3} delay={0.4} /><Ring cx={231} cy={180} r={3} delay={0.45} />
  </> },
  { n: "BLUSH", tip: "Sweep up toward the temple", g: <>
    <Ring cx={166} cy={255} r={4} /><Ring cx={234} cy={255} r={4} delay={0.05} />
    <GuideLine d="M166 255 Q151 243 144 227" arrow delay={0.2} /><GuideLine d="M234 255 Q249 243 256 227" arrow delay={0.25} />
  </> },
  { n: "LINER", tip: "Wing toward the brow tail", g: <>
    <Ring cx={157} cy={212} r={3} /><Ring cx={243} cy={212} r={3} delay={0.05} />
    <GuideLine d="M157 211 L145 203" arrow delay={0.2} /><GuideLine d="M243 211 L255 203" arrow delay={0.25} />
  </> },
  { n: "LIPS", tip: "Define the bow, then fill", g: <>
    <Ring cx={194} cy={264} r={2.6} /><Ring cx={206} cy={264} r={2.6} delay={0.05} />
    <GuideLine d="M181 270c7-6 12-8 19-8s12 2 19 8" delay={0.2} /><GuideLine d="M181 270c7 9 12 12 19 12s12-3 19-12" delay={0.35} />
  </> },
];
function StepGuide() {
  const [i, setI] = useState(0);
  useEffect(() => { const id = setInterval(() => setI((n) => (n + 1) % STEPS.length), 3400); return () => clearInterval(id); }, []);
  const st = STEPS[i];
  return (
    <motion.g initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
      <AnimatePresence mode="wait">
        <motion.g key={st.n} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0, transition: { duration: 0.2 } }}>
          <Plate x={110} y={60} w={180} label={`STEP ${i + 1} OF ${STEPS.length} · ${st.n}`} val={st.tip} />
          {st.g}
        </motion.g>
      </AnimatePresence>
      {STEPS.map((_, k) => <motion.circle key={k} cx={184 + k * 8} cy={100} r={1.8} initial={false} animate={{ fill: k === i ? "#8EC5FF" : "rgba(238,242,255,0.28)" }} transition={{ duration: 0.3 }} />)}
    </motion.g>
  );
}
function HudOverlay({ s }: { s: DemoState }) {
  const [cond, setCond] = useState(() => sampleAt(tToK(Math.max(0, Math.min(1, s.t.get())))));
  useMotionValueEvent(s.t, "change", (v) => setCond(sampleAt(tToK(Math.max(0, Math.min(1, v))))));
  const dk = Math.round((cond.k - BASELINE.k) / 10) * 10, dc = Math.round(cond.cri - BASELINE.cri);
  return (
    <motion.svg viewBox="0 0 400 500" preserveAspectRatio="xMidYMid slice" className="absolute inset-0 h-full w-full" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
      <defs>
        <marker id="hud-arrow" viewBox="0 0 8 8" refX="5.5" refY="4" markerWidth="5" markerHeight="5" orient="auto-start-reverse"><path d="M0 0 L8 4 L0 8 z" fill="#B9D9FF" /></marker>
      </defs>
      <AnimatePresence>
        {s.hud.steps && <StepGuide key="steps" />}
        {s.hud.light && (<motion.g key="light" exit={{ opacity: 0 }}>
          <Ring cx={200} cy={214} r={92} dash="3 7" />
          {/* a scan sweeps the face while the lighting map is on */}
          <motion.line x1="112" x2="288" stroke="rgba(142,197,255,.45)" strokeWidth="1" initial={{ y1: 130, y2: 130, opacity: 0 }} animate={{ y1: [130, 300, 130], y2: [130, 300, 130], opacity: [0, 0.9, 0] }} transition={{ duration: 3.2, repeat: Infinity, ease: "easeInOut" }} />
          <Leader d="M58 150 L136 200" delay={0.15} /><Leader d="M342 150 L264 200" delay={0.25} />
          <Plate x={28} y={118} w={110} label="KEY LIGHT" val={cond.k < 3000 ? "LOW / WARM" : cond.k < 4600 ? "SIDE / NEUTRAL" : "HIGH / COOL"} delay={0.3} />
          <Plate x={262} y={118} w={110} label="CONTRAST" val={(cond.i < 0.4 ? "+0.6" : cond.i < 0.5 ? "+0.4" : "+0.1") + " STOP"} delay={0.4} />
        </motion.g>)}
        {s.hud.tone && (<motion.g key="tone" exit={{ opacity: 0 }}>
          {/* sample patch pulses on the cheek */}
          {/* sampled on the jawline, where a foundation shade is usually checked */}
          <motion.rect x="146" y="266" width="20" height="20" rx="5" fill="rgba(142,197,255,.14)" stroke="rgba(142,197,255,.7)" strokeWidth=".9"
            initial={{ opacity: 0, scale: 0.5 }} animate={{ opacity: [0.9, 0.5, 0.9], scale: 1 }} exit={{ opacity: 0 }} transition={{ opacity: { duration: 2.2, repeat: Infinity }, scale: springFor(0.5, 0.8) }} style={{ transformOrigin: "156px 276px", transformBox: "fill-box" as any }} />
          <Leader d="M150 284 L116 292" delay={0.15} />
          <Plate x={14} y={288} w={128} label="SHADE · UNDERTONE" val={cond.k < 2600 ? "WARM" : cond.k < 4600 ? "WARM / NEUTRAL" : "NEUTRAL / COOL"} delay={0.3} />
        </motion.g>)}
        {s.hud.shift && (<motion.g key="shift" exit={{ opacity: 0 }}>
          {/* two swatches: where you got ready, where you are going */}
          <motion.rect x="236" y="256" width="12" height="12" rx="3" fill="#dfe8ff" initial={{ opacity: 0, x: -6 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }} transition={springFor(0.5, 1)} />
          <motion.rect x="252" y="256" width="12" height="12" rx="3" fill={hex(kelvinToRGB(cond.k))} initial={{ opacity: 0, x: 6 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }} transition={{ ...springFor(0.5, 1), delay: 0.1 }} />
          <Leader d="M248 272 L316 308" delay={0.15} />
          <Plate x={256} y={306} w={132} label="SHIFT VS 5000K" val={`${dk > 0 ? "+" : ""}${dk}K / ${dc > 0 ? "+" : ""}${dc} CRI`} delay={0.3} />
        </motion.g>)}
        {s.hud.guide && (<motion.g key="guide" exit={{ opacity: 0 }}>
          <Leader d="M150 244 q50 24 100 0" delay={0.1} />
          <Ring cx={150} cy={244} r={5} delay={0.25} /><Ring cx={250} cy={244} r={5} delay={0.35} />
          <Ring cx={200} cy={256} r={3} delay={0.45} />
          <Plate x={140} y={352} w={122} label="CHEEK LINE" val="MATCHED" delay={0.4} />
        </motion.g>)}
      </AnimatePresence>
    </motion.svg>
  );
}

const TX_PATHS: Record<string, Record<string, string>> = {
  makeup: {
    natural: '<defs><radialGradient id="mk-blush1"><stop offset="0" stop-color="#E9858C" stop-opacity=".42"/><stop offset="1" stop-color="#E9858C" stop-opacity="0"/></radialGradient></defs><ellipse cx="160" cy="250" rx="20" ry="12" fill="url(#mk-blush1)" transform="rotate(-18 160 250)"/><ellipse cx="240" cy="250" rx="20" ry="12" fill="url(#mk-blush1)" transform="rotate(18 240 250)"/><path d="M182 270c7-5 12-7 18-7s11 2 18 7c-7 8-12 11-18 11s-11-3-18-11z" fill="#C2636A" opacity=".55"/><path d="M157 211c9-7 22-8 31-1" stroke="#2A1C16" stroke-width="1.6" fill="none" opacity=".7"/><path d="M243 211c-9-7-22-8-31-1" stroke="#2A1C16" stroke-width="1.6" fill="none" opacity=".7"/>',
    evening: '<defs><radialGradient id="mk-smoke" cx=".5" cy=".65" r=".6"><stop offset="0" stop-color="#4B2E48" stop-opacity=".78"/><stop offset="1" stop-color="#4B2E48" stop-opacity="0"/></radialGradient><radialGradient id="mk-blush2"><stop offset="0" stop-color="#C9636F" stop-opacity=".45"/><stop offset="1" stop-color="#C9636F" stop-opacity="0"/></radialGradient></defs><ellipse cx="171" cy="200" rx="21" ry="9" fill="url(#mk-smoke)"/><ellipse cx="229" cy="200" rx="21" ry="9" fill="url(#mk-smoke)"/><path d="M156 212c9-8 22-9 32-1" stroke="#140C0A" stroke-width="2.2" fill="none"/><path d="M157 211l-10-7" stroke="#140C0A" stroke-width="2.2" stroke-linecap="round"/><path d="M244 212c-9-8-22-9-32-1" stroke="#140C0A" stroke-width="2.2" fill="none"/><path d="M243 211l10-7" stroke="#140C0A" stroke-width="2.2" stroke-linecap="round"/><ellipse cx="156" cy="252" rx="22" ry="11" fill="url(#mk-blush2)" transform="rotate(-24 156 252)"/><ellipse cx="244" cy="252" rx="22" ry="11" fill="url(#mk-blush2)" transform="rotate(24 244 252)"/><path d="M182 270c7-5 12-7 18-7s11 2 18 7c-7 8-12 11-18 11s-11-3-18-11z" fill="#7E2A3E" opacity=".85"/>',
    bold: '<defs><radialGradient id="mk-blush3"><stop offset="0" stop-color="#E07B83" stop-opacity=".3"/><stop offset="1" stop-color="#E07B83" stop-opacity="0"/></radialGradient></defs><ellipse cx="160" cy="250" rx="18" ry="10" fill="url(#mk-blush3)"/><ellipse cx="240" cy="250" rx="18" ry="10" fill="url(#mk-blush3)"/><path d="M157 211c9-8 22-9 31-1" stroke="#140C0A" stroke-width="1.8" fill="none"/><path d="M243 211c-9-8-22-9-31-1" stroke="#140C0A" stroke-width="1.8" fill="none"/><path d="M182 270c7-5 12-7 18-7s11 2 18 7c-7 8-12 11-18 11s-11-3-18-11z" fill="#B3202E" opacity=".9"/><path d="M182 270c7-5 12-7 18-7s11 2 18 7" stroke="#8C1420" stroke-width="1.1" fill="none"/>',
  },
  hair: {
    crop: '<path d="M200 116c41 0 67 29 67 74 0 6-1 12-2 17-6-21-12-34-23-38-12 8-28 11-42 11s-30-3-42-11c-11 4-17 17-23 38-1-5-2-11-2-17 0-45 26-74 67-74z" fill="url(#main-hair)"/>',
    long: '<path d="M200 118c45 0 71 32 71 76 0 36-4 72-10 100-4-36-4-72-9-93-14 12-35 17-52 17s-38-5-52-17c-5 21-5 57-9 93-6-28-10-64-10-100 0-44 26-76 71-76z" fill="url(#main-hair)"/>',
    tied: '<path d="M200 116c41 0 67 29 67 74 0 6-1 12-2 17-5-20-11-31-21-35-13 9-29 12-44 12s-31-3-44-12c-10 4-16 15-21 35-1-5-2-11-2-17 0-45 26-74 67-74z" fill="url(#main-hair)"/><path d="M266 184c13 4 19 19 15 34-3 13-9 21-17 22 7-19 7-41 2-56z" fill="url(#main-hair)"/>',
  },
  beard: {
    stubble: '<path d="M143 238c4 34 26 62 57 62s53-28 57-62c3 32-12 74-57 74s-60-42-57-74z" fill="#3A2A1D" opacity=".55"/>',
    full: '<path d="M139 232c3 42 25 76 61 76s58-34 61-76c6 42-14 88-61 88s-67-46-61-88z" fill="#33241A"/><path d="M182 270c7-5 12-7 18-7s11 2 18 7c-7 8-12 11-18 11s-11-3-18-11z" fill="#9A5A52"/>',
  },
  glasses: {
    round: '<circle cx="172" cy="212" r="22" fill="#A8CDF0" opacity=".1"/><circle cx="228" cy="212" r="22" fill="#A8CDF0" opacity=".1"/><g fill="none" stroke="#E4E8F4" stroke-width="2.6" opacity=".92"><circle cx="172" cy="212" r="22"/><circle cx="228" cy="212" r="22"/><path d="M194 210h12M150 207l-14-4M250 207l14-4"/></g>',
    rect: '<rect x="150" y="198" width="44" height="28" rx="5" fill="#A8CDF0" opacity=".1"/><rect x="206" y="198" width="44" height="28" rx="5" fill="#A8CDF0" opacity=".1"/><g fill="none" stroke="#E4E8F4" stroke-width="2.6" opacity=".92"><rect x="150" y="198" width="44" height="28" rx="5"/><rect x="206" y="198" width="44" height="28" rx="5"/><path d="M194 210h12M150 204l-14-4M250 204l14-4"/></g>',
  },
};
function TxOverlay({ tx }: { tx: Tx }) {
  /* makeup sits over the beard (so a lip colour reads) and under hair and glasses */
  const html = useMemo(() => (TX_PATHS.beard[tx.beard] ?? "") + (TX_PATHS.makeup[tx.makeup] ?? "") + (TX_PATHS.hair[tx.hair] ?? "") + (TX_PATHS.glasses[tx.glasses] ?? ""), [tx]);
  return (
    <motion.svg viewBox="0 0 400 500" preserveAspectRatio="xMidYMid slice" className="absolute inset-0 h-full w-full" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
      <AnimatePresence mode="popLayout">
        <motion.g key={html} initial={{ opacity: 0, scale: 0.985 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.35 }} style={{ transformOrigin: "200px 200px" }} dangerouslySetInnerHTML={{ __html: html }} />
      </AnimatePresence>
    </motion.svg>
  );
}

/* ---------------- developer dashboard ---------------- */
const CMDS: Record<string, string> = { clock: "what's the time", looks: "start the soft glam look", calendar: "what do I have today", tasks: "show me my tasks", github: "how's the build", home: "turn the bathroom light warm", agent: "what did the agents do overnight" };
function Tile({ id, dense }: { id: string; dense?: boolean }) {
  const d = new Date();
  const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"], mons = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const H = ({ l, r }: { l: string; r: string }) => <div className="mb-1.5 flex justify-between text-[0.52rem] uppercase tracking-[0.14em] text-dim"><span>{l}</span><span className="text-[#7BD6A8]">{r}</span></div>;
  const R = ({ l, r }: { l: string; r: string }) => <div className="flex items-baseline justify-between gap-2 text-[0.72rem] leading-relaxed"><b className="truncate font-medium">{l}</b><i className="flex-none not-italic tabular text-[0.62rem] text-mute">{r}</i></div>;
  const body: Record<string, ReactNode> = {
    clock: <><div className={`font-display leading-none tracking-[-0.03em] tabular ${dense ? "text-[1.9rem]" : "text-[2.6rem]"}`}>{`${d.getHours()}`.padStart(2, "0")}:{`${d.getMinutes()}`.padStart(2, "0")}</div><div className="mt-1 text-[0.6rem] uppercase tracking-[0.14em] text-mute">{days[d.getDay()]} · {d.getDate()} {mons[d.getMonth()]}</div></>,
    looks: <><H l="Looks" r="2 new" /><R l="Soft glam" r="artist" /><R l="Office look" r="creator" /><R l="Spring shades" r="brand" /></>,
    calendar: <><H l="Calendar" r="live" /><R l="Standup" r="09:30" /><R l="Access review" r="13:00" /><R l="Dinner, Nara" r="19:45" /></>,
    tasks: <><H l="Tasks" r="3 open" /><R l="Order acrylic sample" r="today" /><R l="LED driver test" r="wed" /><R l="Write BOM" r="fri" /></>,
    github: <><H l="Build" r="passing" /><div className="font-display text-[1.6rem] leading-none">14<span className="text-[0.6rem] tracking-[0.1em] text-mute"> / 14</span></div><div className="mt-1.5"><R l="2 reviews waiting" r="main" /></div></>,
    home: <><H l="Home" r="4 devices" /><R l="Bathroom" r="2700K" /><R l="Hallway" r="off" /><R l="Heating" r="19.5°" /></>,
    agent: <><H l="Agents" r="overnight" /><R l="Sourcing agent: 6 new suppliers matched" r="04:12" /><R l="Inbox triage: 11 handled, 2 flagged" r="06:00" /></>,
  };
  const wide = !!MODULES.find((m) => m.id === id)?.wide;
  return (
    <motion.div layout className={`glass flex min-h-0 flex-col justify-center overflow-hidden rounded-2xl ${dense ? "px-2.5 py-2" : "px-3 py-2.5"} ${wide ? "col-span-2" : ""}`}
      initial={{ opacity: 0, y: 10, scale: 0.97 }} animate={{ opacity: 1, y: 0, scale: 1 }} transition={springFor(0.5, 0.9)}>
      {body[id]}
    </motion.div>
  );
}
function Dashboard({ s }: { s: DemoState }) {
  const on = MODULES.filter((m) => s.mods[m.id]);
  /* Count rows the way the grid actually fills them. Auto-placement never moves the
     cursor backwards, so a narrow tile followed by a wide one leaves a hole and starts
     a new row; estimating instead of walking it under-counted and squeezed every row. */
  let rows = 0, col = 0;
  for (const m of on) {
    if (m.wide) { if (col) { rows++; col = 0; } rows++; }
    else if (++col === 2) { rows++; col = 0; }
  }
  if (col) rows++;
  const dense = rows >= 4;
  return (
    <motion.div className={`absolute inset-0 z-10 flex flex-col p-3 pt-9 ${dense ? "dense gap-1.5" : "gap-2"}`} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
      {on.length === 0 ? (
        <div className="m-auto text-center text-[0.62rem] uppercase leading-loose tracking-[0.14em] text-dim">No modules loaded<br />it is a mirror again</div>
      ) : (
        <motion.div layout
          className={`grid min-h-0 flex-1 grid-cols-2 items-stretch overflow-hidden ${dense ? "gap-1.5" : "gap-2"}`}
          /* Rows share the room, but the grid itself is capped at what these rows deserve.
             A full board fills the glass; one module stays a tile and leaves the rest of
             the mirror reflecting, which is the honest behaviour for a mirror. */
          style={{ gridAutoRows: "minmax(0, 1fr)", maxHeight: `calc(${rows} * 6.5rem + ${rows - 1} * ${dense ? "0.375rem" : "0.5rem"})` }}>
          {/* No exit animation here on purpose. AnimatePresence kept removed tiles alive in
              the grid, which added rows the height cap had not budgeted for, squeezing every
              row until content spilled into its neighbour. A module you switch off just goes. */}
          {on.map((m) => <Tile key={m.id} id={m.id} dense={dense} />)}
        </motion.div>
      )}
      <div className="mt-auto flex flex-none gap-2 border-t border-white/10 pt-2 text-[0.66rem] text-mute">
        <b className="font-normal text-sky">“Selika,</b>
        <AnimatePresence mode="wait">
          <motion.span key={s.lastMod} className="truncate" initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }}>{CMDS[s.lastMod] ?? "show me my tasks"}”</motion.span>
        </AnimatePresence>
      </div>
    </motion.div>
  );
}
