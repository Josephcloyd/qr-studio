/** Smart-guide snapping for moving elements. Pure. */
import type { Bounds } from "./transform";

export interface Guide {
  axis: "x" | "y";
  /** Position of the guide line on its axis. */
  position: number;
  /** Extent along the other axis. */
  start: number;
  end: number;
}

export interface SnapResult {
  dx: number;
  dy: number;
  guides: Guide[];
}

interface Line {
  value: number;
  start: number;
  end: number;
}

const xLines = (b: Bounds): number[] => [b.minX, (b.minX + b.maxX) / 2, b.maxX];
const yLines = (b: Bounds): number[] => [b.minY, (b.minY + b.maxY) / 2, b.maxY];

function bestOffset(
  moving: number[],
  targets: Line[],
  threshold: number,
): { offset: number; line: Line | null } {
  let best: { offset: number; line: Line | null } = { offset: 0, line: null };
  let bestDist = threshold;
  for (const m of moving) {
    for (const t of targets) {
      const d = t.value - m;
      if (Math.abs(d) < bestDist) {
        bestDist = Math.abs(d);
        best = { offset: d, line: t };
      }
    }
  }
  return best;
}

export function snapMove(
  moving: Bounds,
  targets: Bounds[],
  canvas: { width: number; height: number },
  threshold: number,
): SnapResult {
  const canvasBounds: Bounds = { minX: 0, minY: 0, maxX: canvas.width, maxY: canvas.height };
  const all = [canvasBounds, ...targets];
  const vTargets: Line[] = all.flatMap((b) =>
    xLines(b).map((value) => ({ value, start: b.minY, end: b.maxY })),
  );
  const hTargets: Line[] = all.flatMap((b) =>
    yLines(b).map((value) => ({ value, start: b.minX, end: b.maxX })),
  );

  const sx = bestOffset(xLines(moving), vTargets, threshold);
  const sy = bestOffset(yLines(moving), hTargets, threshold);
  const guides: Guide[] = [];
  if (sx.line) {
    guides.push({
      axis: "x",
      position: sx.line.value,
      start: Math.min(sx.line.start, moving.minY + sy.offset),
      end: Math.max(sx.line.end, moving.maxY + sy.offset),
    });
  }
  if (sy.line) {
    guides.push({
      axis: "y",
      position: sy.line.value,
      start: Math.min(sy.line.start, moving.minX + sx.offset),
      end: Math.max(sy.line.end, moving.maxX + sx.offset),
    });
  }
  return { dx: sx.offset, dy: sy.offset, guides };
}

export function snapToGrid(value: number, grid: number): number {
  return grid > 0 ? Math.round(value / grid) * grid : value;
}
