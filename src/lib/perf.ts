/**
 * A rough performance tier, decided once at start-up and lowered at runtime
 * if frames run long. "high" desktops get full-resolution effects, "mid"
 * gets fewer samples, "low" (most phones) gets the lightest version of
 * everything. Nothing is ever switched off entirely except under
 * prefers-reduced-motion.
 */
export type Tier = "high" | "mid" | "low";

const nav = typeof navigator !== "undefined" ? (navigator as Navigator & { deviceMemory?: number }) : undefined;

export const isCoarse = typeof window !== "undefined" && window.matchMedia("(pointer: coarse)").matches;
export const isNarrow = typeof window !== "undefined" && window.innerWidth < 768;
export const reducedMotion = typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

function initialTier(): Tier {
  if (typeof window === "undefined") return "mid";
  const forced = new URLSearchParams(window.location.search).get("tier");
  if (forced === "high" || forced === "mid" || forced === "low") return forced;
  const cores = nav?.hardwareConcurrency ?? 4;
  const mem = nav?.deviceMemory ?? 4;
  if (isCoarse || isNarrow) return cores >= 8 && mem >= 6 ? "mid" : "low";
  return cores >= 8 && mem >= 8 ? "high" : "mid";
}

const listeners = new Set<(t: Tier) => void>();
let tier: Tier = initialTier();
export const getTier = () => tier;
export function onTier(fn: (t: Tier) => void) { listeners.add(fn); return () => { listeners.delete(fn); }; }

/** Called by the ticker with frame times; steps the tier down after sustained slow frames. */
let slow = 0, samples = 0;
export function reportFrame(ms: number) {
  if (document.hidden) return;
  samples++;
  if (ms > 26) slow++;
  if (samples >= 120) {
    if (slow / samples > 0.45 && tier !== "low") {
      tier = tier === "high" ? "mid" : "low";
      listeners.forEach((fn) => fn(tier));
    }
    slow = 0; samples = 0;
  }
}

/** Resolution scale for full-screen shader passes. */
export const bgScale = (t: Tier) => (t === "high" ? 0.72 : t === "mid" ? 0.55 : 0.4);
/** DPR range for 3D canvases. */
export const dprFor = (t: Tier): [number, number] => (t === "high" ? [1, 1.75] : t === "mid" ? [1, 1.4] : [0.8, 1.15]);

/** Chromium only: url() inside backdrop-filter (the SVG lens) works nowhere else. */
export const supportsRefraction = typeof navigator !== "undefined" && "userAgentData" in navigator && !isCoarse;
