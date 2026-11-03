/**
 * Builds a self-contained SVG for a design: images become data: URIs and
 * fonts are embedded, so the file never references blob: URLs that expire
 * when the tab closes. Runs entirely in the browser.
 */
import { createElement } from "react";
import { blobToDataUrl } from "@/lib/assets/intake";
import { referencedAssets } from "@/lib/model/ops";
import type { DesignDocument } from "@/lib/model/types";
import { canvasMeasure } from "@/lib/text/measure";
import { DocumentSvg } from "@/render/DocumentSvg";
import type { ResolvedImage } from "@/render/QrGraphic";
import type { Asset } from "@/features/assets/assetStore";
import { ensureFontsLoaded, fontFaceCss, fontsUsed } from "./fonts";

const dataUrlCache = new WeakMap<Blob, Promise<string>>();

export function assetDataUrl(asset: Asset): Promise<string> {
  const hit = dataUrlCache.get(asset.blob);
  if (hit) return hit;
  const p = blobToDataUrl(asset.blob);
  dataUrlCache.set(asset.blob, p);
  return p;
}

export async function embeddedAssetMap(
  ids: Iterable<string>,
  assets: Record<string, Asset>,
): Promise<Map<string, ResolvedImage>> {
  const map = new Map<string, ResolvedImage>();
  for (const id of ids) {
    const a = assets[id];
    if (!a) continue;
    map.set(id, { href: await assetDataUrl(a), width: a.width, height: a.height });
  }
  return map;
}

export interface SvgExportOptions {
  transparent?: boolean;
  embedFonts?: boolean;
  /** Output size attributes (defaults to document units). */
  width?: number;
  height?: number;
}

export async function buildDocumentSvg(
  doc: DesignDocument,
  assets: Record<string, Asset>,
  options: SvgExportOptions = {},
): Promise<string> {
  const { renderToStaticMarkup } = await import("react-dom/server");
  const fonts = fontsUsed(doc);
  await ensureFontsLoaded(fonts);
  const [embedded, fontCss] = await Promise.all([
    embeddedAssetMap(referencedAssets(doc), assets),
    options.embedFonts === false ? Promise.resolve("") : fontFaceCss(fonts),
  ]);
  const markup = renderToStaticMarkup(
    createElement(DocumentSvg, {
      doc,
      resolveAsset: (id: string) => embedded.get(id) ?? null,
      measure: canvasMeasure,
      idPrefix: "x",
      mode: "export",
      transparent: options.transparent,
      fontCss,
      width: options.width,
      height: options.height,
    }),
  );
  return `<?xml version="1.0" encoding="UTF-8"?>\n${markup}`;
}
