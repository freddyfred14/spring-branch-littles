// Sends an app alert (push notification) to everyone who turned alerts on, through OneSignal.
// Usage: node scripts/push.mjs            the Thursday alert: this weekend's picks
//        PUSH_TITLE=... PUSH_MESSAGE=... PUSH_URL=... node scripts/push.mjs   your own alert
//        DRY_RUN=1 ...                    print the alert without sending it
// Needs ONESIGNAL_API_KEY (secret) and oneSignalAppId in site.config.json.
import { loadAll, today, weekendOf, eventsBetween, recurringBetween, areaOf } from "../src/lib.mjs";

const data = loadAll();
const { config } = data;
const KEY = process.env.ONESIGNAL_API_KEY;
const DRY = !!process.env.DRY_RUN;

function weekendAlert() {
  const wk = weekendOf(today(config.timezone));
  const events = eventsBetween(data.events.filter((e) => e.kind === "event"), wk.start, wk.end)
    .sort((a, b) => Number(!!b.featured) - Number(!!a.featured) || Number(areaOf(data, b) === "local") - Number(areaOf(data, a) === "local"));
  const weekly = recurringBetween(data.recurring, wk.start, wk.end);
  const total = events.length + new Set(weekly.map((r) => r.id)).size;
  if (!total) return null;
  const names = events.slice(0, 2).map((e) => e.title);
  const rest = total - names.length;
  const list = names.length ? `${names.join(", ")}${rest > 0 ? ` and ${rest} more` : ""}` : `${total} things to do`;
  return { title: "This weekend's picks 🦕", message: `${list}. Tap for times, places and ages.`, url: `${config.url}/?source=push` };
}

const alert = process.env.PUSH_MESSAGE
  ? { title: process.env.PUSH_TITLE || config.name, message: process.env.PUSH_MESSAGE, url: process.env.PUSH_URL || `${config.url}/?source=push` }
  : weekendAlert();

if (!alert) {
  console.log("Nothing on this weekend, so no alert.");
  process.exit(0);
}
console.log(`${alert.title}\n${alert.message}\n${alert.url}`);
if (DRY) process.exit(0);
if (!KEY || !config.oneSignalAppId) {
  console.log("Alerts aren't set up yet (needs ONESIGNAL_API_KEY and oneSignalAppId), so nothing was sent.");
  process.exit(0);
}

const res = await fetch("https://api.onesignal.com/notifications?c=push", {
  method: "POST",
  headers: { Authorization: `Key ${KEY}`, "Content-Type": "application/json" },
  body: JSON.stringify({
    app_id: config.oneSignalAppId,
    target_channel: "push",
    included_segments: ["Total Subscriptions"],
    headings: { en: alert.title },
    contents: { en: alert.message },
    url: alert.url,
    chrome_web_icon: `${config.url}/icons/icon-192.png`,
    web_push_topic: process.env.PUSH_MESSAGE ? "news" : "weekend",
  }),
});
const body = await res.json().catch(() => ({}));
if (!res.ok || body.errors) {
  console.log(`::error::OneSignal didn't send the alert: ${JSON.stringify(body.errors || body)}`);
  process.exit(1);
}
console.log(`Sent (OneSignal id ${body.id}).`);
