/* The three "only a mirror" visuals: one of the demo's portraits (AI-generated, not a real person)
   in a small mirror, animated with CSS so they cost nothing to run.
   Reflect: the guides draw themselves on the reflection.
   Light: the mirror's light ring runs from warm to cool and the face takes on each light.
   Return: frames that drift like phone selfies settle into the same framing, day after day. */

const GUIDES = {
  brows: ["M45.4 150.6 Q59.3 135.1 71.3 131.0 Q83.3 126.9 99.5 128.0 Q115.7 129.1 134.6 132.0 L153.4 135.0", "M356.0 151.9 Q337.0 135.6 322.4 131.4 Q307.9 127.2 289.6 128.6 Q271.4 129.9 251.3 132.8 L231.2 135.7"],
  liner: ["M152.2 197.3 Q147.0 192.2 141.6 188.1 Q136.1 184.1 128.9 181.1 Q121.7 178.1 114.8 177.3 Q107.9 176.6 101.2 177.8 Q94.5 179.0 90.5 181.1 Q86.6 183.2 84.5 184.8 Q82.3 186.4 80.7 187.8 Q79.1 189.2 73.8 182.2 L68.6 175.2", "M243.5 196.5 Q248.6 191.7 254.2 188.0 Q259.8 184.4 267.1 182.1 Q274.5 179.7 281.6 179.6 Q288.7 179.5 295.6 181.1 Q302.6 182.7 306.9 184.9 Q311.2 187.2 313.7 188.8 Q316.2 190.5 318.3 191.9 Q320.3 193.3 325.6 186.3 L330.8 179.3"],
  lips: "M118.0 365.2 Q114.4 359.7 118.3 358.6 Q122.2 357.5 127.6 356.4 Q132.9 355.2 140.3 353.8 Q147.7 352.3 158.7 351.1 Q169.8 349.9 181.2 352.9 Q192.5 355.8 204.4 353.8 Q216.2 351.7 227.4 353.9 Q238.6 356.0 245.8 357.9 Q253.0 359.8 258.4 361.2 Q263.7 362.5 267.7 363.7 Q271.7 364.9 267.4 369.6 Q263.2 374.2 257.5 379.4 Q251.8 384.6 243.4 390.2 Q235.0 395.8 224.6 399.4 Q214.2 403.1 202.2 403.9 Q190.3 404.8 178.8 403.5 Q167.3 402.2 157.4 398.4 Q147.4 394.6 139.6 388.4 Q131.7 382.3 126.7 376.4 Q121.6 370.6 118.0 365.2 Z",
  dots: [[45.4, 150.6], [83.3, 126.9], [153.4, 135.0], [356.0, 151.9], [307.9, 127.2], [231.2, 135.7], [68.6, 175.2], [330.8, 179.3], [114.4, 359.7], [271.7, 364.9]],
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
