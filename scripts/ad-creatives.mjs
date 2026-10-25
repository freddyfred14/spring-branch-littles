// Makes ready-to-run Instagram/Facebook ads: an AI scene from OpenAI (no text in it), with our logo,
// headline and button laid over it, in three sizes, plus the ad copy and tracking links.
// Usage: OPENAI_API_KEY=... node scripts/ad-creatives.mjs
//   AD_CONCEPTS=plan-ahead,storytime   only these concepts (default: all)
//   AD_TEST_IMAGE=public/img/...jpg    skip OpenAI and use this picture (to check layouts)
// Writes marketing/ads/<date>/<concept>-feed.png (1080×1350), -story.png (1080×1920), -square.png (1080×1080)
// and marketing/ads/<date>/README.md with the copy for Ads Manager.
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { createRequire } from "node:module";
import { ROOT, loadAll, today } from "../src/lib.mjs";
import { pickImageModel, generateImage } from "../src/openai.mjs";

const require = createRequire(import.meta.url);
const { chromium } = require("playwright");
const { config } = loadAll();
const KEY = process.env.OPENAI_API_KEY;
const TEST = process.env.AD_TEST_IMAGE;
const date = today(config.timezone);

const STYLE = "Warm, realistic lifestyle photo, soft natural light, candid and joyful, families of different backgrounds, shallow depth of field.";
const RULES = "No text, no words, no letters, no signs, no logos, no brand names, no recognizable real people or landmarks.";

// Each concept is one ad: a scene, the words on the image, and the copy for Ads Manager.
const CONCEPTS = [
  {
    id: "plan-ahead",
    scene: "A smiling mom with a toddler on her lap at a sunny kitchen table, looking at a phone together, a coffee mug nearby, cozy suburban home, morning light.",
    eyebrow: "Spring Branch & Memorial parents",
    headline: "Two weeks of kid plans, <em>every Monday</em>",
    sub: "Storytimes, festivals and kids-eat-free nights near you.",
    cta: "Get the free list",
    primary: "Never scramble for weekend plans again. Every Monday, The Littles List sends the next two weeks of storytimes, festivals and kids-eat-free nights in Spring Branch & Memorial. Free.",
    adHeadline: "Two weeks of kid plans, free",
  },
  {
    id: "storytime",
    scene: "A friendly librarian reading a colorful picture book to a circle of delighted toddlers sitting on a carpet in a bright library children's area, parents sitting behind them.",
    eyebrow: "For parents of littles",
    headline: "Never miss <em>storytime</em> again",
    sub: "Library storytimes and baby classes near you, in one free email.",
    cta: "Subscribe free",
    primary: "Baby bounce, toddler storytime, preschool crafts: we list the ones near Spring Branch & Memorial, with times, every Monday. Free, short enough for nap time.",
    adHeadline: "Storytimes near you, every Monday",
  },
  {
    id: "weekend",
    scene: "A family with two young kids walking hand in hand on a park trail under big live oak trees, a toddler running ahead laughing, golden late-afternoon light, fall.",
    eyebrow: "Spring Branch & Memorial",
    headline: "Weekend plans for your <em>littles</em>, sorted",
    sub: "The best family events near you, checked every week.",
    cta: "Get the free list",
    primary: "Festivals, park days, free museum nights and rainy-day backups, all close to home. Get the next two weeks of kid-friendly plans every Monday, free.",
    adHeadline: "Kid-friendly plans near you",
  },
  {
    id: "holidays",
    scene: "Young kids in knit winter hats and their parents at an outdoor plaza at dusk, a giant decorated Christmas tree with warm twinkle lights, kids pointing up in wonder.",
    eyebrow: "Holiday season is coming",
    headline: "Santa, lights and <em>holiday fun</em> near you",
    sub: "Our free list of family holiday events in Spring Branch & Memorial.",
    cta: "Get the free list",
    primary: "Tree lightings, Santa visits and holiday events for little ones, close to home. Get them on the calendar early: The Littles List lands every Monday. Free.",
    adHeadline: "Holiday events for little ones",
  },
].filter((c) => !process.env.AD_CONCEPTS || process.env.AD_CONCEPTS.split(",").map((s) => s.trim()).includes(c.id));

