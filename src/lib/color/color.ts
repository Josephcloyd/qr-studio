/**
 * Color utilities. Colors in QR Studio are hex strings: `#rrggbb` or `#rrggbbaa`.
 * Everything here is pure and side-effect free.
 */

const HEX_PATTERN = /^#([0-9a-f]{6}|[0-9a-f]{8})$/i;
const SHORT_HEX_PATTERN = /^#([0-9a-f]{3})$/i;

export interface Rgba {
  r: number;
  g: number;
  b: number;
  a: number;
}

export function isHexColor(value: string): boolean {
  return HEX_PATTERN.test(value);
}

/** Normalizes `#abc` → `#aabbcc` and lowercases. Returns null when invalid. */
export function normalizeHex(value: string): string | null {
  const trimmed = value.trim();
  if (SHORT_HEX_PATTERN.test(trimmed)) {
    const [r, g, b] = trimmed.slice(1).split("");
    return `#${r}${r}${g}${g}${b}${b}`.toLowerCase();
  }
  if (HEX_PATTERN.test(trimmed)) return trimmed.toLowerCase();
  if (/^[0-9a-f]{6}$/i.test(trimmed)) return `#${trimmed.toLowerCase()}`;
  return null;
}

export function parseHex(value: string): Rgba {
  const hex = normalizeHex(value);
  if (!hex) throw new Error(`Invalid hex color: ${value}`);
  const int = (start: number) => parseInt(hex.slice(start, start + 2), 16);
  return {
    r: int(1),
    g: int(3),
    b: int(5),
    a: hex.length === 9 ? int(7) / 255 : 1,
  };
}

export function toHex({ r, g, b, a }: Rgba): string {
  const part = (n: number) =>
    Math.round(Math.min(255, Math.max(0, n)))
      .toString(16)
      .padStart(2, "0");
  const alpha = a >= 1 ? "" : part(a * 255);
  return `#${part(r)}${part(g)}${part(b)}${alpha}`;
}

/** Composites `top` over `bottom` (both may have alpha; result is opaque if bottom is). */
export function composite(top: string, bottom: string): string {
  const t = parseHex(top);
  const b = parseHex(bottom);
  const a = t.a + b.a * (1 - t.a);
  if (a === 0) return "#00000000";
  const channel = (tc: number, bc: number) => (tc * t.a + bc * b.a * (1 - t.a)) / a;
  return toHex({ r: channel(t.r, b.r), g: channel(t.g, b.g), b: channel(t.b, b.b), a });
}

/** WCAG 2.x relative luminance of an opaque color. */
export function relativeLuminance(value: string): number {
  const { r, g, b } = parseHex(value);
  const linear = (c: number) => {
    const s = c / 255;
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * linear(r) + 0.7152 * linear(g) + 0.0722 * linear(b);
}

/** WCAG contrast ratio, 1..21. Alpha is composited over white first. */
export function contrastRatio(a: string, b: string): number {
  const la = relativeLuminance(composite(a, "#ffffff"));
  const lb = relativeLuminance(composite(b, "#ffffff"));
  const [hi, lo] = la > lb ? [la, lb] : [lb, la];
  return (hi + 0.05) / (lo + 0.05);
}

export function isLight(value: string): boolean {
  return relativeLuminance(composite(value, "#ffffff")) > 0.4;
}
