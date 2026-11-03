/** Browser text measurement via an offscreen canvas (local only). */
import { fontStack } from "@/lib/fonts/registry";
import { approximateMeasure, type Measure, type TextMetricsSpec } from "./layout";

const CACHE_LIMIT = 4000;
const cache = new Map<string, number>();
let context: CanvasRenderingContext2D | null = null;

function getContext(): CanvasRenderingContext2D | null {
  if (context) return context;
  if (typeof document === "undefined") return null;
  context = document.createElement("canvas").getContext("2d");
  return context;
}

export function fontShorthand(spec: TextMetricsSpec): string {
  const style = spec.italic ? "italic " : "";
  return `${style}${spec.fontWeight} ${spec.fontSize}px ${fontStack(spec.fontFamily)}`;
}

export const canvasMeasure: Measure = (text, spec) => {
  const ctx = getContext();
  if (!ctx) return approximateMeasure(text, spec);
  const font = fontShorthand(spec);
  const key = `${font}|${spec.letterSpacing}|${text}`;
  const hit = cache.get(key);
  if (hit !== undefined) return hit;
  ctx.font = font;
  const chars = [...text].length;
  const width = ctx.measureText(text).width + spec.letterSpacing * spec.fontSize * chars;
  if (cache.size >= CACHE_LIMIT) cache.clear();
  cache.set(key, width);
  return width;
};

/** Drop cached widths (call after web fonts finish loading). */
export function clearMeasureCache(): void {
  cache.clear();
}
