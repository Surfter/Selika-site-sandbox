import { useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { Icon } from "../../lib/icons";
import { kelvinToRGB, hex } from "../../lib/physics";
import { LIGHTS, LOOKS, MODULES, STEPS, TONES, useDemo, type ModelId, type ModuleId, type Perm } from "./state";
import { FACE_PACKS, facePath } from "./facePacks";

const H = ({ children }: { children: React.ReactNode }) => <p className="mb-3 text-[0.8rem] font-medium text-mute">{children}</p>;
const ease = [0.16, 1, 0.3, 1] as const;

/* A row of option buttons; one opens its drawer at a time, and choosing another closes the first. */
type Seg<T extends string> = { id: T; label: string; value: string; icon: string };
function Segments<T extends string>({ items, open, setOpen, children }: { items: Seg<T>[]; open: T | null; setOpen: (v: T | null) => void; children: (id: T) => React.ReactNode }) {
  return (
    <div>
      <div className={`grid gap-1.5 ${items.length === 4 ? "grid-cols-2 sm:grid-cols-4" : "grid-cols-3"}`} role="tablist" aria-label="Options">
        {items.map((it) => {
          const on = open === it.id;
          return (
            <button key={it.id} type="button" role="tab" aria-selected={on} aria-expanded={on} onClick={() => setOpen(on ? null : it.id)}
              className={`group relative flex flex-col items-center gap-1.5 rounded-2xl px-2 py-2.5 text-center transition-all duration-300 sm:flex-row sm:gap-2.5 sm:px-3 sm:text-left ${on ? "bg-white text-night shadow-[0_10px_30px_-12px_rgba(255,255,255,0.5)]" : "sg-glass text-ink hover:bg-white/10"}`}>
              <span className={`grid h-8 w-8 flex-none place-items-center rounded-xl transition-colors duration-300 ${on ? "bg-night/10 text-night" : "bg-accent/15 text-accent2 group-hover:bg-accent/25"}`}><Icon name={it.icon} size={16} /></span>
              <span className="min-w-0">
                <span className="block whitespace-nowrap text-[0.8rem] font-medium leading-tight sm:text-[0.84rem]">{it.label}</span>
                <span className={`hidden truncate text-[0.72rem] leading-tight sm:block ${on ? "text-night/60" : "text-mute"}`}>{it.value}</span>
              </span>
              <Icon name="ChevronDown" size={14} className={`ml-auto hidden flex-none transition-transform duration-300 sm:block ${on ? "rotate-180 text-night/60" : "text-dim"}`} />
            </button>
          );
        })}
      </div>
      <AnimatePresence initial={false} mode="wait">
        {open && (
          <motion.div key={open} className="overflow-hidden" initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.3, ease }}>
            <div className="pt-4">{children(open)}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ---------------- Selika Beauty ---------------- */
type BeautySeg = "look" | "light" | "skin";
export function BeautyPanel() {
  const d = useDemo();
  const [open, setOpen] = useState<BeautySeg | null>(null);
  const L = LIGHTS.find((l) => l.id === d.light)!;
  const look = LOOKS.find((l) => l.id === d.look)!;
  const photo = FACE_PACKS.length > 0;
  const next = () => { const n = Math.min(STEPS.length - 1, d.step + 1); d.set({ step: n }); d.say(STEPS[n].voice); if (n === STEPS.length - 1) d.set({ smile: d.smile + 1 }); };
  const segs: Seg<BeautySeg>[] = [
    { id: "look", label: "Look", value: look.name, icon: "Palette" },
    { id: "light", label: "Light", value: `${L.k}K`, icon: "SunMedium" },
    { id: "skin", label: "Skin tone", value: photo ? (FACE_PACKS[d.face]?.label ?? "") : `Tone ${d.tone + 1}`, icon: "ScanFace" },
  ];
  return (
    <div className="flex flex-col gap-6">
      <Segments items={segs} open={open} setOpen={setOpen}>
        {(id) => id === "look" ? (
          <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-4">
            {LOOKS.map((l) => (
              <button key={l.id} type="button" aria-pressed={d.look === l.id} onClick={() => { d.set({ look: l.id, step: Math.max(d.step, 4) }); d.say(`${l.name} look.`); }}
                className={`flex h-11 items-center justify-center gap-2 rounded-xl px-3 text-[0.84rem] transition-all duration-300 ${d.look === l.id ? "bg-white/[0.14] text-ink ring-1 ring-white/40" : "sg-glass text-ink/85 hover:text-ink"}`}>
                <span className="h-3.5 w-3.5 rounded-full ring-1 ring-black/20 transition-transform duration-300" style={{ background: l.lip, transform: d.look === l.id ? "scale(1.2)" : undefined }} />{l.name}
              </button>
            ))}
          </div>
        ) : id === "light" ? (
          <div>
            <div className="grid grid-cols-5 gap-1.5">
              {LIGHTS.map((l) => {
                const c = hex(kelvinToRGB(l.k)); const on = d.light === l.id;
                return (
                  <button key={l.id} type="button" aria-pressed={on} onClick={() => d.set({ light: l.id })}
                    className={`group/l rounded-xl px-1 py-2.5 text-center transition-all duration-300 ${on ? "bg-white/[0.12] ring-1 ring-white/40" : "sg-glass hover:bg-white/10"}`}>
                    <span className="mx-auto block h-3 w-3 rounded-full transition-transform duration-300 ease-out-expo group-hover/l:scale-125" style={{ background: c, boxShadow: `0 0 ${on ? 14 : 6}px ${c}` }} />
                    <span className="mt-1.5 block text-[0.7rem] font-medium text-ink">{l.name}</span>
                    <span className="block text-[0.62rem] text-dim">{l.k}K</span>
                  </button>
                );
              })}
            </div>
            <p className="mt-3 text-[0.82rem] leading-relaxed text-mute">{L.note}</p>
          </div>
        ) : (
          <div className="flex flex-wrap gap-2">
            {photo ? FACE_PACKS.map((f, i) => (
              <button key={f.id} type="button" aria-label={`Skin tone: ${f.label}`} aria-pressed={d.face === i} onClick={() => d.set({ face: i })}
                className={`flex items-center gap-2 rounded-full py-1 pl-1 pr-3 text-[0.82rem] transition-all duration-300 ${d.face === i ? "bg-white/[0.14] text-ink ring-1 ring-white/40" : "sg-glass text-ink/80 hover:text-ink"}`}>
                <img src={facePath(f.id, "-thumb.jpg")} alt="" width={30} height={30} loading="lazy" decoding="async" className="h-[1.9rem] w-[1.9rem] rounded-full object-cover" />{f.label}
              </button>
            )) : TONES.map((t, i) => (
              <button key={t} type="button" aria-label={`Skin tone ${i + 1}`} aria-pressed={d.tone === i} onClick={() => d.set({ tone: i })}
                className={`h-9 w-9 rounded-full transition-transform duration-300 hover:scale-110 ${d.tone === i ? "ring-2 ring-white ring-offset-2 ring-offset-night" : "ring-1 ring-white/20"}`} style={{ background: t }} />
            ))}
          </div>
        )}
      </Segments>

      <div className="border-t border-white/10 pt-5">
        <H>Guided steps</H>
        <div className="flex gap-1.5" role="tablist" aria-label="Steps">
          {STEPS.map((s, i) => (
            <button key={s.id} type="button" role="tab" aria-selected={d.step === i} onClick={() => { d.set({ step: i }); d.say(s.voice); if (i === STEPS.length - 1) d.set({ smile: d.smile + 1 }); }}
              className={`group flex-1 rounded-xl px-1 py-2 text-center transition-all duration-300 ${d.step === i ? "bg-white text-night" : i < d.step ? "sg-glass text-ink" : "sg-glass text-mute hover:text-ink"}`}>
              <span className="block text-[0.62rem] opacity-60">{i + 1}</span>
              <span className="block text-[0.74rem] font-medium">{s.name}</span>
            </button>
          ))}
        </div>
        <motion.p key={d.step} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35, ease }} className="mt-4 min-h-[3.2rem] text-[0.92rem] leading-relaxed text-ink/85">{STEPS[d.step].line}</motion.p>
      </div>

      <div className="flex items-center gap-2 border-t border-white/10 pt-5">
        <button type="button" onClick={next} disabled={d.step === STEPS.length - 1} className="btn-accent inline-flex h-11 flex-1 items-center justify-center gap-2 rounded-full px-5 text-[0.9rem] font-medium disabled:opacity-40 sm:flex-none">
          Next step <Icon name="ArrowRight" size={15} className="icon-nudge" />
        </button>
        <button type="button" onClick={() => d.set({ step: 0 })} className="sg-glass inline-flex h-11 items-center gap-2 rounded-full px-5 text-[0.9rem] text-ink/85 hover:text-ink"><Icon name="RotateCcw" size={14} className="icon-spin" />Start again</button>
      </div>
    </div>
  );
}

/* ---------------- Selika Dev ---------------- */
const PERMS: { id: Perm; label: string; icon: string }[] = [
  { id: "camera", label: "Camera", icon: "Camera" }, { id: "mic", label: "Microphone", icon: "Mic" },
  { id: "calendar", label: "Calendar", icon: "Calendar" }, { id: "network", label: "Network", icon: "CloudSun" },
];
const MODELS: { id: ModelId; label: string; note: string }[] = [
  { id: "device", label: "On-device", note: "Runs on your phone. Nothing leaves your devices." },
  { id: "endpoint", label: "Your endpoint", note: "Point modules at a model API you choose." },
  { id: "agent", label: "Your agent", note: "Hand the brief to an agent you run." },
];

function code(id: ModuleId, perms: Record<Perm, boolean>, model: ModelId) {
  const m = MODULES.find((x) => x.id === id)!;
  const granted = (Object.keys(perms) as Perm[]).filter((p) => perms[p]);
  const lines: [string, string][][] = [
    [["import ", "k"], ["{ module }", "p"], [" from ", "k"], ['"@selika/sdk"', "s"]],
    [],
    [["export default ", "k"], ["module", "f"], ["({", "p"]],
    [["  name: ", "p"], [`"${m.id}"`, "s"], [",", "p"]],
    [["  permissions: ", "p"], [`[${granted.map((g) => `"${g}"`).join(", ")}]`, "s"], [",", "p"]],
    [["  model: ", "p"], [model === "device" ? '"on-device"' : model === "endpoint" ? 'env("MODEL_URL")' : 'agent("brief")', "s"], [",", "p"]],
    ...(id === "agent" ? [[["  voice: ", "p"], ['"read my brief"', "s"], [",", "p"]]] as [string, string][][] : []),
    [["  render", "f"], [": (ctx) => ", "p"], ["ctx.", "p"], [id === "agent" ? "brief" : id === "build" ? "status" : "card", "f"], ["(),", "p"]],
    [["})", "p"]],
  ];
  return lines;
}
const COL: Record<string, string> = { k: "text-[#8ec5ff]", s: "text-[#d3b8ff]", f: "text-white", p: "text-white/60" };

type DevSeg = "modules" | "perms" | "model";
export function DevPanel() {
  const d = useDemo();
  const [open, setOpen] = useState<DevSeg | null>(null);
  const sel = MODULES.find((m) => m.id === d.selected)!;
  const perms = d.perms[d.selected];
  const setPerm = (p: Perm) => d.set({ perms: { ...d.perms, [d.selected]: { ...perms, [p]: !perms[p] } } });
  const count = MODULES.filter((m) => d.on[m.id]).length;
  const model = MODELS.find((m) => m.id === d.model)!;
  const segs: Seg<DevSeg>[] = [
    { id: "modules", label: "Modules", value: `${count} on the glass`, icon: "LayoutGrid" },
    { id: "perms", label: "Permissions", value: sel.name, icon: "ShieldCheck" },
    { id: "model", label: "Model", value: model.label, icon: "Cpu" },
  ];
  return (
    <div className="flex flex-col gap-6">
      <Segments items={segs} open={open} setOpen={setOpen}>
        {(id) => id === "modules" ? (
          <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-3">
            {MODULES.map((m) => {
              const on = d.on[m.id];
              return (
                <button key={m.id} type="button" aria-pressed={on} onClick={() => d.set({ on: { ...d.on, [m.id]: !on }, selected: m.id })}
                  className={`flex items-center gap-2 rounded-xl px-2.5 py-2.5 text-left text-[0.8rem] transition-all duration-300 ${on ? "bg-white/[0.12] text-ink ring-1 ring-white/30" : "sg-glass text-mute hover:text-ink"} ${d.selected === m.id ? "outline outline-1 outline-offset-2 outline-accent2/70" : ""}`}>
                  <Icon name={m.icon} size={14} />{m.name}
                </button>
              );
            })}
          </div>
        ) : id === "perms" ? (
          <div>
            <p className="mb-2.5 text-[0.8rem] text-mute">What <span className="text-ink">{sel.name}</span> may use. Pick a module on the glass to change another.</p>
            <div className="grid grid-cols-2 gap-1.5">
              {PERMS.map((p) => {
                const on = perms[p.id];
                return (
                  <button key={p.id} type="button" role="switch" aria-checked={on} onClick={() => setPerm(p.id)}
                    className={`flex items-center justify-between rounded-xl px-3 py-2.5 text-[0.82rem] transition-all duration-300 ${on ? "bg-white/[0.1] text-ink" : "sg-glass text-mute"}`}>
                    <span className="flex items-center gap-2"><Icon name={p.icon} size={14} />{p.label}</span>
                    <span className={`relative block h-5 w-9 flex-none rounded-full transition-colors duration-300 ${on ? "bg-accent" : "bg-white/15"}`}>
                      <span className="toggle-knob absolute left-0.5 top-0.5 block h-4 w-4 rounded-full bg-white shadow-[0_1px_3px_rgba(0,0,0,0.4)]" style={{ transform: on ? "translateX(16px)" : "translateX(0)" }} />
                    </span>
                  </button>
                );
              })}
            </div>
            <p className="mt-2.5 text-[0.78rem] leading-relaxed text-dim">Turn off something a module needs and it says so, rather than finding another way in.</p>
          </div>
        ) : (
          <div>
            <div className="grid grid-cols-3 gap-1.5">
              {MODELS.map((m) => (
                <button key={m.id} type="button" aria-pressed={d.model === m.id} onClick={() => d.set({ model: m.id })}
                  className={`inline-flex h-10 items-center justify-center rounded-xl px-2 text-[0.82rem] transition-all duration-300 ${d.model === m.id ? "bg-white text-night" : "sg-glass text-ink/85 hover:text-ink"}`}>{m.label}</button>
              ))}
            </div>
            <p className="mt-2.5 text-[0.8rem] text-mute">{model.note}</p>
          </div>
        )}
      </Segments>
      <div className="sg-glass-solid overflow-hidden rounded-2xl">
        <div className="flex items-center justify-between border-b border-white/10 px-4 py-2.5">
          <span className="font-mono text-[0.72rem] text-mute">{sel.id}.ts</span>
          <span className="text-[0.7rem] text-dim">Illustrative code</span>
        </div>
        <pre className="overflow-x-auto px-4 py-3 font-mono text-[0.74rem] leading-[1.7]">
          {code(d.selected, perms, d.model).map((line, i) => (
            <div key={i}>{line.length ? line.map(([t, c], j) => <span key={j} className={COL[c]}>{t}</span>) : " "}</div>
          ))}
        </pre>
      </div>
    </div>
  );
}
