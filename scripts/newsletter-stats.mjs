// Pulls the latest sent issues' numbers from Buttondown (delivered, opens, clicks, unsubscribes) and the
// subscriber count into reports/newsletter-stats.md, so they can be read without logging in to Buttondown.
// Env: BUTTONDOWN_API_KEY
import { writeFileSync, mkdirSync } from "node:fs";
import { join } from "node:path";
import { ROOT } from "../src/lib.mjs";

const auth = { Authorization: `Token ${process.env.BUTTONDOWN_API_KEY}` };
const api = "https://api.buttondown.com/v1";
const get = async (path) => {
  const res = await fetch(`${api}${path}`, { headers: auth });
  if (!res.ok) throw new Error(`${path}: HTTP ${res.status} ${await res.text()}`);
  return res.json();
};
const pct = (n, d) => (d ? `${Math.round((n / d) * 1000) / 10}%` : "–");

const emails = (await get("/emails?ordering=-publish_date&page_size=10")).results.filter((e) => ["sent", "imported"].includes(e.status)).slice(0, 5);
const subs = await get("/subscribers?type=regular&page_size=1");
const unconfirmed = await get("/subscribers?type=unactivated&page_size=1").catch(() => ({ count: null }));
const rows = [];
for (const e of emails) {
  const a = await get(`/emails/${e.id}/analytics`).catch(() => ({}));
  const sent = a.deliveries ?? a.recipients ?? 0;
  rows.push({ date: (e.publish_date || "").slice(0, 10), subject: e.subject, recipients: a.recipients, delivered: a.deliveries, opens: a.opens, clicks: a.clicks, unsubscribes: a.unsubscriptions, complaints: a.complaints, openRate: pct(a.opens, sent), clickRate: pct(a.clicks, sent) });
}
const md = `# Newsletter stats

Pulled ${new Date().toISOString().slice(0, 16).replace("T", " ")} UTC. Confirmed subscribers: **${subs.count}**${unconfirmed.count != null ? ` (plus ${unconfirmed.count} who haven't confirmed)` : ""}.

| Sent | Subject | Delivered | Opens | Open rate | Clicks | Click rate | Unsubscribes |
|---|---|---|---|---|---|---|---|
${rows.map((r) => `| ${r.date} | ${r.subject} | ${r.delivered ?? "–"} of ${r.recipients ?? "–"} | ${r.opens ?? "–"} | ${r.openRate} | ${r.clicks ?? "–"} | ${r.clickRate} | ${r.unsubscribes ?? "–"} |`).join("\n")}

Opens are counted by an invisible image, so they run a little high (Apple Mail loads images automatically) or low (some apps block images). Clicks are the more reliable signal.
`;
mkdirSync(join(ROOT, "reports"), { recursive: true });
writeFileSync(join(ROOT, "reports/newsletter-stats.md"), md);
writeFileSync(join(ROOT, "reports/newsletter-stats.json"), JSON.stringify({ pulledAt: new Date().toISOString(), subscribers: subs.count, unconfirmed: unconfirmed.count, issues: rows }, null, 2) + "\n");
console.log(md);
