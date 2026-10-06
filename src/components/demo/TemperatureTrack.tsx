import { animate, motion, useTransform, type MotionValue } from "framer-motion";
import { useMemo, useRef, useState } from "react";
import { ENVS, TRACK_ORDER, kToT, nearestEnv, tToK } from "../../lib/environments";
import { hex, kelvinToRGB, project, rubberband, springFor } from "../../lib/physics";

/**
 * The product's core variable as a real gesture control:
 * 1:1 pointer tracking with capture and grab offset, rubber-banding past the ends,
 * momentum projection on release, and the release velocity handed to the spring.
 */
export function TemperatureTrack({ t }: { t: MotionValue<number> }) {
  const trackRef = useRef<HTMLDivElement>(null);
  const hist = useRef<{ x: number; time: number }[]>([]);
  const grab = useRef(0);
  const active = useRef<number | null>(null);
  const [dragging, setDragging] = useState(false);

  const gradient = useMemo(() => {
    const stops: string[] = [];
    for (let n = 0; n <= 24; n++) { const p = n / 24; stops.push(`${hex(kelvinToRGB(tToK(p)))} ${(p * 100).toFixed(1)}%`); }
    return `linear-gradient(90deg, ${stops.join(",")})`;
  }, []);

  const thumbX = useTransform(t, (v) => `${Math.max(-8, Math.min(108, v * 100))}%`);
  const glow = useTransform(t, (v) => hex(kelvinToRGB(tToK(Math.max(0, Math.min(1, v))))));
  const shadow = useTransform(glow, (c) => `0 0 0 2px rgba(5,6,10,.9), 0 0 18px -2px ${c}, 0 4px 12px rgba(0,0,0,.6)`);

  const posT = (clientX: number) => {
    const r = trackRef.current!.getBoundingClientRect();
    let v = (clientX - r.left - grab.current) / r.width;
    if (v < 0) v = -rubberband(-v);
    else if (v > 1) v = 1 + rubberband(v - 1);
    return v;
  };

  const onDown = (e: React.PointerEvent) => {
    if (active.current !== null) return;
    active.current = e.pointerId;
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    const r = trackRef.current!.getBoundingClientRect();
    const px = e.clientX - r.left, thumb = Math.max(-0.08, Math.min(1.08, t.get())) * r.width;
    grab.current = Math.abs(px - thumb) < 20 ? px - thumb : 0;   /* respect where they grabbed */
    hist.current = [{ x: e.clientX, time: performance.now() }];
    t.stop(); t.set(posT(e.clientX));                            /* respond on press */
    setDragging(true);
    e.preventDefault();
  };
  const onMove = (e: React.PointerEvent) => {
    if (active.current !== e.pointerId) return;
    hist.current.push({ x: e.clientX, time: performance.now() });
    if (hist.current.length > 12) hist.current.shift();
    t.set(posT(e.clientX));                                       /* continuous, 1:1 */
  };
  const onUp = (e: React.PointerEvent) => {
    if (active.current !== e.pointerId) return;
    active.current = null; setDragging(false);
    const now = performance.now();
    const recent = hist.current.filter((p) => now - p.time < 90);
    let vpx = 0;
    if (recent.length >= 2) { const a = recent[0], b = recent[recent.length - 1]; const dt = (b.time - a.time) / 1000; vpx = dt > 0 ? (b.x - a.x) / dt : 0; }
    const w = trackRef.current!.getBoundingClientRect().width;
    const v = vpx / w;                                            /* px/s -> track units/s */
    const projected = t.get() + project(vpx) / w;                 /* where the flick is going */
    const target = nearestEnv(projected);
    animate(t, kToT(target.k), { ...springFor(0.42, 0.8), velocity: v }); /* momentum preceded this: a little bounce */
  };
  const onKey = (e: React.KeyboardEvent) => {
    /* step along the track, not along the data order */
    let idx = TRACK_ORDER.indexOf(nearestEnv(t.get()));
    if (e.key === "ArrowRight" || e.key === "ArrowUp") idx = Math.min(TRACK_ORDER.length - 1, idx + 1);
    else if (e.key === "ArrowLeft" || e.key === "ArrowDown") idx = Math.max(0, idx - 1);
    else if (e.key === "Home") idx = 0; else if (e.key === "End") idx = TRACK_ORDER.length - 1; else return;
    e.preventDefault();
    animate(t, kToT(TRACK_ORDER[idx].k), springFor(0.4, 1));
  };

  return (
    <div className="px-1">
      <div
        ref={trackRef} role="slider" tabIndex={0} aria-label="Destination lighting"
        aria-valuemin={ENVS[0].k} aria-valuemax={ENVS[ENVS.length - 1].k} aria-valuenow={Math.round(tToK(Math.max(0, Math.min(1, t.get()))))}
        className={`relative h-8 flex items-center select-none touch-none ${dragging ? "cursor-grabbing" : "cursor-grab"}`}
        onPointerDown={onDown} onPointerMove={onMove} onPointerUp={onUp} onPointerCancel={onUp} onKeyDown={onKey}
      >
        <div className="absolute inset-x-0 h-[5px] rounded-full opacity-90" style={{ background: gradient }} />
        {ENVS.map((e) => (
          <span key={e.id} className="absolute h-2.5 w-px bg-white/30" style={{ left: `${kToT(e.k) * 100}%` }} />
        ))}
        <motion.div
          className="absolute top-1/2 h-[18px] w-[18px] -ml-[9px] -mt-[9px] rounded-full bg-white"
          style={{ left: thumbX, boxShadow: shadow }}
          animate={{ scale: dragging ? 1.25 : 1 }} transition={springFor(0.25, 0.8)}
        />
      </div>
      <div className="mt-1 flex justify-between text-[0.62rem] uppercase tracking-[0.16em] text-dim">
        <span>6500K cool</span><span className="text-mute">Drag the light</span><span>1900K warm</span>
      </div>
    </div>
  );
}
