/**
 * A tiny layout kit for authoring templates. Positions/sizes are fractions
 * of the artboard so layouts read like a design spec; font sizes are in
 * document units. Templates are static app data — nothing is fetched.
 */
import {
  createDocument,
  createIconElement,
  createQrElement,
  createShapeElement,
  createTextElement,
  DEFAULT_BACKGROUND,
} from "@/lib/model/factory";
import { findPreset } from "@/lib/model/presets";
import { linear, NO_PAINT, radial, solid, type Paint } from "@/lib/model/paint";
import type { DesignDocument, DesignElement, DocumentBackground, ShapeElement, ShapeKind, TextElement } from "@/lib/model/types";
import type { QrContent } from "@/lib/qr/content";
import { DEFAULT_QR_STYLE, type QrStyle } from "@/lib/qr/style";

export type TemplateCategory = "Business" | "Restaurant" | "Events" | "Marketing" | "Personal";

export interface TemplateDef {
  id: string;
  name: string;
  category: TemplateCategory;
  description: string;
  build: () => DesignDocument;
}

export interface Frame {
  W: number;
  H: number;
  /** fraction of width → units */
  x: (f: number) => number;
  /** fraction of height → units */
  y: (f: number) => number;
}

export function frame(presetId: string): Frame & { presetId: string } {
  const p = findPreset(presetId);
  if (!p) throw new Error(`Unknown preset ${presetId}`);
  const W = Math.round(p.width);
  const H = Math.round(p.height);
  return { W, H, x: (f) => f * W, y: (f) => f * H, presetId };
}

export function page(
  presetId: string,
  name: string,
  background: Partial<DocumentBackground> & { paint: Paint },
  elements: DesignElement[],
  extra: Partial<DesignDocument> = {},
): DesignDocument {
  const preset = findPreset(presetId)!;
  const doc = createDocument(preset, name);
  return { ...doc, background: { ...DEFAULT_BACKGROUND, ...background }, elements, ...extra };
}

type TextOpts = Partial<TextElement>;

/** Text box at (fx, fy) fraction, width fraction fw. */
export function text(f: Frame, value: string, fx: number, fy: number, fw: number, opts: TextOpts = {}): TextElement {
  return {
    ...createTextElement(value, { x: f.x(fx), y: f.y(fy), width: f.x(fw) }, "body", opts),
    name: opts.name ?? value.split("\n")[0].slice(0, 28),
    rotation: opts.rotation ?? 0,
  };
}

/** QR code; `fs` is its size as a fraction of the artboard width. */
export function qr(f: Frame, content: QrContent, fx: number, fy: number, fs: number, style: Partial<QrStyle> = {}, name = "QR code") {
  const size = f.x(fs);
  return { ...createQrElement({ x: f.x(fx), y: f.y(fy), width: size }, content, { ...DEFAULT_QR_STYLE, ecLevel: "Q", ...style }), name };
}

export function shape(
  f: Frame,
  kind: ShapeKind,
  fx: number,
  fy: number,
  fw: number,
  fh: number,
  opts: Partial<ShapeElement> = {},
): ShapeElement {
  return { ...createShapeElement(kind, { x: f.x(fx), y: f.y(fy), width: f.x(fw), height: f.y(fh) }, opts), ...(opts.name ? { name: opts.name } : {}) };
}

/** Square icon sized by width fraction. */
export function icon(f: Frame, id: string, fx: number, fy: number, fs: number, color: string, strokeWidth = 2) {
  const s = f.x(fs);
  return { ...createIconElement(id, { x: f.x(fx), y: f.y(fy), width: s }, color), height: s, strokeWidth };
}

export { linear, radial, solid, NO_PAINT };

/** Palette shared by templates. */
export const C = {
  ink: "#16130f",
  ink2: "#463f36",
  muted: "#6b6458",
  paper: "#f6f3ec",
  cream: "#fffaf3",
  white: "#ffffff",
  vermilion: "#ff5a1f",
  rust: "#b8360a",
  cobalt: "#2b3bff",
  navy: "#14213d",
  forest: "#1c4d36",
  sage: "#e3ebdd",
  blush: "#f8e1dc",
  gold: "#b08d3c",
  plum: "#4a1d6b",
  sun: "#ffd166",
} as const;
