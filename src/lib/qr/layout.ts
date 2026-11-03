/**
 * Turns a module matrix + style into renderable geometry (in module units).
 * Pure: the same function feeds the live editor, every export, and the tests.
 */
import {
  circlePath,
  diamondPath,
  fmt,
  rectPath,
  roundedRectPath,
  type Radii,
} from "@/lib/geometry/paths";
import { finderOrigins, isDark, isFinderModule, isFunctionalModule, type QrMatrix } from "./matrix";
import {
  hasActiveLogo,
  sanitizeQrStyle,
  type DotStyle,
  type FinderDotStyle,
  type FinderFrameStyle,
  type QrStyle,
} from "./style";

export interface Rect {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface FinderGeometry {
  frame: string;
  dot: string;
}

export interface QrLayout {
  /** Side length in modules including the quiet zone. */
  total: number;
  margin: number;
  moduleCount: number;
  version: number;
  modulesPath: string;
  finders: FinderGeometry[];
  logo: Rect | null;
  plate: Rect | null;
  /** Fraction of the code area covered by the logo plate (0..1). */
  logoCoverage: number;
  darkModules: number;
}

type Neighbors = { top: boolean; right: boolean; bottom: boolean; left: boolean };

function moduleShape(style: DotStyle, x: number, y: number, n: Neighbors): string {
  const exposed = (a: boolean, b: boolean) => !a && !b;
  const corners = (r: number, mask: [boolean, boolean, boolean, boolean]): Radii => [
    mask[0] && exposed(n.top, n.left) ? r : 0,
    mask[1] && exposed(n.top, n.right) ? r : 0,
    mask[2] && exposed(n.bottom, n.right) ? r : 0,
    mask[3] && exposed(n.bottom, n.left) ? r : 0,
  ];
  switch (style) {
    case "square":
      return rectPath(x, y, 1, 1);
    case "rounded":
      return roundedRectPath(x, y, 1, 1, corners(0.3, [true, true, true, true]));
    case "fluid":
      return roundedRectPath(x, y, 1, 1, corners(0.5, [true, true, true, true]));
    case "classy":
      return roundedRectPath(x, y, 1, 1, corners(0.5, [true, false, true, false]));
    case "dots":
      return circlePath(x + 0.5, y + 0.5, 0.48);
    case "diamond":
      return diamondPath(x + 0.5, y + 0.5, 0.58);
  }
}

function finderFrame(style: FinderFrameStyle, x: number, y: number): string {
  switch (style) {
    case "square":
      return rectPath(x, y, 7, 7) + rectPath(x + 1, y + 1, 5, 5);
    case "rounded":
      return roundedRectPath(x, y, 7, 7, [2, 2, 2, 2]) + roundedRectPath(x + 1, y + 1, 5, 5, [1.2, 1.2, 1.2, 1.2]);
    case "circle":
      return circlePath(x + 3.5, y + 3.5, 3.5) + circlePath(x + 3.5, y + 3.5, 2.5);
    case "leaf":
      return roundedRectPath(x, y, 7, 7, [3, 0, 3, 0]) + roundedRectPath(x + 1, y + 1, 5, 5, [2, 0, 2, 0]);
  }
}

function finderDot(style: FinderDotStyle, x: number, y: number): string {
  const dx = x + 2;
  const dy = y + 2;
  switch (style) {
    case "square":
      return rectPath(dx, dy, 3, 3);
    case "rounded":
      return roundedRectPath(dx, dy, 3, 3, [0.9, 0.9, 0.9, 0.9]);
    case "circle":
      return circlePath(dx + 1.5, dy + 1.5, 1.5);
    case "leaf":
      return roundedRectPath(dx, dy, 3, 3, [1.4, 0, 1.4, 0]);
    case "diamond":
      return diamondPath(dx + 1.5, dy + 1.5, 1.75);
  }
}

function clampCenter(center: number, half: number, lo: number, hi: number): number {
  if (hi - lo <= half * 2) return (lo + hi) / 2;
  return Math.min(hi - half, Math.max(lo + half, center));
}

function logoGeometry(
  style: QrStyle,
  size: number,
  margin: number,
  logoAspect: number,
): { logo: Rect; plate: Rect } {
  const { logo } = style;
  const circle = logo.plate === "circle";
  // A circular plate has the same footprint as a square one of equal size;
  // the logo is fitted inside the circle rather than the circle growing.
  const long = logo.size * size;
  const fit = circle ? long / Math.hypot(1, logoAspect >= 1 ? 1 / logoAspect : logoAspect) : long;
  const w = logoAspect >= 1 ? fit : fit * logoAspect;
  const h = logoAspect >= 1 ? fit / logoAspect : fit;
  const pad = logo.plate === "none" ? (logo.clearBehind ? 0.5 : 0) : logo.platePadding;
  const plateW = circle ? long + pad * 2 : w + pad * 2;
  const plateH = circle ? plateW : h + pad * 2;
  // Keep the plate clear of the finder patterns (7 modules + 1 separator).
  const lo = margin + 8;
  const hi = margin + size - 8;
  const cx = clampCenter(margin + size / 2 + logo.offsetX * size, plateW / 2, lo, hi);
  const cy = clampCenter(margin + size / 2 + logo.offsetY * size, plateH / 2, lo, hi);
  return {
    logo: { x: cx - w / 2, y: cy - h / 2, width: w, height: h },
    plate: { x: cx - plateW / 2, y: cy - plateH / 2, width: plateW, height: plateH },
  };
}

function overlapsPlate(plate: Rect, circle: boolean, x: number, y: number): boolean {
  const EPS = 0.12;
  if (circle) {
    const r = plate.width / 2;
    const cx = plate.x + r;
    const cy = plate.y + r;
    const nx = Math.max(x, Math.min(cx, x + 1));
    const ny = Math.max(y, Math.min(cy, y + 1));
    return Math.hypot(nx - cx, ny - cy) < r - EPS;
  }
  return (
    x + 1 > plate.x + EPS &&
    x < plate.x + plate.width - EPS &&
    y + 1 > plate.y + EPS &&
    y < plate.y + plate.height - EPS
  );
}

export interface LayoutOptions {
  /** width / height of the logo image; defaults to square. */
  logoAspect?: number;
}

export function computeQrLayout(matrix: QrMatrix, rawStyle: QrStyle, options: LayoutOptions = {}): QrLayout {
  const style = sanitizeQrStyle(rawStyle);
  const { size } = matrix;
  const margin = style.margin;
  const withLogo = hasActiveLogo(style);
  const geo = withLogo ? logoGeometry(style, size, margin, options.logoAspect ?? 1) : null;
  const clearPlate = geo && (style.logo.clearBehind || style.logo.plate !== "none") ? geo.plate : null;
  const circlePlate = style.logo.plate === "circle";

  const cleared = (row: number, col: number) =>
    clearPlate !== null && overlapsPlate(clearPlate, circlePlate, col + margin, row + margin);
  const on = (row: number, col: number) =>
    isDark(matrix, row, col) && !isFinderModule(size, row, col) && !cleared(row, col);

  const parts: string[] = [];
  let darkModules = 0;
  for (let row = 0; row < size; row++) {
    for (let col = 0; col < size; col++) {
      if (!on(row, col)) continue;
      darkModules++;
      // Isolated-shape styles (dots, diamonds) would break alignment/timing
      // detection, so functional modules always draw as connected squares.
      const functional =
        (style.dotStyle === "dots" || style.dotStyle === "diamond") && isFunctionalModule(matrix, row, col);
      parts.push(
        moduleShape(functional ? "square" : style.dotStyle, col + margin, row + margin, {
          top: on(row - 1, col),
          right: on(row, col + 1),
          bottom: on(row + 1, col),
          left: on(row, col - 1),
        }),
      );
    }
  }

  const finders = finderOrigins(size).map(({ row, col }) => ({
    frame: finderFrame(style.finderFrame, col + margin, row + margin),
    dot: finderDot(style.finderDot, col + margin, row + margin),
  }));

  const coverage = geo ? (geo.plate.width * geo.plate.height) / (size * size) : 0;

  return {
    total: size + margin * 2,
    margin,
    moduleCount: size,
    version: matrix.version,
    modulesPath: parts.join(""),
    finders,
    logo: geo?.logo ?? null,
    plate: geo && style.logo.plate !== "none" ? geo.plate : null,
    logoCoverage: Math.min(1, coverage),
    darkModules,
  };
}

/** Exposed for tests/debugging: formats a rect as a path. */
export const rectToPath = (r: Rect): string => rectPath(r.x, r.y, r.width, r.height);
export { fmt };
