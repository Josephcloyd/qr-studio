import type { DisplayUnit } from "./types";

/** Document units per inch (CSS reference pixel). */
export const UNITS_PER_INCH = 96;
export const MM_PER_INCH = 25.4;

export function toUnits(value: number, unit: DisplayUnit): number {
  switch (unit) {
    case "px":
      return value;
    case "in":
      return value * UNITS_PER_INCH;
    case "mm":
      return (value / MM_PER_INCH) * UNITS_PER_INCH;
  }
}

export function fromUnits(value: number, unit: DisplayUnit): number {
  switch (unit) {
    case "px":
      return value;
    case "in":
      return value / UNITS_PER_INCH;
    case "mm":
      return (value / UNITS_PER_INCH) * MM_PER_INCH;
  }
}

export function formatLength(value: number, unit: DisplayUnit): string {
  const v = fromUnits(value, unit);
  const digits = unit === "px" ? 0 : unit === "mm" ? 1 : 2;
  return `${Number(v.toFixed(digits))} ${unit}`;
}

/** Pixel dimensions of a document exported at `dpi`. */
export function pixelSize(
  width: number,
  height: number,
  dpi: number,
): { width: number; height: number } {
  const scale = dpi / UNITS_PER_INCH;
  return { width: Math.round(width * scale), height: Math.round(height * scale) };
}

export const mmToUnits = (mm: number): number => toUnits(mm, "mm");
export const unitsToMm = (u: number): number => fromUnits(u, "mm");
