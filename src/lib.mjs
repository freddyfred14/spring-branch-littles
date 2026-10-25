// Shared data loading, validation and date helpers. No dependencies.
import { readFileSync, readdirSync, existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

export const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");

export const AGES = {
  baby: { label: "Babies", range: "0–1" },
  toddler: { label: "Toddlers", range: "1–3" },
  preschool: { label: "Preschool", range: "3–5" },
  elementary: { label: "Elementary", range: "5–11" },
};
export const PLACE_TYPES = {
  library: "Libraries",
  park: "Parks & playgrounds",
  "indoor-play": "Indoor play",
  nature: "Nature",
  attraction: "Out & about",
};
// Where an event is. "local" is our home turf; "houston" is the rest of the city.
export const AREAS = {
  local: { title: "Spring Branch & Memorial", label: "Close to home" },
  houston: { title: "Surrounding Houston", label: "Worth the drive" },
};
export const NEWS_CATEGORIES = {
  openings: "New & opening",
  parks: "Parks & play",
  schools: "Schools",
  libraries: "Libraries",
  "heads-up": "Heads-up",
  community: "Community",
};
export const PERKS = {
  "play-area": "Play area",
  "indoor-play": "Indoor play",
  patio: "Patio",
  lawn: "Lawn to run",
  "kids-menu": "Kids' menu",
  "free-treat": "Free treat",
};
export const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const DAY_NAMES = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

const readJson = (p) => JSON.parse(readFileSync(join(ROOT, p), "utf8"));

export function loadAll() {
  const issuesDir = join(ROOT, "data/issues");
  const issues = existsSync(issuesDir)
    ? readdirSync(issuesDir)
        .filter((f) => /^\d{4}-\d{2}-\d{2}\.json$/.test(f))
        .map((f) => readJson(`data/issues/${f}`))
        .sort((a, b) => b.date.localeCompare(a.date))
    : [];
  return {
    config: readJson("site.config.json"),
    places: readJson("data/places.json"),
    recurring: readJson("data/recurring.json"),
    events: readJson("data/events.json"),
    news: existsSync(join(ROOT, "data/news.json")) ? readJson("data/news.json") : [],
    restaurants: existsSync(join(ROOT, "data/restaurants.json")) ? readJson("data/restaurants.json") : [],
    deals: existsSync(join(ROOT, "data/deals.json")) ? readJson("data/deals.json") : [],
    issues,
  };
}

// ---------- dates (all dates are plain YYYY-MM-DD strings in Houston time) ----------

export function today(tz = "America/Chicago") {
  if (process.env.SBL_TODAY) return process.env.SBL_TODAY;
  return new Intl.DateTimeFormat("en-CA", { timeZone: tz, year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date());
}
const toUtc = (d) => new Date(`${d}T12:00:00Z`);
export const addDays = (d, n) => {
  const x = toUtc(d);
  x.setUTCDate(x.getUTCDate() + n);
  return x.toISOString().slice(0, 10);
};
export const weekday = (d) => DAYS[toUtc(d).getUTCDay()];
export const weekdayLong = (d) => DAY_NAMES[toUtc(d).getUTCDay()];
export const fmtDate = (d) => {
  const x = toUtc(d);
  return `${DAYS[x.getUTCDay()]}, ${MONTHS[x.getUTCMonth()]} ${x.getUTCDate()}`;
};
export const fmtShort = (d) => {
  const x = toUtc(d);
  return `${MONTHS[x.getUTCMonth()]} ${x.getUTCDate()}`;
};
const MONTH_NAMES = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
export const fmtMonth = (d) => {
  const x = toUtc(d);
  return `${MONTH_NAMES[x.getUTCMonth()]} ${x.getUTCFullYear()}`;
};
export const dateParts = (d) => {
  const x = toUtc(d);
  return { dow: DAYS[x.getUTCDay()], day: x.getUTCDate(), mon: MONTHS[x.getUTCMonth()] };
};
export const fmtLong = (d) => {
  const x = toUtc(d);
  return `${DAY_NAMES[x.getUTCDay()]}, ${["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"][x.getUTCMonth()]} ${x.getUTCDate()}, ${x.getUTCFullYear()}`;
};
export function fmtTime(t) {
  if (!t) return "";
  const [h, m] = t.split(":").map(Number);
  const suffix = h >= 12 ? "pm" : "am";
  const h12 = h % 12 || 12;
  return m ? `${h12}:${String(m).padStart(2, "0")} ${suffix}` : `${h12} ${suffix}`;
}
export function fmtTimeRange(a, b) {
  if (!a) return "See listing for times";
  return b ? `${fmtTime(a)}–${fmtTime(b)}` : fmtTime(a);
}
export function fmtDateRange(a, b) {
  return b && b !== a ? `${fmtShort(a)} – ${fmtShort(b)}` : fmtDate(a);
}
// The coming weekend (Fri–Sun). On Fri/Sat/Sun this is the current weekend.
export function weekendOf(d) {
  const dow = toUtc(d).getUTCDay();
  const offset = dow === 0 ? -2 : dow === 6 ? -1 : 5 - dow;
  const fri = addDays(d, offset);
  return { start: fri, end: addDays(fri, 2) };
}

// ---------- queries ----------

export function eventsBetween(events, start, end) {
  return events
    .filter((e) => (e.endDate || e.date) >= start && e.date <= end)
    .sort((a, b) => a.date.localeCompare(b.date) || (a.startTime || "").localeCompare(b.startTime || ""));
}

// Expand weekly programs into dated occurrences between start and end inclusive.
export function recurringBetween(recurring, start, end) {
  const out = [];
  for (let d = start; d <= end; d = addDays(d, 1)) {
    const dow = weekday(d);
    for (const r of recurring) {
      if (r.days.includes(dow) && (!r.until || d <= r.until) && (!r.from || d >= r.from)) {
        out.push({ ...r, date: d, kind: "recurring" });
      }
    }
  }
  return out;
}

export function agenda(data, start, end) {
  const dated = eventsBetween(data.events.filter((e) => e.kind !== "school-break"), start, end);
  const weekly = recurringBetween(data.recurring, start, end);
  const byDay = new Map();
  for (let d = start; d <= end; d = addDays(d, 1)) byDay.set(d, []);
  for (const e of dated) {
    // multi-day events appear on the first visible day only
    const d = e.date < start ? start : e.date;
    byDay.get(d)?.push(e);
  }
  for (const e of weekly) byDay.get(e.date)?.push(e);
  for (const list of byDay.values()) list.sort((a, b) => (a.startTime || "99").localeCompare(b.startTime || "99"));
  return byDay;
}

export const placeById = (data, id) => data.places.find((p) => p.id === id);
// The story of the week, if there is one.
export const featuredStory = (data, now) => currentNews(data, now, 60).find((n) => n.featured) || null;

// News that's still worth showing: not expired, newest first.
export function currentNews(data, now, days = 60) {
  return data.news
    .filter((n) => n.date >= addDays(now, -days) && (!n.expires || n.expires >= now))
    .sort((a, b) => b.date.localeCompare(a.date));
}
// Deals still running, each with its restaurant's name and neighborhood filled in.
export function activeDeals(data, now) {
  return data.deals
    .filter((d) => !d.expires || d.expires >= now)
    .map((d) => {
      const r = d.restaurantId && data.restaurants.find((x) => x.id === d.restaurantId);
      return { ...d, name: r ? r.name : d.restaurantName, place: r ? r.neighborhood : d.where };
    });
}
export function areaOf(data, item) {
  return item.area || (item.placeId && placeById(data, item.placeId)?.area) || "local";
}
export function whereText(data, item) {
  const p = item.placeId && placeById(data, item.placeId);
  return p ? p.name : item.location || "";
}

// ---------- validation ----------

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const TIME_RE = /^([01]\d|2[0-3]):[0-5]\d$/;
const ID_RE = /^[a-z0-9-]+$/;

export function validate(data, now = today()) {
  const errors = [];
  const warnings = [];
  const err = (where, msg) => errors.push(`${where}: ${msg}`);
  const warn = (where, msg) => warnings.push(`${where}: ${msg}`);
  const checkCommon = (where, x) => {
    if (!x.id || !ID_RE.test(x.id)) err(where, "id must be lowercase letters, digits and dashes");
    if (!Array.isArray(x.ages) || !x.ages.length || x.ages.some((a) => !AGES[a])) err(where, `ages must be a non-empty list from ${Object.keys(AGES).join(", ")}`);
    if (typeof x.free !== "boolean") err(where, "free must be true or false");
    if (typeof x.indoor !== "boolean") err(where, "indoor must be true or false");
    if (!x.description || x.description.length > 400) err(where, "description is required and must be under 400 characters");
    if (x.url && !/^https:\/\//.test(x.url)) err(where, "url must start with https://");
    if (x.lastVerified != null && !DATE_RE.test(x.lastVerified)) err(where, "lastVerified must be YYYY-MM-DD or null");
    if (x.lastVerified && x.lastVerified > now) err(where, "lastVerified is in the future");
    if (x.lastVerified == null) warn(where, "never verified");
    else if (x.lastVerified < addDays(now, -45)) warn(where, `last verified ${x.lastVerified}, more than 45 days ago`);
  };
  const seen = new Set();
  const unique = (where, id) => {
    if (seen.has(id)) err(where, `duplicate id "${id}"`);
    seen.add(id);
  };

  data.places.forEach((p, i) => {
    const w = `places[${i}] ${p.id || ""}`;
    checkCommon(w, p);
    unique(w, p.id);
    if (!p.name) err(w, "name is required");
    if (!PLACE_TYPES[p.type]) err(w, `type must be one of ${Object.keys(PLACE_TYPES).join(", ")}`);
    if (!p.address) err(w, "address is required");
    if (p.area != null && !AREAS[p.area]) err(w, `area must be one of ${Object.keys(AREAS).join(", ")}`);
  });
  const placeIds = new Set(data.places.map((p) => p.id));

  data.recurring.forEach((r, i) => {
    const w = `recurring[${i}] ${r.id || ""}`;
    checkCommon(w, r);
    unique(w, r.id);
    if (!r.title) err(w, "title is required");
    if (!placeIds.has(r.placeId)) err(w, `placeId "${r.placeId}" is not in places.json`);
    if (!Array.isArray(r.days) || !r.days.length || r.days.some((d) => !DAYS.includes(d))) err(w, `days must be a list from ${DAYS.join(", ")}`);
    if (r.startTime && !TIME_RE.test(r.startTime)) err(w, "startTime must be HH:MM (24h)");
    if (r.endTime && !TIME_RE.test(r.endTime)) err(w, "endTime must be HH:MM (24h)");
    if (!r.url) err(w, "url (where a parent can confirm details) is required");
  });

  data.events.forEach((e, i) => {
    const w = `events[${i}] ${e.id || ""}`;
    checkCommon(w, e);
    unique(w, e.id);
    if (!e.title) err(w, "title is required");
    if (!["event", "school-break"].includes(e.kind)) err(w, 'kind must be "event" or "school-break"');
    if (!DATE_RE.test(e.date || "")) err(w, "date must be YYYY-MM-DD");
    if (e.endDate && (!DATE_RE.test(e.endDate) || e.endDate < e.date)) err(w, "endDate must be YYYY-MM-DD and not before date");
    if (e.startTime && !TIME_RE.test(e.startTime)) err(w, "startTime must be HH:MM (24h)");
    if (e.endTime && !TIME_RE.test(e.endTime)) err(w, "endTime must be HH:MM (24h)");
    if (e.placeId && !placeIds.has(e.placeId)) err(w, `placeId "${e.placeId}" is not in places.json`);
    if (!e.placeId && !e.location) err(w, "needs a placeId or a location");
    if (!e.url) err(w, "url (the source a parent can check) is required");
    if (!["confirmed", "tentative"].includes(e.status)) err(w, 'status must be "confirmed" or "tentative"');
    if (e.area != null && !AREAS[e.area]) err(w, `area must be one of ${Object.keys(AREAS).join(", ")}`);
    if (e.lastVerified == null) err(w, "dated events must have lastVerified");
    if ((e.endDate || e.date) < addDays(now, -14)) warn(w, "ended more than two weeks ago; remove it");
  });

  data.news.forEach((n, i) => {
    const w = `news[${i}] ${n.id || ""}`;
    unique(w, n.id);
    if (!n.id || !ID_RE.test(n.id)) err(w, "id must be lowercase letters, digits and dashes");
    if (!DATE_RE.test(n.date || "")) err(w, "date must be YYYY-MM-DD");
    if (n.date > now) err(w, "date is in the future");
    if (!NEWS_CATEGORIES[n.category]) err(w, `category must be one of ${Object.keys(NEWS_CATEGORIES).join(", ")}`);
    if (!n.title || n.title.length > 120) err(w, "title is required and must be under 120 characters");
    if (!n.summary || n.summary.length > 400) err(w, "summary is required and must be under 400 characters");
    if (!/^https:\/\//.test(n.url || "")) err(w, "url (the original story) must start with https://");
    if (!n.source) err(w, "source (who published it) is required");
    if (n.area != null && !AREAS[n.area]) err(w, `area must be one of ${Object.keys(AREAS).join(", ")}`);
    if (n.expires != null && !DATE_RE.test(n.expires)) err(w, "expires must be YYYY-MM-DD or null");
    if (n.date < addDays(now, -90)) warn(w, "older than 90 days; remove it");
    if (n.image != null) {
      if (!/^\/img\/news\/[a-z0-9-]+\.(jpe?g|png|webp)$/.test(n.image)) err(w, "image must be a file in public/img/news/, written as /img/news/name.jpg");
      else if (!existsSync(join(ROOT, "public", n.image))) err(w, `image file public${n.image} doesn't exist`);
      if (!n.imageAlt) err(w, "an image needs imageAlt (a short description for screen readers)");
      if (!n.imageCredit) err(w, "an image needs imageCredit (who made it, e.g. 'Rendering courtesy of Radom Capital')");
    }
    (n.moreLinks || []).forEach((l) => { if (!l.label || !/^https:\/\//.test(l.url || "")) err(w, "each moreLinks entry needs a label and an https url"); });
    if (n.featured && (!Array.isArray(n.story) || !n.story.length || n.story.some((p) => typeof p !== "string" || p.length > 700))) err(w, "the featured story needs a story: a list of 1–4 paragraphs, each under 700 characters");
  });

  data.restaurants.forEach((r, i) => {
    const w = `restaurants[${i}] ${r.id || ""}`;
    unique(w, r.id);
    if (!r.id || !ID_RE.test(r.id)) err(w, "id must be lowercase letters, digits and dashes");
    if (!r.name) err(w, "name is required");
    if (!r.neighborhood) err(w, "neighborhood is required");
    if (!AREAS[r.area]) err(w, `area must be one of ${Object.keys(AREAS).join(", ")}`);
    if (!Array.isArray(r.perks) || !r.perks.length || r.perks.some((p) => !PERKS[p])) err(w, `perks must be a non-empty list from ${Object.keys(PERKS).join(", ")}`);
    if (!["$", "$$", "$$$"].includes(r.price)) err(w, 'price must be "$", "$$" or "$$$"');
    if (!r.description || r.description.length > 400) err(w, "description is required and must be under 400 characters");
    if (!/^https:\/\//.test(r.url || "")) err(w, "url must start with https://");
    if (r.lastVerified == null) warn(w, "never verified");
  });
  const restaurantIds = new Set(data.restaurants.map((r) => r.id));
  data.deals.forEach((d, i) => {
    const w = `deals[${i}] ${d.id || ""}`;
    unique(w, d.id);
    if (!d.id || !ID_RE.test(d.id)) err(w, "id must be lowercase letters, digits and dashes");
    if (!d.title) err(w, "title is required");
    if (d.restaurantId ? !restaurantIds.has(d.restaurantId) : !d.restaurantName) err(w, "needs a restaurantId from restaurants.json or a restaurantName");
    if (!Array.isArray(d.days) || !d.days.length || d.days.some((x) => !DAYS.includes(x))) err(w, `days must be a list from ${DAYS.join(", ")}`);
    if (d.startTime && !TIME_RE.test(d.startTime)) err(w, "startTime must be HH:MM (24h)");
    if (d.endTime && !TIME_RE.test(d.endTime)) err(w, "endTime must be HH:MM (24h)");
    if (!d.details || d.details.length > 200) err(w, "details are required and must be under 200 characters");
    if (!AREAS[d.area]) err(w, `area must be one of ${Object.keys(AREAS).join(", ")}`);
    if (!["confirmed", "tentative"].includes(d.status)) err(w, 'status must be "confirmed" or "tentative"');
    if (!/^https:\/\//.test(d.url || "")) err(w, "url must start with https://");
    if (d.expires != null && !DATE_RE.test(d.expires)) err(w, "expires must be YYYY-MM-DD or null");
    if (!d.lastVerified || d.lastVerified < addDays(now, -30)) warn(w, "deal not verified in the last 30 days");
  });

  if (data.news.filter((n) => n.featured).length > 1) err("news", "only one news item can be featured (the story of the week)");

  data.issues.forEach((iss) => {
    const w = `issues/${iss.date}`;
    if (!DATE_RE.test(iss.date || "")) err(w, "date must be YYYY-MM-DD");
    if (!iss.subject) err(w, "subject is required");
    if (!Array.isArray(iss.sections)) err(w, "sections must be a list");
  });

  return { errors, warnings };
}
