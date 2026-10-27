// Posts this weekend's carousel to Instagram with the Instagram API (Instagram Login).
// The slides must already be live on the website, because Instagram downloads them by URL.
//   node scripts/instagram.mjs                 post social/<this weekend>/
//   node scripts/instagram.mjs --refresh-token print a refreshed long-lived token (they last 60 days)
// Env: IG_USER_ID, IG_ACCESS_TOKEN, optional IG_GRAPH_HOST (default graph.instagram.com), IG_GRAPH_VERSION (default v23.0)
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import { ROOT, loadAll, today, weekendOf } from "../src/lib.mjs";
import { postCarousel, refreshToken } from "../src/instagram.mjs";

const { IG_USER_ID, IG_ACCESS_TOKEN } = process.env;
if (!IG_ACCESS_TOKEN) {
  console.log("IG_ACCESS_TOKEN is not set; skipping Instagram.");
  process.exit(0);
}

if (process.argv.includes("--refresh-token")) {
  try {
    process.stdout.write(await refreshToken());
    process.exit(0);
  } catch (err) {
    console.error(err.message);
    process.exit(1);
  }
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

const urls = post.slides.map((f) => `${config.url}/social/${wk.start}/${f}`);
const id = await postCarousel(urls, post.caption);
writeFileSync(postPath, JSON.stringify({ ...post, instagramId: id, postedAt: new Date().toISOString() }, null, 2) + "\n");
console.log(`Posted carousel ${id} with ${urls.length} slides.`);
