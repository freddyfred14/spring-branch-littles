// HTML templates. Every page is plain HTML with one shared stylesheet and a small script for filters.
import {
  AGES, AREAS, PLACE_TYPES, addDays, fmtDateRange, fmtTimeRange, fmtLong, fmtShort, fmtMonth, dateParts,
  eventsBetween, recurringBetween, placeById, whereText, weekendOf, areaOf, NEWS_CATEGORIES, currentNews, featuredStory, PERKS, activeDeals, weekday,
} from "./lib.mjs";
import { existsSync, readFileSync } from "node:fs";
import { createHash } from "node:crypto";
import { join } from "node:path";
import { ROOT } from "./lib.mjs";
import { eventPath, addressOf, mapsUrl, nextOccurrence, googleCalendarUrl } from "./calendar.mjs";
import { WATERCOLOR_DEFS, babyIllo, readerIllo, kiteIllo, bubblesIllo, toddlerIllo, AGE_ILLOS, THEME_ICONS, themeOf, NEWS_ICONS, iceCreamIllo } from "./illustrations.mjs";

export const esc = (s) =>
  String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);

// Changes whenever the CSS or JS changes, so browsers never keep an old copy.
const ASSET_VERSION = createHash("sha1").update(["site.css", "site.js"].map((f) => readFileSync(join(ROOT, "public/assets", f))).join("")).digest("hex").slice(0, 8);
const LOGO = `<img class="logo" src="/img/logo-sm.webp" alt="Spring Branch Littles" width="360" height="311">`;
// The three little "happy" marks next to the dino's head in the logo.
export const SPARK_PINK = `<svg class="spark pink" viewBox="0 0 32 32" aria-hidden="true"><path d="M8 3l3 8M20 6l-5 8M29 15l-9 3" stroke="currentColor" stroke-width="3.2" stroke-linecap="round" fill="none"/></svg>`;
export const SPARK = `<svg class="spark" viewBox="0 0 32 32" aria-hidden="true"><path d="M8 3l3 8M20 6l-5 8M29 15l-9 3" stroke="currentColor" stroke-width="3.2" stroke-linecap="round" fill="none"/></svg>`;
const GRASS = `<div class="grass" aria-hidden="true"></div>`;

const ICON_SEARCH = `<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="10.5" cy="10.5" r="6.5" fill="none" stroke="currentColor" stroke-width="2.4"/><path d="M15.5 15.5 21 21" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"/></svg>`;
const ICON_MENU = `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 7h16M4 12h16M4 17h16" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"/></svg>`;

// The menu bar shows the main pages; the rest sit in the "More" dropdown. On phones, all of it opens from "Menu".
const NAV = [
  ["/", "This week"],
  ["/events/", "Calendar"],
  ["/places/", "Places"],
  ["/eats/", "Kid-friendly eats"],
];
const NAV_MORE = [
  ["/news/", "Neighborhood news"],
  ["/newsletter/", "Newsletter archive"],
  ["/app/", "Get the app"],
  ["/search/", "Search"],
  ["/about/", "About us"],
];
const ICON_CARET = `<svg class="caret" viewBox="0 0 24 24" aria-hidden="true"><path d="m6 9 6 6 6-6" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/></svg>`;

function navLinks(items, path) {
  return items.map(([href, label]) => `<li><a href="${href}"${href === path ? ' aria-current="page"' : ""}>${label}</a></li>`).join("");
}

export function signupForm(config, id = "signup") {
  return `<form class="signup-form" action="https://buttondown.com/api/emails/embed-subscribe/${esc(config.buttondownUsername)}" method="post">
    <label class="sr" for="${id}-email">Email address</label>
    <input id="${id}-email" type="email" name="email" required placeholder="you@example.com" autocomplete="email">
    <input type="hidden" name="embed" value="1">
    <button class="btn" type="submit">Subscribe</button>
  </form>`;
}

// Shown once a few seconds after someone arrives (site.js decides when, and stops after a signup or a "no thanks").
function subscribePopup(config) {
  return `<dialog class="sub-pop" aria-labelledby="sub-pop-title" tabindex="-1">
  <div class="sub-pop-top">
    <img class="sub-pop-dino" src="/img/dino-head.png" alt="" width="512" height="512">
    <button class="sub-pop-close" type="button" aria-label="Close" data-pop-close>×</button>
  </div>
  <div class="sub-pop-body">
    <p class="label">Free · every Monday</p>
    <h2 id="sub-pop-title">Get ${esc(config.newsletterName)}</h2>
    <p class="sub-pop-lede">Two weeks of kid-friendly plans near you, in your inbox every Monday. Plenty of time to plan.</p>
    <ul class="sub-pop-perks"><li>Events &amp; festivals</li><li>Storytimes</li><li>Kids eat free</li></ul>
    ${signupForm(config, "pop")}
    <button class="sub-pop-later" type="button" data-pop-close>No thanks</button>
  </div>
</dialog>`;
}

