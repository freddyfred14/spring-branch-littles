// Builds a newsletter issue from the data files. The same issue object renders to
// email Markdown (sent through Buttondown) and to an archive page on the site.
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import {
  ROOT, AGES, areaOf, currentNews, activeDeals, addDays, weekendOf, eventsBetween, recurringBetween, fmtDateRange,
  fmtTimeRange, fmtShort, whereText, placeById,
} from "./lib.mjs";

const ageText = (ages) => ages.map((a) => AGES[a].label).join(", ");
const costText = (x) => x.cost || (x.free ? "Free" : "Paid");

function item(data, x, when) {
  return {
    title: x.title,
    when,
    where: whereText(data, x),
    ages: ageText(x.ages),
    cost: costText(x),
    description: x.description,
    url: x.url,
    tentative: x.status === "tentative",
  };
}

export function loadDraft(date) {
  const p = join(ROOT, "data/drafts", `${date}.json`);
  return existsSync(p) ? JSON.parse(readFileSync(p, "utf8")) : {};
}

// Rotate through indoor places week by week so the rainy-day pick changes.
function rainyPick(data, date) {
  const indoor = data.places.filter((p) => p.indoor);
  if (!indoor.length) return null;
  const week = Math.floor(Date.parse(`${date}T12:00:00Z`) / (7 * 864e5));
  return indoor[week % indoor.length];
}

export function buildIssue(data, date, draft = loadDraft(date)) {
  const wk = weekendOf(date);
  const sections = [];

  const local = data.events.filter((e) => e.kind === "event" && areaOf(data, e) === "local");
  const houston = data.events.filter((e) => e.kind === "event" && areaOf(data, e) === "houston");
  let weekend = eventsBetween(local, wk.start, wk.end);
  if (draft.picks?.length) weekend = draft.picks.map((id) => weekend.find((e) => e.id === id)).filter(Boolean);
  weekend.sort((a, b) => Number(!!b.featured) - Number(!!a.featured));
  if (weekend.length) {
    sections.push({
      heading: `This weekend · ${fmtShort(wk.start)}–${fmtShort(wk.end)}`,
      items: weekend.slice(0, 6).map((e) => item(data, e, `${fmtDateRange(e.date, e.endDate)} · ${fmtTimeRange(e.startTime, e.endTime)}`)),
    });
  }

  const drive = eventsBetween(houston, wk.start, addDays(wk.end, 14));
  if (drive.length) {
    sections.push({
      heading: "Worth the drive",
      items: drive.slice(0, 4).map((e) => item(data, e, `${fmtDateRange(e.date, e.endDate)} · ${fmtTimeRange(e.startTime, e.endTime)}`)),
    });
  }

  const monday = addDays(wk.end, 1);
  const weekly = recurringBetween(data.recurring, monday, addDays(monday, 4));
  if (weekly.length) {
    const seen = new Set();
    sections.push({
      heading: "Weekly storytimes and open play",
      items: weekly
        .filter((r) => !seen.has(r.id) && seen.add(r.id))
        .map((r) => item(data, r, `${r.frequency || `Every ${r.days.join(" & ")}`} · ${fmtTimeRange(r.startTime, r.endTime)}`)),
    });
  }

  const news = currentNews(data, date, 10).slice(0, 3);
  if (news.length) {
    sections.push({
      heading: "Neighborhood news",
      items: news.map((n) => ({ title: n.title, when: n.source, where: "", ages: "", cost: "", description: n.summary, url: n.url, news: true })),
    });
  }

  const deals = activeDeals(data, date).sort((a, b) => (a.area === "local" ? -1 : 1) - (b.area === "local" ? -1 : 1)).slice(0, 4);
  if (deals.length) {
    sections.push({
      heading: "Kids eat free",
      items: deals.map((d) => ({ title: `${d.name}: ${d.title}`, when: d.days.join(" & ") + (d.startTime ? ` · ${fmtTimeRange(d.startTime, d.endTime)}` : ""), where: d.place || "", ages: "", cost: "", description: d.details, url: d.url, deal: true })),
    });
  }

  const rainy = rainyPick(data, date);
  if (rainy) {
    sections.push({
      heading: "Rainy-day backup",
      items: [{ title: rainy.name, when: "Indoors", where: rainy.address, ages: ageText(rainy.ages), cost: rainy.free ? "Free" : "Paid", description: `${rainy.description} ${rainy.tip || ""}`.trim(), url: rainy.url }],
    });
  }

  const later = eventsBetween(data.events.filter((e) => areaOf(data, e) === "local"), addDays(wk.end, 1), addDays(wk.end, 35));
  if (later.length) {
    sections.push({
      heading: "Coming up",
      items: later.map((e) => item(data, e, `${fmtDateRange(e.date, e.endDate)}${e.kind === "school-break" ? " · No school" : ""}`)),
    });
  }

  const lead = weekend[0];
  return {
    date,
    subject: draft.subject || (lead ? `This weekend: ${lead.title} and more` : `Kid-friendly finds for the week of ${fmtShort(date)}`),
    preheader: draft.preheader || "Storytimes, parks and family events for little ones near you.",
    intro: draft.intro || ["Here are this week's kid-friendly finds around Spring Branch and Memorial, from weekend plans to next week's storytimes."],
    sections,
  };
}

export function toMarkdown(issue, config) {
  const out = [];
  for (const p of issue.intro) out.push(p, "");
  for (const s of issue.sections) {
    out.push(`## ${s.heading}`, "");
    for (const i of s.items) {
      out.push(`**[${i.title}](${i.url})**${i.tentative ? " _(date may change)_" : ""}  `);
      if (i.news) out.push(`_${i.when}_  `);
      else if (i.deal) out.push(`${i.when}${i.where ? ` · ${i.where}` : ""}  `);
      else {
        out.push(`${i.when} · ${i.where}  `);
        out.push(`_${i.ages} · ${i.cost}_  `);
      }
      out.push(i.description, "");
    }
  }
  out.push("---", "");
  out.push(`See the full calendar at [${config.url.replace("https://", "")}](${config.url}/events/) and follow along on Instagram at [@${config.instagram}](https://instagram.com/${config.instagram}).`, "");
  out.push(`Know about something we missed? Reply to this email and tell us.`, "");
  out.push(`_Times and details change. Please check with the venue before you go._`);
  return out.join("\n");
}

export { placeById };
