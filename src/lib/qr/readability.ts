/**
 * Readability analysis. Scannability always outranks decoration: these checks
 * surface every risk, and the hard limits live in `sanitizeQrStyle`.
 */
import { contrastRatio, composite, relativeLuminance } from "@/lib/color/color";
import { paintColors } from "@/lib/model/paint";
import type { QrLayout } from "./layout";
import { EC_RECOVERY, RECOMMENDED_MARGIN, effectiveEcLevel, hasActiveLogo, type QrStyle } from "./style";

export type IssueSeverity = "error" | "warning" | "info";

export interface ReadabilityIssue {
  id: string;
  severity: IssueSeverity;
  message: string;
}

export interface ReadabilityContext {
  /** Color behind the code when its background is transparent. */
  backdrop?: string | null;
  /** Physical printed width of the whole code, in millimetres. */
  printWidthMm?: number | null;
}

export const CONTRAST_ERROR = 2.5;
export const CONTRAST_WARNING = 4;
/** Below this module size (mm) phones struggle to resolve the code. */
export const MIN_MODULE_MM = 0.35;

function minContrast(fgs: string[], bgs: string[]): number {
  let min = Infinity;
  for (const f of fgs) for (const b of bgs) min = Math.min(min, contrastRatio(composite(f, b), b));
  return min;
}

function backgroundColors(style: QrStyle, ctx: ReadabilityContext): string[] | null {
  const own = paintColors(style.background);
  if (own.length) return own.map((c) => composite(c, ctx.backdrop ?? "#ffffff"));
  return ctx.backdrop ? [ctx.backdrop] : null;
}

function contrastIssues(style: QrStyle, ctx: ReadabilityContext): ReadabilityIssue[] {
  const issues: ReadabilityIssue[] = [];
  const bgs = backgroundColors(style, ctx);
  if (!bgs) {
    issues.push({
      id: "transparent-bg",
      severity: "warning",
      message:
        "The background is transparent. Make sure whatever sits behind the code is light and plain.",
    });
    return issues;
  }
  const fgs = [
    ...paintColors(style.foreground),
    ...(style.finderFrameColor ? [style.finderFrameColor] : []),
    ...(style.finderDotColor ? [style.finderDotColor] : []),
  ];
  const ratio = minContrast(fgs, bgs);
  if (ratio < CONTRAST_ERROR) {
    issues.push({
      id: "contrast-low",
      severity: "error",
      message: `Contrast is very low (${ratio.toFixed(1)}:1). Most scanners will fail — use darker modules or a lighter background.`,
    });
  } else if (ratio < CONTRAST_WARNING) {
    issues.push({
      id: "contrast-weak",
      severity: "warning",
      message: `Contrast is weak (${ratio.toFixed(1)}:1). Aim for at least ${CONTRAST_WARNING}:1 for reliable scanning.`,
    });
  }
  const avg = (cs: string[]) => cs.reduce((s, c) => s + relativeLuminance(composite(c, "#ffffff")), 0) / cs.length;
  if (fgs.length && avg(fgs) > avg(bgs)) {
    issues.push({
      id: "inverted",
      severity: "warning",
      message: "Light modules on a dark background (inverted) aren't supported by some scanners.",
    });
  }
  return issues;
}

function logoIssues(style: QrStyle, layout: QrLayout): ReadabilityIssue[] {
  if (!hasActiveLogo(style)) return [];
  const issues: ReadabilityIssue[] = [];
  const recovery = EC_RECOVERY[effectiveEcLevel(style)];
  const share = layout.logoCoverage / recovery;
  if (share > 0.85) {
    issues.push({
      id: "logo-too-big",
      severity: "error",
      message: "The logo covers too much of the code to recover reliably. Make it smaller.",
    });
  } else if (share > 0.6) {
    issues.push({
      id: "logo-large",
      severity: "warning",
      message: "The logo is large. Test-scan the code, or reduce the logo size for a safer margin.",
    });
  }
  if (!style.logo.clearBehind && style.logo.plate === "none") {
    issues.push({
      id: "logo-overlap",
      severity: "warning",
      message: "The logo is drawn over modules. Turn on “Clear modules behind logo” for cleaner scans.",
    });
  }
  if (style.ecLevel !== effectiveEcLevel(style)) {
    issues.push({
      id: "ec-raised",
      severity: "info",
      message: `Error correction raised to ${effectiveEcLevel(style)} because the code has a logo.`,
    });
  }
  return issues;
}

export function analyzeReadability(
  style: QrStyle,
  layout: QrLayout,
  ctx: ReadabilityContext = {},
): ReadabilityIssue[] {
  const issues = [...contrastIssues(style, ctx), ...logoIssues(style, layout)];
  if (layout.margin < RECOMMENDED_MARGIN) {
    issues.push({
      id: "quiet-zone",
      severity: "warning",
      message: `The quiet zone is ${layout.margin} modules. ${RECOMMENDED_MARGIN} is the standard — keep the border clear.`,
    });
  }
  if (ctx.printWidthMm) {
    const moduleMm = ctx.printWidthMm / layout.total;
    if (moduleMm < MIN_MODULE_MM) {
      const minMm = Math.ceil(MIN_MODULE_MM * layout.total);
      issues.push({
        id: "print-small",
        severity: "warning",
        message: `Printed this small, each module is ${moduleMm.toFixed(2)} mm. Print the code at least ${minMm} mm wide, or shorten the content.`,
      });
    }
  }
  if (layout.version >= 20) {
    issues.push({
      id: "dense",
      severity: "info",
      message: `This is a dense code (version ${layout.version}). Shorter content scans faster.`,
    });
  }
  return issues;
}

export function worstSeverity(issues: ReadabilityIssue[]): IssueSeverity | null {
  if (issues.some((i) => i.severity === "error")) return "error";
  if (issues.some((i) => i.severity === "warning")) return "warning";
  return issues.length ? "info" : null;
}
