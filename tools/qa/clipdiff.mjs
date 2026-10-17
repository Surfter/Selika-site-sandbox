/* Checks that the hero headline's line masks clip nothing: renders the headline normally and with the masks'
   overflow made visible, for both products, and reports how many pixels differ (should be 0).
   Usage: node tools/qa/clipdiff.mjs [url]. Env: W, H, CHROME, WAIT (default 16000 so the entrance has settled). */
import { chromium } from "playwright";
const url = process.argv[2] || "http://127.0.0.1:5173/?tier=low";
const b = await chromium.launch({ executablePath: process.env.CHROME || undefined, args: ["--use-gl=angle", "--use-angle=swiftshader", "--enable-unsafe-swiftshader"] });
const page = await (await b.newContext({ viewport: { width: +(process.env.W || 1762), height: +(process.env.H || 1000) }, deviceScaleFactor: 2 })).newPage();
await page.goto(url, { waitUntil: "load" });
await page.waitForTimeout(+(process.env.WAIT || 16000));
for (const prod of ["beauty", "dev"]) {
  if (prod === "dev") { await page.locator('button:has-text("Selika Dev")').first().click(); await page.waitForTimeout(3500); }
  await page.addStyleTag({ content: "canvas{visibility:hidden!important} *,*::before,*::after{animation-play-state:paused!important;transition:none!important} body{background:#000!important}" });
  const r = await page.evaluate(() => { const r = document.querySelector("h1").getBoundingClientRect(); return { x: r.left, y: r.top, w: r.width, h: r.height }; });
  const clip = { x: Math.max(0, r.x - 40), y: Math.max(0, r.y - 30), width: r.w + 80, height: r.h + 60 };
  const a = await page.screenshot({ clip });
  const tag = await page.addStyleTag({ content: "h1 > span{overflow:visible!important}" });
  const c = await page.screenshot({ clip });
  await page.evaluate((el) => el.remove(), tag);
  console.log(prod, a.equals(c) ? "nothing clipped" : "the masks clip something: compare the two renders");
}
await b.close();
