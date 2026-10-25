// Builds this week's newsletter and (with --send) sends it through Buttondown.
//   node scripts/newsletter.mjs                 preview this week's issue as Markdown
//   node scripts/newsletter.mjs --send          send it and save it to data/issues/ for the site archive
//   node scripts/newsletter.mjs --date 2026-11-05
// Env: BUTTONDOWN_API_KEY (required for --send)
//      NEWSLETTER_STATUS = about_to_send (default, sends immediately) | draft (lands in Buttondown for review)
import { existsSync, writeFileSync, mkdirSync } from "node:fs";
import { join } from "node:path";
import { ROOT, loadAll, validate, today } from "../src/lib.mjs";
import { buildIssue, toMarkdown } from "../src/newsletter.mjs";

const args = process.argv.slice(2);
const data = loadAll();
const date = args.includes("--date") ? args[args.indexOf("--date") + 1] : today(data.config.timezone);
const send = args.includes("--send");

const { errors } = validate(data, today(data.config.timezone));
if (errors.length) {
  console.error(`Data has ${errors.length} error(s); run npm run check. Not sending.`);
  process.exit(1);
}

const issuePath = join(ROOT, "data/issues", `${date}.json`);
if (send && existsSync(issuePath)) {
  console.log(`Issue for ${date} was already sent. Nothing to do.`);
  process.exit(0);
}

const issue = buildIssue(data, date);
const markdown = toMarkdown(issue, data.config);
const itemCount = issue.sections.reduce((n, s) => n + s.items.length, 0);

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
const res = await fetch("https://api.buttondown.com/v1/emails", {
  method: "POST",
  headers: { Authorization: `Token ${key}`, "Content-Type": "application/json" },
  body: JSON.stringify({ subject: issue.subject, body: markdown, description: issue.preheader, status }),
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
