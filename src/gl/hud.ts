/* The heads-up display drawn on the hero mirror's glass, one canvas per
   product. Drawn once (after fonts load) and used as textures; the glass
   shader adds the animated parts (scan line, pulse, reveal). */

export const HUD_W = 1024;
export const HUD_H = 1450;

type C = CanvasRenderingContext2D;
const F = {
  display: (w: number, s: number) => `${w} ${s}px "Outfit Variable", system-ui, sans-serif`,
  body: (w: number, s: number) => `${w} ${s}px "Plus Jakarta Sans Variable", system-ui, sans-serif`,
  mono: (w: number, s: number) => `${w} ${s}px "Geist Mono", ui-monospace, monospace`,
};

export async function loadHudFonts() {
  try {
    await Promise.all([
      document.fonts.load(F.display(300, 40)), document.fonts.load(F.display(600, 40)),
      document.fonts.load(F.body(500, 20)), document.fonts.load(F.mono(400, 20)), document.fonts.load(F.mono(500, 20)),
    ]);
  } catch { /* fonts are a nicety for the texture */ }
}

function rr(ctx: C, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath(); ctx.roundRect(x, y, w, h, r);
}
function glow(ctx: C, color: string, blur: number) { ctx.shadowColor = color; ctx.shadowBlur = blur; }
function noGlow(ctx: C) { ctx.shadowBlur = 0; ctx.shadowColor = "transparent"; }
function text(ctx: C, s: string, x: number, y: number, font: string, color: string, align: CanvasTextAlign = "left", spacing = 0) {
  ctx.font = font; ctx.fillStyle = color; ctx.textAlign = align; ctx.textBaseline = "alphabetic";
  (ctx as C & { letterSpacing?: string }).letterSpacing = `${spacing}px`;
  ctx.fillText(s, x, y);
  (ctx as C & { letterSpacing?: string }).letterSpacing = "0px";
}
function statusBar(ctx: C, left: string, right: string, accent: string) {
  text(ctx, "selika", 70, 96, F.display(500, 38), "rgba(255,255,255,0.86)");
  text(ctx, left, 196, 95, F.mono(500, 19), accent, "left", 3);
  text(ctx, right, HUD_W - 70, 95, F.mono(400, 19), "rgba(255,255,255,0.62)", "right", 2);
  ctx.fillStyle = "rgba(255,255,255,0.12)"; ctx.fillRect(70, 122, HUD_W - 140, 1.5);
}

