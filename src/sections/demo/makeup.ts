/* Painting in the face's UV space. The 3D face (ICT-FaceKit) keeps its
   front in one UV tile, so makeup and guidance are drawn on 2D canvases
   with the model's own landmarks and wrap onto the face, following blinks
   and smiles. Coordinates are 0..1, y down. */
import LM from "./landmarks.json";
import { LOOKS, TONES, type LookId, type Region } from "./state";

type P = [number, number];
const U = LM.uv as P[];
const pts = (a: number, b: number) => U.slice(a, b + 1);
export const L = {
  jaw: pts(0, 16), browR: pts(17, 21), browL: pts(22, 26), noseBridge: pts(27, 30), noseBase: pts(31, 35),
  eyeR: pts(36, 41), eyeL: pts(42, 47), lipOuter: pts(48, 59), lipInner: pts(60, 67),
};
const mid = (a: P, b: P, t = 0.5): P => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t];
const avg = (ps: P[]): P => [ps.reduce((s, p) => s + p[0], 0) / ps.length, ps.reduce((s, p) => s + p[1], 0) / ps.length];
export const EYE_CENTRE = { R: avg(L.eyeR), L: avg(L.eyeL) };
export const CHEEK = { R: [0.285, 0.47] as P, L: [0.715, 0.47] as P };

export const TEX = 1024;

/** Smooth curve through points (quadratic through midpoints). */
function curve(ctx: CanvasRenderingContext2D, ps: P[], S: number, closed = false) {
  const p = ps.map(([x, y]) => [x * S, y * S] as P);
  ctx.beginPath();
  if (closed) {
    const m0 = mid(p[p.length - 1], p[0]); ctx.moveTo(m0[0], m0[1]);
    for (let i = 0; i < p.length; i++) { const n = p[(i + 1) % p.length]; const m = mid(p[i], n); ctx.quadraticCurveTo(p[i][0], p[i][1], m[0], m[1]); }
    ctx.closePath();
  } else {
    ctx.moveTo(p[0][0], p[0][1]);
    for (let i = 1; i < p.length - 1; i++) { const m = mid(p[i], p[i + 1]); ctx.quadraticCurveTo(p[i][0], p[i][1], m[0], m[1]); }
    ctx.lineTo(p[p.length - 1][0], p[p.length - 1][1]);
  }
}
function softEllipse(ctx: CanvasRenderingContext2D, c: P, rx: number, ry: number, color: string, alpha: number, S: number, rot = 0) {
  ctx.save(); ctx.translate(c[0] * S, c[1] * S); ctx.rotate(rot); ctx.scale(1, ry / rx);
  const g = ctx.createRadialGradient(0, 0, 0, 0, 0, rx * S);
  g.addColorStop(0, hexA(color, alpha)); g.addColorStop(0.55, hexA(color, alpha * 0.55)); g.addColorStop(1, hexA(color, 0));
  ctx.fillStyle = g; ctx.beginPath(); ctx.arc(0, 0, rx * S, 0, Math.PI * 2); ctx.fill(); ctx.restore();
}
function hexA(hex: string, a: number) {
  const n = parseInt(hex.slice(1), 16); return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${Math.max(0, Math.min(1, a))})`;
}
function shade(hex: string, k: number) {
  const n = parseInt(hex.slice(1), 16); const f = (v: number) => Math.max(0, Math.min(255, Math.round(v * k)));
  return `#${[f((n >> 16) & 255), f((n >> 8) & 255), f(n & 255)].map((v) => v.toString(16).padStart(2, "0")).join("")}`;
}
/** A brow as a tapered band along its landmarks. */
function brow(ctx: CanvasRenderingContext2D, ps: P[], inner: "start" | "end", color: string, alpha: number, S: number) {
  const n = ps.length; const top: P[] = [], bot: P[] = [];
  for (let i = 0; i < n; i++) {
    const t = inner === "end" ? i / (n - 1) : 1 - i / (n - 1); // 1 at the inner end
    const th = (0.006 + 0.008 * t) ;
    top.push([ps[i][0], ps[i][1] - th * 0.9]); bot.push([ps[i][0], ps[i][1] + th * 0.6]);
  }
  ctx.save(); ctx.globalAlpha = alpha; ctx.fillStyle = color;
  curve(ctx, [...top, ...bot.reverse()], S, true); ctx.fill();
  // hair strokes, so it reads as a brow and not a stripe
  ctx.strokeStyle = color; ctx.lineWidth = 1.2; ctx.globalAlpha = alpha * 0.8;
  for (let k = 0; k < 70; k++) {
    const i = Math.random() * (n - 1); const a = ps[Math.floor(i)], b = ps[Math.ceil(i)]; const p = mid(a, b, i % 1);
    const dx = (b[0] - a[0]) || 0.01, dy = (b[1] - a[1]); const len = Math.hypot(dx, dy) || 1;
    const ox = (Math.random() - 0.5) * 0.01, oy = (Math.random() - 0.5) * 0.012;
    ctx.beginPath(); ctx.moveTo((p[0] + ox) * S, (p[1] + oy) * S); ctx.lineTo((p[0] + ox + (dx / len) * 0.012) * S, (p[1] + oy + (dy / len) * 0.012 - 0.004) * S); ctx.stroke();
  }
  ctx.restore();
}

