"use client";

import { createElement, useEffect, useState } from "react";
import type { QrStyle } from "@/lib/qr/style";
import { QrSvg } from "@/render/QrGraphic";
import type { Asset } from "@/features/assets/assetStore";
import { rasterizeSvg } from "@/features/export/raster";
import { decodeCanvasRegion } from "@/features/export/scanCheck";
import { assetDataUrl } from "@/features/export/svgExport";

export type ScanStatus = "idle" | "checking" | "pass" | "fail";

const SCAN_SIZE = 480;
const DEBOUNCE_MS = 350;

/** Renders the QR exactly as styled and decodes it locally. */
export async function scanQrCode(
  payload: string,
  style: QrStyle,
  logo: Asset | null,
): Promise<string | null> {
  const { renderToStaticMarkup } = await import("react-dom/server");
  const resolved = logo
    ? { href: await assetDataUrl(logo), width: logo.width, height: logo.height }
    : null;
  const svg = renderToStaticMarkup(
    createElement(QrSvg, { payload, style, size: SCAN_SIZE, idPrefix: "scan", logo: resolved }),
  );
  const canvas = await rasterizeSvg(svg, SCAN_SIZE, SCAN_SIZE, "#ffffff");
  return decodeCanvasRegion(canvas, { x: 0, y: 0, width: SCAN_SIZE, height: SCAN_SIZE });
}

interface ScanResult {
  payload: string;
  style: QrStyle;
  logo: Asset | null;
  ok: boolean;
}

export function useScanCheck(
  payload: string | null,
  style: QrStyle,
  logo: Asset | null,
): ScanStatus {
  const [result, setResult] = useState<ScanResult | null>(null);
  useEffect(() => {
    if (!payload) return;
    let cancelled = false;
    const timer = setTimeout(() => {
      scanQrCode(payload, style, logo)
        .then(
          (decoded) => !cancelled && setResult({ payload, style, logo, ok: decoded === payload }),
        )
        .catch(() => !cancelled && setResult({ payload, style, logo, ok: false }));
    }, DEBOUNCE_MS);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [payload, style, logo]);

  // Derived: a result only counts for the exact inputs it was computed from.
  if (!payload) return "idle";
  if (!result || result.payload !== payload || result.style !== style || result.logo !== logo)
    return "checking";
  return result.ok ? "pass" : "fail";
}
