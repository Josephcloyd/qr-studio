/**
 * Immutable document operations. Every function returns a new document and
 * never mutates its input — the editor's undo history relies on this.
 */
import { boundsOf, unionBounds, type Bounds } from "@/lib/geometry/transform";
import { createId } from "./ids";
import type { DesignDocument, DesignElement, ElementPatch } from "./types";

export function findElement(doc: DesignDocument, id: string): DesignElement | undefined {
  return doc.elements.find((e) => e.id === id);
}

export function addElements(
  doc: DesignDocument,
  elements: DesignElement[],
  index?: number,
): DesignDocument {
  const at =
    index === undefined ? doc.elements.length : Math.max(0, Math.min(index, doc.elements.length));
  return {
    ...doc,
    elements: [...doc.elements.slice(0, at), ...elements, ...doc.elements.slice(at)],
  };
}

export function updateElement<T extends DesignElement>(
  doc: DesignDocument,
  id: string,
  patch: ElementPatch<T>,
): DesignDocument {
  return {
    ...doc,
    elements: doc.elements.map((e) => (e.id === id ? ({ ...e, ...patch } as DesignElement) : e)),
  };
}

export function mapElements(
  doc: DesignDocument,
  ids: readonly string[],
  fn: (el: DesignElement) => DesignElement,
): DesignDocument {
  const set = new Set(ids);
  return { ...doc, elements: doc.elements.map((e) => (set.has(e.id) ? fn(e) : e)) };
}

export function removeElements(doc: DesignDocument, ids: readonly string[]): DesignDocument {
  const set = new Set(ids);
  return { ...doc, elements: doc.elements.filter((e) => !set.has(e.id)) };
}

/** Deep-ish clone with a fresh id (element values are plain data). */
export function cloneElement(el: DesignElement, dx = 0, dy = 0): DesignElement {
  const copy = structuredClone(el) as DesignElement;
  return { ...copy, id: createId(), x: el.x + dx, y: el.y + dy, locked: false };
}

export function duplicateElements(
  doc: DesignDocument,
  ids: readonly string[],
  offset = 16,
): { doc: DesignDocument; ids: string[] } {
  const set = new Set(ids);
  const newIds: string[] = [];
  const elements = doc.elements.flatMap((e) => {
    if (!set.has(e.id)) return [e];
    const copy = cloneElement(e, offset, offset);
    newIds.push(copy.id);
    return [e, copy];
  });
  return { doc: { ...doc, elements }, ids: newIds };
}

export function moveElements(
  doc: DesignDocument,
  ids: readonly string[],
  dx: number,
  dy: number,
): DesignDocument {
  return mapElements(doc, ids, (e) => (e.locked ? e : { ...e, x: e.x + dx, y: e.y + dy }));
}

export type LayerMove = "forward" | "backward" | "front" | "back";

export function reorderElements(
  doc: DesignDocument,
  ids: readonly string[],
  move: LayerMove,
): DesignDocument {
  const set = new Set(ids);
  const selected = doc.elements.filter((e) => set.has(e.id));
  const rest = doc.elements.filter((e) => !set.has(e.id));
  if (!selected.length) return doc;
  if (move === "front") return { ...doc, elements: [...rest, ...selected] };
  if (move === "back") return { ...doc, elements: [...selected, ...rest] };

  const list = [...doc.elements];
  const indices = list.map((e, i) => (set.has(e.id) ? i : -1)).filter((i) => i >= 0);
  const ordered = move === "forward" ? [...indices].reverse() : indices;
  for (const i of ordered) {
    const j = move === "forward" ? i + 1 : i - 1;
    if (j < 0 || j >= list.length || set.has(list[j].id)) continue;
    [list[i], list[j]] = [list[j], list[i]];
  }
  return { ...doc, elements: list };
}

/** Moves one element to an absolute layer index (used by drag-reorder in the layers panel). */
export function moveElementTo(doc: DesignDocument, id: string, index: number): DesignDocument {
  const el = findElement(doc, id);
  if (!el) return doc;
  const rest = doc.elements.filter((e) => e.id !== id);
  return addElements({ ...doc, elements: rest }, [el], index);
}

export type Alignment = "left" | "center" | "right" | "top" | "middle" | "bottom";

export function selectionBounds(doc: DesignDocument, ids: readonly string[]): Bounds | null {
  const set = new Set(ids);
  return unionBounds(doc.elements.filter((e) => set.has(e.id)).map(boundsOf));
}

