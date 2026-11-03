/** Helpers to place new elements nicely on the current artboard. */
import { useEditorStore } from "../../store/editorStore";
import { useUiStore } from "../../store/uiStore";
import type { DesignElement } from "@/lib/model/types";

/** Box of the given aspect, sized relative to the artboard and centered. */
export function centeredBox(
  fraction: number,
  aspect = 1,
): { x: number; y: number; width: number; height: number } {
  const { doc } = useEditorStore.getState();
  const base = Math.min(doc.width, doc.height) * fraction;
  const width = aspect >= 1 ? base : base * aspect;
  const height = aspect >= 1 ? base / aspect : base;
  // Cascade slightly so repeated inserts don't stack exactly.
  const n = doc.elements.length % 6;
  return {
    x: (doc.width - width) / 2 + n * 8,
    y: (doc.height - height) / 2 + n * 8,
    width,
    height,
  };
}

export function insertElements(elements: DesignElement[]): void {
  const editor = useEditorStore.getState();
  if (!elements.length) return;
  editor.apply((d) => ({ ...d, elements: [...d.elements, ...elements] }));
  editor.select(elements.map((e) => e.id));
  // On phones, close the tool sheet so the new element is visible.
  if (typeof window !== "undefined" && window.matchMedia("(max-width: 1023px)").matches)
    useUiStore.getState().setPanel(null);
}
