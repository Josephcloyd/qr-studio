/**
 * Builds the QR module matrix locally with the `qrcode` library.
 * Text is encoded as UTF-8 (byte mode), so any language works.
 */
import QRCode from "qrcode";
import type { EcLevel } from "./style";

export interface QrMatrix {
  /** Modules per side (without quiet zone). */
  size: number;
  version: number;
  ecLevel: EcLevel;
  /** Row-major, 1 = dark. */
  data: Uint8Array;
}

export type MatrixResult = { ok: true; matrix: QrMatrix } | { ok: false; error: string };

const cache = new Map<string, MatrixResult>();
const CACHE_LIMIT = 64;

export function buildMatrix(payload: string, ecLevel: EcLevel): MatrixResult {
  const key = `${ecLevel}\u0000${payload}`;
  const cached = cache.get(key);
  if (cached) return cached;

  let result: MatrixResult;
  if (!payload) {
    result = { ok: false, error: "Nothing to encode yet." };
  } else {
    try {
      const qr = QRCode.create(payload, { errorCorrectionLevel: ecLevel });
      result = {
        ok: true,
        matrix: {
          size: qr.modules.size,
          version: qr.version,
          ecLevel,
          data: Uint8Array.from(qr.modules.data, (v) => (v ? 1 : 0)),
        },
      };
    } catch {
      result = {
        ok: false,
        error:
          "This content is too long for a QR code at this error-correction level. Shorten it or lower error correction.",
      };
    }
  }
  if (cache.size >= CACHE_LIMIT) cache.delete(cache.keys().next().value as string);
  cache.set(key, result);
  return result;
}

export function isDark(matrix: QrMatrix, row: number, col: number): boolean {
  if (row < 0 || col < 0 || row >= matrix.size || col >= matrix.size) return false;
  return matrix.data[row * matrix.size + col] === 1;
}

/** True for modules inside one of the three 7×7 finder patterns. */
export function isFinderModule(size: number, row: number, col: number): boolean {
  const inBand = (v: number, start: number) => v >= start && v < start + 7;
  return (
    (inBand(row, 0) && inBand(col, 0)) ||
    (inBand(row, 0) && inBand(col, size - 7)) ||
    (inBand(row, size - 7) && inBand(col, 0))
  );
}

/** Alignment-pattern center coordinates for a version (ISO/IEC 18004 Annex E). */
export function alignmentCoords(version: number): number[] {
  if (version <= 1) return [];
  const count = Math.floor(version / 7) + 2;
  const size = version * 4 + 17;
  const step = size === 145 ? 26 : Math.ceil((size - 13) / (2 * count - 2)) * 2;
  const positions = [size - 7];
  for (let i = 1; i < count - 1; i++) positions.push(positions[i - 1] - step);
  positions.push(6);
  return positions.reverse();
}

/**
 * True for modules of the "functional" structure scanners lock onto —
 * alignment patterns and timing lines. These always render as solid squares
 * so decorative module styles can't break detection.
 */
export function isFunctionalModule(matrix: QrMatrix, row: number, col: number): boolean {
  const { size } = matrix;
  if (isFinderModule(size, row, col)) return false;
  if ((row === 6 && col >= 8 && col < size - 8) || (col === 6 && row >= 8 && row < size - 8))
    return true;
  const coords = alignmentCoords(matrix.version);
  const last = coords.length - 1;
  for (let i = 0; i <= last; i++) {
    for (let j = 0; j <= last; j++) {
      const overlapsFinder =
        (i === 0 && j === 0) || (i === 0 && j === last) || (i === last && j === 0);
      if (overlapsFinder) continue;
      if (Math.abs(row - coords[i]) <= 2 && Math.abs(col - coords[j]) <= 2) return true;
    }
  }
  return false;
}

export function finderOrigins(size: number): { row: number; col: number }[] {
  return [
    { row: 0, col: 0 },
    { row: 0, col: size - 7 },
    { row: size - 7, col: 0 },
  ];
}
