import { describe, expect, it } from "vitest";
import { composite, contrastRatio, normalizeHex, parseHex, toHex, isLight } from "@/lib/color/color";
import { convertPaint, linear, paintColors, solid, NO_PAINT } from "@/lib/model/paint";
import { computeQrLayout } from "@/lib/qr/layout";
import { alignmentCoords, buildMatrix, isFunctionalModule } from "@/lib/qr/matrix";
import { analyzeReadability, worstSeverity } from "@/lib/qr/readability";
import {
  DEFAULT_LOGO,
  DEFAULT_QR_STYLE,
  MAX_LOGO_SIZE,
  effectiveEcLevel,
  sanitizeQrStyle,
  type QrStyle,
} from "@/lib/qr/style";

const style = (patch: Partial<QrStyle> = {}): QrStyle => ({ ...DEFAULT_QR_STYLE, ...patch });
const matrixFor = (payload: string, ec: QrStyle["ecLevel"] = "M") => {
  const r = buildMatrix(payload, ec);
  if (!r.ok) throw new Error(r.error);
  return r.matrix;
};

describe("color", () => {
  it("normalizes and parses hex", () => {
    expect(normalizeHex("#ABC")).toBe("#aabbcc");
    expect(normalizeHex("112233")).toBe("#112233");
    expect(normalizeHex("red")).toBeNull();
    expect(parseHex("#ff000080").a).toBeCloseTo(0.5, 1);
    expect(toHex({ r: 255, g: 0, b: 0, a: 1 })).toBe("#ff0000");
    expect(() => parseHex("nope")).toThrow();
  });
  it("computes WCAG contrast", () => {
    expect(contrastRatio("#000000", "#ffffff")).toBeCloseTo(21, 0);
    expect(contrastRatio("#777777", "#ffffff")).toBeCloseTo(4.48, 1);
    expect(isLight("#f5f5f5")).toBe(true);
    expect(isLight("#222222")).toBe(false);
  });
  it("composites alpha", () => {
    expect(composite("#00000080", "#ffffff")).toBe("#7f7f7f");
  });
});

describe("paint", () => {
  it("lists colors and converts kinds", () => {
    expect(paintColors(linear(0, "#111111", "#222222"))).toEqual(["#111111", "#222222"]);
    expect(paintColors(NO_PAINT)).toEqual([]);
    expect(convertPaint(solid("#123456"), "linear").kind).toBe("linear");
    expect(convertPaint(linear(0, "#111111", "#222222"), "solid")).toEqual(solid("#111111"));
    expect(convertPaint(solid("#123456"), "none")).toEqual(NO_PAINT);
    expect(convertPaint(solid("#123456"), "radial").kind).toBe("radial");
  });
});

describe("matrix", () => {
  it("builds and caches matrices", () => {
    const a = buildMatrix("hello", "M");
    expect(a.ok && a.matrix.size).toBe(21);
    expect(buildMatrix("hello", "M")).toBe(a);
  });
  it("reports capacity overflow", () => {
    const r = buildMatrix("x".repeat(3000), "H");
    expect(r.ok).toBe(false);
    expect(!r.ok && r.error).toMatch(/too long/);
  });
  it("rejects empty payloads", () => {
    expect(buildMatrix("", "L").ok).toBe(false);
  });
  it("computes alignment pattern coordinates (ISO 18004 table)", () => {
    expect(alignmentCoords(1)).toEqual([]);
    expect(alignmentCoords(2)).toEqual([6, 18]);
    expect(alignmentCoords(7)).toEqual([6, 22, 38]);
    expect(alignmentCoords(32)).toEqual([6, 34, 60, 86, 112, 138]);
  });
  it("identifies functional modules", () => {
    const m = matrixFor("https://example.com/a-longer-url-for-version-3", "M");
    expect(isFunctionalModule(m, 6, 10)).toBe(true); // timing row
    expect(isFunctionalModule(m, 0, 0)).toBe(false); // finder
  });
});

