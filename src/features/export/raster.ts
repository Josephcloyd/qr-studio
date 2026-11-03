/** SVG → canvas rasterization in the browser, with safe size limits. */

/** Conservative limits that work across Chrome, Firefox, Safari and iOS. */
export const MAX_CANVAS_SIDE = 16384;
export const MAX_CANVAS_AREA_DESKTOP = 64_000_000;
export const MAX_CANVAS_AREA_MOBILE = 16_000_000;

export function maxCanvasArea(): number {
  if (typeof navigator === "undefined") return MAX_CANVAS_AREA_DESKTOP;
  const mobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent) || (navigator.maxTouchPoints > 1 && /Mac/.test(navigator.userAgent));
  return mobile ? MAX_CANVAS_AREA_MOBILE : MAX_CANVAS_AREA_DESKTOP;
}

export interface ClampResult {
  width: number;
  height: number;
  clamped: boolean;
}

/** Clamps requested pixel dimensions to what the browser can safely allocate. */
export function clampPixelSize(width: number, height: number, maxArea = maxCanvasArea()): ClampResult {
  let w = Math.max(1, Math.round(width));
  let h = Math.max(1, Math.round(height));
  let clamped = false;
  const sideScale = Math.min(1, MAX_CANVAS_SIDE / Math.max(w, h));
  const areaScale = Math.min(1, Math.sqrt(maxArea / (w * h)));
  const s = Math.min(sideScale, areaScale);
  if (s < 1) {
    w = Math.max(1, Math.floor(w * s));
    h = Math.max(1, Math.floor(h * s));
    clamped = true;
  }
  return { width: w, height: h, clamped };
}

function loadSvgImage(svg: string): Promise<HTMLImageElement> {
  const url = URL.createObjectURL(new Blob([svg], { type: "image/svg+xml;charset=utf-8" }));
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new Image();
    img.decoding = "async";
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("The design couldn't be rendered for export."));
    img.src = url;
  }).finally(() => {
    // The image keeps its decoded pixels; release the temporary URL soon after.
    setTimeout(() => URL.revokeObjectURL(url), 0);
  });
}

export async function rasterizeSvg(
  svg: string,
  width: number,
  height: number,
  background: string | null = null,
): Promise<HTMLCanvasElement> {
  const img = await loadSvgImage(svg);
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Your browser couldn't create a drawing surface for export.");
  if (background) {
    ctx.fillStyle = background;
    ctx.fillRect(0, 0, width, height);
  }
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(img, 0, 0, width, height);
  return canvas;
}

export function canvasToBlob(canvas: HTMLCanvasElement, type = "image/png", quality?: number): Promise<Blob> {
  return new Promise((resolve, reject) =>
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error("Export failed — the image may be too large."))), type, quality),
  );
}
