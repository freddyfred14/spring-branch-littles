// Collects this week's growth numbers for Agent Reach and appends them to reach/metrics.json.
// Each source is optional: without its key, that number is recorded as null.
//   BUTTONDOWN_API_KEY   newsletter subscribers, new signups by channel, opens and clicks
//   IG_ACCESS_TOKEN      Instagram followers
//   GOATCOUNTER_TOKEN    site visits and top pages (with goatcounterCode in site.config.json)
import { readFileSync, writeFileSync, existsSync, mkdirSync } from "node:fs";
import { join } from "node:path";
import { ROOT, loadAll, today, addDays } from "../src/lib.mjs";

const data = loadAll();
const { config } = data;
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
  const none = { newsletterSubscribers: null, newSubscribers7d: null, newBySource7d: null, lastIssue: null };
  if (!key) return none;
  const auth = { Authorization: `Token ${key}` };
  const api = "https://api.buttondown.com/v1";
  const total = await getJson(`${api}/subscribers?type=regular&page_size=1`, auth);

  // Newest subscribers first, back to a week ago. The site tags each signup with where the person came from.
  const since = `${addDays(now, -7)}T00:00:00`;
  const recent = [];
  let url = `${api}/subscribers?type=regular&ordering=-creation_date&page_size=100`;
  for (let page = 0; url && page < 20; page++) {
    const body = await getJson(url, auth);
    if (!body?.results) break;
    const fresh = body.results.filter((r) => (r.creation_date || "") >= since);
    recent.push(...fresh);
    url = fresh.length === body.results.length ? body.next : null;
  }
  const sourceOf = (r) => r.metadata?.source || (r.referrer_url && new URL(r.referrer_url, config.url).searchParams.get("source")) || r.utm_source || "unknown";
  const bySource = {};
  for (const r of recent) bySource[sourceOf(r)] = (bySource[sourceOf(r)] || 0) + 1;

  // How the latest issue did.
  let lastIssue = null;
  const emails = await getJson(`${api}/emails?ordering=-publish_date&page_size=1`, auth);
  const last = emails?.results?.[0];
  if (last) {
    const a = await getJson(`${api}/emails/${last.id}/analytics`, auth);
    const rate = (n, d) => (n != null && d ? Math.round((n / d) * 1000) / 10 : null);
    lastIssue = {
      subject: last.subject,
      sent: last.publish_date,
      recipients: a?.recipients ?? null,
      openRate: rate(a?.opens, a?.recipients),
      clickRate: rate(a?.clicks, a?.recipients),
      unsubscribes: a?.unsubscriptions ?? null,
    };
  }
  return { newsletterSubscribers: total?.count ?? null, newSubscribers7d: total ? recent.length : null, newBySource7d: total ? bySource : null, lastIssue };
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
  ...(await newsletter()),
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
