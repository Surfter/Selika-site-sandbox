/* What is drawn flat on the hero mirror's glass, one canvas per product: a status line,
   corner brackets and the step card for Selika Beauty; a status line and permission chips
   for Selika Dev. The face (Beauty) and the modules (Dev) are 3D, in front of the glass
   (see HeroScene). Drawn once after the fonts load and used as textures. */
import { MIRROR } from "./heroBridge";

export const HUD_W = 1024;
export const HUD_H = Math.round(HUD_W * (MIRROR.h - MIRROR.bezel * 2) / (MIRROR.w - MIRROR.bezel * 2));

type C = CanvasRenderingContext2D;
const F = {
  display: (w: number, s: number) => `${w} ${s}px "Outfit Variable", system-ui, sans-serif`,
  body: (w: number, s: number) => `${w} ${s}px "Plus Jakarta Sans Variable", system-ui, sans-serif`,
  mono: (w: number, s: number) => `${w} ${s}px "Geist Mono", ui-monospace, monospace`,
  // small capitals and numbers (times, steps, counts): the display face, not the mono one
  caps: (w: number, s: number) => `${w} ${s}px "Outfit Variable", system-ui, sans-serif`,
};

export async function loadHudFonts() {
  try {
    await Promise.all([
      document.fonts.load(F.display(300, 40)), document.fonts.load(F.display(500, 40)),
      document.fonts.load(F.body(500, 20)), document.fonts.load(F.display(400, 20)), document.fonts.load(F.mono(400, 20)),
    ]);
  } catch { /* fonts are a nicety for the texture */ }
}

function rr(ctx: C, x: number, y: number, w: number, h: number, r: number) { ctx.beginPath(); ctx.roundRect(x, y, w, h, r); }
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
  text(ctx, left, 196, 95, F.caps(500, 19), accent, "left", 3);
  text(ctx, right, HUD_W - 70, 95, F.caps(400, 19), "rgba(255,255,255,0.62)", "right", 2);
  ctx.fillStyle = "rgba(255,255,255,0.12)"; ctx.fillRect(70, 122, HUD_W - 140, 1.5);
}
function brackets(ctx: C, x0: number, y0: number, x1: number, y1: number, color: string) {
  const l = 46; ctx.strokeStyle = color; ctx.lineWidth = 3; ctx.lineCap = "round";
  for (const [x, y, sx, sy] of [[x0, y0, 1, 1], [x1, y0, -1, 1], [x0, y1, 1, -1], [x1, y1, -1, -1]] as const) {
    ctx.beginPath(); ctx.moveTo(x, y + sy * l); ctx.lineTo(x, y); ctx.lineTo(x + sx * l, y); ctx.stroke();
  }
}

/* ---------------- Selika Beauty ---------------- */
export function drawBeautyHud(ctx: C) {
  const A2 = "#D9B8FF";
  ctx.clearRect(0, 0, HUD_W, HUD_H);
  statusBar(ctx, "BEAUTY", "5000K · CRI 95+", A2);
  // the area the mirror maps, framed like a viewfinder
  brackets(ctx, 120, 210, HUD_W - 120, HUD_H - 470, "rgba(217,184,255,0.55)");
  text(ctx, "FACE MAPPED", 150, 262, F.caps(500, 17), "rgba(217,184,255,0.8)", "left", 3);
  text(ctx, "LIVE", HUD_W - 150, 262, F.caps(500, 17), "rgba(255,255,255,0.55)", "right", 3);
  // the step card
  const y0 = HUD_H - 340;
  rr(ctx, 70, y0, HUD_W - 140, 250, 34); ctx.fillStyle = "rgba(255,255,255,0.05)"; ctx.fill(); ctx.strokeStyle = "rgba(255,255,255,0.16)"; ctx.lineWidth = 2; ctx.stroke();
  text(ctx, "STEP 3 OF 5 · EYES", 118, y0 + 66, F.caps(500, 21), A2, "left", 3);
  text(ctx, "Flick the liner out", 116, y0 + 134, F.display(500, 56), "#fff");
  text(ctx, "Follow the line from the outer corner.", 118, y0 + 184, F.body(500, 27), "rgba(255,255,255,0.62)");
  for (let i = 0; i < 5; i++) { rr(ctx, 118 + i * 82, y0 + 210, 70, 8, 4); ctx.fillStyle = i < 3 ? A2 : "rgba(255,255,255,0.18)"; ctx.fill(); }
  const mx = HUD_W - 150, my = y0 + 80;
  for (let i = 0; i < 7; i++) { const h = [14, 30, 52, 38, 58, 26, 16][i]; rr(ctx, mx + i * 11 - 36, my - h / 2, 6, h, 3); ctx.fillStyle = A2; ctx.fill(); }
  text(ctx, "LISTENING", mx + 2, my + 62, F.caps(500, 16), "rgba(255,255,255,0.6)", "center", 3);
}

