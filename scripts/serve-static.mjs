// Minimal static file server for the exported site in ./out (used by E2E
// tests and local previews). Sends the same security headers as public/_headers.
import { createReadStream, existsSync, readFileSync, statSync } from "node:fs";
import { createServer } from "node:http";
import { basename, dirname, extname, join, normalize, resolve } from "node:path";

const ROOT = resolve(process.cwd(), "out");
const PORT = Number(process.env.PORT ?? 4173);
const TYPES = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".ico": "image/x-icon",
  ".json": "application/json",
  ".txt": "text/plain; charset=utf-8",
  ".woff2": "font/woff2",
  ".webmanifest": "application/manifest+json",
};

/** Parses public/_headers ("/*" block only) so local serving matches production. */
function loadHeaders() {
  const file = resolve(process.cwd(), "public", "_headers");
  if (!existsSync(file)) return {};
  const headers = {};
  for (const line of readFileSync(file, "utf8").split(/\r?\n/)) {
    const m = /^\s+([A-Za-z-]+):\s*(.+)$/.exec(line);
    if (m) headers[m[1]] = m[2].trim();
  }
  return headers;
}

if (!existsSync(ROOT)) {
  console.error("No ./out folder — run `npm run build` first.");
  process.exit(1);
}
const SECURITY_HEADERS = loadHeaders();

function resolvePath(urlPath) {
  const clean = normalize(decodeURIComponent(urlPath.split("?")[0])).replace(/^(\.\.[/\\])+/, "");
  let file = join(ROOT, clean);
  if (!file.startsWith(ROOT)) return null;
  if (existsSync(file) && statSync(file).isDirectory()) file = join(file, "index.html");
  if (!existsSync(file) && existsSync(`${file}.html`)) file = `${file}.html`;
  if (!existsSync(file)) {
    const nested = nestedSegmentPath(file);
    if (nested && existsSync(nested)) file = nested;
  }
  return existsSync(file) ? file : null;
}

/**
 * Next.js requests route-prefetch payloads with flattened names
 * (`__next.!X.templates.__PAGE__.txt`) but the static export writes them
 * nested (`__next.!X/templates/__PAGE__.txt`). Map one to the other.
 */
function nestedSegmentPath(file) {
  const dir = dirname(file);
  const name = basename(file);
  if (!name.startsWith("__next.")) return null;
  const parts = name.split(".");
  if (parts.length < 4) return null;
  const ext = parts.pop();
  const [, root, ...rest] = parts;
  return join(dir, `__next.${root}`, ...rest.slice(0, -1), `${rest[rest.length - 1]}.${ext}`);
}

createServer((req, res) => {
  if (req.method !== "GET" && req.method !== "HEAD") {
    res.writeHead(405, SECURITY_HEADERS).end();
    return;
  }
  const file = resolvePath(req.url ?? "/");
  const status = file ? 200 : 404;
  const target = file ?? join(ROOT, "404.html");
  res.writeHead(status, {
    "Content-Type": TYPES[extname(target)] ?? "application/octet-stream",
    ...SECURITY_HEADERS,
  });
  if (req.method === "HEAD") return res.end();
  createReadStream(target).pipe(res);
}).listen(PORT, () => console.log(`Serving ./out at http://localhost:${PORT}`));
