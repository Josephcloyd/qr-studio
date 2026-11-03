/**
 * Writes the physical pixel density (pHYs chunk) into a PNG so print
 * software opens it at the intended size. Pure byte manipulation.
 */

const CRC_TABLE = (() => {
  const table = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    table[n] = c >>> 0;
  }
  return table;
})();

export function crc32(bytes: Uint8Array): number {
  let c = 0xffffffff;
  for (let i = 0; i < bytes.length; i++) c = CRC_TABLE[(c ^ bytes[i]) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

const PNG_SIGNATURE = [137, 80, 78, 71, 13, 10, 26, 10];
const INCHES_PER_METER = 39.3700787;

function chunk(type: string, data: Uint8Array): Uint8Array {
  const out = new Uint8Array(12 + data.length);
  const view = new DataView(out.buffer);
  view.setUint32(0, data.length);
  for (let i = 0; i < 4; i++) out[4 + i] = type.charCodeAt(i);
  out.set(data, 8);
  view.setUint32(8 + data.length, crc32(out.subarray(4, 8 + data.length)));
  return out;
}

function isPng(bytes: Uint8Array): boolean {
  return PNG_SIGNATURE.every((b, i) => bytes[i] === b);
}

/** Returns a copy of the PNG bytes with a pHYs chunk for `dpi` (replacing any existing one). */
export function setPngDpi(bytes: Uint8Array, dpi: number): Uint8Array {
  if (!isPng(bytes)) throw new Error("Not a PNG file");
  const ppm = Math.round(dpi * INCHES_PER_METER);
  const data = new Uint8Array(9);
  const dv = new DataView(data.buffer);
  dv.setUint32(0, ppm);
  dv.setUint32(4, ppm);
  data[8] = 1; // unit: meter
  const phys = chunk("pHYs", data);

  const parts: Uint8Array[] = [bytes.subarray(0, 8)];
  let offset = 8;
  let inserted = false;
  while (offset < bytes.length) {
    const view = new DataView(bytes.buffer, bytes.byteOffset + offset);
    const length = view.getUint32(0);
    const type = String.fromCharCode(...bytes.subarray(offset + 4, offset + 8));
    const end = offset + 12 + length;
    if (type !== "pHYs") parts.push(bytes.subarray(offset, end));
    if (type === "IHDR" && !inserted) {
      parts.push(phys);
      inserted = true;
    }
    offset = end;
  }
  const total = parts.reduce((s, p) => s + p.length, 0);
  const out = new Uint8Array(total);
  let pos = 0;
  for (const p of parts) {
    out.set(p, pos);
    pos += p.length;
  }
  return out;
}

/** Reads the DPI from a PNG's pHYs chunk, or null. */
export function readPngDpi(bytes: Uint8Array): number | null {
  let offset = 8;
  while (offset < bytes.length) {
    const view = new DataView(bytes.buffer, bytes.byteOffset + offset);
    const length = view.getUint32(0);
    const type = String.fromCharCode(...bytes.subarray(offset + 4, offset + 8));
    if (type === "pHYs") {
      const ppm = view.getUint32(8);
      return Math.round(ppm / INCHES_PER_METER);
    }
    offset += 12 + length;
  }
  return null;
}