const dataUri = (buf, type) => `data:${type};base64,${buf.toString("base64")}`;
const LOGO = dataUri(readFileSync(join(ROOT, "public/img/logo.png")), "image/png");
const FONTS = `<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Fredoka:wght@600;700&family=Nunito:wght@700;800&family=Caveat:wght@700&display=swap">`;
const site = config.url.replace("https://", "");

const css = `
  * { box-sizing: border-box; margin: 0; }
  body { position: relative; overflow: hidden; background: #fbf6ec; color: #241e1a; font-family: Nunito, sans-serif; }
  .photo { position: absolute; left: 0; right: 0; top: 0; background-size: cover; background-position: center; }
  .panel { position: absolute; left: 0; right: 0; bottom: 0; background: #fbf6ec; }
  .logo { position: absolute; background: #fbf6ec; border-radius: 34px; box-shadow: 0 10px 30px rgba(0,0,0,.18); }
  .logo img { display: block; width: 100%; }
  .eyebrow { font-family: Fredoka, sans-serif; font-weight: 600; letter-spacing: .06em; text-transform: uppercase; color: #4b7759; }
  h1 { font-family: Fredoka, sans-serif; font-weight: 700; line-height: 1.04; letter-spacing: -.01em; }
  h1 em { font-family: Caveat, cursive; font-style: normal; color: #b8496f; font-size: 1.22em; line-height: .8; }
  .sub { color: #6d645b; font-weight: 700; }
  .cta { display: inline-block; background: #b8496f; color: #fff; font-family: Fredoka, sans-serif; font-weight: 600; border-radius: 999px; box-shadow: 0 9px 0 #8f3655; }
  .url { color: #6d645b; font-weight: 800; }`;

function layouts(c, photo) {
  const bg = `background-image:url(${photo})`;
  // Text stacks top to bottom in a column, so nothing can overlap whatever the headline length.
  const stack = (gap) => `display:flex;flex-direction:column;gap:${gap}px`;
  return {
    // Feed 4:5: photo on top, text panel below.
    feed: [1080, 1350, `
      <div class="photo" style="${bg};height:720px"></div>
      <div class="panel" style="top:720px;padding:56px 64px 0;${stack(16)};align-items:flex-start">
        <p class="eyebrow" style="font-size:30px">${c.eyebrow}</p>
        <h1 style="font-size:78px">${c.headline}</h1>
        <p class="sub" style="font-size:34px">${c.sub}</p>
        <span class="cta" style="font-size:40px;padding:22px 46px;margin-top:22px">${c.cta}</span>
      </div>
      <div class="logo" style="right:44px;top:44px;width:230px;padding:12px 16px"><img src="${LOGO}"></div>`],
    // Story/Reels 9:16: Instagram covers the top ~250px and bottom ~300px with its own buttons, so the
    // logo sits below the top strip and the button above the bottom strip.
    story: [1080, 1920, `
      <div class="photo" style="${bg};height:1100px"></div>
      <div style="position:absolute;left:0;right:0;top:860px;height:240px;background:linear-gradient(transparent,#fbf6ec)"></div>
      <div class="panel" style="top:1100px;bottom:300px;padding:0 76px;${stack(20)};align-items:center;text-align:center;justify-content:flex-start">
        <p class="eyebrow" style="font-size:34px">${c.eyebrow}</p>
        <h1 style="font-size:90px">${c.headline}</h1>
        <p class="sub" style="font-size:38px">${c.sub}</p>
        <span class="cta" style="font-size:46px;padding:26px 58px;margin-top:18px">${c.cta}</span>
        <p class="url" style="font-size:30px">${site}/join</p>
      </div>
      <div class="panel" style="top:auto;height:300px"></div>
      <div class="logo" style="left:50%;top:270px;width:280px;padding:14px 20px;transform:translateX(-50%)"><img src="${LOGO}"></div>`],
    // Square 1:1: photo left, text right.
    square: [1080, 1080, `
      <div class="photo" style="${bg};width:520px;bottom:0;right:auto"></div>
      <div class="panel" style="left:520px;top:0;padding:64px 50px 64px 54px;${stack(14)};align-items:flex-start;justify-content:center">
        <img src="${LOGO}" style="width:220px;display:block;margin-bottom:20px">
        <p class="eyebrow" style="font-size:24px">${c.eyebrow}</p>
        <h1 style="font-size:60px">${c.headline}</h1>
        <p class="sub" style="font-size:28px">${c.sub}</p>
        <span class="cta" style="font-size:34px;padding:18px 36px;margin-top:22px">${c.cta}</span>
      </div>`],
  };
}

