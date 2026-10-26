// Makes an AI illustration for every upcoming event and weekly program that doesn't have an image yet,
// using OpenAI's image API, and records it in the data files.
// Usage: OPENAI_API_KEY=... node scripts/event-images.mjs
//   MAX_IMAGES=30           most images to make in one run (cost guard)
//   OPENAI_IMAGE_MODEL=...  image model (default: the newest one the account can use)
//   OPENAI_IMAGE_QUALITY=.. low | medium | high (default medium)
//   DRY_RUN=1               print the prompts without calling the API
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { join } from "node:path";
import { ROOT, today, addDays, AGES } from "../src/lib.mjs";
import { pickImageModel, generateImage } from "../src/openai.mjs";

const KEY = process.env.OPENAI_API_KEY;
const DRY = !!process.env.DRY_RUN;
const MAX = Number(process.env.MAX_IMAGES || 30);
let MODEL = process.env.OPENAI_IMAGE_MODEL || "";
const QUALITY = process.env.OPENAI_IMAGE_QUALITY || "medium";

if (!KEY && !DRY) {
  console.log("No OPENAI_API_KEY set, so no images were made. Add it as a repository secret to turn this on.");
  process.exit(0);
}

const STYLE = "Warm, realistic photo-style illustration, landscape 3:2, soft natural light, cheerful and calm, families of different backgrounds.";
const RULES = "No text, no words, no signs, no logos, no brand names, no recognizable real people or real landmarks. Nothing scary.";

const config = JSON.parse(readFileSync(join(ROOT, "site.config.json"), "utf8"));
const now = today(config.timezone);
const files = {
  events: join(ROOT, "data/events.json"),
  recurring: join(ROOT, "data/recurring.json"),
  posts: join(ROOT, "data/posts.json"),
};
const data = Object.fromEntries(Object.entries(files).map(([k, f]) => [k, JSON.parse(readFileSync(f, "utf8"))]));

const firstSentence = (s) => s.split(/(?<=\.)\s/)[0].replace(/\.$/, "");
function scene(x) {
  if (x.imagePrompt) return x.imagePrompt;
  const ages = x.ages.map((a) => AGES[a].label.toLowerCase()).join(" and ");
  return `A scene of kids (${ages}) and their grown-ups enjoying "${x.title}" ${x.indoor ? "indoors" : "outdoors"}. ${x.description}`;
}

// Blog posts get a cover only when they have an imagePrompt (articles); quick reads stay text-only.
const todo = [
  ...data.events.filter((e) => e.kind === "event" && (e.endDate || e.date) >= now && e.date <= addDays(now, 60)),
  ...data.recurring,
  ...data.posts.filter((p) => p.imagePrompt),
].filter((x) => !x.image);
const folder = (x) => (data.posts.includes(x) ? "blog" : "events");

console.log(`${todo.length} item(s) need an image; making up to ${MAX}.`);
mkdirSync(join(ROOT, "public/img/events"), { recursive: true });
mkdirSync(join(ROOT, "public/img/blog"), { recursive: true });

if (!DRY && todo.length && !MODEL) {
  MODEL = await pickImageModel(KEY);
  if (!MODEL) {
    console.log("::error::This OpenAI account has no image models. At platform.openai.com, check Settings → Organization → General (verify your organization) and Limits.");
    process.exit(1);
  }
}
if (!DRY) console.log(`Using ${MODEL}.`);

let made = 0;
let failed = 0;
for (const x of todo.slice(0, MAX)) {
  const prompt = `${STYLE} ${scene(x)} ${RULES}`;
  if (DRY) {
    console.log(`\n${x.id}\n  ${prompt}`);
    continue;
  }
  try {
    const image = await generateImage(KEY, MODEL, prompt, { quality: QUALITY });
    const path = `/img/${folder(x)}/${x.id}.jpg`;
    writeFileSync(join(ROOT, "public", path), image);
    x.image = path;
    x.imageAlt = `Illustration: ${firstSentence(scene(x))}`;
    x.imageCredit = "AI illustration";
    made++;
    console.log(`made ${path}`);
  } catch (err) {
    // A wrong model or account problem fails every request the same way: stop rather than repeat it 20 times.
    if (err.fatal && !made) {
      console.log(`::error::${err.message}`);
      process.exit(1);
    }
    failed++;
    console.log(`::warning::No image for ${x.id}: ${err.message}`);
  }
}

if (made) for (const [k, f] of Object.entries(files)) writeFileSync(f, `${JSON.stringify(data[k], null, 2)}\n`);
console.log(`Done: ${made} made, ${failed} failed, ${Math.max(0, todo.length - MAX)} left for next time.`);
// A bad key or model fails every request; make that run fail so GitHub emails the owner.
if (failed && !made) process.exit(1);
