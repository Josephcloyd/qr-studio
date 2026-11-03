import { NO_PAINT, solid, type Paint } from "@/lib/model/paint";

export type EcLevel = "L" | "M" | "Q" | "H";
export const EC_LEVELS: EcLevel[] = ["L", "M", "Q", "H"];
export const EC_RECOVERY: Record<EcLevel, number> = { L: 0.07, M: 0.15, Q: 0.25, H: 0.3 };
export const EC_LABELS: Record<EcLevel, string> = {
  L: "Low · 7%",
  M: "Medium · 15%",
  Q: "Quartile · 25%",
  H: "High · 30%",
};

export type DotStyle = "square" | "rounded" | "fluid" | "classy" | "dots" | "diamond";
export type FinderFrameStyle = "square" | "rounded" | "circle" | "leaf";
export type FinderDotStyle = "square" | "rounded" | "circle" | "leaf" | "diamond";
export type LogoPlate = "none" | "square" | "rounded" | "circle";

export const DOT_STYLES: { id: DotStyle; label: string }[] = [
  { id: "square", label: "Square" },
  { id: "rounded", label: "Rounded" },
  { id: "fluid", label: "Fluid" },
  { id: "classy", label: "Classy" },
  { id: "dots", label: "Dots" },
  { id: "diamond", label: "Diamond" },
];
export const FINDER_FRAME_STYLES: { id: FinderFrameStyle; label: string }[] = [
  { id: "square", label: "Square" },
  { id: "rounded", label: "Rounded" },
  { id: "circle", label: "Circle" },
  { id: "leaf", label: "Leaf" },
];
export const FINDER_DOT_STYLES: { id: FinderDotStyle; label: string }[] = [
  { id: "square", label: "Square" },
  { id: "rounded", label: "Rounded" },
  { id: "circle", label: "Circle" },
  { id: "leaf", label: "Leaf" },
  { id: "diamond", label: "Diamond" },
];

/**
 * Finder frame → finder dot pairings that decode reliably with every module
 * style (verified by tests/decode). Other pairings distort the 1:1:3:1:1
 * ratio scanners look for, so they are mapped to the first safe option.
 */
export const FINDER_COMPATIBILITY: Record<FinderFrameStyle, FinderDotStyle[]> = {
  square: ["square", "rounded"],
  rounded: ["rounded", "square", "circle", "leaf"],
  circle: ["circle", "rounded", "leaf", "diamond"],
  leaf: ["leaf", "rounded", "circle"],
};

export function isFinderPairSafe(frame: FinderFrameStyle, dot: FinderDotStyle): boolean {
  return FINDER_COMPATIBILITY[frame].includes(dot);
}

export function safeFinderDot(frame: FinderFrameStyle, dot: FinderDotStyle): FinderDotStyle {
  return isFinderPairSafe(frame, dot) ? dot : FINDER_COMPATIBILITY[frame][0];
}

export interface QrLogo {
  assetId: string | null;
  visible: boolean;
  /** Logo width as a fraction of the code width (excluding quiet zone). */
  size: number;
  /** Offset from center as a fraction of the code width. */
  offsetX: number;
  offsetY: number;
  opacity: number;
  plate: LogoPlate;
  plateColor: string;
  /** Padding around the logo inside the plate, in modules. */
  platePadding: number;
  /** Remove modules behind the logo (recommended — keeps scanning reliable). */
  clearBehind: boolean;
}

export interface QrStyle {
  ecLevel: EcLevel;
  /** Quiet zone in modules. */
  margin: number;
  dotStyle: DotStyle;
  finderFrame: FinderFrameStyle;
  finderDot: FinderDotStyle;
  foreground: Paint;
  /** Optional finder colors; null uses the foreground paint. */
  finderFrameColor: string | null;
  finderDotColor: string | null;
  background: Paint;
  logo: QrLogo;
}

export const MIN_MARGIN = 2;
export const RECOMMENDED_MARGIN = 4;
export const MAX_MARGIN = 10;
export const MIN_LOGO_SIZE = 0.1;
/** Hard upper bound for logo width per EC level — keeps enough data recoverable. */
export const MAX_LOGO_SIZE: Record<EcLevel, number> = { L: 0.14, M: 0.2, Q: 0.26, H: 0.3 };
export const MAX_LOGO_OFFSET = 0.2;

export const DEFAULT_LOGO: QrLogo = {
  assetId: null,
  visible: true,
  size: 0.22,
  offsetX: 0,
  offsetY: 0,
  opacity: 1,
  plate: "rounded",
  plateColor: "#ffffff",
  platePadding: 1,
  clearBehind: true,
};

export const DEFAULT_QR_STYLE: QrStyle = {
  ecLevel: "M",
  margin: RECOMMENDED_MARGIN,
  dotStyle: "square",
  finderFrame: "square",
  finderDot: "square",
  foreground: solid("#111111"),
  finderFrameColor: null,
  finderDotColor: null,
  background: solid("#ffffff"),
  logo: DEFAULT_LOGO,
};

export const TRANSPARENT = NO_PAINT;

export function hasActiveLogo(style: QrStyle): boolean {
  return style.logo.assetId !== null && style.logo.visible;
}

/** With a logo present we never encode below Q, so damage stays recoverable. */
export function effectiveEcLevel(style: QrStyle): EcLevel {
  if (!hasActiveLogo(style)) return style.ecLevel;
  return style.ecLevel === "L" || style.ecLevel === "M" ? "Q" : style.ecLevel;
}

export function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

/** Applies every hard readability constraint. Decoration can never break these. */
export function sanitizeQrStyle(style: QrStyle): QrStyle {
  const ec = effectiveEcLevel(style);
  return {
    ...style,
    finderDot: safeFinderDot(style.finderFrame, style.finderDot),
    margin: clamp(Math.round(style.margin), MIN_MARGIN, MAX_MARGIN),
    logo: {
      ...style.logo,
      size: clamp(style.logo.size, MIN_LOGO_SIZE, MAX_LOGO_SIZE[ec]),
      offsetX: clamp(style.logo.offsetX, -MAX_LOGO_OFFSET, MAX_LOGO_OFFSET),
      offsetY: clamp(style.logo.offsetY, -MAX_LOGO_OFFSET, MAX_LOGO_OFFSET),
      opacity: clamp(style.logo.opacity, 0, 1),
      platePadding: clamp(style.logo.platePadding, 0, 3),
    },
  };
}
