/**
 * The typed design document. Geometry is in document units (1 unit = 1 CSS px
 * at 96 DPI), so physical sizes convert exactly: 1 in = 96 units.
 * Elements are stored back-to-front: array order IS layer order.
 */
import type { QrContent } from "@/lib/qr/content";
import type { QrStyle } from "@/lib/qr/style";
import type { Paint } from "./paint";

export const DOCUMENT_VERSION = 1;

export interface Box {
  x: number;
  y: number;
  width: number;
  height: number;
  /** Degrees, clockwise, around the box center. */
  rotation: number;
}

interface ElementBase extends Box {
  id: string;
  name: string;
  opacity: number;
  locked: boolean;
  hidden: boolean;
}

export interface QrElement extends ElementBase {
  type: "qr";
  content: QrContent;
  style: QrStyle;
}

export type TextAlign = "left" | "center" | "right";

export interface TextElement extends ElementBase {
  type: "text";
  text: string;
  fontFamily: string;
  fontSize: number;
  fontWeight: number;
  italic: boolean;
  uppercase: boolean;
  color: string;
  align: TextAlign;
  /** In em (e.g. 0.05 = 5% of the font size). */
  letterSpacing: number;
  /** Multiplier of font size. */
  lineHeight: number;
  background: string | null;
  padding: number;
  cornerRadius: number;
  borderColor: string | null;
  borderWidth: number;
}

export type ImageFit = "cover" | "contain" | "fill";

export interface ImageElement extends ElementBase {
  type: "image";
  assetId: string;
  fit: ImageFit;
  cornerRadius: number;
  borderColor: string | null;
  borderWidth: number;
  flipX: boolean;
  flipY: boolean;
}

export const SHAPE_KINDS = [
  "rect",
  "ellipse",
  "triangle",
  "polygon",
  "star",
  "heart",
  "line",
  "arrow",
] as const;
export type ShapeKind = (typeof SHAPE_KINDS)[number];
export type StrokeStyle = "solid" | "dashed" | "dotted";

export interface ShapeElement extends ElementBase {
  type: "shape";
  shape: ShapeKind;
  fill: Paint;
  stroke: string | null;
  strokeWidth: number;
  strokeStyle: StrokeStyle;
  cornerRadius: number;
  /** Polygon sides / star points. */
  sides: number;
  /** Star inner radius ratio (0.2..0.9). */
  innerRatio: number;
}

export interface IconElement extends ElementBase {
  type: "icon";
  icon: string;
  color: string;
  strokeWidth: number;
}

export type DesignElement = QrElement | TextElement | ImageElement | ShapeElement | IconElement;
export type ElementType = DesignElement["type"];

export const BACKGROUND_PATTERNS = ["none", "dots", "grid", "diagonal", "waves"] as const;
export type BackgroundPattern = (typeof BACKGROUND_PATTERNS)[number];

export interface DocumentBackground {
  paint: Paint;
  imageAssetId: string | null;
  imageFit: "cover" | "contain";
  imageOpacity: number;
  pattern: BackgroundPattern;
  patternColor: string;
  patternOpacity: number;
  patternScale: number;
}

export interface DocumentBorder {
  width: number;
  color: string;
}

export type DisplayUnit = "px" | "mm" | "in";

export interface DesignDocument {
  version: typeof DOCUMENT_VERSION;
  id: string;
  name: string;
  width: number;
  height: number;
  /** Preferred unit for showing dimensions. */
  unit: DisplayUnit;
  /** Default export resolution for print. */
  dpi: number;
  /** Corner radius of the artboard itself (e.g. rounded business cards). */
  cornerRadius: number;
  background: DocumentBackground;
  border: DocumentBorder;
  elements: DesignElement[];
}

export type ElementPatch<T extends DesignElement = DesignElement> = Partial<Omit<T, "id" | "type">>;
