"use client";

import { ArrowLeftRight } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { ColorField } from "@/components/ui/ColorField";
import {
  NumberField,
  SelectField,
  SliderField,
  SwitchField,
  TextField,
} from "@/components/ui/Field";
import { CANVAS_PRESETS, MAX_CANVAS, MIN_CANVAS } from "@/lib/model/presets";
import { resizeDocument } from "@/lib/model/ops";
import { BACKGROUND_PATTERNS, type DesignDocument, type DisplayUnit } from "@/lib/model/types";
import { fromUnits, pixelSize, toUnits } from "@/lib/model/units";
import { PaintEditor } from "@/features/qr-editor/PaintEditor";
import { useAssetStore } from "@/features/assets/assetStore";
import { useEditorStore } from "../../store/editorStore";
import { Section } from "../Section";

const PRECISION: Record<DisplayUnit, number> = { px: 0, mm: 1, in: 2 };

export function CanvasProperties() {
  const doc = useEditorStore((s) => s.doc);
  const view = useEditorStore((s) => s.view);
  const apply = useEditorStore((s) => s.apply);
  const rename = useEditorStore((s) => s.renameDocument);
  const setView = useEditorStore((s) => s.setView);
  const assets = useAssetStore((s) => s.assets);
  const order = useAssetStore((s) => s.order);
  const [scaleContent, setScaleContent] = useState(true);

  const set = (patch: Partial<DesignDocument>, key?: string) =>
    apply((d) => ({ ...d, ...patch }), key ?? null);
  const setBg = (patch: Partial<DesignDocument["background"]>, key?: string) =>
    apply((d) => ({ ...d, background: { ...d.background, ...patch } }), key ?? null);
  const resize = (w: number, h: number) =>
    apply((d) =>
      resizeDocument(
        d,
        Math.min(MAX_CANVAS, Math.max(MIN_CANVAS, Math.round(w))),
        Math.min(MAX_CANVAS, Math.max(MIN_CANVAS, Math.round(h))),
        scaleContent,
      ),
    );

  const preset = CANVAS_PRESETS.find(
    (p) => Math.round(p.width) === doc.width && Math.round(p.height) === doc.height,
  );
  const px = pixelSize(doc.width, doc.height, doc.dpi);
  const p = PRECISION[doc.unit];

  return (
    <>
      <Section title="Design">
        <TextField
          label="Name"
          value={doc.name}
          onValueChange={(name) => rename(name)}
          maxLength={120}
        />
      </Section>
      <Section title="Size">
        <SelectField
          label="Preset"
          value={preset?.id ?? "custom"}
          onValueChange={(id) => {
            const next = CANVAS_PRESETS.find((x) => x.id === id);
            if (!next) return;
            apply((d) => ({
              ...resizeDocument(d, Math.round(next.width), Math.round(next.height), scaleContent),
              unit: next.unit,
              dpi: next.dpi,
              cornerRadius: next.cornerRadius ?? 0,
            }));
          }}
          options={[
            ...CANVAS_PRESETS.map((x) => ({ value: x.id, label: `${x.label} — ${x.description}` })),
            { value: "custom", label: "Custom size", disabled: true },
          ]}
        />
        <div className="grid grid-cols-[1fr_1fr_auto] items-end gap-2">
          <NumberField
            label="Width"
            prefix="W"
            value={fromUnits(doc.width, doc.unit)}
            precision={p}
            suffix={doc.unit}
            min={fromUnits(MIN_CANVAS, doc.unit)}
            max={fromUnits(MAX_CANVAS, doc.unit)}
            onValueChange={(v) => resize(toUnits(v, doc.unit), doc.height)}
          />
          <NumberField
            label="Height"
            prefix="H"
            value={fromUnits(doc.height, doc.unit)}
            precision={p}
            suffix={doc.unit}
            min={fromUnits(MIN_CANVAS, doc.unit)}
            max={fromUnits(MAX_CANVAS, doc.unit)}
            onValueChange={(v) => resize(doc.width, toUnits(v, doc.unit))}
          />
          <Button
            size="sm"
            variant="secondary"
            aria-label="Swap orientation"
            title="Swap orientation"
            className="h-9"
            onClick={() => resize(doc.height, doc.width)}
          >
            <ArrowLeftRight className="size-4" />
          </Button>
        </div>
        <SwitchField
          label="Scale content when resizing"
          checked={scaleContent}
          onCheckedChange={setScaleContent}
        />
        <div className="grid grid-cols-2 gap-2">
          <SelectField<DisplayUnit>
            label="Units"
            value={doc.unit}
            onValueChange={(unit) => set({ unit })}
            options={[
              { value: "mm", label: "Millimetres" },
              { value: "in", label: "Inches" },
              { value: "px", label: "Pixels" },
            ]}
          />
          <SelectField
            label="Print DPI"
            value={String(doc.dpi)}
            onValueChange={(v) => set({ dpi: Number(v) })}
            options={["72", "96", "150", "300", "600"].map((v) => ({
              value: v,
              label: `${v} DPI`,
            }))}
          />
        </div>
        <p className="text-ink-3 font-mono text-[11px]">
          Exports at {px.width} × {px.height}px at {doc.dpi} DPI
        </p>
        <SliderField
          label="Corner radius"
          min={0}
          max={Math.round(Math.min(doc.width, doc.height) / 2)}
          value={doc.cornerRadius}
          onValueChange={(cornerRadius) => set({ cornerRadius }, "doc-radius")}
          format={(v) => `${v}px`}
        />
      </Section>
      <Section title="Background">
        <PaintEditor
          label="Fill"
          value={doc.background.paint}
          onChange={(paint) => setBg({ paint }, "doc-bg")}
          allowNone
          noneLabel="Transparent"
        />
        <SelectField
          label="Background image"
          value={doc.background.imageAssetId ?? "none"}
          onValueChange={(v) => setBg({ imageAssetId: v === "none" ? null : v })}
          options={[
            { value: "none", label: order.length ? "None" : "None — add images in the Images tab" },
            ...order.map((id) => ({ value: id, label: assets[id]?.name ?? id })),
          ]}
        />
        {doc.background.imageAssetId && (
          <div className="grid grid-cols-2 items-end gap-2">
            <SelectField
              label="Fit"
              value={doc.background.imageFit}
              onValueChange={(imageFit) => setBg({ imageFit })}
              options={[
                { value: "cover", label: "Fill" },
                { value: "contain", label: "Fit" },
              ]}
            />
            <SliderField
              label="Opacity"
              min={0.05}
              max={1}
              step={0.05}
              value={doc.background.imageOpacity}
              onValueChange={(imageOpacity) => setBg({ imageOpacity }, "bg-img-op")}
              format={(v) => `${Math.round(v * 100)}%`}
            />
          </div>
        )}
        <SelectField
          label="Pattern"
          value={doc.background.pattern}
          onValueChange={(pattern) => setBg({ pattern })}
          options={BACKGROUND_PATTERNS.map((x) => ({
            value: x,
            label: x === "none" ? "None" : x[0].toUpperCase() + x.slice(1),
          }))}
        />
        {doc.background.pattern !== "none" && (
          <>
            <ColorField
              label="Pattern color"
              value={doc.background.patternColor}
              onValueChange={(patternColor) => setBg({ patternColor }, "pat-color")}
            />
            <div className="grid grid-cols-2 gap-2">
              <SliderField
                label="Opacity"
                min={0.02}
                max={1}
                step={0.01}
                value={doc.background.patternOpacity}
                onValueChange={(patternOpacity) => setBg({ patternOpacity }, "pat-op")}
                format={(v) => `${Math.round(v * 100)}%`}
              />
              <SliderField
                label="Scale"
                min={6}
                max={120}
                value={doc.background.patternScale}
                onValueChange={(patternScale) => setBg({ patternScale }, "pat-scale")}
                format={(v) => `${v}px`}
              />
            </div>
          </>
        )}
      </Section>
      <Section title="Border" defaultOpen={doc.border.width > 0}>
        <SliderField
          label="Border thickness"
          min={0}
          max={Math.round(Math.min(doc.width, doc.height) / 8)}
          value={doc.border.width}
          onValueChange={(width) => set({ border: { ...doc.border, width } }, "doc-border")}
          format={(v) => `${v}px`}
        />
        <ColorField
          label="Border color"
          value={doc.border.color}
          onValueChange={(color) => set({ border: { ...doc.border, color } }, "doc-border-c")}
        />
      </Section>
      <Section title="Workspace" defaultOpen={false}>
        <SwitchField
          label="Smart guides"
          hint="Snap to edges and centers while moving."
          checked={view.snapToGuides}
          onCheckedChange={(snapToGuides) => setView({ snapToGuides })}
        />
        <SwitchField
          label="Show grid"
          checked={view.showGrid}
          onCheckedChange={(showGrid) => setView({ showGrid })}
        />
        <SwitchField
          label="Snap to grid"
          checked={view.snapToGrid}
          onCheckedChange={(snapToGrid) => setView({ snapToGrid })}
        />
        <SliderField
          label="Grid size"
          min={4}
          max={120}
          value={view.gridSize}
          onValueChange={(gridSize) => setView({ gridSize })}
          format={(v) => `${v}px`}
        />
      </Section>
    </>
  );
}
