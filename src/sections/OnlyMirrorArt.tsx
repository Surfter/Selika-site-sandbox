/* The three "only a mirror" visuals: one of the demo's portraits (AI-generated, not a real person)
   in a small mirror, animated with CSS so they cost nothing to run.
   Reflect: the guides draw themselves on the reflection.
   Light: the mirror's light ring runs from warm to cool and the face takes on each light.
   Return: frames that drift like phone selfies settle into the same framing, day after day. */

const GUIDES = {
  brows: ["M47.9 144.8 Q60.6 131.4 72.2 128.8 Q83.9 126.3 100.1 128.8 Q116.2 131.4 135.8 135.6 L155.3 139.7", "M355.0 144.2 Q338.0 130.7 324.5 128.6 Q311.0 126.5 293.7 130.4 Q276.4 134.3 257.0 139.4 L237.6 144.6"],
  liner: ["M152.4 200.6 Q147.5 194.9 142.4 190.4 Q137.4 185.9 130.3 182.4 Q123.2 179.0 116.0 177.8 Q108.7 176.6 101.8 177.3 Q94.9 178.1 90.8 179.9 Q86.8 181.7 84.7 183.2 Q82.5 184.7 80.9 186.0 Q79.3 187.3 74.3 180.5 L69.3 173.7", "M244.8 202.5 Q249.9 196.5 255.4 191.4 Q261.0 186.4 268.4 182.7 Q275.8 179.0 283.1 178.1 Q290.5 177.2 297.5 178.2 Q304.5 179.3 308.6 181.4 Q312.7 183.5 315.0 185.1 Q317.3 186.7 319.1 188.0 Q320.9 189.3 326.4 182.1 L331.8 174.9"],
  lips: "M136.1 377.1 Q132.8 372.5 135.9 370.4 Q139.0 368.2 143.3 365.9 Q147.6 363.6 153.7 360.7 Q159.8 357.8 169.2 355.0 Q178.7 352.2 188.8 354.7 Q198.9 357.2 209.2 354.5 Q219.5 351.9 229.8 354.4 Q240.1 357.0 246.8 359.6 Q253.5 362.2 258.6 364.2 Q263.6 366.2 267.2 368.1 Q270.8 370.0 267.4 374.9 Q264.0 379.7 259.2 385.4 Q254.4 391.2 247.1 397.7 Q239.8 404.2 230.7 408.6 Q221.5 413.1 210.9 414.4 Q200.4 415.6 190.1 414.5 Q179.8 413.3 170.9 409.1 Q162.1 405.0 155.1 398.8 Q148.1 392.5 143.8 387.1 Q139.4 381.7 136.1 377.1 Z",
  dots: [[47.9, 144.8], [83.9, 126.3], [155.3, 139.7], [355.0, 144.2], [311.0, 126.5], [237.6, 144.6], [69.3, 173.7], [331.8, 174.9], [132.8, 372.5], [270.8, 370.0]],
};

function Stage({ children, label }: { children: React.ReactNode; label: string }) {
  return (
    <div className="om-stage relative aspect-[16/10] overflow-hidden rounded-[1.2rem] bg-[#06070c] ring-1 ring-white/10" aria-hidden>
      {children}
      <span className="absolute bottom-2.5 left-3 rounded-full bg-black/55 px-2.5 py-1 text-[0.68rem] text-ink/85 backdrop-blur">{label}</span>
    </div>
  );
}

/* a small portrait mirror, centred in the stage */
function MiniGlass({ src, children, className = "" }: { src: string; children?: React.ReactNode; className?: string }) {
  return (
    <div className={`absolute left-1/2 top-1/2 aspect-[4/5] h-[86%] -translate-x-1/2 -translate-y-1/2 overflow-hidden rounded-[0.9rem] ${className}`}>
      <img src={src} alt="" loading="lazy" decoding="async" className="absolute inset-0 h-full w-full object-cover" />
      {children}
    </div>
  );
}

