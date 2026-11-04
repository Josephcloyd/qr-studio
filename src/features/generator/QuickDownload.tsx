"use client";

import { Download, LoaderCircle } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Segmented, SelectField } from "@/components/ui/Field";
import { toast } from "@/components/ui/Toaster";
import type { QrContent } from "@/lib/qr/content";
import type { QrStyle } from "@/lib/qr/style";
import { useAssetStore } from "@/features/assets/assetStore";
import { downloadBlob, formatBytes, slugify } from "@/features/export/download";
import { exportPdf, exportPng, exportSvg } from "@/features/export/exporter";
import { qrOnlyDocument } from "@/features/export/qrDocument";
import type { ScanStatus } from "@/features/qr-editor/useScanCheck";
import { QR_TYPE_LABELS } from "@/lib/qr/content";

type Format = "png" | "svg" | "pdf";
const PNG_SIZES = ["512", "1024", "2048", "4096"] as const;
/** QR-only PDFs print at 2.5 in (≈ 64 mm) — a comfortable scanning size. */
const PDF_SIZE_UNITS = 240;

interface QuickDownloadProps {
  content: QrContent;
  style: QrStyle;
  disabled: boolean;
  scanStatus: ScanStatus;
}

export function QuickDownload({ content, style, disabled, scanStatus }: QuickDownloadProps) {
  const [format, setFormat] = useState<Format>("png");
  const [pngSize, setPngSize] = useState<(typeof PNG_SIZES)[number]>("1024");
  const [busy, setBusy] = useState(false);
  const assets = useAssetStore((s) => s.assets);

  const run = async () => {
    if (
      scanStatus === "fail" &&
      !window.confirm("This design didn't pass the scan check. Download anyway?")
    )
      return;
    setBusy(true);
    const name = `qr-${slugify(QR_TYPE_LABELS[content.type])}`;
    try {
      if (format === "png") {
        const size = Number(pngSize);
        const doc = qrOnlyDocument(content, style, size);
        const result = await exportPng(doc, assets, { dpi: 96, transparent: false });
        // Name the file after the real output size (phones may clamp very large canvases).
        downloadBlob(result.blob, `${name}-${result.width}px.png`);
        toast.success(
          "PNG downloaded",
          `${result.width} × ${result.height}px · ${formatBytes(result.blob.size)}${result.clamped ? " (reduced to fit this device)" : ""}`,
        );
      } else if (format === "svg") {
        const blob = await exportSvg(qrOnlyDocument(content, style, 512), assets, false);
        downloadBlob(blob, `${name}.svg`);
        toast.success("SVG downloaded", `Vector · ${formatBytes(blob.size)}`);
      } else {
        const doc = qrOnlyDocument(content, style, PDF_SIZE_UNITS);
        const result = await exportPdf(doc, assets, {
          page: "design",
          orientation: "auto",
          customWidthMm: 0,
          customHeightMm: 0,
          marginMm: 0,
          dpi: 600,
        });
        downloadBlob(result.blob, `${name}.pdf`);
        toast.success("PDF downloaded", `64 × 64 mm at 600 DPI · ${formatBytes(result.blob.size)}`);
      }
    } catch (error) {
      toast.error("Download failed", error instanceof Error ? error.message : "Please try again.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="border-line bg-paper/50 grid gap-3 rounded-2xl border p-3">
      <div className="flex items-end gap-2">
        <Segmented
          className="flex-1"
          label="Format"
          size="sm"
          value={format}
          onValueChange={setFormat}
          options={[
            { value: "png", label: "PNG" },
            { value: "svg", label: "SVG" },
            { value: "pdf", label: "PDF" },
          ]}
        />
        {format === "png" && (
          <SelectField
            className="w-[110px]"
            label="Size"
            value={pngSize}
            onValueChange={setPngSize}
            options={PNG_SIZES.map((s) => ({ value: s, label: `${s}px` }))}
          />
        )}
      </div>
      <Button
        variant="primary"
        size="md"
        disabled={disabled || busy}
        onClick={run}
        className="w-full"
      >
        {busy ? (
          <LoaderCircle className="size-4 animate-spin" aria-hidden="true" />
        ) : (
          <Download className="size-4" aria-hidden="true" />
        )}
        {busy ? "Preparing…" : `Download ${format.toUpperCase()}`}
      </Button>
    </div>
  );
}
