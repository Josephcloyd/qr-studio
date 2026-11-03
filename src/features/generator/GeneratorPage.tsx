"use client";

import { ArrowRight, LockKeyhole, Palette, Shapes, Sparkles } from "lucide-react";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { cn } from "@/components/ui/cn";
import { Button } from "@/components/ui/Button";
import { toast } from "@/components/ui/Toaster";
import { encodePayload } from "@/lib/qr/payloads";
import { QR_TYPE_LABELS } from "@/lib/qr/content";
import { buildMatrix } from "@/lib/qr/matrix";
import { computeQrLayout } from "@/lib/qr/layout";
import { analyzeReadability } from "@/lib/qr/readability";
import { effectiveEcLevel, type QrStyle } from "@/lib/qr/style";
import { useAssetStore } from "@/features/assets/assetStore";
import { releaseAssetIfUnused } from "@/features/assets/release";
import { ContentFields } from "@/features/qr-editor/ContentFields";
import { LogoControls } from "@/features/qr-editor/LogoControls";
import { ReadabilityList, ScanBadge } from "@/features/qr-editor/ReadabilityReport";
import { StyleControls } from "@/features/qr-editor/StyleControls";
import { TypePicker } from "@/features/qr-editor/TypePicker";
import { useScanCheck } from "@/features/qr-editor/useScanCheck";
import { sendQrToStudio } from "@/features/studio/openInStudio";
import { QrSvg } from "@/render/QrGraphic";
import { currentContent, useGeneratorStore } from "./generatorStore";
import { QuickDownload } from "./QuickDownload";
import { StylePresets } from "./StylePresets";

type Tab = "design" | "logo" | "presets";

