import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { flushSync } from "react-dom";
import { AnimatePresence, motion, useMotionValue } from "motion/react";
import { ThinkingOrb } from "thinking-orbs";
import { Icon } from "../../lib/icons";
import { MODULES, useDemo, type ModuleId, type Perm } from "./state";

function useClock() {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => { const id = setInterval(() => setNow(new Date()), 15000); return () => clearInterval(id); }, []);
  return now;
}

function Body({ id }: { id: ModuleId }) {
  const now = useClock();
  switch (id) {
    case "clock":
      return (<div><div className="font-display text-[clamp(1.8rem,4.6vw,2.6rem)] font-light leading-none tracking-[-0.04em] tabular">{now.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })}</div><div className="mt-1.5 font-display text-[0.62rem] font-medium uppercase tracking-[0.1em] text-mute">{now.toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long" })}</div></div>);
    case "weather":
      return (<div className="flex items-end gap-2"><span className="font-display text-[1.9rem] leading-none">12°</span><span className="pb-0.5 text-[0.7rem] leading-tight text-mute">Light rain<br />London</span></div>);
    case "calendar":
      return (<ul className="flex flex-col gap-1">{[["09:00", "Stand-up"], ["13:30", "Design review"], ["18:00", "Gym"]].map(([t, s], i) => (<li key={t} className={`flex gap-2 text-[0.72rem] ${i === 0 ? "text-ink" : "text-mute"}`}><span className="w-9 font-display font-medium tabular">{t}</span>{s}</li>))}</ul>);
    case "build":
      return (<div><div className="flex items-center gap-2 text-[0.95rem]"><span className="dot-accent h-2 w-2 rounded-full" />Passing</div><div className="mt-2 flex h-5 items-end gap-[3px]">{[8, 14, 10, 18, 12, 16, 9, 20, 13, 17].map((h, i) => <span key={i} className={`w-1.5 rounded-sm ${i === 9 ? "bg-accent2" : "bg-white/25"}`} style={{ height: h }} />)}</div></div>);
    case "agent":
      return (<div className="flex items-center gap-2.5"><ThinkingOrb state="working" size={32} theme="dark" color="#9fd0ff" /><div><div className="text-[0.86rem] leading-tight">Brief ready</div><div className="text-[0.66rem] text-mute">3 items · “read it”</div></div></div>);
    case "home":
      return (<div className="flex flex-col gap-1 text-[0.72rem]"><span className="flex justify-between gap-3"><span className="text-mute">Lights</span>40%</span><span className="flex justify-between gap-3"><span className="text-mute">Heating</span>19°</span></div>);
  }
}

function Widget({ id, frame, register, glide }: { id: ModuleId; frame: React.RefObject<HTMLDivElement | null>; register: (id: ModuleId, el: HTMLDivElement | null) => void; glide: boolean }) {
  const d = useDemo();
  const m = MODULES.find((x) => x.id === id)!;
  const perms = d.perms[id];
  const missing = m.needs.filter((p: Perm) => !perms[p]);
  const pos = d.pos[id];
  const el = useRef<HTMLDivElement | null>(null);
  const x = useMotionValue(0), y = useMotionValue(0);
  // on release, fold the drag offset into the module's place on the glass
  const settle = () => {
    const f = frame.current, e = el.current; if (!f || !e) return;
    const fw = f.clientWidth, fh = f.clientHeight;
    const nx = Math.min(1 - e.offsetWidth / fw - 0.02, Math.max(0.02, (e.offsetLeft + x.get()) / fw));
    const ny = Math.min(1 - e.offsetHeight / fh - 0.12, Math.max(0.04, (e.offsetTop + y.get()) / fh));
    flushSync(() => useDemo.getState().set({ pos: { ...useDemo.getState().pos, [id]: { x: nx, y: ny } }, moved: true }));
    x.set(0); y.set(0);
  };
  return (
    <motion.div ref={(e: HTMLDivElement | null) => { el.current = e; register(id, e); }} drag dragConstraints={frame} dragElastic={0.05} dragMomentum={false}
      onDragStart={() => d.set({ selected: id })} onDragEnd={settle} onPointerDown={() => d.set({ selected: id })}
      whileDrag={{ scale: 1.04, boxShadow: "0 24px 60px -20px rgba(0,0,0,0.8)", zIndex: 40 }}
      className={`sg-glass absolute flex w-[44%] cursor-grab touch-none select-none flex-col rounded-2xl p-3 active:cursor-grabbing ${glide ? "transition-[left,top] duration-500 ease-out-expo" : ""} ${d.selected === id ? "ring-1 ring-accent2/70" : ""} ${id === "clock" && !d.moved ? "drag-me" : ""}`}
      style={{ left: `${pos.x * 100}%`, top: `${pos.y * 100}%`, x, y }}
      initial={{ opacity: 0, scale: 0.92 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.94 }} transition={{ type: "spring", stiffness: 300, damping: 26 }}
      role="group" aria-label={`${m.name} module`}>
      <div className="mb-2 flex items-center justify-between font-display text-[0.6rem] font-medium uppercase tracking-[0.12em] text-mute">
        <span className="flex items-center gap-1.5"><Icon name={m.icon} size={11} />{m.name}</span>
        {missing.length > 0 ? <Icon name="Lock" size={11} className="text-white/70" /> : <Icon name="Move" size={11} className="text-white/40" />}
      </div>
      <div className={missing.length ? "pointer-events-none opacity-25 blur-[2px]" : ""}><Body id={id} /></div>
      <AnimatePresence>
        {id === "clock" && !d.moved && (
          <motion.span key="hint" className="pointer-events-none absolute -top-3 right-2 z-10 flex items-center gap-1.5 rounded-full bg-accent px-2.5 py-1 text-[0.68rem] font-medium text-white shadow-[0_8px_20px_-6px_rgb(var(--accent))]"
            initial={{ opacity: 0, y: 4, scale: 0.9 }} animate={{ opacity: 1, y: 0, scale: 1, transition: { delay: 0.9, duration: 0.4 } }} exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.2 } }}>
            <span className="drag-hint-arrows flex items-center"><Icon name="ArrowLeft" size={11} /><Icon name="Hand" size={13} /><Icon name="ArrowRight" size={11} /></span>
            Drag to move
          </motion.span>
        )}
      </AnimatePresence>
      {missing.length > 0 && <div className="mt-1.5 text-[0.62rem] leading-tight text-ink/90">Needs {missing.join(" and ")} access</div>}
    </motion.div>
  );
}

