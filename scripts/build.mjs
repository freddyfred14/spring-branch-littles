// Validates the data files and writes the static site to dist/.
// Usage: node scripts/build.mjs [--check]   (--check validates only)
import { mkdirSync, writeFileSync, rmSync, cpSync, existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { ROOT, loadAll, validate, today, fmtLong } from "../src/lib.mjs";
import { homePage, eventsPage, placesPage, eatsPage, newsPage, newsletterPage, issuePage, aboutPage, notFoundPage, esc } from "../src/templates.mjs";

const data = loadAll();
const now = today(data.config.timezone);
const { errors, warnings } = validate(data, now);
for (const w of warnings) console.warn(`warning  ${w}`);
for (const e of errors) console.error(`ERROR    ${e}`);
if (errors.length) {
  console.error(`\n${errors.length} error(s). Fix the data files before publishing.`);
  process.exit(1);
}
console.log(`Data OK: ${data.places.length} places, ${data.recurring.length} weekly programs, ${data.events.length} dated events, ${data.news.length} news items, ${data.restaurants.length} restaurants, ${data.deals.length} deals, ${data.issues.length} issues. ${warnings.length} warning(s).`);
if (process.argv.includes("--check")) process.exit(0);

const DIST = join(ROOT, "dist");
rmSync(DIST, { recursive: true, force: true });
const write = (path, html) => {
  const file = join(DIST, path);
  mkdirSync(dirname(file), { recursive: true });
  writeFileSync(file, html);
};

cpSync(join(ROOT, "public"), DIST, { recursive: true });
if (existsSync(join(ROOT, "social"))) cpSync(join(ROOT, "social"), join(DIST, "social"), { recursive: true });

const pages = {
  "index.html": homePage(data, now),
  "events/index.html": eventsPage(data, now),
  "places/index.html": placesPage(data, now),
  "eats/index.html": eatsPage(data, now),
  "news/index.html": newsPage(data, now),
  "newsletter/index.html": newsletterPage(data, now),
  "about/index.html": aboutPage(data, now),
  "404.html": notFoundPage(data, now),
};
for (const issue of data.issues) pages[`newsletter/${issue.date}/index.html`] = issuePage(data, issue, now);
for (const [path, html] of Object.entries(pages)) write(path, html);

const { url, name, description } = data.config;
const urls = Object.keys(pages).filter((p) => p !== "404.html").map((p) => `${url}/${p.replace(/index\.html$/, "")}`);
write("sitemap.xml", `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.map((u) => `  <url><loc>${u}</loc><lastmod>${now}</lastmod></url>`).join("\n")}\n</urlset>\n`);
write("robots.txt", `User-agent: *\nAllow: /\nSitemap: ${url}/sitemap.xml\n`);
write("feed.xml", `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0"><channel>
<title>${esc(name)}</title><link>${url}/newsletter/</link><description>${esc(description)}</description>
${data.issues.map((i) => `<item><title>${esc(i.subject)}</title><link>${url}/newsletter/${i.date}/</link><guid>${url}/newsletter/${i.date}/</guid><pubDate>${new Date(`${i.date}T12:00:00Z`).toUTCString()}</pubDate><description>${esc(i.preheader || "")}</description></item>`).join("\n")}
</channel></rss>\n`);
write("CNAME", `${new URL(url).host}\n`);
write(".nojekyll", "");

console.log(`Built ${Object.keys(pages).length} pages to dist/ for ${fmtLong(now)}.`);
