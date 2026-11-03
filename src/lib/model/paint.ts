/** Fills used by QR codes, shapes and backgrounds. */

export interface ColorStop {
  offset: number; // 0..1
  color: string;
}

export type Paint =
  | { kind: "none" }
  | { kind: "solid"; color: string }
  | { kind: "linear"; angle: number; stops: ColorStop[] }
  | { kind: "radial"; stops: ColorStop[] };

export type PaintKind = Paint["kind"];

export const solid = (color: string): Paint => ({ kind: "solid", color });

export const linear = (angle: number, from: string, to: string): Paint => ({
  kind: "linear",
  angle,
  stops: [
    { offset: 0, color: from },
    { offset: 1, color: to },
  ],
});

export const radial = (inner: string, outer: string): Paint => ({
  kind: "radial",
  stops: [
    { offset: 0, color: inner },
    { offset: 1, color: outer },
  ],
});

export const NO_PAINT: Paint = { kind: "none" };

/** Every concrete color a paint can show — used for contrast analysis. */
export function paintColors(paint: Paint): string[] {
  switch (paint.kind) {
    case "none":
      return [];
    case "solid":
      return [paint.color];
    default:
      return paint.stops.map((s) => s.color);
  }
}

/** The first color of the paint, or a fallback for `none`. */
export function primaryColor(paint: Paint, fallback = "#000000"): string {
  return paintColors(paint)[0] ?? fallback;
}

/** Converts a paint to another kind while keeping its colors where possible. */
export function convertPaint(paint: Paint, kind: PaintKind, fallback = "#111111"): Paint {
  if (paint.kind === kind) return paint;
  const colors = paintColors(paint);
  const a = colors[0] ?? fallback;
  const b = colors[1] ?? colors[0] ?? "#ffffff";
  switch (kind) {
    case "none":
      return NO_PAINT;
    case "solid":
      return solid(a);
    case "linear":
      return linear(135, a, b === a ? "#ffffff" : b);
    case "radial":
      return radial(a, b === a ? "#ffffff" : b);
  }
}
