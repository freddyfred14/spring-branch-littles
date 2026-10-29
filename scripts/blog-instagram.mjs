// Instagram carousel for blog posts: a full-bleed photo cover, the list (for roundups) and the key takeaways.
// OpenAI makes the photo; Claude checks it and picks where the headline goes; the slides are rendered with our
// own fonts and logo (src/blog-slides.mjs); then it's posted as one carousel.
// These images are only for Instagram; the website uses the post's own cover (`image`).
//   node scripts/blog-instagram.mjs --due    print "true" when a new post is due (newest post is 2+ days old)
//   node scripts/blog-instagram.mjs --make   make images for new posts into social/blog/<id>/
//   node scripts/blog-instagram.mjs --post   post made-but-unposted carousels (the site must be deployed first)
// Env: OPENAI_API_KEY, OPENAI_IMAGE_MODEL, IG_IMAGE_QUALITY (default high), ANTHROPIC_API_KEY (the checks),
//      IG_USER_ID + IG_ACCESS_TOKEN (posting). DRY_RUN=1 prints the photo prompts. Needs Playwright.
import { readFileSync, writeFileSync, mkdirSync, existsSync } from "node:fs";
import { join } from "node:path";
import { ROOT, loadAll, today, addDays } from "../src/lib.mjs";
import { pickImageModel, generateImage } from "../src/openai.mjs";
import { renderSlides } from "../src/blog-slides.mjs";
import { postCarousel } from "../src/instagram.mjs";

const data = loadAll();
const { config } = data;
const now = today(config.timezone);
const live = data.posts.filter((p) => p.date <= now).sort((a, b) => b.date.localeCompare(a.date));
const dirOf = (p) => join(ROOT, "social/blog", p.id);
const metaOf = (p) => join(dirOf(p), "post.json");

if (process.argv.includes("--due")) {
  console.log(String(!live.length || live[0].date <= addDays(now, -2)));
  process.exit(0);
}

// ---------- The photo ----------
// The image model makes only the photo; the slides' type and layout are rendered by src/blog-slides.mjs.
function photoPrompt(ig) {
  return `Candid, documentary-style photo for a local parenting magazine, vertical frame. ${ig.cover.scene}
Shot on a 35mm lens at eye level in natural light, with true-to-life colors, gentle film grain and real-life imperfections: not glossy, not over-retouched, nobody posing or looking at the camera.
Composition: keep everyone's faces in the lower 55% of the frame, and leave the upper 40% as calm, uncluttered background (sky, trees, a ceiling or a wall) where a headline will go.
Show the people exactly as described (their background, age and who they are to each other). No text, letters, signs, logos or brand names anywhere. No recognizable real people. Nothing scary.`;
}

// ---------- Claude's checks ----------
// Nothing posts until Claude has looked: first at the photo (is it natural, and where are the people?), then at
// the finished cover (does the headline stay off the people?).
async function askClaude(jpeg, prompt, schema) {
  const body = (fallback) => ({
    model: "claude-opus-5-5",
    max_tokens: 2000,
    output_config: { effort: "low", format: { type: "json_schema", schema } },
    ...(fallback ? { fallbacks: "default" } : {}),
    messages: [{ role: "user", content: [
      { type: "image", source: { type: "base64", media_type: "image/jpeg", data: jpeg.toString("base64") } },
      { type: "text", text: prompt },
    ] }],
  });
  const send = (fallback) => fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "x-api-key": process.env.ANTHROPIC_API_KEY,
      "anthropic-version": "2023-06-01",
      "content-type": "application/json",
      ...(fallback ? { "anthropic-beta": "server-side-fallback-2026-07-01" } : {}),
    },
    body: JSON.stringify(body(fallback)),
  });
  // Ask with the refusal fallback on; if the API rejects that option, ask once more without it.
  let res = await send(true);
  if (res.status === 400) res = await send(false);
  const msg = await res.json();
  if (!res.ok) throw new Error(`Claude check failed: ${msg.error?.message || res.status}`);
  if (msg.stop_reason === "refusal") return { ok: false, problems: ["the image check was declined"] };
  return JSON.parse(msg.content.find((b) => b.type === "text")?.text);
}
const PHOTO_SCHEMA = {
  type: "object",
  properties: { ok: { type: "boolean" }, textArea: { type: "string", enum: ["top", "bottom", "none"] }, problems: { type: "array", items: { type: "string" } } },
  required: ["ok", "textArea", "problems"],
  additionalProperties: false,
};
const checkPhoto = (jpeg, scene) => askClaude(jpeg, `You are checking a photo before it becomes a family brand's Instagram cover. It was asked to show: ${scene}
It will be shown center-cropped to 4:5 (about 8% off the top and bottom), with a headline over either the top 40% or the bottom 40% of that frame.
Set textArea to "top" if the top 40% has no faces or heads, "bottom" if the bottom 40% has none (prefer "top" if both work), or "none" if both bands have faces.
Set ok to false if: textArea is "none"; any person looks malformed (extra or missing fingers or limbs, a distorted face); there is readable text, a sign or a logo; it looks obviously artificial or glossy rather than like a real candid photo; the people don't match the description; or anything is inappropriate for a family brand. List each problem briefly.`, PHOTO_SCHEMA);
const COVER_SCHEMA = {
  type: "object",
  properties: { ok: { type: "boolean" }, problems: { type: "array", items: { type: "string" } } },
  required: ["ok", "problems"],
  additionalProperties: false,
};
const checkCover = (jpeg) => askClaude(jpeg, `This is a finished Instagram cover: a photo with a headline set over it and a small logo badge. Set ok to false if the headline, label, subhead or logo covers any person's face or head, if any text is hard to read against the photo, or if any text is cut off by an edge. List each problem briefly; otherwise ok is true.`, COVER_SCHEMA);

