/**
 * Independent scan verification for tests: rasterize SVG markup with resvg
 * (a separate renderer from the browser) and decode it with jsQR (a separate
 * library from the one that built the matrix).
 */
import { Resvg } from "@resvg/resvg-js";
import jsQR from "jsqr";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { QrSvg, type ResolvedImage } from "@/render/QrGraphic";
import type { QrStyle } from "@/lib/qr/style";

export function rasterize(svg: string, width = 600, background = "#ffffff") {
  const resvg = new Resvg(svg, {
    fitTo: { mode: "width", value: width },
    background,
    font: { loadSystemFonts: false },
  });
  const image = resvg.render();
  return { pixels: new Uint8ClampedArray(image.pixels), width: image.width, height: image.height, png: image.asPng() };
}

export function decodeSvg(svg: string, width = 600, background = "#ffffff"): string | null {
  const { pixels, width: w, height: h } = rasterize(svg, width, background);
  const result = jsQR(pixels, w, h, { inversionAttempts: "attemptBoth" });
  return result ? result.data : null;
}

export function renderQrMarkup(payload: string, style: QrStyle, logo: ResolvedImage | null = null, size = 400): string {
  return renderToStaticMarkup(createElement(QrSvg, { payload, style, size, idPrefix: "t", logo }));
}

/** A solid-color square PNG data URL to stand in for an uploaded logo. */
export function makeLogoDataUrl(color = "#e4572e", size = 200): ResolvedImage {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}"><rect width="${size}" height="${size}" rx="${size / 5}" fill="${color}"/><circle cx="${size / 2}" cy="${size / 2}" r="${size / 4}" fill="#ffffff"/></svg>`;
  const png = new Resvg(svg).render().asPng();
  return { href: `data:image/png;base64,${Buffer.from(png).toString("base64")}`, width: size, height: size };
}
