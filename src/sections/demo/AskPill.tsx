import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { ThinkingOrb } from "thinking-orbs";
import { useSite } from "../../lib/store";
import { reducedMotion } from "../../lib/perf";
import { LOOKS, STEPS, useDemo, type LightId, type LookId } from "./state";

type Prompt = { text: string; run: () => void };

function usePrompts(): Prompt[] {
  const product = useSite((s) => s.product);
  const d = useDemo();
  if (product === "beauty") return [
    { text: "Next step", run: () => { const n = Math.min(STEPS.length - 1, d.step + 1); d.set({ step: n }); d.say(STEPS[n].voice); if (n === STEPS.length - 1) d.set({ smile: d.smile + 1 }); } },
    { text: "Show me the evening look", run: () => { d.set({ look: "evening" as LookId, step: Math.max(d.step, 4) }); d.say("Evening look. Darker lip, winged liner."); } },
    { text: "Warmer light", run: () => { d.set({ light: "restaurant" as LightId }); d.say("Restaurant light, 3000K. Reds deepen here."); } },
    { text: "Try it in office light", run: () => { d.set({ light: "office" as LightId }); d.say("Office light, 4000K. Flat and overhead."); } },
    { text: "Repeat that", run: () => d.say(STEPS[d.step].voice) },
    { text: "Something bolder", run: () => { d.set({ look: "bold" as LookId, step: Math.max(d.step, 4) }); d.say(`${LOOKS[3].name} look. Graphic liner, bright lip.`); } },
  ];
  return [
    { text: "Read my brief", run: () => { d.set({ selected: "agent" }); d.say("Three items: stand-up at nine, a design review, and the gym at six."); } },
    { text: "Hide the build module", run: () => { d.set({ on: { ...d.on, build: false } }); d.say("Build status hidden."); } },
    { text: "Show my home", run: () => { d.set({ on: { ...d.on, home: true }, selected: "home" }); d.say("Home module on. It only gets network access."); } },
    { text: "Use my own model", run: () => { d.set({ model: "endpoint" }); d.say("Switched to your endpoint. Nothing else changes."); } },
  ];
}

/** "Ask Selika": the voice interaction, simulated with prompts you can tap. */
export function AskPill() {
  const prompts = usePrompts();
  const product = useSite((s) => s.product);
  const [i, setI] = useState(0);
  const [state, setState] = useState<"breathing" | "listening" | "working">("breathing");
  useEffect(() => { setI(0); }, [product]);
  useEffect(() => {
    if (reducedMotion || state !== "breathing") return;
    const id = setInterval(() => setI((v) => (v + 1) % prompts.length), 3200);
    return () => clearInterval(id);
  }, [prompts.length, state]);
  const p = prompts[i % prompts.length];
  const go = () => {
    setState("listening");
    setTimeout(() => { setState("working"); setTimeout(() => { p.run(); setState("breathing"); setI((v) => (v + 1) % prompts.length); }, 520); }, 640);
  };
  return (
    <button type="button" onClick={go} aria-label={`Ask Selika: ${p.text}`}
      className="sg-glass sg-glass-strong group flex h-14 w-full max-w-[22rem] items-center gap-3 rounded-full pl-2 pr-5 text-left transition-transform duration-300 hover:scale-[1.02] active:scale-[0.98]">
      <span className="grid h-10 w-10 flex-none place-items-center rounded-full bg-white/5">
        <ThinkingOrb state={state} size={32} theme="dark" color={product === "beauty" ? "#c7b6ff" : "#9fd0ff"} />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block font-mono text-[0.58rem] uppercase tracking-[0.16em] text-mute">{state === "listening" ? "Listening" : state === "working" ? "On it" : "Say, or tap"}</span>
        <span className="relative block h-5 overflow-hidden">
          <AnimatePresence mode="wait">
            <motion.span key={p.text} className="absolute inset-0 truncate text-[0.92rem] text-ink" initial={{ y: 14, opacity: 0, filter: "blur(4px)" }} animate={{ y: 0, opacity: 1, filter: "blur(0px)" }} exit={{ y: -12, opacity: 0, filter: "blur(4px)" }} transition={{ duration: 0.35 }}>
              “Selika, {p.text.charAt(0).toLowerCase() + p.text.slice(1)}”
            </motion.span>
          </AnimatePresence>
        </span>
      </span>
    </button>
  );
}

/** Selika's spoken reply, shown on the glass. */
export function Reply() {
  const reply = useDemo((s) => s.reply);
  const [show, setShow] = useState(false);
  useEffect(() => { if (!reply) return; setShow(true); const t = setTimeout(() => setShow(false), 3200); return () => clearTimeout(t); }, [reply]);
  return (
    <AnimatePresence>
      {show && reply && (
        <motion.div key={reply.id} className="sg-glass sg-glass-strong pointer-events-none absolute left-1/2 top-16 z-20 max-w-[85%] -translate-x-1/2 rounded-2xl px-4 py-2.5 text-center text-[0.86rem] text-ink"
          initial={{ opacity: 0, y: -8, filter: "blur(6px)" }} animate={{ opacity: 1, y: 0, filter: "blur(0px)" }} exit={{ opacity: 0, y: -6, filter: "blur(4px)" }} transition={{ duration: 0.35 }}>
          {reply.text}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
