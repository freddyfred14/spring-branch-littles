// Builds a newsletter issue from the data files. The same issue object renders to
// email Markdown (sent through Buttondown) and to an archive page on the site.
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { eventPath } from "./calendar.mjs";
import {
  ROOT, AGES, PERKS, readMinutes, areaOf, featuredStory, activeDeals, addDays, eventsBetween, fmtDateRange,
  fmtTimeRange, fmtShort, whereText, placeById,
} from "./lib.mjs";

const ageText = (ages) => ages.map((a) => AGES[a].label).join(", ");
const costText = (x) => x.cost || (x.free ? "Free" : "Paid");

function item(data, x, when) {
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
  };
}

export function loadDraft(date) {
  const p = join(ROOT, "data/drafts", `${date}.json`);
  return existsSync(p) ? JSON.parse(readFileSync(p, "utf8")) : {};
}

const DAY_LONG = { Mon: "Monday", Tue: "Tuesday", Wed: "Wednesday", Thu: "Thursday", Fri: "Friday", Sat: "Saturday", Sun: "Sunday" };
const weekNumber = (date) => Math.floor(Date.parse(`${date}T12:00:00Z`) / (7 * 864e5));
const dayOfWeek = (date) => new Date(`${date}T12:00:00Z`).getUTCDay();

// How compelling an event is for the newsletter, when nobody picked by hand: featured and local first,
// then weekend, free and all-ages events. Long-running events already under way rank lower.
function score(data, e, date) {
  let n = 0;
  if (e.featured) n += 6;
  if (areaOf(data, e) === "local") n += 3;
  if ([0, 5, 6].includes(dayOfWeek(e.date))) n += 2;
  if (e.free) n += 2;
  if (e.ages.length >= 3) n += 1;
  if (e.status === "tentative") n -= 2;
  if (e.date < date) n -= 2;
  return n;
}

// The issue's top picks: what the editor chose in the draft, or the highest-scoring events over the next
// two weeks. At most 6, at most 2 outside Spring Branch & Memorial, at most 2 at the same place.
export function topPicks(data, date, draft = {}) {
  const end = addDays(date, 13);
  const upcoming = eventsBetween(data.events.filter((e) => e.kind === "event"), date, end);
  if (draft.picks?.length) return draft.picks.map((id) => upcoming.find((e) => e.id === id)).filter(Boolean);
  const chosen = [];
  const perPlace = {};
  for (const e of [...upcoming].sort((a, b) => score(data, b, date) - score(data, a, date) || a.date.localeCompare(b.date))) {
    const place = e.placeId || e.location || e.id;
    if (chosen.length >= 6 || (perPlace[place] || 0) >= 2) continue;
    if (areaOf(data, e) === "houston" && chosen.filter((x) => areaOf(data, x) === "houston").length >= 2) continue;
    chosen.push(e);
    perPlace[place] = (perPlace[place] || 0) + 1;
  }
  return chosen.sort((a, b) => a.date.localeCompare(b.date) || (a.startTime || "").localeCompare(b.startTime || ""));
}

// Two or three restaurants: the editor's choice, or one with a kids' deal this week plus local favorites,
// rotating week to week so readers see new places.
export function weeklyEats(data, date, draft = {}) {
  if (draft.restaurants?.length) return draft.restaurants.map((id) => data.restaurants.find((r) => r.id === id)).filter(Boolean);
  const local = data.restaurants.filter((r) => r.area === "local");
  if (!local.length) return [];
  const withDeal = local.filter((r) => data.deals.some((d) => d.restaurantId === r.id));
  const start = weekNumber(date);
  const out = [];
  if (withDeal.length) out.push(withDeal[start % withDeal.length]);
  for (let i = 0; out.length < 3 && i < local.length; i++) {
    const r = local[(start * 2 + i) % local.length];
    if (!out.includes(r)) out.push(r);
  }
  return out;
}

// Two short blog posts: the editor's choice, or the newest ones.
export function weeklyPosts(data, date, draft = {}) {
  if (draft.posts?.length) return draft.posts.map((id) => data.posts.find((p) => p.id === id)).filter(Boolean);
  return data.posts.filter((p) => p.date <= date).sort((a, b) => b.date.localeCompare(a.date)).slice(0, 2);
}

