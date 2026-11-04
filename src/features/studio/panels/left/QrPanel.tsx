"use client";

import { ArrowRight, Sparkles } from "lucide-react";
import { createQrElement } from "@/lib/model/factory";
import { QR_TYPE_LABELS, QR_TYPES, type QrType } from "@/lib/qr/content";
import { encodePayload } from "@/lib/qr/payloads";
import { sampleContent } from "@/lib/qr/samples";
import { QR_TYPE_ICONS } from "@/features/qr-editor/TypePicker";
import { currentContent, useGeneratorStore } from "@/features/generator/generatorStore";
import { QrSvg } from "@/render/QrGraphic";
import { PanelHeading } from "../Section";
import { centeredBox, insertElements } from "./insert";

export function QrPanel() {
  const gen = useGeneratorStore();
  const genContent = currentContent(gen);
  const genEncoded = encodePayload(genContent);
  const genPayload = genEncoded.ok ? genEncoded.payload : null;
  const genReady = genPayload !== null;

  const add = (type: QrType) => {
    const box = centeredBox(0.4);
    insertElements([
      createQrElement({ x: box.x, y: box.y, width: box.width }, sampleContent(type)),
    ]);
  };
  const addFromGenerator = () => {
    const box = centeredBox(0.4);
    insertElements([
      createQrElement(
        { x: box.x, y: box.y, width: box.width },
        structuredClone(genContent),
        gen.style,
      ),
    ]);
  };

  return (
    <div>
      <PanelHeading
        title="QR codes"
        subtitle="Add a code, then edit its content and style on the right."
      />
      <div className="grid gap-4 px-4 pb-6">
        {genReady && (
          <button
            type="button"
            onClick={addFromGenerator}
            className="group border-accent bg-accent-soft text-ink flex items-center gap-3 rounded-2xl border p-3 text-left transition-transform hover:-translate-y-0.5"
          >
            <span className="bg-paper rounded-lg p-1">
              <QrSvg payload={genPayload} style={gen.style} size={44} idPrefix="from-gen" />
            </span>
            <span className="min-w-0 flex-1">
              <span className="text-accent flex items-center gap-1 text-[11px] font-semibold tracking-wide uppercase">
                <Sparkles className="size-3" aria-hidden="true" /> From the generator
              </span>
              <span className="block truncate text-sm font-semibold">
                Use the {QR_TYPE_LABELS[genContent.type]} code you made
              </span>
            </span>
            <ArrowRight
              className="size-4 shrink-0 transition-transform group-hover:translate-x-0.5"
              aria-hidden="true"
            />
          </button>
        )}
        <div className="grid grid-cols-2 gap-2">
          {QR_TYPES.map((type) => {
            const Icon = QR_TYPE_ICONS[type];
            return (
              <button
                key={type}
                type="button"
                onClick={() => add(type)}
                className="border-line bg-card text-ink hover:border-ink flex items-center gap-2.5 rounded-xl border px-3 py-2.5 text-left text-[13px] font-semibold transition-colors"
              >
                <Icon className="text-accent-ink size-4" aria-hidden="true" />
                {QR_TYPE_LABELS[type]}
              </button>
            );
          })}
        </div>
        <p className="text-ink-3 text-[12px] leading-relaxed">
          Codes are static: the content is stored in the pattern itself. No redirects, no tracking,
          no expiry.
        </p>
      </div>
    </div>
  );
}
