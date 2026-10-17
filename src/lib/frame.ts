/**
 * Values that change every frame live here, outside React, so that the
 * background shader, the 3D scenes and the DOM effects can all read them
 * without re-rendering anything. One ticker (GSAP's) advances them.
 */
export const frame = {
  time: 0,
  dt: 0.016,
  pointer: {
    /** raw position in CSS px */
    x: 0, y: 0,
    /** -1..1, y up, smoothed */
    nx: 0, ny: 0,
    /** -1..1, y up, raw target */
    tx: 0, ty: 0,
    /** smoothed velocity in viewport widths per second */
    vx: 0, vy: 0,
    /** has the pointer moved at all yet (touch devices may never) */
    seen: false,
    /** touch input most recently */
    touch: false,
  },
  scroll: {
    /** document scroll in px */
    y: 0,
    /** smoothed velocity in viewport heights per second */
    v: 0,
  },
  /** 0 = Selika Beauty world, 1 = Selika Dev world, eased */
  world: 0,
  worldTarget: 0,
  /** progress through the hero's "through the mirror" dive, 0..1 */
  hero: 0,
  /** on portrait screens: the free band between the hero copy and the switcher, in px from the top */
  heroBox: { top: 0, bottom: 0 },
  /** viewport */
  vw: typeof window !== "undefined" ? window.innerWidth : 1440,
  vh: typeof window !== "undefined" ? window.innerHeight : 900,
};

export type Frame = typeof frame;
