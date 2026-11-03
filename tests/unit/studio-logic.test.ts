import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  createDocument,
  createImageElement,
  createQrElement,
  createShapeElement,
  createTextElement,
} from "@/lib/model/factory";
import { addElements } from "@/lib/model/ops";
import { setPngDpi, readPngDpi, crc32 } from "@/lib/export/pngDpi";
import {
  createObjectUrl,
  liveObjectUrlCount,
  revokeAllObjectUrls,
  revokeObjectUrl,
} from "@/lib/assets/objectUrls";
import { remapAssetIds } from "@/lib/project/projectFile";
import { clampWeight, fontStack, getFont } from "@/lib/fonts/registry";
import { sampleContent } from "@/lib/qr/samples";
import { QR_TYPES } from "@/lib/qr/content";
import { encodePayload } from "@/lib/qr/payloads";
import {
  locksAspect,
  marqueeHits,
  moveGesture,
  resizeGesture,
  rotateGesture,
} from "@/features/studio/interactions/gestures";
import { clampZoom, fitZoom, useViewportStore } from "@/features/studio/store/viewportStore";
import { useUiStore } from "@/features/studio/store/uiStore";
import { qrOnlyDocument } from "@/features/export/qrDocument";
import { rasterize } from "../helpers/decode";

describe("gestures", () => {
  const rect = createShapeElement("rect", { x: 100, y: 100, width: 100, height: 50 });
  const other = createShapeElement("rect", { x: 400, y: 300, width: 80, height: 80 });
  const doc = addElements(createDocument(), [rect, other]);
  const opts = { snapToGuides: false, gridSize: null, threshold: 6 };

  it("moves selected elements", () => {
    const r = moveGesture(doc, [rect.id], 10, 20, opts);
    expect(r.doc.elements[0]).toMatchObject({ x: 110, y: 120 });
    expect(r.guides).toEqual([]);
  });
  it("snaps to other elements and reports guides", () => {
    const r = moveGesture(doc, [rect.id], 297, 0, { ...opts, snapToGuides: true });
    expect(r.doc.elements[0].x).toBe(400);
    expect(r.guides.length).toBeGreaterThan(0);
  });
  it("snaps to the grid", () => {
    const r = moveGesture(doc, [rect.id], 13, 13, { ...opts, gridSize: 24 });
    expect(r.doc.elements[0].x % 24).toBe(0);
  });
  it("ignores locked elements", () => {
    const locked = { ...doc, elements: [{ ...rect, locked: true }, other] };
    expect(moveGesture(locked, [rect.id], 10, 10, opts).doc).toBe(locked);
    expect(
      resizeGesture(
        locked,
        rect.id,
        "se",
        { x: 0, y: 0 },
        { shift: false, alt: false, gridSize: null },
      ),
    ).toBe(locked);
    expect(rotateGesture(locked, rect.id, { x: 0, y: 0 }, false)).toBe(locked);
  });
  it("keeps QR codes square and scales text from corners", () => {
    const qr = createQrElement({ x: 0, y: 0, width: 100 });
    const text = createTextElement("Hello", { x: 0, y: 0, width: 200 }, "body", { fontSize: 20 });
    const d = addElements(createDocument(), [qr, text]);
    const q = resizeGesture(
      d,
      qr.id,
      "e",
      { x: 180, y: 50 },
      { shift: false, alt: false, gridSize: null },
    ).elements[0];
    expect(q.width).toBe(q.height);
    const t = resizeGesture(
      d,
      text.id,
      "se",
      { x: 400, y: 60 },
      { shift: false, alt: false, gridSize: null },
    ).elements[1];
    expect(t.type === "text" && t.fontSize).toBeGreaterThan(20);
    const tw = resizeGesture(
      d,
      text.id,
      "e",
      { x: 300, y: 0 },
      { shift: false, alt: false, gridSize: null },
    ).elements[1];
    expect(tw.type === "text" && tw.fontSize).toBe(20);
    expect(tw.width).toBe(300);
    expect(locksAspect(qr)).toBe(true);
    expect(locksAspect(text)).toBe(false);
  });
  it("snaps resize to the grid", () => {
    const r = resizeGesture(
      doc,
      rect.id,
      "se",
      { x: 213, y: 167 },
      { shift: false, alt: false, gridSize: 24 },
    );
    expect(r.elements[0].x + r.elements[0].width).toBe(216);
  });
  it("rotates and marquee-selects", () => {
    expect(rotateGesture(doc, rect.id, { x: 400, y: 125 }, false).elements[0].rotation).toBe(90);
    expect(marqueeHits(doc, { x: 0, y: 0 }, { x: 250, y: 250 })).toEqual([rect.id]);
    expect(marqueeHits(doc, { x: 0, y: 0 }, { x: 1, y: 1 })).toEqual([]);
  });
});

