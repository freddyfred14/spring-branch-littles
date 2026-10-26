// One-time Buttondown setup: sends new subscribers to our thank-you page after they sign up, and to the
// homepage after they confirm their email. Run it from Actions → Buttondown setup → Run workflow.
// Needs BUTTONDOWN_API_KEY.
import { loadAll } from "../src/lib.mjs";

const { config } = loadAll();
const KEY = process.env.BUTTONDOWN_API_KEY;
if (!KEY) {
  console.log("::error::Add the BUTTONDOWN_API_KEY repository secret first (Buttondown → Settings → API).");
  process.exit(1);
}
const api = "https://api.buttondown.com/v1";
const headers = { Authorization: `Token ${KEY}`, "Content-Type": "application/json" };

const list = await fetch(`${api}/newsletters`, { headers });
const body = await list.json().catch(() => ({}));
if (!list.ok) {
  console.log(`::error::Buttondown said ${list.status}: ${JSON.stringify(body)}. If it mentions your plan, API access needs a paid plan.`);
  process.exit(1);
}
const newsletters = body.results || [];
const ours = newsletters.find((n) => n.username === config.buttondownUsername) || newsletters[0];
if (!ours) {
  console.log("::error::No newsletter found on this Buttondown account.");
  process.exit(1);
}
console.log(`Newsletter: ${ours.name} (${ours.username})`);

const settings = {
  subscription_redirect_url: `${config.url}/thanks/`,
  subscription_confirmation_redirect_url: `${config.url}/?source=confirmed`,
};
const res = await fetch(`${api}/newsletters/${ours.id}`, { method: "PATCH", headers, body: JSON.stringify(settings) });
const out = await res.json().catch(() => ({}));
if (!res.ok) {
  console.log(`::error::Couldn't update the newsletter (${res.status}): ${JSON.stringify(out)}`);
  process.exit(1);
}
console.log(`After signing up, people now land on ${settings.subscription_redirect_url}`);
console.log(`After confirming their email, they land on ${settings.subscription_confirmation_redirect_url}`);
if (ours.username !== config.buttondownUsername) {
  console.log(`::warning::Your Buttondown username is "${ours.username}", but the site's forms use "${config.buttondownUsername}". Tell Claude so the forms can be updated.`);
}
