import { create } from "zustand";

/** Screen-space positions of the hero orbs, written by the 3D scene every
    frame and read by the DOM overlay (labels, feature cards) without React. */
export type OrbScreen = { x: number; y: number; r: number; alpha: number };
export const orbScreen: (OrbScreen & { z: number })[] = Array.from({ length: 14 }, () => ({ x: 0, y: 0, r: 0, alpha: 0, z: 0 }));
/** The mirror's screen rectangle, so labels of orbs hidden behind it can hide too. */
export const mirrorRect = { x0: 0, y0: 0, x1: 0, y1: 0, /** the glass's four projected corners, x,y in order */ q: [0, 0, 0, 0, 0, 0, 0, 0] };

/** Does a screen rect [x0, y0, x1, y1] overlap the mirror's projected outline? (separating axes) */
export function hitsMirror(r: number[], pad = 4) {
  const q = mirrorRect.q;
  const rect = [r[0] - pad, r[1] - pad, r[2] + pad, r[1] - pad, r[2] + pad, r[3] + pad, r[0] - pad, r[3] + pad];
  const axes: number[] = [1, 0, 0, 1];
  for (let i = 0; i < 4; i++) { const j = (i + 1) % 4; axes.push(-(q[j * 2 + 1] - q[i * 2 + 1]), q[j * 2] - q[i * 2]); }
  for (let a = 0; a < axes.length; a += 2) {
    const ax = axes[a], ay = axes[a + 1];
    let p0 = Infinity, p1 = -Infinity, m0 = Infinity, m1 = -Infinity;
    for (let k = 0; k < 8; k += 2) { const d = rect[k] * ax + rect[k + 1] * ay; p0 = Math.min(p0, d); p1 = Math.max(p1, d); }
    for (let k = 0; k < 8; k += 2) { const d = q[k] * ax + q[k + 1] * ay; m0 = Math.min(m0, d); m1 = Math.max(m1, d); }
    if (p1 < m0 || m1 < p0) return false;
  }
  return true;
}

/** Hover and selection are rare events, so they live in a tiny store. */
type HeroUI = { hovered: number; selected: number; setHovered: (i: number) => void; setSelected: (i: number) => void };
export const useHeroUI = create<HeroUI>((set) => ({
  hovered: -1, selected: -1,
  setHovered: (i) => set({ hovered: i }),
  setSelected: (i) => set({ selected: i }),
}));

export const MIRROR = { w: 1.05, h: 1.45, bezel: 0.046, corner: 0.15, depth: 0.03, bevel: 0.012 };

/* Orb positions relative to the mirror's centre, in two layouts. */
export const ORBS_WIDE: { p: [number, number, number]; r: number }[] = [
  { p: [-0.6, 0.5, 0.5], r: 0.12 },
  { p: [-0.62, -0.38, 0.62], r: 0.115 },
  { p: [0.86, 0.06, 0.4], r: 0.15 },
  { p: [0.92, -0.58, 0.5], r: 0.16 },
  { p: [0.6, 0.72, -0.5], r: 0.1 },
  { p: [0.3, -0.98, -0.4], r: 0.11 },
  { p: [-0.38, -0.92, 0.45], r: 0.11 },
];
export const ORBS_TALL: { p: [number, number, number]; r: number }[] = [
  { p: [-0.74, 0.8, 0.42], r: 0.15 },
  { p: [0.76, 0.58, 0.36], r: 0.135 },
  { p: [-0.76, -0.56, 0.5], r: 0.13 },
  { p: [0.72, -0.72, 0.32], r: 0.15 },
  { p: [0.02, 1.04, -0.42], r: 0.1 },
  { p: [-0.06, -1.02, 0.46], r: 0.11 },
  { p: [0.86, 0.04, -0.52], r: 0.1 },
];

if (import.meta.env.DEV && typeof window !== "undefined") Object.assign(window, { __hero: { orbScreen, mirrorRect } });
