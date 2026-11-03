import { describe, expect, it } from "vitest";
import {
  createDocument,
  createIconElement,
  createImageElement,
  createQrElement,
  createShapeElement,
  createTextElement,
} from "@/lib/model/factory";
import { EMPTY_HISTORY, HISTORY_LIMIT, record, redo, undo } from "@/lib/model/history";
import {
  addElements,
  alignElements,
  distributeElements,
  duplicateElements,
  moveElementTo,
  moveElements,
  referencedAssets,
  removeElements,
  reorderElements,
  resizeDocument,
  selectionBounds,
  updateElement,
} from "@/lib/model/ops";
import { fitTextHeights } from "@/lib/model/textFit";
import { findPreset } from "@/lib/model/presets";
import { formatLength, fromUnits, pixelSize, toUnits } from "@/lib/model/units";
import { approximateMeasure, layoutText, naturalWidth, wrapText } from "@/lib/text/layout";

const docWith = (...elements: Parameters<typeof addElements>[1]) =>
  addElements(createDocument(), elements);

describe("units & presets", () => {
  it("converts between mm, in and px", () => {
    expect(toUnits(1, "in")).toBe(96);
    expect(toUnits(25.4, "mm")).toBeCloseTo(96);
    expect(fromUnits(96, "mm")).toBeCloseTo(25.4);
    expect(fromUnits(96, "px")).toBe(96);
    expect(formatLength(toUnits(210, "mm"), "mm")).toBe("210 mm");
  });
  it("computes export pixel sizes from DPI", () => {
    const a4 = findPreset("a4")!;
    expect(pixelSize(a4.width, a4.height, 300)).toEqual({ width: 2480, height: 3508 });
    const card = findPreset("business-card")!;
    expect(pixelSize(card.width, card.height, 300)).toEqual({ width: 1050, height: 600 });
  });
});

describe("factories", () => {
  it("creates every element type with unique ids", () => {
    const els = [
      createQrElement(),
      createTextElement("Hello", {}, "heading"),
      createImageElement("asset-1"),
      createShapeElement("star"),
      createShapeElement("line"),
      createIconElement("wifi"),
    ];
    expect(new Set(els.map((e) => e.id)).size).toBe(els.length);
    expect(els[0].width).toBe(els[0].height);
  });
});

describe("ops are immutable", () => {
  const a = createShapeElement("rect", { x: 0, y: 0, width: 100, height: 100 });
  const b = createShapeElement("ellipse", { x: 200, y: 0, width: 100, height: 100 });
  const c = createShapeElement("star", { x: 500, y: 0, width: 50, height: 50 });
  const doc = docWith(a, b, c);
  const snapshot = JSON.stringify(doc);

  it("updates and removes without mutating", () => {
    const updated = updateElement(doc, a.id, { x: 50 });
    expect(updated.elements[0].x).toBe(50);
    expect(removeElements(doc, [b.id]).elements).toHaveLength(2);
    expect(JSON.stringify(doc)).toBe(snapshot);
  });
  it("duplicates right above the original", () => {
    const r = duplicateElements(doc, [a.id]);
    expect(r.doc.elements).toHaveLength(4);
    expect(r.doc.elements[1].id).toBe(r.ids[0]);
    expect(r.doc.elements[1].x).toBe(16);
  });
  it("moves but skips locked elements", () => {
    const locked = updateElement(doc, a.id, { locked: true });
    const moved = moveElements(locked, [a.id, b.id], 10, 5);
    expect(moved.elements[0].x).toBe(0);
    expect(moved.elements[1].x).toBe(210);
  });
  it("reorders layers", () => {
    const ids = (d: typeof doc) => d.elements.map((e) => e.id);
    expect(ids(reorderElements(doc, [a.id], "front"))).toEqual([b.id, c.id, a.id]);
    expect(ids(reorderElements(doc, [c.id], "back"))).toEqual([c.id, a.id, b.id]);
    expect(ids(reorderElements(doc, [a.id], "forward"))).toEqual([b.id, a.id, c.id]);
    expect(ids(reorderElements(doc, [c.id], "backward"))).toEqual([a.id, c.id, b.id]);
    expect(ids(reorderElements(doc, [c.id], "forward"))).toEqual([a.id, b.id, c.id]);
    expect(ids(moveElementTo(doc, a.id, 2))).toEqual([b.id, c.id, a.id]);
    expect(reorderElements(doc, [], "front")).toBe(doc);
  });
  it("aligns to canvas and to selection", () => {
    const centered = alignElements(doc, [a.id], "center");
    expect(centered.elements[0].x).toBe((doc.width - 100) / 2);
    const right = alignElements(doc, [a.id, b.id], "right");
    expect(right.elements[0].x).toBe(200);
    const bottom = alignElements(doc, [a.id, c.id], "bottom");
    expect(bottom.elements[2].y).toBe(50);
    expect(selectionBounds(doc, [a.id, b.id])).toEqual({ minX: 0, minY: 0, maxX: 300, maxY: 100 });
  });
  it("distributes evenly", () => {
    const d = distributeElements(doc, [a.id, b.id, c.id], "horizontal");
    // span 0..550, sizes 250 → gap 150
    expect(d.elements[1].x).toBe(250);
    expect(distributeElements(doc, [a.id, b.id], "vertical")).toBe(doc);
  });
  it("resizes the document and optionally scales content", () => {
    const text = createTextElement("Hi", { x: 10, y: 10 }, "body");
    const d = resizeDocument(docWith(a, text), 768, 768, true);
    expect(d.elements[0].width).toBeCloseTo(200);
    expect(d.elements[1].type === "text" && d.elements[1].fontSize).toBeCloseTo(36);
    expect(resizeDocument(doc, 500, 500, false).elements[0]).toBe(a);
  });
  it("collects referenced assets", () => {
    const qr = createQrElement();
    const withLogo = {
      ...qr,
      style: { ...qr.style, logo: { ...qr.style.logo, assetId: "logo-1" } },
    };
    const d = {
      ...docWith(createImageElement("img-1"), withLogo),
      background: { ...createDocument().background, imageAssetId: "bg-1" },
    };
    expect([...referencedAssets(d)].sort()).toEqual(["bg-1", "img-1", "logo-1"]);
  });
});

