// Privacy audit: fails if the source (or built HTML with --build) contains
// network, storage, tracking or server-side features that aren't explicitly
// reviewed and allow-listed below. Run: `npm run audit:privacy [-- --build]`.
import { readdirSync, readFileSync, statSync, existsSync } from "node:fs";
import { join, relative, sep } from "node:path";

const ROOT = process.cwd();
const SRC = join(ROOT, "src");
const OUT = join(ROOT, "out");
const checkBuild = process.argv.includes("--build");

/** Each rule: pattern + files where a reviewed occurrence is allowed (with reason). */
const RULES = [
  {
    id: "fetch",
    pattern: /\bfetch\s*\(/g,
    allow: {
      "src/features/export/fonts.ts":
        "Reads our own bundled font files (same origin) to embed in SVG exports. Sends no user data.",
    },
  },
  { id: "xhr", pattern: /XMLHttpRequest/g, allow: {} },
  { id: "websocket", pattern: /\bWebSocket\b|\bEventSource\b/g, allow: {} },
  { id: "beacon", pattern: /sendBeacon/g, allow: {} },
  {
    id: "storage",
    pattern: /\blocalStorage\b|\bsessionStorage\b|\bindexedDB\b|document\.cookie/g,
    allow: {},
  },
  {
    id: "analytics",
    pattern:
      /\b(gtag|googletagmanager|google-analytics|posthog|mixpanel|segment\.io|hotjar|fullstory|clarity\.ms|@sentry|plausible|umami)\b/gi,
    allow: {},
  },
  {
    id: "backend-sdk",
    pattern: /\b(firebase|supabase|axios|@vercel\/analytics|@vercel\/blob)\b/gi,
    allow: {},
  },
  { id: "server-actions", pattern: /["']use server["']/g, allow: {} },
  {
    id: "remote-fonts",
    pattern: /fonts\.googleapis|fonts\.gstatic|next\/font\/google|use\.typekit/g,
    allow: {},
  },
  { id: "remote-import", pattern: /@import\s+url\(\s*["']?https?:/g, allow: {} },
];

/** Hosts that may appear in source as QR *content* (destinations people scan to), not requests. */
const ALLOWED_URL_HOSTS = new Set([
  "www.w3.org", // SVG namespace
  "www.google.com", // Google Maps link builder
  "maps.apple.com",
  "www.openstreetmap.org",
  "wa.me",
  "example.com",
  "getlaunch.ph",
  "localhost",
]);

function walk(dir) {
  return readdirSync(dir).flatMap((name) => {
    const full = join(dir, name);
    return statSync(full).isDirectory() ? walk(full) : [full];
  });
}

const rel = (p) => relative(ROOT, p).split(sep).join("/");
const problems = [];
const reviewed = [];

const sourceFiles = walk(SRC).filter((f) => /\.(ts|tsx|js|mjs|css)$/.test(f));
for (const file of sourceFiles) {
  const text = readFileSync(file, "utf8");
  const path = rel(file);
  for (const rule of RULES) {
    const hits = text.match(rule.pattern);
    if (!hits) continue;
    if (rule.allow[path]) reviewed.push(`${rule.id} in ${path}: ${rule.allow[path]}`);
    else problems.push(`${rule.id}: ${hits.length}× in ${path}`);
  }
  for (const m of text.matchAll(/https?:\/\/([a-z0-9.-]+)/gi)) {
    if (!ALLOWED_URL_HOSTS.has(m[1].toLowerCase()))
      problems.push(`external URL host "${m[1]}" in ${path}`);
  }
}

if (existsSync(join(SRC, "app", "api")))
  problems.push("src/app/api exists — API routes are not allowed");
for (const f of sourceFiles)
  if (/[/\\]route\.(ts|js)$/.test(f)) problems.push(`route handler ${rel(f)} — not allowed`);
if (existsSync(join(SRC, "middleware.ts")) || existsSync(join(SRC, "proxy.ts")))
  problems.push("middleware/proxy present — not allowed");

const pkg = JSON.parse(readFileSync(join(ROOT, "package.json"), "utf8"));
for (const dep of Object.keys(pkg.dependencies ?? {})) {
  if (
    /analytics|firebase|supabase|sentry|posthog|mixpanel|segment|axios|amplitude|hotjar/i.test(dep)
  )
    problems.push(`dependency "${dep}" looks like tracking/backend`);
}

if (checkBuild) {
  if (!existsSync(OUT)) problems.push("--build given but ./out does not exist");
  else {
    for (const file of walk(OUT).filter((f) => f.endsWith(".html"))) {
      const html = readFileSync(file, "utf8");
      for (const m of html.matchAll(
        /<(script|link|img|iframe)[^>]+(?:src|href)=["'](https?:)?\/\/([^"'/]+)/gi,
      )) {
        problems.push(`built ${rel(file)} loads <${m[1]}> from external origin ${m[3]}`);
      }
      if (!html.includes("Content-Security-Policy"))
        problems.push(`built ${rel(file)} has no CSP meta tag`);
      if (!/connect-src 'self'/.test(html))
        problems.push(`built ${rel(file)} CSP does not restrict connect-src`);
    }
  }
}

console.log(
  `Privacy audit — scanned ${sourceFiles.length} source files${checkBuild ? " + built HTML" : ""}.`,
);
for (const r of reviewed) console.log(`  ✓ reviewed: ${r}`);
if (problems.length) {
  console.error(`\n✗ ${problems.length} privacy problem(s):`);
  for (const p of problems) console.error(`  - ${p}`);
  process.exit(1);
}
console.log("✓ No unreviewed network, storage, tracking or server-side code found.");