let grainCanvas: HTMLCanvasElement | null = null;
/** A small tile of soft speckle, light and dark around mid grey. */
function grain() {
  if (grainCanvas) return grainCanvas;
  const c = document.createElement("canvas"); c.width = c.height = 128; const g = c.getContext("2d")!;
  const img = g.createImageData(128, 128); let seed = 11;
  const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
  for (let i = 0; i < 128 * 128; i++) { const v = 128 + (rnd() - 0.5) * 150 * (rnd() < 0.85 ? 0.5 : 1); img.data[i * 4] = v; img.data[i * 4 + 1] = v * 0.97; img.data[i * 4 + 2] = v * 0.95; img.data[i * 4 + 3] = 255; }
  g.putImageData(img, 0, 0); grainCanvas = c; return c;
}

/** The face's colour texture: skin, natural brows and lips, and the makeup applied so far. */
export function paintFace(ctx: CanvasRenderingContext2D, tone: number, look: LookId, upTo: number) {
  const S = TEX; const skin = TONES[tone] ?? TONES[1]; const Lk = LOOKS.find((l) => l.id === look)!;
  ctx.globalCompositeOperation = "source-over"; ctx.globalAlpha = 1;
  ctx.fillStyle = skin; ctx.fillRect(0, 0, S, S);
  // gentle variation: warmer cheeks and nose, a little shade under the jaw and at the temples
  softEllipse(ctx, CHEEK.R, 0.11, 0.08, shade(skin, 0.93), 0.35, S); softEllipse(ctx, CHEEK.L, 0.11, 0.08, shade(skin, 0.93), 0.35, S);
  softEllipse(ctx, [0.5, 0.4], 0.05, 0.09, "#d98b7a", 0.12, S);
  softEllipse(ctx, [0.5, 0.78], 0.3, 0.07, shade(skin, 0.8), 0.35, S);
  softEllipse(ctx, [0.5, 0.06], 0.4, 0.1, shade(skin, 1.04), 0.4, S);
  // fine pores and tone variation, so the skin is not flat plastic
  ctx.save(); ctx.globalAlpha = 0.07; ctx.fillStyle = ctx.createPattern(grain(), "repeat")!; ctx.fillRect(0, 0, S, S); ctx.restore();
  // natural lips
  ctx.save(); ctx.fillStyle = hexA(shade("#c77f78", tone > 2 ? 0.7 : 1), 0.55); curve(ctx, L.lipOuter, S, true); ctx.fill();
  ctx.strokeStyle = hexA(shade(skin, 0.55), 0.6); ctx.lineWidth = 2.5; curve(ctx, [L.lipInner[0], L.lipInner[1], L.lipInner[2], L.lipInner[3], L.lipInner[4]], S); ctx.stroke(); ctx.restore();
  // natural brows
  const browC = tone > 2 ? "#1a110c" : "#3a271d";
  brow(ctx, L.browR, "end", browC, 0.45, S); brow(ctx, L.browL, "start", browC, 0.45, S);

  // ---- makeup, step by step ----
  if (upTo >= 1) { brow(ctx, L.browR, "end", browC, Lk.brow * 0.55, S); brow(ctx, L.browL, "start", browC, Lk.brow * 0.55, S); }
  if (upTo >= 2) {
    // shadow on the lid, under the brow
    for (const [eye, c] of [[L.eyeR, EYE_CENTRE.R], [L.eyeL, EYE_CENTRE.L]] as [P[], P][]) {
      softEllipse(ctx, [c[0], c[1] - 0.024], 0.05, 0.026, Lk.shadow, Lk.shadowA, S);
      void eye;
    }
    // liner along the upper lash line, flicked out
    ctx.save(); ctx.strokeStyle = "#0e0a0a"; ctx.lineCap = "round"; ctx.lineJoin = "round"; ctx.lineWidth = 2 + Lk.liner * 3.5;
    const upR: P[] = [L.eyeR[3], L.eyeR[2], L.eyeR[1], L.eyeR[0]].map(([x, y]) => [x, y - 0.0025] as P);
    const upL: P[] = [L.eyeL[0], L.eyeL[1], L.eyeL[2], L.eyeL[3]].map(([x, y]) => [x, y - 0.0025] as P);
    const wingR: P = [L.eyeR[0][0] - 0.022 * Lk.wing - 0.004, L.eyeR[0][1] - 0.012 * Lk.wing];
    const wingL: P = [L.eyeL[3][0] + 0.022 * Lk.wing + 0.004, L.eyeL[3][1] - 0.012 * Lk.wing];
    curve(ctx, [...upR, wingR], S); ctx.stroke(); curve(ctx, [...upL, wingL], S); ctx.stroke(); ctx.restore();
  }
  if (upTo >= 3) { softEllipse(ctx, CHEEK.R, 0.075, 0.05, Lk.blush, Lk.blushA, S, -0.35); softEllipse(ctx, CHEEK.L, 0.075, 0.05, Lk.blush, Lk.blushA, S, 0.35); }
  if (upTo >= 4) {
    ctx.save(); ctx.globalAlpha = Lk.lipA; ctx.fillStyle = Lk.lip; curve(ctx, L.lipOuter, S, true); ctx.fill();
    ctx.globalAlpha = Lk.lipA * 0.6; ctx.strokeStyle = shade(Lk.lip, 0.6); ctx.lineWidth = 2; curve(ctx, L.lipOuter, S, true); ctx.stroke();
    ctx.globalAlpha = 0.35; ctx.fillStyle = "#ffffff"; ctx.beginPath(); ctx.ellipse(0.5 * S, 0.61 * S, 0.025 * S, 0.006 * S, 0, 0, Math.PI * 2); ctx.fill();
    ctx.restore();
  }
}