export function GeneratorPage() {
  const router = useRouter();
  const type = useGeneratorStore((s) => s.type);
  const contents = useGeneratorStore((s) => s.contents);
  const style = useGeneratorStore((s) => s.style);
  const setType = useGeneratorStore((s) => s.setType);
  const setContent = useGeneratorStore((s) => s.setContent);
  const setStyle = useGeneratorStore((s) => s.setStyle);
  const [tab, setTab] = useState<Tab>("presets");

  const content = currentContent({ type, contents });
  const encoded = useMemo(() => encodePayload(content), [content]);
  const payload = encoded.ok ? encoded.payload : null;
  const logoAsset = useAssetStore((s) =>
    style.logo.assetId ? (s.assets[style.logo.assetId] ?? null) : null,
  );
  const logo = useMemo(
    () =>
      logoAsset ? { href: logoAsset.url, width: logoAsset.width, height: logoAsset.height } : null,
    [logoAsset],
  );
  const scan = useScanCheck(payload, style, logoAsset);

  const analysis = useMemo(() => {
    if (!payload)
      return { issues: [], capacityError: null as string | null, version: null as number | null };
    const m = buildMatrix(payload, effectiveEcLevel(style));
    if (!m.ok) return { issues: [], capacityError: m.error, version: null };
    const layout = computeQrLayout(m.matrix, style, {
      logoAspect: logo ? logo.width / logo.height : 1,
    });
    return {
      issues: analyzeReadability(style, layout),
      capacityError: null,
      version: m.matrix.version,
    };
  }, [payload, style, logo]);

  const handleStyle = (next: QrStyle) => setStyle(next);
  const ready = payload !== null && analysis.capacityError === null;

  const openStudio = () => {
    if (!ready) return;
    const result = sendQrToStudio(content, style);
    toast.success(
      result === "added" ? "Added to your design" : "Opened in the design studio",
      "Add text, images and shapes around your code.",
    );
    router.push("/studio/");
  };

  const TABS: { id: Tab; label: string; Icon: typeof Palette }[] = [
    { id: "presets", label: "Looks", Icon: Sparkles },
    { id: "design", label: "Customize", Icon: Palette },
    { id: "logo", label: "Logo", Icon: Shapes },
  ];

  return (
    <div className="mx-auto max-w-7xl px-4 pt-8 pb-20 sm:px-6 lg:pt-12">
      <div className="mb-8 max-w-2xl">
        <p className="text-accent-ink font-mono text-[11px] font-semibold tracking-[0.18em] uppercase">
          QR generator
        </p>
        <h1 className="font-display text-ink mt-2 text-4xl font-semibold tracking-tight text-balance sm:text-5xl">
          Make a QR code in seconds.
        </h1>
        <p className="text-ink-3 mt-3 text-[15.5px] leading-relaxed">
          Pick what it should do, style it, and download. Generated right here in your browser —
          what you type never leaves this page.
        </p>
      </div>

      {/* Mobile order: content → preview → styling. Desktop: forms left, sticky preview right. */}
      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_400px] lg:gap-x-10">
        <section
          aria-labelledby="step-content"
          className="border-line bg-card shadow-sheet rounded-3xl border p-5 sm:p-6 lg:col-start-1 lg:row-start-1"
        >
          <StepHeading id="step-content" step="1" title="What should it open?" />
          <TypePicker value={type} onChange={setType} />
          <div className="mt-6">
            <ContentFields
              content={content}
              onChange={setContent}
              errors={encoded.ok ? {} : encoded.errors}
            />
          </div>
          {encoded.ok &&
            encoded.warnings.map((w) => (
              <p
                key={w}
                className="bg-warning-soft text-warning mt-3 rounded-xl px-3 py-2 text-[12.5px]"
              >
                {w}
              </p>
            ))}
        </section>

        <section
          aria-labelledby="step-style"
          className="border-line bg-card shadow-sheet order-last rounded-3xl border p-5 sm:p-6 lg:order-none lg:col-start-1 lg:row-start-2"
        >
          <StepHeading id="step-style" step="2" title="Make it yours" />
          <div
            role="tablist"
            aria-label="Styling"
            className="bg-paper-2 mb-5 flex gap-1 rounded-2xl p-1"
          >
            {TABS.map(({ id, label, Icon }) => (
              <button
                key={id}
                role="tab"
                type="button"
                id={`tab-${id}`}
                aria-selected={tab === id}
                aria-controls={`panel-${id}`}
                onClick={() => setTab(id)}
                className={cn(
                  "flex h-10 flex-1 items-center justify-center gap-2 rounded-xl text-sm font-semibold transition-all",
                  tab === id
                    ? "bg-card text-ink shadow-[0_1px_2px_rgb(0_0_0/0.12)]"
                    : "text-ink-3 hover:text-ink",
                )}
              >
                <Icon className="size-4" aria-hidden="true" />
                {label}
              </button>
            ))}
          </div>
          <div role="tabpanel" id={`panel-${tab}`} aria-labelledby={`tab-${tab}`}>
            {tab === "presets" && <StylePresets style={style} onChange={handleStyle} />}
            {tab === "design" && <StyleControls style={style} onChange={handleStyle} />}
            {tab === "logo" && (
              <LogoControls
                style={style}
                onChange={handleStyle}
                onReleaseAsset={releaseAssetIfUnused}
              />
            )}
          </div>
        </section>

        <aside
          aria-label="Preview and download"
          className="lg:sticky lg:top-24 lg:col-start-2 lg:row-span-2 lg:row-start-1"
        >
          <div className="border-line bg-card shadow-sheet overflow-hidden rounded-3xl border">
            <div className="paper-grain border-line bg-paper-2/60 flex flex-col items-center gap-4 border-b px-6 pt-6 pb-5">
              <div className="flex w-full items-center justify-between">
                <span className="text-ink-3 font-mono text-[11px] font-semibold tracking-[0.14em] uppercase">
                  {QR_TYPE_LABELS[type]} code
                </span>
                <ScanBadge status={ready ? scan : "idle"} />
              </div>
              <div
                className={cn(
                  "checkerboard w-full max-w-[300px] overflow-hidden rounded-2xl shadow-[0_18px_40px_-20px_rgb(22_19_15/0.5)] transition-opacity",
                  !ready && "opacity-60",
                )}
              >
                <QrSvg
                  payload={ready ? payload : null}
                  style={style}
                  size={300}
                  idPrefix="gen"
                  logo={logo}
                  className="block h-auto w-full"
                  title="QR code preview"
                />
              </div>
              {analysis.version && (
                <p className="text-ink-3 font-mono text-[11px]">
                  Version {analysis.version} · EC {effectiveEcLevel(style)} · static code
                </p>
              )}
            </div>
            <div className="grid gap-4 p-5">
              {analysis.capacityError ? (
                <p
                  role="alert"
                  className="bg-danger-soft text-danger rounded-xl px-3 py-2 text-[12.5px]"
                >
                  {analysis.capacityError}
                </p>
              ) : ready ? (
                <ReadabilityList issues={analysis.issues} scanStatus={scan} />
              ) : (
                <p className="text-ink-3 text-[13px]">
                  Fill in the details to generate your code. The preview updates as you type.
                </p>
              )}
              {ready && payload && (
                <details className="group border-line bg-paper/60 rounded-xl border px-3 py-2">
                  <summary className="text-ink-2 cursor-pointer text-[12.5px] font-medium select-none">
                    Encoded content
                  </summary>
                  <pre className="text-ink-2 mt-2 max-h-40 overflow-auto font-mono text-[11.5px] break-all whitespace-pre-wrap">
                    {payload}
                  </pre>
                </details>
              )}
              <QuickDownload content={content} style={style} disabled={!ready} scanStatus={scan} />
              <Button
                variant="accent"
                size="lg"
                className="w-full"
                disabled={!ready}
                onClick={openStudio}
              >
                Design a layout around it
                <ArrowRight className="size-4" aria-hidden="true" />
              </Button>
              <p className="text-ink-3 flex items-center justify-center gap-1.5 text-center text-[12px]">
                <LockKeyhole className="size-3.5" aria-hidden="true" />
                Generated locally. Nothing is uploaded or saved.
              </p>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}

function StepHeading({ id, step, title }: { id: string; step: string; title: string }) {
  return (
    <h2 id={id} className="text-ink mb-5 flex items-center gap-3 text-[17px] font-semibold">
      <span className="bg-ink text-paper flex size-7 items-center justify-center rounded-full font-mono text-[12px]">
        {step}
      </span>
      {title}
    </h2>
  );
}