export function buildIssue(data, date, draft = loadDraft(date)) {
  const sections = [];
  const site = data.config.url;

  // The story of the week stays short in the email: a picture, two or three sentences and a link.
  const story = (draft.featureId && data.news.find((n) => n.id === draft.featureId)) || featuredStory(data, date);
  if (story) {
    sections.push({
      heading: "Story of the week",
      items: [{ title: story.title, when: story.source, where: "", ages: "", cost: "", description: story.summary, paragraphs: [story.summary], url: `${site}/news/#${story.id}`, feature: true, image: story.image ? { src: site + story.image, alt: story.imageAlt, credit: story.imageCredit } : null, moreLinks: [] }],
    });
  }

  // The issue goes out Monday morning and covers two weeks, so parents have time to plan.
  const end = addDays(date, 13);
  const picks = topPicks(data, date, draft);
  if (picks.length) {
    sections.push({
      heading: `Top picks · ${fmtShort(date)}–${fmtShort(end)}`,
      items: picks.map((e) => {
        const it = item(data, e, `${fmtDateRange(e.date < date ? date : e.date, e.endDate)} · ${fmtTimeRange(e.startTime, e.endTime)}`);
        if (areaOf(data, e) === "houston") it.where += " (worth the drive)";
        return it;
      }),
    });
  }

  const eats = weeklyEats(data, date, draft);
  if (eats.length) {
    const deals = activeDeals(data, date);
    sections.push({
      heading: "Where to eat this week",
      items: eats.map((r) => {
        const deal = deals.find((d) => d.restaurantId === r.id);
        const perk = r.perks.map((k) => PERKS[k]).slice(0, 2).join(", ");
        return {
          title: r.name,
          when: [r.neighborhood, r.price, perk].filter(Boolean).join(" · "),
          where: "",
          // Lead with the kids' deal when there is one, then what the place is like.
          description: `${deal ? `${deal.title} on ${deal.days.map((d) => `${DAY_LONG[d]}s`).join(" and ")}${deal.startTime ? `, ${fmtTimeRange(deal.startTime, deal.endTime)}` : ""}. ` : ""}${r.description}`,
          url: r.url,
          deal: true,
        };
      }),
    });
  }

  const posts = weeklyPosts(data, date, draft);
  if (posts.length) {
    sections.push({
      heading: "From the blog",
      items: posts.map((p) => ({ title: p.title, when: `${readMinutes(p)}-minute ${p.type === "article" ? "article" : "read"}`, where: "", description: p.summary, url: `${site}/blog/${p.id}/`, news: true })),
    });
  }

  const breaks = eventsBetween(data.events.filter((e) => e.kind === "school-break"), date, addDays(date, 45));
  if (breaks.length) {
    sections.push({
      heading: "Mark your calendar",
      items: breaks.map((e) => ({ title: e.title, when: `${fmtDateRange(e.date, e.endDate)} · No school`, where: "", description: e.description, url: e.url, deal: true })),
    });
  }

  const lead = picks.find((e) => e.featured) || picks[0];
  return {
    date,
    subject: draft.subject || (lead ? `${lead.title} and more for the next two weeks` : `Kid-friendly plans for the next two weeks`),
    preheader: draft.preheader || "Storytimes, parks and family events for little ones near you.",
    intro: draft.intro || ["Here are our favorite things to do with kids around Spring Branch and Memorial over the next two weeks."],
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
      out.push(`[Read more →](${f.url})`, "");
      continue;
    }
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
  out.push(`**Want everything?** Every storytime, class and event is on [the full calendar](${config.url}/events/?source=newsletter), and this week's kids-eat-free nights are on [Eats](${config.url}/eats/?source=newsletter). Follow along on Instagram at [@${config.instagram}](https://instagram.com/${config.instagram}).`, "");
  out.push(`**Know a parent who'd love this?** Forward this email, or send them to [${config.url.replace("https://", "")}/join](${config.url}/join/?source=forward). It's free.`, "");
  out.push(`Know about something we missed? Reply to this email and tell us.`, "");
  out.push(`_Times and details change. Please check with the venue before you go._`);
  return out.join("\n");
}

export { placeById };
