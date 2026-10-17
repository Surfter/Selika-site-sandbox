/* Makeup and guidance for the photographic demo face, drawn on 2D canvases in the
   photo's own frame (x right, y down, 0..1) from its face-mesh landmarks. The shader
   reads the makeup canvas as a tint (rgb) and an amount (alpha), so colour lands on
   the skin's own texture; the guide canvas glows on top (r: lines, g: soft zones). */
import { LOOKS, type LookId, type Region } from "./state";

export type P = [number, number];
export type FaceMarks = {
  lipsOuter: P[]; lipsInner: P[]; eyeR: P[]; eyeL: P[]; browR: P[]; browRLow: P[]; browL: P[]; browLLow: P[];
  irisR: P[]; irisL: P[]; cheekR: P[]; cheekL: P[]; noseBridge: P[]; noseBase: P[]; oval: P[];
  lidR: P[]; lidL: P[]; creaseR: P[]; creaseL: P[]; all: P[];
};

const avg = (ps: P[]): P => [ps.reduce((s, p) => s + p[0], 0) / ps.length, ps.reduce((s, p) => s + p[1], 0) / ps.length];
const lerp = (a: P, b: P, t: number): P => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t];

function path(ctx: CanvasRenderingContext2D, ps: P[], W: number, H: number, closed = false) {
  ctx.beginPath();
  const q = ps.map(([x, y]) => [x * W, y * H] as P);
  if (closed) {
    const m0 = lerp(q[q.length - 1], q[0], 0.5); ctx.moveTo(m0[0], m0[1]);
    for (let i = 0; i < q.length; i++) { const n = q[(i + 1) % q.length]; const m = lerp(q[i], n, 0.5); ctx.quadraticCurveTo(q[i][0], q[i][1], m[0], m[1]); }
    ctx.closePath();
  } else {
    ctx.moveTo(q[0][0], q[0][1]);
    for (let i = 1; i < q.length - 1; i++) { const m = lerp(q[i], q[i + 1], 0.5); ctx.quadraticCurveTo(q[i][0], q[i][1], m[0], m[1]); }
    ctx.lineTo(q[q.length - 1][0], q[q.length - 1][1]);
  }
}

/** The outer corner of an eye and where its wing should point (toward the brow's tail). */
function wing(lid: P[], brow: P[]) {
  const outer = lid[0], tail = brow[0];
  const dir: P = [tail[0] - outer[0], tail[1] - outer[1]];
  const len = Math.hypot(dir[0], dir[1]) || 1;
  return { outer, dir: [dir[0] / len, dir[1] / len] as P };
}

/** The makeup applied so far: brows, then shadow and liner, then blush, then lips. */
export function paintMakeup(ctx: CanvasRenderingContext2D, f: FaceMarks, look: LookId, upTo: number) {
  const W = ctx.canvas.width, H = ctx.canvas.height, k = W / 1024;
  const L = LOOKS.find((l) => l.id === look)!;
  ctx.clearRect(0, 0, W, H);
  ctx.save();
  const soft = (px: number) => { ctx.filter = px > 0 ? `blur(${px * k}px)` : "none"; };
  if (upTo >= 1) {
    // brows: filled and defined along their own shape
    soft(2.2); ctx.globalAlpha = 0.42 * L.brow + 0.18; ctx.fillStyle = "#3a2418";
    for (const [up, low] of [[f.browR, f.browRLow], [f.browL, f.browLLow]] as [P[], P[]][]) { path(ctx, [...up, ...low.slice().reverse()], W, H, true); ctx.fill(); }
  }
  if (upTo >= 2) {
    // shadow on the lid, under the crease
    soft(9); ctx.globalAlpha = L.shadowA * 0.9; ctx.fillStyle = L.shadow;
    for (const [lid, crease] of [[f.lidR, f.creaseR], [f.lidL, f.creaseL]] as [P[], P[]][]) { path(ctx, [...lid, ...crease.slice().reverse()], W, H, true); ctx.fill(); }
    // liner along the upper lash line, flicked out toward the brow tail
    soft(0.9); ctx.globalAlpha = 0.82; ctx.strokeStyle = "#140d0d"; ctx.lineCap = "round"; ctx.lineJoin = "round"; ctx.lineWidth = (1.6 + L.liner * 3.0) * k;
    for (const [lid, brow] of [[f.lidR, f.browR], [f.lidL, f.browL]] as [P[], P[]][]) {
      const w = wing(lid, brow); const tip: P = [w.outer[0] + w.dir[0] * 0.024 * L.wing, w.outer[1] + w.dir[1] * 0.024 * L.wing];
      const line = lid.map(([x, y]) => [x, y - 0.002] as P).reverse(); // inner to outer
      path(ctx, [...line, ...(L.wing > 0.05 ? [tip] : [])], W, H); ctx.stroke();
    }
  }
  if (upTo >= 3) {
    // blush on the cheekbone, swept up toward the temple
    soft(26); ctx.globalAlpha = L.blushA * 0.95; ctx.fillStyle = L.blush;
    for (const [ch, s] of [[f.cheekR, -1], [f.cheekL, 1]] as [P[], number][]) {
      const c = avg(ch); ctx.save(); ctx.translate(c[0] * W, (c[1] - 0.012) * H); ctx.rotate(s * -0.35);
      ctx.beginPath(); ctx.ellipse(0, 0, 0.075 * W, 0.042 * H, 0, 0, Math.PI * 2); ctx.fill(); ctx.restore();
    }
  }
  if (upTo >= 4) {
    // lips: the colour inside the outline, leaving the mouth line
    soft(1.4); ctx.globalAlpha = L.lipA; ctx.fillStyle = L.lip;
    path(ctx, f.lipsOuter, W, H, true); ctx.fill();
    ctx.globalCompositeOperation = "destination-out"; ctx.globalAlpha = 0.85; soft(1.2);
    path(ctx, f.lipsInner, W, H, true); ctx.fill();
    ctx.globalCompositeOperation = "source-over";
  }
  ctx.restore();
}

