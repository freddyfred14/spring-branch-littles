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

// A full web address for a site image, preferring the 800px copy (smaller, so emails load fast).
function imageUrl(data, path) {
  if (!path) return null;
  const small = path.replace(/(\.\w+)$/, "-800$1");
  return data.config.url + (existsSync(join(ROOT, "public", small)) ? small : path);
}

function item(data, x, when) {
  const ours = x.kind === "event" || x.kind === "recurring" || x.days;
  const place = x.placeId && placeById(data, x.placeId);
  const pic = x.image ? x : place?.image ? place : null;
  return {
    image: pic ? { src: imageUrl(data, pic.image), alt: pic.imageAlt || "" } : null,
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
// two weeks. Spring Branch & Memorial only (Surrounding Houston stays on the site), at most 6, at most 2 at the same place.
export function topPicks(data, date, draft = {}) {
  const end = addDays(date, 13);
  const upcoming = eventsBetween(data.events.filter((e) => e.kind === "event" && areaOf(data, e) === "local"), date, end);
  if (draft.picks?.length) return draft.picks.map((id) => upcoming.find((e) => e.id === id)).filter(Boolean);
  const chosen = [];
  const perPlace = {};
  for (const e of [...upcoming].sort((a, b) => score(data, b, date) - score(data, a, date) || a.date.localeCompare(b.date))) {
    const place = e.placeId || e.location || e.id;
    if (chosen.length >= 6 || (perPlace[place] || 0) >= 2) continue;
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

// Two blog articles: the editor's choice, or the newest ones (quick reads only if there aren't two articles).
export function weeklyPosts(data, date, draft = {}) {
  if (draft.posts?.length) return draft.posts.map((id) => data.posts.find((p) => p.id === id)).filter(Boolean);
  return data.posts.filter((p) => p.date <= date).sort((a, b) => (b.type === "article") - (a.type === "article") || b.date.localeCompare(a.date)).slice(0, 2);
}

export function buildIssue(data, date, draft = loadDraft(date)) {
  const sections = [];
  const site = data.config.url;

  // The story of the week stays short in the email: a picture, two or three sentences and a link.
  const story = (draft.featureId && data.news.find((n) => n.id === draft.featureId)) || featuredStory(data, date);
  if (story) {
    sections.push({
      heading: "Story of the week",
      items: [{ title: story.title, when: story.source, where: "", ages: "", cost: "", description: story.summary, paragraphs: [story.summary], url: `${site}/news/#${story.id}`, feature: true, image: story.image ? { src: imageUrl(data, story.image), alt: story.imageAlt, credit: story.imageCredit } : null, moreLinks: [] }],
    });
  }

  // The issue goes out Monday morning and covers two weeks, so parents have time to plan.
  const end = addDays(date, 13);
  const picks = topPicks(data, date, draft);
  if (picks.length) {
    sections.push({
      heading: `Top picks · ${fmtShort(date)}–${fmtShort(end)}`,
      items: picks.map((e) => item(data, e, `${fmtDateRange(e.date < date ? date : e.date, e.endDate)} · ${fmtTimeRange(e.startTime, e.endTime)}`)),
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
      items: posts.map((p) => ({ image: p.image ? { src: imageUrl(data, p.image), alt: p.imageAlt || "" } : null, title: p.title, when: `${readMinutes(p)}-minute ${p.type === "article" ? "article" : "read"}`, where: "", description: p.summary, url: `${site}/blog/${p.id}/`, news: true })),
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

// ---------- The designed email ----------
// Email apps ignore most website CSS, so this uses the email-safe approach: tables for layout, inline styles,
// 600px wide, images with fixed widths, and fonts that fall back gracefully (Fredoka and Nunito where the app
// loads web fonts, like Apple Mail; Trebuchet and Arial elsewhere, like Gmail).
const C = { paper: "#fbf6ec", card: "#ffffff", ink: "#241e1a", muted: "#6d645b", line: "#ebe1cf", green: "#4b7759", greenSoft: "#e7efd9", pink: "#b8496f", red: "#c0392b", sun: "#e9a55a", link: "#3a6489" };
const DISPLAY = "Fredoka, 'Trebuchet MS', Arial, sans-serif";
const BODY = "Nunito, 'Helvetica Neue', Arial, sans-serif";
const h = (s) => String(s ?? "").replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);
// Plain text in our data may use **bold**; make it real bold in the email.
const rich = (s) => h(s).replace(/\*\*(.+?)\*\*/g, "<b>$1</b>");

const button = (url, label, color) =>
  `<table role="presentation" cellpadding="0" cellspacing="0" border="0"><tr><td style="border-radius:999px;background:${color}"><a href="${h(url)}" style="display:inline-block;padding:10px 20px;font-family:${DISPLAY};font-size:15px;font-weight:600;color:#ffffff;text-decoration:none;border-radius:999px">${label}</a></td></tr></table>`;

function emailCard(i, kind) {
  const img = i.image ? `<tr><td style="padding:0"><a href="${h(i.url)}"><img src="${h(i.image.src)}" width="560" alt="${h(i.image.alt)}" style="display:block;width:100%;max-width:560px;height:auto;border-radius:16px 16px 0 0;border:0"></a></td></tr>` : "";
  const meta = kind === "event"
    ? `<p style="margin:0 0 4px;font-family:${BODY};font-size:15px;font-weight:700;color:${C.ink}">${h(i.when)}</p><p style="margin:0 0 6px;font-family:${BODY};font-size:15px;color:${C.ink}">${h(i.where)}</p><p style="margin:0 0 10px;font-family:${BODY};font-size:13px;font-weight:700;color:${C.green}">${h(i.ages)} · ${h(i.cost)}${i.tentative ? ` · <span style="color:#a2522a">Date may change</span>` : ""}</p>`
    : `<p style="margin:0 0 8px;font-family:${BODY};font-size:13px;font-weight:700;letter-spacing:.04em;text-transform:uppercase;color:${C.green}">${h(i.when)}</p>`;
  const cta = kind === "event" ? button(i.url, "More info ↗", C.red) : kind === "post" ? button(i.url, "Read it →", C.green) : button(i.url, "See the menu ↗", C.green);
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:${C.card};border:2px solid ${C.line};border-radius:18px;margin:0 0 16px">
    ${img}
    <tr><td style="padding:18px 20px 20px">
      <h3 style="margin:0 0 8px;font-family:${DISPLAY};font-size:21px;line-height:1.25;font-weight:700;color:${C.ink}"><a href="${h(i.url)}" style="color:${C.ink};text-decoration:none">${h(i.title)}</a></h3>
      ${meta}
      <p style="margin:0 0 14px;font-family:${BODY};font-size:15px;line-height:1.55;color:${C.muted}">${rich(i.description)}</p>
      ${cta}
    </td></tr>
  </table>`;
}

const sectionHead = (title) => `<tr><td style="padding:26px 20px 12px"><h2 style="margin:0;font-family:${DISPLAY};font-size:26px;line-height:1.15;font-weight:700;color:${C.ink}">${h(title)}</h2><div style="height:3px;width:56px;background:${C.sun};border-radius:3px;margin-top:8px;line-height:3px;font-size:1px">&nbsp;</div></td></tr>`;

export function toHtml(issue, config) {
  const site = config.url;
  const blocks = [];
  for (const s of issue.sections) {
    blocks.push(sectionHead(s.heading));
    if (s.items[0]?.feature) {
      const f = s.items[0];
      blocks.push(`<tr><td style="padding:0 20px"><table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:${C.card};border:3px solid ${C.sun};border-radius:18px">
        ${f.image ? `<tr><td><a href="${h(f.url)}"><img src="${h(f.image.src)}" width="560" alt="${h(f.image.alt)}" style="display:block;width:100%;max-width:560px;height:auto;border-radius:15px 15px 0 0;border:0"></a></td></tr>` : ""}
        <tr><td style="padding:18px 20px 20px">
          <h3 style="margin:0 0 8px;font-family:${DISPLAY};font-size:22px;line-height:1.25;font-weight:700;color:${C.ink}">${h(f.title)}</h3>
          ${f.paragraphs.map((p) => `<p style="margin:0 0 14px;font-family:${BODY};font-size:15px;line-height:1.55;color:${C.muted}">${rich(p)}</p>`).join("")}
          ${button(f.url, "Read more →", C.green)}
        </td></tr></table></td></tr>`);
      continue;
    }
    const kind = s.items[0]?.news ? "post" : s.heading.startsWith("Where to eat") ? "eat" : s.heading === "Mark your calendar" ? "note" : "event";
    if (kind === "note") {
      blocks.push(`<tr><td style="padding:0 20px">${s.items.map((i) => `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#fce7cd;border-radius:14px;margin:0 0 10px"><tr><td style="padding:14px 18px;font-family:${BODY};font-size:15px;line-height:1.5;color:${C.ink}"><b>${h(i.title)}</b> · ${h(i.when)}<br>${rich(i.description)}</td></tr></table>`).join("")}</td></tr>`);
      continue;
    }
    blocks.push(`<tr><td style="padding:0 20px">${s.items.map((i) => emailCard(i, kind)).join("")}</td></tr>`);
  }
  const join = `${site}/join/?source=forward`;
  return `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><meta name="color-scheme" content="light only"><meta name="supported-color-schemes" content="light">
<title>${h(issue.subject)}</title>
<link href="https://fonts.googleapis.com/css2?family=Fredoka:wght@600;700&family=Nunito:wght@400;700&display=swap" rel="stylesheet">
<style>
  a { color: ${C.link}; }
  @media (max-width: 620px) { .wrap { width: 100% !important; } h2 { font-size: 23px !important; } }
</style></head>
<body style="margin:0;padding:0;background:${C.paper}">
<div style="display:none;max-height:0;overflow:hidden;opacity:0">${h(issue.preheader)}</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:${C.paper}"><tr><td align="center" style="padding:16px 8px 32px">
<table role="presentation" class="wrap" width="600" cellpadding="0" cellspacing="0" border="0" style="width:600px;max-width:600px">
  <tr><td align="center" style="padding:10px 20px 6px"><a href="${site}/?source=newsletter"><img src="${site}/img/logo-sm.png" width="170" alt="Spring Branch Littles" style="display:block;width:170px;height:auto;border:0"></a></td></tr>
  <tr><td align="center" style="padding:0 20px 14px;font-family:${DISPLAY};font-size:15px;font-weight:600;letter-spacing:.06em;text-transform:uppercase;color:${C.green}">${h(config.newsletterName)} · ${h(new Date(`${issue.date}T12:00:00Z`).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric", timeZone: "UTC" }))}</td></tr>
  <tr><td style="padding:0 20px"><table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:${C.card};border-radius:18px"><tr><td style="padding:20px 22px 6px">
    ${issue.intro.map((p) => `<p style="margin:0 0 14px;font-family:${BODY};font-size:16px;line-height:1.6;color:${C.ink}">${rich(p)}</p>`).join("")}
  </td></tr></table></td></tr>
  ${blocks.join("\n")}
  <tr><td style="padding:24px 20px 0"><table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#fbe3ea;border-radius:18px"><tr><td align="center" style="padding:22px 22px 24px">
    <p style="margin:0 0 6px;font-family:${DISPLAY};font-size:21px;font-weight:700;color:${C.ink}">Know a parent who'd love this?</p>
    <p style="margin:0 0 14px;font-family:${BODY};font-size:15px;line-height:1.5;color:${C.muted}">Forward this email, or send them our free sign-up link.</p>
    ${button(join, "Share The Littles List", C.pink).replace("<table ", '<table align="center" ')}
  </td></tr></table></td></tr>
  <tr><td style="padding:22px 24px 0;font-family:${BODY};font-size:14px;line-height:1.6;color:${C.muted}" align="center">
    <b style="color:${C.ink}">Want everything?</b> Every storytime, class and event is on <a href="${site}/events/?source=newsletter">the full calendar</a>, and every kids-eat-free night is on <a href="${site}/eats/?source=newsletter">Eats</a>.<br>
    Spotted something we missed? Just hit reply.<br>
    Follow along on Instagram: <a href="https://instagram.com/${h(config.instagram)}">@${h(config.instagram)}</a>
  </td></tr>
  <tr><td style="padding:16px 24px 0;font-family:${BODY};font-size:12px;line-height:1.6;color:${C.muted}" align="center">
    Times and details change. Please check with the venue before you go.<br>
    You're getting this because you signed up at ${h(site.replace("https://", ""))}. <a href="{{ unsubscribe_url }}" style="color:${C.muted}">Unsubscribe</a>
  </td></tr>
</table>
</td></tr></table>
</body></html>`;
}

export { placeById };
