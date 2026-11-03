"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type MouseEvent as ReactMouseEvent,
  type PointerEvent as ReactPointerEvent,
  type RefObject,
} from "react";
import type { HandleDir, Point } from "@/lib/geometry/transform";
import { useEditorStore } from "../store/editorStore";
import { clampZoom, useViewportStore } from "../store/viewportStore";
import { marqueeHits, moveGesture, resizeGesture, rotateGesture } from "../interactions/gestures";

const DRAG_THRESHOLD = 3;
const SNAP_THRESHOLD_PX = 6;

type Drag =
  | { kind: "pending"; start: Point; client: Point; ids: string[] }
  | { kind: "move"; start: Point; ids: string[] }
  | { kind: "resize"; id: string; dir: HandleDir }
  | { kind: "rotate"; id: string }
  | { kind: "marquee"; start: Point; base: string[] }
  | { kind: "pan"; last: Point }
  | { kind: "pinch"; d0: number; mid0: Point; zoom0: number; pan0: Point };

export interface MarqueeRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

function distance(a: Point, b: Point) {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

/**
 * All pointer interaction on the canvas: select, move (with smart guides),
 * resize, rotate, marquee, pan (space/middle/touch-drag) and pinch zoom.
 */
export function useCanvasGestures(containerRef: RefObject<HTMLDivElement | null>) {
  const drag = useRef<Drag | null>(null);
  const pointers = useRef(new Map<number, Point>());
  const spaceDown = useRef(false);
  const [marquee, setMarquee] = useState<MarqueeRect | null>(null);
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [interacting, setInteracting] = useState(false);
  const [panning, setPanning] = useState(false);

  const local = useCallback(
    (e: { clientX: number; clientY: number }): Point => {
      const rect = containerRef.current?.getBoundingClientRect();
      return { x: e.clientX - (rect?.left ?? 0), y: e.clientY - (rect?.top ?? 0) };
    },
    [containerRef],
  );
  const toDoc = useCallback(
    (e: { clientX: number; clientY: number }): Point => {
      const { zoom, panX, panY } = useViewportStore.getState();
      const p = local(e);
      return { x: (p.x - panX) / zoom, y: (p.y - panY) / zoom };
    },
    [local],
  );

  // Space-to-pan.
  useEffect(() => {
    const isTyping = (t: EventTarget | null) =>
      t instanceof HTMLElement &&
      (t.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName));
    const down = (e: KeyboardEvent) => {
      if (e.code === "Space" && !isTyping(e.target)) {
        spaceDown.current = true;
        setPanning(true);
        e.preventDefault();
      }
    };
    const up = (e: KeyboardEvent) => {
      if (e.code === "Space") {
        spaceDown.current = false;
        setPanning(false);
      }
    };
    window.addEventListener("keydown", down);
    window.addEventListener("keyup", up);
    return () => {
      window.removeEventListener("keydown", down);
      window.removeEventListener("keyup", up);
    };
  }, []);

  // Wheel: ctrl/⌘ (and trackpad pinch) zooms at the cursor, otherwise pans.
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      const vp = useViewportStore.getState();
      if (e.ctrlKey || e.metaKey) {
        const p = local(e);
        vp.zoomAt(clampZoom(vp.zoom * Math.exp(-e.deltaY * 0.0022)), p.x, p.y);
      } else {
        vp.panBy(-e.deltaX, -e.deltaY);
      }
    };
    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
  }, [containerRef, local]);

  const onPointerDown = useCallback(
    (e: ReactPointerEvent<HTMLDivElement>) => {
      const editor = useEditorStore.getState();
      if (editor.editingTextId) return;
      containerRef.current?.setPointerCapture(e.pointerId);
      pointers.current.set(e.pointerId, local(e));

      if (pointers.current.size === 2) {
        // Second finger: switch to pinch-zoom, abandoning any element drag.
        if (drag.current && drag.current.kind !== "pan" && drag.current.kind !== "pinch")
          editor.cancelGesture();
        const [a, b] = [...pointers.current.values()];
        const vp = useViewportStore.getState();
        drag.current = {
          kind: "pinch",
          d0: distance(a, b),
          mid0: { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 },
          zoom0: vp.zoom,
          pan0: { x: vp.panX, y: vp.panY },
        };
        setMarquee(null);
        return;
      }

      const target = e.target as Element;
      const doc = toDoc(e);
      if (e.button === 1 || spaceDown.current) {
        drag.current = { kind: "pan", last: local(e) };
        setPanning(true);
        return;
      }
      if (e.button !== 0) return;

      const handle = target.closest("[data-handle]")?.getAttribute("data-handle");
      const selectedId = editor.selection[0];
      if (handle && selectedId) {
        editor.beginGesture();
        drag.current =
          handle === "rotate"
            ? { kind: "rotate", id: selectedId }
            : { kind: "resize", id: selectedId, dir: handle as HandleDir };
        setInteracting(true);
        return;
      }

      const hitId = target.closest("[data-element-id]")?.getAttribute("data-element-id") ?? null;
      if (hitId) {
        const additive = e.shiftKey || e.metaKey || e.ctrlKey;
        let ids = editor.selection;
        if (additive) {
          editor.toggleSelect(hitId);
          ids = useEditorStore.getState().selection;
        } else if (!ids.includes(hitId)) {
          editor.select([hitId]);
          ids = [hitId];
        }
        drag.current = ids.includes(hitId)
          ? { kind: "pending", start: doc, client: { x: e.clientX, y: e.clientY }, ids }
          : null;
        return;
      }

      // Empty canvas: touch pans, mouse draws a marquee.
      if (e.pointerType === "touch") {
        editor.clearSelection();
        drag.current = { kind: "pan", last: local(e) };
        return;
      }
      const base = e.shiftKey ? editor.selection : [];
      if (!e.shiftKey) editor.clearSelection();
      drag.current = { kind: "marquee", start: doc, base };
    },
    [containerRef, local, toDoc],
  );

  const onPointerMove = useCallback(
    (e: ReactPointerEvent<HTMLDivElement>) => {
      if (pointers.current.has(e.pointerId)) pointers.current.set(e.pointerId, local(e));
      const d = drag.current;
      if (!d) {
        if (e.pointerType === "mouse") {
          const id =
            (e.target as Element).closest("[data-element-id]")?.getAttribute("data-element-id") ??
            null;
          setHoveredId((prev) => (prev === id ? prev : id));
        }
        return;
      }
      const editor = useEditorStore.getState();
      const vp = useViewportStore.getState();
      const doc = toDoc(e);

      switch (d.kind) {
        case "pinch": {
          if (pointers.current.size < 2) return;
          const [a, b] = [...pointers.current.values()];
          const mid = { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
          const zoom = clampZoom(d.zoom0 * (distance(a, b) / Math.max(1, d.d0)));
          const docX = (d.mid0.x - d.pan0.x) / d.zoom0;
          const docY = (d.mid0.y - d.pan0.y) / d.zoom0;
          useViewportStore.setState({ zoom, panX: mid.x - docX * zoom, panY: mid.y - docY * zoom });
          return;
        }
        case "pan": {
          const p = local(e);
          vp.panBy(p.x - d.last.x, p.y - d.last.y);
          drag.current = { kind: "pan", last: p };
          return;
        }
        case "pending": {
          if (Math.hypot(e.clientX - d.client.x, e.clientY - d.client.y) < DRAG_THRESHOLD) return;
          editor.beginGesture();
          drag.current = { kind: "move", start: d.start, ids: d.ids };
          setInteracting(true);
          setHoveredId(null);
          return;
        }
        case "move": {
          const { view, gestureStart } = editor;
          if (!gestureStart) return;
          // Hold Alt to move freely without snapping.
          const r = moveGesture(gestureStart, d.ids, doc.x - d.start.x, doc.y - d.start.y, {
            snapToGuides: view.snapToGuides && !e.altKey,
            gridSize: view.snapToGrid && !e.altKey ? view.gridSize : null,
            threshold: SNAP_THRESHOLD_PX / vp.zoom,
          });
          useEditorStore.setState({ doc: r.doc, guides: r.guides });
          return;
        }
        case "resize": {
          const { view } = editor;
          editor.updateGesture((start) =>
            resizeGesture(start, d.id, d.dir, doc, {
              shift: e.shiftKey,
              alt: e.altKey,
              gridSize: view.snapToGrid ? view.gridSize : null,
            }),
          );
          return;
        }
        case "rotate":
          editor.updateGesture((start) => rotateGesture(start, d.id, doc, e.shiftKey));
          return;
        case "marquee": {
          const x = Math.min(d.start.x, doc.x);
          const y = Math.min(d.start.y, doc.y);
          setMarquee({
            x,
            y,
            width: Math.abs(doc.x - d.start.x),
            height: Math.abs(doc.y - d.start.y),
          });
          const hits = marqueeHits(editor.doc, d.start, doc);
          useEditorStore.setState({ selection: [...new Set([...d.base, ...hits])] });
          return;
        }
      }
    },
    [local, toDoc],
  );

  const end = useCallback((e: ReactPointerEvent<HTMLDivElement>) => {
    pointers.current.delete(e.pointerId);
    const d = drag.current;
    if (d?.kind === "pinch") {
      // Keep panning with the remaining finger instead of jumping into a drag.
      const rest = [...pointers.current.values()][0];
      drag.current = rest ? { kind: "pan", last: rest } : null;
      return;
    }
    if (d && (d.kind === "move" || d.kind === "resize" || d.kind === "rotate"))
      useEditorStore.getState().endGesture();
    drag.current = null;
    setMarquee(null);
    setInteracting(false);
    if (!spaceDown.current) setPanning(false);
  }, []);

  const onDoubleClick = useCallback((e: ReactMouseEvent<HTMLDivElement>) => {
    // Pointer capture retargets click events to the container, so hit-test directly.
    const hit = document.elementFromPoint(e.clientX, e.clientY);
    const id = hit?.closest("[data-element-id]")?.getAttribute("data-element-id");
    if (!id) return;
    const editor = useEditorStore.getState();
    const el = editor.doc.elements.find((x) => x.id === id);
    if (el?.type === "text" && !el.locked) {
      editor.select([id]);
      editor.setEditingText(id);
    }
  }, []);

  return {
    handlers: {
      onPointerDown,
      onPointerMove,
      onPointerUp: end,
      onPointerCancel: end,
      onDoubleClick,
    },
    marquee,
    hoveredId,
    interacting,
    panning,
  };
}
