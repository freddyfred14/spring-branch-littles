// Opens a page in a real (headless) browser and prints its visible text, for calendars that only appear after
// JavaScript runs (library event calendars, Eventbrite, mall event pages). The research agent uses it.
//   node scripts/render-page.mjs <url> [--links]   --links also lists the page's links (event pages)
import { createRequire } from "node:module";

const url = process.argv[2];
if (!/^https:\/\//.test(url || "")) {
  console.error("Usage: node scripts/render-page.mjs https://… [--links]");
  process.exit(1);
}
const { chromium } = createRequire(import.meta.url)("playwright");
const browser = await chromium.launch();
try {
  const page = await browser.newPage({ userAgent: "Mozilla/5.0 (Macintosh; Intel Mac OS X 14_5) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36", viewport: { width: 1280, height: 2000 } });
  await page.goto(url, { waitUntil: "domcontentloaded", timeout: 45000 });
  // Calendars load their events after the page: wait for the network to settle, then scroll to load more.
  await page.waitForLoadState("networkidle", { timeout: 20000 }).catch(() => {});
  for (let i = 0; i < 4; i++) {
    await page.mouse.wheel(0, 3000);
    await page.waitForTimeout(1200);
  }
  const text = await page.evaluate(() => document.body.innerText.replace(/\n{3,}/g, "\n\n"));
  console.log(`# ${await page.title()}\n${page.url()}\n\n${text.slice(0, 40000)}`);
  if (process.argv.includes("--links")) {
    const links = await page.evaluate(() => [...document.querySelectorAll("a[href]")].map((a) => `${a.innerText.trim().slice(0, 80)} → ${a.href}`).filter((l) => !l.startsWith(" →")));
    console.log(`\n## Links\n${[...new Set(links)].slice(0, 300).join("\n")}`);
  }
} finally {
  await browser.close();
}