/* ---------------- Selika Beauty: guidance drawn over a reflection ---------------- */
export function drawBeautyHud(ctx: C) {
  const A = "#B9A9FF", A2 = "#D9B8FF", W = "rgba(255,255,255,0.82)";
  ctx.clearRect(0, 0, HUD_W, HUD_H);
  statusBar(ctx, "BEAUTY", "5000K · CRI 95+", A2);

  const cx = HUD_W / 2, cy = 655;
  // the face, as the mirror sees it: a soft oval with a symmetry line
  ctx.lineWidth = 2; ctx.strokeStyle = "rgba(255,255,255,0.22)"; ctx.setLineDash([6, 12]);
  ctx.beginPath(); ctx.ellipse(cx, cy, 245, 330, 0, 0, Math.PI * 2); ctx.stroke();
  ctx.setLineDash([2, 14]); ctx.beginPath(); ctx.moveTo(cx, cy - 300); ctx.lineTo(cx, cy + 310); ctx.stroke();
  ctx.setLineDash([]);

  // brows: start, arch, tail
  const brow = (s: number) => {
    const sx = cx + s * 52, ax = cx + s * 132, tx = cx + s * 196;
    glow(ctx, A, 18); ctx.strokeStyle = A; ctx.lineWidth = 4.5; ctx.lineCap = "round";
    ctx.beginPath(); ctx.moveTo(sx, cy - 98); ctx.quadraticCurveTo(ax, cy - 150, tx, cy - 112); ctx.stroke(); noGlow(ctx);
    for (const [x, y] of [[sx, cy - 98], [ax - s * 8, cy - 132], [tx, cy - 112]]) { ctx.fillStyle = "#fff"; ctx.beginPath(); ctx.arc(x, y, 6, 0, Math.PI * 2); ctx.fill(); }
  };
  brow(-1); brow(1);

  // eyes and the liner wing
  const eye = (s: number) => {
    const ex = cx + s * 122, ey = cy - 40;
    ctx.strokeStyle = "rgba(255,255,255,0.55)"; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(ex - 62, ey); ctx.quadraticCurveTo(ex, ey - 38, ex + 62, ey); ctx.quadraticCurveTo(ex, ey + 28, ex - 62, ey); ctx.stroke();
    ctx.beginPath(); ctx.arc(ex, ey - 4, 15, 0, Math.PI * 2); ctx.stroke();
    // liner: along the upper lid, then flicked out along the guide
    glow(ctx, A2, 22); ctx.strokeStyle = A2; ctx.lineWidth = 5;
    const o = s * 62;
    ctx.beginPath(); ctx.moveTo(ex - o * 0.85, ey - 6); ctx.quadraticCurveTo(ex, ey - 40, ex + o, ey - 2); ctx.lineTo(ex + o + s * 44, ey - 26); ctx.stroke(); noGlow(ctx);
    ctx.setLineDash([3, 9]); ctx.strokeStyle = "rgba(255,255,255,0.5)"; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(ex + o + s * 44, ey - 26); ctx.lineTo(ex + o + s * 108, ey - 62); ctx.stroke(); ctx.setLineDash([]);
  };
  eye(-1); eye(1);

  // nose, quietly
  ctx.strokeStyle = "rgba(255,255,255,0.25)"; ctx.lineWidth = 2;
  ctx.beginPath(); ctx.moveTo(cx - 26, cy + 92); ctx.quadraticCurveTo(cx, cy + 108, cx + 26, cy + 92); ctx.stroke();

  // blush zones
  for (const s of [-1, 1]) {
    const bx = cx + s * 150, by = cy + 96;
    ctx.fillStyle = "rgba(190,160,255,0.10)"; ctx.beginPath(); ctx.ellipse(bx, by, 74, 50, s * -0.35, 0, Math.PI * 2); ctx.fill();
    ctx.setLineDash([2, 10]); ctx.strokeStyle = "rgba(220,200,255,0.7)"; ctx.lineWidth = 2.5; ctx.stroke(); ctx.setLineDash([]);
  }

  // lips: the line to follow
  const ly = cy + 190;
  glow(ctx, A, 16); ctx.strokeStyle = A; ctx.lineWidth = 4; ctx.setLineDash([14, 10]);
  ctx.beginPath(); ctx.moveTo(cx - 92, ly); ctx.quadraticCurveTo(cx - 52, ly - 34, cx - 14, ly - 26); ctx.quadraticCurveTo(cx, ly - 16, cx + 14, ly - 26);
  ctx.quadraticCurveTo(cx + 52, ly - 34, cx + 92, ly); ctx.quadraticCurveTo(cx, ly + 54, cx - 92, ly); ctx.stroke(); ctx.setLineDash([]); noGlow(ctx);

  // a callout from the wing
  const wx = cx + 122 + 62 + 108, wy = cy - 40 - 62;
  ctx.strokeStyle = "rgba(255,255,255,0.45)"; ctx.lineWidth = 1.5;
  ctx.beginPath(); ctx.moveTo(wx, wy); ctx.lineTo(wx + 34, wy - 46); ctx.lineTo(wx + 70, wy - 46); ctx.stroke();
  text(ctx, "WING", wx - 30, wy - 92, F.mono(500, 18), A2, "left", 3);
  text(ctx, "15° up, to the brow tail", wx - 30, wy - 64, F.body(500, 21), W, "left");

  // the step card
  const y0 = 1130;
  rr(ctx, 70, y0, HUD_W - 140, 250, 34); ctx.fillStyle = "rgba(255,255,255,0.05)"; ctx.fill(); ctx.strokeStyle = "rgba(255,255,255,0.16)"; ctx.lineWidth = 2; ctx.stroke();
  text(ctx, "STEP 3 OF 5 · EYES", 118, y0 + 66, F.mono(500, 21), A2, "left", 3);
  text(ctx, "Flick the liner out", 116, y0 + 134, F.display(500, 56), "#fff");
  text(ctx, "Follow the line from the outer corner.", 118, y0 + 184, F.body(500, 27), "rgba(255,255,255,0.62)");
  for (let i = 0; i < 5; i++) { rr(ctx, 118 + i * 82, y0 + 210, 70, 8, 4); ctx.fillStyle = i < 3 ? A2 : "rgba(255,255,255,0.18)"; ctx.fill(); }
  // listening
  const mx = HUD_W - 150, my = y0 + 80;
  for (let i = 0; i < 7; i++) { const h = [14, 30, 52, 38, 58, 26, 16][i]; rr(ctx, mx + i * 11 - 36, my - h / 2, 6, h, 3); ctx.fillStyle = A2; ctx.fill(); }
  text(ctx, "LISTENING", mx + 2, my + 62, F.mono(500, 16), "rgba(255,255,255,0.6)", "center", 3);
}

