import { motion } from "motion/react";
import { ABOUT, FOOTER, NAV, ROADMAP } from "../lib/content";
import { Icon } from "../lib/icons";
import { useLenis } from "../lib/motion";
import { Button, Headline, Logo, Reactive, Reveal, Section } from "../components/ui";

export function Roadmap() {
  return (
    <Section id="roadmap" stream={1}>
      <div className="wrap">
        <Reveal>
          <Headline lead={ROADMAP.title[0]} accent={ROADMAP.title[1]} className="h-section text-[clamp(1.9rem,4.2vw,4rem)]" />
        </Reveal>
        <div className="relative mt-14 grid gap-4 lg:grid-cols-3">
          {/* the line the stages sit on */}
          <motion.div aria-hidden className="absolute left-6 right-6 top-[1.6rem] hidden h-px origin-left bg-white/20 lg:block" initial={{ scaleX: 0 }} whileInView={{ scaleX: 1 }} viewport={{ once: true, amount: 0.6 }} transition={{ duration: 1.6, ease: [0.16, 1, 0.3, 1] }} />
          {ROADMAP.stages.map((s, i) => (
            <Reveal key={s.k} delay={0.12 * i}>
              <div className="relative">
                <div className="relative z-[1] mb-5 flex items-center gap-3">
                  <span className={`grid h-[3.2rem] w-[3.2rem] place-items-center rounded-full border font-display text-[1.15rem] font-medium tracking-[-0.03em] ${i === 0 ? "btn-accent border-transparent" : "sg-glass sg-glass-strong border-white/15 text-ink/85"}`}>{i + 1}</span>
                </div>
                <Reactive className="sg-glass group h-full rounded-[1.6rem] p-6" style={i === 0 ? { boxShadow: "inset 0 0 0 1px rgb(var(--accent2) / .45)" } : undefined}>
                  <h3 className="h-card text-[1.45rem] transition-colors duration-300 group-hover:text-white">{s.name}</h3>
                  <p className="mt-3 text-[0.92rem] leading-relaxed text-mute">{s.body}</p>
                </Reactive>
              </div>
            </Reveal>
          ))}
        </div>
        <Reveal className="mt-10">
          <div className="flex flex-wrap items-center gap-2">
            {ROADMAP.next.map((n, i) => (
              <span key={n} className="flex items-center gap-2">
                <motion.span whileHover={{ y: -3 }} transition={{ type: "spring", stiffness: 400, damping: 22 }} className="sg-glass inline-flex h-10 cursor-default items-center rounded-full px-4 text-[0.86rem] text-ink/90 transition-colors duration-300 hover:border-accent2/50 hover:bg-white/10">{n}</motion.span>
                {i < ROADMAP.next.length - 1 && <Icon name="ArrowRight" size={14} className="text-dim" />}
              </span>
            ))}
          </div>
        </Reveal>
      </div>
    </Section>
  );
}

export function About() {
  const lenis = useLenis();
  return (
    <Section id="about" stream={-1}>
      <div className="wrap">
        <Reveal>
          <Headline lead={ABOUT.title[0]} accent={ABOUT.title[1]} className="h-section text-[clamp(1.9rem,4.2vw,4rem)]" />
        </Reveal>
        <div className="mt-12 grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
          <Reveal className="h-full">
            <Reactive className="sg-glass flex h-full flex-col rounded-[2rem] p-7 sm:p-9" max={2.5} lift={3}>
              <div className="grid grid-cols-3 gap-3 border-b border-white/10 pb-6">
                {ABOUT.status.map((s) => (
                  <div key={s.k}><div className="mb-1 text-[0.78rem] text-mute">{s.k}</div><div className="h-card text-[1rem] leading-snug">{s.v}</div></div>
                ))}
              </div>
              <div className="pt-6">
                {ABOUT.origin.map((t, i) => <p key={i} className={`text-[1rem] leading-relaxed ${i === 0 ? "text-ink/90" : "mt-4 text-mute"}`}>{t}</p>)}
              </div>
              <div className="mt-auto flex flex-wrap gap-3 pt-8">
                <Button variant="accent" icon="ArrowRight" onClick={() => lenis?.scrollTo("#demo", { duration: 1.6 })}>Explore the demo</Button>
                <Button variant="glass" onClick={() => lenis?.scrollTo(0, { duration: 2 })}>Back to top</Button>
              </div>
            </Reactive>
          </Reveal>
          <div className="flex flex-col gap-4">
            {ABOUT.cards.map((c, i) => (
              <Reveal key={c.t} delay={0.08 * i}>
                <Reactive className="sg-glass group rounded-[1.6rem] p-6 sm:p-7" max={4}>
                  <h3 className="h-card text-[1.2rem] transition-colors duration-300 group-hover:text-white">{c.t}</h3>
                  <p className="mt-2.5 text-[0.9rem] leading-relaxed text-mute">{c.a}</p>
                  <p className="mt-2.5 text-[0.9rem] leading-relaxed text-mute">{c.b}</p>
                </Reactive>
              </Reveal>
            ))}
          </div>
        </div>
      </div>
    </Section>
  );
}

export function Footer() {
  const lenis = useLenis();
  return (
    <footer data-stream="0" className="relative pb-10 pt-16">
      <div className="wrap">
        <Reveal>
          <div className="sg-glass rounded-[2rem] p-7 sm:p-10">
            <div className="flex flex-col justify-between gap-8 md:flex-row md:items-end">
              <div>
                <Logo size="lg" />
                <p className="mt-4 text-[0.95rem] leading-relaxed text-mute md:whitespace-nowrap">{FOOTER.line}</p>
              </div>
              <nav aria-label="Footer" className="flex flex-wrap gap-x-6 gap-y-2">
                {NAV.map((n) => <a key={n.href} href={n.href} onClick={(e) => { e.preventDefault(); lenis?.scrollTo(n.href, { duration: 1.6 }); }} className="text-[0.9rem] text-ink/80 hover:text-ink">{n.label}</a>)}
              </nav>
            </div>
            <div className="mt-10 flex flex-col gap-2 border-t border-white/10 pt-6 text-[0.76rem] leading-relaxed text-dim md:flex-row md:justify-between">
              <span>© 2026 Selika · {FOOTER.note}</span>
              <span>{FOOTER.credits}</span>
            </div>
          </div>
        </Reveal>
      </div>
    </footer>
  );
}
