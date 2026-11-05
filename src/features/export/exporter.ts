/**
 * High-level exports. Everything is generated locally with browser APIs and
 * client-side libraries — no server, no upload.
 */
import { setPngDpi } from "@/lib/export/pngDpi";
import { pixelSize, toUnits, UNITS_PER_INCH } from "@/lib/model/units";
import type { DesignDocument } from "@/lib/model/types";
import type { Asset } from "@/features/assets/assetStore";
import { canvasToBlob, clampPixelSize, rasterizeSvg } from "./raster";
import { verifyDocumentQrCodes, type QrVerification } from "./scanCheck";
import { buildDocumentSvg } from "./svgExport";

export interface RasterResult {
  blob: Blob;
  width: number;
  height: number;
  clamped: boolean;
  effectiveDpi: number;
  verification: QrVerification[];
}

export interface PngOptions {
  dpi: number;
  transparent: boolean;
}

async function renderCanvas(
  doc: DesignDocument,
  assets: Record<string, Asset>,
  dpi: number,
  transparent: boolean,
) {
  const requested = pixelSize(doc.width, doc.height, dpi);
  const size = clampPixelSize(requested.width, requested.height);
  const svg = await buildDocumentSvg(doc, assets, {
    transparent,
    width: size.width,
    height: size.height,
  });
  const canvas = await rasterizeSvg(svg, size.width, size.height);
  const effectiveDpi = Math.round((size.width / doc.width) * UNITS_PER_INCH);
  return { canvas, size, effectiveDpi };
}

export async function exportPng(
  doc: DesignDocument,
  assets: Record<string, Asset>,
  opts: PngOptions,
): Promise<RasterResult> {
  const { canvas, size, effectiveDpi } = await renderCanvas(
    doc,
    assets,
    opts.dpi,
    opts.transparent,
  );
  // Scan-check on an opaque copy so transparent exports are verified fairly.
  const verification = await verifyDocumentQrCodes(doc, canvas);
  const raw = await canvasToBlob(canvas, "image/png");
  const withDpi = setPngDpi(new Uint8Array(await raw.arrayBuffer()), effectiveDpi);
  return {
    blob: new Blob([withDpi as BlobPart], { type: "image/png" }),
    width: size.width,
    height: size.height,
    clamped: size.clamped,
    effectiveDpi,
    verification,
  };
}

export async function exportSvg(
  doc: DesignDocument,
  assets: Record<string, Asset>,
  transparent: boolean,
): Promise<Blob> {
  const svg = await buildDocumentSvg(doc, assets, { transparent });
  return new Blob([svg], { type: "image/svg+xml;charset=utf-8" });
}

export type PdfPage = "design" | "a4" | "a5" | "letter" | "custom";

export interface PdfOptions {
  page: PdfPage;
  orientation: "auto" | "portrait" | "landscape";
  /** Custom page size in mm. */
  customWidthMm: number;
  customHeightMm: number;
  marginMm: number;
  dpi: number;
}

const PAGE_MM: Record<Exclude<PdfPage, "design" | "custom">, [number, number]> = {
  a4: [210, 297],
  a5: [148, 210],
  letter: [215.9, 279.4],
};

export function pdfPageSize(
  doc: DesignDocument,
  opts: PdfOptions,
): { width: number; height: number } {
  const docMm = {
    width: (doc.width / UNITS_PER_INCH) * 25.4,
    height: (doc.height / UNITS_PER_INCH) * 25.4,
  };
  if (opts.page === "design") return docMm;
  const [w, h] =
    opts.page === "custom" ? [opts.customWidthMm, opts.customHeightMm] : PAGE_MM[opts.page];
  const landscape =
    opts.orientation === "landscape" || (opts.orientation === "auto" && docMm.width > docMm.height);
  const [short, long] = [Math.min(w, h), Math.max(w, h)];
  return landscape ? { width: long, height: short } : { width: short, height: long };
}

/** Where the design sits on the page: scaled to fit inside margins, centered, proportions kept. */
export function pdfPlacement(
  doc: DesignDocument,
  page: { width: number; height: number },
  marginMm: number,
) {
  const docMm = {
    width: (doc.width / UNITS_PER_INCH) * 25.4,
    height: (doc.height / UNITS_PER_INCH) * 25.4,
  };
  const availW = Math.max(1, page.width - marginMm * 2);
  const availH = Math.max(1, page.height - marginMm * 2);
  const scale = Math.min(availW / docMm.width, availH / docMm.height);
  const width = docMm.width * scale;
  const height = docMm.height * scale;
  return { x: (page.width - width) / 2, y: (page.height - height) / 2, width, height, scale };
}

export async function exportPdf(
  doc: DesignDocument,
  assets: Record<string, Asset>,
  opts: PdfOptions,
): Promise<RasterResult> {
  const page = pdfPageSize(doc, opts);
  const margin = opts.page === "design" ? 0 : opts.marginMm;
  const place = pdfPlacement(doc, page, margin);
  // Render at the DPI the design will actually print at on this page.
  const printDpi = opts.dpi * place.scale;
  const { canvas, size, effectiveDpi } = await renderCanvas(doc, assets, printDpi, false);
  const verification = await verifyDocumentQrCodes(doc, canvas);
  const { jsPDF } = await import("jspdf");
  const pdf = new jsPDF({
    unit: "mm",
    format: [page.width, page.height],
    orientation: page.width > page.height ? "landscape" : "portrait",
    compress: true,
  });
  pdf.setProperties({ title: doc.name, creator: "QR Studio by GetLaunch PH" });
  pdf.addImage(canvas, "PNG", place.x, place.y, place.width, place.height, undefined, "FAST");
  const blob = pdf.output("blob");
  return {
    blob,
    width: size.width,
    height: size.height,
    clamped: size.clamped,
    effectiveDpi: Math.round(effectiveDpi / place.scale),
    verification,
  };
}

export const mmToDocUnits = (mm: number): number => toUnits(mm, "mm");