/* ---------------- Selika Dev: modules on the glass ---------------- */
export function drawDevHud(ctx: C) {
  const A = "#7FB2FF", A2 = "#A9D3FF", W = "rgba(255,255,255,0.86)", M = "rgba(255,255,255,0.56)";
  ctx.clearRect(0, 0, HUD_W, HUD_H);
  statusBar(ctx, "DEV", "4 MODULES · LOCAL", A2);
  const tile = (x: number, y: number, w: number, h: number) => { rr(ctx, x, y, w, h, 30); ctx.fillStyle = "rgba(255,255,255,0.045)"; ctx.fill(); ctx.strokeStyle = "rgba(255,255,255,0.15)"; ctx.lineWidth = 2; ctx.stroke(); };
  const label = (s: string, x: number, y: number) => text(ctx, s, x, y, F.mono(500, 17), A2, "left", 3);

  // clock
  text(ctx, "07:42", 64, 300, F.display(300, 168), "#fff", "left", -4);
  text(ctx, "TUESDAY 6 OCTOBER", 72, 352, F.mono(400, 19), M, "left", 3);
  // weather
  tile(640, 176, 314, 196); label("WEATHER", 676, 222);
  text(ctx, "12°", 674, 318, F.display(400, 84), "#fff"); text(ctx, "Light rain", 806, 290, F.body(500, 24), W); text(ctx, "London", 806, 322, F.body(500, 22), M);

  // calendar
  tile(64, 410, 470, 290); label("CALENDAR", 100, 458);
  [["09:00", "Stand-up"], ["13:30", "Design review"], ["18:00", "Gym"]].forEach(([t, s], i) => {
    const y = 520 + i * 62; ctx.fillStyle = i === 0 ? A2 : "rgba(255,255,255,0.3)"; ctx.beginPath(); ctx.arc(108, y - 8, 7, 0, Math.PI * 2); ctx.fill();
    text(ctx, t, 132, y, F.mono(500, 23), i === 0 ? "#fff" : M); text(ctx, s, 236, y, F.body(500, 26), i === 0 ? "#fff" : W);
  });
  // build status
  tile(560, 410, 394, 290); label("BUILD · MAIN", 596, 458);
  glow(ctx, A, 16); ctx.fillStyle = A2; ctx.beginPath(); ctx.arc(612, 534, 11, 0, Math.PI * 2); ctx.fill(); noGlow(ctx);
  text(ctx, "Passing", 636, 545, F.display(500, 44), "#fff");
  text(ctx, "#482 · 2 min ago", 598, 600, F.mono(400, 21), M);
  for (let i = 0; i < 14; i++) { const h = 14 + ((i * 37) % 30); rr(ctx, 598 + i * 22, 668 - h, 12, h, 4); ctx.fillStyle = i === 13 ? A2 : "rgba(255,255,255,0.22)"; ctx.fill(); }

  // agent brief
  tile(64, 726, 890, 196); label("AGENT · MORNING BRIEF", 100, 774);
  for (let i = 0; i < 18; i++) { const a = (i / 18) * Math.PI * 2; ctx.fillStyle = `rgba(169,211,255,${0.35 + 0.65 * ((i % 6) / 6)})`; ctx.beginPath(); ctx.arc(150 + Math.cos(a) * 34, 852 + Math.sin(a) * 34, 4.5, 0, Math.PI * 2); ctx.fill(); }
  text(ctx, "Your brief is ready", 222, 846, F.display(500, 40), "#fff");
  text(ctx, "3 items · say “read it”", 224, 890, F.body(500, 24), M);

  // a module, in code
  tile(64, 948, 890, 312);
  label("MODULE · BRIEF.TS", 100, 996);
  const lines: [string, string][][] = [
    [["export default ", A], ["module", "#fff"], ["({", M]],
    [["  name: ", M], ['"brief"', "#D3B8FF"], [",", M]],
    [["  permissions: ", M], ["[", M], ['"calendar"', "#D3B8FF"], ["],", M]],
    [["  voice: ", M], ['"read it"', "#D3B8FF"], [",", M]],
    [["  render: ", M], ["(ctx) => ctx.", W], ["agent", A2], ['("brief")', "#D3B8FF"]],
    [["})", M]],
  ];
  lines.forEach((parts, i) => { let x = 102; for (const [s, c] of parts) { ctx.font = F.mono(400, 25); ctx.fillStyle = c; ctx.fillText(s, x, 1048 + i * 36); x += ctx.measureText(s).width; } });

  // permissions
  [["CAMERA", "OFF"], ["MIC", "ON"], ["CALENDAR", "ON"]].forEach(([k, v], i) => {
    const x = 64 + i * 300; rr(ctx, x, 1290, 280, 66, 33); ctx.strokeStyle = "rgba(255,255,255,0.18)"; ctx.lineWidth = 2; ctx.stroke();
    ctx.fillStyle = v === "ON" ? A2 : "rgba(255,255,255,0.3)"; ctx.beginPath(); ctx.arc(x + 34, 1323, 7, 0, Math.PI * 2); ctx.fill();
    text(ctx, `${k} · ${v}`, x + 56, 1331, F.mono(500, 20), v === "ON" ? "#fff" : M, "left", 2);
  });
}
