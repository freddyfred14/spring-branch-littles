// Collects this week's growth numbers for Agent Reach and appends them to reach/metrics.json.
// Each source is optional: without its key, that number is recorded as null.
//   BUTTONDOWN_API_KEY   newsletter subscribers
//   IG_ACCESS_TOKEN      Instagram followers
//   GOATCOUNTER_TOKEN    site visits and top pages (with goatcounterCode in site.config.json)
import { readFileSync, writeFileSync, existsSync, mkdirSync } from "node:fs";
import { join } from "node:path";
import { ROOT, loadAll, today, addDays } from "../src/lib.mjs";

const data = loadAll();
const now = today(data.config.timezone);
const getJson = async (url, headers = {}) => {
  try {
    const res = await fetch(url, { headers, signal: AbortSignal.timeout(20000) });
    const body = await res.json();
    if (!res.ok) throw new Error(body.detail || body.error?.message || body.error || `HTTP ${res.status}`);
    return body;
  } catch (err) {
    console.log(`::warning::${new URL(url).host}: ${err.message}`);
    return null;
  }
};

async function newsletter() {
  const key = process.env.BUTTONDOWN_API_KEY;
  if (!key) return null;
  const body = await getJson("https://api.buttondown.com/v1/subscribers?type=regular&page_size=1", { Authorization: `Token ${key}` });
  return body?.count ?? null;
}

async function instagram() {
  const token = process.env.IG_ACCESS_TOKEN;
  if (!token) return null;
  const body = await getJson(`https://graph.instagram.com/v23.0/me?fields=followers_count,media_count&access_token=${encodeURIComponent(token)}`);
  return body?.followers_count ?? null;
}

async function visits() {
  const token = process.env.GOATCOUNTER_TOKEN;
  const code = data.config.goatcounterCode;
  if (!token || !code) return { visits7d: null, topPages: null, topReferrers: null };
  const base = `https://${code}.goatcounter.com/api/v0`;
  const range = `start=${addDays(now, -7)}&end=${now}`;
  const auth = { Authorization: `Bearer ${token}` };
  const [total, hits, refs] = await Promise.all([
    getJson(`${base}/stats/total?${range}`, auth),
    getJson(`${base}/stats/hits?${range}&limit=10`, auth),
    getJson(`${base}/stats/toprefs?${range}&limit=10`, auth),
  ]);
  return {
    visits7d: total?.total ?? null,
    topPages: hits?.hits?.map((h) => ({ path: h.path, visits: h.count })) ?? null,
    topReferrers: refs?.stats?.map((r) => ({ from: r.name || "(direct)", visits: r.count })) ?? null,
  };
}

const row = {
  date: now,
  newsletterSubscribers: await newsletter(),
  instagramFollowers: await instagram(),
  ...(await visits()),
  issuesSent: data.issues.length,
  upcomingEvents: data.events.filter((e) => e.kind === "event" && (e.endDate || e.date) >= now).length,
  guides: data.guides.length,
};

mkdirSync(join(ROOT, "reach"), { recursive: true });
const file = join(ROOT, "reach/metrics.json");
const history = existsSync(file) ? JSON.parse(readFileSync(file, "utf8")) : [];
const rest = history.filter((r) => r.date !== now);
writeFileSync(file, `${JSON.stringify([...rest, row], null, 2)}\n`);
console.log(JSON.stringify(row, null, 2));
