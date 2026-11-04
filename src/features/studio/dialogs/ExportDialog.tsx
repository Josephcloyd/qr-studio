"use client";

import {
  CircleAlert,
  Download,
  FileJson,
  FileImage,
  FileText,
  LoaderCircle,
  LockKeyhole,
  PenTool,
} from "lucide-react";
import { useRef, useState } from "react";
import { Button } from "@/components/ui/Button";
import { cn } from "@/components/ui/cn";
import { useRovingGroup } from "@/components/ui/useRovingGroup";
import { Dialog } from "@/components/ui/Dialog";
import { NumberField, Segmented, SelectField, SwitchField } from "@/components/ui/Field";
import { toast } from "@/components/ui/Toaster";
import { pixelSize, UNITS_PER_INCH } from "@/lib/model/units";
import { useAssetStore } from "@/features/assets/assetStore";
import { downloadBlob, formatBytes, slugify } from "@/features/export/download";
import {
  exportPdf,
  exportPng,
  exportSvg,
  pdfPageSize,
  type PdfOptions,
  type PdfPage,
  type RasterResult,
} from "@/features/export/exporter";
import { downloadProject } from "@/features/project/projectIO";
import { useEditorStore } from "../store/editorStore";
import { useUiStore } from "../store/uiStore";

type Format = "png" | "svg" | "pdf" | "project";

const FORMATS: { id: Format; label: string; Icon: typeof FileImage; blurb: string }[] = [
  { id: "png", label: "PNG", Icon: FileImage, blurb: "Image for screens & print" },
  { id: "svg", label: "SVG", Icon: PenTool, blurb: "Scalable vector" },
  { id: "pdf", label: "PDF", Icon: FileText, blurb: "Print-ready document" },
  { id: "project", label: "Project", Icon: FileJson, blurb: "Keep editing later" },
];

interface Pending {
  result: RasterResult;
  filename: string;
  summary: string;
}

