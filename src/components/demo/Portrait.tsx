import { motion, useTransform, type MotionValue } from "framer-motion";
import type { ReactNode } from "react";
import { kelvinToRGB, triple } from "../../lib/physics";
import { sampleAt, tToK, type Condition } from "../../lib/environments";

/** Stylised figure. Drawn once as shared geometry; light is applied by the layers above it. */
export function Figure({ id = "fig" }: { id?: string }) {
  return (
    <svg viewBox="0 0 400 500" preserveAspectRatio="xMidYMid slice" className="absolute inset-0 h-full w-full" aria-label="Stylised portrait under simulated lighting">
      <defs>
        <linearGradient id={`${id}-skin`} x1=".25" y1="0" x2=".8" y2="1"><stop offset="0" stopColor="#D9AC8B" /><stop offset=".55" stopColor="#C08E70" /><stop offset="1" stopColor="#8E6450" /></linearGradient>
        <linearGradient id={`${id}-hair`} x1=".2" y1="0" x2=".85" y2="1"><stop offset="0" stopColor="#3E2C1F" /><stop offset="1" stopColor="#1B130D" /></linearGradient>
        <linearGradient id={`${id}-cloth`} x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#2F3550" /><stop offset="1" stopColor="#161A2A" /></linearGradient>
        <radialGradient id={`${id}-room`} cx=".5" cy=".3" r=".8"><stop offset="0" stopColor="#151A2A" /><stop offset="1" stopColor="#07080D" /></radialGradient>
      </defs>
      <rect width="400" height="500" fill={`url(#${id}-room)`} />
      <path d="M167 262h66v104c0 12-14 19-33 19s-33-7-33-19z" fill="#A8785E" />
      <path d="M167 262h66v22c-17 13-49 13-66 0z" fill="#8A6049" opacity=".85" />
      <path d="M6 500C10 424 58 376 138 358L262 358C342 376 390 424 394 500Z" fill={`url(#${id}-cloth)`} />
      <path d="M6 500C10 424 58 376 138 358L262 358C342 376 390 424 394 500" fill="none" stroke="rgba(200,215,255,.16)" strokeWidth="1.6" />
      <path d="M164 360c10 15 22 22 36 22s26-7 36-22" fill="none" stroke="rgba(0,0,0,.35)" strokeWidth="2" />
      <path d="M200 128c40 0 66 28 66 74 0 52-30 98-66 98s-66-46-66-98c0-46 26-74 66-74z" fill={`url(#${id}-skin)`} />
      <ellipse cx="136" cy="218" rx="8" ry="14" fill="#B4826A" /><ellipse cx="264" cy="218" rx="8" ry="14" fill="#B4826A" />
      <path d="M140 204c-3 34 8 66 25 82-20-9-33-46-25-82z" fill="#8E6450" opacity=".28" />
      <path d="M154 192c10-6 24-6 32-2" stroke="#3C2A20" strokeWidth="4.2" fill="none" strokeLinecap="round" opacity=".88" />
      <path d="M246 192c-10-6-24-6-32-2" stroke="#3C2A20" strokeWidth="4.2" fill="none" strokeLinecap="round" opacity=".88" />
      <path d="M156 212c9-9 23-9 32 0-9 9-23 9-32 0z" fill="#EADCCF" /><path d="M244 212c-9-9-23-9-32 0 9 9 23 9 32 0z" fill="#EADCCF" />
      <circle cx="172" cy="212" r="5.5" fill="#3B2A1E" /><circle cx="228" cy="212" r="5.5" fill="#3B2A1E" />
      <circle cx="173.6" cy="210.4" r="1.6" fill="#fff" opacity=".75" /><circle cx="229.6" cy="210.4" r="1.6" fill="#fff" opacity=".75" />
      <path d="M156 212c9-9 23-9 32 0" stroke="#4A352A" strokeWidth="1.5" fill="none" opacity=".75" /><path d="M244 212c-9-9-23-9-32 0" stroke="#4A352A" strokeWidth="1.5" fill="none" opacity=".75" />
      <path d="M200 218v32c0 5-4 8-10 9" stroke="#8E6450" strokeWidth="3" fill="none" strokeLinecap="round" opacity=".65" />
      <path d="M182 270c7-5 12-7 18-7s11 2 18 7c-7 8-12 11-18 11s-11-3-18-11z" fill="#9A5A52" />
      <path d="M182 270c7-3 12-4 18-4s11 1 18 4" stroke="#7A443E" strokeWidth="1.3" fill="none" />
      <path d="M200 118c40 0 66 28 66 72 0 10-1 19-3 26-4-23-8-39-17-46-14 10-33 15-46 15s-32-5-46-15c-9 7-13 23-17 46-2-7-3-16-3-26 0-44 26-72 66-72z" fill={`url(#${id}-hair)`} />
    </svg>
  );
}

const fmt = (n: number) => n.toFixed(3);

/** A lit reflection. `t` is track position 0..1 (warm -> cool). Everything derives from it each frame. */
export function LitPortrait({ t, id, children, fixed }: { t: MotionValue<number>; id: string; children?: ReactNode; fixed?: Condition }) {
  const cond = (v: number): Condition => fixed ?? sampleAt(tToK(Math.max(-0.08, Math.min(1.08, v))));
  const src = t;
  const rgb   = useTransform(src, (v) => triple(kelvinToRGB(cond(v).k)));
  const lx    = useTransform(src, (v) => `${cond(v).x}%`);
  const ly    = useTransform(src, (v) => `${cond(v).y}%`);
  const ka    = useTransform(src, (v) => fmt(Math.min(0.95, cond(v).i + 0.3)));
  const kb    = useTransform(src, (v) => fmt(cond(v).i * 0.5));
  const ca    = useTransform(src, (v) => fmt(0.3 + (1 - cond(v).i) * 0.16));
  const sx    = useTransform(src, (v) => `${100 - cond(v).x}%`);
  const sy    = useTransform(src, (v) => `${100 - cond(v).y}%`);
  const sa    = useTransform(src, (v) => fmt(0.3 + (1 - cond(v).i) * 0.42));
  const filt  = useTransform(src, (v) => { const c = cond(v); return `saturate(${fmt(0.42 + (c.cri / 100) * 0.68)}) contrast(${fmt(0.8 + c.i * 0.34)}) brightness(${fmt(0.56 + c.i * 0.72)})`; });
  const key   = useTransform([rgb, lx, ly, ka, kb], ([c, x, y, a, b]) => `radial-gradient(58% 52% at ${x} ${y}, rgb(${c} / ${a}) 0%, rgb(${c} / ${b}) 42%, transparent 76%)`);
  const cast  = useTransform([rgb, ca], ([c, a]) => `rgb(${c} / ${a})`);
  const shade = useTransform([sx, sy, sa], ([x, y, a]) => `radial-gradient(72% 66% at ${x} ${y}, rgba(8,8,14,${a}) 0%, rgba(8,8,14,.05) 70%, transparent 88%)`);

  return (
    <div className="absolute inset-0 overflow-hidden" style={{ background: "#07080D" }}>
      <motion.div className="absolute inset-0" style={{ filter: filt }}>
        <Figure id={id} />
        {children}
        <motion.div className="lyr lyr-shade" style={{ background: shade }} />
        <motion.div className="lyr lyr-cast" style={{ background: cast }} />
        <motion.div className="lyr lyr-key" style={{ background: key }} />
      </motion.div>
      <div className="lyr lyr-veil" />
    </div>
  );
}