let model = null;
if (!TEST) {
  if (!KEY) {
    console.log("No OPENAI_API_KEY set. Add it as a repository secret (the same one the event images use).");
    process.exit(0);
  }
  model = process.env.OPENAI_IMAGE_MODEL || (await pickImageModel(KEY));
  if (!model) {
    console.log("::error::This OpenAI account has no image models.");
    process.exit(1);
  }
  console.log(`Using ${model}.`);
}

const out = join(ROOT, "marketing/ads", date);
mkdirSync(out, { recursive: true });
const browser = await chromium.launch();
const made = [];
for (const c of CONCEPTS) {
  let photo;
  try {
    const buf = TEST ? readFileSync(join(ROOT, TEST)) : await generateImage(KEY, model, `${STYLE} ${c.scene} ${RULES}`, { shape: "portrait", quality: process.env.OPENAI_IMAGE_QUALITY || "high" });
    writeFileSync(join(out, `${c.id}-photo.jpg`), buf);
    photo = dataUri(buf, "image/jpeg");
  } catch (err) {
    console.log(`::warning::No image for ${c.id}: ${err.message}`);
    if (err.fatal) break;
    continue;
  }
  for (const [size, [w, h, inner]] of Object.entries(layouts(c, photo))) {
    const p = await browser.newPage({ viewport: { width: w, height: h } });
    const html = `<!doctype html><html><head><meta charset="utf-8">${FONTS}<style>${css} body{width:${w}px;height:${h}px}</style></head><body>${inner}</body></html>`;
    await p.setContent(html, { waitUntil: "networkidle", timeout: 20000 }).catch(() => p.setContent(html));
    await p.screenshot({ path: join(out, `${c.id}-${size}.png`) });
    await p.close();
  }
  made.push(c);
  console.log(`made ${c.id}`);
}
await browser.close();

const link = (c) => `${config.url}/join/?source=meta-${c.id}`;
const md = [
  `# Ads · ${date}`,
  "",
  "Each concept comes in three sizes: `-feed` (1080×1350, Instagram and Facebook feeds), `-story` (1080×1920, Stories and Reels) and `-square` (1080×1080). In Ads Manager, upload all three to the same ad so Meta uses the right one in each spot.",
  "",
  ...made.flatMap((c) => [
    `## ${c.id}`,
    "",
    `![${c.id}](${c.id}-feed.png)`,
    "",
    `- **Primary text:** ${c.primary}`,
    `- **Headline:** ${c.adHeadline}`,
    `- **Description:** Free · every Monday · unsubscribe anytime`,
    `- **Button:** Subscribe (or Sign up)`,
    `- **Website URL:** ${link(c)}`,
    "",
  ]),
].join("\n");
writeFileSync(join(out, "README.md"), md + "\n");
console.log(`Wrote ${made.length} concept(s) to marketing/ads/${date}/`);
if (!made.length && CONCEPTS.length) process.exit(1);
