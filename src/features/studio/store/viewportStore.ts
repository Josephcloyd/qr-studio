/** Zoom & pan of the studio canvas (screen-space state, not part of the design). */
import { create } from "zustand";

export const MIN_ZOOM = 0.05;
export const MAX_ZOOM = 8;
export const ZOOM_STEPS = [0.1, 0.25, 0.33, 0.5, 0.67, 0.75, 1, 1.25, 1.5, 2, 3, 4, 6, 8];
const FIT_PADDING = 48;

export interface ViewportState {
  zoom: number;
  panX: number;
  panY: number;
  width: number;
  height: number;
  setSize: (width: number, height: number) => void;
  setPan: (panX: number, panY: number) => void;
  panBy: (dx: number, dy: number) => void;
  /** Zooms keeping the screen point (relative to the viewport) fixed. */
  zoomAt: (zoom: number, anchorX?: number, anchorY?: number) => void;
  zoomStep: (dir: 1 | -1) => void;
  fit: (docWidth: number, docHeight: number, padding?: number) => void;
}

export const clampZoom = (z: number): number => Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, z));

export function fitZoom(
  docW: number,
  docH: number,
  viewW: number,
  viewH: number,
  padding = FIT_PADDING,
): number {
  const availW = Math.max(40, viewW - padding * 2);
  const availH = Math.max(40, viewH - padding * 2);
  return clampZoom(Math.min(availW / docW, availH / docH));
}

export const useViewportStore = create<ViewportState>((set, get) => ({
  zoom: 1,
  panX: 0,
  panY: 0,
  width: 0,
  height: 0,
  setSize: (width, height) => set({ width, height }),
  setPan: (panX, panY) => set({ panX, panY }),
  panBy: (dx, dy) => set({ panX: get().panX + dx, panY: get().panY + dy }),
  zoomAt: (next, anchorX, anchorY) => {
    const { zoom, panX, panY, width, height } = get();
    const z = clampZoom(next);
    const ax = anchorX ?? width / 2;
    const ay = anchorY ?? height / 2;
    // Keep the document point under the anchor fixed.
    const docX = (ax - panX) / zoom;
    const docY = (ay - panY) / zoom;
    set({ zoom: z, panX: ax - docX * z, panY: ay - docY * z });
  },
  zoomStep: (dir) => {
    const { zoom } = get();
    const next =
      dir > 0
        ? (ZOOM_STEPS.find((s) => s > zoom + 0.001) ?? MAX_ZOOM)
        : ([...ZOOM_STEPS].reverse().find((s) => s < zoom - 0.001) ?? MIN_ZOOM);
    get().zoomAt(next);
  },
  fit: (docWidth, docHeight, padding = FIT_PADDING) => {
    const { width, height } = get();
    if (!width || !height) return;
    const zoom = fitZoom(docWidth, docHeight, width, height, padding);
    set({ zoom, panX: (width - docWidth * zoom) / 2, panY: (height - docHeight * zoom) / 2 });
  },
}));
