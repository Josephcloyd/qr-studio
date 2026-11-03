"use client";

import { createTextElement, type TextPreset } from "@/lib/model/factory";
import type { TextElement } from "@/lib/model/types";
import { useEditorStore } from "../../store/editorStore";
import { PanelHeading } from "../Section";
import { insertElements } from "./insert";

const CTA_PHRASES = [
  "Scan me",
  "Connect to Wi-Fi",
  "View our menu",
  "Visit our website",
  "Follow us",
  "Contact us",
  "Scan to order",
  "Leave a review",
  "RSVP here",
  "Get directions",
  "Scan to pay",
  "Save my contact",
];

const PILL: Partial<TextElement> = {
  fontFamily: "inter",
  fontSize: 22,
  fontWeight: 700,
  uppercase: true,
  letterSpacing: 0.14,
  align: "center",
  color: "#ffffff",
  background: "#16130f",
  padding: 14,
  cornerRadius: 999,
};

export function TextPanel() {
  const doc = useEditorStore((s) => s.doc);
  const scale = Math.min(doc.width, doc.height) / 384;

  const add = (
    text: string,
    preset: TextPreset,
    patch: Partial<TextElement> = {},
    widthFraction = 0.7,
  ) => {
    const width = doc.width * widthFraction;
    const el = createTextElement(
      text,
      { x: (doc.width - width) / 2, y: doc.height * 0.4, width },
      preset,
      {
        align: "center",
        ...patch,
      },
    );
    // Presets are designed for a ~4in artboard; scale them to the current one.
    insertElements([
      {
        ...el,
        fontSize: el.fontSize * scale,
        padding: el.padding * scale,
        cornerRadius: Math.min(el.cornerRadius * scale, 999),
      },
    ]);
  };

  return (
    <div>
      <PanelHeading
        title="Text"
        subtitle="Click to add. Double-click text on the canvas to edit it."
      />
      <div className="grid gap-2 px-4">
        <button
          type="button"
          onClick={() => add("Add a heading", "heading", { fontSize: 44 })}
          className="border-line bg-card font-display text-ink hover:border-ink rounded-2xl border px-4 py-3 text-left text-[26px] leading-tight font-bold"
        >
          Add a heading
        </button>
        <button
          type="button"
          onClick={() => add("Add a subheading", "subheading", { fontSize: 24 })}
          className="border-line bg-card text-ink hover:border-ink rounded-2xl border px-4 py-2.5 text-left text-[17px] font-semibold"
        >
          Add a subheading
        </button>
        <button
          type="button"
          onClick={() =>
            add(
              "Add a little bit of body text to explain what people get when they scan.",
              "body",
              { fontSize: 16 },
            )
          }
          className="border-line bg-card text-ink-2 hover:border-ink rounded-2xl border px-4 py-2.5 text-left text-[13px]"
        >
          Add body text
        </button>
      </div>
      <h3 className="text-ink-3 px-4 pt-6 pb-2 font-mono text-[10.5px] font-semibold tracking-[0.14em] uppercase">
        Calls to action
      </h3>
      <div className="flex flex-wrap gap-2 px-4 pb-6">
        {CTA_PHRASES.map((phrase, i) => {
          const style =
            i % 3 === 0
              ? PILL
              : i % 3 === 1
                ? { ...PILL, background: "#ff5a1f", color: "#16130f" }
                : {
                    ...PILL,
                    background: null,
                    color: "#16130f",
                    borderColor: "#16130f",
                    borderWidth: 2,
                  };
          return (
            <button
              key={phrase}
              type="button"
              onClick={() => add(phrase, "label", style, 0.6)}
              className="rounded-full px-3.5 py-2 text-[11.5px] font-bold tracking-[0.12em] uppercase transition-transform hover:-translate-y-0.5"
              style={{
                background: style.background ?? "transparent",
                color: style.color,
                border: style.borderWidth ? `2px solid ${style.borderColor}` : undefined,
              }}
            >
              {phrase}
            </button>
          );
        })}
      </div>
    </div>
  );
}
