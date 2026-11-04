// Collects the license texts of everything we ship to visitors (runtime
// dependencies and bundled fonts) into public/third-party-notices.txt.
// MIT/ISC/Apache-2.0/OFL all require their notice to accompany copies.
// Runs automatically before `npm run build`.
import { existsSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const ROOT = process.cwd();
const pkg = JSON.parse(readFileSync(join(ROOT, "package.json"), "utf8"));

/** Runtime packages that ship in the browser bundle, plus the font packages we copy files from. */
const FONT_PACKAGES = Object.keys(pkg.devDependencies).filter((d) => d.startsWith("@fontsource"));
const PACKAGES = [...Object.keys(pkg.dependencies), ...FONT_PACKAGES].sort();

function licenseText(dir) {
  const file = readdirSync(dir).find((f) => /^(licen[cs]e|copying)(\.(md|txt))?$/i.test(f));
  return file ? readFileSync(join(dir, file), "utf8").trim() : null;
}

const sections = [];
const missing = [];
for (const name of PACKAGES) {
  const dir = join(ROOT, "node_modules", name);
  if (!existsSync(dir)) {
    missing.push(name);
    continue;
  }
  const meta = JSON.parse(readFileSync(join(dir, "package.json"), "utf8"));
  const text = licenseText(dir);
  const notice = existsSync(join(dir, "NOTICE"))
    ? `\n\n${readFileSync(join(dir, "NOTICE"), "utf8").trim()}`
    : "";
  if (!text) missing.push(name);
  sections.push(
    [
      `${meta.name} ${meta.version} — ${meta.license ?? "see below"}`,
      meta.homepage ?? "",
      "",
      text ?? `License: ${meta.license}`,
      notice,
    ]
      .join("\n")
      .trim(),
  );
}

const header = `QR Studio — third-party notices
QR Studio is a free tool by GetLaunch Ph. It includes the open-source software
and fonts listed below, each under its own license.

"QR Code" is a registered trademark of DENSO WAVE INCORPORATED.
Icons: Lucide (ISC). Fonts: SIL Open Font License 1.1 (see each font below).
`;

writeFileSync(
  join(ROOT, "public", "third-party-notices.txt"),
  `${header}\n${"=".repeat(72)}\n\n${sections.join(`\n\n${"=".repeat(72)}\n\n`)}\n`,
);
console.log(`Wrote public/third-party-notices.txt (${sections.length} packages).`);
if (missing.length)
  console.warn(`No LICENSE file found for: ${missing.join(", ")} (license id recorded instead).`);
