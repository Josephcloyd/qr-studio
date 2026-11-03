/**
 * Rotation-aware transform math for the editor. Pure functions over Box.
 * Convention: rotation is clockwise degrees around the box center
 * (matches SVG `rotate()` with a y-down coordinate system).
 */
import type { Box } from "@/lib/model/types";

export interface Point {
  x: number;
  y: number;
}

export interface Bounds {
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
}

export type HandleDir = "n" | "s" | "e" | "w" | "ne" | "nw" | "se" | "sw";

export const HANDLE_VECTORS: Record<HandleDir, [number, number]> = {
  n: [0, -1],
  s: [0, 1],
  e: [1, 0],
  w: [-1, 0],
  ne: [1, -1],
  nw: [-1, -1],
  se: [1, 1],
  sw: [-1, 1],
};

export const toRad = (deg: number): number => (deg * Math.PI) / 180;
export const toDeg = (rad: number): number => (rad * 180) / Math.PI;

export function rotate(p: Point, deg: number): Point {
  const r = toRad(deg);
  const cos = Math.cos(r);
  const sin = Math.sin(r);
  return { x: p.x * cos - p.y * sin, y: p.x * sin + p.y * cos };
}

export function center(box: Box): Point {
  return { x: box.x + box.width / 2, y: box.y + box.height / 2 };
}

export function corners(box: Box): Point[] {
  const c = center(box);
  const hw = box.width / 2;
  const hh = box.height / 2;
  return [
    { x: -hw, y: -hh },
    { x: hw, y: -hh },
    { x: hw, y: hh },
    { x: -hw, y: hh },
  ].map((p) => {
    const r = rotate(p, box.rotation);
    return { x: c.x + r.x, y: c.y + r.y };
  });
}

/** Axis-aligned bounds of a (possibly rotated) box. */
export function boundsOf(box: Box): Bounds {
  const pts = corners(box);
  return {
    minX: Math.min(...pts.map((p) => p.x)),
    minY: Math.min(...pts.map((p) => p.y)),
    maxX: Math.max(...pts.map((p) => p.x)),
    maxY: Math.max(...pts.map((p) => p.y)),
  };
}

export function unionBounds(list: Bounds[]): Bounds | null {
  if (!list.length) return null;
  return {
    minX: Math.min(...list.map((b) => b.minX)),
    minY: Math.min(...list.map((b) => b.minY)),
    maxX: Math.max(...list.map((b) => b.maxX)),
    maxY: Math.max(...list.map((b) => b.maxY)),
  };
}

/** World point → the box's local frame (origin at box center, unrotated). */
export function toLocal(box: Box, p: Point): Point {
  const c = center(box);
  return rotate({ x: p.x - c.x, y: p.y - c.y }, -box.rotation);
}

export function containsPoint(box: Box, p: Point): boolean {
  const l = toLocal(box, p);
  return Math.abs(l.x) <= box.width / 2 && Math.abs(l.y) <= box.height / 2;
}

export function boundsIntersect(a: Bounds, b: Bounds): boolean {
  return a.minX <= b.maxX && a.maxX >= b.minX && a.minY <= b.maxY && a.maxY >= b.minY;
}

export interface ResizeOptions {
  keepAspect?: boolean;
  fromCenter?: boolean;
  minSize?: number;
}

/**
 * Resizes `box` by dragging handle `dir` to world point `pointer`. The
 * opposite edge/corner stays fixed in world space even when rotated.
 */
export function resizeBox(box: Box, dir: HandleDir, pointer: Point, opts: ResizeOptions = {}): Box {
  const min = opts.minSize ?? 4;
  const [hx, hy] = HANDLE_VECTORS[dir];
  const c = center(box);
  const anchorLocal = opts.fromCenter ? { x: 0, y: 0 } : { x: (-hx * box.width) / 2, y: (-hy * box.height) / 2 };
  const anchorOffset = rotate(anchorLocal, box.rotation);
  const anchor = { x: c.x + anchorOffset.x, y: c.y + anchorOffset.y };
  const q = rotate({ x: pointer.x - anchor.x, y: pointer.y - anchor.y }, -box.rotation);
  const factor = opts.fromCenter ? 2 : 1;

  let width = hx !== 0 ? Math.max(min, hx * q.x * factor) : box.width;
  let height = hy !== 0 ? Math.max(min, hy * q.y * factor) : box.height;

  if (opts.keepAspect && box.width > 0 && box.height > 0) {
    const ratio = box.width / box.height;
    if (hx !== 0 && hy !== 0) {
      const scale = Math.max(width / box.width, height / box.height);
      width = Math.max(min, box.width * scale);
      height = Math.max(min, width / ratio);
    } else if (hx !== 0) {
      height = Math.max(min, width / ratio);
    } else {
      width = Math.max(min, height * ratio);
    }
  }

  const offsetLocal = opts.fromCenter ? { x: 0, y: 0 } : { x: (hx * width) / 2, y: (hy * height) / 2 };
  // Edge handles with keepAspect grow symmetrically on the other axis.
  const offset = rotate(offsetLocal, box.rotation);
  const newCenter = { x: anchor.x + offset.x, y: anchor.y + offset.y };
  return {
    ...box,
    width,
    height,
    x: newCenter.x - width / 2,
    y: newCenter.y - height / 2,
  };
}

/** Rotation (degrees) for a rotate handle dragged to `pointer`. */
export function rotationFor(box: Box, pointer: Point, snap: number | null): number {
  const c = center(box);
  let deg = toDeg(Math.atan2(pointer.y - c.y, pointer.x - c.x)) + 90;
  if (snap) deg = Math.round(deg / snap) * snap;
  else {
    // Gentle magnetism toward right angles.
    const nearest = Math.round(deg / 90) * 90;
    if (Math.abs(deg - nearest) < 3) deg = nearest;
  }
  return normalizeAngle(deg);
}

export function normalizeAngle(deg: number): number {
  const d = ((deg % 360) + 360) % 360;
  const r = d > 180 ? d - 360 : d;
  return Math.round(r * 100) / 100;
}