describe("layout", () => {
  const m = matrixFor("https://getlaunch.ph");
  it("includes quiet zone and three finders", () => {
    const l = computeQrLayout(m, style({ margin: 4 }));
    expect(l.total).toBe(m.size + 8);
    expect(l.finders).toHaveLength(3);
    expect(l.modulesPath.length).toBeGreaterThan(0);
    expect(l.logo).toBeNull();
  });
  it("clears modules behind the logo and reports coverage", () => {
    const plain = computeQrLayout(m, style());
    const withLogo = computeQrLayout(m, style({ ecLevel: "H", logo: { ...DEFAULT_LOGO, assetId: "a", size: 0.25 } }));
    expect(withLogo.darkModules).toBeLessThan(plain.darkModules);
    expect(withLogo.logoCoverage).toBeGreaterThan(0.05);
    expect(withLogo.plate).not.toBeNull();
  });
  it("keeps the logo away from finder patterns even with extreme offsets", () => {
    const l = computeQrLayout(m, style({ ecLevel: "H", logo: { ...DEFAULT_LOGO, assetId: "a", offsetX: -1, offsetY: -1 } }));
    expect(l.plate!.x).toBeGreaterThanOrEqual(l.margin + 8 - 0.001);
    expect(l.plate!.y).toBeGreaterThanOrEqual(l.margin + 8 - 0.001);
  });
  it("supports wide logos", () => {
    const l = computeQrLayout(m, style({ ecLevel: "H", logo: { ...DEFAULT_LOGO, assetId: "a" } }), { logoAspect: 3 });
    expect(l.logo!.width / l.logo!.height).toBeCloseTo(3, 3);
  });
});

describe("style constraints", () => {
  it("raises error correction when a logo is present", () => {
    expect(effectiveEcLevel(style({ ecLevel: "L", logo: { ...DEFAULT_LOGO, assetId: "a" } }))).toBe("Q");
    expect(effectiveEcLevel(style({ ecLevel: "H", logo: { ...DEFAULT_LOGO, assetId: "a" } }))).toBe("H");
    expect(effectiveEcLevel(style({ ecLevel: "L" }))).toBe("L");
    expect(effectiveEcLevel(style({ ecLevel: "L", logo: { ...DEFAULT_LOGO, assetId: "a", visible: false } }))).toBe("L");
  });
  it("clamps margin and logo size", () => {
    const s = sanitizeQrStyle(style({ margin: 0, ecLevel: "H", logo: { ...DEFAULT_LOGO, assetId: "a", size: 0.9 } }));
    expect(s.margin).toBe(2);
    expect(s.logo.size).toBe(MAX_LOGO_SIZE.H);
  });
});

describe("readability", () => {
  const m = matrixFor("https://getlaunch.ph");
  const analyze = (s: QrStyle, ctx = {}) => analyzeReadability(s, computeQrLayout(m, s), ctx);
  it("passes the default style", () => {
    expect(worstSeverity(analyze(style()))).toBeNull();
  });
  it("flags very low contrast as an error", () => {
    const issues = analyze(style({ foreground: solid("#dddddd") }));
    expect(issues.find((i) => i.id === "contrast-low")?.severity).toBe("error");
  });
  it("flags weak contrast and gradients with a light stop", () => {
    expect(analyze(style({ foreground: solid("#8a8a8a") })).some((i) => i.id === "contrast-weak")).toBe(true);
    expect(analyze(style({ foreground: linear(0, "#000000", "#cccccc") })).some((i) => i.id.startsWith("contrast"))).toBe(true);
  });
  it("flags inverted codes and transparent backgrounds", () => {
    expect(analyze(style({ foreground: solid("#ffffff"), background: solid("#000000") })).some((i) => i.id === "inverted")).toBe(true);
    expect(analyze(style({ background: NO_PAINT })).some((i) => i.id === "transparent-bg")).toBe(true);
    expect(analyze(style({ background: NO_PAINT }), { backdrop: "#ffffff" }).some((i) => i.id === "transparent-bg")).toBe(false);
  });
  it("flags a small quiet zone and small print sizes", () => {
    expect(analyze(style({ margin: 2 })).some((i) => i.id === "quiet-zone")).toBe(true);
    expect(analyze(style(), { printWidthMm: 8 }).some((i) => i.id === "print-small")).toBe(true);
    expect(analyze(style(), { printWidthMm: 30 }).some((i) => i.id === "print-small")).toBe(false);
  });
  it("flags logo issues", () => {
    const big = style({ ecLevel: "Q", logo: { ...DEFAULT_LOGO, assetId: "a", size: 0.26, platePadding: 3 } });
    expect(analyze(big).some((i) => i.id.startsWith("logo"))).toBe(true);
    const overlap = style({ ecLevel: "H", logo: { ...DEFAULT_LOGO, assetId: "a", size: 0.12, plate: "none", clearBehind: false } });
    expect(analyze(overlap).some((i) => i.id === "logo-overlap")).toBe(true);
    const raised = style({ ecLevel: "M", logo: { ...DEFAULT_LOGO, assetId: "a", size: 0.12 } });
    expect(analyze(raised).some((i) => i.id === "ec-raised")).toBe(true);
  });
  it("notes dense codes", () => {
    const dense = matrixFor("x".repeat(900), "M");
    const issues = analyzeReadability(style(), computeQrLayout(dense, style()));
    expect(issues.some((i) => i.id === "dense")).toBe(true);
    expect(worstSeverity(issues)).toBe("info");
  });
});
