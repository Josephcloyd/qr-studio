/**
 * Local image intake. Files are read with the File API, decoded in the
 * browser and (if huge) downscaled on a canvas. Nothing leaves the device.
 */

export const ACCEPTED_IMAGE_TYPES = ["image/png", "image/jpeg", "image/webp", "image/svg+xml"] as const;
export type AcceptedImageType = (typeof ACCEPTED_IMAGE_TYPES)[number];
export const ACCEPT_ATTRIBUTE = ACCEPTED_IMAGE_TYPES.join(",");

export const MAX_UPLOAD_BYTES = 15 * 1024 * 1024;
export const MAX_IMAGE_SIDE = 4096;
export const DEFAULT_SVG_SIDE = 512;

export interface ProcessedImage {
  blob: Blob;
  mime: AcceptedImageType;
  width: number;
  height: number;
  name: string;
}

export class ImageIntakeError extends Error {}

export function isAcceptedType(type: string): type is AcceptedImageType {
  return (ACCEPTED_IMAGE_TYPES as readonly string[]).includes(type);
}

export function validateImageFile(file: { type: string; size: number }): string | null {
  if (!isAcceptedType(file.type)) return "Use a PNG, JPEG, WebP or SVG image.";
  if (file.size > MAX_UPLOAD_BYTES) return "Images must be 15 MB or smaller.";
  if (file.size === 0) return "That file is empty.";
  return null;
}

/** Rejects SVGs that carry scripts or event handlers. */
export function isUnsafeSvg(markup: string): boolean {
  return /<script[\s>]|\son[a-z]+\s*=|javascript:|<foreignObject[\s>]/i.test(markup);
}

/** Scales (w, h) down to fit within `max` on the longest side. */
export function fitWithin(width: number, height: number, max: number): { width: number; height: number } {
  const longest = Math.max(width, height);
  if (longest <= max) return { width, height };
  const s = max / longest;
  return { width: Math.max(1, Math.round(width * s)), height: Math.max(1, Math.round(height * s)) };
}

function loadImageElement(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new ImageIntakeError("That image couldn't be read. It may be damaged."));
    img.src = url;
  });
}

async function processSvg(file: Blob, name: string): Promise<ProcessedImage> {
  const markup = await file.text();
  if (isUnsafeSvg(markup)) throw new ImageIntakeError("This SVG contains scripts or embedded HTML and can't be used.");
  const blob = new Blob([markup], { type: "image/svg+xml" });
  const url = URL.createObjectURL(blob);
  try {
    const img = await loadImageElement(url);
    const width = img.naturalWidth || DEFAULT_SVG_SIDE;
    const height = img.naturalHeight || DEFAULT_SVG_SIDE;
    return { blob, mime: "image/svg+xml", width, height, name };
  } finally {
    URL.revokeObjectURL(url);
  }
}

async function processRaster(file: Blob, mime: AcceptedImageType, name: string): Promise<ProcessedImage> {
  let bitmap: ImageBitmap;
  try {
    bitmap = await createImageBitmap(file);
  } catch {
    throw new ImageIntakeError("That image couldn't be decoded. Try a different file.");
  }
  try {
    const target = fitWithin(bitmap.width, bitmap.height, MAX_IMAGE_SIDE);
    if (target.width === bitmap.width && target.height === bitmap.height) {
      return { blob: file, mime, width: bitmap.width, height: bitmap.height, name };
    }
    const canvas = document.createElement("canvas");
    canvas.width = target.width;
    canvas.height = target.height;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new ImageIntakeError("Your browser couldn't resize this image.");
    ctx.imageSmoothingQuality = "high";
    ctx.drawImage(bitmap, 0, 0, target.width, target.height);
    const outMime = mime === "image/jpeg" ? "image/jpeg" : "image/png";
    const blob = await new Promise<Blob>((resolve, reject) =>
      canvas.toBlob((b) => (b ? resolve(b) : reject(new ImageIntakeError("Resizing failed."))), outMime, 0.92),
    );
    return { blob, mime: outMime, width: target.width, height: target.height, name };
  } finally {
    bitmap.close();
  }
}

/** Validates and decodes a user-selected file entirely in the browser. */
export async function processImageFile(file: File): Promise<ProcessedImage> {
  const problem = validateImageFile(file);
  if (problem) throw new ImageIntakeError(problem);
  const mime = file.type as AcceptedImageType;
  const name = file.name.replace(/\.[^.]+$/, "").slice(0, 60) || "Image";
  return mime === "image/svg+xml" ? processSvg(file, name) : processRaster(file, mime, name);
}

export function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error("Couldn't read image data."));
    reader.readAsDataURL(blob);
  });
}

/** Decodes a base64 data URL to a Blob without any network request. */
export function dataUrlToBlob(dataUrl: string): Blob {
  const match = /^data:([a-z+/.-]+);base64,([A-Za-z0-9+/=]+)$/.exec(dataUrl);
  if (!match) throw new ImageIntakeError("Embedded image data is malformed.");
  const binary = atob(match[2]);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return new Blob([bytes], { type: match[1] });
}
