"use client";

import { AlignCenter, AlignLeft, AlignRight, CaseUpper, Italic, MoveHorizontal } from "lucide-react";
import { Button, IconButton } from "@/components/ui/Button";
import { ColorField } from "@/components/ui/ColorField";
import { Segmented, SelectField, SliderField, SwitchField, TextArea } from "@/components/ui/Field";
import { clampWeight, FONTS, getFont } from "@/lib/fonts/registry";
import { naturalWidth } from "@/lib/text/layout";
import type { TextElement } from "@/lib/model/types";
import { useEditorStore } from "../../store/editorStore";
import { Section } from "../Section";

const WEIGHTS = [
  { value: "300", label: "Light" },
  { value: "400", label: "Regular" },
  { value: "500", label: "Medium" },
  { value: "600", label: "Semibold" },
  { value: "700", label: "Bold" },
  { value: "800", label: "Extra bold" },
  { value: "900", label: "Black" },
];

export function TextProperties({ el }: { el: TextElement }) {
  const update = useEditorStore((s) => s.updateElement);
  const measure = useEditorStore((s) => s.measure);
  const set = (patch: Partial<TextElement>, key?: string) => update<TextElement>(el.id, patch, key ? `${key}:${el.id}` : null);
  const font = getFont(el.fontFamily);
  const [minW, maxW] = font.weights;
  const weights = WEIGHTS.filter((w) => Number(w.value) >= minW && Number(w.value) <= maxW);

  return (
    <>
      <Section title="Text">
        <TextArea label="Content" rows={3} value={el.text} onValueChange={(text) => set({ text }, "text")} hint="Tip: double-click text on the canvas to edit it in place." />
      </Section>
      <Section title="Typography">
        <SelectField
          label="Font"
          value={el.fontFamily}
          onValueChange={(fontFamily) => set({ fontFamily, fontWeight: clampWeight(fontFamily, el.fontWeight) })}
          options={FONTS.map((f) => ({ value: f.id, label: `${f.label}${f.file ? "" : " (device font)"}` }))}
        />
        <div className="grid grid-cols-2 gap-2">
          <SelectField
            label="Weight"
            value={String(el.fontWeight)}
            onValueChange={(w) => set({ fontWeight: Number(w) })}
            options={weights.length ? weights : [{ value: String(minW), label: "Regular" }]}
          />
          <SliderField label="Size" min={6} max={400} value={Math.round(el.fontSize)} onValueChange={(fontSize) => set({ fontSize }, "font-size")} format={(v) => `${v}px`} />
        </div>
        <ColorField label="Color" value={el.color} onValueChange={(color) => set({ color }, "text-color")} />
        <div className="flex items-end gap-2">
          <Segmented
            className="flex-1"
            label="Alignment"
            size="sm"
            value={el.align}
            onValueChange={(align) => set({ align })}
            options={[
              { value: "left", label: <AlignLeft className="size-4" aria-label="Left" /> },
              { value: "center", label: <AlignCenter className="size-4" aria-label="Center" /> },
              { value: "right", label: <AlignRight className="size-4" aria-label="Right" /> },
            ]}
          />
          <div className="flex gap-0.5 rounded-xl bg-paper-2 p-1">
            <IconButton label="Italic" size="sm" active={el.italic} onClick={() => set({ italic: !el.italic })}>
              <Italic className="size-4" />
            </IconButton>
            <IconButton label="Uppercase" size="sm" active={el.uppercase} onClick={() => set({ uppercase: !el.uppercase })}>
              <CaseUpper className="size-4" />
            </IconButton>
          </div>
        </div>
        <SliderField label="Letter spacing" min={-0.1} max={0.5} step={0.01} value={el.letterSpacing} onValueChange={(letterSpacing) => set({ letterSpacing }, "tracking")} format={(v) => `${Math.round(v * 100)}%`} />
        <SliderField label="Line height" min={0.8} max={2.5} step={0.05} value={el.lineHeight} onValueChange={(lineHeight) => set({ lineHeight }, "leading")} format={(v) => v.toFixed(2)} />
        <Button size="sm" variant="secondary" onClick={() => set({ width: naturalWidth(el, measure) })}>
          <MoveHorizontal className="size-4" aria-hidden="true" />
          Fit box to text
        </Button>
      </Section>
      <Section title="Background & border" defaultOpen={el.background !== null || el.borderWidth > 0}>
        <SwitchField
          label="Background"
          checked={el.background !== null}
          onCheckedChange={(on) => set({ background: on ? "#ffffff" : null, padding: on && el.padding === 0 ? Math.round(el.fontSize * 0.4) : el.padding })}
        />
        {el.background !== null && <ColorField label="Background color" value={el.background} onValueChange={(background) => set({ background }, "text-bg")} />}
        <SwitchField
          label="Border"
          checked={el.borderColor !== null && el.borderWidth > 0}
          onCheckedChange={(on) => set(on ? { borderColor: el.borderColor ?? "#16130f", borderWidth: el.borderWidth || 2, padding: el.padding || Math.round(el.fontSize * 0.4) } : { borderColor: null, borderWidth: 0 })}
        />
        {el.borderColor !== null && el.borderWidth > 0 && (
          <div className="grid grid-cols-2 items-end gap-2">
            <ColorField label="Border color" value={el.borderColor} onValueChange={(borderColor) => set({ borderColor }, "text-border")} />
            <SliderField label="Width" min={0.5} max={24} step={0.5} value={el.borderWidth} onValueChange={(borderWidth) => set({ borderWidth }, "border-w")} format={(v) => `${v}px`} />
          </div>
        )}
        <SliderField label="Padding" min={0} max={80} value={el.padding} onValueChange={(padding) => set({ padding }, "padding")} format={(v) => `${v}px`} />
        <SliderField label="Corner radius" min={0} max={120} value={el.cornerRadius} onValueChange={(cornerRadius) => set({ cornerRadius }, "radius")} format={(v) => `${v}px`} />
      </Section>
    </>
  );
}