/** The glowing guidance for the current step (and the hovered region), as an emissive texture.
    Sizes are given for a 1024 canvas and scale with the canvas it is drawn on. */
export function paintGuides(ctx: CanvasRenderingContext2D, region: Region, hover: Region, color: string, t = 0) {
  const S = ctx.canvas.width; const k = S / TEX;
  ctx.setLineDash([]); ctx.globalAlpha = 1;
  ctx.fillStyle = "#000"; ctx.fillRect(0, 0, S, S);
  ctx.lineCap = "round"; ctx.lineJoin = "round";
  const lw = (w: number) => { ctx.lineWidth = w * k; };
  const dash = (on: number, off: number) => { ctx.setLineDash([on * k, off * k]); ctx.lineDashOffset = -t * 26 * k; };
  const dot = (p: P, r: number) => { ctx.beginPath(); ctx.arc(p[0] * S, p[1] * S, r * k, 0, Math.PI * 2); ctx.fill(); };
  const line = (a: P, b: P) => { ctx.beginPath(); ctx.moveTo(a[0] * S, a[1] * S); ctx.lineTo(b[0] * S, b[1] * S); ctx.stroke(); };
  ctx.strokeStyle = color; ctx.fillStyle = color;

  function softFill(ps: P[], pad: number) { const c = avg(ps); const w = Math.max(...ps.map((p) => Math.abs(p[0] - c[0]))) + pad, h = Math.max(...ps.map((p) => Math.abs(p[1] - c[1]))) + pad; ctx.beginPath(); ctx.ellipse(c[0] * S, c[1] * S, w * S, h * S, 0, 0, Math.PI * 2); ctx.fill(); }
  const glow = (r: Region) => {
    if (!r || r === "skin") return;
    ctx.save(); ctx.setLineDash([]); ctx.globalAlpha = 0.16; ctx.fillStyle = color;
    if (r === "brows") { softFill(L.browR, 0.02); softFill(L.browL, 0.02); }
    if (r === "eyes") { softFill(L.eyeR, 0.018); softFill(L.eyeL, 0.018); }
    if (r === "lips") { curve(ctx, L.lipOuter, S, true); ctx.fill(); }
    if (r === "cheeks") { for (const c of [CHEEK.R, CHEEK.L]) { ctx.beginPath(); ctx.ellipse(c[0] * S, c[1] * S, 0.07 * S, 0.046 * S, 0, 0, Math.PI * 2); ctx.fill(); } }
    if (r === "nose") { ctx.globalAlpha = 0.7; ctx.strokeStyle = color; ctx.lineWidth = 2 * k; ctx.setLineDash([3 * k, 7 * k]); ctx.lineDashOffset = -t * 26 * k; ctx.beginPath(); ctx.moveTo(0.5 * S, 0.12 * S); ctx.lineTo(0.5 * S, 0.74 * S); ctx.stroke(); ctx.setLineDash([]); for (const p of [...L.noseBridge, L.noseBase[2], L.lipOuter[3], L.jaw[8]]) dot(p, 3.5); }
    ctx.restore();
  };
  glow(hover && hover !== region ? hover : null);

  if (region === "skin") {
    // mapping the face: the landmarks join up while a scan passes down the face
    const scan = 0.16 + ((t * 0.22) % 1) * 0.62;
    ctx.save(); ctx.globalAlpha = 0.55; lw(1.4); dash(2, 6);
    for (const g of [L.jaw, L.browR, L.browL, L.noseBridge, L.noseBase]) { curve(ctx, g, S); ctx.stroke(); }
    curve(ctx, L.eyeR, S, true); ctx.stroke(); curve(ctx, L.eyeL, S, true); ctx.stroke(); curve(ctx, L.lipOuter, S, true); ctx.stroke();
    ctx.restore(); ctx.setLineDash([]);
    U.forEach((p) => { const near = Math.max(0, 1 - Math.abs(p[1] - scan) / 0.05); ctx.globalAlpha = 0.5 + 0.5 * near; dot(p, 2.2 + 2.6 * near); });
    ctx.globalAlpha = 0.5; lw(2); line([0.18, scan], [0.82, scan]); ctx.globalAlpha = 1;
  }
  if (region === "brows") {
    lw(2.2); dash(9, 8);
    for (const side of ["R", "L"] as const) {
      const nose = side === "R" ? L.noseBase[0] : L.noseBase[4];
      const b = side === "R" ? L.browR : L.browL;
      const start = side === "R" ? b[4] : b[0], arch = b[2], tail = side === "R" ? b[0] : b[4];
      line(nose, [start[0], start[1] - 0.012]);
      line(nose, [nose[0] + (arch[0] - nose[0]) * 1.06, nose[1] + (arch[1] - nose[1]) * 1.06]);
      line(nose, [nose[0] + (tail[0] - nose[0]) * 1.05, nose[1] + (tail[1] - nose[1]) * 1.05]);
      ctx.setLineDash([]); for (const p of [start, arch, tail]) dot(p, 5); dash(9, 8);
    }
    lw(2.6); ctx.setLineDash([]); ctx.globalAlpha = 0.8; curve(ctx, L.browR, S); ctx.stroke(); curve(ctx, L.browL, S); ctx.stroke(); ctx.globalAlpha = 1;
  }
  if (region === "eyes") {
    lw(2.6); dash(10, 7);
    const upR: P[] = [L.eyeR[3], L.eyeR[2], L.eyeR[1], L.eyeR[0]].map(([x, y]) => [x, y - 0.005] as P);
    const upL: P[] = [L.eyeL[0], L.eyeL[1], L.eyeL[2], L.eyeL[3]].map(([x, y]) => [x, y - 0.005] as P);
    curve(ctx, upR, S); ctx.stroke(); curve(ctx, upL, S); ctx.stroke();
    lw(2); dash(5, 7);
    const wR: P = [L.eyeR[0][0] - 0.045, L.eyeR[0][1] - 0.026], wL: P = [L.eyeL[3][0] + 0.045, L.eyeL[3][1] - 0.026];
    line(L.eyeR[0], wR); line(L.eyeL[3], wL);
    ctx.setLineDash([]); dot(wR, 4.5); dot(wL, 4.5);
  }
  if (region === "cheeks") {
    lw(2.4); dash(3, 8);
    for (const [c, s] of [[CHEEK.R, -1], [CHEEK.L, 1]] as [P, number][]) {
      ctx.beginPath(); ctx.ellipse(c[0] * S, c[1] * S, 0.068 * S, 0.044 * S, s * 0.35, 0, Math.PI * 2); ctx.stroke();
      ctx.setLineDash([]); lw(2); line([c[0] + s * 0.04, c[1] - 0.02], [c[0] + s * 0.095, c[1] - 0.085]); dot([c[0] + s * 0.095, c[1] - 0.085], 4.5); lw(2.4); dash(3, 8);
    }
  }
  if (region === "lips") {
    lw(2.6); dash(10, 7); curve(ctx, L.lipOuter, S, true); ctx.stroke();
    ctx.setLineDash([]); for (const i of [0, 3, 6, 9]) dot(L.lipOuter[i], 4.5);
  }
  ctx.setLineDash([]); ctx.globalAlpha = 1;
}

