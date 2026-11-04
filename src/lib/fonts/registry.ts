/**
 * Fonts available in the editor. Bundled fonts are OFL-licensed files served
 * from /fonts on our own origin (never a CDN) and are embedded into SVG
 * exports. System fonts render with whatever the viewer's device has.
 */

export interface FontOption {
  id: string;
  label: string;
  family: string;
  category: "sans" | "serif" | "display" | "script" | "mono";
  /** Variable weight range or the single available weight. */
  weights: [number, number];
  file: string | null;
  italicFile: string | null;
  fallback: string;
}

export const FONTS: FontOption[] = [
  {
    id: "inter",
    label: "Inter",
    family: "Inter",
    category: "sans",
    weights: [100, 900],
    file: "inter.woff2",
    italicFile: "inter-italic.woff2",
    fallback: "system-ui, sans-serif",
  },
  {
    id: "outfit",
    label: "Outfit",
    family: "Outfit",
    category: "sans",
    weights: [100, 900],
    file: "outfit.woff2",
    italicFile: null,
    fallback: "system-ui, sans-serif",
  },
  {
    id: "space-grotesk",
    label: "Space Grotesk",
    family: "Space Grotesk",
    category: "sans",
    weights: [300, 700],
    file: "space-grotesk.woff2",
    italicFile: null,
    fallback: "system-ui, sans-serif",
  },
  {
    id: "fraunces",
    label: "Fraunces",
    family: "Fraunces",
    category: "serif",
    weights: [100, 900],
    file: "fraunces.woff2",
    italicFile: "fraunces-italic.woff2",
    fallback: "Georgia, serif",
  },
  {
    id: "playfair-display",
    label: "Playfair Display",
    family: "Playfair Display",
    category: "serif",
    weights: [400, 900],
    file: "playfair-display.woff2",
    italicFile: "playfair-display-italic.woff2",
    fallback: "Georgia, serif",
  },
  {
    id: "dm-serif-display",
    label: "DM Serif Display",
    family: "DM Serif Display",
    category: "display",
    weights: [400, 400],
    file: "dm-serif-display.woff2",
    italicFile: null,
    fallback: "Georgia, serif",
  },
  {
    id: "bebas-neue",
    label: "Bebas Neue",
    family: "Bebas Neue",
    category: "display",
    weights: [400, 400],
    file: "bebas-neue.woff2",
    italicFile: null,
    fallback: "Impact, sans-serif",
  },
  {
    id: "caveat",
    label: "Caveat",
    family: "Caveat",
    category: "script",
    weights: [400, 700],
    file: "caveat.woff2",
    italicFile: null,
    fallback: "cursive",
  },
  {
    id: "jetbrains-mono",
    label: "JetBrains Mono",
    family: "JetBrains Mono",
    category: "mono",
    weights: [100, 800],
    file: "jetbrains-mono.woff2",
    italicFile: null,
    fallback: "ui-monospace, monospace",
  },
  {
    id: "system-sans",
    label: "System Sans",
    family: "system-ui",
    category: "sans",
    weights: [100, 900],
    file: null,
    italicFile: null,
    fallback: "-apple-system, 'Segoe UI', Roboto, sans-serif",
  },
  {
    id: "system-serif",
    label: "System Serif",
    family: "Georgia",
    category: "serif",
    weights: [400, 700],
    file: null,
    italicFile: null,
    fallback: "'Times New Roman', serif",
  },
];

export const DEFAULT_FONT_ID = "inter";
export const FONT_ASSET_BASE = "/fonts/";

export function getFont(id: string): FontOption {
  return FONTS.find((f) => f.id === id) ?? FONTS[0];
}

/** CSS font-family value with fallbacks. */
export function fontStack(id: string): string {
  const font = getFont(id);
  const primary = font.family.includes(" ") ? `'${font.family}'` : font.family;
  return `${primary}, ${font.fallback}`;
}

/**
 * `document.fonts.load()` queries covering every face we ship for a font —
 * including italics, which live in separate files and would otherwise be
 * measured with a fallback font the first time they're used.
 */
export function fontLoadQueries(font: FontOption): string[] {
  if (!font.file) return [];
  const family = `'${font.family}'`;
  const queries = [`400 16px ${family}`, `700 16px ${family}`];
  if (font.italicFile) queries.push(`italic 400 16px ${family}`, `italic 700 16px ${family}`);
  return queries;
}

export function clampWeight(id: string, weight: number): number {
  const [min, max] = getFont(id).weights;
  return Math.min(max, Math.max(min, weight));
}
