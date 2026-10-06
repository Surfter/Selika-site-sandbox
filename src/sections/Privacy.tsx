import { useState } from "react";
import { motion } from "motion/react";
import { PRIVACY } from "../lib/content";
import { Icon } from "../lib/icons";
import { Eyebrow, Reveal, Section } from "../components/ui";

/* A physical shutter, drawn as six blades that close over the lens. */
function Shutter({ closed }: { closed: boolean }) {
  const blades = Array.from({ length: 6 });
  return (
    <svg viewBox="-100 -100 200 200" className="h-full w-full" aria-hidden>
      <circle r="92" fill="#07080d" stroke="rgba(255,255,255,.16)" strokeWidth="2" />
      <circle r="78" fill="none" stroke="rgba(255,255,255,.08)" strokeWidth="10" />
      <circle r="44" fill="#0b1020" />
      <motion.circle r="20" fill="rgb(var(--accent))" animate={{ opacity: closed ? 0 : 0.9 }} transition={{ duration: 0.4 }} />
      <circle r="9" cx="-12" cy="-12" fill="rgba(255,255,255,.55)" />
      <clipPath id="lens"><circle r="70" /></clipPath>
      <g clipPath="url(#lens)">
        {blades.map((_, i) => (
          <motion.g key={i} style={{ rotate: i * 60 }}>
            <motion.path d="M0 0 L120 -12 L120 70 Z" fill="#1a1d2a" stroke="rgba(255,255,255,.22)" strokeWidth="1.2"
              animate={{ rotate: closed ? 0 : -58, x: closed ? -6 : 48 }} transition={{ type: "spring", stiffness: 140, damping: 18, delay: i * 0.025 }} style={{ originX: "0px", originY: "0px" }} />
          </motion.g>
        ))}
      </g>
      <circle r="70" fill="none" stroke="rgba(255,255,255,.25)" strokeWidth="1.5" />
    </svg>
  );
}

export function Privacy() {
  const [closed, setClosed] = useState(false);
  return (
    <Section id="privacy" stream={-1}>
      <div className="wrap grid gap-12 lg:grid-cols-[0.95fr_1.05fr] lg:items-center">
        <Reveal>
          <Eyebrow>{PRIVACY.eyebrow}</Eyebrow>
          <h2 className="h-section mt-5 text-[clamp(2.3rem,5vw,4.6rem)]"><span className="block">{PRIVACY.title[0]}</span><span className="block accent-word">{PRIVACY.title[1]}</span></h2>
          <p className="body-lg mt-6 max-w-[32rem]">{PRIVACY.body}</p>
          <div className="mt-10 flex flex-col items-start gap-6 sm:flex-row sm:items-center">
            <button type="button" onClick={() => setClosed((c) => !c)} aria-pressed={closed} aria-label={closed ? "Open the camera shutter" : "Close the camera shutter"}
              className="sg-glass relative h-48 w-48 flex-none rounded-full p-3 transition-transform duration-300 hover:scale-[1.02] active:scale-[0.98]">
              <Shutter closed={closed} />
            </button>
            <div>
              <div className="flex items-center gap-2.5">
                <span className="relative grid h-3 w-3 place-items-center">
                  {!closed && <span className="absolute h-3 w-3 rounded-full bg-accent2 [animation:pulse-ring_1.6s_ease-out_infinite]" />}
                  <span className={`h-2 w-2 rounded-full ${closed ? "bg-white/30" : "bg-accent2"}`} />
                </span>
                <span className="font-mono text-[0.7rem] uppercase tracking-[0.16em] text-ink/85">{closed ? "Camera covered" : "Capture light on"}</span>
              </div>
              <p className="mt-3 max-w-[16rem] text-[0.86rem] leading-relaxed text-mute">{closed ? "The shutter physically blocks the lens. No software can see past it." : "When the camera is in use, a visible light says so."}</p>
              <button type="button" onClick={() => setClosed((c) => !c)} className="mt-4 inline-flex h-10 items-center gap-2 rounded-full bg-white px-4 text-[0.86rem] font-medium text-night">
                <Icon name={closed ? "Unlock" : "Lock"} size={15} />{closed ? "Open the shutter" : "Close the shutter"}
              </button>
            </div>
          </div>
        </Reveal>
        <div className="grid gap-3 sm:grid-cols-2">
          {PRIVACY.points.map((pt, i) => (
            <Reveal key={pt.t} delay={0.05 * i}>
              <div className="sg-glass h-full rounded-[1.4rem] p-5 transition-colors duration-300 hover:bg-white/[0.08]">
                <span className="grid h-10 w-10 place-items-center rounded-xl bg-accent/15 text-accent2"><Icon name={pt.icon} size={18} /></span>
                <h3 className="h-card mt-4 text-[1.08rem]">{pt.t}</h3>
                <p className="mt-1.5 text-[0.88rem] leading-relaxed text-mute">{pt.d}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </Section>
  );
}
