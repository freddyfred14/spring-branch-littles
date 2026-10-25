// Visits every "More info" link in data/ and reports what each page actually is: its status, where it
// redirects, its title, and whether the page mentions the listing. Runs on GitHub (Actions → Link check).
// Usage: node scripts/check-links.mjs   (writes reports/link-report.md; exits 0 even when links are bad)
import { readFileSync, writeFileSync, appendFileSync, mkdirSync, existsSync } from "node:fs";
import { join } from "node:path";
import { ROOT } from "../src/lib.mjs";

const UA = "Mozilla/5.0 (Macintosh; Intel Mac OS X 14_5) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Safari/605.1.15";
const KINDS = ["events", "recurring", "places", "restaurants", "deals", "news"];
const STOP = new Set(["the", "and", "for", "at", "of", "in", "a", "an", "with", "on", "to", "&", "-", "kids", "kid", "family"]);

// With reports/candidates.json ({"Listing name": [urls]}), it tests those pages instead, to pick replacements.
const CANDIDATES = join(ROOT, "reports/candidates.json");
const trying = existsSync(CANDIDATES);
const rows = trying
  ? Object.entries(JSON.parse(readFileSync(CANDIDATES, "utf8"))).flatMap(([name, urls]) => urls.map((url) => ({ kind: "candidate", id: name, name, url })))
  : KINDS.flatMap((k) => JSON.parse(readFileSync(join(ROOT, "data", `${k}.json`), "utf8")).map((x) => ({ kind: k, id: x.id, name: x.title || x.name, url: x.url })));
const words = (s) => s.toLowerCase().replace(/[^a-z0-9\s-]/g, " ").split(/\s+/).filter((w) => w.length > 2 && !STOP.has(w));
const decode = (s) => s.replace(/&amp;/g, "&").replace(/&#39;|&rsquo;/g, "'").replace(/&quot;/g, '"').replace(/\s+/g, " ").trim();

async function check(r) {
  if (!r.url) return { ...r, verdict: "MISSING" };
  if (r.url.includes("google.com/maps")) return { ...r, status: "-", verdict: "MAP (not checked)" };
  try {
    const res = await fetch(r.url, { redirect: "follow", headers: { "User-Agent": UA, Accept: "text/html" }, signal: AbortSignal.timeout(20000) });
    const html = res.ok ? await res.text() : "";
    const title = decode(html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1] || "");
    const text = html.replace(/<script[\s\S]*?<\/script>|<style[\s\S]*?<\/style>/gi, " ").replace(/<[^>]+>/g, " ").toLowerCase();
    const want = words(r.name);
    const found = want.filter((w) => text.includes(w));
    const match = want.length ? found.length / want.length : 1;
    const moved = res.url.replace(/\/$/, "") !== r.url.replace(/\/$/, "") ? res.url : "";
    const verdict = !res.ok ? `BROKEN (${res.status})` : match < 0.5 ? "WRONG PAGE? (doesn't mention it)" : moved ? "OK (redirects)" : "OK";
    return { ...r, status: res.status, title, moved, match: Math.round(match * 100), verdict };
  } catch (err) {
    return { ...r, status: "ERR", verdict: `BROKEN (${err.cause?.code || err.name})` };
  }
}

const results = [];
for (let i = 0; i < rows.length; i += 6) results.push(...(await Promise.all(rows.slice(i, i + 6).map(check))));

const bad = results.filter((r) => !r.verdict.startsWith("OK") && !r.verdict.startsWith("MAP"));
const cell = (s) => String(s ?? "").replace(/\|/g, "/").slice(0, 90);
const md = [
  `# Link check: ${bad.length} of ${results.length} need a look`,
  "",
  "| Verdict | Kind | Listing | Status | Page title | Mentions listing | Link (→ redirect) |",
  "|---|---|---|---|---|---|---|",
  ...[...bad, ...results.filter((r) => !bad.includes(r))].map((r) => `| ${r.verdict} | ${r.kind} | ${cell(r.name)} | ${r.status ?? ""} | ${cell(r.title)} | ${r.match ?? ""}% | ${r.url}${r.moved ? ` → ${r.moved}` : ""} |`),
].join("\n");
mkdirSync(join(ROOT, "reports"), { recursive: true });
writeFileSync(join(ROOT, trying ? "reports/candidate-report.md" : "reports/link-report.md"), md + "\n");
if (process.env.GITHUB_STEP_SUMMARY) appendFileSync(process.env.GITHUB_STEP_SUMMARY, md + "\n");
for (const r of results) console.log(`${r.verdict.padEnd(34)} ${r.kind}/${r.id} :: ${r.status ?? ""} :: ${r.title || ""} :: ${r.url}${r.moved ? ` -> ${r.moved}` : ""}`);
console.log(`\n${bad.length} of ${results.length} links need a look.`);