describe("viewport and UI stores", () => {
  beforeEach(() =>
    useViewportStore.setState({ zoom: 1, panX: 0, panY: 0, width: 1000, height: 800 }),
  );
  it("fits, zooms around an anchor and steps", () => {
    const vp = useViewportStore.getState();
    vp.fit(500, 400);
    expect(useViewportStore.getState().zoom).toBeCloseTo(fitZoom(500, 400, 1000, 800));
    useViewportStore.getState().zoomAt(2, 0, 0);
    expect(useViewportStore.getState().zoom).toBe(2);
    useViewportStore.getState().zoomStep(1);
    expect(useViewportStore.getState().zoom).toBe(3);
    useViewportStore.getState().zoomStep(-1);
    expect(useViewportStore.getState().zoom).toBe(2);
    useViewportStore.getState().panBy(10, 5);
    useViewportStore.getState().setPan(1, 2);
    expect(useViewportStore.getState()).toMatchObject({ panX: 1, panY: 2 });
    expect(clampZoom(100)).toBe(8);
    useViewportStore.setState({ width: 0 });
    useViewportStore.getState().fit(10, 10); // no-op without a size
  });
  it("toggles panels and dialogs", () => {
    const ui = useUiStore.getState();
    ui.setPanel("qr");
    ui.togglePanel("qr");
    expect(useUiStore.getState().panel).toBeNull();
    ui.openDialog("export");
    ui.setPropertiesOpen(true);
    expect(useUiStore.getState()).toMatchObject({ dialog: "export", propertiesOpen: true });
  });
});

describe("object URL registry", () => {
  afterEach(() => vi.restoreAllMocks());
  it("tracks and revokes every URL it creates", () => {
    let n = 0;
    vi.spyOn(URL, "createObjectURL").mockImplementation(() => `blob:test/${n++}`);
    const revoke = vi.spyOn(URL, "revokeObjectURL").mockImplementation(() => undefined);
    const a = createObjectUrl(new Blob(["a"]));
    createObjectUrl(new Blob(["b"]));
    expect(liveObjectUrlCount()).toBe(2);
    revokeObjectUrl(a);
    revokeObjectUrl("blob:unknown");
    revokeObjectUrl(null);
    expect(liveObjectUrlCount()).toBe(1);
    revokeAllObjectUrls();
    expect(liveObjectUrlCount()).toBe(0);
    expect(revoke).toHaveBeenCalledTimes(2);
  });
});

describe("PNG DPI metadata", () => {
  const png = new Uint8Array(
    rasterize('<svg xmlns="http://www.w3.org/2000/svg" width="10" height="10"/>', 10).png,
  );
  it("writes and reads a pHYs chunk", () => {
    const out = setPngDpi(png, 300);
    expect(readPngDpi(out)).toBe(300);
    expect(readPngDpi(setPngDpi(out, 150))).toBe(150); // replaces existing
    expect(() => setPngDpi(new Uint8Array([1, 2, 3]), 300)).toThrow();
  });
  it("computes the standard CRC-32", () => {
    expect(crc32(new TextEncoder().encode("123456789"))).toBe(0xcbf43926);
  });
});

describe("misc model helpers", () => {
  it("remaps asset ids in a document", () => {
    const qr = createQrElement();
    const doc = addElements(createDocument(), [
      createImageElement("old-img"),
      { ...qr, style: { ...qr.style, logo: { ...qr.style.logo, assetId: "old-logo" } } },
      createShapeElement("rect"),
    ]);
    const bgDoc = { ...doc, background: { ...doc.background, imageAssetId: "old-bg" } };
    const out = remapAssetIds(
      bgDoc,
      new Map([
        ["old-img", "new-img"],
        ["old-logo", "new-logo"],
        ["old-bg", "new-bg"],
      ]),
    );
    expect(out.background.imageAssetId).toBe("new-bg");
    expect(out.elements[0].type === "image" && out.elements[0].assetId).toBe("new-img");
    expect(out.elements[1].type === "qr" && out.elements[1].style.logo.assetId).toBe("new-logo");
  });
  it("resolves fonts", () => {
    expect(getFont("nope").id).toBe("inter");
    expect(fontStack("playfair-display")).toContain("'Playfair Display'");
    expect(clampWeight("bebas-neue", 900)).toBe(400);
  });
  it("provides valid sample content for every QR type", () => {
    for (const t of QR_TYPES) expect(encodePayload(sampleContent(t)).ok).toBe(true);
  });
  it("builds QR-only documents", () => {
    const doc = qrOnlyDocument(sampleContent("url"), createQrElement().style, 512);
    expect(doc.width).toBe(512);
    expect(doc.elements[0]).toMatchObject({ x: 0, y: 0, width: 512, height: 512 });
    expect(doc.background.paint.kind).toBe("none");
  });
});
