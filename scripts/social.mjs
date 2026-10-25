// Makes this weekend's Instagram carousel (1080×1350 PNGs) plus a caption.
//   node scripts/social.mjs                 → social/<date>/slide-1.png … caption.txt post.json
//   node scripts/social.mjs --date 2026-11-05
//   node scripts/social.mjs --og            → public/og.png (link preview image)
// Needs Playwright with Chromium (npx playwright install chromium).
import { mkdirSync, writeFileSync, existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { createRequire } from "node:module";
import { ROOT, loadAll, today, weekendOf, fmtShort, addDays } from "../src/lib.mjs";
import { buildIssue } from "../src/newsletter.mjs";
import { esc } from "../src/templates.mjs";

const require = createRequire(import.meta.url);
let chromium;
try {
  ({ chromium } = require("playwright"));
} catch {
  console.error("Playwright is not installed. Run: npm i -D playwright && npx playwright install chromium");
  process.exit(1);
}

const args = process.argv.slice(2);
const data = loadAll();
const { config } = data;
const date = args.includes("--date") ? args[args.indexOf("--date") + 1] : today(config.timezone);

// Brand colors and images, matching the website and logo.
const C = { paper: "#fbf6ec", ink: "#241e1a", muted: "#6d645b", dino: "#9db57f", dinoDeep: "#4b7759", dinoSoft: "#e7efd9", sky: "#4b7ca6", skySoft: "#e0ebf4", sun: "#e9a55a", sunSoft: "#fce7cd", peach: "#f8dcc7", pink: "#e38aa5", pinkSoft: "#fbe3ea", pinkDeep: "#c25578" };
const img = (p) => `data:image/png;base64,${readFileSync(join(ROOT, p)).toString("base64")}`;
const LOGO = img("public/img/logo.png");
const DINO = img("public/img/dino-head.png");
const FONTS = `<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Fredoka:wght@600;700&family=Nunito:wght@600;700;800&family=Caveat:wght@700&display=swap">`;
const GRASS = `<svg viewBox="0 0 220 34" width="440" height="68" style="position:absolute;bottom:0"><g fill="none" stroke-linecap="round" stroke-width="4"><path d="M20 33c-1-9-5-16-11-21" stroke="#8f9f5c"/><path d="M25 33c0-10 2-19 6-26" stroke="#9db57f"/><path d="M30 33c2-6 6-11 12-14" stroke="#8f9f5c"/><path d="M120 33c-1-7-4-12-8-16" stroke="#9db57f"/><path d="M125 33c1-8 3-14 7-19" stroke="#8f9f5c"/><path d="M186 33c0-6-2-10-5-13" stroke="#8f9f5c"/><path d="M191 33c1-7 4-12 8-15" stroke="#9db57f"/></g></svg>`;
const grassRow = `<div style="position:absolute;left:0;right:0;bottom:0;height:68px">${[0, 440, 880].map((x) => GRASS.replace('style="position:absolute;bottom:0"', `style="position:absolute;bottom:0;left:${x}px"`)).join("")}</div>`;
const SPOTS = [[90, 210, 26, C.dino], [960, 520, 18, C.sky], [70, 900, 16, C.sun], [1000, 160, 14, C.dino]]
  .map(([x, y, r, c]) => `<div style="position:absolute;left:${x}px;top:${y}px;width:${r * 2}px;height:${r * 2}px;border-radius:50%;background:${c};opacity:.22"></div>`).join("");
const base = (w, h, inner, bg = C.paper) => `<!doctype html><html><head><meta charset="utf-8">${FONTS}<style>
  * { box-sizing: border-box; margin: 0; }
  body { width: ${w}px; height: ${h}px; background: ${bg}; color: ${C.ink}; font-family: Nunito, system-ui, sans-serif; overflow: hidden; position: relative; }
  .fred { font-family: Fredoka, system-ui, sans-serif; font-weight: 700; }
  .script { font-family: Caveat, cursive; font-weight: 700; color: ${C.sky}; }
  .k { font-family: Fredoka, sans-serif; font-size: 32px; font-weight: 600; letter-spacing: .05em; text-transform: uppercase; color: ${C.dinoDeep}; }
  .handle { position: absolute; left: 80px; bottom: 92px; font-family: Caveat, cursive; font-size: 46px; font-weight: 700; color: ${C.sky}; }
  .count { position: absolute; right: 80px; bottom: 100px; font-family: Fredoka, sans-serif; font-size: 30px; font-weight: 600; color: ${C.muted}; }
  .tag { display: inline-block; font-size: 30px; font-weight: 800; padding: 8px 22px; border-radius: 999px; margin: 0 10px 12px 0; }
</style></head><body>${SPOTS}${inner}</body></html>`;

const cover = (wk, n, total) => base(1080, 1350, `
  <img src="${LOGO}" style="position:absolute;left:50%;top:70px;width:620px;transform:translateX(-50%)">
  <div style="position:absolute;left:70px;right:70px;top:640px;background:#fff;border-radius:48px;padding:56px 60px;box-shadow:0 14px 0 ${C.dinoSoft};text-align:center">
    <div class="k">This weekend + next week</div>
    <h1 class="fred" style="font-size:96px;line-height:1.02;margin:22px 0 14px">${n} things to do with your <span class="script" style="font-size:1.3em">littles</span></h1>
    <p class="script" style="font-size:54px;color:${C.muted}">${fmtShort(wk.start)} – ${fmtShort(addDays(wk.end, 5))}</p>
  </div>
  <div class="count" style="bottom:100px">swipe →</div>${grassRow}`);

const colors = [[C.dinoSoft, C.dinoDeep], [C.skySoft, C.sky], [C.sunSoft, "#a8641f"], [C.pinkSoft, C.pinkDeep]];
const slide = (it, i, total) => {
  const [soft, deep] = colors[i % colors.length];
  return base(1080, 1350, `
  <div style="position:absolute;left:70px;right:70px;top:170px;max-height:1000px;overflow:hidden;background:#fff;border-radius:52px;padding:70px 64px;box-shadow:0 14px 0 ${soft}">
    <div style="display:inline-block;background:${soft};color:${deep};font-family:Fredoka;font-weight:600;font-size:34px;padding:12px 30px;border-radius:999px;transform:rotate(-1.5deg)">${esc(it.when)}</div>
    <h2 class="fred" style="font-size:${it.title.length > 30 ? 84 : 100}px;line-height:1.05;margin:40px 0 30px">${esc(it.title)}</h2>
    <p style="font-size:40px;line-height:1.42;color:${C.muted};font-weight:600">${esc(it.description)}</p>
    <p style="font-size:38px;font-weight:800;margin-top:36px;color:${C.ink}">📍 ${esc(it.where)}</p>
    <div style="margin-top:30px">${it.ages.split(", ").map((a) => `<span class="tag" style="background:${C.sunSoft};color:#7a4d17">${esc(a)}</span>`).join("")}<span class="tag" style="background:${C.dinoSoft};color:${C.dinoDeep}">${esc(it.cost)}</span>${it.tentative ? `<span class="tag" style="border:3px dashed ${C.sun};color:#a2522a">Date may change</span>` : ""}</div>
  </div>
  <img src="${DINO}" style="position:absolute;right:70px;top:50px;width:150px;transform:rotate(8deg)">
  <div class="handle">@${esc(config.instagram)}</div><div class="count">${i}/${total}</div>${grassRow}`);
};

const outro = (total) => base(1080, 1350, `
  <img src="${DINO}" style="position:absolute;left:50%;top:150px;width:300px;transform:translateX(-50%)">
  <div style="position:absolute;left:80px;right:80px;top:480px;text-align:center">
    <h2 class="fred" style="font-size:100px;line-height:1.02">Want the <span class="script" style="font-size:1.25em">whole</span> list?</h2>
    <p style="font-size:42px;line-height:1.4;margin-top:34px;color:${C.muted};font-weight:600">Get ${esc(config.newsletterName)}: weekly kid-friendly finds in your inbox.</p>
    <div style="display:inline-block;margin-top:50px;background:${C.dinoDeep};color:#fff;font-family:Fredoka;font-weight:600;font-size:46px;padding:22px 52px;border-radius:999px;box-shadow:0 8px 0 #365a42">Free newsletter · link in bio</div>
    <p class="script" style="font-size:52px;margin-top:40px">save this for the weekend ♡</p>
  </div>
  <div class="count">${total}/${total}</div>${grassRow}`, C.dinoSoft);

const ogImage = () => base(1200, 630, `
  <img src="${LOGO}" style="position:absolute;left:60px;top:50%;width:540px;transform:translateY(-50%)">
  <div style="position:absolute;left:660px;right:60px;top:50%;transform:translateY(-50%)">
    <h1 class="fred" style="font-size:70px;line-height:1.05">Weekend plans for your <span class="script" style="font-size:1.3em">littles</span>, sorted.</h1>
    <p style="font-size:30px;margin-top:22px;color:${C.muted};font-weight:600">Kid-friendly finds in Spring Branch & Memorial, Houston. Every week.</p>
  </div>`);

async function render(pages, dir) {
  const browser = await chromium.launch();
  const files = [];
  for (const [name, html, w, h] of pages) {
    const page = await browser.newPage({ viewport: { width: w, height: h } });
    await page.setContent(html, { waitUntil: "networkidle", timeout: 20000 }).catch(() => page.setContent(html));
    await page.screenshot({ path: join(dir, name) });
    files.push(name);
    await page.close();
  }
  await browser.close();
  return files;
}

if (args.includes("--og")) {
  await render([["og.png", ogImage(), 1200, 630]], join(ROOT, "public"));
  console.log("Wrote public/og.png");
  process.exit(0);
}

const wk = weekendOf(date);
const issue = buildIssue(data, date);
// Weekend events first, then next week's programs and the rainy-day pick, 5 items max.
const items = issue.sections.filter((s) => s.heading !== "Coming up").flatMap((s) => s.items).slice(0, 5);
if (items.length < 2) {
  console.error(`Only ${items.length} item(s) for ${wk.start}. Add events before making a carousel.`);
  process.exit(1);
}
const total = items.length + 2;
const dir = join(ROOT, "social", wk.start);
mkdirSync(dir, { recursive: true });
const files = await render(
  [
    ["slide-1.png", cover(wk, items.length, total), 1080, 1350],
    ...items.map((it, i) => [`slide-${i + 2}.png`, slide(it, i + 2, total), 1080, 1350]),
    [`slide-${total}.png`, outro(total), 1080, 1350],
  ],
  dir,
);

const caption = [
  `${items.length} things to do with kids in Spring Branch & Memorial this weekend and next week (${fmtShort(wk.start)}–${fmtShort(addDays(wk.end, 5))}) 🌳`,
  "",
  ...items.map((it, i) => `${i + 1}. ${it.title} · ${it.where}`),
  "",
  "Times change, so double-check with the venue before you go.",
  `Get the full list in ${config.newsletterName}, our free weekly email. Link in bio. Save this for the weekend!`,
  "",
  "#springbranch #springbranchhouston #memorialhouston #memorialparkhouston #houstonmoms #houstonkids #houstonfamily #thingstodoinhouston #houstontoddler #houstonparents",
].join("\n");
const postPath = join(dir, "post.json");
const prev = existsSync(postPath) ? JSON.parse(readFileSync(postPath, "utf8")) : {};
writeFileSync(join(dir, "caption.txt"), caption + "\n");
writeFileSync(postPath, JSON.stringify({ ...prev, weekend: wk.start, slides: files, caption }, null, 2) + "\n");
console.log(`Wrote ${files.length} slides and a caption to social/${wk.start}/`);
