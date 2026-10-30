// Renders a blog post's Instagram carousel (1080×1350 JPEGs) from its `instagram` text and a photo:
//   1. the cover: the photo full bleed, with the headline set over the part of the photo without people
//   2. the list (when the post has one), or several lists for a holiday roundup: numbered places or events
//   3. the key takeaways (blog posts)
// The type and layout are ours (real fonts, the real logo), so nothing is drawn by the image model except
// the photo. Needs Playwright with Chromium.
import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { createRequire } from "node:module";
import { ROOT } from "./lib.mjs";

const require = createRequire(import.meta.url);
const W = 1080;
const H = 1350;
const C = { paper: "#fbf6ec", ink: "#241e1a", muted: "#6d645b", line: "#e6dccb", green: "#4b7759", dinoDeep: "#4b7759", greenSoft: "#e7efd9", sky: "#4b7ca6", skySoft: "#e0ebf4", sun: "#f3b562", sunSoft: "#fce7cd", pink: "#c25578", pinkSoft: "#fbe3ea" };
const dataUrl = (p, type = "image/png") => `data:${type};base64,${readFileSync(join(ROOT, p)).toString("base64")}`;
const esc = (s) => String(s ?? "").replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);

const page = (inner, bg = C.paper) => `<!doctype html><html><head><meta charset="utf-8">
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Fredoka:wght@500;600;700&family=Nunito:wght@500;600;700;800&display=swap">
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { width: ${W}px; height: ${H}px; overflow: hidden; position: relative; background: ${bg}; color: ${C.ink}; font-family: Nunito, system-ui, sans-serif; }
  .fred { font-family: Fredoka, system-ui, sans-serif; }
  .label { font-weight: 800; font-size: 26px; letter-spacing: .16em; text-transform: uppercase; }
  .foot { position: absolute; left: 72px; right: 72px; bottom: 44px; display: flex; align-items: center; justify-content: space-between; font-weight: 700; font-size: 26px; color: ${C.muted}; }
  .foot img { height: 74px; }
</style></head><body>${inner}
<script>
  // Shrink a block's text until it fits its box, so long titles never overflow.
  window.fit = (sel, min) => { for (const el of document.querySelectorAll(sel)) { let s = parseFloat(getComputedStyle(el).fontSize); while ((el.scrollHeight > el.clientHeight + 1 || el.scrollWidth > el.clientWidth + 1) && s > min) { s -= 1; el.style.fontSize = s + "px"; } } };
</script></body></html>`;

// Playful pieces borrowed from the logo: the baby dinosaur, its spots, and the little orange "ta-da" dashes.
const DINO = () => dataUrl("public/img/dino-head.png");
const DASHES = (size, rot = 0) => `<svg width="${size}" height="${size}" viewBox="0 0 60 60" style="transform:rotate(${rot}deg)"><g stroke="${C.sun}" stroke-width="7" stroke-linecap="round"><path d="M14 30 L4 22"/><path d="M30 18 L28 4"/><path d="M46 30 L56 22"/></g></svg>`;
const STAR = (size, color, rot = 0) => `<svg width="${size}" height="${size}" viewBox="0 0 24 24" style="transform:rotate(${rot}deg)"><path fill="${color}" d="M12 2.5l2.6 6 6.4.5-4.9 4.2 1.5 6.3L12 16.2 6.4 19.5l1.5-6.3L3 9l6.4-.5z"/></svg>`;
const spots = (list) => list.map(([x, y, r, c, o = 0.5]) => `<div style="position:absolute;left:${x}px;top:${y}px;width:${r * 2}px;height:${r * 2}px;border-radius:50%;background:${c};opacity:${o}"></div>`).join("");
const at = (x, y, html) => `<div style="position:absolute;left:${x}px;top:${y}px">${html}</div>`;
const WAVE = (color) => `<svg viewBox="0 0 300 16" preserveAspectRatio="none" style="display:block;width:100%;height:14px;margin-top:6px"><path d="M2 9 Q 27 1 52 9 T 102 9 T 152 9 T 202 9 T 252 9 T 298 9" fill="none" stroke="${color}" stroke-width="6" stroke-linecap="round"/></svg>`;
// The dinosaur peeks up from the bottom-right corner and says something in a speech bubble.
const peekingDino = (say) => `
  <img src="${DINO()}" style="position:absolute;right:-34px;bottom:-62px;width:262px">
  <div class="fred" style="position:absolute;right:226px;bottom:70px;max-width:330px;background:#fff;border-radius:28px;padding:18px 24px;font-weight:600;font-size:30px;line-height:1.15;color:${C.ink};box-shadow:0 6px 0 rgba(0,0,0,.08)">${esc(say)}
    <div style="position:absolute;right:-16px;bottom:24px;width:0;height:0;border-left:22px solid #fff;border-top:12px solid transparent;border-bottom:12px solid transparent"></div></div>`;
