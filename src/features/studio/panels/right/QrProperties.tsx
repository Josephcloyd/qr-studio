"use client";

import { useMemo, useState } from "react";
import { cn } from "@/components/ui/cn";
import { emptyContent, type QrContent } from "@/lib/qr/content";
import { computeQrLayout } from "@/lib/qr/layout";
import { buildMatrix } from "@/lib/qr/matrix";
import { encodePayload } from "@/lib/qr/payloads";
import { analyzeReadability } from "@/lib/qr/readability";
import { effectiveEcLevel, type QrStyle } from "@/lib/qr/style";
import { unitsToMm } from "@/lib/model/units";
import type { DesignDocument, QrElement } from "@/lib/model/types";
import { useAssetStore } from "@/features/assets/assetStore";
import { releaseAssetIfUnused } from "@/features/assets/release";
import { ContentFields } from "@/features/qr-editor/ContentFields";
import { LogoControls } from "@/features/qr-editor/LogoControls";
import { ReadabilityList, ScanBadge } from "@/features/qr-editor/ReadabilityReport";
import { StyleControls } from "@/features/qr-editor/StyleControls";
import { TypePicker } from "@/features/qr-editor/TypePicker";
import { useScanCheck } from "@/features/qr-editor/useScanCheck";
import { StylePresets } from "@/features/generator/StylePresets";
import { useEditorStore } from "../../store/editorStore";
import { Section } from "../Section";

type Tab = "content" | "style" | "logo";

function backdropFor(doc: DesignDocument): string | null {
  return doc.background.paint.kind === "solid" && !doc.background.imageAssetId ? doc.background.paint.color : null;
}

export function QrProperties({ el }: { el: QrElement }) {
  const [tab, setTab] = useState<Tab>("content");
  const update = useEditorStore((s) => s.updateElement);
  const doc = useEditorStore((s) => s.doc);
  const logoAsset = useAssetStore((s) => (el.style.logo.assetId ? s.assets[el.style.logo.assetId] ?? null : null));

  const encoded = useMemo(() => encodePayload(el.content), [el.content]);
  const payload = encoded.ok ? encoded.payload : null;
  const scan = useScanCheck(payload, el.style, logoAsset);
  const printWidthMm = doc.unit === "px" ? null : unitsToMm(el.width);
  const analysis = useMemo(() => {
    if (!payload) return { issues: [], error: null as string | null };
    const m = buildMatrix(payload, effectiveEcLevel(el.style));
    if (!m.ok) return { issues: [], error: m.error };
    const layout = computeQrLayout(m.matrix, el.style, { logoAspect: logoAsset ? logoAsset.width / logoAsset.height : 1 });
    return { issues: analyzeReadability(el.style, layout, { backdrop: backdropFor(doc), printWidthMm }), error: null };
  }, [payload, el.style, logoAsset, doc, printWidthMm]);

  const setContent = (content: QrContent) => update<QrElement>(el.id, { content }, `qr-content:${el.id}`);
  const setStyle = (style: QrStyle, key?: string) => update<QrElement>(el.id, { style }, key ? `qr-${key}:${el.id}` : null);

  return (
    <>
      <Section title="QR code" action={<ScanBadge status={payload && !analysis.error ? scan : "idle"} />}>
        <div role="tablist" aria-label="QR settings" className="flex gap-1 rounded-xl bg-paper-2 p-1">
          {(["content", "style", "logo"] as Tab[]).map((t) => (
            <button
              key={t}
              type="button"
              role="tab"
              aria-selected={tab === t}
              onClick={() => setTab(t)}
              className={cn("h-8 flex-1 rounded-lg text-[13px] font-semibold capitalize transition-all", tab === t ? "bg-card text-ink shadow-sm" : "text-ink-3 hover:text-ink")}
            >
              {t}
            </button>
          ))}
        </div>
        {tab === "content" && (
          <div className="grid gap-4">
            <TypePicker
              compact
              value={el.content.type}
              onChange={(type) => type !== el.content.type && setContent(emptyContent(type))}
            />
            <ContentFields content={el.content} onChange={setContent} errors={encoded.ok ? {} : encoded.errors} />
          </div>
        )}
        {tab === "style" && (
          <div className="grid gap-6">
            <StylePresets style={el.style} onChange={(s) => setStyle(s)} />
            <StyleControls style={el.style} onChange={setStyle} />
          </div>
        )}
        {tab === "logo" && <LogoControls style={el.style} onChange={setStyle} onReleaseAsset={releaseAssetIfUnused} />}
      </Section>
      <Section title="Readability">
        {analysis.error ? (
          <p role="alert" className="rounded-xl bg-danger-soft px-3 py-2 text-[12.5px] text-danger">{analysis.error}</p>
        ) : payload ? (
          <ReadabilityList issues={analysis.issues} scanStatus={scan} />
        ) : (
          <p className="text-[12.5px] text-ink-3">Add content to generate the code. Until then a placeholder is shown.</p>
        )}
        {printWidthMm && <p className="font-mono text-[11px] text-ink-3">Prints at {printWidthMm.toFixed(1)} mm wide</p>}
      </Section>
    </>
  );
}