/** The glowing guidance for a step (r channel: lines and dots, g channel: soft zones). */
export function paintGuides(ctx: CanvasRenderingContext2D, f: FaceMarks, region: Region, hover: Region) {
  const W = ctx.canvas.width, H = ctx.canvas.height, k = W / 1024;
  ctx.clearRect(0, 0, W, H); ctx.fillStyle = "#000"; ctx.fillRect(0, 0, W, H);
  ctx.lineCap = "round"; ctx.lineJoin = "round";
  const R = "rgb(255,0,0)", G = "rgb(0,255,0)";
  const lw = (w: number) => { ctx.lineWidth = w * k; };
  const dash = (on: number, off: number) => ctx.setLineDash([on * k, off * k]);
  const dot = (p: P, r: number) => { ctx.beginPath(); ctx.arc(p[0] * W, p[1] * H, r * k, 0, Math.PI * 2); ctx.fill(); };
  const line = (a: P, b: P) => { ctx.beginPath(); ctx.moveTo(a[0] * W, a[1] * H); ctx.lineTo(b[0] * W, b[1] * H); ctx.stroke(); };

  // a soft zone under whatever the cursor is on
  const zone = (r: Region) => {
    if (!r || r === "skin") return;
    ctx.save(); ctx.filter = `blur(${14 * k}px)`; ctx.fillStyle = G; ctx.globalAlpha = 0.55;
    if (r === "brows") for (const [u, l] of [[f.browR, f.browRLow], [f.browL, f.browLLow]] as [P[], P[]][]) { path(ctx, [...u, ...l.slice().reverse()], W, H, true); ctx.fill(); }
    if (r === "eyes") for (const e of [f.eyeR, f.eyeL]) { path(ctx, e, W, H, true); ctx.fill(); }
    if (r === "lips") { path(ctx, f.lipsOuter, W, H, true); ctx.fill(); }
    if (r === "cheeks") for (const ch of [f.cheekR, f.cheekL]) { const c = avg(ch); ctx.beginPath(); ctx.ellipse(c[0] * W, c[1] * H, 0.07 * W, 0.045 * H, 0, 0, Math.PI * 2); ctx.fill(); }
    if (r === "nose") { path(ctx, f.noseBridge, W, H); ctx.lineWidth = 18 * k; ctx.strokeStyle = G; ctx.stroke(); }
    ctx.restore();
  };
  zone(hover && hover !== region ? hover : null);

  ctx.strokeStyle = R; ctx.fillStyle = R;
  if (region === "skin") {
    // mapping: the face's landmarks as a light mesh of dots and its outline
    ctx.globalAlpha = 0.55; lw(1.3); dash(2, 7); path(ctx, f.oval, W, H, true); ctx.stroke();
    ctx.setLineDash([]); ctx.globalAlpha = 0.75;
    f.all.forEach((p) => dot(p, 1.6));
    ctx.globalAlpha = 1;
    for (const e of [f.eyeR, f.eyeL]) { lw(1.6); dash(3, 5); path(ctx, e, W, H, true); ctx.stroke(); }
    ctx.setLineDash([]); lw(1.6); dash(3, 5); path(ctx, f.lipsOuter, W, H, true); ctx.stroke(); ctx.setLineDash([]);
  }
  if (region === "brows") {
    lw(2.2); dash(9, 7);
    for (const [b, side] of [[f.browR, "R"], [f.browL, "L"]] as [P[], string][]) {
      const nose = side === "R" ? f.noseBase[0] : f.noseBase[f.noseBase.length - 1];
      const start = b[b.length - 1], arch = b[2], tail = b[0];
      const iris = side === "R" ? f.irisR[0] : f.irisL[0];
      line(nose, [start[0], start[1] - 0.012]);
      line(nose, lerp(nose, [nose[0] + (iris[0] - nose[0]) * 1.0, arch[1]], 1.06));
      line(nose, lerp(nose, tail, 1.05));
      ctx.setLineDash([]); for (const p of [start, arch, tail]) dot(p, 5); dash(9, 7);
    }
    ctx.setLineDash([]); lw(2.4); ctx.globalAlpha = 0.85; path(ctx, f.browR, W, H); ctx.stroke(); path(ctx, f.browL, W, H); ctx.stroke(); ctx.globalAlpha = 1;
  }
  if (region === "eyes") {
    lw(2.4); dash(8, 6);
    for (const [lid, brow] of [[f.lidR, f.browR], [f.lidL, f.browL]] as [P[], P[]][]) {
      path(ctx, lid.map(([x, y]) => [x, y - 0.006] as P), W, H); ctx.stroke();
      const w = wing(lid, brow); const tip: P = [w.outer[0] + w.dir[0] * 0.05, w.outer[1] + w.dir[1] * 0.05];
      ctx.setLineDash([4 * k, 6 * k]); line(w.outer, tip); ctx.setLineDash([]); dot(tip, 4.5); dash(8, 6);
    }
    ctx.setLineDash([]);
  }
  if (region === "cheeks") {
    lw(2.2); dash(3, 7);
    for (const [ch, s] of [[f.cheekR, -1], [f.cheekL, 1]] as [P[], number][]) {
      const c = avg(ch);
      ctx.beginPath(); ctx.ellipse(c[0] * W, (c[1] - 0.012) * H, 0.066 * W, 0.04 * H, s * -0.35, 0, Math.PI * 2); ctx.stroke();
      ctx.setLineDash([]); lw(1.8); const a: P = [c[0] - s * 0.05, c[1] - 0.03], b: P = [c[0] - s * 0.1, c[1] - 0.085]; line(a, b); dot(b, 4.5); lw(2.2); dash(3, 7);
    }
    ctx.setLineDash([]);
  }
  if (region === "lips") {
    lw(2.4); dash(8, 6); path(ctx, f.lipsOuter, W, H, true); ctx.stroke(); ctx.setLineDash([]);
    for (const i of [0, 5, 10, 15]) dot(f.lipsOuter[i], 4.5);
  }
  ctx.setLineDash([]); ctx.globalAlpha = 1;
}

