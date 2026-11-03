"use client";

import { createElement } from "react";
import { createShapeElement } from "@/lib/model/factory";
import { NO_PAINT, solid } from "@/lib/model/paint";
import type { ShapeElement, ShapeKind } from "@/lib/model/types";
import { approximateMeasure } from "@/lib/text/layout";
import { ElementBody } from "@/render/elements";
import { PanelHeading } from "../Section";
import { centeredBox, insertElements } from "./insert";

interface ShapeOption {
  id: string;
  label: string;
  shape: ShapeKind;
  aspect?: number;
  patch?: Partial<ShapeElement>;
}

const SHAPES: ShapeOption[] = [
  { id: "rect", label: "Rectangle", shape: "rect" },
  { id: "rounded", label: "Rounded", shape: "rect", patch: { cornerRadius: 28 } },
  { id: "pill", label: "Pill", shape: "rect", aspect: 2.6, patch: { cornerRadius: 999 } },
  { id: "ellipse", label: "Circle", shape: "ellipse" },
  { id: "triangle", label: "Triangle", shape: "triangle" },
  { id: "hexagon", label: "Hexagon", shape: "polygon", patch: { sides: 6 } },
  { id: "star", label: "Star", shape: "star", patch: { sides: 5, innerRatio: 0.45 } },
  { id: "burst", label: "Burst", shape: "star", patch: { sides: 14, innerRatio: 0.78 } },
  { id: "heart", label: "Heart", shape: "heart" },
];

const LINES: ShapeOption[] = [
  { id: "line", label: "Line", shape: "line", aspect: 10 },
  { id: "dashed", label: "Dashed", shape: "line", aspect: 10, patch: { strokeStyle: "dashed" } },
  {
    id: "dotted",
    label: "Dotted",
    shape: "line",
    aspect: 10,
    patch: { strokeStyle: "dotted", strokeWidth: 6 },
  },
  { id: "arrow", label: "Arrow", shape: "arrow", aspect: 6 },
];

const FRAMES: ShapeOption[] = [
  {
    id: "frame",
    label: "Frame",
    shape: "rect",
    patch: { fill: NO_PAINT, stroke: "#16130f", strokeWidth: 6, cornerRadius: 16 },
  },
  {
    id: "frame-dashed",
    label: "Cut line",
    shape: "rect",
    patch: {
      fill: NO_PAINT,
      stroke: "#16130f",
      strokeWidth: 3,
      strokeStyle: "dashed",
      cornerRadius: 20,
    },
  },
  {
    id: "ring",
    label: "Ring",
    shape: "ellipse",
    patch: { fill: NO_PAINT, stroke: "#ff5a1f", strokeWidth: 10 },
  },
  {
    id: "card",
    label: "Card",
    shape: "rect",
    aspect: 0.8,
    patch: { fill: solid("#ffffff"), stroke: "#e2dccf", strokeWidth: 2, cornerRadius: 24 },
  },
];

function build(option: ShapeOption, fraction: number) {
  const box = centeredBox(fraction, option.aspect ?? 1);
  const isLine = option.shape === "line" || option.shape === "arrow";
  const height = isLine ? Math.max(16, box.height) : box.height;
  return createShapeElement(
    option.shape,
    { ...box, height, y: isLine ? box.y + (box.height - height) / 2 : box.y },
    option.patch,
  );
}

function Preview({ option }: { option: ShapeOption }) {
  const aspect = option.aspect ?? 1;
  const w = 56;
  const h = Math.max(option.shape === "line" || option.shape === "arrow" ? 14 : 8, w / aspect);
  const el = createShapeElement(
    option.shape,
    { x: 0, y: 0, width: w, height: h },
    {
      ...option.patch,
      cornerRadius: Math.min(option.patch?.cornerRadius ?? 0, 999) * (w / 200),
      strokeWidth:
        (option.patch?.strokeWidth ??
          (option.shape === "line" || option.shape === "arrow" ? 4 : 0)) * 0.6,
    },
  );
  return (
    <svg viewBox={`-4 -4 ${w + 8} ${h + 8}`} className="h-12 w-14" aria-hidden="true">
      {createElement(ElementBody, {
        el: { ...el, id: `prev-${option.id}` },
        ctx: { resolveAsset: () => null, measure: approximateMeasure, idPrefix: "shp" },
      })}
    </svg>
  );
}

function Grid({
  title,
  options,
  fraction,
}: {
  title: string;
  options: ShapeOption[];
  fraction: number;
}) {
  return (
    <>
      <h3 className="text-ink-3 px-4 pt-4 pb-2 font-mono text-[10.5px] font-semibold tracking-[0.14em] uppercase">
        {title}
      </h3>
      <div className="grid grid-cols-3 gap-2 px-4">
        {options.map((o) => (
          <button
            key={o.id}
            type="button"
            onClick={() => insertElements([build(o, fraction)])}
            className="border-line bg-card text-ink-2 hover:border-ink hover:text-ink flex flex-col items-center gap-1 rounded-xl border px-1 pt-2 pb-1.5 text-[11.5px] font-medium transition-colors"
          >
            <Preview option={o} />
            {o.label}
          </button>
        ))}
      </div>
    </>
  );
}

export function ShapesPanel() {
  return (
    <div className="pb-6">
      <PanelHeading
        title="Shapes & lines"
        subtitle="Build frames, badges and dividers around your code."
      />
      <Grid title="Shapes" options={SHAPES} fraction={0.35} />
      <Grid title="Lines" options={LINES} fraction={0.5} />
      <Grid title="Frames & borders" options={FRAMES} fraction={0.7} />
    </div>
  );
}
