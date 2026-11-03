// Copies the bundled open-source (OFL) font files from @fontsource packages
// into public/fonts so they are served from our own origin — never a CDN.
// Run manually after changing the font list: `node scripts/copy-fonts.mjs`.
import { copyFileSync, existsSync, mkdirSync } from "node:fs";
import { join } from "node:path";

const OUT_DIR = join(process.cwd(), "public", "fonts");

/** [package dir, source file, output file] */
const FONTS = [
  ["@fontsource-variable/inter", "inter-latin-wght-normal.woff2", "inter.woff2"],
  ["@fontsource-variable/inter", "inter-latin-wght-italic.woff2", "inter-italic.woff2"],
  ["@fontsource-variable/fraunces", "fraunces-latin-wght-normal.woff2", "fraunces.woff2"],
  ["@fontsource-variable/fraunces", "fraunces-latin-wght-italic.woff2", "fraunces-italic.woff2"],
  [
    "@fontsource-variable/space-grotesk",
    "space-grotesk-latin-wght-normal.woff2",
    "space-grotesk.woff2",
  ],
  [
    "@fontsource-variable/playfair-display",
    "playfair-display-latin-wght-normal.woff2",
    "playfair-display.woff2",
  ],
  [
    "@fontsource-variable/playfair-display",
    "playfair-display-latin-wght-italic.woff2",
    "playfair-display-italic.woff2",
  ],
  ["@fontsource-variable/outfit", "outfit-latin-wght-normal.woff2", "outfit.woff2"],
  [
    "@fontsource-variable/jetbrains-mono",
    "jetbrains-mono-latin-wght-normal.woff2",
    "jetbrains-mono.woff2",
  ],
  ["@fontsource-variable/caveat", "caveat-latin-wght-normal.woff2", "caveat.woff2"],
  [
    "@fontsource/dm-serif-display",
    "dm-serif-display-latin-400-normal.woff2",
    "dm-serif-display.woff2",
  ],
  ["@fontsource/bebas-neue", "bebas-neue-latin-400-normal.woff2", "bebas-neue.woff2"],
];

mkdirSync(OUT_DIR, { recursive: true });
let failed = false;
for (const [pkg, file, out] of FONTS) {
  const src = join(process.cwd(), "node_modules", pkg, "files", file);
  if (!existsSync(src)) {
    console.error(`Missing font file: ${src}`);
    failed = true;
    continue;
  }
  copyFileSync(src, join(OUT_DIR, out));
}
if (failed) process.exit(1);
console.log(`Copied ${FONTS.length} font files to public/fonts`);
