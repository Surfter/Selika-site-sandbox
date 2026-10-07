import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { ThinkingOrb } from "thinking-orbs";
import { Icon } from "../../lib/icons";
import { useSite } from "../../lib/store";
import { reducedMotion } from "../../lib/perf";
import { specMove } from "../../components/ui";
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
    d.on.build
      ? { text: "Hide the build module", run: () => { d.set({ on: { ...d.on, build: false } }); d.say("Build status hidden."); } }
      : { text: "Show my build status", run: () => { d.set({ on: { ...d.on, build: true }, selected: "build" }); d.say("Build status on. It only gets network access."); } },
    { text: "Show my home", run: () => { d.set({ on: { ...d.on, home: true }, selected: "home" }); d.say("Home module on. It only gets network access."); } },
    { text: "Use my own model", run: () => { d.set({ model: "endpoint" }); d.say("Switched to your endpoint. Nothing else changes."); } },
  ];
}

/** "Ask Selika": the voice interaction, simulated with prompts you can tap. Selika's answer
    appears inside the same pill, above the prompt, so it never lands on top of the glass. */
export function AskPill() {
  const prompts = usePrompts();
  const product = useSite((s) => s.product);
  const reply = useDemo((s) => s.reply);
  const [i, setI] = useState(0);
  const [state, setState] = useState<"breathing" | "listening" | "working">("breathing");
  const [shown, setShown] = useState<{ text: string; id: number } | null>(null);
  useEffect(() => { setI(0); setShown(null); }, [product]);
  useEffect(() => {
    if (!reply) return;
    setShown(reply);
    const t = setTimeout(() => setShown((r) => (r && r.id === reply.id ? null : r)), 4200);
    return () => clearTimeout(t);
  }, [reply]);
  useEffect(() => {
    if (reducedMotion || state !== "breathing" || shown) return;
    const id = setInterval(() => setI((v) => (v + 1) % prompts.length), 3200);
    return () => clearInterval(id);
  }, [prompts.length, state, shown]);
  const p = prompts[i % prompts.length];
  const go = () => {
    setState("listening");
    setTimeout(() => { setState("working"); setTimeout(() => { p.run(); setState("breathing"); setI((v) => (v + 1) % prompts.length); }, 520); }, 640);
  };
  return (
    <motion.button type="button" onClick={go} aria-label={`Ask Selika: ${p.text}`} layout onPointerMove={specMove}
      whileHover={reducedMotion ? undefined : { scale: 1.02 }} whileTap={reducedMotion ? undefined : { scale: 0.97 }} transition={{ type: "spring", stiffness: 380, damping: 28 }}
      className="no-press lg-glass lg-glass-deep group flex w-full max-w-[22rem] flex-col overflow-hidden rounded-[1.75rem] text-left">
      <span aria-hidden className="lg-spec" />
      <AnimatePresence initial={false}>
        {shown && (
          <motion.span key={shown.id} className="block px-5 pt-3.5" initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}>
            <span className="flex items-start gap-2 text-[0.86rem] leading-snug text-ink" aria-live="polite">
              <Icon name="MessageCircle" size={14} className="mt-0.5 flex-none text-accent2" />
              <span><span className="mr-1 text-accent2">Selika:</span>{shown.text}</span>
            </span>
          </motion.span>
        )}
      </AnimatePresence>
      <span className="flex h-14 items-center gap-3 pl-2 pr-5">
        <span className="grid h-10 w-10 flex-none place-items-center rounded-full bg-white/5">
          <ThinkingOrb state={state} size={32} theme="dark" color={product === "beauty" ? "#c7b6ff" : "#9fd0ff"} />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block font-mono text-[0.58rem] uppercase tracking-[0.16em] text-mute">{state === "listening" ? "Listening" : state === "working" ? "On it" : "Say, or tap"}</span>
          <span className="relative block h-5 overflow-hidden">
            <AnimatePresence mode="wait">
              <motion.span key={p.text} className="absolute inset-0 truncate text-[0.92rem] text-ink" initial={{ y: 14, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: -12, opacity: 0 }} transition={{ duration: 0.3 }}>
                “Selika, {p.text.charAt(0).toLowerCase() + p.text.slice(1)}”
              </motion.span>
            </AnimatePresence>
          </span>
        </span>
      </span>
    </motion.button>
  );
}
