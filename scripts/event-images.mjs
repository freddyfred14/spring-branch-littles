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
};
const data = Object.fromEntries(Object.entries(files).map(([k, f]) => [k, JSON.parse(readFileSync(f, "utf8"))]));

const firstSentence = (s) => s.split(/(?<=\.)\s/)[0].replace(/\.$/, "");
function scene(x) {
  if (x.imagePrompt) return x.imagePrompt;
  const ages = x.ages.map((a) => AGES[a].label.toLowerCase()).join(" and ");
  return `A scene of kids (${ages}) and their grown-ups enjoying "${x.title}" ${x.indoor ? "indoors" : "outdoors"}. ${x.description}`;
}

const todo = [
  ...data.events.filter((e) => e.kind === "event" && (e.endDate || e.date) >= now && e.date <= addDays(now, 60)),
  ...data.recurring,
].filter((x) => !x.image);

console.log(`${todo.length} item(s) need an image; making up to ${MAX}.`);
mkdirSync(join(ROOT, "public/img/events"), { recursive: true });

// Use the newest image model this account can use, unless one is named. Model names change over time.
async function pickModel() {
  const res = await fetch("https://api.openai.com/v1/models", { headers: { Authorization: `Bearer ${KEY}` } });
  const body = await res.json();
  if (!res.ok) throw new Error(body.error?.message || `HTTP ${res.status}`);
  const ids = body.data.map((m) => m.id);
  const image = ids.filter((id) => /^(gpt-image|dall-e)/.test(id));
  console.log(`Image models on this account: ${image.join(", ") || "none"}`);
  const version = (id) => (id.match(/\d+(\.\d+)?/g) || ["0"]).map(Number);
  const rank = (id) => [id.startsWith("gpt-image") ? 1 : 0, id.includes("mini") ? 0 : 1, ...version(id)];
  const cmp = (a, b) => { const x = rank(a), y = rank(b); for (let i = 0; i < Math.max(x.length, y.length); i++) if ((x[i] || 0) !== (y[i] || 0)) return (y[i] || 0) - (x[i] || 0); return 0; };
  // Skip dated snapshots (e.g. gpt-image-1-2025-04-15) when the plain name exists.
  const plain = image.filter((id) => !/\d{4}-\d{2}-\d{2}$/.test(id));
  return (plain.length ? plain : image).sort(cmp)[0];
}
if (!DRY && todo.length && !MODEL) {
  MODEL = await pickModel();
  if (!MODEL) {
    console.log("::error::This OpenAI account has no image models. At platform.openai.com, check Settings → Organization → General (verify your organization) and Limits.");
    process.exit(1);
  }
}
if (!DRY) console.log(`Using ${MODEL}.`);
// dall-e models take different settings from the gpt-image ones.
const settings = () => MODEL.startsWith("dall-e")
  ? { size: MODEL === "dall-e-3" ? "1792x1024" : "1024x1024", response_format: "b64_json", ...(MODEL === "dall-e-3" ? { quality: QUALITY === "high" ? "hd" : "standard" } : {}) }
  : { size: "1536x1024", quality: QUALITY, output_format: "jpeg", output_compression: 82 };

let made = 0;
let failed = 0;
for (const x of todo.slice(0, MAX)) {
  const prompt = `${STYLE} ${scene(x)} ${RULES}`;
  if (DRY) {
    console.log(`\n${x.id}\n  ${prompt}`);
    continue;
  }
  try {
    const res = await fetch("https://api.openai.com/v1/images/generations", {
      method: "POST",
      headers: { Authorization: `Bearer ${KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({ model: MODEL, prompt, n: 1, ...settings() }),
    });
    const body = await res.json();
    if (!res.ok) {
      // A wrong model or account problem fails every request the same way: stop rather than repeat it 20 times.
      if (/model|verif|billing|quota/i.test(body.error?.message || "") && !made) {
        console.log(`::error::${body.error.message}`);
        process.exit(1);
      }
      throw new Error(body.error?.message || `HTTP ${res.status}`);
    }
    const b64 = body.data?.[0]?.b64_json;
    if (!b64) throw new Error("the response had no image");
    const path = `/img/events/${x.id}.jpg`;
    writeFileSync(join(ROOT, "public", path), Buffer.from(b64, "base64"));
    x.image = path;
    x.imageAlt = `Illustration: ${firstSentence(scene(x))}`;
    x.imageCredit = "AI illustration";
    made++;
    console.log(`made ${path}`);
  } catch (err) {
    failed++;
    console.log(`::warning::No image for ${x.id}: ${err.message}`);
  }
}

if (made) for (const [k, f] of Object.entries(files)) writeFileSync(f, `${JSON.stringify(data[k], null, 2)}\n`);
console.log(`Done: ${made} made, ${failed} failed, ${Math.max(0, todo.length - MAX)} left for next time.`);
// A bad key or model fails every request; make that run fail so GitHub emails the owner.
if (failed && !made) process.exit(1);
