// Tiny local preview server for dist/. Usage: npm run build && npm run serve
import { createServer } from "node:http";
import { readFile, stat } from "node:fs/promises";
import { join, extname } from "node:path";
import { ROOT } from "../src/lib.mjs";

const DIST = join(ROOT, "dist");
const TYPES = { ".html": "text/html; charset=utf-8", ".css": "text/css", ".js": "text/javascript", ".svg": "image/svg+xml", ".png": "image/png", ".xml": "application/xml", ".txt": "text/plain", ".json": "application/json" };
const port = Number(process.env.PORT || 4321);

createServer(async (req, res) => {
  let path = join(DIST, decodeURIComponent(new URL(req.url, "http://x").pathname));
  if (!path.startsWith(DIST)) return res.writeHead(403).end();
  try {
    if ((await stat(path)).isDirectory()) path = join(path, "index.html");
    res.writeHead(200, { "content-type": TYPES[extname(path)] || "application/octet-stream" }).end(await readFile(path));
  } catch {
    res.writeHead(404, { "content-type": TYPES[".html"] }).end(await readFile(join(DIST, "404.html")).catch(() => "Not found"));
  }
}).listen(port, () => console.log(`Preview at http://localhost:${port}`));
