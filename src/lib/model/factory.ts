/** Factories for new elements and documents with sensible, designed defaults. */
import { emptyContent, type QrContent } from "@/lib/qr/content";
import { DEFAULT_QR_STYLE, type QrStyle } from "@/lib/qr/style";
import { DEFAULT_FONT_ID } from "@/lib/fonts/registry";
import { createId } from "./ids";
import { solid, type Paint } from "./paint";
import { DEFAULT_PRESET, type CanvasPreset } from "./presets";
import {
  DOCUMENT_VERSION,
  type DesignDocument,
  type DocumentBackground,
  type IconElement,
  type ImageElement,
  type QrElement,
  type ShapeElement,
  type ShapeKind,
  type TextElement,
} from "./types";

type At = { x?: number; y?: number; width?: number; height?: number };

const base = (name: string, at: At, w: number, h: number) => ({
  id: createId(),
  name,
  x: at.x ?? 0,
  y: at.y ?? 0,
  width: at.width ?? w,
  height: at.height ?? h,
  rotation: 0,
  opacity: 1,
  locked: false,
  hidden: false,
});

export const SAMPLE_QR_CONTENT: QrContent = { type: "url", url: "https://getlaunch.ph" };

export function createQrElement(
  at: At = {},
  content: QrContent = SAMPLE_QR_CONTENT,
  style: QrStyle = DEFAULT_QR_STYLE,
): QrElement {
  const size = at.width ?? 240;
  return { ...base("QR code", at, size, size), height: size, width: size, type: "qr", content, style };
}

export type TextPreset = "heading" | "subheading" | "body" | "label";

const TEXT_PRESETS: Record<TextPreset, Partial<TextElement>> = {
  heading: { fontFamily: "fraunces", fontSize: 56, fontWeight: 700, lineHeight: 1.05, letterSpacing: -0.02 },
  subheading: { fontFamily: "inter", fontSize: 28, fontWeight: 600, lineHeight: 1.2, letterSpacing: -0.01 },
  body: { fontFamily: "inter", fontSize: 18, fontWeight: 400, lineHeight: 1.45, letterSpacing: 0 },
  label: { fontFamily: "inter", fontSize: 14, fontWeight: 700, lineHeight: 1.2, letterSpacing: 0.12, uppercase: true },
};

export function createTextElement(text: string, at: At = {}, preset: TextPreset = "body", patch: Partial<TextElement> = {}): TextElement {
  const p = { ...TEXT_PRESETS[preset], ...patch };
  const fontSize = p.fontSize ?? 18;
  return {
    ...base(text.slice(0, 24) || "Text", at, 320, fontSize * (p.lineHeight ?? 1.3)),
    type: "text",
    text,
    fontFamily: p.fontFamily ?? DEFAULT_FONT_ID,
    fontSize,
    fontWeight: p.fontWeight ?? 400,
    italic: p.italic ?? false,
    uppercase: p.uppercase ?? false,
    color: p.color ?? "#16130f",
    align: p.align ?? "left",
    letterSpacing: p.letterSpacing ?? 0,
    lineHeight: p.lineHeight ?? 1.3,
    background: p.background ?? null,
    padding: p.padding ?? 0,
    cornerRadius: p.cornerRadius ?? 0,
    borderColor: p.borderColor ?? null,
    borderWidth: p.borderWidth ?? 0,
  };
}

export function createImageElement(assetId: string, at: At = {}, name = "Image"): ImageElement {
  return {
    ...base(name, at, 240, 240),
    type: "image",
    assetId,
    fit: "contain",
    cornerRadius: 0,
    borderColor: null,
    borderWidth: 0,
    flipX: false,
    flipY: false,
  };
}

const SHAPE_NAMES: Record<ShapeKind, string> = {
  rect: "Rectangle",
  ellipse: "Ellipse",
  triangle: "Triangle",
  polygon: "Polygon",
  star: "Star",
  heart: "Heart",
  line: "Line",
  arrow: "Arrow",
};

export function createShapeElement(shape: ShapeKind, at: At = {}, patch: Partial<ShapeElement> = {}): ShapeElement {
  const isLine = shape === "line" || shape === "arrow";
  return {
    ...base(SHAPE_NAMES[shape], at, isLine ? 240 : 200, isLine ? 24 : 200),
    type: "shape",
    shape,
    fill: (isLine ? { kind: "none" } : solid("#ff5a1f")) as Paint,
    stroke: isLine ? "#16130f" : null,
    strokeWidth: isLine ? 4 : 0,
    strokeStyle: "solid",
    cornerRadius: 0,
    sides: shape === "star" ? 5 : 6,
    innerRatio: 0.45,
    ...patch,
  };
}

export function createIconElement(icon: string, at: At = {}, color = "#16130f"): IconElement {
  return { ...base(icon, at, 96, 96), type: "icon", icon, color, strokeWidth: 2 };
}

export const DEFAULT_BACKGROUND: DocumentBackground = {
  paint: solid("#ffffff"),
  imageAssetId: null,
  imageFit: "cover",
  imageOpacity: 1,
  pattern: "none",
  patternColor: "#16130f",
  patternOpacity: 0.08,
  patternScale: 24,
};

export function createDocument(preset: CanvasPreset = DEFAULT_PRESET, name = "Untitled design"): DesignDocument {
  return {
    version: DOCUMENT_VERSION,
    id: createId("doc"),
    name,
    width: Math.round(preset.width),
    height: Math.round(preset.height),
    unit: preset.unit,
    dpi: preset.dpi,
    cornerRadius: preset.cornerRadius ?? 0,
    background: DEFAULT_BACKGROUND,
    border: { width: 0, color: "#16130f" },
    elements: [],
  };
}

export { emptyContent };
