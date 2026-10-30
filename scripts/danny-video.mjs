// Makes a Danny the Dino video (1080×1920, 30 fps, for Instagram Reels and Stories) from
// social/video/<name>/script.json: OpenAI voices each line, Danny's mouth follows the voice, event cards pop up
// as he talks about them, and ffmpeg puts it together as social/video/<name>/danny.mp4 (plus a cover.jpg).
//   node scripts/danny-video.mjs halloween-houston-2026
//   SILENT=1 node scripts/danny-video.mjs <name>   preview without a voice (timing is estimated)
// Env: OPENAI_API_KEY, DANNY_VOICE (default coral), DANNY_TTS_MODEL (default gpt-4o-mini-tts). Needs Playwright and ffmpeg.
import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { spawn } from "node:child_process";
import { createRequire } from "node:module";
import { ROOT } from "../src/lib.mjs";
import { sceneHtml } from "../src/danny.mjs";

const name = process.argv[2];
const dir = join(ROOT, "social/video", name);
const script = JSON.parse(readFileSync(join(dir, "script.json"), "utf8"));
const FPS = 30;
const RATE = 24000;
const SILENT = !!process.env.SILENT || !process.env.OPENAI_API_KEY;
const VOICE = process.env.DANNY_VOICE || script.voice || "coral";
const MODEL = process.env.DANNY_TTS_MODEL || "gpt-4o-mini-tts";
const HOW = "You are Danny, a cheerful, friendly baby dinosaur who hosts a short show for parents of little kids. Speak warmly and playfully with a smile in your voice, upbeat and a little silly, with clear words and an easy, unhurried pace. Never shouty.";

