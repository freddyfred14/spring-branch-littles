// Validates the data files and writes the static site to dist/.
// Usage: node scripts/build.mjs [--check]   (--check validates only)
import { mkdirSync, writeFileSync, rmSync, cpSync, existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { ROOT, loadAll, validate, today, fmtLong, addDays, areaOf, currentNews, PLACE_TYPES, PERKS } from "../src/lib.mjs";
import { eventPath, nextOccurrence, icsFile } from "../src/calendar.mjs";
import { homePage, eventsPage, placesPage, eatsPage, newsPage, newsletterPage, joinPage, eventPage, searchPage, thanksPage, appPage, offlinePage, issuePage, aboutPage, notFoundPage, esc } from "../src/templates.mjs";

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
  "join/index.html": joinPage(data, now),
  "search/index.html": searchPage(data, now),
  "thanks/index.html": thanksPage(data, now),
  "app/index.html": appPage(data, now),
  "offline/index.html": offlinePage(data, now),
  "about/index.html": aboutPage(data, now),
  "404.html": notFoundPage(data, now),
};
for (const issue of data.issues) pages[`newsletter/${issue.date}/index.html`] = issuePage(data, issue, now);

// A page and an "Add to calendar" file for every upcoming event and weekly program.
const stamp = new Date().toISOString().replace(/[-:]/g, "").replace(/\.\d+/, "");
const listed = [
  ...data.events.filter((e) => e.kind === "event" && (e.endDate || e.date) >= now && e.date <= addDays(now, 150)),
  ...data.recurring,
];
for (const x of listed) {
  const path = eventPath(x).slice(1);
  pages[`${path}index.html`] = eventPage(data, x, now);
  const date = x.days ? nextOccurrence(x, now) || now : x.date;
  write(`${path}event.ics`, icsFile(data, x, date, `${data.config.url}/${path}`, stamp));
}
for (const [path, html] of Object.entries(pages)) write(path, html);

// Search index for /search/.
const index = [
  ...listed.map((x) => ({ t: x.days ? "Weekly" : "Event", title: x.title, sub: x.days ? (x.frequency || `Every ${x.days.join(", ")}`) : fmtLong(x.date), text: `${x.description} ${x.location || ""} ${x.placeId || ""} ${x.free ? "free" : ""} ${x.indoor ? "indoor" : ""} ${x.ages.join(" ")}`, url: eventPath(x) })),
  ...data.places.map((p) => ({ t: PLACE_TYPES[p.type], title: p.name, sub: p.address, text: `${p.description} ${p.tip || ""} ${p.ages.join(" ")}`, url: `/places/#${p.id}` })),
  ...data.restaurants.map((r) => ({ t: "Eats", title: r.name, sub: r.neighborhood, text: `${r.description} ${r.perks.map((k) => PERKS[k]).join(" ")} restaurant food dinner lunch`, url: "/eats/#restaurants" })),
  ...currentNews(data, now, 90).map((n) => ({ t: "News", title: n.title, sub: n.source, text: n.summary, url: `/news/#${n.id}` })),
];
write("search.json", JSON.stringify(index));

const { url, name, description } = data.config;
const urls = Object.keys(pages).filter((p) => p !== "404.html" && !p.startsWith("offline/")).map((p) => `${url}/${p.replace(/index\.html$/, "")}`);
write("sitemap.xml", `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.map((u) => `  <url><loc>${u}</loc><lastmod>${now}</lastmod></url>`).join("\n")}\n</urlset>\n`);
// Lets phones install the site as an app.
write("manifest.webmanifest", JSON.stringify({
  name,
  short_name: data.config.appName,
  description,
  id: "/",
  start_url: "/?source=app",
  scope: "/",
  display: "standalone",
  background_color: "#fbf6ec",
  theme_color: "#fbf6ec",
  icons: [
    { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
    { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
    { src: "/icons/maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
  ],
  shortcuts: [
    { name: "This week", url: "/?source=app" },
    { name: "Calendar", url: "/events/?source=app" },
    { name: "Kid-friendly eats", url: "/eats/?source=app" },
  ],
}, null, 2));
write("robots.txt", `User-agent: *\nAllow: /\nSitemap: ${url}/sitemap.xml\n`);
write("feed.xml", `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0"><channel>
<title>${esc(name)}</title><link>${url}/newsletter/</link><description>${esc(description)}</description>
${data.issues.map((i) => `<item><title>${esc(i.subject)}</title><link>${url}/newsletter/${i.date}/</link><guid>${url}/newsletter/${i.date}/</guid><pubDate>${new Date(`${i.date}T12:00:00Z`).toUTCString()}</pubDate><description>${esc(i.preheader || "")}</description></item>`).join("\n")}
</channel></rss>\n`);
write("CNAME", `${new URL(url).host}\n`);
write(".nojekyll", "");

console.log(`Built ${Object.keys(pages).length} pages to dist/ for ${fmtLong(now)}.`);
