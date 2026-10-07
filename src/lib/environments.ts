export type Env = {
  id: string; name: string; k: number; cri: number; lux: string;
  i: number; x: number; y: number; note: string;
};

/** Ordered warm -> cool. These drive the simulation; values are typical published ranges, not venue measurements. */
export const ENVS: Env[] = [
  { id: "candlelit",  name: "Candlelit dinner", k: 1900, cri: 100, lux: "~20 lx",     i: 0.34, x: 26, y: 70,
    note: "Low, warm and lit from below. Everything you matched under bathroom light shifts here, and nothing tells you in advance." },
  { id: "nightlife",  name: "Nightlife",        k: 2400, cri: 45,  lux: "~10 lx",     i: 0.36, x: 74, y: 76,
    note: "Coloured, low-CRI sources. Colour rendering collapses: skin and fabric read as colours they are not." },
  { id: "restaurant", name: "Restaurant",       k: 3000, cri: 90,  lux: "~150 lx",    i: 0.40, x: 22, y: 36,
    note: "Warm pendants, mostly from one side. A high proportion of first impressions happen in exactly this light." },
  { id: "office",     name: "Office",           k: 4000, cri: 82,  lux: "~500 lx",    i: 0.46, x: 50, y: -4,
    note: "Overhead panel LED, straight down. Flat, slightly green, and unkind to everyone equally." },
  { id: "daylight",   name: "Daylight",         k: 6500, cri: 100, lux: "~10,000 lx", i: 0.60, x: 50, y: 10,
    note: "North light at midday. The reference condition, and the one almost nobody actually gets ready in." },
];
export const BASELINE: Env = { id: "bathroom", name: "Your bathroom", k: 5000, cri: 80, lux: "~300 lx", i: 0.52, x: 50, y: 2,
  note: "Bright, cool and overhead. It matches none of the others, which is the whole problem." };

/* The track runs in mired (1e6/K): perceptually even, so the warm end gets its room.
   t = 0 is the COOL end (daylight) and t = 1 the warm end (candlelight), matching
   the order the environment list is presented in. */
const K_WARM = ENVS[0].k, K_COOL = ENVS[ENVS.length - 1].k;
const M_WARM = 1e6 / K_WARM, M_COOL = 1e6 / K_COOL;
export const kToT = (k: number) => (1e6 / k - M_COOL) / (M_WARM - M_COOL);
export const tToK = (t: number) => 1e6 / (M_COOL + t * (M_WARM - M_COOL));
/** Environments in track order, left to right. */
export const TRACK_ORDER: Env[] = [...ENVS].sort((a, b) => kToT(a.k) - kToT(b.k));
/** What the demo opens on. */
export const DEFAULT_ENV: Env = ENVS[ENVS.length - 1];

export type Condition = { k: number; cri: number; i: number; x: number; y: number };
/** Interpolate the physical condition between bracketing environments (in mired space). */
export function sampleAt(k: number): Condition {
  if (k <= ENVS[0].k) return ENVS[0];
  if (k >= ENVS[ENVS.length - 1].k) return ENVS[ENVS.length - 1];
  for (let n = 1; n < ENVS.length; n++) {
    if (k <= ENVS[n].k) {
      const a = ENVS[n - 1], b = ENVS[n];
      const f = (kToT(k) - kToT(a.k)) / (kToT(b.k) - kToT(a.k));
      const L = (p: number, q: number) => p + (q - p) * f;
      return { k, cri: L(a.cri, b.cri), i: L(a.i, b.i), x: L(a.x, b.x), y: L(a.y, b.y) };
    }
  }
  return ENVS[ENVS.length - 1];
}
export function nearestEnv(t: number): Env {
  let best = ENVS[0], bd = Infinity;
  for (const e of ENVS) { const d = Math.abs(kToT(e.k) - t); if (d < bd) { bd = d; best = e; } }
  return best;
}