/** Modules on the glass, with a camera indicator that only lights when a module has the camera. */
export function DevLayer() {
  const frame = useRef<HTMLDivElement>(null);
  const on = useDemo((s) => s.on), perms = useDemo((s) => s.perms), moved = useDemo((s) => s.moved);
  const camUsers = MODULES.filter((m) => on[m.id] && perms[m.id].camera).map((m) => m.name);
  const els = useRef<Partial<Record<ModuleId, HTMLDivElement | null>>>({});
  const register = useCallback((id: ModuleId, el: HTMLDivElement | null) => { els.current[id] = el; }, []);
  const [glide, setGlide] = useState(false);
  // Until a module is dragged, the modules sit in two columns from the top of the glass, each as tall as
  // its content, with the same gap everywhere; a module that is switched on goes to the shorter column.
  useLayoutEffect(() => {
    if (moved) return;
    const f = frame.current; if (!f) return;
    const layout = () => {
      const fw = f.clientWidth, fh = f.clientHeight; if (!fw || !fh) return;
      const gap = Math.round(Math.max(8, fw * 0.022)), top = Math.round(Math.max(fh * 0.07, 46)); // clear of the camera pill
      const cols = [top, top], xs = [0.05, 0.51];
      const st = useDemo.getState(), pos = { ...st.pos }; let changed = false;
      for (const m of MODULES) {
        const e = els.current[m.id]; if (!st.on[m.id] || !e) continue;
        const c = cols[0] <= cols[1] ? 0 : 1, p = { x: xs[c], y: cols[c] / fh };
        if (Math.abs(pos[m.id].x - p.x) > 1e-4 || Math.abs(pos[m.id].y - p.y) > 1e-4) { pos[m.id] = p; changed = true; }
        cols[c] += e.offsetHeight + gap;
      }
      if (changed) st.set({ pos });
    };
    layout();
    const ro = new ResizeObserver(layout); ro.observe(f);
    Object.values(els.current).forEach((e) => { if (e) ro.observe(e); });
    const id = requestAnimationFrame(() => setGlide(true));
    return () => { ro.disconnect(); cancelAnimationFrame(id); };
  }, [on, perms, moved]);
  return (
    <div ref={frame} className="absolute inset-0 z-10">
      <AnimatePresence>
        {MODULES.filter((m) => on[m.id]).map((m) => <Widget key={m.id} id={m.id} frame={frame} register={register} glide={glide && !moved} />)}
      </AnimatePresence>
      <div className="pointer-events-none absolute left-1/2 top-3 z-20 flex -translate-x-1/2 items-center gap-1.5 whitespace-nowrap rounded-full bg-black/50 px-2.5 py-1 font-display text-[0.6rem] font-medium uppercase tracking-[0.1em] text-ink/80 backdrop-blur">
        <span className={`h-1.5 w-1.5 rounded-full ${camUsers.length ? "bg-accent2 shadow-[0_0_8px_rgb(var(--accent2))]" : "bg-white/30"}`} />
        {camUsers.length ? `Camera · ${camUsers.join(", ")}` : "Shutter closed"}
      </div>
    </div>
  );
}
