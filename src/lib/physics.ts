/** Colour temperature (K) -> RGB via the standard black-body approximation. */
export function kelvinToRGB(k: number): [number, number, number] {
  const t = clamp(k, 1000, 12000) / 100;
  let r: number, g: number, b: number;
  if (t <= 66) { r = 255; g = 99.4708025861 * Math.log(t) - 161.1195681661; }
  else { r = 329.698727446 * Math.pow(t - 60, -0.1332047592); g = 288.1221695283 * Math.pow(t - 60, -0.0755148492); }
  if (t >= 66) b = 255; else if (t <= 19) b = 0; else b = 138.5177312231 * Math.log(t - 10) - 305.0447927307;
  return [Math.round(clamp(r, 0, 255)), Math.round(clamp(g, 0, 255)), Math.round(clamp(b, 0, 255))];
}
export const hex = (c: [number, number, number]) => "#" + c.map((v) => v.toString(16).padStart(2, "0")).join("");
export const triple = (c: [number, number, number]) => `${c[0]} ${c[1]} ${c[2]}`;
export const clamp = (v: number, lo: number, hi: number) => (v < lo ? lo : v > hi ? hi : v);
export const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

/** Apple's momentum projection: exponential decay, not v²/2a. */
export function project(velocity: number, decelerationRate = 0.995): number {
  return (velocity / 1000) * decelerationRate / (1 - decelerationRate);
}
/** Progressive resistance past a boundary. */
export function rubberband(overshoot: number, dimension = 1, constant = 0.55): number {
  return (overshoot * dimension * constant) / (dimension + constant * Math.abs(overshoot));
}
/** Apple's damping-ratio + response parameterisation -> Framer's stiffness/damping. */
export function springFor(response: number, dampingRatio: number) {
  const w = (2 * Math.PI) / response;
  return { type: "spring" as const, stiffness: w * w, damping: 2 * dampingRatio * w, mass: 1 };
}
