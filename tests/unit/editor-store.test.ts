import { beforeEach, describe, expect, it } from "vitest";
import { useEditorStore } from "@/features/studio/store/editorStore";
import { createDocument, createShapeElement, createTextElement } from "@/lib/model/factory";
import { approximateMeasure } from "@/lib/text/layout";

const store = () => useEditorStore.getState();

beforeEach(() => {
  useEditorStore.setState({ measure: approximateMeasure });
  store().newDocument(createDocument());
});

describe("editor store", () => {
  it("adds, selects, updates, undoes and redoes", () => {
    const rect = createShapeElement("rect");
    store().addElement(rect);
    expect(store().selection).toEqual([rect.id]);
    expect(store().dirty).toBe(true);
    store().updateElement(rect.id, { x: 50 });
    expect(store().doc.elements[0].x).toBe(50);
    store().undo();
    expect(store().doc.elements[0].x).toBe(0);
    store().undo();
    expect(store().doc.elements).toHaveLength(0);
    expect(store().selection).toEqual([]);
    store().redo();
    store().redo();
    expect(store().doc.elements[0].x).toBe(50);
  });

  it("records a whole drag gesture as one undo step", () => {
    const rect = createShapeElement("rect");
    store().addElement(rect);
    store().beginGesture();
    for (let i = 1; i <= 10; i++)
      store().updateGesture((d) => ({
        ...d,
        elements: d.elements.map((e) => ({ ...e, x: i * 10 })),
      }));
    store().endGesture();
    expect(store().doc.elements[0].x).toBe(100);
    store().undo();
    expect(store().doc.elements[0].x).toBe(0);
  });

  it("cancels gestures", () => {
    const rect = createShapeElement("rect");
    store().addElement(rect);
    store().beginGesture();
    store().updateGesture((d) => ({ ...d, elements: [] }));
    store().cancelGesture();
    expect(store().doc.elements).toHaveLength(1);
  });

  it("duplicates, copies, pastes and deletes (but not locked elements)", () => {
    const rect = createShapeElement("rect");
    store().addElement(rect);
    store().duplicateSelection();
    expect(store().doc.elements).toHaveLength(2);
    store().copySelection();
    store().paste();
    store().paste();
    expect(store().doc.elements).toHaveLength(4);
    expect(store().doc.elements[3].x).toBe(store().doc.elements[2].x + 24);
    store().setSelectionLocked(true);
    store().deleteSelection();
    expect(store().doc.elements).toHaveLength(4);
    store().setSelectionLocked(false);
    store().cutSelection();
    expect(store().doc.elements).toHaveLength(3);
  });

  it("selects all visible, toggles, clears and hides", () => {
    const a = createShapeElement("rect");
    const b = createShapeElement("ellipse");
    store().addElement(a);
    store().addElement(b);
    store().selectAll();
    expect(store().selection).toHaveLength(2);
    store().toggleSelect(a.id);
    expect(store().selection).toEqual([b.id]);
    store().setElementHidden(b.id, true);
    expect(store().selection).toEqual([]);
    store().selectAll();
    expect(store().selection).toEqual([a.id]);
    store().clearSelection();
    expect(store().selection).toEqual([]);
  });

  it("auto-fits text heights", () => {
    const t = createTextElement("A fairly long line of text that will wrap", { width: 80 }, "body");
    store().addElement(t);
    const fitted = store().doc.elements[0];
    expect(fitted.height).toBeGreaterThan(t.height);
  });

  it("nudges, aligns, reorders and renames", () => {
    const a = createShapeElement("rect");
    store().addElement(a);
    store().nudgeSelection(5, 0);
    store().nudgeSelection(5, 0);
    expect(store().doc.elements[0].x).toBe(10);
    store().alignSelection("left");
    expect(store().doc.elements[0].x).toBe(0);
    store().reorderSelection("back");
    store().distributeSelection("horizontal");
    store().renameDocument("Menu card");
    expect(store().doc.name).toBe("Menu card");
    store().renameDocument("");
    expect(store().doc.name).toBe("Untitled design");
  });

  it("loading a document resets history and dirty state", () => {
    store().addElement(createShapeElement("rect"));
    store().loadDocument(createDocument());
    expect(store().dirty).toBe(false);
    expect(store().history.past).toHaveLength(0);
    store().markSaved();
    store().setView({ showGrid: true, gridSize: 10 });
    expect(store().view.showGrid).toBe(true);
    expect(store().view.gridSize).toBe(10);
  });
});
