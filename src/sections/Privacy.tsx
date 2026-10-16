import { useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { PRIVACY } from "../lib/content";
import { Icon } from "../lib/icons";
import { Headline, Reactive, Reveal, Section } from "../components/ui";

/* The camera module: a slim housing with the lens, a capture light beside it, and a real
   sliding shutter that parks to the side and slides across to cover the lens. */
function CameraModule({ closed }: { closed: boolean }) {
  return (
    <svg viewBox="0 0 360 140" className="h-auto w-full" aria-hidden>
      <defs>
        <filter id="cam-soft" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="3" /></filter>
        <clipPath id="cam-slot"><rect x="26" y="30" width="186" height="80" rx="40" /></clipPath>
      </defs>
      {/* housing */}
      <rect x="10" y="18" width="340" height="104" rx="52" fill="#0b0d15" stroke="rgba(255,255,255,.14)" strokeWidth="1.2" />
      <rect x="16" y="23" width="328" height="94" rx="47" fill="none" stroke="rgba(255,255,255,.05)" strokeWidth="1" />
      <path d="M58 21 H302" stroke="rgba(255,255,255,.22)" strokeWidth="1" strokeLinecap="round" />
      {/* the shutter's slot */}
      <rect x="26" y="30" width="186" height="80" rx="40" fill="rgba(255,255,255,.025)" stroke="rgba(255,255,255,.06)" />
      {/* lens */}
      <g transform="translate(166 70)">
        <circle r="35" fill="#05060a" stroke="rgba(255,255,255,.2)" strokeWidth="1.4" />
        <circle r="27" fill="#090d1c" stroke="rgba(255,255,255,.07)" strokeWidth="3" />
        <circle r="19" fill="#0f1733" />
        <motion.circle r="9" fill="rgb(var(--accent))" animate={{ opacity: closed ? 0.25 : 0.9 }} transition={{ duration: 0.5 }} />
        <circle r="9" fill="rgb(var(--accent2))" opacity=".55" filter="url(#cam-soft)" />
        <ellipse cx="-8" cy="-9" rx="5" ry="3.4" fill="rgba(255,255,255,.6)" transform="rotate(-30 -8 -9)" />
        <path d="M-22 6 A23 23 0 0 0 4 22" fill="none" stroke="rgba(255,255,255,.18)" strokeWidth="2" strokeLinecap="round" />
      </g>
      {/* the shutter: slides from its parking spot across the lens */}
      <g clipPath="url(#cam-slot)">
        <motion.g initial={false} animate={{ x: closed ? 0 : -96 }} transition={{ type: "spring", stiffness: 230, damping: 24 }}>
          <rect x="120" y="32" width="92" height="76" rx="38" fill="#1b1f2e" stroke="rgba(255,255,255,.26)" strokeWidth="1.2" />
          <rect x="124" y="36" width="84" height="68" rx="34" fill="none" stroke="rgba(255,255,255,.06)" />
          <path d="M140 36 H192" stroke="rgba(255,255,255,.3)" strokeWidth="1" strokeLinecap="round" />
          {[0, 1, 2].map((i) => <path key={i} d={`M${196 - i * 6} 58 V82`} stroke="rgba(255,255,255,.22)" strokeWidth="1.6" strokeLinecap="round" />)}
        </motion.g>
      </g>
      {/* capture light: steady while the camera can see, off when covered */}
      <g transform="translate(244 70)">
        <motion.circle r="10" fill="rgb(var(--accent2))" filter="url(#cam-soft)" animate={{ opacity: closed ? 0 : 0.7 }} transition={{ duration: 0.4 }} />
        <circle r="4.5" fill="#1a1d28" stroke="rgba(255,255,255,.2)" />
        <motion.circle r="3.2" fill="rgb(var(--accent2))" animate={{ opacity: closed ? 0 : 1 }} transition={{ duration: 0.4 }} />
      </g>
      {/* microphone and sensor */}
      {[282, 296, 310].map((x) => <circle key={x} cx={x} cy="70" r="2" fill="rgba(255,255,255,.18)" />)}
    </svg>
  );
}

export function Privacy() {
  const [closed, setClosed] = useState(false);
  return (
    <Section id="privacy" stream={-1}>
      <div className="wrap grid gap-12 lg:grid-cols-[0.95fr_1.05fr] lg:items-center">
        <Reveal>
          <Headline lead={PRIVACY.title[0]} accent={PRIVACY.title[1]} className="h-section text-[clamp(1.9rem,4.2vw,4rem)]" />
          <p className="body-lg mt-6 max-w-[32rem]">{PRIVACY.body}</p>
          <Reactive className="sg-glass mt-9 max-w-[30rem] rounded-[1.8rem] p-5 sm:p-6" max={4}>
            <button type="button" onClick={() => setClosed((c) => !c)} aria-pressed={closed} aria-label={closed ? "Open the camera shutter" : "Close the camera shutter"} className="no-press block w-full transition-transform duration-300 active:scale-[0.98]">
              <CameraModule closed={closed} />
            </button>
            <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <span className="inline-flex items-center gap-2 rounded-full bg-white/[0.05] px-3 py-1.5 text-[0.84rem] font-medium text-ink/90 ring-1 ring-white/10">
                  <span className={`h-2 w-2 rounded-full transition-all duration-500 ${closed ? "bg-white/25" : "bg-accent2 shadow-[0_0_10px_rgb(var(--accent2))]"}`} />
                  <AnimatePresence mode="wait" initial={false}>
                    <motion.span key={closed ? "c" : "o"} initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }} transition={{ duration: 0.2 }}>{closed ? "Camera covered" : "Camera on"}</motion.span>
                  </AnimatePresence>
                </span>
              </div>
              <button type="button" onClick={() => setClosed((c) => !c)} className="inline-flex h-10 items-center gap-2 rounded-full bg-white px-4 text-[0.86rem] font-medium text-night">
                <Icon name={closed ? "Unlock" : "Lock"} size={15} />{closed ? "Open the shutter" : "Close the shutter"}
              </button>
            </div>
            <p className="mt-3 text-[0.84rem] leading-relaxed text-mute">{closed ? "The shutter physically covers the lens. No software can see past it." : "While the camera can see, the light beside it stays on."}</p>
          </Reactive>
        </Reveal>
        <div className="grid gap-3 sm:grid-cols-2">
          {PRIVACY.points.map((pt, i) => (
            <Reveal key={pt.t} delay={0.05 * i}>
              <Reactive className="sg-glass group h-full rounded-[1.4rem] p-5">
                <span className="grid h-10 w-10 place-items-center rounded-xl bg-accent/15 text-accent2 transition-transform duration-500 ease-out-expo group-hover:scale-110 group-hover:-rotate-6"><Icon name={pt.icon} size={18} /></span>
                <h3 className="h-card mt-4 text-[1.08rem]">{pt.t}</h3>
                <p className="mt-1.5 text-[0.88rem] leading-relaxed text-mute">{pt.d}</p>
              </Reactive>
            </Reveal>
          ))}
        </div>
      </div>
    </Section>
  );
}
