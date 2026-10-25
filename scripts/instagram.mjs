// Posts this weekend's carousel to Instagram with the Instagram API (Instagram Login).
// The slides must already be live on the website, because Instagram downloads them by URL.
//   node scripts/instagram.mjs                 post social/<this weekend>/
//   node scripts/instagram.mjs --refresh-token print a refreshed long-lived token (they last 60 days)
// Env: IG_USER_ID, IG_ACCESS_TOKEN, optional IG_GRAPH_HOST (default graph.instagram.com), IG_GRAPH_VERSION (default v23.0)
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import { ROOT, loadAll, today, weekendOf } from "../src/lib.mjs";

const { IG_USER_ID, IG_ACCESS_TOKEN } = process.env;
const HOST = process.env.IG_GRAPH_HOST || "graph.instagram.com";
const VERSION = process.env.IG_GRAPH_VERSION || "v23.0";
if (!IG_ACCESS_TOKEN) {
  console.log("IG_ACCESS_TOKEN is not set; skipping Instagram.");
  process.exit(0);
}

async function call(method, path, params) {
  const url = new URL(`https://${HOST}/${VERSION}/${path}`);
  for (const [k, v] of Object.entries({ ...params, access_token: IG_ACCESS_TOKEN })) url.searchParams.set(k, v);
  const res = await fetch(url, { method });
  const body = await res.json();
  if (!res.ok || body.error) throw new Error(`${method} ${path}: ${JSON.stringify(body.error || body)}`);
  return body;
}

if (process.argv.includes("--refresh-token")) {
  const res = await fetch(`https://${HOST}/refresh_access_token?grant_type=ig_refresh_token&access_token=${IG_ACCESS_TOKEN}`);
  const body = await res.json();
  if (!res.ok || !body.access_token) {
    console.error(`Token refresh failed: ${JSON.stringify(body)}`);
    process.exit(1);
  }
  process.stdout.write(body.access_token);
  process.exit(0);
}
if (!IG_USER_ID) {
  console.error("IG_USER_ID is not set.");
  process.exit(1);
}

const { config } = loadAll();
const wk = weekendOf(today(config.timezone));
const postPath = join(ROOT, "social", wk.start, "post.json");
if (!existsSync(postPath)) {
  console.error(`No carousel at social/${wk.start}/. Run npm run social first.`);
  process.exit(1);
}
const post = JSON.parse(readFileSync(postPath, "utf8"));
if (post.instagramId) {
  console.log(`Already posted (${post.instagramId}).`);
  process.exit(0);
}

// Make sure the images are live before asking Instagram to fetch them.
const urls = post.slides.map((f) => `${config.url}/social/${wk.start}/${f}`);
for (const u of urls) {
  const r = await fetch(u, { method: "HEAD" });
  if (!r.ok) {
    console.error(`${u} returned ${r.status}. Deploy the site before posting.`);
    process.exit(1);
  }
}

const children = [];
for (const image_url of urls) children.push((await call("POST", `${IG_USER_ID}/media`, { image_url, is_carousel_item: "true" })).id);
const container = await call("POST", `${IG_USER_ID}/media`, { media_type: "CAROUSEL", children: children.join(","), caption: post.caption });
for (let i = 0; i < 20; i++) {
  const { status_code } = await call("GET", container.id, { fields: "status_code" });
  if (status_code === "FINISHED") break;
  if (status_code === "ERROR") throw new Error("Instagram could not process the carousel.");
  await new Promise((r) => setTimeout(r, 5000));
}
const published = await call("POST", `${IG_USER_ID}/media_publish`, { creation_id: container.id });
writeFileSync(postPath, JSON.stringify({ ...post, instagramId: published.id, postedAt: new Date().toISOString() }, null, 2) + "\n");
console.log(`Posted carousel ${published.id} with ${children.length} slides.`);