export function layout(config, { title, description, path, body, now }) {
  const full = title ? `${title} · ${config.name}` : `${config.name} · ${config.tagline}`;
  const canonical = `${config.url}${path}`;
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>${esc(full)}</title>
<meta name="description" content="${esc(description || config.description)}">
<link rel="canonical" href="${esc(canonical)}">
<meta property="og:title" content="${esc(full)}">
<meta property="og:description" content="${esc(description || config.description)}">
<meta property="og:url" content="${esc(canonical)}">
<meta property="og:type" content="website">
<meta property="og:image" content="${esc(config.url)}/og.png">
<link rel="icon" href="/favicon.png" type="image/png">
<link rel="apple-touch-icon" href="/apple-touch-icon.png">
<link rel="manifest" href="/manifest.webmanifest">
<meta name="apple-mobile-web-app-capable" content="yes">
<meta name="mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-title" content="${esc(config.appName)}">
<meta name="apple-mobile-web-app-status-bar-style" content="default">${config.oneSignalAppId ? `
<script src="https://cdn.onesignal.com/sdks/web/v16/OneSignalSDK.page.js" defer></script>
<script>
  window.OneSignalDeferred = window.OneSignalDeferred || [];
  OneSignalDeferred.push((OneSignal) => OneSignal.init({ appId: "${esc(config.oneSignalAppId)}", serviceWorkerPath: "OneSignalSDKWorker.js", notifyButton: { enable: false } }));
</script>` : ""}
<meta name="theme-color" content="#fbf6ec">
<link rel="alternate" type="application/rss+xml" title="${esc(config.name)} newsletter" href="/feed.xml">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Fredoka:wght@500;600;700&family=Nunito:wght@400;600;700;800&family=Caveat:wght@700&display=swap">
<link rel="stylesheet" href="/assets/site.css?v=${ASSET_VERSION}">
</head>
<body${path === "/" ? ' class="home"' : ""}>
${WATERCOLOR_DEFS}
<a class="skip" href="#main">Skip to content</a>
<header class="site-header"><div class="wrap">
  <a class="brand" href="/">${LOGO}</a>
  <nav id="site-nav" aria-label="Main"><ul>
    ${navLinks(NAV, path)}
    <li class="nav-more${NAV_MORE.some(([href]) => href === path) ? " current" : ""}">
      <button class="more-btn" type="button" aria-expanded="false" aria-controls="nav-more-list">More ${ICON_CARET}</button>
      <ul class="dropdown" id="nav-more-list">${navLinks(NAV_MORE, path)}</ul>
    </li>
  </ul></nav>
  <div class="header-actions">
    <a class="icon-btn search-btn" href="/search/" aria-label="Search">${ICON_SEARCH}</a>
    <a class="btn btn-pink nav-cta" href="/join/">Subscribe</a>
    <button class="menu-btn" type="button" aria-expanded="false" aria-controls="site-nav">${ICON_MENU}<span>Menu</span></button>
  </div>
</div></header>
<main id="main">
${config.oneSignalAppId ? `<div class="app-prompt" data-app-prompt hidden><div class="wrap"><span>🔔 Get the weekend's best picks as an alert every Thursday.</span><button class="btn btn-pink" type="button" data-push-on>Turn on</button><button class="app-prompt-close" type="button" aria-label="Not now" data-app-prompt-close>×</button></div></div>` : ""}
${body}
</main>
${path === "/join/" || path === "/thanks/" ? "" : subscribePopup(config)}
<footer class="site-footer">${GRASS}<div class="footer-band"><div class="wrap footer-grid">
  <div>
    <a class="brand" href="/">${LOGO}</a>
    <p>${esc(config.description)}</p>
  </div>
  <div>
    <h2 class="label">Get ${esc(config.newsletterName)}</h2>
    ${signupForm(config, "footer")}
  </div>
  <div>
    <h2 class="label">Follow along</h2>
    <p><a href="https://instagram.com/${esc(config.instagram)}">Instagram @${esc(config.instagram)}</a></p>
    <p>Tips and corrections: <span class="select">${esc(config.contactEmail)}</span></p>
  </div>
</div>
<div class="wrap fineprint">Listings are gathered from public calendars and checked regularly, but times change. Please confirm with the venue before you go. Updated ${esc(fmtLong(now))}.</div>
</div></footer>
<script src="/assets/site.js?v=${ASSET_VERSION}" defer></script>
</body>
</html>`;
}

// ---------- shared pieces ----------

// One age tag instead of four: "All ages", "Ages 1–5", or the labels if they skip a stage.
const AGE_SPAN = { baby: [0, 1], toddler: [1, 3], preschool: [3, 5], elementary: [5, 11] };
function ageText(ages) {
  const order = Object.keys(AGES).filter((a) => ages.includes(a));
  if (order.length === 4) return "All ages";
  const idx = order.map((a) => Object.keys(AGES).indexOf(a));
  const contiguous = idx.every((v, i) => i === 0 || v === idx[i - 1] + 1);
  if (!contiguous) return order.map((a) => AGES[a].label).join(" · ");
  if (order.length === 1) return `${AGES[order[0]].label} ${AGES[order[0]].range}`;
  return `Ages ${AGE_SPAN[order[0]][0]}–${AGE_SPAN[order[order.length - 1]][1]}`;
}
const ageChips = (ages) => `<span class="tag t-age">${esc(ageText(ages))}</span>`;
// "More info at mommypoppins.com →": the page where parents get full details.
const host = (u) => { try { return new URL(u).hostname.replace(/^www\./, ""); } catch { return "the organizer's site"; } };
const moreInfo = (url) => `<a class="moreinfo" href="${esc(url)}" target="_blank" rel="noopener" title="Opens ${esc(host(url))}">More info <span aria-hidden="true">↗</span><span class="sr"> (opens ${esc(host(url))})</span></a>`;
// A photo across the top of a card, with its credit.
function photo(x, cls = "cphoto") {
  if (!x?.image) return "";
  const small = x.image.replace(/(\.\w+)$/, "-800$1");
  const hasSmall = existsSync(join(ROOT, "public", small));
  // Cards are narrow: the 800px copy is sharp enough everywhere. Bigger spots (event pages, the story) pick by screen.
  const img = cls === "cphoto" && hasSmall
    ? `<img src="${esc(small)}" alt="${esc(x.imageAlt)}" loading="lazy">`
    : `<img src="${esc(x.image)}"${hasSmall ? ` srcset="${esc(small)} 800w, ${esc(x.image)} 1400w" sizes="(max-width: 860px) 100vw, 640px"` : ""} alt="${esc(x.imageAlt)}" loading="lazy">`;
  return `<figure class="${cls}">${img}<figcaption>${esc(x.imageCredit)}</figcaption></figure>`;
}
const flagChips = (x) =>
  `${x.free ? '<span class="tag t-free">Free</span>' : `<span class="tag t-paid">${esc(x.cost || "Paid")}</span>`}${x.indoor ? '<span class="tag t-in">Indoors</span>' : ""}${x.status === "tentative" ? '<span class="tag t-tent" title="The organizer hasn&#39;t announced a final date yet, or sources disagree. We&#39;ll update it when it&#39;s set.">Date may change</span>' : ""}`;
const dataAttrs = (x) => `data-ages="${x.ages.join(" ")}" data-free="${x.free ? 1 : 0}" data-indoor="${x.indoor ? 1 : 0}"`;

const CLOCK = `<svg class="mi" viewBox="0 0 16 16" aria-hidden="true"><circle cx="8" cy="8" r="6.5" fill="none" stroke="currentColor" stroke-width="1.8"/><path d="M8 4.5V8l2.5 1.5" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>`;
const PIN = `<svg class="mi" viewBox="0 0 16 16" aria-hidden="true"><path d="M8 15s5-4.6 5-8.5A5 5 0 0 0 3 6.5C3 10.4 8 15 8 15z" fill="none" stroke="currentColor" stroke-width="1.8"/><circle cx="8" cy="6.5" r="1.8" fill="currentColor"/></svg>`;

function whereLink(data, x) {
  const place = x.placeId && placeById(data, x.placeId);
  const where = whereText(data, x);
  return place ? `<a href="/places/#${esc(place.id)}">${esc(where)}</a>` : esc(where);
}

// A dated event as a card with a tear-off-calendar date tile.
// The tear-off calendar tile: weekday, big date, month. Ongoing events show "On now · until 31 Oct".
function dateTile(x, wk) {
  const a = dateParts(x.date);
  const multi = x.endDate && x.endDate !== x.date;
  const b = multi ? dateParts(x.endDate) : null;
  const ongoing = multi && wk.now && x.date < wk.now;
  const day = ongoing ? `${b.day}` : multi ? (a.mon === b.mon ? `${a.day}–${b.day}` : `${a.day}`) : `${a.day}`;
  const dow = ongoing ? "On now" : multi ? `${a.dow}–${b.dow}` : a.dow;
  const mon = ongoing ? `until ${b.mon}` : multi && a.mon !== b.mon ? `${a.mon}–${b.mon}` : a.mon;
  return `<div class="datetile"><span class="dt-dow">${dow}</span><span class="dt-day${day.length > 3 ? " small" : ""}">${day}</span><span class="dt-mon">${mon}</span></div>`;
}

// An event without its own photo uses its place's photo, when we have one.
function eventPhoto(data, x) {
  if (x.image) return x;
  const place = x.placeId && placeById(data, x.placeId);
  return place?.image ? place : null;
}

function eventCard(data, x, i, wk) {
  const theme = themeOf(x);
  const pic = eventPhoto(data, x);
  return `<article class="ecard${pic ? " has-photo" : ""}" ${dataAttrs(x)}>
    ${photo(pic)}
    <div class="ecard-top">
      ${dateTile(x, wk)}
      ${THEME_ICONS[theme]()}
    </div>
    <h3><a class="card-link" href="${eventPath(x)}">${esc(x.title)}</a></h3>
    ${x.kind === "recurring" ? `<span class="weekly-pill">${x.days.length >= 5 ? `${esc(x.days[0])}–${esc(x.days[x.days.length - 1])} every week` : `Every ${esc(x.days.map((d) => WEEK_LONG[d].slice(0, 3)).join(" & "))}`}</span>` : ""}
    <p class="meta">${CLOCK}<span>${fmtTimeRange(x.startTime, x.endTime)}</span></p>
    <p class="meta">${PIN}<span>${whereLink(data, x)}</span></p>
    <p class="desc clamp-2">${esc(x.description)}</p>
    <div class="tags">${ageChips(x.ages)}${flagChips(x)}</div>
    ${moreInfo(x.url)}
  </article>`;
}

// A weekly program, listed once, with the days it runs lit up.
function weeklyCard(data, r, i) {
  const week = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  const pic = eventPhoto(data, r);
  return `<article class="wcard${pic ? " has-photo" : ""}" ${dataAttrs(r)}>
    ${photo(pic)}
    <div class="dots" aria-label="${esc(r.days.join(", "))}">${week.map((d) => `<span class="${r.days.includes(d) ? "on" : ""}" aria-hidden="true">${d[0]}</span>`).join("")}</div>
    <h3><a class="card-link" href="${eventPath(r)}">${esc(r.title)}</a></h3>
    <p class="meta">${CLOCK}<span>${r.frequency ? `${esc(r.frequency)} · ` : ""}${fmtTimeRange(r.startTime, r.endTime)}</span></p>
    <p class="meta">${PIN}<span>${whereLink(data, r)}</span></p>
    ${r.registration ? `<p class="desc">${esc(r.registration)}</p>` : ""}
    <div class="tags">${ageChips(r.ages)}${flagChips(r)}</div>
    ${moreInfo(r.url)}
  </article>`;
}

function filterBar(id) {
  return `<div class="filters" data-filter-for="${id}" role="group" aria-label="Filter listings">
    <label class="age-pick"><span class="sr">Ages</span>
      <select data-age-select>
        <option value="all">All ages</option>
        ${Object.entries(AGES).map(([k, v]) => `<option value="${k}">${v.label} (${v.range})</option>`).join("")}
      </select>
    </label>
    <button class="chip" type="button" data-flag="free" aria-pressed="false">Free</button>
    <button class="chip" type="button" data-flag="indoor" aria-pressed="false">Indoors</button>
  </div>`;
}

function breakNotices(data, start, end) {
  const breaks = eventsBetween(data.events.filter((e) => e.kind === "school-break"), start, end);
  return breaks
    .map((b) => `<div class="notice"><strong>No school: ${esc(b.title)}</strong> · ${fmtDateRange(b.date, b.endDate)}. ${esc(b.description)} <a href="${esc(b.url)}" rel="noopener">District calendar</a></div>`)
    .join("");
}

// Places page: shown by site.js when the filters hide everything.
const emptyFilter = `<div class="empty-state empty-filter" hidden>${bubblesIllo()}<div><h3>Nothing matches those filters</h3><p>Try another age group, or turn off Free or Indoors.</p></div></div>`;
const groupEmpty = `<p class="group-empty" hidden>Nothing here matches those filters. Try another age, or turn off Free or Indoors.</p>`;
const REGION_ART = { local: () => bubblesIllo(), houston: () => kiteIllo() };

function regionHead(area, extra = "", count = 0) {
  return `<div class="region-head">
    <div class="region-art">${REGION_ART[area]()}</div>
    <div><p class="label">${esc(AREAS[area].label)}${count ? ` · ${count} this week` : ""}</p><h2>${esc(AREAS[area].title)}</h2></div>
    ${extra}
  </div>`;
}

function upcomingByArea(data, from, to) {
  const all = eventsBetween(data.events.filter((e) => e.kind === "event"), from, to);
  return { local: all.filter((e) => areaOf(data, e) === "local"), houston: all.filter((e) => areaOf(data, e) === "houston") };
}

function weeklySection(data) {
  if (!data.recurring.length) return "";
  const order = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  const list = [...data.recurring].sort((a, b) => order.indexOf(a.days[0]) - order.indexOf(b.days[0]) || (a.startTime || "").localeCompare(b.startTime || ""));
  return `<section class="band region regulars zone" id="every-week" data-group><div class="wrap">
    <div class="region-head">
      <div class="region-art">${readerIllo()}</div>
      <div><p class="label">The regulars</p><h2>Every week</h2><p class="quiet">Storytimes and open play you can count on.</p></div>
    </div>
    <div class="wcards">${list.map((r, i) => weeklyCard(data, r, i)).join("")}</div>${groupEmpty}
  </div></section>`;
}

// The story of the week: big photo, short teaser. Leads the Neighborhood news section.
function storyBanner(n) {
  return `<article class="story${n.image ? "" : " no-photo"}">
      ${n.image ? photo(n, "story-photo") : `<div class="story-art">${toddlerIllo()}</div>`}
      <div class="story-copy">
        <span class="ribbon">Story of the week</span>
        <p class="ncat">${esc(NEWS_CATEGORIES[n.category])} · ${fmtShort(n.date)}</p>
        <h3>${esc(n.title)}</h3>
        <p class="desc">${esc(n.summary)}</p>
        <a class="btn" href="/news/#${esc(n.id)}">Read the story</a>
      </div>
    </article>`;
}

// A neighborhood news item: our short summary, linking to the original story.
function newsCard(n, i) {
  const feature = n.featured && n.story?.length;
  return `<article class="ncard${feature ? " feature" : ""}${n.image ? " has-photo" : ""}" id="${esc(n.id)}">
    ${feature ? '<span class="ribbon">Story of the week</span>' : ""}
    ${n.image ? photo(n, feature ? "nfig-top" : "cphoto") : ""}
    <div class="ncard-top">${THEME_ICONS[NEWS_ICONS[n.category]]()}<div><span class="ncat">${esc(NEWS_CATEGORIES[n.category])}</span><span class="ndate">${fmtShort(n.date)}</span></div></div>
    <h3><a href="${esc(n.url)}" rel="noopener">${esc(n.title)}</a></h3>
    ${feature ? n.story.map((p) => `<p class="desc">${esc(p)}</p>`).join("") : `<p class="desc clamp-3">${esc(n.summary)}</p>`}
    ${feature && n.moreLinks?.length ? `<p class="morelinks">${n.moreLinks.map((l) => `<a href="${esc(l.url)}" rel="noopener">${esc(l.label)} →</a>`).join("")}</p>` : ""}
    ${feature
      ? `<div class="feature-foot"><a class="nsource" href="${esc(n.url)}" rel="noopener">Read more at ${esc(n.source)} →</a>${n.image ? "" : `<div class="feature-art">${toddlerIllo()}</div>`}</div>`
      : `<a class="nsource" href="${esc(n.url)}" rel="noopener">Read more at ${esc(n.source)} →</a>`}
  </article>`;
}

// ---------- kid-friendly eats ----------

const WEEK = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const WEEK_LONG = { Mon: "Monday", Tue: "Tuesday", Wed: "Wednesday", Thu: "Thursday", Fri: "Friday", Sat: "Saturday", Sun: "Sunday" };

function dealChip(d) {
  const when = d.startTime ? fmtTimeRange(d.startTime, d.endTime) : "All day";
  return `<a class="deal ${d.area}" href="${esc(d.url)}" rel="noopener">
    <b>${esc(d.name)}</b><span class="deal-what">${esc(d.title)}</span>
    <span class="deal-meta">${esc(when)}${d.place ? ` · ${esc(d.place)}` : ""}</span>
    <span class="deal-terms">${esc(d.details)}</span>
  </a>`;
}

// Homepage carousel: the next 7 days of deals, one small card per deal per day.
function dealCarousel(data, now) {
  const deals = activeDeals(data, now);
  const cards = [];
  for (let n = 0; n < 7; n++) {
    const d = addDays(now, n);
    const day = weekday(d);
    const label = n === 0 ? "Today" : n === 1 ? "Tomorrow" : WEEK_LONG[day];
    deals
      .filter((x) => x.days.includes(day))
      .sort((a, b) => (a.area === "local" ? -1 : 1) - (b.area === "local" ? -1 : 1))
      .forEach((x) => cards.push(`<a class="dcard ${x.area}${n === 0 ? " today" : ""}" href="${esc(x.url)}" target="_blank" rel="noopener">
        <span class="dday">${label}</span>
        <b>${esc(x.name)}</b>
        <span class="deal-what">${esc(x.title)}</span>
        <span class="deal-meta">${x.startTime ? fmtTimeRange(x.startTime, x.endTime) : "All day"}${x.place ? ` · ${esc(x.place)}` : ""}</span>
      </a>`));
  }
  return cards.length ? `<div class="dcarousel">${cards.join("")}</div>` : "";
}

// One column per weekday, today's highlighted.
function dealBoard(data, now, { compact = false } = {}) {
  const deals = activeDeals(data, now);
  const today = weekday(now);
  const days = compact ? [0, 1, 2, 3].map((n) => weekday(addDays(now, n))) : WEEK;
  return `<div class="dealboard${compact ? " compact" : ""}">${days
    .map((day) => {
      const list = deals.filter((d) => d.days.includes(day)).sort((a, b) => (a.area === "local" ? -1 : 1) - (b.area === "local" ? -1 : 1));
      return `<section class="dealday${day === today ? " today" : ""}">
        <h3>${day === today ? "Today" : WEEK_LONG[day]}</h3>
        ${list.length ? list.map(dealChip).join("") : '<p class="deal-none">No deals we know of yet. Know one? Tell us!</p>'}
      </section>`;
    })
    .join("")}</div>`;
}

// The restaurant's logo when we have one; otherwise a round badge with its initials.
function restaurantBadge(r, i) {
  if (r.logo) return `<span class="rbadge logo"><img src="${esc(r.logo)}" alt="${esc(r.name)} logo" loading="lazy"></span>`;
  const words = r.name.replace(/^the\s+/i, "").split(/[\s–-]+/).filter((w) => /^[a-z0-9]/i.test(w));
  const initials = (words[0]?.[0] || "") + (words[1]?.[0] || "");
  return `<span class="rbadge" aria-hidden="true">${esc(initials.toUpperCase())}</span>`;
}

function restaurantCard(data, r, i) {
  const deals = activeDeals(data, "0000-00-00").filter((d) => d.restaurantId === r.id);
  return `<article class="rcard${r.image ? " has-photo" : ""}" data-perks="${r.perks.join(" ")}">
    ${photo(r)}
    <div class="rcard-head">${restaurantBadge(r, i)}<h3><a href="${esc(r.url)}" rel="noopener">${esc(r.name)}</a></h3><span class="price">${esc(r.price)}</span></div>
    <p class="meta">${PIN}<span>${esc(r.address || r.neighborhood)}</span></p>
    <p class="desc clamp-3">${esc(r.description)}</p>
    ${r.tip ? `<p class="tip"><b>Parent tip:</b> ${esc(r.tip)}</p>` : ""}
    ${deals.map((d) => `<p class="rdeal">${esc(d.title)} · ${d.days.map((x) => WEEK_LONG[x]).join(" & ")}${d.startTime ? `, ${fmtTimeRange(d.startTime, d.endTime)}` : ""}</p>`).join("")}
    <div class="tags">${r.perks.map((p) => `<span class="tag t-perk">${esc(PERKS[p])}</span>`).join("")}</div>
  </article>`;
}

export function eatsPage(data, now) {
  const { config } = data;
  const byArea = (a) => data.restaurants.filter((r) => r.area === a);
  const group = (area) => {
    const list = byArea(area);
    return list.length ? `<section class="band region" data-group><div class="wrap">
      <div class="region-head"><div class="region-art">${area === "local" ? toddlerIllo() : kiteIllo()}</div>
        <div><p class="label">${esc(AREAS[area].label)}</p><h2>${area === "local" ? "Spring Branch & Memorial" : "Surrounding Houston"}</h2></div></div>
      <div class="rcards">${list.map((r, i) => restaurantCard(data, r, i)).join("")}</div>
      <p class="group-empty" hidden>Nothing here has all of those. Try fewer filters.</p>
    </div></section>` : "";
  };
  const body = `
  <section class="page-head"><div class="wrap head-art"><div class="head-copy">
    <p class="label">Kid-friendly eats</p>
    <h1>Where to eat with <span class="script pink">littles</span></h1>
    <p class="lede">Restaurants with play areas, patios and kids' menus, plus the kids-eat-free nights worth planning around.</p>
    <p class="jump"><a href="#deals">Kids eat free</a><a href="#restaurants">Restaurants</a></p>
  </div>${iceCreamIllo()}</div></section>

  <section class="band zone" id="deals"><div class="wrap">
    <div class="sec-head"><div><p class="label">Deals by day</p><h2>Kids eat free ${SPARK}</h2></div></div>
    ${dealBoard(data, now)}
    <p class="quiet deal-note">Deals change often and usually need an adult entrée. Call ahead or check the restaurant's site before you go. Deals with a green edge are close to home.</p>
  </div></section>

  <section class="band whatson" id="restaurants"><div class="wrap">
    <div class="sec-head"><div><p class="label">Our list</p><h2>Kid-friendly restaurants ${SPARK}</h2></div></div>
    <div class="filters perk-filters" data-perk-for="rest-list" role="group" aria-label="Filter restaurants">
      ${["play-area", "indoor-play", "patio", "kids-menu"].map((p) => `<button class="chip" type="button" data-perk="${p}" aria-pressed="false">${esc(PERKS[p])}</button>`).join("")}
    </div>
  </div></section>
  <div id="rest-list">${group("local")}${group("houston")}</div>
  <section class="band"><div class="wrap"><p class="quiet">Is your favorite family spot missing? Email <span class="select">${esc(config.contactEmail)}</span>.</p></div></section>`;
  return layout(config, { title: "Kid-friendly eats", path: "/eats/", body, now, description: "Kid-friendly restaurants with play areas and patios in Spring Branch, Memorial and Houston, plus kids-eat-free deals by day." });
}

// ---------- pages ----------

export function homePage(data, now) {
  const { config } = data;
  const wk = { ...weekendOf(now), now };
  const weekEnd = addDays(now, 6);
  const soon = upcomingByArea(data, now, weekEnd);
  const later = upcomingByArea(data, addDays(now, 7), addDays(now, 120));
  // Local weekly programs show up on their next date this week, alongside one-off events.
  const weekly = [];
  const seen = new Set();
  // Skip programs that only run on "selected" days; we can't say which date it falls on.
  const regular = data.recurring.filter((r) => !r.frequency || r.from);
  for (const r of recurringBetween(regular, now, weekEnd)) if (!seen.has(r.id) && seen.add(r.id)) weekly.push(r);
  const region = (area) => {
    const list = [...soon[area], ...weekly.filter((r) => areaOf(data, r) === area)].sort((a, b) => a.date.localeCompare(b.date) || (a.startTime || "99").localeCompare(b.startTime || "99"));
    const more = later[area].length ? `<a class="more" href="/events/#${area}">${later[area].length} more coming up →</a>` : "";
    return `<section class="band region" id="${area}" data-group><div class="wrap">
      ${regionHead(area, more, list.length)}
      ${list.length
        ? `<div class="ecards strip">${list.map((x, i) => eventCard(data, x, i, wk)).join("")}</div>${groupEmpty}`
        : `<p class="quiet">Nothing listed for this week yet${later[area].length ? `. <a href="/events/#${area}">See what's coming up</a>.` : ", but new events are added every Sunday and Wednesday."}</p>`}
    </div></section>`;
  };
  const weekCount = soon.local.length + soon.houston.length + weekly.length;
  const story = featuredStory(data, now);
  const news = currentNews(data, now, 45).filter((n) => n !== story).slice(0, 3);
  const week = Math.floor(Date.parse(`${now}T12:00:00Z`) / (7 * 864e5));
  const spot = [0, 1, 2].map((i) => data.places[(week * 3 + i) % data.places.length]).filter((p, i, a) => a.indexOf(p) === i);
  const body = `
  <section class="hero"><div class="wrap hero-grid">
    <img class="hero-logo" src="/img/logo.webp" alt="Spring Branch Littles" width="900" height="778">
    <div class="hero-copy">
      <h1>Weekend plans for your <span class="script">littles</span>, sorted<span class="pink-dot">.</span></h1>
      <p class="lede">Storytimes, parks, festivals and kids-eat-free nights in Spring Branch &amp; Memorial, for babies through elementary schoolers.</p>
    <div class="signup-card peek">
      <img class="peek-dino" src="/img/dino-head.png" alt="" width="512" height="512">
      <h2>${esc(config.newsletterName)}</h2>
      <p>Two weeks of kid-friendly plans, every Monday. Free, and short enough for nap time.</p>
      ${signupForm(config, "hero")}
    </div>
    </div>
  </div></section>
  ${GRASS}

  <div class="zone">
  <section class="band whatson"><div class="wrap">
    <div class="sec-head"><div><p class="label">${fmtShort(now)} – ${fmtShort(weekEnd)} · ${weekCount} things to do</p><h2>This week ${SPARK}</h2></div><a class="more" href="/events/">Coming up →</a></div>
    ${breakNotices(data, now, weekEnd)}
    ${filterBar("listings")}
  </div></section>
  <div id="listings" class="filterable">
    ${region("local")}
    ${region("houston")}
  </div>
  </div>

  <section class="band midsignup"><div class="wrap"><div class="mid-card">
    <div class="mid-art">${bubblesIllo()}</div>
    <div class="mid-copy">
      <h2>Like this? Get it every week.</h2>
      <p>${esc(config.newsletterName)} lands every Monday with the next two weeks of kid-friendly plans, so you can get them on the calendar. Free.</p>
      ${signupForm(config, "mid")}
    </div>
  </div></div></section>

  ${story || news.length ? `<section class="band zone news-band"><div class="wrap">
    <div class="sec-head"><div><p class="label">What parents should know</p><h2>Neighborhood news ${SPARK_PINK}</h2></div><a class="more" href="/news/">All news →</a></div>
    ${story ? storyBanner(story) : ""}
    ${news.length ? `<div class="ncards">${news.map(newsCard).join("")}</div>` : ""}
  </div></section>` : ""}

  ${data.deals.length ? `<section class="band"><div class="wrap">
    <div class="sec-head"><div><p class="label">Eat with the family</p><h2>Kid-friendly restaurants ${SPARK_PINK}</h2></div><a class="more" href="/eats/">All kid-friendly eats →</a></div>
    ${dealCarousel(data, now)}
  </div></section>` : ""}

  <section class="band zone"><div class="wrap">
    <div class="sec-head"><div><p class="label">Worth a visit</p><h2>Places to try this weekend ${SPARK}</h2></div><a class="more" href="/places/">All places →</a></div>
    <div class="places">${spot.map((p) => placeCard(p, { short: true })).join("")}</div>
  </div></section>

  <section class="band ages-band"><div class="wrap">
    <div class="sec-head"><div><p class="label">Find your stage</p><h2>Browse by age ${SPARK_PINK}</h2></div></div>
    <div class="ages">${Object.entries(AGES).map(([k, v], i) => `<a class="age-card" href="/events/?age=${k}">${AGE_ILLOS[k]()}<b>${v.label}</b><span class="script">ages ${v.range}</span></a>`).join("")}</div>
  </div></section>

  ${data.gallery.length >= 3 ? `<section class="band"><div class="wrap">
    <div class="sec-head"><div><p class="label">Seen around the neighborhood</p><h2>Our week in photos ${SPARK}</h2></div></div>
    <div class="gallery">${data.gallery.slice(0, 7).map((g, i) => `<figure class="g${i}"><img src="${esc(g.image)}" alt="${esc(g.imageAlt)}" loading="lazy"><figcaption>${esc(g.caption)}</figcaption></figure>`).join("")}</div>
  </div></section>` : ""}

  <section class="band"><div class="wrap app-cta">
    <img class="app-cta-icon" src="/icons/icon-192.png" alt="" width="192" height="192">
    <div>
      <p class="label">On your phone</p>
      <h2>Get the <span class="script">Littles</span> app</h2>
      <p>Put this week's plans on your home screen, and get a Thursday alert with the weekend's best picks. Free, no app store needed.</p>
    </div>
    <a class="btn" href="/app/">Get the app</a>
  </div></section>

  <section class="band zone"><div class="wrap ig-cta">
    <div class="ig-art">${toddlerIllo()}<img class="ig-dino" src="/img/dino-head.png" alt="" width="512" height="512"></div>
    <div>
      <p class="label">On Instagram</p>
      <h2>Come say hi <span class="script">@${esc(config.instagram)}</span></h2>
      <p>Weekend roundups, honest reviews of places we've taken our own kids, and same-day reminders in Stories.</p>
    </div>
    <a class="btn btn-ghost" href="https://instagram.com/${esc(config.instagram)}">Follow on Instagram</a>
  </div></section>`;
  return layout(config, { title: "", path: "/", body, now, description: `${config.description} Updated weekly. This weekend: ${fmtShort(wk.start)}–${fmtShort(wk.end)}.` });
}

export function eventsPage(data, now) {
  const { config } = data;
  const wk = { ...weekendOf(now), now };
  const start = addDays(now, 7);
  const later = upcomingByArea(data, start, addDays(now, 150));
  const region = (area) => {
    const months = new Map();
    for (const e of later[area]) {
      const m = fmtMonth(e.date < start ? start : e.date);
      if (!months.has(m)) months.set(m, []);
      months.get(m).push(e);
    }
    return `<section class="band region${area === "local" ? " zone" : ""}" id="${area}" data-group><div class="wrap">
      ${regionHead(area)}
      ${months.size
        ? [...months.entries()].map(([m, list]) => `<div class="month" data-day><h3 class="month-head">${esc(m)}</h3><div class="ecards">${list.map((x, i) => eventCard(data, x, i, wk)).join("")}</div></div>`).join("") + groupEmpty
        : `<p class="quiet">Nothing listed after this week yet. New events are added every Sunday and Wednesday.</p>`}
    </div></section>`;
  };
  const body = `
  <section class="page-head"><div class="wrap head-art"><div class="head-copy">
    <p class="label">Calendar · from ${fmtShort(start)}</p>
    <h1>Coming up for <span class="script pink">littles</span> ${SPARK}</h1>
    <p class="lede">Everything after this week, close to home and around Houston, plus the storytimes and playtimes that happen every week. For the next few days, see <a href="/">This week</a>.</p>
    <p class="jump"><a href="#local">Spring Branch & Memorial</a><a href="#houston">Surrounding Houston</a><a href="#every-week">Every week</a></p>
  </div>${kiteIllo()}</div></section>
  <section class="band whatson"><div class="wrap">
    ${breakNotices(data, start, addDays(now, 150))}
    ${filterBar("listings")}
  </div></section>
  <div id="listings" class="filterable">
    ${region("local")}
    ${region("houston")}
    ${weeklySection(data)}
  </div>`;
  return layout(config, { title: "Calendar", path: "/events/", body, now, description: "Plan ahead: upcoming kids' events in Spring Branch, Memorial and around Houston, month by month, filterable by age." });
}

const PLACE_ICON = { library: "story", park: "nature", "indoor-play": "party", nature: "nature", attraction: "museum" };
function placeCard(p, { short = false } = {}) {
  return `<article class="place t-${esc(p.type)}${p.image ? " has-photo" : ""}" id="${esc(p.id)}" ${dataAttrs(p)}>
    ${p.image ? photo(p) : `<div class="place-band">${THEME_ICONS[PLACE_ICON[p.type]]()}</div>`}
    <p class="label">${esc(PLACE_TYPES[p.type])}</p>
    <h3><a href="${esc(p.url)}" rel="noopener">${esc(p.name)}</a></h3>
    <p class="clamp-3">${esc(p.description)}</p>
    ${p.tip && !short ? `<p class="tip"><b>Parent tip:</b> ${esc(p.tip)}</p>` : ""}
    <p class="addr">${PIN}<span>${esc(p.address)}</span></p>
    <div class="tags">${ageChips(p.ages)}${flagChips(p)}</div>
  </article>`;
}

export function placesPage(data, now) {
  const { config } = data;
  const body = `
  <section class="page-head"><div class="wrap head-art"><div class="head-copy">
    <p class="label">Places</p>
    <h1>Where to go with <span class="script">littles</span> in Spring Branch & Memorial</h1>
    <p class="lede">Libraries, parks, nature trails and indoor play, with tips from parents who've been.</p>
  </div>${bubblesIllo()}</div></section>
  <section class="band"><div class="wrap">
    ${filterBar("places")}
    <div id="places" class="filterable">${emptyFilter}
      ${Object.entries(PLACE_TYPES)
        .map(([type, label]) => {
          const list = data.places.filter((p) => p.type === type);
          return list.length ? `<section class="day" data-day><h2 class="day-head"><span>${esc(label)}</span></h2><div class="places">${list.map(placeCard).join("")}</div></section>` : "";
        })
        .join("")}
    </div>
  </div></section>`;
  return layout(config, { title: "Places", path: "/places/", body, now, description: "Kid-friendly libraries, parks, playgrounds and indoor play spaces in Spring Branch and Memorial, Houston." });
}

export function newsPage(data, now) {
  const { config } = data;
  const top = featuredStory(data, now);
  const news = [...(top ? [top] : []), ...currentNews(data, now, 90).filter((n) => n !== top)];
  const body = `
  <section class="page-head"><div class="wrap head-art"><div class="head-copy">
    <p class="label">News</p>
    <h1>Neighborhood news for <span class="script pink">parents</span></h1>
    <p class="lede">New playgrounds, openings, closures, school updates and heads-ups for families in Spring Branch and Memorial, in a few sentences each, with a link to the full story.</p>
  </div>${readerIllo()}</div></section>
  <section class="band"><div class="wrap">
    ${news.length ? `<div class="ncards">${news.map(newsCard).join("")}</div>` : '<p class="quiet">News is added every week.</p>'}
    <p class="quiet news-note">Know something other parents should hear about? Email <span class="select">${esc(config.contactEmail)}</span>.</p>
  </div></section>`;
  return layout(config, { title: "News", path: "/news/", body, now, description: "Neighborhood news for parents in Spring Branch and Memorial, Houston: openings, parks, schools and heads-ups." });
}

// A focused landing page for ads and social links: what you get, a taste of this week, sign up.
export function joinPage(data, now) {
  const { config } = data;
  const wk = { ...weekendOf(now), now };
  const picks = eventsBetween(data.events.filter((e) => e.kind === "event"), now, addDays(now, 13))
    .sort((a, b) => Number(!!b.featured) - Number(!!a.featured) || (areaOf(data, a) === "local" ? -1 : 1) - (areaOf(data, b) === "local" ? -1 : 1))
    .slice(0, 3)
    .sort((a, b) => a.date.localeCompare(b.date));
  const body = `
  <section class="join-hero"><div class="wrap join-grid">
    <img class="join-logo" src="/img/logo.webp" alt="Spring Branch Littles" width="900" height="778">
    <div class="join-copy">
      <p class="script pink" style="font-size:30px">Spring Branch &amp; Memorial parents</p>
      <h1>Never miss a storytime, festival or kids-eat-free night again.</h1>
      <ul class="join-points">
        <li>${readerIllo()}<span><b>One short email a week</b> with the best things to do with kids this weekend</span></li>
        <li>${iceCreamIllo()}<span><b>Storytimes, parks, festivals</b> and where kids eat free, close to home</span></li>
        <li>${kiteIllo()}<span><b>Babies through elementary,</b> with every link going straight to the organizer</span></li>
      </ul>
      <div class="signup-card">
        <h2>Get ${esc(config.newsletterName)}, free</h2>
        ${signupForm(config, "join")}
        <p class="quiet">No spam, ever. Unsubscribe with one click.</p>
      </div>
    </div>
  </div></section>
  ${picks.length ? `<section class="band"><div class="wrap">
    <div class="sec-head"><div><p class="label">A taste of what you'll get</p><h2>Coming up soon ${SPARK_PINK}</h2></div><a class="more" href="/">See this week →</a></div>
    <div class="ecards">${picks.map((x, i) => eventCard(data, x, i, wk)).join("")}</div>
  </div></section>` : ""}`;
  return layout(config, { title: "Join The Littles List", path: "/join/", body, now, description: `${config.newsletterName}: free weekly kid-friendly finds for Spring Branch & Memorial parents.` });
}

export function newsletterPage(data, now) {
  const { config, issues } = data;
  const body = `
  <section class="page-head"><div class="wrap narrow head-art"><div class="head-copy">
    <p class="label">Newsletter</p>
    <h1>${esc(config.newsletterName)} ${SPARK}</h1>
    <p class="lede">${esc(config.newsletterBlurb)}, every Monday morning: the next two weeks of things to do with kids in Spring Branch and Memorial, the week's storytimes, kids-eat-free nights and what to plan for further out. Free, and you can unsubscribe any time.</p>
    <div class="signup-card">${signupForm(config, "nl")}</div>
  </div>${readerIllo()}</div></section>
  <section class="band"><div class="wrap narrow">
    <h2>Past issues</h2>
    ${issues.length ? `<ul class="archive">${issues.map((i) => `<li><a href="/newsletter/${i.date}/">${esc(i.subject)}</a><span>${fmtLong(i.date)}</span></li>`).join("")}</ul>` : '<p class="quiet">The first issue goes out soon.</p>'}
  </div></section>`;
  return layout(config, { title: "Newsletter", path: "/newsletter/", body, now, description: `${config.newsletterName}: a free weekly email of kid-friendly finds in Spring Branch and Memorial, Houston.` });
}

export function issuePage(data, issue, now) {
  const { config } = data;
  const body = `
  <section class="page-head"><div class="wrap narrow">
    <p class="label"><a href="/newsletter/">Newsletter</a> · ${fmtLong(issue.date)}</p>
    <h1>${esc(issue.subject)}</h1>
    ${issue.intro.map((p) => `<p class="lede">${esc(p)}</p>`).join("")}
  </div></section>
  <section class="band"><div class="wrap narrow issue">
    ${issue.sections
      .map((s) => s.items[0]?.feature
        ? `<h2>${esc(s.heading)}</h2><article class="issue-feature"><h3><a href="${esc(s.items[0].url)}" rel="noopener">${esc(s.items[0].title)}</a></h3>${s.items[0].image ? `<figure class="nfig"><img src="${esc(s.items[0].image.src)}" alt="${esc(s.items[0].image.alt)}" loading="lazy"><figcaption>${esc(s.items[0].image.credit)}</figcaption></figure>` : ""}${s.items[0].paragraphs.map((p) => `<p>${esc(p)}</p>`).join("")}<p><a href="${esc(s.items[0].url)}" rel="noopener">Read more at ${esc(s.items[0].when)} →</a></p></article>`
        : `<h2>${esc(s.heading)}</h2><ul class="issue-items">${s.items
        .map((i) => `<li><h3>${i.pick ? '<span title="Our pick">⭐</span> ' : ""}<a href="${esc(i.url)}" rel="noopener">${esc(i.title)}</a>${i.tentative ? ' <span class="tag t-tent" title="The organizer hasn&#39;t announced a final date yet, or sources disagree. We&#39;ll update it when it&#39;s set.">Date may change</span>' : ""}</h3>${i.news ? `<p class="quiet">${esc(i.when)}</p>` : i.deal ? `<p class="ev-where">${esc(i.when)}${i.where ? ` · ${esc(i.where)}` : ""}</p>` : `<p class="ev-where">${esc(i.when)} · ${esc(i.where)}</p><p class="quiet">${esc(i.ages)} · ${esc(i.cost)}</p>`}<p>${esc(i.description)}</p></li>`)
        .join("")}</ul>`)
      .join("")}
    <div class="signup-card"><h2>Get it in your inbox</h2>${signupForm(config, "issue")}</div>
  </div></section>`;
  return layout(config, { title: issue.subject, path: `/newsletter/${issue.date}/`, body, now, description: issue.preheader });
}

export function aboutPage(data, now) {
  const { config } = data;
  const body = `
  <section class="page-head"><div class="wrap narrow head-art"><div class="head-copy">
    <p class="label">About</p>
    <h1>Hi, <span class="script pink">neighbor!</span></h1>
    <p class="lede">${esc(config.name)} is a free guide for Spring Branch and Memorial families with kids from babies through elementary school. It started with the question every parent asks by midweek: what are we doing this weekend?</p>
  </div>${toddlerIllo()}</div></section>
  <section class="band"><div class="wrap narrow prose">
    <h2>Who's behind it</h2>
    <div class="founder">
      ${config.founderPhoto ? `<img src="${esc(config.founderPhoto)}" alt="${esc(config.founderName || "The founder")}" width="160" height="160">` : `<div class="founder-art">${babyIllo()}</div>`}
      <p>${config.founderName ? `Hi, I'm ${esc(config.founderName)}! ` : ""}${esc(config.founderBlurb || "Spring Branch Littles is made by a Spring Branch mom of littles who got tired of piecing together library calendars, Facebook groups and Instagram stories every week. Now it's all in one place, checked against the organizers' own sites, for every family in the neighborhood.")}</p>
    </div>
    <h2>What we cover</h2>
    <p>${esc(config.area)}. That means library storytimes, city and county parks, nature programs, festivals, holiday events, school-break ideas and indoor spots for Houston's rainy and 100° days.</p>
    <h2>How listings work</h2>
    <p>We check public calendars from the libraries, parks departments, schools and local venues every week. Every listing links to its source so you can confirm times before you go. Anything marked “Date may change” hasn’t had its final date announced yet.</p>
    <h2>Add your event</h2>
    <p>Hosting something for kids in Spring Branch? Email the date, time, place, ages, cost and a link to <span class="select">${esc(config.contactEmail)}</span> and we'll take a look.</p>
    <h2>Say hello</h2>
    <p>Find us on Instagram at <a href="https://instagram.com/${esc(config.instagram)}">@${esc(config.instagram)}</a>.</p>
  </div></section>`;
  return layout(config, { title: "About", path: "/about/", body, now, description: `About ${config.name}, a weekly guide for Spring Branch families.` });
}

// ---------- event pages ----------

const CAL_ICON = `<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3.5" y="5" width="17" height="15" rx="3" fill="none" stroke="currentColor" stroke-width="2"/><path d="M3.5 10h17M8 3v4M16 3v4" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>`;
const MAP_ICON = `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 21s7-6.4 7-11.5a7 7 0 0 0-14 0C5 14.6 12 21 12 21z" fill="none" stroke="currentColor" stroke-width="2"/><circle cx="12" cy="9.5" r="2.5" fill="currentColor"/></svg>`;
const SHARE_ICON = `<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="6" cy="12" r="2.6" fill="currentColor"/><circle cx="18" cy="6" r="2.6" fill="currentColor"/><circle cx="18" cy="18" r="2.6" fill="currentColor"/><path d="M8.3 10.8 15.7 7.2M8.3 13.2l7.4 3.6" stroke="currentColor" stroke-width="2"/></svg>`;

export function eventPage(data, x, now) {
  const { config } = data;
  const weekly = x.kind === "recurring" || !!x.days;
  const date = weekly ? nextOccurrence(x, now) || now : x.date;
  const item = weekly ? { ...x, kind: "recurring", date } : x;
  const path = eventPath(x);
  const pageUrl = `${config.url}${path}`;
  const address = addressOf(data, x);
  const when = weekly
    ? `${x.frequency || `Every ${x.days.map((d) => WEEK_LONG[d]).join(", ")}`}${date ? ` · next: ${fmtLong(date)}` : ""}`
    : x.endDate && x.endDate !== x.date ? `${fmtLong(x.date)} – ${fmtLong(x.endDate)}` : fmtLong(x.date);
  const wk = { ...weekendOf(now), now };
  const related = eventsBetween(data.events.filter((e) => e.kind === "event" && e.id !== x.id && areaOf(data, e) === areaOf(data, x)), now, addDays(now, 45)).slice(0, 3);
  const shareText = `${x.title} · ${when}`;
  const body = `
  <section class="page-head event-head"><div class="wrap">
    <p class="label crumbs"><a href="/">This week</a> · <a href="/events/">Calendar</a> · ${esc(AREAS[areaOf(data, x)].title)}</p>
    <div class="event-grid">
      <div class="event-art">${eventPhoto(data, x) ? photo(eventPhoto(data, x), "event-photo") : `<div class="event-icon">${dateTile(item, wk)}${THEME_ICONS[themeOf(x)]()}</div>`}</div>
      <div class="event-copy">
        <h1>${esc(x.title)}</h1>
        <ul class="event-facts">
          <li>${CAL_ICON}<span>${esc(when)}</span></li>
          <li>${CLOCK}<span>${fmtTimeRange(x.startTime, x.endTime)}</span></li>
          ${address ? `<li>${MAP_ICON}<span>${esc(address)}</span></li>` : ""}
        </ul>
        <div class="tags">${ageChips(x.ages)}${flagChips(x)}</div>
        <p class="event-desc">${esc(x.description)}</p>
        ${x.registration ? `<p class="event-reg"><b>Before you go:</b> ${esc(x.registration)}</p>` : ""}
        <div class="event-actions">
          <a class="btn btn-red" href="${esc(x.url)}" target="_blank" rel="noopener">More info at ${esc(host(x.url))} ↗</a>
          <a class="btn btn-soft" href="${esc(googleCalendarUrl(data, x, date, pageUrl))}" target="_blank" rel="noopener">${CAL_ICON} Google Calendar</a>
          <a class="btn btn-soft" href="${path}event.ics" download>${CAL_ICON} Apple / Outlook</a>
          ${address ? `<a class="btn btn-soft" href="${esc(mapsUrl(address))}" target="_blank" rel="noopener">${MAP_ICON} Directions</a>` : ""}
          <button class="btn btn-soft" type="button" data-share data-title="${esc(x.title)}" data-text="${esc(shareText)}" data-url="${esc(pageUrl)}">${SHARE_ICON} Share</button>
          <a class="btn btn-soft" href="sms:?&body=${encodeURIComponent(`${shareText} ${pageUrl}`)}">Text a friend</a>
        </div>
        <p class="share-note" hidden>Link copied!</p>
        <p class="quiet">Details can change, so check with the organizer before you head out.</p>
      </div>
    </div>
  </div></section>
  ${related.length ? `<section class="band"><div class="wrap">
    <div class="sec-head"><div><p class="label">More nearby</p><h2>You might also like ${SPARK_PINK}</h2></div><a class="more" href="/events/">Full calendar →</a></div>
    <div class="ecards">${related.map((e, i) => eventCard(data, e, i, wk)).join("")}</div>
  </div></section>` : ""}
  <section class="band"><div class="wrap narrow"><div class="signup-card">
    <h2>Get plans like this every week</h2>
    <p>${esc(config.newsletterName)}: two weeks of plans, free, every Monday.</p>
    ${signupForm(config, "event")}
  </div></div></section>`;
  return layout(config, { title: x.title, path, body, now, description: `${when}. ${x.description}` });
}

export function searchPage(data, now) {
  const body = `
  <section class="page-head"><div class="wrap narrow">
    <p class="label">Search</p>
    <h1>Find something to <span class="script pink">do</span></h1>
    <label class="sr" for="q">Search events, places, restaurants and news</label>
    <input id="q" class="search-input" type="search" placeholder="Try “storytime”, “free”, “Memorial Park”, “pizza”…" autocomplete="off" autofocus>
    <p class="quiet search-count" aria-live="polite"></p>
    <ul class="search-results" id="results"></ul>
    <noscript><p class="quiet">Search needs JavaScript. You can also browse <a href="/">This week</a> or the <a href="/events/">Calendar</a>.</p></noscript>
  </div></section>`;
  return layout(data.config, { title: "Search", path: "/search/", body, now, description: "Search kid-friendly events, places, restaurants and news in Spring Branch and Memorial." });
}

// How to install the app and turn on alerts. site.js shows the steps that fit the visitor's phone.
export function appPage(data, now) {
  const { config } = data;
  const push = !!config.oneSignalAppId;
  const body = `
  <section class="page-head"><div class="wrap narrow app-head">
    <img class="app-icon" src="/icons/icon-512.png" alt="The ${esc(config.appName)} app icon" width="512" height="512">
    <div class="head-copy">
      <p class="label">The app</p>
      <h1>Spring Branch Littles on your <span class="script pink">phone</span></h1>
      <p class="lede">This week's plans on your home screen, and an alert every Thursday with the weekend's best picks. Free, and no app store needed.</p>
    </div>
  </div></section>

  <section class="band"><div class="wrap narrow app-steps">
    <div class="app-step" data-installed hidden>
      <span class="app-num">✓</span>
      <div><h2>You're using the app</h2><p>Nice! It's on your home screen.</p></div>
    </div>

    <div class="app-step" data-install-step>
      <span class="app-num">1</span>
      <div>
        <h2>Add it to your home screen</h2>
        <div data-install-ios>
          <p><b>On iPhone or iPad</b>, in <b>Safari</b>:</p>
          <ol class="app-howto">
            <li>Tap the <b>Share</b> button <span class="ios-share" aria-hidden="true"><svg viewBox="0 0 24 24"><path d="M12 3v12M7.5 7.5 12 3l4.5 4.5M5 11v8a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-8" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg></span> at the bottom of the screen (top right on iPad).</li>
            <li>Scroll down and tap <b>Add to Home Screen</b>.</li>
            <li>Tap <b>Add</b>. Then open <b>${esc(config.appName)}</b> from your home screen.</li>
          </ol>
          <p class="quiet">Using Chrome on iPhone? Tap the Share button next to the address bar, then Add to Home Screen.</p>
        </div>
        <div data-install-android>
          <p><b>On Android</b>, in Chrome:</p>
          <p><button class="btn" type="button" data-install hidden>Install the app</button></p>
          <ol class="app-howto" data-install-manual>
            <li>Tap the <b>⋮</b> menu at the top right.</li>
            <li>Tap <b>Add to Home screen</b> (or <b>Install app</b>), then <b>Install</b>.</li>
          </ol>
        </div>
      </div>
    </div>

    <div class="app-step">
      <span class="app-num">2</span>
      <div>
        <h2>Turn on alerts</h2>
        <p>One alert on Thursday mornings with the weekend's best picks, and now and then a heads-up about a big event. You can turn them off anytime in your phone's settings.</p>
        ${push
          ? `<p><button class="btn btn-pink" type="button" data-push-on>Turn on alerts</button></p>
        <p class="push-status" data-push-status aria-live="polite"></p>
        <p class="quiet" data-push-ios-note hidden>On iPhone, alerts work once you've added the app to your home screen (step 1) and opened it from there.</p>`
          : `<p class="quiet">Alerts are coming very soon. Add the app now and you'll be ready.</p>`}
      </div>
    </div>
  </div></section>`;
  return layout(config, { title: "Get the app", path: "/app/", body, now, description: "Install Spring Branch Littles on your phone and get a Thursday alert with the weekend's best kid-friendly plans." });
}

// Shown by the app when you're offline and the page wasn't saved yet.
export function offlinePage(data, now) {
  const { config } = data;
  const body = `<section class="page-head"><div class="wrap narrow"><img class="nf-dino" src="/img/dino-head.png" alt="" width="512" height="512"><h1>You're offline</h1><p class="lede">This page isn't saved on your phone yet. Pages you've opened before still work. Try <a href="/">this week's list</a>, or check your connection and try again.</p></div></section>`;
  return layout(config, { title: "Offline", path: "/offline/", body, now });
}

export function thanksPage(data, now) {
  const { config } = data;
  const body = `
  <section class="page-head"><div class="wrap narrow head-art"><div class="head-copy">
    <p class="label">${esc(config.newsletterName)}</p>
    <h1>You're in! <span class="script pink">Welcome</span> 🦕</h1>
    <p class="lede">Check your inbox for a quick confirmation email (peek in Promotions if you don't see it). Your first issue arrives this week.</p>
    <p class="event-actions"><a class="btn" href="/">See this week's plans</a><a class="btn btn-soft" href="https://instagram.com/${esc(config.instagram)}">Follow @${esc(config.instagram)}</a></p>
    <p class="quiet">Know a parent who'd love this? Send them <span class="select">${esc(config.url.replace("https://", ""))}/join</span></p>
  </div>${toddlerIllo()}</div></section>`;
  return layout(config, { title: "Thanks for subscribing", path: "/thanks/", body, now });
}

export function notFoundPage(data, now) {
  const body = `<section class="page-head"><div class="wrap narrow"><img class="nf-dino" src="/img/dino-head.png" alt="" width="512" height="512"><h1>Oops, that page wandered off.</h1><p class="lede">Try <a href="/">this week's list</a> or the <a href="/events/">full calendar</a>.</p></div></section>`;
  return layout(data.config, { title: "Page not found", path: "/404.html", body, now });
}