export function ExportDialog() {
  const open = useUiStore((s) => s.dialog === "export");
  const openDialog = useUiStore((s) => s.openDialog);
  const doc = useEditorStore((s) => s.doc);
  const assets = useAssetStore((s) => s.assets);
  const [format, setFormat] = useState<Format>("png");
  const [busy, setBusy] = useState(false);
  const [pending, setPending] = useState<Pending | null>(null);
  const runId = useRef(0);

  // PNG
  const [pngMode, setPngMode] = useState<"dpi" | "width">("dpi");
  const [pngDpi, setPngDpi] = useState(String(doc.dpi));
  const [pngWidth, setPngWidth] = useState(2000);
  const [transparent, setTransparent] = useState(false);
  // PDF
  const [pdf, setPdf] = useState<PdfOptions>({
    page: "design",
    orientation: "auto",
    customWidthMm: 210,
    customHeightMm: 297,
    marginMm: 10,
    dpi: 300,
  });

  const pngDpiValue = pngMode === "dpi" ? Number(pngDpi) : (pngWidth / doc.width) * UNITS_PER_INCH;
  const pngPx = pixelSize(doc.width, doc.height, pngDpiValue);
  const pageMm = pdfPageSize(doc, pdf);
  const base = slugify(doc.name);
  const hasQr = doc.elements.some((e) => e.type === "qr" && !e.hidden);

  const finish = (blob: Blob, filename: string, summary: string) => {
    downloadBlob(blob, filename);
    toast.success(`${filename.split(".").pop()?.toUpperCase()} downloaded`, summary);
    setPending(null);
    openDialog(null);
  };

  const handleRaster = (result: RasterResult, filename: string, summary: string) => {
    const failed = result.verification.filter((v) => !v.ok);
    if (failed.length) setPending({ result, filename, summary });
    else finish(result.blob, filename, `${summary}${hasQr ? " · QR verified" : ""}`);
  };

  const run = async () => {
    const id = ++runId.current;
    // Closing the dialog mid-export bumps runId, so a late result is dropped
    // instead of downloading (or flashing a stale warning) after the fact.
    const stale = () => id !== runId.current;
    setBusy(true);
    try {
      if (format === "png") {
        const r = await exportPng(doc, assets, { dpi: pngDpiValue, transparent });
        if (stale()) return;
        const note = r.clamped ? " (reduced to fit browser limits)" : "";
        handleRaster(
          r,
          `${base}.png`,
          `${r.width} × ${r.height}px · ${formatBytes(r.blob.size)}${note}`,
        );
      } else if (format === "svg") {
        const blob = await exportSvg(doc, assets, transparent);
        if (stale()) return;
        finish(
          blob,
          `${base}.svg`,
          `Vector with embedded images & fonts · ${formatBytes(blob.size)}`,
        );
      } else if (format === "pdf") {
        const r = await exportPdf(doc, assets, pdf);
        if (stale()) return;
        handleRaster(
          r,
          `${base}.pdf`,
          `${pageMm.width.toFixed(0)} × ${pageMm.height.toFixed(0)} mm · ${r.effectiveDpi} DPI · ${formatBytes(r.blob.size)}`,
        );
      } else {
        await downloadProject();
        openDialog(null);
      }
    } catch (error) {
      if (!stale())
        toast.error("Export failed", error instanceof Error ? error.message : "Please try again.");
    } finally {
      if (!stale()) setBusy(false);
    }
  };

  const { attach: groupAttach, onKeyDown: groupKeys } = useRovingGroup<HTMLDivElement>();
  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        if (!o) {
          runId.current++; // cancel any export in flight
          setPending(null);
          setBusy(false);
        }
        openDialog(o ? "export" : null);
      }}
      title="Export"
      description="Files are created on your device. Nothing is uploaded."
      wide
      footer={
        pending ? (
          <>
            <Button variant="secondary" onClick={() => setPending(null)}>
              Go back
            </Button>
            <Button
              variant="danger"
              onClick={() => finish(pending.result.blob, pending.filename, pending.summary)}
            >
              Download anyway
            </Button>
          </>
        ) : (
          <>
            <Button variant="ghost" onClick={() => openDialog(null)}>
              Cancel
            </Button>
            <Button variant="primary" disabled={busy} onClick={run} data-testid="export-download">
              {busy ? (
                <LoaderCircle className="size-4 animate-spin" aria-hidden="true" />
              ) : (
                <Download className="size-4" aria-hidden="true" />
              )}
              {busy
                ? "Preparing…"
                : format === "project"
                  ? "Download project"
                  : `Download ${format.toUpperCase()}`}
            </Button>
          </>
        )
      }
    >
      {pending ? (
        <div
          role="alert"
          className="border-danger/30 bg-danger-soft/60 grid gap-3 rounded-2xl border p-4"
        >
          <p className="text-danger flex items-center gap-2 font-semibold">
            <CircleAlert className="size-5" aria-hidden="true" /> Some QR codes didn&apos;t pass the
            scan check
          </p>
          <ul className="text-ink-2 list-disc pl-6 text-[13px]">
            {pending.result.verification
              .filter((v) => !v.ok)
              .map((v) => (
                <li key={v.id}>
                  {v.name}:{" "}
                  {v.expected
                    ? "couldn't be decoded from the exported image"
                    : "has no valid content"}
                </li>
              ))}
          </ul>
          <p className="text-ink-2 text-[13px]">
            Try a higher resolution, more contrast, a smaller logo, or keep other elements from
            overlapping the code.
          </p>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-[200px_1fr]">
          <div
            ref={groupAttach}
            onKeyDown={groupKeys}
            role="radiogroup"
            aria-label="Format"
            className="grid grid-cols-2 gap-2 md:grid-cols-1"
          >
            {FORMATS.map(({ id, label, Icon, blurb }) => (
              <button
                key={id}
                type="button"
                role="radio"
                aria-checked={format === id}
                onClick={() => setFormat(id)}
                className={cn(
                  "flex items-center gap-3 rounded-2xl border p-3 text-left transition-all",
                  format === id
                    ? "border-ink bg-card shadow-[0_0_0_1px_var(--ink)]"
                    : "border-line bg-card hover:border-ink-3",
                )}
              >
                <Icon
                  className={cn(
                    "size-5 shrink-0",
                    format === id ? "text-accent-ink" : "text-ink-3",
                  )}
                  aria-hidden="true"
                />
                <span>
                  <span className="text-ink block text-sm font-semibold">{label}</span>
                  <span className="text-ink-3 block text-[11.5px]">{blurb}</span>
                </span>
              </button>
            ))}
          </div>

          <div className="grid content-start gap-4">
            {format === "png" && (
              <>
                <Segmented
                  label="Size by"
                  size="sm"
                  value={pngMode}
                  onValueChange={setPngMode}
                  options={[
                    { value: "dpi", label: "Print resolution" },
                    { value: "width", label: "Pixel width" },
                  ]}
                />
                {pngMode === "dpi" ? (
                  <SelectField
                    label="Resolution"
                    value={pngDpi}
                    onValueChange={setPngDpi}
                    options={[
                      { value: "72", label: "72 DPI — web, small" },
                      { value: "150", label: "150 DPI — standard" },
                      { value: "300", label: "300 DPI — high-res print" },
                      { value: "600", label: "600 DPI — extra sharp" },
                    ]}
                  />
                ) : (
                  <NumberField
                    label="Width in pixels"
                    value={pngWidth}
                    min={64}
                    max={16384}
                    suffix="px"
                    onValueChange={setPngWidth}
                  />
                )}
                <SwitchField
                  label="Transparent background"
                  hint="Leaves the canvas background out."
                  checked={transparent}
                  onCheckedChange={setTransparent}
                />
                <Summary
                  rows={[
                    ["Output", `${pngPx.width} × ${pngPx.height}px`],
                    ["Density", `${Math.round(pngDpiValue)} DPI`],
                  ]}
                />
              </>
            )}
            {format === "svg" && (
              <>
                <SwitchField
                  label="Transparent background"
                  checked={transparent}
                  onCheckedChange={setTransparent}
                />
                <p className="text-ink-2 text-[13px] leading-relaxed">
                  QR codes, shapes and text stay vector. Images and the fonts you used are embedded
                  inside the file, so it works anywhere — no links to temporary browser data.
                </p>
              </>
            )}
            {format === "pdf" && (
              <>
                <SelectField<PdfPage>
                  label="Page size"
                  value={pdf.page}
                  onValueChange={(page) => setPdf({ ...pdf, page })}
                  options={[
                    { value: "design", label: "Match design size" },
                    { value: "a4", label: "A4 (210 × 297 mm)" },
                    { value: "a5", label: "A5 (148 × 210 mm)" },
                    { value: "letter", label: "US Letter" },
                    { value: "custom", label: "Custom" },
                  ]}
                />
                {pdf.page === "custom" && (
                  <div className="grid grid-cols-2 gap-2">
                    <NumberField
                      label="Page width"
                      value={pdf.customWidthMm}
                      min={20}
                      max={2000}
                      suffix="mm"
                      onValueChange={(customWidthMm) => setPdf({ ...pdf, customWidthMm })}
                    />
                    <NumberField
                      label="Page height"
                      value={pdf.customHeightMm}
                      min={20}
                      max={2000}
                      suffix="mm"
                      onValueChange={(customHeightMm) => setPdf({ ...pdf, customHeightMm })}
                    />
                  </div>
                )}
                {pdf.page !== "design" && (
                  <div className="grid grid-cols-2 gap-2">
                    <SelectField
                      label="Orientation"
                      value={pdf.orientation}
                      onValueChange={(orientation) => setPdf({ ...pdf, orientation })}
                      options={[
                        { value: "auto", label: "Automatic" },
                        { value: "portrait", label: "Portrait" },
                        { value: "landscape", label: "Landscape" },
                      ]}
                    />
                    <NumberField
                      label="Margin"
                      value={pdf.marginMm}
                      min={0}
                      max={50}
                      suffix="mm"
                      onValueChange={(marginMm) => setPdf({ ...pdf, marginMm })}
                    />
                  </div>
                )}
                <SelectField
                  label="Image quality"
                  value={String(pdf.dpi)}
                  onValueChange={(v) => setPdf({ ...pdf, dpi: Number(v) })}
                  options={[
                    { value: "150", label: "150 DPI — smaller file" },
                    { value: "300", label: "300 DPI — print" },
                    { value: "600", label: "600 DPI — extra sharp" },
                  ]}
                />
                <Summary
                  rows={[
                    ["Page", `${pageMm.width.toFixed(1)} × ${pageMm.height.toFixed(1)} mm`],
                    ["Design", pdf.page === "design" ? "Full page" : "Scaled to fit, centered"],
                  ]}
                />
              </>
            )}
            {format === "project" && (
              <p className="text-ink-2 text-[13px] leading-relaxed">
                Saves an editable <span className="font-mono">.qrstudio.json</span> file to your
                device with your layout, QR settings and images. Open it any time with{" "}
                <strong>Open project</strong>. It never leaves your device unless you share it.
              </p>
            )}
            <p className="text-ink-3 flex items-center gap-1.5 text-[12px]">
              <LockKeyhole className="size-3.5" aria-hidden="true" />
              {format === "project"
                ? "Saved directly to your downloads."
                : hasQr && format !== "svg"
                  ? "Every QR code is decoded after rendering to confirm it scans."
                  : "Rendered locally in your browser."}
            </p>
          </div>
        </div>
      )}
    </Dialog>
  );
}

function Summary({ rows }: { rows: [string, string][] }) {
  return (
    <dl className="bg-paper-2 grid gap-1 rounded-xl px-3 py-2.5 font-mono text-[12px]">
      {rows.map(([k, v]) => (
        <div key={k} className="flex justify-between gap-3">
          <dt className="text-ink-3">{k}</dt>
          <dd className="text-ink">{v}</dd>
        </div>
      ))}
    </dl>
  );
}