const footer = (text) => `<div style="position:absolute;left:64px;bottom:40px;display:flex;align-items:center;gap:18px;font-weight:800;font-size:25px;color:${C.green}"><img src="${dataUrl("public/img/logo-sm.png")}" style="height:96px">${esc(text)}</div>`;
const pill = (text, bg, rot) => `<span class="label" style="display:inline-block;background:${bg};color:#fff;border-radius:999px;padding:10px 24px;transform:rotate(${rot}deg);box-shadow:0 5px 0 rgba(0,0,0,.12)">${esc(text)}</span>`;
const DOT_COLORS = [C.green, C.sky, C.sun, C.pink];

function coverHtml(ig, photo, textArea) {
  const top = textArea !== "bottom";
  const c = ig.cover;
  // One sticker card across the top (or bottom) of the photo, and the logo as a round brand sticker half on the
  // card's edge and half on the photo, like a seal on a magazine cover.
  return page(`
  <img src="${photo}" style="position:absolute;inset:0;width:100%;height:100%;object-fit:cover">
  <div style="position:absolute;left:44px;right:44px;${top ? "top:56px" : "bottom:170px"}">
    <div id="copy" style="background:#fffaf1;border:5px solid #fff;border-radius:40px;padding:62px 44px 40px;transform:rotate(-1deg);box-shadow:0 12px 0 ${C.sun};max-height:470px;overflow:hidden;font-size:84px">
      <h1 class="fred" style="font-weight:700;font-size:1em;line-height:1.04;letter-spacing:-.01em;white-space:nowrap">${esc(c.headline)}<br><span style="color:${C.sky};display:inline-block">${esc(c.highlight)}${WAVE(C.sun)}</span></h1>
      <p style="font-weight:800;font-size:32px;line-height:1.3;margin-top:14px;max-width:600px;text-wrap:balance;color:${C.green}">${esc(c.subhead)}</p>
    </div>
    <div style="position:absolute;left:40px;top:-26px">${pill(c.label, C.pink, -3)}</div>
    <div style="position:absolute;right:10px;bottom:-96px;width:236px;height:236px;border-radius:50%;background:#fffaf1;border:8px solid #fff;box-shadow:0 10px 0 ${C.sun}, 10px 22px 0 4px rgba(25,16,8,.42), 14px 40px 46px 10px rgba(25,16,8,.55);transform:rotate(8deg) translateY(-6px);display:flex;align-items:center;justify-content:center">
      <img src="${dataUrl("public/img/logo.png")}" style="width:182px;margin-top:-6px">
    </div>
    <div style="position:absolute;right:226px;bottom:-40px">${DASHES(56, -35)}</div>
    <div style="position:absolute;left:-22px;${top ? "bottom:-26px" : "top:-30px"}">${STAR(54, C.sun, -12)}</div>
  </div>
  <div class="fred" style="position:absolute;${top ? "bottom:48px" : "top:52px"};right:56px;background:${C.sun};color:#fff;font-weight:700;font-size:30px;border-radius:999px;padding:12px 28px;box-shadow:0 5px 0 rgba(0,0,0,.15)">Swipe →</div>`);
}

function listHtml(l, n, total, bg = C.greenSoft) {
  // Short lists get bigger cards so the page stays full; long ones start smaller and shrink to fit.
  const k = l.items.length;
  const [size, gap, pad] = k <= 3 ? [46, 26, 0.7] : k <= 5 ? [42, 22, 0.55] : k <= 7 ? [38, 14, 0.36] : [34, 9, 0.22];
  return page(`
  ${spots([[930, 60, 34, C.dinoDeep, 0.18], [1000, 170, 16, C.dinoDeep, 0.22], [40, 1010, 22, C.dinoDeep, 0.15], [880, 300, 10, C.dinoDeep, 0.2]])}
  ${at(900, 120, STAR(46, C.sun, 14))}${at(990, 250, STAR(30, C.pink, -10))}
  <div style="position:absolute;left:64px;right:180px;top:64px">
    ${pill(l.label || "The list", C.pink, -2)}
    <h2 class="fred" style="font-weight:700;font-size:56px;line-height:1.05;margin-top:22px;display:inline-block;text-wrap:balance">${esc(l.title)}${WAVE(C.sun)}</h2>
  </div>
  <ol id="items" style="position:absolute;left:64px;right:64px;top:292px;bottom:196px;list-style:none;overflow:hidden;font-size:${size}px;display:flex;flex-direction:column;gap:${gap}px">
    ${l.items.map((x, i) => `<li style="display:flex;gap:.6em;align-items:center;background:#fff;border-radius:22px;padding:${pad}em .7em;line-height:1.12;box-shadow:0 4px 0 rgba(75,119,89,.18)">
      <span class="fred" style="flex:none;width:1.7em;height:1.7em;border-radius:50%;background:${DOT_COLORS[i % 4]};color:#fff;font-weight:700;display:flex;align-items:center;justify-content:center;font-size:.9em">${i + 1}</span>
      <span><b style="font-weight:800">${esc(x.name)}</b><br><span style="font-size:.8em;color:${C.muted};font-weight:700">${esc(x.detail)}</span></span>
    </li>`).join("")}
  </ol>
  ${peekingDino(l.say || "Save this for later!")}
  ${footer(`Link in bio · ${n}/${total}`)}`, bg);
}

