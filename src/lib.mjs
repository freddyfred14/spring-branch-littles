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
    if (e.lastVerified == null) err(w, "dated events must have lastVerified");
    if ((e.endDate || e.date) < addDays(now, -14)) warn(w, "ended more than two weeks ago; remove it");
  });

  data.issues.forEach((iss) => {
    const w = `issues/${iss.date}`;
    if (!DATE_RE.test(iss.date || "")) err(w, "date must be YYYY-MM-DD");
    if (!iss.subject) err(w, "subject is required");
    if (!Array.isArray(iss.sections)) err(w, "sections must be a list");
  });

  return { errors, warnings };
}
