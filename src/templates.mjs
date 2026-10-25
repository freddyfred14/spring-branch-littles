// HTML templates. Every page is plain HTML with one shared stylesheet and a small script for filters.
import {
  AGES, PLACE_TYPES, DAYS, addDays, fmtDate, fmtDateRange, fmtTimeRange, fmtLong, fmtShort,
  weekdayLong, agenda, eventsBetween, placeById, whereText, weekendOf,
} from "./lib.mjs";

export const esc = (s) =>
  String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);

const LOGO = `<svg class="logo" viewBox="0 0 40 40" aria-hidden="true"><circle cx="20" cy="20" r="20" fill="var(--pine-soft)"/><path d="M20 31V14M20 22l-7-6M20 17l6-5" stroke="var(--pine)" stroke-width="2.6" stroke-linecap="round" fill="none"/><circle cx="12.5" cy="15.5" r="3" fill="var(--sun)"/><circle cx="26.5" cy="11.5" r="3" fill="var(--berry)"/></svg>`;

const NAV = [
  ["/", "This week"],
  ["/events/", "Calendar"],
  ["/places/", "Places"],
  ["/newsletter/", "Newsletter"],
  ["/about/", "About"],
];

export function signupForm(config, id = "signup") {
  return `<form class="signup-form" action="https://buttondown.com/api/emails/embed-subscribe/${esc(config.buttondownUsername)}" method="post">
    <label class="sr" for="${id}-email">Email address</label>
    <input id="${id}-email" type="email" name="email" required placeholder="you@example.com" autocomplete="email">
    <input type="hidden" name="embed" value="1">
    <button class="btn" type="submit">Subscribe</button>
  </form>`;
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
<link rel="icon" href="/favicon.svg" type="image/svg+xml">
<link rel="alternate" type="application/rss+xml" title="${esc(config.name)} newsletter" href="/feed.xml">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Young+Serif&family=Figtree:wght@400;500;600;700&display=swap">
<link rel="stylesheet" href="/assets/site.css">
</head>
<body>
<a class="skip" href="#main">Skip to content</a>
<header class="site-header"><div class="wrap">
  <a class="brand" href="/">${LOGO}<span>${esc(config.name)}</span></a>
  <nav aria-label="Main"><ul>${NAV.map(([href, label]) => `<li><a href="${href}"${href === path ? ' aria-current="page"' : ""}>${label}</a></li>`).join("")}</ul></nav>
</div></header>
<main id="main">
${body}
</main>
<footer class="site-footer"><div class="wrap footer-grid">
  <div>
    <a class="brand" href="/">${LOGO}<span>${esc(config.name)}</span></a>
    <p>${esc(config.description)}</p>
  </div>
  <div>
    <h2 class="label">Get the Thursday letter</h2>
    ${signupForm(config, "footer")}
  </div>
  <div>
    <h2 class="label">Follow along</h2>
    <p><a href="https://instagram.com/${esc(config.instagram)}">Instagram @${esc(config.instagram)}</a></p>
    <p>Tips and corrections: <span class="select">${esc(config.contactEmail)}</span></p>
  </div>
</div>
<div class="wrap fineprint">Listings are gathered from public calendars and checked regularly, but times change. Please confirm with the venue before you go. Updated ${esc(fmtLong(now))}.</div>
</footer>
<script src="/assets/site.js" defer></script>
</body>
</html>`;
}

// ---------- shared pieces ----------

const ageChips = (ages) => ages.map((a) => `<span class="tag t-age">${AGES[a].label}</span>`).join("");
const flagChips = (x) =>
  `${x.free ? '<span class="tag t-free">Free</span>' : `<span class="tag t-paid">${esc(x.cost || "Paid")}</span>`}${x.indoor ? '<span class="tag t-in">Indoors</span>' : ""}${x.status === "tentative" ? '<span class="tag t-tent">Date not final</span>' : ""}`;
const dataAttrs = (x) => `data-ages="${x.ages.join(" ")}" data-free="${x.free ? 1 : 0}" data-indoor="${x.indoor ? 1 : 0}"`;

function eventRow(data, x, { showDate = false } = {}) {
  const where = whereText(data, x);
  const place = x.placeId && placeById(data, x.placeId);
  const when =
    x.kind === "recurring"
      ? `${x.frequency ? esc(x.frequency) + " · " : ""}${fmtTimeRange(x.startTime, x.endTime)}`
      : `${showDate ? fmtDateRange(x.date, x.endDate) + " · " : ""}${fmtTimeRange(x.startTime, x.endTime)}`;
  return `<li class="ev" ${dataAttrs(x)}>
    <div class="ev-time">${when}</div>
    <div class="ev-body">
      <h3><a href="${esc(x.url)}" rel="noopener">${esc(x.title)}</a>${x.kind === "recurring" ? ' <span class="weekly">Weekly</span>' : ""}</h3>
      <p>${esc(x.description)}</p>
      <p class="ev-where">${place ? `<a href="/places/#${esc(place.id)}">${esc(where)}</a>` : esc(where)}${x.registration ? ` · ${esc(x.registration)}` : ""}</p>
    </div>
    <div class="tags">${ageChips(x.ages)}${flagChips(x)}</div>
  </li>`;
}

function filterBar(id) {
  return `<div class="filters" data-filter-for="${id}" role="group" aria-label="Filter listings">
    <button class="chip" type="button" data-age="all" aria-pressed="true">All ages</button>
    ${Object.entries(AGES).map(([k, v]) => `<button class="chip" type="button" data-age="${k}" aria-pressed="false">${v.label} <small>${v.range}</small></button>`).join("")}
    <span class="filters-sep" aria-hidden="true"></span>
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

function dayGroups(data, byDay) {
  return [...byDay.entries()]
    .map(([d, items]) => `<section class="day" data-day>
      <h3 class="day-head"><span>${weekdayLong(d)}</span> ${fmtShort(d)}</h3>
      ${items.length ? `<ul class="evs">${items.map((x) => eventRow(data, x)).join("")}</ul>` : `<p class="quiet">Nothing listed yet. A good day for a park.</p>`}
      <p class="quiet empty-filter" hidden>Nothing matches these filters on this day.</p>
    </section>`)
    .join("");
}

// ---------- pages ----------

export function homePage(data, now) {
  const { config } = data;
  const end = addDays(now, 6);
  const byDay = agenda(data, now, end);
  const later = eventsBetween(data.events.filter((e) => e.kind === "event"), addDays(end, 1), addDays(now, 45));
  const wk = weekendOf(now);
  const week = Math.floor(Date.parse(`${now}T12:00:00Z`) / (7 * 864e5));
  const spot = [0, 1, 2].map((i) => data.places[(week * 3 + i) % data.places.length]).filter((p, i, a) => a.indexOf(p) === i);
  const body = `
  <section class="hero"><div class="wrap hero-grid">
    <div>
      <p class="label">Spring Branch · Houston, Texas</p>
      <h1>Things to do with kids in <em>Spring Branch</em>, every week.</h1>
      <p class="lede">Storytimes, parks, festivals and rainy-day spots for families with babies through elementary schoolers. We check the library calendars, park schedules and neighborhood events so you don't have to.</p>
    </div>
    <div class="signup-card">
      <h2>The Thursday letter</h2>
      <p>Weekend picks, next week's storytimes and one rainy-day backup. Free, every ${esc(config.newsletterDay)} morning.</p>
      ${signupForm(config, "hero")}
    </div>
  </div></section>

  <section class="band"><div class="wrap">
    <div class="sec-head">
      <div><p class="label">${fmtShort(now)} – ${fmtShort(end)}</p><h2>This week</h2></div>
      <a class="more" href="/events/">Full calendar →</a>
    </div>
    ${breakNotices(data, now, addDays(now, 13))}
    ${filterBar("week")}
    <div id="week" class="filterable">${dayGroups(data, byDay)}</div>
  </div></section>

  ${later.length ? `<section class="band"><div class="wrap">
    <div class="sec-head"><div><p class="label">Plan ahead</p><h2>Coming up</h2></div></div>
    <ul class="evs card-list">${later.map((x) => eventRow(data, x, { showDate: true })).join("")}</ul>
  </div></section>` : ""}

  <section class="band"><div class="wrap">
    <div class="sec-head"><div><p class="label">Worth a visit</p><h2>Places to try this weekend</h2></div><a class="more" href="/places/">All places →</a></div>
    <div class="places">${spot.map(placeCard).join("")}</div>
  </div></section>

  <section class="band ages-band"><div class="wrap">
    <div class="sec-head"><div><p class="label">Find your stage</p><h2>Browse by age</h2></div></div>
    <div class="ages">${Object.entries(AGES).map(([k, v]) => `<a class="age-card" href="/events/?age=${k}"><b>${v.label}</b><span>Ages ${v.range}</span></a>`).join("")}</div>
  </div></section>

  <section class="band"><div class="wrap ig-cta">
    <div>
      <p class="label">On Instagram</p>
      <h2>@${esc(config.instagram)}</h2>
      <p>Weekend roundups, honest reviews of places we've taken our own kids, and same-day reminders in Stories.</p>
    </div>
    <a class="btn btn-ghost" href="https://instagram.com/${esc(config.instagram)}">Follow on Instagram</a>
  </div></section>`;
  return layout(config, { title: "", path: "/", body, now, description: `${config.description} Updated weekly. This weekend: ${fmtShort(wk.start)}–${fmtShort(wk.end)}.` });
}

export function eventsPage(data, now) {
  const { config } = data;
  const dated = eventsBetween(data.events.filter((e) => e.kind === "event"), now, addDays(now, 120));
  const byWeekday = DAYS.slice(1).concat("Sun").map((d) => [d, data.recurring.filter((r) => r.days.includes(d))]);
  const body = `
  <section class="page-head"><div class="wrap">
    <p class="label">Calendar</p>
    <h1>Kids' events in Spring Branch</h1>
    <p class="lede">Dated events for the next few months, plus the storytimes and open-play times that happen every week.</p>
  </div></section>
  <section class="band"><div class="wrap">
    ${filterBar("calendar")}
    <div id="calendar" class="filterable">
      ${breakNotices(data, now, addDays(now, 120))}
      <section class="day" data-day>
        <h2 class="day-head">Upcoming events</h2>
        ${dated.length ? `<ul class="evs">${dated.map((x) => eventRow(data, x, { showDate: true })).join("")}</ul>` : '<p class="quiet">New events are added every week.</p>'}
        <p class="quiet empty-filter" hidden>Nothing matches these filters.</p>
      </section>
      <h2 class="sub">Every week</h2>
      ${byWeekday
        .filter(([, list]) => list.length)
        .map(([d, list]) => `<section class="day" data-day>
          <h3 class="day-head"><span>${{ Mon: "Mondays", Tue: "Tuesdays", Wed: "Wednesdays", Thu: "Thursdays", Fri: "Fridays", Sat: "Saturdays", Sun: "Sundays" }[d]}</span></h3>
          <ul class="evs">${list.map((r) => eventRow(data, { ...r, kind: "recurring" })).join("")}</ul>
          <p class="quiet empty-filter" hidden>Nothing matches these filters on this day.</p>
        </section>`)
        .join("")}
    </div>
  </div></section>`;
  return layout(config, { title: "Calendar", path: "/events/", body, now, description: "Upcoming kids' events, storytimes and open play in Spring Branch, Houston, filterable by age." });
}

function placeCard(p) {
  return `<article class="place" id="${esc(p.id)}" ${dataAttrs(p)}>
    <p class="label">${esc(PLACE_TYPES[p.type])}</p>
    <h3><a href="${esc(p.url)}" rel="noopener">${esc(p.name)}</a></h3>
    <p>${esc(p.description)}</p>
    ${p.tip ? `<p class="tip"><b>Parent tip:</b> ${esc(p.tip)}</p>` : ""}
    <p class="addr">${esc(p.address)}</p>
    <div class="tags">${ageChips(p.ages)}${flagChips(p)}</div>
  </article>`;
}

export function placesPage(data, now) {
  const { config } = data;
  const body = `
  <section class="page-head"><div class="wrap">
    <p class="label">Places</p>
    <h1>Where to go with kids in Spring Branch</h1>
    <p class="lede">Libraries, parks, nature trails and indoor play, with tips from parents who've been.</p>
  </div></section>
  <section class="band"><div class="wrap">
    ${filterBar("places")}
    <div id="places" class="filterable">
      ${Object.entries(PLACE_TYPES)
        .map(([type, label]) => {
          const list = data.places.filter((p) => p.type === type);
          return list.length ? `<section class="day" data-day><h2 class="day-head">${esc(label)}</h2><div class="places">${list.map(placeCard).join("")}</div><p class="quiet empty-filter" hidden>Nothing matches these filters.</p></section>` : "";
        })
        .join("")}
    </div>
  </div></section>`;
  return layout(config, { title: "Places", path: "/places/", body, now, description: "Kid-friendly libraries, parks, playgrounds and indoor play spaces in Spring Branch, Houston." });
}

export function newsletterPage(data, now) {
  const { config, issues } = data;
  const body = `
  <section class="page-head"><div class="wrap narrow">
    <p class="label">Newsletter</p>
    <h1>The Thursday letter</h1>
    <p class="lede">Every ${esc(config.newsletterDay)} morning: the best things to do with kids in Spring Branch this weekend, next week's storytimes, a rainy-day backup and what's coming up. Free, and you can unsubscribe any time.</p>
    <div class="signup-card">${signupForm(config, "nl")}</div>
  </div></section>
  <section class="band"><div class="wrap narrow">
    <h2>Past issues</h2>
    ${issues.length ? `<ul class="archive">${issues.map((i) => `<li><a href="/newsletter/${i.date}/">${esc(i.subject)}</a><span>${fmtLong(i.date)}</span></li>`).join("")}</ul>` : '<p class="quiet">The first issue goes out soon.</p>'}
  </div></section>`;
  return layout(config, { title: "Newsletter", path: "/newsletter/", body, now, description: "A free weekly email of things to do with kids in Spring Branch, Houston." });
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
      .map((s) => `<h2>${esc(s.heading)}</h2><ul class="issue-items">${s.items
        .map((i) => `<li><h3><a href="${esc(i.url)}" rel="noopener">${esc(i.title)}</a>${i.tentative ? ' <span class="tag t-tent">Date not final</span>' : ""}</h3><p class="ev-where">${esc(i.when)} · ${esc(i.where)}</p><p class="quiet">${esc(i.ages)} · ${esc(i.cost)}</p><p>${esc(i.description)}</p></li>`)
        .join("")}</ul>`)
      .join("")}
    <div class="signup-card"><h2>Get it in your inbox</h2>${signupForm(config, "issue")}</div>
  </div></section>`;
  return layout(config, { title: issue.subject, path: `/newsletter/${issue.date}/`, body, now, description: issue.preheader });
}

export function aboutPage(data, now) {
  const { config } = data;
  const body = `
  <section class="page-head"><div class="wrap narrow">
    <p class="label">About</p>
    <h1>Hi, neighbor.</h1>
    <p class="lede">${esc(config.name)} is a free guide for Spring Branch families with kids from babies through elementary school. It started with one question every parent here asks on Thursday night: what are we doing this weekend?</p>
  </div></section>
  <section class="band"><div class="wrap narrow prose">
    <h2>What we cover</h2>
    <p>${esc(config.area)}. That means library storytimes, city and county parks, nature programs, festivals, holiday events, school-break ideas and indoor spots for Houston's rainy and 100° days.</p>
    <h2>How listings work</h2>
    <p>We check public calendars from the libraries, parks departments, schools and local venues every week. Every listing links to its source so you can confirm times before you go. Anything marked “Date not final” hasn't been confirmed by the organizer yet.</p>
    <h2>Add your event</h2>
    <p>Hosting something for kids in Spring Branch? Email the date, time, place, ages, cost and a link to <span class="select">${esc(config.contactEmail)}</span> and we'll take a look.</p>
    <h2>Say hello</h2>
    <p>Find us on Instagram at <a href="https://instagram.com/${esc(config.instagram)}">@${esc(config.instagram)}</a>.</p>
  </div></section>`;
  return layout(config, { title: "About", path: "/about/", body, now, description: `About ${config.name}, a weekly guide for Spring Branch families.` });
}

export function notFoundPage(data, now) {
  const body = `<section class="page-head"><div class="wrap narrow"><h1>That page wandered off.</h1><p class="lede">Try <a href="/">this week's list</a> or the <a href="/events/">full calendar</a>.</p></div></section>`;
  return layout(data.config, { title: "Page not found", path: "/404.html", body, now });
}