function takeawaysHtml(ig, n, total) {
  const t = ig.takeaways;
  const tints = [[C.greenSoft, C.green], [C.skySoft, C.sky], ["#fff1d6", C.sun], [C.pinkSoft, C.pink]];
  return page(`
  ${spots([[960, 70, 30, C.sun, 0.25], [880, 210, 14, C.pink, 0.35], [36, 760, 18, C.sky, 0.25], [1010, 640, 12, C.green, 0.3]])}
  ${at(940, 140, DASHES(80, 15))}
  <div style="position:absolute;left:64px;right:150px;top:64px">
    ${pill("Key takeaways", C.sky, -2)}
    <h2 id="ttitle" class="fred" style="font-weight:700;font-size:62px;line-height:1.05;margin-top:22px;white-space:nowrap;overflow:hidden">${esc(t.title)}<br><span style="color:${C.pink};display:inline-block">${esc(t.highlight)}${WAVE(C.sun)}</span></h2>
  </div>
  <div id="points" style="position:absolute;left:64px;right:64px;top:340px;bottom:210px;display:flex;flex-direction:column;gap:22px;overflow:hidden;font-size:29px">
    ${t.points.map((x, i) => `<div style="display:flex;gap:24px;align-items:center;background:#fff;border-radius:30px;padding:22px 28px;box-shadow:0 7px 0 ${tints[i][1]};transform:rotate(${i % 2 ? 0.6 : -0.6}deg)">
      <span class="fred" style="flex:none;width:72px;height:72px;border-radius:50%;background:${tints[i][1]};color:#fff;font-weight:700;font-size:40px;display:flex;align-items:center;justify-content:center;box-shadow:inset 0 -5px 0 rgba(0,0,0,.12)">${i + 1}</span>
      <span style="line-height:1.25"><b class="fred" style="font-weight:600;font-size:1.15em">${esc(x.heading)}</b><br><span style="font-weight:700;color:${C.muted}">${esc(x.text)}</span></span>
    </div>`).join("")}
  </div>
  ${peekingDino("You've got this!")}
  ${footer(`Link in bio · ${n}/${total}`)}`, C.sunSoft);
}

// photoPath: the generated photo (JPEG). textArea: "top" or "bottom", whichever part of the photo has no people.
// Returns the file names written to outDir, in order.
export async function renderSlides(ig, photoPath, textArea, outDir) {
  const { chromium } = require("playwright");
  const photo = `data:image/jpeg;base64,${readFileSync(photoPath).toString("base64")}`;
  // A blog post has one optional `list`; other carousels (holiday roundups) can have several `lists` and
  // no takeaways.
  const lists = ig.lists || (ig.list ? [ig.list] : []);
  const total = 1 + lists.length + (ig.takeaways ? 1 : 0);
  // Each page: file name, HTML, and the blocks to shrink-to-fit with their smallest allowed font size.
  const pages = [["1.jpg", coverHtml(ig, photo, textArea), [["#copy", 64]]]];
  const tints = [C.greenSoft, C.skySoft, C.sunSoft, C.pinkSoft];
  lists.forEach((l, i) => pages.push([`${i + 2}.jpg`, listHtml(l, i + 2, total, tints[i % tints.length]), [["#items", 22]]]));
  if (ig.takeaways) pages.push([`${total}.jpg`, takeawaysHtml(ig, total, total), [["#ttitle", 40], ["#points", 22]]]);
  const browser = await chromium.launch();
  try {
    const tab = await browser.newPage({ viewport: { width: W, height: H } });
    for (const [file, html, fits] of pages) {
      await tab.setContent(html, { waitUntil: "networkidle" });
      await tab.evaluate(() => document.fonts.ready);
      for (const [sel, min] of fits) await tab.evaluate(([s, m]) => window.fit(s, m), [sel, min]);
      writeFileSync(join(outDir, file), await tab.screenshot({ type: "jpeg", quality: 90 }));
    }
  } finally {
    await browser.close();
  }
  return pages.map(([f]) => f);
}