// ---------- Voice ----------
async function speak(text) {
  const ask = (model) => fetch("https://api.openai.com/v1/audio/speech", {
    method: "POST",
    headers: { Authorization: `Bearer ${process.env.OPENAI_API_KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify({ model, voice: VOICE, input: text, response_format: "wav", ...(model.startsWith("gpt") ? { instructions: HOW } : {}) }),
  });
  let res = await ask(MODEL);
  // Accounts without the newer voice model fall back to the standard one.
  if (!res.ok && res.status < 500) res = await ask("tts-1");
  if (!res.ok) throw new Error(`OpenAI speech failed: ${res.status} ${await res.text()}`);
  return pcmFromWav(Buffer.from(await res.arrayBuffer()));
}
// 16-bit mono PCM samples from a WAV file (streamed WAVs can carry a placeholder data size, so read to the end).
function pcmFromWav(buf) {
  let off = 12, rate = RATE, channels = 1;
  while (off < buf.length - 8) {
    const id = buf.toString("ascii", off, off + 4), size = buf.readUInt32LE(off + 4);
    if (id === "fmt ") { channels = buf.readUInt16LE(off + 10); rate = buf.readUInt32LE(off + 12); }
    if (id === "data") {
      const end = size > 0 && off + 8 + size <= buf.length ? off + 8 + size : buf.length;
      const all = new Int16Array(buf.buffer.slice(buf.byteOffset + off + 8, buf.byteOffset + end - ((end - off - 8) % 2)));
      const mono = channels === 1 ? all : all.filter((_, i) => i % channels === 0);
      if (rate !== RATE) throw new Error(`Expected ${RATE} Hz audio, got ${rate}`);
      return mono;
    }
    off += 8 + size + (size % 2);
  }
  throw new Error("No audio in the speech response");
}
const silence = (sec) => new Int16Array(Math.round(sec * RATE));
// For previews without a voice: a made-up syllable rhythm, about 2.6 words a second.
function fakeSpeech(text) {
  const sec = Math.max(1.2, text.split(/\s+/).length / 2.6);
  const a = new Int16Array(Math.round(sec * RATE));
  for (let i = 0; i < a.length; i++) a[i] = Math.round(Math.abs(Math.sin((i / RATE) * Math.PI * 4.5)) * 9000 * Math.sin((i / RATE) * 2 * Math.PI * 180));
  return a;
}

// ---------- Timeline ----------
const parts = [silence(0.5)];
const lines = [];
let t = 0.5;
for (const line of script.lines) {
  const pcm = SILENT ? fakeSpeech(line.say) : await speak(line.say);
  lines.push({ ...line, start: t, end: t + pcm.length / RATE });
  parts.push(pcm, silence(line.pause ?? 0.35));
  t += pcm.length / RATE + (line.pause ?? 0.35);
  console.log(`${lines.at(-1).start.toFixed(1)}s  ${line.say}`);
}
parts.push(silence(1.2));
const audio = new Int16Array(parts.reduce((n, p) => n + p.length, 0));
parts.reduce((o, p) => (audio.set(p, o), o + p.length), 0);
const duration = audio.length / RATE;

// Loudness per video frame drives the mouth: RMS, scaled so normal speech sits around 0.5–1.
const per = Math.round(RATE / FPS);
const rms = [];
for (let f = 0; f * per < audio.length; f++) {
  let sum = 0;
  for (let i = f * per; i < Math.min(audio.length, (f + 1) * per); i++) sum += audio[i] * audio[i];
  rms.push(Math.sqrt(sum / per));
}
const loud = [...rms].sort((a, b) => a - b)[Math.floor(rms.length * 0.95)] || 1;
const amp = rms.map((v) => Math.min(1, v / loud));

// ---------- Video ----------
const wavPath = join(dir, "voice.wav");
const header = Buffer.alloc(44);
header.write("RIFF", 0); header.writeUInt32LE(36 + audio.length * 2, 4); header.write("WAVEfmt ", 8);
header.writeUInt32LE(16, 16); header.writeUInt16LE(1, 20); header.writeUInt16LE(1, 22); header.writeUInt32LE(RATE, 24);
header.writeUInt32LE(RATE * 2, 28); header.writeUInt16LE(2, 32); header.writeUInt16LE(16, 34); header.write("data", 36); header.writeUInt32LE(audio.length * 2, 40);
writeFileSync(wavPath, Buffer.concat([header, Buffer.from(audio.buffer)]));

const out = join(dir, "danny.mp4");
const ff = spawn("ffmpeg", ["-y", "-loglevel", "error", "-f", "image2pipe", "-framerate", String(FPS), "-i", "-", ...(SILENT ? [] : ["-i", wavPath]),
  "-c:v", "libx264", "-pix_fmt", "yuv420p", "-preset", "medium", "-crf", "20", ...(SILENT ? ["-an"] : ["-c:a", "aac", "-b:a", "160k", "-shortest"]), "-movflags", "+faststart", out], { stdio: ["pipe", "inherit", "inherit"] });
const done = new Promise((ok, fail) => ff.on("close", (code) => (code ? fail(new Error(`ffmpeg exited ${code}`)) : ok())));

const { chromium } = createRequire(import.meta.url)("playwright");
const browser = await chromium.launch();
const tab = await browser.newPage({ viewport: { width: 1080, height: 1920 } });
const logo = `data:image/png;base64,${readFileSync(join(ROOT, "public/img/logo-sm.png")).toString("base64")}`;
await tab.setContent(sceneHtml({ title: script.title, lines, logo, theme: script.theme }), { waitUntil: "networkidle" });
await tab.evaluate(() => document.fonts.ready);
const frames = Math.ceil(duration * FPS);
const coverAt = Math.round(((lines.find((l) => l.card) || lines[0]).start + 0.8) * FPS);
for (let f = 0; f < frames; f++) {
  await tab.evaluate(([s, a]) => window.render(s, a), [f / FPS, amp[f] || 0]);
  const jpg = await tab.screenshot({ type: "jpeg", quality: 88 });
  if (f === coverAt) writeFileSync(join(dir, "cover.jpg"), jpg);
  if (!ff.stdin.write(jpg)) await new Promise((r) => ff.stdin.once("drain", r));
  if (f % (FPS * 5) === 0) console.log(`frame ${f}/${frames}`);
}
ff.stdin.end();
await done;
await browser.close();
writeFileSync(join(dir, "post.json"), JSON.stringify({ caption: script.caption, video: "danny.mp4", cover: "cover.jpg", seconds: Math.round(duration), voiced: !SILENT, madeAt: new Date().toISOString() }, null, 2) + "\n");
console.log(`Made ${out} (${duration.toFixed(1)}s${SILENT ? ", no voice" : `, voice ${VOICE}`}).`);