export function ReflectArt() {
  return (
    <Stage label="Drawn on your reflection">
      <MiniGlass src="/visuals/reflect.webp" className="ring-1 ring-white/25 shadow-[0_0_0_3px_rgba(255,255,255,0.04),0_0_40px_-6px_rgb(var(--accent)/0.6)]">
        <svg viewBox="0 0 400 500" className="om-guides absolute inset-0 h-full w-full" fill="none" strokeLinecap="round" strokeLinejoin="round">
          {GUIDES.brows.map((d, i) => <path key={`b${i}`} d={d} pathLength={1} className="om-draw" style={{ ["--d" as string]: "0s" }} stroke="rgb(var(--accent2))" strokeWidth="5" />)}
          {GUIDES.liner.map((d, i) => <path key={`l${i}`} d={d} pathLength={1} className="om-draw" style={{ ["--d" as string]: "0.9s" }} stroke="rgb(var(--accent2))" strokeWidth="4.5" />)}
          <path d={GUIDES.lips} pathLength={1} className="om-draw" style={{ ["--d" as string]: "1.8s" }} stroke="rgb(var(--accent2))" strokeWidth="4" />
          {GUIDES.dots.map(([x, y], i) => <circle key={i} cx={x} cy={y} r="5.5" className="om-dot" style={{ ["--d" as string]: `${0.3 + i * 0.12}s` }} fill="#fff" />)}
        </svg>
        <span className="om-scan absolute inset-x-0 h-[18%]" />
      </MiniGlass>
    </Stage>
  );
}

const KELVIN = [["2700K", "#ffb46b"], ["3500K", "#ffc992"], ["4000K", "#ffe2c2"], ["5000K", "#f4f0ff"], ["6500K", "#d6e4ff"]];
export function LightArt() {
  return (
    <Stage label="Light from the glass, 2700K to 6500K">
      <div className="om-ring absolute left-1/2 top-1/2 aspect-[4/5] h-[92%] -translate-x-1/2 -translate-y-1/2 rounded-[1.15rem]" />
      <MiniGlass src="/visuals/light.webp">
        <span className="om-tint absolute inset-0 mix-blend-soft-light" />
      </MiniGlass>
      <div className="absolute right-3 top-3 h-6 w-16 overflow-hidden rounded-full bg-black/55 backdrop-blur">
        {KELVIN.map(([k, c], i) => (
          <span key={k} className="om-k absolute inset-0 flex items-center justify-center gap-1.5 text-[0.66rem] font-medium text-ink/90" style={{ ["--i" as string]: i }}>
            <i className="block h-1.5 w-1.5 rounded-full" style={{ background: c }} />{k}
          </span>
        ))}
      </div>
    </Stage>
  );
}

export function ReturnArt() {
  return (
    <Stage label="Same angle, same light, every day">
      <MiniGlass src="/visuals/return.webp" className="ring-1 ring-white/20">
        {[0, 1, 2].map((i) => (
          <img key={i} src="/visuals/return.webp" alt="" loading="lazy" decoding="async" className="om-ghost absolute inset-0 h-full w-full object-cover" style={{ ["--i" as string]: i }} />
        ))}
      </MiniGlass>
      {/* the framing marks stay put */}
      <svg viewBox="0 0 160 100" className="absolute inset-0 h-full w-full" fill="none" stroke="rgb(var(--accent2))" strokeWidth="1.1" strokeLinecap="round">
        <path d="M58 12 h-6 v6 M102 12 h6 v6 M58 88 h-6 v-6 M102 88 h6 v-6" />
        <path d="M80 44 v12 M74 50 h12" strokeOpacity=".55" />
      </svg>
      <div className="absolute right-3 top-3 flex gap-1">
        {["Mon", "Tue", "Wed", "Thu"].map((d, i) => <span key={d} className="om-day rounded-full bg-black/55 px-2 py-0.5 text-[0.62rem] text-ink/60" style={{ ["--i" as string]: i }}>{d}</span>)}
      </div>
    </Stage>
  );
}
