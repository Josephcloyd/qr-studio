import { toUnits } from "./units";
import type { DisplayUnit } from "./types";

export interface CanvasPreset {
  id: string;
  label: string;
  description: string;
  width: number;
  height: number;
  unit: DisplayUnit;
  dpi: number;
  cornerRadius?: number;
}

const inch = (v: number) => toUnits(v, "in");
const mm = (v: number) => toUnits(v, "mm");

export const CANVAS_PRESETS: CanvasPreset[] = [
  {
    id: "square-card",
    label: "Square QR card",
    description: "4 × 4 in",
    width: inch(4),
    height: inch(4),
    unit: "in",
    dpi: 300,
  },
  {
    id: "business-card",
    label: "Business card",
    description: "3.5 × 2 in",
    width: inch(3.5),
    height: inch(2),
    unit: "in",
    dpi: 300,
  },
  {
    id: "a4",
    label: "A4",
    description: "210 × 297 mm",
    width: mm(210),
    height: mm(297),
    unit: "mm",
    dpi: 300,
  },
  {
    id: "a5",
    label: "A5",
    description: "148 × 210 mm",
    width: mm(148),
    height: mm(210),
    unit: "mm",
    dpi: 300,
  },
  {
    id: "flyer",
    label: "Flyer",
    description: "Letter · 8.5 × 11 in",
    width: inch(8.5),
    height: inch(11),
    unit: "in",
    dpi: 300,
  },
  {
    id: "poster",
    label: "Poster",
    description: "18 × 24 in",
    width: inch(18),
    height: inch(24),
    unit: "in",
    dpi: 150,
  },
  {
    id: "sticker",
    label: "Sticker",
    description: "3 × 3 in, rounded",
    width: inch(3),
    height: inch(3),
    unit: "in",
    dpi: 300,
    cornerRadius: inch(0.25),
  },
  {
    id: "table-tent",
    label: "Table tent",
    description: "4 × 6 in",
    width: inch(4),
    height: inch(6),
    unit: "in",
    dpi: 300,
  },
  {
    id: "social-square",
    label: "Social square",
    description: "1080 × 1080 px",
    width: 1080,
    height: 1080,
    unit: "px",
    dpi: 96,
  },
  {
    id: "story",
    label: "Instagram story",
    description: "1080 × 1920 px",
    width: 1080,
    height: 1920,
    unit: "px",
    dpi: 96,
  },
];

export const DEFAULT_PRESET = CANVAS_PRESETS[0];

export const MIN_CANVAS = 48;
export const MAX_CANVAS = 20000;

export function findPreset(id: string): CanvasPreset | undefined {
  return CANVAS_PRESETS.find((p) => p.id === id);
}
