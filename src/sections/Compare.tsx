import { motion } from "motion/react";
import { COMPARE } from "../lib/content";
import { Icon } from "../lib/icons";
import { Eyebrow, Reveal, Section } from "../components/ui";

const EDGE = ["Guidance on your own reflection", "In light it controls", "On a mirror others can build on", "Attached to the mirror you own"];

export function Compare() {
  return (
    <Section stream={-1}>
      <div className="wrap">
        <div className="grid gap-10 lg:grid-cols-[0.95fr_1.05fr]">
          <Reveal>
            <Eyebrow>{COMPARE.eyebrow}</Eyebrow>
            <h2 className="h-section mt-5 text-[clamp(2.2rem,4.8vw,4.4rem)]">
              <span className="block">{COMPARE.title[0]}</span>
              <span className="block accent-word">{COMPARE.title[1]}</span>
            </h2>
            <p className="body-lg mt-6 max-w-[32rem]">{COMPARE.body}</p>
          </Reveal>
          <div className="flex flex-col gap-3">
            {COMPARE.rivals.map((r, i) => (
              <Reveal key={r.name} delay={0.06 * i}>
                <div className="group sg-glass flex items-start gap-4 rounded-[1.4rem] p-5 opacity-80 transition-opacity duration-300 hover:opacity-100">
                  <span className="mt-0.5 grid h-9 w-9 flex-none place-items-center rounded-full border border-white/15 font-mono text-[0.7rem] text-mute">{String(i + 1).padStart(2, "0")}</span>
                  <div>
                    <h3 className="h-card text-[1.05rem] text-ink">{r.name}</h3>
                    <p className="mt-1 text-[0.9rem] leading-relaxed text-mute">{r.what}</p>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        </div>

        <Reveal className="mt-10">
          <div className="sg-glass sg-lens relative overflow-hidden rounded-[2rem] p-7 sm:p-10" style={{ boxShadow: "inset 0 0 0 1px rgb(var(--accent2) / .45)" }}>
            <div className="grid gap-8 lg:grid-cols-[1fr_1.1fr] lg:items-center">
              <div>
                <Eyebrow>Selika</Eyebrow>
                <p className="h-section mt-4 text-[clamp(1.6rem,3vw,2.5rem)] leading-[1.08]">The edge is the <span className="accent-word">combination.</span></p>
                <p className="mt-4 text-[0.98rem] leading-relaxed text-mute">{COMPARE.selika}</p>
              </div>
              <ul className="grid gap-2.5 sm:grid-cols-2">
                {EDGE.map((e, i) => (
                  <motion.li key={e} className="sg-glass flex items-center gap-3 rounded-2xl px-4 py-3.5 text-[0.92rem]"
                    initial={{ opacity: 0.3, y: 8 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, amount: 0.8 }} transition={{ delay: 0.15 + i * 0.12, duration: 0.6 }}>
                    <span className="grid h-6 w-6 flex-none place-items-center rounded-full bg-accent text-white transition-colors duration-700"><Icon name="Check" size={13} stroke={2.4} /></span>
                    {e}
                  </motion.li>
                ))}
              </ul>
            </div>
            <div className="mt-8 grid gap-4 border-t border-white/10 pt-6 md:grid-cols-2">
              <p className="text-[0.86rem] leading-relaxed text-ink/80">{COMPARE.note}</p>
              <p className="text-[0.86rem] leading-relaxed text-mute">{COMPARE.moat}</p>
            </div>
          </div>
        </Reveal>
      </div>
    </Section>
  );
}
