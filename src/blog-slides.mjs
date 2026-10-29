// Renders a blog post's Instagram carousel (1080×1350 JPEGs) from its `instagram` text and a photo:
//   1. the cover: the photo full bleed, with the headline set over the part of the photo without people
//   2. the list (when the post has one): the places or items, numbered
//   3. the key takeaways
// The type and layout are ours (real fonts, the real logo), so nothing is drawn by the image model except
// the photo. Needs Playwright with Chromium.
import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { createRequire } from "node:module";
import { ROOT } from "./lib.mjs";

const require = createRequire(import.meta.url);
const W = 1080;
const H = 1350;
const C = { paper: "#fbf6ec", ink: "#241e1a", muted: "#6d645b", line: "#e6dccb", green: "#4b7759", greenSoft: "#e7efd9", sky: "#4b7ca6", skySoft: "#e0ebf4", sun: "#f3b562", sunSoft: "#fce7cd", pink: "#c25578", pinkSoft: "#fbe3ea" };
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

function coverHtml(ig, photo, textArea) {
  const top = textArea !== "bottom";
  // A soft cream fade (the site's paper color) over the side without people, so the full-color logo and
  // dark type read clearly without a box.
  const cream = (a) => `rgba(251,246,236,${a})`;
  const shade = `linear-gradient(to ${top ? "bottom" : "top"}, ${cream(0.97)} 0%, ${cream(0.92)} 34%, ${cream(0.6)} 46%, ${cream(0)} 62%)`;
  const c = ig.cover;
  return page(`
  <img src="${photo}" style="position:absolute;inset:0;width:100%;height:100%;object-fit:cover">
  <div style="position:absolute;inset:0;background:${shade}"></div>
  <div style="position:absolute;left:72px;right:72px;${top ? "top:64px" : "bottom:64px"};display:flex;flex-direction:column">
    <img src="${dataUrl("public/img/logo.png")}" style="width:280px;display:block;margin:0 0 26px -6px">
    <div id="copy" style="max-height:440px;overflow:hidden;font-size:96px">
      <p class="label" style="color:${C.green};margin-bottom:16px">${esc(c.label)}</p>
      <h1 class="fred" style="font-weight:700;font-size:1em;line-height:1.04;letter-spacing:-.01em;white-space:nowrap">${esc(c.headline)}<br><span style="color:${C.sky}">${esc(c.highlight)}</span></h1>
      <p style="font-weight:700;font-size:36px;line-height:1.3;margin-top:20px;max-width:880px">${esc(c.subhead)}</p>
    </div>
  </div>
  <div style="position:absolute;${top ? "bottom:60px" : "top:66px"};right:72px;font-weight:800;font-size:28px;color:#fff;text-shadow:0 1px 8px rgba(0,0,0,.5)">Swipe →</div>`);
}

function listHtml(ig, n, total) {
  const l = ig.list;
  return page(`
  <div style="position:absolute;left:72px;right:72px;top:80px">
    <p class="label" style="color:${C.green}">${esc(l.label || "The list")}</p>
    <h2 class="fred" style="font-weight:700;font-size:58px;line-height:1.05;margin-top:14px">${esc(l.title)}</h2>
  </div>
  <ol id="items" style="position:absolute;left:72px;right:72px;top:270px;bottom:150px;list-style:none;overflow:hidden;font-size:40px">
    ${l.items.map((x, i) => `<li style="display:flex;gap:.6em;padding:.28em 0;line-height:1.2;border-top:2px solid ${C.line}">
      <span class="fred" style="font-weight:700;color:${C.green};min-width:1.4em">${i + 1}</span>
      <span><b style="font-weight:800">${esc(x.name)}</b><br><span style="font-size:.8em;color:${C.muted};font-weight:600">${esc(x.detail)}</span></span>
    </li>`).join("")}
  </ol>
  <div class="foot"><img src="${dataUrl("public/img/logo-sm.png")}"><span>Full guide: link in bio · ${n}/${total}</span></div>`);
}

function takeawaysHtml(ig, n, total) {
  const t = ig.takeaways;
  const tints = [[C.greenSoft, C.green], [C.skySoft, C.sky], [C.sunSoft, "#a8641f"], [C.pinkSoft, C.pink]];
  return page(`
  <div style="position:absolute;left:72px;right:72px;top:80px">
    <p class="label" style="color:${C.green}">Key takeaways</p>
    <h2 class="fred" style="font-weight:700;font-size:64px;line-height:1.05;margin-top:16px">${esc(t.title)}<br><span style="color:${C.sky}">${esc(t.highlight)}</span></h2>
  </div>
  <div id="points" style="position:absolute;left:72px;right:72px;top:330px;bottom:170px;display:flex;flex-direction:column;gap:22px;overflow:hidden;font-size:30px">
    ${t.points.map((x, i) => `<div style="display:flex;gap:26px;align-items:flex-start;background:${tints[i][0]};border-radius:26px;padding:26px 30px">
      <span class="fred" style="flex:none;width:58px;height:58px;border-radius:50%;background:${tints[i][1]};color:#fff;font-weight:700;font-size:32px;display:flex;align-items:center;justify-content:center">${i + 1}</span>
      <span><b style="font-weight:800;font-size:1.1em">${esc(x.heading)}</b><br><span style="font-weight:600;color:${C.ink}">${esc(x.text)}</span></span>
    </div>`).join("")}
  </div>
  <div class="foot"><img src="${dataUrl("public/img/logo-sm.png")}"><span>Full article: link in bio · ${n}/${total}</span></div>`);
}

// photoPath: the generated photo (JPEG). textArea: "top" or "bottom", whichever part of the photo has no people.
// Returns the file names written to outDir, in order.
export async function renderSlides(ig, photoPath, textArea, outDir) {
  const { chromium } = require("playwright");
  const photo = `data:image/jpeg;base64,${readFileSync(photoPath).toString("base64")}`;
  const pages = [["1.jpg", coverHtml(ig, photo, textArea), "#copy", 64]];
  const total = ig.list ? 3 : 2;
  if (ig.list) pages.push(["2.jpg", listHtml(ig, 2, total), "#items", 22]);
  pages.push([`${total}.jpg`, takeawaysHtml(ig, total, total), "#points", 22]);
  const browser = await chromium.launch();
  try {
    const tab = await browser.newPage({ viewport: { width: W, height: H } });
    for (const [file, html, fitSel, min] of pages) {
      await tab.setContent(html, { waitUntil: "networkidle" });
      await tab.evaluate(() => document.fonts.ready);
      await tab.evaluate(([s, m]) => window.fit(s, m), [fitSel, min]);
      writeFileSync(join(outDir, file), await tab.screenshot({ type: "jpeg", quality: 90 }));
    }
  } finally {
    await browser.close();
  }
  return pages.map(([f]) => f);
}
