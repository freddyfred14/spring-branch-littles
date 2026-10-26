// Builds this week's newsletter and (with --send) sends it through Buttondown.
//   node scripts/newsletter.mjs                 preview this week's issue as Markdown
//   node scripts/newsletter.mjs --html out.html   write the designed email (what subscribers get) to a file
//   node scripts/newsletter.mjs --send          send it and save it to data/issues/ for the site archive
//   node scripts/newsletter.mjs --date 2026-11-09   (default: today, or the coming Monday on a weekend)
// Env: BUTTONDOWN_API_KEY (required for --send)
//      NEWSLETTER_STATUS = about_to_send (default, sends immediately) | draft (lands in Buttondown for review)
import { existsSync, readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { join } from "node:path";
import { ROOT, loadAll, validate, today, addDays } from "../src/lib.mjs";
import { buildIssue, toMarkdown, toHtml } from "../src/newsletter.mjs";

const args = process.argv.slice(2);
const data = loadAll();
// The issue is dated the Monday it goes out. Run on a weekend (a test, or an early send), it builds the coming
// Monday's issue; other days, today's.
function issueDate() {
  const now = today(data.config.timezone);
  const dow = new Date(`${now}T12:00:00Z`).getUTCDay();
  return dow === 6 ? addDays(now, 2) : dow === 0 ? addDays(now, 1) : now;
}
const date = args.includes("--date") && args[args.indexOf("--date") + 1] ? args[args.indexOf("--date") + 1] : issueDate();
const send = args.includes("--send");

const { errors } = validate(data, today(data.config.timezone));
if (errors.length) {
  console.error(`Data has ${errors.length} error(s); run npm run check. Not sending.`);
  process.exit(1);
}

const issuePath = join(ROOT, "data/issues", `${date}.json`);
// A draft saved earlier is updated in place on a rerun (so fixes reach Buttondown); a sent issue is never resent.
const earlier = existsSync(issuePath) ? JSON.parse(readFileSync(issuePath, "utf8")) : null;
if (send && earlier && earlier.status !== "draft") {
  console.log(`Issue for ${date} was already sent. Nothing to do.`);
  process.exit(0);
}

const issue = buildIssue(data, date);
const markdown = toMarkdown(issue, data.config);
const html = toHtml(issue, data.config);
const itemCount = issue.sections.reduce((n, s) => n + s.items.length, 0);

if (args.includes("--html")) {
  const out = args[args.indexOf("--html") + 1] || "newsletter-preview.html";
  writeFileSync(out, html);
  console.log(`Wrote the designed email for ${date} to ${out}`);
  process.exit(0);
}
if (!send) {
  console.log(`Subject: ${issue.subject}\nPreheader: ${issue.preheader}\n\n${markdown}`);
  process.exit(0);
}

if (itemCount < 3) {
  console.error(`Only ${itemCount} item(s) in this issue. Refusing to send a thin newsletter; add events first.`);
  process.exit(1);
}
const key = process.env.BUTTONDOWN_API_KEY;
if (!key) {
  console.error("BUTTONDOWN_API_KEY is not set.");
  process.exit(1);
}
const status = process.env.NEWSLETTER_STATUS || "about_to_send";
const draftId = earlier?.status === "draft" ? earlier.buttondownId : null;
const res = await fetch(`https://api.buttondown.com/v1/emails${draftId ? `/${draftId}` : ""}`, {
  method: draftId ? "PATCH" : "POST",
  headers: {
    Authorization: `Token ${key}`,
    "Content-Type": "application/json",
    // Buttondown's API saves everything as a draft unless this header confirms a real send.
    ...(status === "about_to_send" ? { "X-Buttondown-Live-Dangerously": "true" } : {}),
  },
  // "naked" sends our own designed HTML as the whole email, instead of wrapping it in Buttondown's plain template.
  body: JSON.stringify({ subject: issue.subject, body: html, template: "naked", description: issue.preheader, status }),
});
const text = await res.text();
if (!res.ok) {
  console.error(`Buttondown returned ${res.status}: ${text}`);
  process.exit(1);
}
const sent = JSON.parse(text);
mkdirSync(join(ROOT, "data/issues"), { recursive: true });
writeFileSync(issuePath, JSON.stringify({ ...issue, buttondownId: sent.id, status, sentAt: new Date().toISOString() }, null, 2) + "\n");
console.log(`${status === "draft" ? "Saved draft" : "Sent"} "${issue.subject}" (${itemCount} items). Archived to data/issues/${date}.json`);
