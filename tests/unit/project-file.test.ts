import { describe, expect, it } from "vitest";
import { createDocument, createImageElement, createQrElement, createTextElement } from "@/lib/model/factory";
import { addElements } from "@/lib/model/ops";
import { isUnsafeSvg, fitWithin, validateImageFile, dataUrlToBlob } from "@/lib/assets/intake";
import { parseProjectFile, projectFileName, serializeProject, type ProjectAsset } from "@/lib/project/projectFile";

const PNG_1PX =
  "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==";
const asset = (id: string, patch: Partial<ProjectAsset> = {}): ProjectAsset => ({
  id,
  name: "logo",
  mime: "image/png",
  width: 1,
  height: 1,
  dataUrl: PNG_1PX,
  ...patch,
});

function sampleDoc() {
  return addElements(createDocument(), [
    createQrElement({ x: 10, y: 10 }),
    createTextElement("Scan me ✨ — ¡Hola!", { x: 10, y: 300 }, "heading"),
    createImageElement("asset-a", { x: 40, y: 40 }),
  ]);
}

describe("project file round trip", () => {
  it("serializes and parses back to an identical document", () => {
    const doc = sampleDoc();
    const text = serializeProject(doc, [asset("asset-a"), asset("asset-unused")]);
    const parsed = parseProjectFile(text);
    expect(parsed.ok).toBe(true);
    if (!parsed.ok) return;
    expect(parsed.project.document).toEqual(doc);
    expect(parsed.project.assets.map((a) => a.id)).toEqual(["asset-a"]); // unused assets dropped
  });
});

describe("import validation rejects unsafe or broken files", () => {
  const valid = () => JSON.parse(serializeProject(sampleDoc(), [asset("asset-a")]));
  const parse = (obj: unknown) => parseProjectFile(JSON.stringify(obj));

  it("rejects non-JSON and foreign JSON", () => {
    expect(parseProjectFile("not json").ok).toBe(false);
    expect(parse({ hello: "world" }).ok).toBe(false);
    expect(parse(null).ok).toBe(false);
  });
  it("rejects newer format versions", () => {
    const r = parse({ ...valid(), formatVersion: 99 });
    expect(!r.ok && r.error).toMatch(/newer version/);
  });
  it("rejects external image URLs (no network side effects on import)", () => {
    const file = valid();
    file.assets[0].dataUrl = "https://tracker.example/pixel.png";
    expect(parse(file).ok).toBe(false);
  });
  it("rejects mismatched mime types and non-image data", () => {
    const file = valid();
    file.assets[0].dataUrl = PNG_1PX.replace("image/png", "text/html");
    expect(parse(file).ok).toBe(false);
  });
  it("rejects missing referenced assets", () => {
    const file = valid();
    file.assets = [];
    expect(parse(file).ok).toBe(false);
  });
  it("rejects malformed elements and out-of-range values", () => {
    const file = valid();
    file.document.elements[0].width = -5;
    expect(parse(file).ok).toBe(false);
    const file2 = valid();
    file2.document.elements[1].color = "javascript:alert(1)";
    expect(parse(file2).ok).toBe(false);
  });
  it("rejects duplicate element ids", () => {
    const file = valid();
    file.document.elements[1].id = file.document.elements[0].id;
    expect(parse(file).ok).toBe(false);
  });
  it("rejects too many elements", () => {
    const file = valid();
    file.document.elements = Array.from({ length: 1001 }, () => ({ ...file.document.elements[0] }));
    expect(parse(file).ok).toBe(false);
  });
  it("strips unknown keys", () => {
    const file = valid();
    file.document.elements[0].onload = "alert(1)";
    const r = parse(file);
    expect(r.ok && "onload" in r.project.document.elements[0]).toBe(false);
  });
});

describe("intake helpers", () => {
  it("validates uploads", () => {
    expect(validateImageFile({ type: "image/png", size: 1000 })).toBeNull();
    expect(validateImageFile({ type: "image/gif", size: 1000 })).toMatch(/PNG/);
    expect(validateImageFile({ type: "image/png", size: 16 * 1024 * 1024 })).toMatch(/15 MB/);
    expect(validateImageFile({ type: "image/png", size: 0 })).toMatch(/empty/);
  });
  it("detects scripted SVGs", () => {
    expect(isUnsafeSvg('<svg><script>alert(1)</script></svg>')).toBe(true);
    expect(isUnsafeSvg('<svg><rect onclick="x()"/></svg>')).toBe(true);
    expect(isUnsafeSvg("<svg><foreignObject></foreignObject></svg>")).toBe(true);
    expect(isUnsafeSvg('<svg><rect width="10"/></svg>')).toBe(false);
  });
  it("fits large images within a max side", () => {
    expect(fitWithin(8000, 4000, 4096)).toEqual({ width: 4096, height: 2048 });
    expect(fitWithin(100, 50, 4096)).toEqual({ width: 100, height: 50 });
  });
  it("decodes data URLs to blobs locally", async () => {
    const blob = dataUrlToBlob(PNG_1PX);
    expect(blob.type).toBe("image/png");
    expect(blob.size).toBeGreaterThan(50);
    expect(() => dataUrlToBlob("https://example.com/x.png")).toThrow();
  });
  it("makes safe file names", () => {
    expect(projectFileName("Café Menu — Main!")).toBe("caf-menu-main.qrstudio.json");
    expect(projectFileName("!!!")).toBe("qr-studio-design.qrstudio.json");
  });
});
