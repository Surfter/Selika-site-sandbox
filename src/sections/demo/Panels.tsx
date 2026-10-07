import { motion } from "motion/react";
import { Icon } from "../../lib/icons";
import { kelvinToRGB, hex } from "../../lib/physics";
import { LIGHTS, LOOKS, MODULES, STEPS, TONES, useDemo, type ModelId, type ModuleId, type Perm } from "./state";
import { FACE_PACKS, facePath } from "./facePacks";

const H = ({ children }: { children: React.ReactNode }) => <p className="eyebrow mb-3">{children}</p>;

/* ---------------- Selika Beauty ---------------- */
export function BeautyPanel() {
  const d = useDemo();
  const L = LIGHTS.find((l) => l.id === d.light)!;
  const next = () => { const n = Math.min(STEPS.length - 1, d.step + 1); d.set({ step: n }); d.say(STEPS[n].voice); if (n === STEPS.length - 1) d.set({ smile: d.smile + 1 }); };
  return (
    <div className="flex flex-col gap-7">
      <div>
        <H>Guided steps</H>
        <div className="flex gap-1.5" role="tablist" aria-label="Steps">
          {STEPS.map((s, i) => (
            <button key={s.id} type="button" role="tab" aria-selected={d.step === i} onClick={() => { d.set({ step: i }); d.say(s.voice); if (i === STEPS.length - 1) d.set({ smile: d.smile + 1 }); }}
              className={`group flex-1 rounded-xl px-1 py-2 text-center transition-all duration-300 ${d.step === i ? "bg-white text-night" : i < d.step ? "sg-glass text-ink" : "sg-glass text-mute hover:text-ink"}`}>
              <span className="block font-mono text-[0.55rem] tracking-[0.14em] opacity-70">{String(i + 1).padStart(2, "0")}</span>
              <span className="block text-[0.74rem] font-medium">{s.name}</span>
            </button>
          ))}
        </div>
        <motion.p key={d.step} initial={{ opacity: 0, y: 6, filter: "blur(4px)" }} animate={{ opacity: 1, y: 0, filter: "blur(0px)" }} className="mt-4 min-h-[3.2rem] text-[0.92rem] leading-relaxed text-ink/85">{STEPS[d.step].line}</motion.p>
        <div className="mt-3 flex items-center gap-2">
          <button type="button" onClick={next} disabled={d.step === STEPS.length - 1} className="btn-accent inline-flex h-10 items-center gap-2 rounded-full px-4 text-[0.86rem] font-medium disabled:opacity-40">
            Next step <Icon name="ArrowRight" size={15} className="icon-nudge" />
          </button>
          <button type="button" onClick={() => d.set({ step: 0 })} className="sg-glass inline-flex h-10 items-center gap-2 rounded-full px-4 text-[0.86rem] text-ink/85 hover:text-ink"><Icon name="RotateCcw" size={14} className="icon-spin" />Start again</button>
        </div>
      </div>

      <div>
        <H>Light it in</H>
        <div className="grid grid-cols-5 gap-1.5">
          {LIGHTS.map((l) => {
            const c = hex(kelvinToRGB(l.k)); const on = d.light === l.id;
            return (
              <button key={l.id} type="button" aria-pressed={on} onClick={() => d.set({ light: l.id })}
                className={`group/l rounded-xl px-1 py-2.5 text-center transition-all duration-300 ${on ? "bg-white/[0.12] ring-1 ring-white/40" : "sg-glass hover:bg-white/10"}`}>
                <span className="mx-auto block h-3 w-3 rounded-full transition-transform duration-300 ease-out-expo group-hover/l:scale-125" style={{ background: c, boxShadow: `0 0 ${on ? 14 : 6}px ${c}` }} />
                <span className="mt-1.5 block text-[0.7rem] font-medium text-ink">{l.name}</span>
                <span className="block font-mono text-[0.55rem] text-dim">{l.k}K</span>
              </button>
            );
          })}
        </div>
        <p className="mt-3 text-[0.82rem] leading-relaxed text-mute"><span className="text-ink/85">{L.k}K · CRI {L.cri}.</span> {L.note}</p>
      </div>

      <div className="grid gap-6 sm:grid-cols-[1fr_auto]">
        <div>
          <H>Try on a look</H>
          <div className="flex flex-wrap gap-1.5">
            {LOOKS.map((l) => (
              <button key={l.id} type="button" aria-pressed={d.look === l.id} onClick={() => { d.set({ look: l.id, step: Math.max(d.step, 4) }); d.say(`${l.name} look.`); }}
                className={`inline-flex h-9 items-center gap-2 rounded-full px-3 text-[0.8rem] transition-all duration-300 ${d.look === l.id ? "bg-white text-night" : "sg-glass text-ink/85 hover:text-ink"}`}>
                <span className="h-3 w-3 rounded-full ring-1 ring-black/20" style={{ background: l.lip }} />{l.name}
              </button>
            ))}
          </div>
        </div>
        {FACE_PACKS.length > 0 ? (
          <div>
            <H>Face</H>
            <div className="flex gap-1.5">
              {FACE_PACKS.map((f, i) => (
                <button key={f.id} type="button" aria-label={`Face ${i + 1}: ${f.label}`} aria-pressed={d.face === i} onClick={() => d.set({ face: i })}
                  className={`h-9 w-9 overflow-hidden rounded-full transition-transform duration-300 ease-out-expo hover:scale-110 ${d.face === i ? "ring-2 ring-white ring-offset-2 ring-offset-night" : "ring-1 ring-white/20"}`}>
                  <img src={facePath(f.id, "-thumb.jpg")} alt="" width={36} height={36} loading="lazy" decoding="async" className="h-full w-full object-cover" />
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div>
            <H>Skin tone</H>
            <div className="flex gap-1.5">
              {TONES.map((t, i) => (
                <button key={t} type="button" aria-label={`Skin tone ${i + 1}`} aria-pressed={d.tone === i} onClick={() => d.set({ tone: i })}
                  className={`h-9 w-9 rounded-full transition-transform duration-300 hover:scale-110 ${d.tone === i ? "ring-2 ring-white ring-offset-2 ring-offset-night" : "ring-1 ring-white/20"}`} style={{ background: t }} />
              ))}
            </div>
          </div>
        )}
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

export function DevPanel() {
  const d = useDemo();
  const sel = MODULES.find((m) => m.id === d.selected)!;
  const perms = d.perms[d.selected];
  const setPerm = (p: Perm) => d.set({ perms: { ...d.perms, [d.selected]: { ...perms, [p]: !perms[p] } } });
  return (
    <div className="flex flex-col gap-6">
      <div>
        <H>Modules on the glass</H>
        <div className="grid grid-cols-3 gap-1.5">
          {MODULES.map((m) => {
            const on = d.on[m.id];
            return (
              <button key={m.id} type="button" aria-pressed={on} onClick={() => d.set({ on: { ...d.on, [m.id]: !on }, selected: m.id })}
                className={`flex items-center gap-2 rounded-xl px-2.5 py-2 text-left text-[0.76rem] transition-all duration-300 ${on ? "bg-white/[0.12] text-ink ring-1 ring-white/30" : "sg-glass text-mute hover:text-ink"} ${d.selected === m.id ? "outline outline-1 outline-offset-2 outline-accent2/70" : ""}`}>
                <Icon name={m.icon} size={14} />{m.name}
              </button>
            );
          })}
        </div>
      </div>
      <div>
        <H>{sel.name}: permissions</H>
        <div className="grid grid-cols-2 gap-1.5">
          {PERMS.map((p) => {
            const on = perms[p.id];
            return (
              <button key={p.id} type="button" role="switch" aria-checked={on} onClick={() => setPerm(p.id)}
                className={`flex items-center justify-between rounded-xl px-3 py-2.5 text-[0.8rem] transition-all duration-300 ${on ? "bg-white/[0.1] text-ink" : "sg-glass text-mute"}`}>
                <span className="flex items-center gap-2"><Icon name={p.icon} size={14} />{p.label}</span>
                <span className={`relative block h-5 w-9 flex-none rounded-full transition-colors duration-300 ${on ? "bg-accent" : "bg-white/15"}`}>
                  <span className="toggle-knob absolute left-0.5 top-0.5 block h-4 w-4 rounded-full bg-white shadow-[0_1px_3px_rgba(0,0,0,0.4)]" style={{ transform: on ? "translateX(16px)" : "translateX(0)" }} />
                </span>
              </button>
            );
          })}
        </div>
        <p className="mt-2.5 text-[0.78rem] leading-relaxed text-dim">Each module sees only what you allow. Turn off something it needs and it says so, rather than finding another way in.</p>
      </div>
      <div>
        <H>Model</H>
        <div className="flex flex-wrap gap-1.5">
          {MODELS.map((m) => (
            <button key={m.id} type="button" aria-pressed={d.model === m.id} onClick={() => d.set({ model: m.id })}
              className={`inline-flex h-9 items-center rounded-full px-3.5 text-[0.8rem] transition-all duration-300 ${d.model === m.id ? "bg-white text-night" : "sg-glass text-ink/85 hover:text-ink"}`}>{m.label}</button>
          ))}
        </div>
        <p className="mt-2.5 text-[0.8rem] text-mute">{MODELS.find((m) => m.id === d.model)!.note}</p>
      </div>
      <div className="sg-glass-solid overflow-hidden rounded-2xl">
        <div className="flex items-center justify-between border-b border-white/10 px-4 py-2.5">
          <span className="font-mono text-[0.62rem] uppercase tracking-[0.14em] text-mute">{sel.id}.ts</span>
          <span className="font-mono text-[0.58rem] uppercase tracking-[0.14em] text-dim">illustrative</span>
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
