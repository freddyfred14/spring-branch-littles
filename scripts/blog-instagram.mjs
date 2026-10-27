// Instagram images for blog posts: a cover and a "key takeaways" image, made with OpenAI's image API from the
// post's `instagram` text, checked by Claude before anything is posted, then posted as one carousel.
// These images are only for Instagram; the website uses the post's own cover (`image`).
//   node scripts/blog-instagram.mjs --due    print "true" when a new post is due (newest post is 2+ days old)
//   node scripts/blog-instagram.mjs --make   make images for new posts into social/blog/<id>/
//   node scripts/blog-instagram.mjs --post   post made-but-unposted carousels (the site must be deployed first)
// Env: OPENAI_API_KEY, OPENAI_IMAGE_MODEL, IG_IMAGE_QUALITY (default high), ANTHROPIC_API_KEY (the text check),
//      IG_USER_ID + IG_ACCESS_TOKEN (posting). DRY_RUN=1 prints the prompts.
import { readFileSync, writeFileSync, mkdirSync, existsSync, rmSync } from "node:fs";
import { join } from "node:path";
import { execFileSync } from "node:child_process";
import { ROOT, loadAll, today, addDays } from "../src/lib.mjs";
import { pickImageModel, generateWithReferences } from "../src/openai.mjs";
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

// ---------- Prompts ----------
const STYLE = `An Instagram post for "Spring Branch Littles", a warm local parenting brand. Portrait canvas.
Style: soft cream background (#FBF6EC); large soft organic blob shapes in muted sage green (#8FAE8B), dusty blue (#5E8DB8) and blush pink (#F2B8C6) tucked into the corners; a few small hand-drawn sage leaf sprigs and short playful dash accents in mustard and coral; flat, clean, modern and airy with plenty of breathing room.
Typography: chunky, rounded, bold sans-serif (like Fredoka or Baloo) for headlines; a clean rounded sans-serif for smaller text. Text colors: near-black (#1F2A24) and dusty blue (#4E7FAE).
Logo: at the top center, place the attached Spring Branch Littles logo exactly as it appears in the attached image (same lettering, colors and green dinosaur), about one third of the canvas width. Don't redraw or change it, and don't let anything overlap it.
Layout: this will be shown as a 4:5 Instagram post, so fit everything (logo to the bottom pill) inside the middle 82% of the height, and leave the top and bottom edges as plain background with only the corner shapes. Nothing important may touch an edge.
Spell every piece of text exactly as written below, with the same punctuation, and add no other words, letters, logos or watermarks.`;
const CTA = `Near the bottom: a soft blush-pink brush-stroke pill containing two centered lines, "Read the full article at" (smaller) and "springbranchlittles.com" (bold), with a coral circle holding a white right arrow just to the right of the pill.`;
const RULES = "Show the people exactly as described (their background, age and who they are to each other). No recognizable real people, no brand names, nothing scary. Kids look happy and natural.";

function coverPrompt(ig) {
  const c = ig.cover;
  return `${STYLE}
Below the logo, from top to bottom:
1. A small pale-sage rounded pill label with spaced-out uppercase gray-green letters: "${c.label}".
2. A huge two-line headline. Line one in near-black: "${c.headline}" with a short sage brush-stroke underline under part of it. Line two in dusty blue: "${c.highlight}" with small coral and blue dash accents at its ends.
3. A medium-size subheading in near-black: "${c.subhead}"
4. A warm, realistic photo-style scene that blends softly into the design with no frame: ${c.scene}
5. ${CTA}
${RULES}`;
}
function takeawaysPrompt(ig) {
  const t = ig.takeaways;
  const colors = [["pale sage", "sage"], ["pale blue", "dusty blue"], ["pale butter yellow", "mustard"], ["pale blush pink", "coral"]];
  return `${STYLE}
Below the logo, from top to bottom:
1. A small pale-sage rounded pill label with spaced-out uppercase gray-green letters: "KEY TAKEAWAYS".
2. Small spaced-out uppercase gray text: "FROM OUR LATEST BLOG POST"
3. A big two-line headline. Line one in near-black: "${t.title}" Line two in dusty blue: "${t.highlight}" with tiny coral and mustard dash accents.
4. Four stacked, full-width rounded cards with generous padding. Each card has a filled number circle on the left, a simple thin black line icon that fits its point, a bold heading, and one or two lines of smaller body text:
${t.points.map((x, i) => `   Card ${i + 1} (${colors[i][0]} card, ${colors[i][1]} circle with "${i + 1}"): heading "${x.heading}", text "${x.text}"`).join("\n")}
5. ${CTA}
No photos on this one: only the flat illustrated style. ${RULES}`;
}
function expectedText(ig, kind) {
  const tail = ["Read the full article at", "springbranchlittles.com"];
  if (kind === "cover") return [ig.cover.label, ig.cover.headline, ig.cover.highlight, ig.cover.subhead, ...tail];
  return ["KEY TAKEAWAYS", "FROM OUR LATEST BLOG POST", ig.takeaways.title, ig.takeaways.highlight, ...ig.takeaways.points.flatMap((x, i) => [String(i + 1), x.heading, x.text]), ...tail];
}

