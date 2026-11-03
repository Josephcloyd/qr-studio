import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import jsQR from "jsqr";
import { boundsOf } from "@/lib/geometry/transform";
import { documentSchema } from "@/lib/model/schema";
import { DEFAULT_QR_STYLE } from "@/lib/qr/style";
import { encodePayload } from "@/lib/qr/payloads";
import { approximateMeasure } from "@/lib/text/layout";
import type { QrElement } from "@/lib/model/types";
import { DocumentSvg } from "@/render/DocumentSvg";
import { TEMPLATES, TEMPLATE_CATEGORIES } from "@/features/templates";
import { STYLE_PRESETS } from "@/features/generator/StylePresets";
import { decodeSvg, rasterize, renderQrMarkup } from "../helpers/decode";

describe("templates", () => {
  it("has 20 templates, 4 per category, with unique ids", () => {
    expect(TEMPLATES).toHaveLength(20);
    for (const c of TEMPLATE_CATEGORIES)
      expect(TEMPLATES.filter((t) => t.category === c)).toHaveLength(4);
    expect(new Set(TEMPLATES.map((t) => t.id)).size).toBe(20);
  });

  it.each(TEMPLATES.map((t) => [t.id, t] as const))(
    "%s builds a valid, editable document",
    (_, t) => {
      const doc = t.build();
      expect(documentSchema.safeParse(doc).success).toBe(true);
      expect(doc.elements.every((e) => !e.locked)).toBe(true);
      // Fresh ids on every build so two copies never collide.
      expect(t.build().elements[0].id).not.toBe(doc.elements[0].id);
    },
  );

  it.each(TEMPLATES.map((t) => [t.id, t] as const))(
    "%s: every QR code scans in the full composition",
    (_, t) => {
      const doc = t.build();
      const svg = renderToStaticMarkup(
        createElement(DocumentSvg, {
          doc,
          resolveAsset: () => null,
          measure: approximateMeasure,
          idPrefix: "t",
          mode: "export",
        }),
      );
      const width = 1600;
      const { pixels, width: w, height: h } = rasterize(svg, width);
      const scale = w / doc.width;
      const qrs = doc.elements.filter((e): e is QrElement => e.type === "qr");
      expect(qrs.length).toBeGreaterThan(0);
      for (const q of qrs) {
        const encoded = encodePayload(q.content);
        expect(encoded.ok, `${q.name} content valid`).toBe(true);
        const b = boundsOf(q);
        const pad = q.width * 0.1;
        const x0 = Math.max(0, Math.floor((b.minX - pad) * scale));
        const y0 = Math.max(0, Math.floor((b.minY - pad) * scale));
        const x1 = Math.min(w, Math.ceil((b.maxX + pad) * scale));
        const y1 = Math.min(h, Math.ceil((b.maxY + pad) * scale));
        const cw = x1 - x0;
        const ch = y1 - y0;
        const crop = new Uint8ClampedArray(cw * ch * 4);
        for (let row = 0; row < ch; row++) {
          crop.set(
            pixels.subarray(((y0 + row) * w + x0) * 4, ((y0 + row) * w + x1) * 4),
            row * cw * 4,
          );
        }
        const result = jsQR(crop, cw, ch, { inversionAttempts: "attemptBoth" });
        expect(result?.data, `${t.id} / ${q.name}`).toBe(encoded.ok ? encoded.payload : "");
      }
    },
  );
});

describe("generator style presets", () => {
  it.each(STYLE_PRESETS.map((p) => [p.id, p] as const))("%s decodes", (_, p) => {
    const svg = renderQrMarkup("https://getlaunch.ph/qr-studio", {
      ...DEFAULT_QR_STYLE,
      ...p.style,
    });
    expect(decodeSvg(svg)).toBe("https://getlaunch.ph/qr-studio");
  });
});
