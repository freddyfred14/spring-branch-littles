// Makes Instagram/Facebook ad images in marketing/:
//   ad-feed.png (1080×1350), ad-story.png (1080×1920), ad-square.png (1080×1080)
// Usage: node scripts/ads.mjs   (needs Playwright with Chromium)
import { mkdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { createRequire } from "node:module";
import { ROOT, loadAll } from "../src/lib.mjs";
import { WATERCOLOR_DEFS, babyIllo, toddlerIllo, bubblesIllo, kiteIllo, readerIllo, iceCreamIllo } from "../src/illustrations.mjs";

const require = createRequire(import.meta.url);
const { chromium } = require("playwright");
const { config } = loadAll();
const img = (p) => `data:image/png;base64,${readFileSync(join(ROOT, p)).toString("base64")}`;
const LOGO = img("public/img/logo.png");
const DINO = img("public/img/dino-head.png");
const site = config.url.replace("https://", "");

const C = { paper: "#fbf6ec", ink: "#241e1a", muted: "#6d645b", sage: "#9db57f", sageDeep: "#4b7759", sageSoft: "#e7efd9", sky: "#4b7ca6", skySoft: "#e0ebf4", sun: "#e9a55a", sunSoft: "#fce7cd", pink: "#e38aa5", pinkDeep: "#c25578", pinkSoft: "#fbe3ea", red: "#d2453d" };
const FONTS = `<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Fredoka:wght@600;700&family=Nunito:wght@600;700;800&family=Caveat:wght@700&display=swap">`;
const page = (w, h, inner) => `<!doctype html><html><head><meta charset="utf-8">${FONTS}<style>
  * { box-sizing: border-box; margin: 0; }
  body { width: ${w}px; height: ${h}px; overflow: hidden; position: relative; background: ${C.paper}; color: ${C.ink}; font-family: Nunito, sans-serif;
    background-image: radial-gradient(circle at 12% 18%, rgba(157,181,127,.22) 0 14px, transparent 15px), radial-gradient(circle at 86% 42%, rgba(227,138,165,.2) 0 12px, transparent 13px), radial-gradient(circle at 30% 88%, rgba(75,124,166,.14) 0 12px, transparent 13px), radial-gradient(circle at 70% 8%, rgba(233,165,90,.2) 0 10px, transparent 11px);
    background-size: 520px 460px; }
  .fred { font-family: Fredoka, sans-serif; font-weight: 700; }
  .script { font-family: Caveat, cursive; font-weight: 700; }
  .illo { width: 100%; height: auto; display: block; }
  .chip { display: flex; align-items: center; gap: 22px; background: #fff; border-radius: 34px; padding: 18px 28px 18px 18px; box-shadow: 0 8px 0 var(--s); }
  .chip .i { width: 104px; flex: none; }
  .chip b { font-family: Fredoka, sans-serif; font-size: 40px; line-height: 1.1; display: block; }
  .chip span { font-size: 28px; color: ${C.muted}; font-weight: 700; }
  .cta { display: inline-block; background: ${C.red}; color: #fff; font-family: Fredoka, sans-serif; font-weight: 600; border-radius: 999px; box-shadow: 0 10px 0 #a8322b; }
  .grass { position: absolute; left: 0; right: 0; bottom: 0; height: 70px; background: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='220' height='34' viewBox='0 0 220 34'%3E%3Cg fill='none' stroke-linecap='round' stroke-width='4'%3E%3Cpath d='M20 33c-1-9-5-16-11-21' stroke='%238f9f5c'/%3E%3Cpath d='M25 33c0-10 2-19 6-26' stroke='%239db57f'/%3E%3Cpath d='M30 33c2-6 6-11 12-14' stroke='%238f9f5c'/%3E%3Cpath d='M120 33c-1-7-4-12-8-16' stroke='%239db57f'/%3E%3Cpath d='M125 33c1-8 3-14 7-19' stroke='%238f9f5c'/%3E%3Cpath d='M186 33c0-6-2-10-5-13' stroke='%238f9f5c'/%3E%3Cpath d='M191 33c1-7 4-12 8-15' stroke='%239db57f'/%3E%3C/g%3E%3C/svg%3E") repeat-x left bottom / 440px 68px; }
</style></head><body>${WATERCOLOR_DEFS}${inner}<div class="grass"></div></body></html>`;

const chips = [
  [readerIllo(), "Storytimes & events", "every week, close to home", C.sageSoft],
  [iceCreamIllo(), "Kids-eat-free nights", "and family-friendly spots", C.pinkSoft],
  [kiteIllo(), "Parks, festivals & more", "babies to elementary", C.skySoft],
];
const chipList = (scale = 1) => chips.map(([art, b, s, shadow]) => `<div class="chip" style="--s:${shadow};transform:scale(${scale});transform-origin:left center"><div class="i">${art}</div><div><b>${b}</b><span>${s}</span></div></div>`).join("");

const feed = page(1080, 1350, `
  <img src="${LOGO}" style="position:absolute;left:60px;top:50px;width:330px">
  <div style="position:absolute;left:430px;right:60px;top:80px">
    <p class="script" style="font-size:46px;color:${C.pinkDeep}">Spring Branch &amp; Memorial parents</p>
    <h1 class="fred" style="font-size:68px;line-height:1.04;margin-top:8px">Weekend plans for your <span class="script" style="color:${C.sky};font-size:1.25em">littles</span>, sorted.</h1>
  </div>
  <div style="position:absolute;left:70px;right:70px;top:500px;display:grid;gap:28px">${chipList()}</div>
  <div style="position:absolute;left:70px;right:70px;bottom:120px;text-align:center">
    <div class="cta" style="font-size:50px;padding:26px 60px">Get The Littles List · free</div>
    <p style="font-size:32px;font-weight:800;margin-top:28px;color:${C.muted}">One short email a week · ${site}</p>
  </div>`);

const story = page(1080, 1920, `
  <img src="${LOGO}" style="position:absolute;left:50%;top:150px;width:520px;transform:translateX(-50%)">
  <div style="position:absolute;left:80px;right:80px;top:640px;text-align:center">
    <p class="script" style="font-size:60px;color:${C.pinkDeep}">Spring Branch &amp; Memorial parents</p>
    <h1 class="fred" style="font-size:96px;line-height:1.02;margin-top:12px">Never miss a storytime again.</h1>
  </div>
  <div style="position:absolute;left:80px;right:80px;top:1000px;display:grid;gap:34px">${chipList()}</div>
  <div style="position:absolute;left:0;right:0;bottom:200px;text-align:center">
    <div class="cta" style="font-size:54px;padding:30px 70px">Subscribe free</div>
    <p style="font-size:34px;font-weight:800;margin-top:30px;color:${C.muted}">${site}/join</p>
  </div>`);

const square = page(1080, 1080, `
  <div style="position:absolute;left:60px;top:60px;width:440px">${toddlerIllo()}</div>
  <img src="${DINO}" style="position:absolute;left:390px;top:300px;width:150px;transform:rotate(8deg)">
  <div style="position:absolute;left:560px;right:70px;top:90px">
    <img src="${LOGO}" style="width:300px;display:block;margin-bottom:24px">
    <h1 class="fred" style="font-size:56px;line-height:1.06">Your weekly cheat sheet for <span class="script" style="color:${C.pinkDeep};font-size:1.25em">kid-friendly</span> fun.</h1>
  </div>
  <div style="position:absolute;left:70px;right:70px;top:700px;display:flex;gap:18px;flex-wrap:wrap;justify-content:center">
    ${["Storytimes", "Festivals", "Kids eat free", "Parks", "Rainy-day spots"].map((t, i) => `<span class="fred" style="font-size:36px;font-weight:600;padding:12px 28px;border-radius:999px;background:${[C.sageSoft, C.pinkSoft, C.sunSoft, C.skySoft, C.sageSoft][i]}">${t}</span>`).join("")}
  </div>
  <div style="position:absolute;left:0;right:0;bottom:100px;text-align:center">
    <div class="cta" style="font-size:46px;padding:24px 56px">Join free · ${site}</div>
  </div>`);

const out = join(ROOT, "marketing");
mkdirSync(out, { recursive: true });
const browser = await chromium.launch();
for (const [name, html, w, h] of [["ad-feed.png", feed, 1080, 1350], ["ad-story.png", story, 1080, 1920], ["ad-square.png", square, 1080, 1080]]) {
  const p = await browser.newPage({ viewport: { width: w, height: h } });
  await p.setContent(html, { waitUntil: "networkidle", timeout: 20000 }).catch(() => p.setContent(html));
  await p.screenshot({ path: join(out, name) });
  await p.close();
}
await browser.close();
console.log("Wrote marketing/ad-feed.png, ad-story.png, ad-square.png");
