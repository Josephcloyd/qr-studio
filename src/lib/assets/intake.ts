/**
 * Local image intake. Files are read with the File API, decoded in the
 * browser and (if huge) downscaled on a canvas. Nothing leaves the device.
 */
import { createObjectUrl, revokeObjectUrl } from "./objectUrls";

export const ACCEPTED_IMAGE_TYPES = [
  "image/png",
  "image/jpeg",
  "image/webp",
  "image/svg+xml",
] as const;
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
export function fitWithin(
  width: number,
  height: number,
  max: number,
): { width: number; height: number } {
  const longest = Math.max(width, height);
  if (longest <= max) return { width, height };
  const s = max / longest;
  return { width: Math.max(1, Math.round(width * s)), height: Math.max(1, Math.round(height * s)) };
}

function loadImageElement(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () =>
      reject(new ImageIntakeError("That image couldn't be read. It may be damaged."));
    img.src = url;
  });
}

/** Largest image we'll decode (≈ 7000 × 7000). Checked from the header first. */
export const MAX_DECODE_PIXELS = 50_000_000;
/** SVGs are rasterized with their longest side in this range. */
const SVG_RASTER_MIN = 1024;
const SVG_RASTER_MAX = 2048;

const u32 = (b: Uint8Array, i: number) =>
  ((b[i] << 24) | (b[i + 1] << 16) | (b[i + 2] << 8) | b[i + 3]) >>> 0;
const u16be = (b: Uint8Array, i: number) => (b[i] << 8) | b[i + 1];
const u16le = (b: Uint8Array, i: number) => b[i] | (b[i + 1] << 8);
const u24le = (b: Uint8Array, i: number) => b[i] | (b[i + 1] << 8) | (b[i + 2] << 16);

/**
 * Reads pixel dimensions straight from a PNG/JPEG/WebP header — without
 * decoding — so oversized "decompression bombs" are rejected before they can
 * allocate gigabytes. Returns null when the header can't be read.
 */
export function readImageDimensions(bytes: Uint8Array): { width: number; height: number } | null {
  // PNG: signature, then IHDR width/height at 16..23
  if (
    bytes.length >= 24 &&
    bytes[0] === 0x89 &&
    bytes[1] === 0x50 &&
    bytes[2] === 0x4e &&
    bytes[3] === 0x47
  ) {
    return { width: u32(bytes, 16), height: u32(bytes, 20) };
  }
  // JPEG: walk markers to the first SOFn
  if (bytes.length >= 4 && bytes[0] === 0xff && bytes[1] === 0xd8) {
    let i = 2;
    while (i + 9 < bytes.length) {
      if (bytes[i] !== 0xff) {
        i++;
        continue;
      }
      const marker = bytes[i + 1];
      const isSof = marker >= 0xc0 && marker <= 0xcf && ![0xc4, 0xc8, 0xcc].includes(marker);
      if (isSof) return { height: u16be(bytes, i + 5), width: u16be(bytes, i + 7) };
      if (marker === 0xd8 || marker === 0x01 || (marker >= 0xd0 && marker <= 0xd7)) {
        i += 2;
        continue;
      }
      i += 2 + u16be(bytes, i + 2);
    }
    return null;
  }
  // WebP: RIFF....WEBP + VP8 / VP8L / VP8X chunk
  const ascii = (i: number, n: number) => String.fromCharCode(...bytes.subarray(i, i + n));
  if (bytes.length >= 30 && ascii(0, 4) === "RIFF" && ascii(8, 4) === "WEBP") {
    const chunk = ascii(12, 4);
    if (chunk === "VP8X") return { width: u24le(bytes, 24) + 1, height: u24le(bytes, 27) + 1 };
    if (chunk === "VP8L") {
      const b = bytes.subarray(21, 25);
      return {
        width: (u16le(b, 0) & 0x3fff) + 1,
        height: (((b[1] >> 6) | (b[2] << 2) | ((b[3] & 0xf) << 10)) & 0x3fff) + 1,
      };
    }
    if (chunk === "VP8 ")
      return { width: u16le(bytes, 26) & 0x3fff, height: u16le(bytes, 28) & 0x3fff };
  }
  return null;
}

