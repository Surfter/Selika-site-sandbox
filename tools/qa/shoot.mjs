/* Screenshots of the running site in headless Chromium, for checking a change at a given size.
   Usage: node tools/qa/shoot.mjs [url] (defaults to the dev server)
   Env: W, H (viewport, default 1440x900), M=1 (phone: touch + isMobile), OUT (folder, default ./qa-shots),
        TARGETS (comma-separated section ids to scroll to, default "top,problem,demo,compare,inside,privacy,roadmap"),
        CHROME (path to a Chromium binary, optional), WAIT (ms after load, default 9000).
   Headless Chromium renders WebGL on SwiftShader at 1 to 5 fps: judge layout and stills here, timing on real devices.
   Add ?tier=low to the URL to force the light rendering tier. */
import { chromium } from "playwright";
import { mkdirSync } from "node:fs";
const url = process.argv[2] || "http://127.0.0.1:5173/?tier=low";
const W = +(process.env.W || 1440), H = +(process.env.H || 900), mobile = process.env.M === "1";
const OUT = process.env.OUT || "qa-shots"; mkdirSync(OUT, { recursive: true });
const targets = (process.env.TARGETS || "top,problem,demo,compare,inside,privacy,roadmap").split(",");
const b = await chromium.launch({ executablePath: process.env.CHROME || undefined, args: ["--use-gl=angle", "--use-angle=swiftshader", "--enable-unsafe-swiftshader", "--ignore-gpu-blocklist"] });
const page = await (await b.newContext({ viewport: { width: W, height: H }, isMobile: mobile, hasTouch: mobile })).newPage();
const errors = []; page.on("pageerror", (e) => errors.push(String(e)));
await page.goto(url, { waitUntil: "load" });
await page.waitForTimeout(+(process.env.WAIT || 9000));
for (const t of targets) {
  await page.evaluate((id) => { const e = id === "top" ? null : document.getElementById(id); window.scrollTo(0, e ? e.getBoundingClientRect().top + scrollY : 0); }, t);
  await page.waitForTimeout(3500);
  await page.screenshot({ path: `${OUT}/${W}x${H}-${t}.jpg`, type: "jpeg", quality: 85 });
}
console.log(errors.length ? errors.join("\n") : "no page errors");
await b.close();