// ---------- The check before posting ----------
// Image models sometimes misspell words or garble small text. Nothing posts until Claude has read the
// finished image and confirmed every word is right and nothing is cut off.
const CHECK_SCHEMA = {
  type: "object",
  properties: { ok: { type: "boolean" }, problems: { type: "array", items: { type: "string" } } },
  required: ["ok", "problems"],
  additionalProperties: false,
};
async function checkImage(jpeg, expected) {
  const prompt = `You are checking an Instagram image before it is posted automatically for a family brand.
The text that should appear (each piece once, spelled exactly; line breaks and letter case may differ):
${expected.map((t) => `- "${t}"`).join("\n")}
The logo at the top is expected and is not part of the list: it must read "SPRING BRANCH" in black capitals and "littles" in blue script, with a smiling green dinosaur. Flag it if it is misspelled, distorted or missing.
Set ok to false if any of these is true: a piece of text is missing, misspelled, garbled or has wrong or extra words; there is other readable text besides the logo; any text, the logo or the bottom pill is cut off by an edge, or anything overlaps the logo; a person looks malformed (extra fingers or limbs, distorted face); or anything is inappropriate for a family brand. List each problem briefly. Otherwise set ok to true with no problems.`;
  const body = (fallback) => ({
    model: "claude-opus-5-5",
    max_tokens: 2000,
    output_config: { effort: "low", format: { type: "json_schema", schema: CHECK_SCHEMA } },
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
  const text = msg.content.find((b) => b.type === "text")?.text;
  return JSON.parse(text);
}

// ---------- Make ----------
if (process.argv.includes("--make")) {
  const todo = live.filter((p) => p.instagram && p.date >= addDays(now, -7) && !existsSync(metaOf(p)));
  console.log(`${todo.length} post(s) need Instagram images.`);
  if (!todo.length) process.exit(0);
  const DRY = !!process.env.DRY_RUN;
  if (DRY) {
    for (const p of todo) console.log(`\n${p.id}\n--- cover ---\n${coverPrompt(p.instagram)}\n--- takeaways ---\n${takeawaysPrompt(p.instagram)}`);
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
  const logo = { data: readFileSync(join(ROOT, "public/img/logo.png")), type: "image/png", name: "spring-branch-littles-logo.png" };
  const quality = process.env.IG_IMAGE_QUALITY || "high";
  let failed = 0;
  for (const p of todo) {
    mkdirSync(dirOf(p), { recursive: true });
    const slides = [];
    for (const [n, kind, prompt] of [[1, "cover", coverPrompt(p.instagram)], [2, "takeaways", takeawaysPrompt(p.instagram)]]) {
      const raw = join(dirOf(p), `raw-${n}.jpg`);
      const out = join(dirOf(p), `${n}.jpg`);
      for (let attempt = 1; attempt <= 3 && slides.length < n; attempt++) {
        writeFileSync(raw, await generateWithReferences(KEY, model, prompt, [logo], { shape: "portrait", quality }));
        execFileSync("python3", [join(ROOT, "scripts/ig-compose.py"), raw, out]);
        const check = await checkImage(readFileSync(out), expectedText(p.instagram, kind));
        if (check.ok) slides.push(`${n}.jpg`);
        console.log(`${p.id} ${kind}, try ${attempt}: ${check.ok ? "looks right" : `redoing (${check.problems.join("; ")})`}`);
      }
      rmSync(raw, { force: true });
    }
    if (slides.length === 2) {
      writeFileSync(metaOf(p), JSON.stringify({ postId: p.id, caption: p.instagram.caption, slides, madeAt: new Date().toISOString() }, null, 2) + "\n");
      console.log(`Made Instagram images for ${p.id}.`);
    } else {
      failed++;
      console.log(`::warning::${p.id}: the images still had mistakes after 3 tries, so nothing will post. Edit its instagram text or run the workflow again.`);
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
