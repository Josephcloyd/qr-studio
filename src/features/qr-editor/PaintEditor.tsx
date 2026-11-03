"use client";

import { ColorField } from "@/components/ui/ColorField";
import { Segmented, SliderField } from "@/components/ui/Field";
import { convertPaint, type Paint, type PaintKind } from "@/lib/model/paint";

interface PaintEditorProps {
  label: string;
  value: Paint;
  onChange: (paint: Paint) => void;
  allowNone?: boolean;
  noneLabel?: string;
  allowGradient?: boolean;
}

export function PaintEditor({
  label,
  value,
  onChange,
  allowNone = false,
  noneLabel = "None",
  allowGradient = true,
}: PaintEditorProps) {
  const kinds: { value: PaintKind; label: string }[] = [
    { value: "solid", label: "Solid" },
    ...(allowGradient
      ? ([
          { value: "linear", label: "Linear" },
          { value: "radial", label: "Radial" },
        ] as const)
      : []),
    ...(allowNone ? [{ value: "none" as const, label: noneLabel }] : []),
  ];
  const setStop = (index: number, color: string) => {
    if (value.kind !== "linear" && value.kind !== "radial") return;
    onChange({ ...value, stops: value.stops.map((s, i) => (i === index ? { ...s, color } : s)) });
  };

  return (
    <div className="grid gap-3">
      <Segmented
        label={label}
        size="sm"
        value={value.kind}
        options={kinds}
        onValueChange={(k) => onChange(convertPaint(value, k))}
      />
      {value.kind === "solid" && (
        <ColorField
          label={`${label} color`}
          hideLabel
          value={value.color}
          onValueChange={(color) => onChange({ kind: "solid", color })}
        />
      )}
      {(value.kind === "linear" || value.kind === "radial") && (
        <>
          <div className="grid grid-cols-2 gap-2">
            <ColorField
              label="From"
              value={value.stops[0].color}
              onValueChange={(c) => setStop(0, c)}
            />
            <ColorField
              label="To"
              value={value.stops[value.stops.length - 1].color}
              onValueChange={(c) => setStop(value.stops.length - 1, c)}
            />
          </div>
          {value.kind === "linear" && (
            <SliderField
              label="Angle"
              min={0}
              max={360}
              step={5}
              value={value.angle}
              onValueChange={(angle) => onChange({ ...value, angle })}
              format={(v) => `${v}°`}
            />
          )}
        </>
      )}
    </div>
  );
}