/**
 * Aligns elements. A single element (or relativeTo "canvas") aligns to the
 * artboard; multiple elements align to their combined bounds.
 */
export function alignElements(
  doc: DesignDocument,
  ids: readonly string[],
  alignment: Alignment,
  relativeTo: "canvas" | "selection" = ids.length > 1 ? "selection" : "canvas",
): DesignDocument {
  const target =
    relativeTo === "canvas"
      ? { minX: 0, minY: 0, maxX: doc.width, maxY: doc.height }
      : selectionBounds(doc, ids);
  if (!target) return doc;
  return mapElements(doc, ids, (e) => {
    if (e.locked) return e;
    const b = boundsOf(e);
    const shift = {
      left: { dx: target.minX - b.minX, dy: 0 },
      center: { dx: (target.minX + target.maxX) / 2 - (b.minX + b.maxX) / 2, dy: 0 },
      right: { dx: target.maxX - b.maxX, dy: 0 },
      top: { dx: 0, dy: target.minY - b.minY },
      middle: { dx: 0, dy: (target.minY + target.maxY) / 2 - (b.minY + b.maxY) / 2 },
      bottom: { dx: 0, dy: target.maxY - b.maxY },
    }[alignment];
    return { ...e, x: e.x + shift.dx, y: e.y + shift.dy };
  });
}

/** Distributes 3+ elements so the gaps between them are equal. */
export function distributeElements(
  doc: DesignDocument,
  ids: readonly string[],
  axis: "horizontal" | "vertical",
): DesignDocument {
  const set = new Set(ids);
  const items = doc.elements
    .filter((e) => set.has(e.id) && !e.locked)
    .map((e) => ({ e, b: boundsOf(e) }));
  if (items.length < 3) return doc;
  const h = axis === "horizontal";
  items.sort((a, b) => (h ? a.b.minX - b.b.minX : a.b.minY - b.b.minY));
  const size = (b: Bounds) => (h ? b.maxX - b.minX : b.maxY - b.minY);
  const first = items[0].b;
  const last = items[items.length - 1].b;
  const span = h ? last.maxX - first.minX : last.maxY - first.minY;
  const gap = (span - items.reduce((s, i) => s + size(i.b), 0)) / (items.length - 1);
  let cursor = h ? first.minX : first.minY;
  const shifts = new Map<string, number>();
  for (const { e, b } of items) {
    shifts.set(e.id, cursor - (h ? b.minX : b.minY));
    cursor += size(b) + gap;
  }
  return mapElements(doc, ids, (e) => {
    const s = shifts.get(e.id) ?? 0;
    return h ? { ...e, x: e.x + s } : { ...e, y: e.y + s };
  });
}

/** Resizes the artboard, optionally scaling content to fit proportionally. */
export function resizeDocument(
  doc: DesignDocument,
  width: number,
  height: number,
  scaleContent: boolean,
): DesignDocument {
  if (!scaleContent) return { ...doc, width, height };
  const s = Math.min(width / doc.width, height / doc.height);
  const ox = (width - doc.width * s) / 2;
  const oy = (height - doc.height * s) / 2;
  return {
    ...doc,
    width,
    height,
    elements: doc.elements.map((e) => {
      const scaled = {
        ...e,
        x: e.x * s + ox,
        y: e.y * s + oy,
        width: e.width * s,
        height: e.height * s,
      };
      if (scaled.type === "text") {
        return {
          ...scaled,
          fontSize: scaled.fontSize * s,
          padding: scaled.padding * s,
          borderWidth: scaled.borderWidth * s,
          cornerRadius: scaled.cornerRadius * s,
        };
      }
      if (scaled.type === "shape")
        return {
          ...scaled,
          strokeWidth: scaled.strokeWidth * s,
          cornerRadius: scaled.cornerRadius * s,
        };
      if (scaled.type === "image")
        return {
          ...scaled,
          borderWidth: scaled.borderWidth * s,
          cornerRadius: scaled.cornerRadius * s,
        };
      return scaled;
    }),
  };
}

/** Asset ids referenced by the document (images, QR logos, background). */
export function referencedAssets(doc: DesignDocument): Set<string> {
  const ids = new Set<string>();
  if (doc.background.imageAssetId) ids.add(doc.background.imageAssetId);
  for (const e of doc.elements) {
    if (e.type === "image") ids.add(e.assetId);
    if (e.type === "qr" && e.style.logo.assetId) ids.add(e.style.logo.assetId);
  }
  return ids;
}
