/**
 * Local scan verification: decodes QR codes from rendered pixels with jsQR
 * (loaded on demand, runs in this tab). Used for the live "scan check" and
 * to verify every QR code in an export before download.
 */
import { boundsOf } from "@/lib/geometry/transform";
import type { DesignDocument, QrElement } from "@/lib/model/types";
import { encodePayload } from "@/lib/qr/payloads";

const MAX_DECODE_SIDE = 900;

type JsQr = typeof import("jsqr").default;
let jsqrPromise: Promise<JsQr> | null = null;
const loadJsQr = () => (jsqrPromise ??= import("jsqr").then((m) => m.default));

export async function decodeImageData(data: ImageData): Promise<string | null> {
  const jsQR = await loadJsQr();
  const result = jsQR(data.data, data.width, data.height, { inversionAttempts: "attemptBoth" });
  return result ? result.data : null;
}

/** Decodes a region of a canvas (downscaled for speed). */
export async function decodeCanvasRegion(
  source: HTMLCanvasElement,
  region: { x: number; y: number; width: number; height: number },
): Promise<string | null> {
  const x = Math.max(0, Math.floor(region.x));
  const y = Math.max(0, Math.floor(region.y));
  const w = Math.min(source.width - x, Math.ceil(region.width));
  const h = Math.min(source.height - y, Math.ceil(region.height));
  if (w <= 0 || h <= 0) return null;
  const scale = Math.min(1, MAX_DECODE_SIDE / Math.max(w, h));
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.round(w * scale));
  canvas.height = Math.max(1, Math.round(h * scale));
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  if (!ctx) return null;
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(source, x, y, w, h, 0, 0, canvas.width, canvas.height);
  return decodeImageData(ctx.getImageData(0, 0, canvas.width, canvas.height));
}

export interface QrVerification {
  id: string;
  name: string;
  expected: string | null;
  decoded: string | null;
  ok: boolean;
}

/** Verifies each visible QR element inside a rendered export canvas. */
export async function verifyDocumentQrCodes(doc: DesignDocument, canvas: HTMLCanvasElement): Promise<QrVerification[]> {
  const scale = canvas.width / doc.width;
  const qrs = doc.elements.filter((e): e is QrElement => e.type === "qr" && !e.hidden);
  const results: QrVerification[] = [];
  for (const el of qrs) {
    const encoded = encodePayload(el.content);
    const expected = encoded.ok ? encoded.payload : null;
    const b = boundsOf(el);
    const pad = el.width * 0.08;
    const decoded = expected
      ? await decodeCanvasRegion(canvas, {
          x: (b.minX - pad) * scale,
          y: (b.minY - pad) * scale,
          width: (b.maxX - b.minX + pad * 2) * scale,
          height: (b.maxY - b.minY + pad * 2) * scale,
        })
      : null;
    results.push({ id: el.id, name: el.name, expected, decoded, ok: expected !== null && decoded === expected });
  }
  return results;
}
