/**
 * Text wrapping shared by the live editor and every export, so line breaks
 * are identical everywhere. Measurement is injected: the browser uses canvas
 * `measureText`; tests use the deterministic approximation.
 */
import type { TextElement } from "@/lib/model/types";

export interface TextMetricsSpec {
  fontFamily: string;
  fontSize: number;
  fontWeight: number;
  italic: boolean;
  /** em */
  letterSpacing: number;
}

/** Returns the advance width of `text` in document units. */
export type Measure = (text: string, spec: TextMetricsSpec) => number;

export const approximateMeasure: Measure = (text, spec) =>
  [...text].length * spec.fontSize * (0.56 + spec.letterSpacing);

function breakWord(word: string, maxWidth: number, spec: TextMetricsSpec, measure: Measure): string[] {
  const pieces: string[] = [];
  let current = "";
  for (const char of word) {
    if (current && measure(current + char, spec) > maxWidth) {
      pieces.push(current);
      current = char;
    } else {
      current += char;
    }
  }
  if (current) pieces.push(current);
  return pieces;
}

function wrapParagraph(paragraph: string, maxWidth: number, spec: TextMetricsSpec, measure: Measure): string[] {
  if (!paragraph) return [""];
  const words = paragraph.split(/(\s+)/).filter((w) => w.length > 0);
  const lines: string[] = [];
  let line = "";
  for (const word of words) {
    const candidate = line + word;
    if (!line || measure(candidate.trimEnd(), spec) <= maxWidth) {
      if (!line && measure(word, spec) > maxWidth && word.trim()) {
        const pieces = breakWord(word, maxWidth, spec, measure);
        lines.push(...pieces.slice(0, -1));
        line = pieces[pieces.length - 1] ?? "";
      } else {
        line = candidate;
      }
      continue;
    }
    lines.push(line.trimEnd());
    if (!word.trim()) {
      line = "";
    } else if (measure(word, spec) > maxWidth) {
      const pieces = breakWord(word, maxWidth, spec, measure);
      lines.push(...pieces.slice(0, -1));
      line = pieces[pieces.length - 1] ?? "";
    } else {
      line = word;
    }
  }
  lines.push(line.trimEnd());
  return lines;
}

export function wrapText(text: string, maxWidth: number, spec: TextMetricsSpec, measure: Measure): string[] {
  const width = Math.max(1, maxWidth);
  return text.split(/\r\n|\r|\n/).flatMap((p) => wrapParagraph(p, width, spec, measure));
}

export interface TextLayout {
  lines: string[];
  lineHeight: number;
  /** Full element height including padding. */
  height: number;
}

export function textSpec(el: TextElement): TextMetricsSpec {
  return {
    fontFamily: el.fontFamily,
    fontSize: el.fontSize,
    fontWeight: el.fontWeight,
    italic: el.italic,
    letterSpacing: el.letterSpacing,
  };
}

export function displayText(el: Pick<TextElement, "text" | "uppercase">): string {
  return el.uppercase ? el.text.toUpperCase() : el.text;
}

export function layoutText(el: TextElement, measure: Measure): TextLayout {
  const innerWidth = el.width - el.padding * 2;
  const lines = wrapText(displayText(el), innerWidth, textSpec(el), measure);
  const lineHeight = el.fontSize * el.lineHeight;
  return { lines, lineHeight, height: lines.length * lineHeight + el.padding * 2 };
}

/** Width of the widest line — used to "fit width to text". */
export function naturalWidth(el: TextElement, measure: Measure): number {
  const lines = displayText(el).split(/\r\n|\r|\n/);
  const widest = Math.max(...lines.map((l) => measure(l, textSpec(el))));
  return Math.ceil(widest + el.padding * 2 + 2);
}
