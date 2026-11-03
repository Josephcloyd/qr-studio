/**
 * Pure gesture math: given the document at gesture start and the pointer
 * delta/position, compute the next document. Unit-tested without a DOM.
 */
import { snapMove, snapToGrid, type Guide } from "@/lib/geometry/snap";
import {
  boundsIntersect,
  boundsOf,
  resizeBox,
  rotationFor,
  unionBounds,
  type Bounds,
  type HandleDir,
  type Point,
} from "@/lib/geometry/transform";
import { findElement, mapElements, updateElement } from "@/lib/model/ops";
import type { DesignDocument, DesignElement, TextElement } from "@/lib/model/types";

export interface MoveOptions {
  snapToGuides: boolean;
  gridSize: number | null;
  /** Snap distance in document units (screen threshold / zoom). */
  threshold: number;
}

export function moveGesture(
  start: DesignDocument,
  ids: readonly string[],
  dx: number,
  dy: number,
  opts: MoveOptions,
): { doc: DesignDocument; guides: Guide[] } {
  const set = new Set(ids);
  const moving = start.elements.filter((e) => set.has(e.id) && !e.locked);
  if (!moving.length) return { doc: start, guides: [] };
  const startBounds = unionBounds(moving.map(boundsOf)) as Bounds;
  let ox = dx;
  let oy = dy;
  let guides: Guide[] = [];

  if (opts.gridSize) {
    ox = snapToGrid(startBounds.minX + dx, opts.gridSize) - startBounds.minX;
    oy = snapToGrid(startBounds.minY + dy, opts.gridSize) - startBounds.minY;
  } else if (opts.snapToGuides) {
    const targets = start.elements.filter((e) => !set.has(e.id) && !e.hidden).map(boundsOf);
    const shifted = {
      minX: startBounds.minX + dx,
      maxX: startBounds.maxX + dx,
      minY: startBounds.minY + dy,
      maxY: startBounds.maxY + dy,
    };
    const snap = snapMove(shifted, targets, start, opts.threshold);
    ox += snap.dx;
    oy += snap.dy;
    guides = snap.guides;
  }
  const movingIds = moving.map((e) => e.id);
  return {
    doc: mapElements(start, movingIds, (e) => ({ ...e, x: e.x + ox, y: e.y + oy })),
    guides,
  };
}

/** Elements whose aspect ratio is always preserved while resizing. */
export function locksAspect(el: DesignElement): boolean {
  return el.type === "qr" || el.type === "icon";
}

export interface ResizeOptions {
  shift: boolean;
  alt: boolean;
  gridSize: number | null;
}

export function resizeGesture(
  start: DesignDocument,
  id: string,
  dir: HandleDir,
  pointer: Point,
  opts: ResizeOptions,
): DesignDocument {
  const el = findElement(start, id);
  if (!el || el.locked) return start;
  const isCorner = dir.length === 2;
  const keepAspect = locksAspect(el) || (el.type === "text" ? isCorner : opts.shift);
  // With the grid on (and no rotation), the dragged edge lands on grid lines.
  const g = opts.gridSize;
  const target =
    g && el.rotation === 0 ? { x: snapToGrid(pointer.x, g), y: snapToGrid(pointer.y, g) } : pointer;
  const box = resizeBox(el, dir, target, { keepAspect, fromCenter: opts.alt, minSize: 8 });
  if (el.type === "text") {
    if (isCorner) {
      // Corner handles scale the text itself; height re-fits automatically.
      const scale = box.width / el.width;
      return updateElement<TextElement>(start, id, {
        x: box.x,
        y: box.y,
        width: box.width,
        fontSize: Math.max(4, el.fontSize * scale),
        padding: el.padding * scale,
        borderWidth: el.borderWidth * scale,
        cornerRadius: el.cornerRadius * scale,
      });
    }
    return updateElement(start, id, { x: box.x, y: box.y, width: box.width });
  }
  if (el.type === "qr") {
    const size = Math.max(box.width, box.height);
    return updateElement(start, id, { x: box.x, y: box.y, width: size, height: size });
  }
  return updateElement(start, id, { x: box.x, y: box.y, width: box.width, height: box.height });
}

export function rotateGesture(
  start: DesignDocument,
  id: string,
  pointer: Point,
  shift: boolean,
): DesignDocument {
  const el = findElement(start, id);
  if (!el || el.locked) return start;
  return updateElement(start, id, { rotation: rotationFor(el, pointer, shift ? 15 : null) });
}

export function marqueeHits(doc: DesignDocument, a: Point, b: Point): string[] {
  const rect = {
    minX: Math.min(a.x, b.x),
    minY: Math.min(a.y, b.y),
    maxX: Math.max(a.x, b.x),
    maxY: Math.max(a.y, b.y),
  };
  if (rect.maxX - rect.minX < 2 && rect.maxY - rect.minY < 2) return [];
  return doc.elements
    .filter((e) => !e.hidden && !e.locked && boundsIntersect(boundsOf(e), rect))
    .map((e) => e.id);
}
