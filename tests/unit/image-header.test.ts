import { describe, expect, it } from "vitest";
import { MAX_DECODE_PIXELS, readImageDimensions } from "@/lib/assets/intake";
import { rasterize } from "../helpers/decode";

function jpegHeader(width: number, height: number): Uint8Array {
  // SOI, APP0 (len 16), SOF0 (len 17) with height/width
  return new Uint8Array([
    0xff,
    0xd8,
    0xff,
    0xe0,
    0x00,
    0x10,
    0x4a,
    0x46,
    0x49,
    0x46,
    0x00,
    0x01,
    0x01,
    0x00,
    0x00,
    0x01,
    0x00,
    0x01,
    0x00,
    0x00,
    0xff,
    0xc0,
    0x00,
    0x11,
    0x08,
    height >> 8,
    height & 0xff,
    width >> 8,
    width & 0xff,
    0x03,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
  ]);
}

function webpVp8xHeader(width: number, height: number): Uint8Array {
  const b = new Uint8Array(30);
  b.set(
    [..."RIFF"].map((c) => c.charCodeAt(0)),
    0,
  );
  b.set(
    [..."WEBP"].map((c) => c.charCodeAt(0)),
    8,
  );
  b.set(
    [..."VP8X"].map((c) => c.charCodeAt(0)),
    12,
  );
  const w = width - 1;
  const h = height - 1;
  b.set([w & 0xff, (w >> 8) & 0xff, (w >> 16) & 0xff], 24);
  b.set([h & 0xff, (h >> 8) & 0xff, (h >> 16) & 0xff], 27);
  return b;
}

describe("readImageDimensions", () => {
  it("reads PNG headers", () => {
    const png = new Uint8Array(
      rasterize('<svg xmlns="http://www.w3.org/2000/svg" width="37" height="21"/>', 37).png,
    );
    expect(readImageDimensions(png)).toEqual({ width: 37, height: 21 });
  });
  it("reads JPEG SOF markers", () => {
    expect(readImageDimensions(jpegHeader(4000, 3000))).toEqual({ width: 4000, height: 3000 });
  });
  it("reads WebP VP8X headers", () => {
    expect(readImageDimensions(webpVp8xHeader(30000, 30000))).toEqual({
      width: 30000,
      height: 30000,
    });
  });
  it("flags decompression bombs before decoding", () => {
    const bomb = readImageDimensions(webpVp8xHeader(30000, 30000))!;
    expect(bomb.width * bomb.height).toBeGreaterThan(MAX_DECODE_PIXELS);
  });
  it("returns null for unknown or truncated data", () => {
    expect(readImageDimensions(new Uint8Array([1, 2, 3]))).toBeNull();
    expect(readImageDimensions(new TextEncoder().encode("<svg></svg>"))).toBeNull();
  });
});