describe("history", () => {
  const d0 = createDocument();
  const d1 = { ...d0, name: "one" };
  const d2 = { ...d0, name: "two" };
  it("undoes and redoes", () => {
    let h = record(EMPTY_HISTORY, d0, null, 0);
    h = record(h, d1, null, 10_000);
    const u = undo(h, d2)!;
    expect(u.doc).toBe(d1);
    const r = redo(u.history, u.doc)!;
    expect(r.doc).toBe(d2);
    expect(undo(EMPTY_HISTORY, d0)).toBeNull();
    expect(redo(EMPTY_HISTORY, d0)).toBeNull();
  });
  it("coalesces repeated keyed changes", () => {
    let h = record(EMPTY_HISTORY, d0, "slider", 0);
    h = record(h, d1, "slider", 100);
    expect(h.past).toHaveLength(1);
    h = record(h, d1, "slider", 5000);
    expect(h.past).toHaveLength(2);
  });
  it("caps history length", () => {
    let h = EMPTY_HISTORY;
    for (let i = 0; i < HISTORY_LIMIT + 20; i++) h = record(h, d0, null, i * 10_000);
    expect(h.past).toHaveLength(HISTORY_LIMIT);
  });
});

describe("text layout", () => {
  const spec = {
    fontFamily: "inter",
    fontSize: 10,
    fontWeight: 400,
    italic: false,
    letterSpacing: 0,
  };
  it("wraps on words and keeps explicit newlines", () => {
    // approx 5.6 units per char
    expect(wrapText("aaa bbb ccc", 30, spec, approximateMeasure)).toEqual(["aaa", "bbb", "ccc"]);
    expect(wrapText("aaa bbb ccc", 40, spec, approximateMeasure)).toEqual(["aaa bbb", "ccc"]);
    expect(wrapText("one\ntwo", 1000, spec, approximateMeasure)).toEqual(["one", "two"]);
    expect(wrapText("", 100, spec, approximateMeasure)).toEqual([""]);
  });
  it("breaks words longer than the line", () => {
    const lines = wrapText("abcdefghijklmnop", 30, spec, approximateMeasure);
    expect(lines.length).toBeGreaterThan(2);
    expect(lines.join("")).toBe("abcdefghijklmnop");
  });
  it("computes height and natural width, honoring uppercase", () => {
    const el = createTextElement("Scan me to connect", { width: 100 }, "body", {
      fontSize: 20,
      uppercase: true,
      padding: 8,
    });
    const layout = layoutText(el, approximateMeasure);
    expect(layout.lines.every((l) => l === l.toUpperCase())).toBe(true);
    expect(layout.height).toBeCloseTo(layout.lines.length * 20 * el.lineHeight + 16);
    expect(naturalWidth(el, approximateMeasure)).toBeGreaterThan(100);
  });
  it("fits text heights only for changed text", () => {
    const el = createTextElement("Hello world", { width: 50 }, "body");
    const doc = docWith(el);
    const fitted = fitTextHeights(null, doc, approximateMeasure);
    expect(fitted.elements[0].height).not.toBe(el.height);
    expect(fitTextHeights(fitted, fitted, approximateMeasure)).toBe(fitted);
  });
});
