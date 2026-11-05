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
    // Calls, aliasing (`const f = fetch`) and bracket access (`globalThis["fetch"]`).
    pattern: /\bfetch\s*\(|[=:,(]\s*fetch\b|\[["'`]fetch["'`]\]/g,
    // Per-call allowance: exactly this many reviewed occurrences per file.
    allow: {
      "src/features/export/fonts.ts":
        "Reads our own bundled font files (same origin) to embed in SVG exports. Sends no user data.",
    },
    maxPerFile: { "src/features/export/fonts.ts": 1 },
  },
  { id: "xhr", pattern: /XMLHttpRequest|\bnew Request\s*\(/g, allow: {} },
  {
    id: "realtime",
    pattern: /\bWebSocket\b|\bEventSource\b|\bRTCPeerConnection\b|\bWebTransport\b/g,
    allow: {},
  },
  { id: "beacon", pattern: /sendBeacon/g, allow: {} },
  { id: "workers", pattern: /\bnew (Shared)?Worker\s*\(|serviceWorker|\bcaches\./g, allow: {} },
  {
    id: "navigation",
    pattern: /window\.open\s*\(|location\.(href|assign|replace)\s*=/g,
    allow: {},
  },
  {
    id: "storage",
    pattern:
      /\blocalStorage\b|\bsessionStorage\b|\bindexedDB\b|document\.cookie|\bcookieStore\b|zustand\/middleware|\bpersist\s*\(/g,
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

const sourceFiles = walk(SRC).filter((f) => /\.(ts|tsx|mts|cts|js|jsx|mjs|cjs|css)$/.test(f));
for (const file of sourceFiles) {
  const text = readFileSync(file, "utf8");
  const path = rel(file);
  for (const rule of RULES) {
    const hits = text.match(rule.pattern);
    if (!hits) continue;
    const max = rule.maxPerFile?.[path];
    if (rule.allow[path] && (max === undefined || hits.length <= max)) {
      reviewed.push(`${rule.id} in ${path}: ${rule.allow[path]}`);
    } else if (rule.allow[path]) {
      problems.push(`${rule.id}: ${hits.length}× in ${path} (only ${max} reviewed)`);
    } else {
      problems.push(`${rule.id}: ${hits.length}× in ${path}`);
    }
  }
  // External hosts in http(s)://, protocol-relative // and ws(s):// URLs.
  for (const m of text.matchAll(
    /(?:https?:|wss?:)?\/\/([a-z0-9-]+(?:\.[a-z0-9-]+)+)(?=[/:"'`\s?#)]|$)/gi,
  )) {
    if (!ALLOWED_URL_HOSTS.has(m[1].toLowerCase()))
      problems.push(`external URL host "${m[1]}" in ${path}`);
  }
}

if (existsSync(join(SRC, "app", "api")))
  problems.push("src/app/api exists — API routes are not allowed");
for (const f of sourceFiles)
  if (/[/\\]route\.(ts|js)$/.test(f)) problems.push(`route handler ${rel(f)} — not allowed`);
for (const dir of [SRC, ROOT])
  for (const name of ["middleware.ts", "middleware.js", "proxy.ts", "proxy.js"])
    if (existsSync(join(dir, name))) problems.push(`${rel(join(dir, name))} present — not allowed`);

const pkg = JSON.parse(readFileSync(join(ROOT, "package.json"), "utf8"));
for (const dep of Object.keys(pkg.dependencies ?? {})) {
  if (
    /analytics|firebase|supabase|sentry|posthog|mixpanel|segment|axios|amplitude|hotjar|idb|dexie|localforage|^ky$|^got$|socket\.io|^swr$|react-query|pusher|ably/i.test(
      dep,
    )
  )
    problems.push(`dependency "${dep}" looks like tracking, storage or a network client`);
}

/** The CSP string from src/lib/security/csp.ts (the single source of truth). */
function sourceCsp() {
  const src = readFileSync(join(SRC, "lib", "security", "csp.ts"), "utf8");
  const body = /CONTENT_SECURITY_POLICY\s*=\s*\[([\s\S]*?)\]\.join/.exec(src)?.[1] ?? "";
  return [...body.matchAll(/"([^"]+)"/g)].map((m) => m[1]).join("; ");
}
const CSP = sourceCsp();
if (!/connect-src 'self'(;|$)/.test(CSP)) problems.push("csp.ts must keep connect-src 'self' only");
const headersFile = join(ROOT, "public", "_headers");
const headerCsp = existsSync(headersFile)
  ? /Content-Security-Policy:\s*(.+)/.exec(readFileSync(headersFile, "utf8"))?.[1]?.trim()
  : null;
if (headerCsp !== `${CSP}; frame-ancestors 'none'`)
  problems.push("public/_headers CSP is out of sync with src/lib/security/csp.ts");

// Vercel ignores public/_headers; vercel.json must carry the same headers.
const vercelFile = join(ROOT, "vercel.json");
if (existsSync(vercelFile)) {
  const config = JSON.parse(readFileSync(vercelFile, "utf8"));
  const all = (config.headers ?? []).find((h) => h.source === "/(.*)")?.headers ?? [];
  const value = (key) => all.find((h) => h.key.toLowerCase() === key.toLowerCase())?.value;
  if (value("Content-Security-Policy") !== `${CSP}; frame-ancestors 'none'`)
    problems.push("vercel.json CSP is out of sync with src/lib/security/csp.ts");
  const headerLines = existsSync(headersFile)
    ? [...readFileSync(headersFile, "utf8").matchAll(/^\s+([\w-]+):\s*(.+)$/gm)]
    : [];
  for (const [, key, val] of headerLines)
    if (key !== "Content-Security-Policy" && value(key) !== val.trim())
      problems.push(`vercel.json header ${key} differs from public/_headers`);
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
      const meta = /http-equiv="Content-Security-Policy" content="([^"]+)"/.exec(html)?.[1];
      if (!meta) problems.push(`built ${rel(file)} has no CSP meta tag`);
      else if (meta.replaceAll("&#x27;", "'").replaceAll("&#39;", "'") !== CSP)
        problems.push(`built ${rel(file)} CSP differs from src/lib/security/csp.ts`);
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
