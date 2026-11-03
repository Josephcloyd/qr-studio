"use client";

import { cn } from "@/components/ui/cn";
import { linear, radial, solid } from "@/lib/model/paint";
import type { QrStyle } from "@/lib/qr/style";
import { QrSvg } from "@/render/QrGraphic";

export interface StylePreset {
  id: string;
  label: string;
  style: Omit<QrStyle, "logo" | "ecLevel" | "margin">;
}

/** Curated looks. Every combination here is covered by the decode tests' allowed pairings. */
export const STYLE_PRESETS: StylePreset[] = [
  {
    id: "classic",
    label: "Classic",
    style: {
      dotStyle: "square",
      finderFrame: "square",
      finderDot: "square",
      foreground: solid("#111111"),
      finderFrameColor: null,
      finderDotColor: null,
      background: solid("#ffffff"),
    },
  },
  {
    id: "ink",
    label: "Ink",
    style: {
      dotStyle: "rounded",
      finderFrame: "rounded",
      finderDot: "rounded",
      foreground: solid("#16130f"),
      finderFrameColor: null,
      finderDotColor: "#ff5a1f",
      background: solid("#f6f3ec"),
    },
  },
  {
    id: "vermilion",
    label: "Vermilion",
    style: {
      dotStyle: "fluid",
      finderFrame: "rounded",
      finderDot: "circle",
      foreground: solid("#b8360a"),
      finderFrameColor: "#16130f",
      finderDotColor: "#16130f",
      background: solid("#fff4ec"),
    },
  },
  {
    id: "cobalt",
    label: "Cobalt dots",
    style: {
      dotStyle: "dots",
      finderFrame: "circle",
      finderDot: "circle",
      foreground: solid("#1f2bd1"),
      finderFrameColor: null,
      finderDotColor: null,
      background: solid("#ffffff"),
    },
  },
  {
    id: "forest",
    label: "Forest",
    style: {
      dotStyle: "classy",
      finderFrame: "leaf",
      finderDot: "leaf",
      foreground: solid("#1c4d36"),
      finderFrameColor: null,
      finderDotColor: null,
      background: solid("#f1f6ef"),
    },
  },
  {
    id: "sunset",
    label: "Sunset",
    style: {
      dotStyle: "fluid",
      finderFrame: "rounded",
      finderDot: "rounded",
      foreground: linear(135, "#7a1f5c", "#d1450f"),
      finderFrameColor: null,
      finderDotColor: null,
      background: solid("#fffaf3"),
    },
  },
  {
    id: "ocean",
    label: "Ocean",
    style: {
      dotStyle: "rounded",
      finderFrame: "circle",
      finderDot: "rounded",
      foreground: radial("#062b4f", "#0b6e8a"),
      finderFrameColor: null,
      finderDotColor: null,
      background: solid("#f2f8fb"),
    },
  },
  {
    id: "plum",
    label: "Plum",
    style: {
      dotStyle: "diamond",
      finderFrame: "rounded",
      finderDot: "leaf",
      foreground: solid("#4a1d6b"),
      finderFrameColor: null,
      finderDotColor: null,
      background: solid("#faf5ff"),
    },
  },
  {
    id: "gold",
    label: "Gilded",
    style: {
      dotStyle: "classy",
      finderFrame: "leaf",
      finderDot: "circle",
      foreground: linear(90, "#3d2b0f", "#7a5714"),
      finderFrameColor: null,
      finderDotColor: null,
      background: solid("#fdf8ec"),
    },
  },
  {
    id: "mono-air",
    label: "Airy",
    style: {
      dotStyle: "dots",
      finderFrame: "rounded",
      finderDot: "circle",
      foreground: solid("#2b2620"),
      finderFrameColor: null,
      finderDotColor: null,
      background: solid("#ffffff"),
    },
  },
];

export function StylePresets({
  style,
  onChange,
}: {
  style: QrStyle;
  onChange: (style: QrStyle) => void;
}) {
  const matches = (p: StylePreset) =>
    p.style.dotStyle === style.dotStyle &&
    p.style.finderFrame === style.finderFrame &&
    JSON.stringify(p.style.foreground) === JSON.stringify(style.foreground) &&
    JSON.stringify(p.style.background) === JSON.stringify(style.background);
  return (
    <div
      role="radiogroup"
      aria-label="Preset looks"
      className="grid grid-cols-5 gap-1.5 sm:gap-2.5"
    >
      {STYLE_PRESETS.map((p) => {
        const active = matches(p);
        return (
          <button
            key={p.id}
            type="button"
            role="radio"
            aria-checked={active}
            onClick={() => onChange({ ...style, ...p.style })}
            className={cn(
              "group flex min-w-0 flex-col items-center gap-1.5 rounded-xl border p-1 pb-1.5 text-[10.5px] font-semibold transition-all duration-150 sm:gap-2 sm:rounded-2xl sm:p-2 sm:pb-2.5 sm:text-[12px]",
              active
                ? "border-ink bg-card text-ink shadow-[0_0_0_1px_var(--ink)]"
                : "border-line bg-card text-ink-2 hover:border-ink-3 hover:-translate-y-0.5",
            )}
          >
            <QrSvg
              payload="https://getlaunch.ph"
              size={88}
              idPrefix={`preset-${p.id}`}
              style={{ ...style, ...p.style, margin: 2, logo: { ...style.logo, assetId: null } }}
              className="h-auto w-full rounded-xl"
            />
            {p.label}
          </button>
        );
      })}
    </div>
  );
}
