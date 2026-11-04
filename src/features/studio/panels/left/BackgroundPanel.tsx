"use client";

import { cn } from "@/components/ui/cn";
import { ColorField } from "@/components/ui/ColorField";
import { linear, NO_PAINT, radial, solid, type Paint } from "@/lib/model/paint";
import { BACKGROUND_PATTERNS, type BackgroundPattern } from "@/lib/model/types";
import { useAssetStore } from "@/features/assets/assetStore";
import { useEditorStore } from "../../store/editorStore";
import { PanelHeading } from "../Section";

const SOLIDS = [
  "#ffffff",
  "#f6f3ec",
  "#fff4ec",
  "#f1f6ef",
  "#eef2ff",
  "#fdf2f8",
  "#16130f",
  "#1d3557",
  "#1c4d36",
  "#7a1f5c",
  "#ff5a1f",
  "#e9c46a",
];
const GRADIENTS: Paint[] = [
  linear(160, "#fff4ec", "#ffd9c2"),
  linear(135, "#f6f3ec", "#e7e1d4"),
  linear(180, "#eef2ff", "#c7d0ff"),
  linear(135, "#16130f", "#3d3428"),
  linear(135, "#7a1f5c", "#d1450f"),
  linear(160, "#1c4d36", "#2a9d8f"),
  radial("#fffdf8", "#efe6d2"),
  radial("#2b3bff", "#0b1033"),
];

function paintCss(p: Paint): string {
  if (p.kind === "solid") return p.color;
  if (p.kind === "linear")
    return `linear-gradient(${p.angle + 90}deg, ${p.stops.map((s) => `${s.color} ${s.offset * 100}%`).join(", ")})`;
  if (p.kind === "radial")
    return `radial-gradient(circle, ${p.stops.map((s) => `${s.color} ${s.offset * 100}%`).join(", ")})`;
  return "transparent";
}

export function BackgroundPanel() {
  const bg = useEditorStore((s) => s.doc.background);
  const apply = useEditorStore((s) => s.apply);
  const assets = useAssetStore((s) => s.assets);
  const order = useAssetStore((s) => s.order);
  const setBg = (patch: Partial<typeof bg>, key?: string) =>
    apply((d) => ({ ...d, background: { ...d.background, ...patch } }), key ?? null);
  const same = (p: Paint) => JSON.stringify(p) === JSON.stringify(bg.paint);

  return (
    <div className="pb-6">
      <PanelHeading title="Background" subtitle="Colors, gradients, patterns or an image." />
      <div className="grid gap-5 px-4">
        <div className="grid grid-cols-6 gap-2" role="list" aria-label="Solid colors">
          <button
            type="button"
            role="listitem"
            aria-label="Transparent"
            onClick={() => setBg({ paint: NO_PAINT })}
            className={cn(
              "checkerboard border-line-strong aspect-square rounded-xl border",
              bg.paint.kind === "none" && "ring-cobalt ring-2 ring-offset-2",
            )}
          />
          {SOLIDS.map((c) => (
            <button
              key={c}
              type="button"
              role="listitem"
              aria-label={`Background ${c}`}
              onClick={() => setBg({ paint: solid(c) })}
              className={cn(
                "border-ink/10 aspect-square rounded-xl border transition-transform hover:scale-105",
                same(solid(c)) && "ring-cobalt ring-2 ring-offset-2",
              )}
              style={{ background: c }}
            />
          ))}
        </div>
        <ColorField
          label="Custom color"
          value={bg.paint.kind === "solid" ? bg.paint.color : "#ffffff"}
          onValueChange={(c) => setBg({ paint: solid(c) }, "bg-solid")}
        />
        <div>
          <h3 className="text-ink-3 mb-2 font-mono text-[10.5px] font-semibold tracking-[0.14em] uppercase">
            Gradients
          </h3>
          <div className="grid grid-cols-4 gap-2">
            {GRADIENTS.map((g, i) => (
              <button
                key={i}
                type="button"
                aria-label={`Gradient ${i + 1}`}
                onClick={() => setBg({ paint: g })}
                className={cn(
                  "border-ink/10 aspect-square rounded-xl border transition-transform hover:scale-105",
                  same(g) && "ring-cobalt ring-2 ring-offset-2",
                )}
                style={{ background: paintCss(g) }}
              />
            ))}
          </div>
        </div>
        <div>
          <h3 className="text-ink-3 mb-2 font-mono text-[10.5px] font-semibold tracking-[0.14em] uppercase">
            Patterns
          </h3>
          <div className="grid grid-cols-5 gap-2">
            {BACKGROUND_PATTERNS.map((p: BackgroundPattern) => (
              <button
                key={p}
                type="button"
                onClick={() => setBg({ pattern: p })}
                className={cn(
                  "bg-card flex aspect-square items-center justify-center rounded-xl border text-[10.5px] font-semibold capitalize",
                  bg.pattern === p
                    ? "border-ink text-ink"
                    : "border-line text-ink-3 hover:border-ink-3",
                )}
              >
                {p}
              </button>
            ))}
          </div>
        </div>
        <div>
          <h3 className="text-ink-3 mb-2 font-mono text-[10.5px] font-semibold tracking-[0.14em] uppercase">
            Image
          </h3>
          {order.length ? (
            <div className="grid grid-cols-3 gap-2">
              {order.map((id) => (
                <button
                  key={id}
                  type="button"
                  aria-label={`Use ${assets[id]?.name} as background`}
                  onClick={() => setBg({ imageAssetId: bg.imageAssetId === id ? null : id })}
                  className={cn(
                    "checkerboard aspect-square overflow-hidden rounded-xl border",
                    bg.imageAssetId === id
                      ? "border-ink ring-cobalt ring-2 ring-offset-1"
                      : "border-line",
                  )}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element -- local object URL */}
                  <img src={assets[id]?.url} alt="" className="size-full object-cover" />
                </button>
              ))}
            </div>
          ) : (
            <p className="text-ink-3 text-[12.5px]">
              Add images in the Images tab to use them as a background.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