async function checkDimensions(blob: Blob): Promise<void> {
  const head = new Uint8Array(await blob.slice(0, 64 * 1024).arrayBuffer());
  const dims = readImageDimensions(head);
  if (!dims || dims.width < 1 || dims.height < 1) {
    throw new ImageIntakeError(
      "That image couldn't be read. It may be damaged or in an unsupported format.",
    );
  }
  if (dims.width * dims.height > MAX_DECODE_PIXELS) {
    throw new ImageIntakeError(
      "That image is too large (over 50 megapixels). Resize it and try again.",
    );
  }
}

async function canvasToPng(canvas: HTMLCanvasElement): Promise<Blob> {
  return new Promise<Blob>((resolve, reject) =>
    canvas.toBlob(
      (b) => (b ? resolve(b) : reject(new ImageIntakeError("Converting the image failed."))),
      "image/png",
    ),
  );
}

/**
 * SVGs are rasterized to PNG on arrival. Rendering through <img> is a static,
 * script-free, no-network context, and storing only pixels means an SVG's
 * scripts, links or remote references can never reach the canvas, project
 * files or exports (where other design tools might honor them).
 */
async function processSvg(file: Blob, name: string): Promise<ProcessedImage> {
  const markup = await file.text();
  if (isUnsafeSvg(markup))
    throw new ImageIntakeError("This SVG contains scripts or embedded HTML and can't be used.");
  const url = createObjectUrl(new Blob([markup], { type: "image/svg+xml" }));
  try {
    const img = await loadImageElement(url);
    const naturalW = img.naturalWidth || DEFAULT_SVG_SIDE;
    const naturalH = img.naturalHeight || DEFAULT_SVG_SIDE;
    const longest = Math.max(naturalW, naturalH);
    const scale = Math.min(SVG_RASTER_MAX, Math.max(SVG_RASTER_MIN, longest)) / longest;
    const canvas = document.createElement("canvas");
    canvas.width = Math.max(1, Math.round(naturalW * scale));
    canvas.height = Math.max(1, Math.round(naturalH * scale));
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new ImageIntakeError("Your browser couldn't convert this SVG.");
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    const blob = await canvasToPng(canvas);
    canvas.width = canvas.height = 0;
    return {
      blob,
      mime: "image/png",
      width: Math.round(naturalW * scale),
      height: Math.round(naturalH * scale),
      name,
    };
  } finally {
    revokeObjectUrl(url);
  }
}

async function processRaster(
  file: Blob,
  mime: AcceptedImageType,
  name: string,
): Promise<ProcessedImage> {
  await checkDimensions(file);
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
      canvas.toBlob(
        (b) => (b ? resolve(b) : reject(new ImageIntakeError("Resizing failed."))),
        outMime,
        0.92,
      ),
    );
    canvas.width = canvas.height = 0; // release the bitmap memory now (matters on iOS)
    return { blob, mime: outMime, width: target.width, height: target.height, name };
  } finally {
    bitmap.close();
  }
}

/** Validates and decodes a user-selected file entirely in the browser. */
export async function processImageFile(file: File): Promise<ProcessedImage> {
  const problem = validateImageFile(file);
  if (problem) throw new ImageIntakeError(problem);
  const name = file.name.replace(/\.[^.]+$/, "").slice(0, 60) || "Image";
  return processImageBlob(file, file.type as AcceptedImageType, name);
}

/** Same pipeline for any blob (uploads, pasted images, imported project assets). */
export function processImageBlob(
  blob: Blob,
  mime: AcceptedImageType,
  name: string,
): Promise<ProcessedImage> {
  return mime === "image/svg+xml" ? processSvg(blob, name) : processRaster(blob, mime, name);
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