/* ---------------- Selika Dev ---------------- */
export function drawDevHud(ctx: C) {
  const A2 = "#A9D3FF", M = "rgba(255,255,255,0.56)";
  ctx.clearRect(0, 0, HUD_W, HUD_H);
  statusBar(ctx, "DEV", "5 MODULES · LOCAL", A2);
  [["CAMERA", "OFF"], ["MIC", "ON"], ["CALENDAR", "ON"]].forEach(([k, v], i) => {
    const x = 64 + i * 300, y = HUD_H - 150; rr(ctx, x, y, 280, 66, 33); ctx.strokeStyle = "rgba(255,255,255,0.18)"; ctx.lineWidth = 2; ctx.stroke();
    ctx.fillStyle = v === "ON" ? A2 : "rgba(255,255,255,0.3)"; ctx.beginPath(); ctx.arc(x + 34, y + 33, 7, 0, Math.PI * 2); ctx.fill();
    text(ctx, `${k} · ${v}`, x + 56, y + 41, F.caps(500, 20), v === "ON" ? "#fff" : M, "left", 2);
  });
}

/* ---------------- the Dev modules, each on its own pane ----------------
   Sizes are in mirror units; canvases are drawn at 900 px per unit. */
export type PaneSpec = { id: string; x: number; y: number; w: number; h: number; z: number };
export const DEV_PANES: PaneSpec[] = [
  { id: "clock", x: -0.16, y: 0.5, w: 0.54, h: 0.3, z: 0.035 },
  { id: "weather", x: 0.265, y: 0.52, w: 0.31, h: 0.22, z: 0.06 },
  { id: "calendar", x: -0.16, y: 0.13, w: 0.54, h: 0.34, z: 0.05 },
  { id: "build", x: 0.265, y: 0.13, w: 0.31, h: 0.34, z: 0.025 },
  { id: "code", x: 0, y: -0.33, w: 0.82, h: 0.44, z: 0.04 },
];
const PX = 900;
export function drawDevPane(id: string, w: number, h: number): HTMLCanvasElement {
  const A = "#7FB2FF", A2 = "#A9D3FF", W = "rgba(255,255,255,0.88)", M = "rgba(255,255,255,0.58)";
  const c = document.createElement("canvas"); c.width = Math.round(w * PX); c.height = Math.round(h * PX);
  const ctx = c.getContext("2d")!; const cw = c.width, ch = c.height;
  rr(ctx, 4, 4, cw - 8, ch - 8, 34); ctx.fillStyle = "rgba(160,200,255,0.06)"; ctx.fill();
  glow(ctx, "rgba(127,178,255,0.8)", 14); ctx.strokeStyle = "rgba(169,211,255,0.55)"; ctx.lineWidth = 3; ctx.stroke(); noGlow(ctx);
  const label = (s: string) => text(ctx, s, 36, 58, F.caps(500, 19), A2, "left", 3);
  if (id === "clock") {
    label("CLOCK");
    text(ctx, "07:42", 30, ch - 70, F.display(300, 150), "#fff", "left", -4);
    text(ctx, "TUESDAY 6 OCTOBER", 38, ch - 26, F.caps(400, 18), M, "left", 3);
  } else if (id === "weather") {
    label("WEATHER");
    text(ctx, "12°", 34, ch - 40, F.display(400, 88), "#fff");
    text(ctx, "Light rain", 160, ch - 74, F.body(500, 24), W); text(ctx, "London", 160, ch - 42, F.body(500, 22), M);
  } else if (id === "calendar") {
    label("CALENDAR");
    [["09:00", "Stand-up"], ["13:30", "Design review"], ["18:00", "Gym"]].forEach(([t, s], i) => {
      const y = 128 + i * 60; ctx.fillStyle = i === 0 ? A2 : "rgba(255,255,255,0.3)"; ctx.beginPath(); ctx.arc(46, y - 8, 7, 0, Math.PI * 2); ctx.fill();
      text(ctx, t, 70, y, F.caps(500, 23), i === 0 ? "#fff" : M); text(ctx, s, 170, y, F.body(500, 26), i === 0 ? "#fff" : W);
    });
  } else if (id === "build") {
    label("BUILD · MAIN");
    glow(ctx, A, 16); ctx.fillStyle = A2; ctx.beginPath(); ctx.arc(52, 126, 11, 0, Math.PI * 2); ctx.fill(); noGlow(ctx);
    text(ctx, "Passing", 76, 138, F.display(500, 44), "#fff");
    text(ctx, "#482 · 2 min ago", 38, 190, F.caps(400, 20), M);
    for (let i = 0; i < 11; i++) { const hh = 14 + ((i * 37) % 30); rr(ctx, 38 + i * 22, ch - 34 - hh, 12, hh, 4); ctx.fillStyle = i === 10 ? A2 : "rgba(255,255,255,0.22)"; ctx.fill(); }
  } else {
    label("MODULE · BRIEF.TS");
    const lines: [string, string][][] = [
      [["export default ", A], ["module", "#fff"], ["({", M]],
      [["  name: ", M], ['"brief"', "#D3B8FF"], [",", M]],
      [["  permissions: ", M], ["[", M], ['"calendar"', "#D3B8FF"], ["],", M]],
      [["  voice: ", M], ['"read it"', "#D3B8FF"], [",", M]],
      [["  render: ", M], ["(ctx) => ctx.", W], ["agent", A2], ['("brief")', "#D3B8FF"]],
      [["})", M]],
    ];
    lines.forEach((parts, i) => { let x = 38; for (const [s, col] of parts) { ctx.font = F.mono(400, 25); ctx.fillStyle = col; ctx.fillText(s, x, 116 + i * 40); x += ctx.measureText(s).width; } });
  }
  return c;
}