/** Lash strands for ICT's lash cards. The cards sample six bands of one texture (three per lid, upper
    then lower), with the root along the top of each band, the outer corners at the left and right edges
    and the inner corners meeting in the middle. Drawn white on black: used as an alpha map. */
export function paintLashes(ctx: CanvasRenderingContext2D) {
  const W = ctx.canvas.width, H = ctx.canvas.height;
  ctx.fillStyle = "#000"; ctx.fillRect(0, 0, W, H);
  ctx.strokeStyle = "#fff"; ctx.lineCap = "round";
  const bands: [number, number, boolean][] = [[0.012, 0.152, true], [0.178, 0.318, true], [0.344, 0.484, true], [0.514, 0.654, false], [0.68, 0.82, false], [0.846, 0.986, false]];
  let seed = 7; const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
  bands.forEach(([v0, v1, upper], bi) => {
    const n = upper ? 46 : 20;
    for (const side of [0, 1]) {
      for (let i = 0; i < n; i++) {
        const t = (i + 0.2 + rnd() * 0.6) / n; // 0 inner corner .. 1 outer corner
        const u = side === 0 ? 0.49 - t * 0.47 : 0.51 + t * 0.47; // canvas x of the root
        const outward = side === 0 ? -1 : 1;
        const ends = Math.min(1, t / 0.08, (1 - t) / 0.05);
        const len = (upper ? 0.62 + 0.36 * Math.min(1, t / 0.75) : 0.32 + 0.22 * t) * (0.82 + rnd() * 0.18) * Math.max(0.25, ends) * (1 - bi % 3 * 0.08);
        const x0 = u * W, y0 = (v0 + 0.006) * H, y1 = y0 + (v1 - v0 - 0.01) * H * len;
        const lean = outward * (0.004 + 0.018 * t) * W * len;
        const segs = 6;
        for (let s = 0; s < segs; s++) {
          const a = s / segs, b = (s + 1) / segs;
          const px = (q: number) => x0 + lean * q * q, py = (q: number) => y0 + (y1 - y0) * q;
          ctx.globalAlpha = 0.95 - a * 0.55; ctx.lineWidth = Math.max(0.6, (upper ? 2.1 : 1.5) * (1 - a * 0.8)) * (W / 512);
          ctx.beginPath(); ctx.moveTo(px(a), py(a)); ctx.lineTo(px(b), py(b)); ctx.stroke();
        }
      }
    }
  });
  ctx.globalAlpha = 1;
}

