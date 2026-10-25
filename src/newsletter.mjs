// Builds a newsletter issue from the data files. The same issue object renders to
// email Markdown (sent through Buttondown) and to an archive page on the site.
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { eventPath } from "./calendar.mjs";
import {
  ROOT, AGES, areaOf, currentNews, featuredStory, activeDeals, addDays, eventsBetween, recurringBetween, fmtDateRange,
  fmtTimeRange, fmtShort, whereText, placeById,
} from "./lib.mjs";

const ageText = (ages) => ages.map((a) => AGES[a].label).join(", ");
const costText = (x) => x.cost || (x.free ? "Free" : "Paid");
const everyText = (days) => (days.length >= 5 ? `${days[0]}–${days[days.length - 1]}, every week` : `Every ${days.join(" & ")}`);

function item(data, x, when, pick = false) {
  const ours = x.kind === "event" || x.kind === "recurring" || x.days;
  return {
    title: x.title,
    when,
    where: whereText(data, x),
    ages: ageText(x.ages),
    cost: costText(x),
    description: x.description,
    url: ours ? `${data.config.url}${eventPath(x)}` : x.url,
    tentative: x.status === "tentative",
    pick,
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
  const sections = [];

  const story = (draft.featureId && data.news.find((n) => n.id === draft.featureId)) || featuredStory(data, date);
  if (story) {
    sections.push({
      heading: "Story of the week",
      items: [{ title: story.title, when: story.source, where: "", ages: "", cost: "", description: story.summary, paragraphs: story.story || [story.summary], url: story.url, feature: true, image: story.image ? { src: data.config.url + story.image, alt: story.imageAlt, credit: story.imageCredit } : null, moreLinks: story.moreLinks || [] }],
    });
  }

  // The issue goes out Monday morning and covers two weeks, so parents have time to plan.
  const weekEnd = addDays(date, 6);
  const nextStart = addDays(date, 7);
  const nextEnd = addDays(date, 13);
  const local = data.events.filter((e) => areaOf(data, e) === "local");
  const houston = data.events.filter((e) => e.kind === "event" && areaOf(data, e) === "houston");
  const picks = new Set(draft.picks || data.events.filter((e) => e.featured).map((e) => e.id));
  const dated = (e) => item(data, e, `${fmtDateRange(e.date, e.endDate)} · ${e.kind === "school-break" ? "No school" : fmtTimeRange(e.startTime, e.endTime)}`, picks.has(e.id));

  const thisWeek = eventsBetween(local, date, weekEnd);
  if (thisWeek.length) sections.push({ heading: `This week · ${fmtShort(date)}–${fmtShort(weekEnd)}`, items: thisWeek.map(dated) });
  // Next week lists only what starts then; multi-day events already running show under this week.
  const nextWeek = eventsBetween(local, nextStart, nextEnd).filter((e) => e.date >= nextStart);
  if (nextWeek.length) sections.push({ heading: `Next week · ${fmtShort(nextStart)}–${fmtShort(nextEnd)}`, items: nextWeek.map(dated) });

  const drive = eventsBetween(houston, date, nextEnd);
  if (drive.length) sections.push({ heading: "Worth the drive", items: drive.slice(0, 6).map(dated) });

  const weekend = [...thisWeek, ...nextWeek].filter((e) => e.kind === "event");
  const weekly = recurringBetween(data.recurring, date, weekEnd);
  if (weekly.length) {
    const seen = new Set();
    sections.push({
      heading: "Weekly storytimes and open play",
      items: weekly
        .filter((r) => !seen.has(r.id) && seen.add(r.id))
        .map((r) => item(data, r, `${r.frequency || everyText(r.days)} · ${fmtTimeRange(r.startTime, r.endTime)}`)),
    });
  }

  const news = currentNews(data, date, 10).filter((n) => n.id !== story?.id).slice(0, 3);
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

  const later = eventsBetween(local, addDays(nextEnd, 1), addDays(date, 45)).filter((e) => e.date > nextEnd);
  if (later.length) {
    sections.push({
      heading: "Plan ahead",
      items: later.map((e) => item(data, e, `${fmtDateRange(e.date, e.endDate)}${e.kind === "school-break" ? " · No school" : ""}`)),
    });
  }

  const lead = weekend.find((e) => picks.has(e.id)) || weekend[0];
  return {
    date,
    subject: draft.subject || (lead ? `${lead.title} and more for the next two weeks` : `Kid-friendly plans for the next two weeks`),
    preheader: draft.preheader || "Storytimes, parks and family events for little ones near you.",
    intro: draft.intro || ["Here's what's happening for kids around Spring Branch and Memorial over the next two weeks, so you can get it on the calendar."],
    sections,
  };
}

export function toMarkdown(issue, config) {
  const out = [];
  for (const p of issue.intro) out.push(p, "");
  for (const s of issue.sections) {
    out.push(`## ${s.heading}`, "");
    if (s.items[0]?.feature) {
      const f = s.items[0];
      out.push(`### ${f.title}`, "");
      if (f.image) out.push(`![${f.image.alt}](${f.image.src})`, `_${f.image.credit}_`, "");
      for (const p of f.paragraphs) out.push(p, "");
      out.push([`[Read more at ${f.when} →](${f.url})`, ...f.moreLinks.map((l) => `[${l.label} →](${l.url})`)].join(" · "), "");
      continue;
    }
    for (const i of s.items) {
      out.push(`${i.pick ? "⭐ " : ""}**[${i.title}](${i.url})**${i.tentative ? " _(date may change)_" : ""}  `);
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
  out.push(`**Know a parent who'd love this?** Forward this email, or send them to [${config.url.replace("https://", "")}/join](${config.url}/join/?source=forward). It's free.`, "");
  out.push(`Know about something we missed? Reply to this email and tell us.`, "");
  out.push(`_Times and details change. Please check with the venue before you go._`);
  return out.join("\n");
}

export { placeById };
