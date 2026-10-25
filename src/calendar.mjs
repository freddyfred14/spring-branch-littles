// Event page helpers: where an event's page lives, its address, and "Add to calendar" / "Directions" links.
import { addDays, recurringBetween, placeById } from "./lib.mjs";

const BYDAY = { Mon: "MO", Tue: "TU", Wed: "WE", Thu: "TH", Fri: "FR", Sat: "SA", Sun: "SU" };

export const eventPath = (x) => (x.kind === "recurring" || x.days ? `/events/weekly/${x.id}/` : `/events/${x.id}/`);

export function addressOf(data, x) {
  const p = x.placeId && placeById(data, x.placeId);
  if (p) return /\d/.test(p.address) ? `${p.name}, ${p.address}` : p.address;
  return x.location || "";
}

export const mapsUrl = (address) => `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`;

// The next date a weekly program happens, on or after `now`.
export function nextOccurrence(r, now) {
  const start = r.from && r.from > now ? r.from : now;
  const hit = recurringBetween([r], start, addDays(start, 13))[0];
  return hit ? hit.date : null;
}

const ymd = (d) => d.replaceAll("-", "");
const hms = (t) => `${t.replace(":", "")}00`;
function plusHour(t) {
  const [h, m] = t.split(":").map(Number);
  return `${String(Math.min(h + 1, 23)).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

// Start/end in calendar format. Untimed events are all-day; events without an end time get one hour.
function span(x, date) {
  const endDate = x.kind === "recurring" || x.days ? date : x.endDate || date;
  if (!x.startTime) return { allDay: true, start: ymd(date), end: ymd(addDays(endDate, 1)) };
  return { allDay: false, start: `${ymd(date)}T${hms(x.startTime)}`, end: `${ymd(endDate)}T${hms(x.endTime || plusHour(x.startTime))}` };
}

function rrule(r) {
  if (!r.days) return "";
  const until = r.until ? `;UNTIL=${ymd(r.until)}T235959Z` : "";
  return `RRULE:FREQ=WEEKLY;BYDAY=${r.days.map((d) => BYDAY[d]).join(",")}${until}`;
}

export function googleCalendarUrl(data, x, date, pageUrl) {
  const s = span(x, date);
  const params = new URLSearchParams({
    action: "TEMPLATE",
    text: x.title,
    dates: `${s.start}/${s.end}`,
    details: `${x.description}\n\nDetails: ${pageUrl}`,
    location: addressOf(data, x),
  });
  if (!s.allDay) params.set("ctz", data.config.timezone);
  const rule = rrule(x);
  if (rule) params.set("recur", rule);
  return `https://calendar.google.com/calendar/render?${params}`;
}

const icsText = (s) => String(s).replace(/\\/g, "\\\\").replace(/;/g, "\\;").replace(/,/g, "\\,").replace(/\n/g, "\\n");
// iCalendar lines must be folded at 75 octets.
const fold = (line) => line.match(/.{1,73}/g).join("\r\n ");

const CHICAGO = [
  "BEGIN:VTIMEZONE", "TZID:America/Chicago",
  "BEGIN:DAYLIGHT", "TZOFFSETFROM:-0600", "TZOFFSETTO:-0500", "TZNAME:CDT", "DTSTART:19700308T020000", "RRULE:FREQ=YEARLY;BYMONTH=3;BYDAY=2SU", "END:DAYLIGHT",
  "BEGIN:STANDARD", "TZOFFSETFROM:-0500", "TZOFFSETTO:-0600", "TZNAME:CST", "DTSTART:19701101T020000", "RRULE:FREQ=YEARLY;BYMONTH=11;BYDAY=1SU", "END:STANDARD",
  "END:VTIMEZONE",
];

export function icsFile(data, x, date, pageUrl, stamp) {
  const s = span(x, date);
  const when = s.allDay
    ? [`DTSTART;VALUE=DATE:${s.start}`, `DTEND;VALUE=DATE:${s.end}`]
    : [`DTSTART;TZID=America/Chicago:${s.start}`, `DTEND;TZID=America/Chicago:${s.end}`];
  const host = new URL(data.config.url).host;
  const lines = [
    "BEGIN:VCALENDAR", "VERSION:2.0", `PRODID:-//${data.config.name}//EN`, "CALSCALE:GREGORIAN", "METHOD:PUBLISH",
    ...(s.allDay ? [] : CHICAGO),
    "BEGIN:VEVENT",
    `UID:${x.id}@${host}`,
    `DTSTAMP:${stamp}`,
    ...when,
    ...(rrule(x) ? [rrule(x)] : []),
    `SUMMARY:${icsText(x.title)}`,
    `DESCRIPTION:${icsText(`${x.description}\n\nDetails: ${pageUrl}`)}`,
    `LOCATION:${icsText(addressOf(data, x))}`,
    `URL:${pageUrl}`,
    "END:VEVENT", "END:VCALENDAR",
  ];
  return lines.map(fold).join("\r\n") + "\r\n";
}