// ---------- Make ----------
if (process.argv.includes("--make")) {
  const todo = live.filter((p) => p.instagram && p.date >= addDays(now, -7) && !existsSync(metaOf(p)));
  console.log(`${todo.length} post(s) need Instagram images.`);
  if (!todo.length) process.exit(0);
  if (process.env.DRY_RUN) {
    for (const p of todo) console.log(`\n${p.id}\n${photoPrompt(p.instagram)}`);
    process.exit(0);
  }
  const KEY = process.env.OPENAI_API_KEY;
  if (!KEY) {
    console.log("No OPENAI_API_KEY set, so no Instagram images were made.");
    process.exit(0);
  }
  if (!process.env.ANTHROPIC_API_KEY) {
    console.log("::error::ANTHROPIC_API_KEY is needed to check the images before they post.");
    process.exit(1);
  }
  const model = process.env.OPENAI_IMAGE_MODEL || (await pickImageModel(KEY));
  const quality = process.env.IG_IMAGE_QUALITY || "high";
  let failed = 0;
  for (const p of todo) {
    mkdirSync(dirOf(p), { recursive: true });
    const photo = join(dirOf(p), "photo.jpg");
    let slides = null;
    // A photo kept from an earlier run is tried first, so a text or design change re-renders without a new photo.
    for (let attempt = 1; attempt <= 3 && !slides; attempt++) {
      if (attempt > 1 || !existsSync(photo)) writeFileSync(photo, await generateImage(KEY, model, photoPrompt(p.instagram), { shape: "portrait", quality }));
      const shot = await checkPhoto(readFileSync(photo), p.instagram.cover.scene);
      if (!shot.ok) {
        console.log(`${p.id} photo, try ${attempt}: redoing (${shot.problems.join("; ")})`);
        continue;
      }
      // Set the headline where Claude found no people; if the finished cover still crowds someone, try the other side.
      for (const area of [shot.textArea, shot.textArea === "top" ? "bottom" : "top"]) {
        const files = await renderSlides(p.instagram, photo, area, dirOf(p));
        const cover = await checkCover(readFileSync(join(dirOf(p), files[0])));
        console.log(`${p.id} cover (text ${area}), try ${attempt}: ${cover.ok ? "looks right" : `not yet (${cover.problems.join("; ")})`}`);
        if (cover.ok) {
          slides = files;
          break;
        }
      }
    }
    if (slides) {
      writeFileSync(metaOf(p), JSON.stringify({ postId: p.id, caption: p.instagram.caption, slides, madeAt: new Date().toISOString() }, null, 2) + "\n");
      console.log(`Made Instagram images for ${p.id}.`);
    } else {
      failed++;
      console.log(`::warning::${p.id}: no photo passed the checks after 3 tries, so nothing will post. Edit its cover scene or run the workflow again.`);
    }
  }
  process.exit(failed ? 1 : 0);
}

// ---------- Post ----------
if (process.argv.includes("--post")) {
  if (!process.env.IG_ACCESS_TOKEN || !process.env.IG_USER_ID) {
    console.log("Instagram isn't connected yet (IG_USER_ID / IG_ACCESS_TOKEN), so nothing was posted. The images are on the site under /social/blog/.");
    process.exit(0);
  }
  // Only recent posts: connecting Instagram later shouldn't dump a backlog onto the feed at once.
  const ready = live.filter((p) => p.date >= addDays(now, -3) && existsSync(metaOf(p)));
  let posted = 0;
  for (const p of ready) {
    const meta = JSON.parse(readFileSync(metaOf(p), "utf8"));
    if (meta.instagramId) continue;
    const urls = meta.slides.map((f) => `${config.url}/social/blog/${p.id}/${f}`);
    const id = await postCarousel(urls, meta.caption);
    writeFileSync(metaOf(p), JSON.stringify({ ...meta, instagramId: id, postedAt: new Date().toISOString() }, null, 2) + "\n");
    console.log(`Posted ${p.id} to Instagram (${id}).`);
    posted++;
  }
  if (!posted) console.log("Nothing new to post.");
}