/** Which feature a point on the photo (0..1, y down) is over, for the hover tips. */
function inside(ps: P[], u: number, v: number) {
  let c = false;
  for (let i = 0, j = ps.length - 1; i < ps.length; j = i++) {
    const [xi, yi] = ps[i], [xj, yj] = ps[j];
    if ((yi > v) !== (yj > v) && u < ((xj - xi) * (v - yi)) / (yj - yi) + xi) c = !c;
  }
  return c;
}
export function regionAt(f: FaceMarks, u: number, v: number): Region {
  const near = (c: P, rx: number, ry: number) => ((u - c[0]) / rx) ** 2 + ((v - c[1]) / ry) ** 2 < 1;
  if (!inside(f.oval, u, v)) return null;
  for (const [up, low] of [[f.browR, f.browRLow], [f.browL, f.browLLow]] as [P[], P[]][]) if (near(avg([...up, ...low]), 0.075, 0.03)) return "brows";
  for (const e of [f.eyeR, f.eyeL]) if (near(avg(e), 0.06, 0.03)) return "eyes";
  if (near(avg(f.lipsOuter), 0.075, 0.045)) return "lips";
  for (const ch of [f.cheekR, f.cheekL]) if (near(avg(ch), 0.07, 0.06)) return "cheeks";
  if (near(avg(f.noseBridge), 0.035, 0.09)) return "nose";
  return "skin";
}
