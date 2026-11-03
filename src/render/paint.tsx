import type { Paint } from "@/lib/model/paint";
import { fmt } from "@/lib/geometry/paths";

export interface PaintBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

/** Makes a string safe to use as an SVG id / url(#…) reference. */
export function safeId(...parts: string[]): string {
  return parts.join("-").replace(/[^a-zA-Z0-9_-]/g, "");
}

/** Gradient definition for a paint (null for none/solid). Coordinates are user-space. */
export function PaintDef({ id, paint, box }: { id: string; paint: Paint; box: PaintBox }) {
  if (paint.kind === "linear") {
    const rad = (paint.angle * Math.PI) / 180;
    const dx = Math.cos(rad);
    const dy = Math.sin(rad);
    const half = (Math.abs(dx) * box.width + Math.abs(dy) * box.height) / 2;
    const cx = box.x + box.width / 2;
    const cy = box.y + box.height / 2;
    return (
      <linearGradient
        id={id}
        gradientUnits="userSpaceOnUse"
        x1={fmt(cx - dx * half)}
        y1={fmt(cy - dy * half)}
        x2={fmt(cx + dx * half)}
        y2={fmt(cy + dy * half)}
      >
        {paint.stops.map((s, i) => (
          <stop key={i} offset={fmt(s.offset)} stopColor={s.color} />
        ))}
      </linearGradient>
    );
  }
  if (paint.kind === "radial") {
    return (
      <radialGradient
        id={id}
        gradientUnits="userSpaceOnUse"
        cx={fmt(box.x + box.width / 2)}
        cy={fmt(box.y + box.height / 2)}
        r={fmt(Math.hypot(box.width, box.height) / 2)}
      >
        {paint.stops.map((s, i) => (
          <stop key={i} offset={fmt(s.offset)} stopColor={s.color} />
        ))}
      </radialGradient>
    );
  }
  return null;
}

/** The `fill` value for a paint. */
export function paintFill(paint: Paint, id: string): string {
  switch (paint.kind) {
    case "none":
      return "none";
    case "solid":
      return paint.color;
    default:
      return `url(#${id})`;
  }
}
