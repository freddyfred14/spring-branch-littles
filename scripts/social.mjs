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

const C = { bg: "#f5f7f2", ink: "#1d2a23", muted: "#56665c", pine: "#2f5d46", pineSoft: "#e3ede6", sun: "#e9a92c", sunSoft: "#fbefd3", berry: "#b83d64" };
const FONTS = `<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Young+Serif&family=Figtree:wght@500;600;700&display=swap">`;
const base = (w, h, inner, bg = C.bg) => `<!doctype html><html><head><meta charset="utf-8">${FONTS}<style>
  * { box-sizing: border-box; margin: 0; }
  body { width: ${w}px; height: ${h}px; background: ${bg}; color: ${C.ink}; font-family: Figtree, system-ui, sans-serif; overflow: hidden; position: relative; }
  .serif { font-family: "Young Serif", Georgia, serif; font-weight: 400; }
  .k { font-size: 30px; font-weight: 700; letter-spacing: .1em; text-transform: uppercase; }
  .handle { position: absolute; left: 80px; bottom: 64px; font-size: 30px; font-weight: 700; }
  .count { position: absolute; right: 80px; bottom: 64px; font-size: 30px; font-weight: 600; opacity: .7; }
  .tag { display: inline-block; font-size: 28px; font-weight: 700; padding: 8px 20px; border-radius: 999px; margin: 0 10px 12px 0; }
</style></head><body>${inner}</body></html>`;

const cover = (wk, n, total) => base(1080, 1350, `
  <div style="position:absolute;right:-160px;top:-160px;width:620px;height:620px;border-radius:50%;background:${C.sun}"></div>
  <div style="position:absolute;right:120px;top:300px;width:150px;height:150px;border-radius:50%;background:${C.berry}"></div>
  <div style="position:absolute;left:80px;top:96px;right:80px">
    <div class="k" style="color:${C.sunSoft}">Spring Branch Littles</div>
  </div>
  <div style="position:absolute;left:80px;right:80px;bottom:200px;color:#fff">
    <div class="k" style="color:${C.sun};margin-bottom:28px">This weekend + next week · ${fmtShort(wk.start)} – ${fmtShort(addDays(wk.end, 5))}</div>
    <h1 class="serif" style="font-size:112px;line-height:1.02">${n} things to do with kids in Spring Branch</h1>
    <p style="font-size:38px;margin-top:30px;opacity:.9">Houston · for babies through elementary schoolers</p>
  </div>
  <div class="handle" style="color:#fff">@${esc(config.instagram)}</div><div class="count" style="color:#fff">1/${total} · swipe →</div>`, C.pine);

const slide = (it, i, total) => base(1080, 1350, `
  <div style="position:absolute;left:0;top:0;right:0;height:22px;background:${C.sun}"></div>
  <div style="position:absolute;left:80px;right:80px;top:120px">
    <div class="k" style="color:${C.pine}">${esc(it.when)}</div>
    <h2 class="serif" style="font-size:${it.title.length > 32 ? 84 : 100}px;line-height:1.05;margin:36px 0 40px">${esc(it.title)}</h2>
    <p style="font-size:40px;line-height:1.4;color:${C.muted}">${esc(it.description)}</p>
    <p style="font-size:36px;font-weight:700;margin-top:40px">📍 ${esc(it.where)}</p>
    <div style="margin-top:36px">${it.ages.split(", ").map((a) => `<span class="tag" style="background:${C.sunSoft}">${esc(a)}</span>`).join("")}<span class="tag" style="background:${C.pineSoft};color:${C.pine}">${esc(it.cost)}</span>${it.tentative ? `<span class="tag" style="border:3px dashed ${C.berry};color:${C.berry}">Date not final</span>` : ""}</div>
  </div>
  <div class="handle" style="color:${C.pine}">@${esc(config.instagram)}</div><div class="count">${i}/${total}</div>`);

const outro = (total) => base(1080, 1350, `
  <div style="position:absolute;left:80px;right:80px;top:50%;transform:translateY(-50%);text-align:center">
    <h2 class="serif" style="font-size:96px;line-height:1.05;color:${C.pine}">Want the whole list?</h2>
    <p style="font-size:42px;line-height:1.4;margin-top:40px;color:${C.muted}">Storytimes, rainy-day spots and next week's events land in your inbox every ${esc(config.newsletterDay)}.</p>
    <p style="font-size:44px;font-weight:700;margin-top:56px">Free newsletter · link in bio</p>
    <p style="font-size:34px;margin-top:20px;color:${C.muted}">Save this post for the weekend ♡</p>
  </div>
  <div class="handle" style="color:${C.pine}">@${esc(config.instagram)}</div><div class="count">${total}/${total}</div>`, C.sunSoft);

const ogImage = () => base(1200, 630, `
  <div style="position:absolute;right:-120px;top:-120px;width:420px;height:420px;border-radius:50%;background:${C.sun}"></div>
  <div style="position:absolute;right:90px;top:250px;width:90px;height:90px;border-radius:50%;background:${C.berry}"></div>
  <div style="position:absolute;left:72px;right:300px;top:110px;color:#fff">
    <div class="k" style="color:${C.sun};font-size:24px">Spring Branch · Houston</div>
    <h1 class="serif" style="font-size:84px;line-height:1.05;margin-top:22px">Spring Branch Littles</h1>
    <p style="font-size:34px;margin-top:24px;opacity:.9">Things to do with kids, every week.</p>
  </div>`, C.pine);

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
  `${items.length} things to do with kids in Spring Branch this weekend and next week (${fmtShort(wk.start)}–${fmtShort(addDays(wk.end, 5))}) 🌳`,
  "",
  ...items.map((it, i) => `${i + 1}. ${it.title} · ${it.where}`),
  "",
  "Times change, so double-check with the venue before you go.",
  `Get the full list every ${config.newsletterDay} with the free newsletter, link in bio. Save this for the weekend!`,
  "",
  "#springbranch #springbranchhouston #houstonmoms #houstonkids #houstonfamily #thingstodoinhouston #memorialhouston #houstontoddler #houstonparents",
].join("\n");
const postPath = join(dir, "post.json");
const prev = existsSync(postPath) ? JSON.parse(readFileSync(postPath, "utf8")) : {};
writeFileSync(join(dir, "caption.txt"), caption + "\n");
writeFileSync(postPath, JSON.stringify({ ...prev, weekend: wk.start, slides: files, caption }, null, 2) + "\n");
console.log(`Wrote ${files.length} slides and a caption to social/${wk.start}/`);
