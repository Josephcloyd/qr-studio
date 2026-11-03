"use client";

import { Search } from "lucide-react";
import { useState } from "react";
import { createIconElement, createShapeElement, createTextElement } from "@/lib/model/factory";
import { solid } from "@/lib/model/paint";
import type { DesignElement } from "@/lib/model/types";
import { ICONS } from "@/render/icons";
import { useEditorStore } from "../../store/editorStore";
import { PanelHeading } from "../Section";
import { centeredBox, insertElements } from "./insert";

interface Combo {
  id: string;
  label: string;
  build: (w: number, h: number, s: number) => DesignElement[];
}

/** Ready-made decorations, added as separate editable elements. */
const COMBOS: Combo[] = [
  {
    id: "scan-pill",
    label: "Scan me pill",
    build: (w, h, s) => {
      const width = 190 * s;
      return [
        createTextElement("Scan me", { x: (w - width) / 2, y: h * 0.82, width }, "label", {
          align: "center",
          fontSize: 20 * s,
          color: "#ffffff",
          background: "#16130f",
          padding: 12 * s,
          cornerRadius: 999,
          letterSpacing: 0.18,
        }),
      ];
    },
  },
  {
    id: "point",
    label: "Point at code",
    build: (w, h, s) => {
      const icon = createIconElement(
        "arrow-down",
        { x: w / 2 - 22 * s, y: h * 0.06, width: 44 * s },
        "#ff5a1f",
      );
      const label = createTextElement(
        "Point your camera here",
        { x: w * 0.15, y: h * 0.06 - 30 * s, width: w * 0.7 },
        "label",
        { align: "center", fontSize: 13 * s, letterSpacing: 0.16 },
      );
      return [label, { ...icon, height: 44 * s, strokeWidth: 2.5 }];
    },
  },
  {
    id: "wifi-badge",
    label: "Wi-Fi badge",
    build: (w, h, s) => {
      const size = 64 * s;
      const circle = createShapeElement(
        "ellipse",
        { x: w * 0.08, y: h * 0.08, width: size, height: size },
        { fill: solid("#16130f") },
      );
      const icon = createIconElement(
        "wifi",
        { x: w * 0.08 + size * 0.22, y: h * 0.08 + size * 0.22, width: size * 0.56 },
        "#ffffff",
      );
      return [circle, { ...icon, height: size * 0.56 }];
    },
  },
  {
    id: "sticker",
    label: "Starburst sticker",
    build: (w, h, s) => {
      const size = 120 * s;
      const burst = createShapeElement(
        "star",
        { x: w * 0.72 - size / 2, y: h * 0.12, width: size, height: size },
        { fill: solid("#ff5a1f"), sides: 16, innerRatio: 0.8 },
      );
      const text = createTextElement(
        "NEW!",
        { x: w * 0.72 - size / 2, y: h * 0.12 + size * 0.36, width: size },
        "label",
        {
          align: "center",
          fontFamily: "bebas-neue",
          fontSize: 34 * s,
          letterSpacing: 0.04,
          uppercase: true,
        },
      );
      return [burst, text].map((e) => ({ ...e, rotation: -12 }));
    },
  },
];

export function ElementsPanel() {
  const [query, setQuery] = useState("");
  const doc = useEditorStore((s) => s.doc);
  const q = query.trim().toLowerCase();
  const icons = q
    ? ICONS.filter((i) => i.label.toLowerCase().includes(q) || i.group.toLowerCase().includes(q))
    : ICONS;
  const groups = [...new Set(icons.map((i) => i.group))];
  const s = Math.min(doc.width, doc.height) / 384;

  const addIcon = (id: string, label: string) => {
    const box = centeredBox(0.18);
    insertElements([{ ...createIconElement(id, box), name: label, height: box.width }]);
  };

  return (
    <div className="pb-6">
      <PanelHeading title="Elements" subtitle="Icons and ready-made decorations." />
      <h3 className="text-ink-3 px-4 pt-1 pb-2 font-mono text-[10.5px] font-semibold tracking-[0.14em] uppercase">
        Ready-made
      </h3>
      <div className="grid grid-cols-2 gap-2 px-4">
        {COMBOS.map((c) => (
          <button
            key={c.id}
            type="button"
            onClick={() => insertElements(c.build(doc.width, doc.height, s))}
            className="border-line bg-card text-ink hover:border-ink rounded-xl border px-3 py-3 text-left text-[12.5px] font-semibold"
          >
            {c.label}
          </button>
        ))}
      </div>
      <div className="px-4 pt-5 pb-2">
        <label className="relative block">
          <span className="sr-only">Search icons</span>
          <Search
            className="text-ink-3 absolute top-1/2 left-3 size-4 -translate-y-1/2"
            aria-hidden="true"
          />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search icons"
            className="border-line-strong bg-card focus:border-ink h-10 w-full rounded-xl border pr-3 pl-9 text-sm focus:outline-none"
          />
        </label>
      </div>
      {groups.map((g) => (
        <div key={g}>
          <h3 className="text-ink-3 px-4 pt-3 pb-1.5 font-mono text-[10.5px] font-semibold tracking-[0.14em] uppercase">
            {g}
          </h3>
          <div className="grid grid-cols-6 gap-1 px-3">
            {icons
              .filter((i) => i.group === g)
              .map((i) => (
                <button
                  key={i.id}
                  type="button"
                  aria-label={`Add ${i.label} icon`}
                  title={i.label}
                  onClick={() => addIcon(i.id, i.label)}
                  className="text-ink-2 hover:bg-ink hover:text-paper flex aspect-square items-center justify-center rounded-lg transition-colors"
                >
                  <i.Icon className="size-5" aria-hidden="true" />
                </button>
              ))}
          </div>
        </div>
      ))}
      {icons.length === 0 && (
        <p className="text-ink-3 px-4 py-6 text-center text-[13px]">No icons match “{query}”.</p>
      )}
    </div>
  );
}