/** A region for a point on the face (UV, y down), for hover tips. */
export function regionAt(u: number, v: number): Region {
  if (u < 0 || u > 1 || v < 0 || v > 1) return null;
  const near = (c: P, rx: number, ry: number) => ((u - c[0]) / rx) ** 2 + ((v - c[1]) / ry) ** 2 < 1;
  if (near(avg(L.browR), 0.12, 0.04) || near(avg(L.browL), 0.12, 0.04)) return "brows";
  if (near(EYE_CENTRE.R, 0.08, 0.035) || near(EYE_CENTRE.L, 0.08, 0.035)) return "eyes";
  if (near(avg(L.lipOuter), 0.13, 0.08)) return "lips";
  if (near(CHEEK.R, 0.09, 0.07) || near(CHEEK.L, 0.09, 0.07)) return "cheeks";
  if (near([0.5, 0.37], 0.06, 0.12)) return "nose";
  return "skin";
}

/** A procedural eye: warm white, a ringed iris, a dark pupil, at the centre of the eyeball's UVs. */
export function paintEye(ctx: CanvasRenderingContext2D, iris = "#5a3a22") {
  const S = 512; const c = S / 2;
  ctx.fillStyle = "#f3eee8"; ctx.fillRect(0, 0, S, S);
  const r = 0.104 * S, p = 0.036 * S;
  const g = ctx.createRadialGradient(c, c, p, c, c, r);
  g.addColorStop(0, shade(iris, 0.7)); g.addColorStop(0.55, iris); g.addColorStop(0.92, shade(iris, 0.75)); g.addColorStop(1, "#141010");
  ctx.fillStyle = g; ctx.beginPath(); ctx.arc(c, c, r, 0, Math.PI * 2); ctx.fill();
  ctx.strokeStyle = hexA("#ffffff", 0.12); ctx.lineWidth = 1;
  for (let i = 0; i < 48; i++) { const a = (i / 48) * Math.PI * 2; ctx.beginPath(); ctx.moveTo(c + Math.cos(a) * p * 1.3, c + Math.sin(a) * p * 1.3); ctx.lineTo(c + Math.cos(a) * r * 0.9, c + Math.sin(a) * r * 0.9); ctx.stroke(); }
  ctx.fillStyle = "#070505"; ctx.beginPath(); ctx.arc(c, c, p, 0, Math.PI * 2); ctx.fill();
}
