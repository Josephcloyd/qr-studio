/**
 * Editor state. In memory only — there is deliberately no persistence
 * middleware: refreshing the page discards the design unless the user
 * downloaded a project file.
 */
import { create } from "zustand";
import { createDocument } from "@/lib/model/factory";
import { EMPTY_HISTORY, record, redo as redoHistory, undo as undoHistory, type History } from "@/lib/model/history";
import {
  addElements,
  alignElements,
  cloneElement,
  distributeElements,
  duplicateElements,
  mapElements,
  moveElements,
  removeElements,
  reorderElements,
  updateElement as updateElementOp,
  type Alignment,
  type LayerMove,
} from "@/lib/model/ops";
import { fitTextHeights } from "@/lib/model/textFit";
import type { DesignDocument, DesignElement, ElementPatch } from "@/lib/model/types";
import type { Guide } from "@/lib/geometry/snap";
import { canvasMeasure } from "@/lib/text/measure";
import type { Measure } from "@/lib/text/layout";

export interface ViewState {
  showGrid: boolean;
  snapToGrid: boolean;
  snapToGuides: boolean;
  gridSize: number;
}

export interface EditorState {
  doc: DesignDocument;
  selection: string[];
  history: History;
  dirty: boolean;
  editingTextId: string | null;
  clipboard: DesignElement[];
  view: ViewState;
  guides: Guide[];
  /** Document snapshot taken when a drag/resize gesture began. */
  gestureStart: DesignDocument | null;
  measure: Measure;

  apply: (fn: (doc: DesignDocument) => DesignDocument, key?: string | null) => void;
  beginGesture: () => void;
  updateGesture: (fn: (start: DesignDocument) => DesignDocument, guides?: Guide[]) => void;
  endGesture: () => void;
  cancelGesture: () => void;

  loadDocument: (doc: DesignDocument) => void;
  newDocument: (doc?: DesignDocument) => void;
  renameDocument: (name: string) => void;

  select: (ids: string[]) => void;
  toggleSelect: (id: string) => void;
  selectAll: () => void;
  clearSelection: () => void;
  setEditingText: (id: string | null) => void;

  addElement: (el: DesignElement, select?: boolean) => void;
  updateElement: <T extends DesignElement>(id: string, patch: ElementPatch<T>, key?: string | null) => void;
  deleteSelection: () => void;
  duplicateSelection: () => void;
  copySelection: () => void;
  cutSelection: () => void;
  paste: () => void;
  nudgeSelection: (dx: number, dy: number) => void;
  reorderSelection: (move: LayerMove) => void;
  alignSelection: (alignment: Alignment) => void;
  distributeSelection: (axis: "horizontal" | "vertical") => void;
  setSelectionLocked: (locked: boolean) => void;
  setElementHidden: (id: string, hidden: boolean) => void;

  undo: () => void;
  redo: () => void;
  setView: (patch: Partial<ViewState>) => void;
  markSaved: () => void;
}

const PASTE_OFFSET = 24;

const keep = (doc: DesignDocument, ids: string[]) => {
  const present = new Set(doc.elements.map((e) => e.id));
  return ids.filter((id) => present.has(id));
};

export const DEFAULT_VIEW: ViewState = { showGrid: false, snapToGrid: false, snapToGuides: true, gridSize: 24 };

export const useEditorStore = create<EditorState>((set, get) => {
  const commit = (next: DesignDocument, key: string | null = null, extra: Partial<EditorState> = {}) => {
    const { doc, history, measure } = get();
    if (next === doc) return;
    const fitted = fitTextHeights(doc, next, measure);
    set({
      doc: fitted,
      history: record(history, doc, key, Date.now()),
      dirty: true,
      selection: keep(fitted, extra.selection ?? get().selection),
      ...extra,
    });
  };

  const selected = () => {
    const ids = new Set(get().selection);
    return get().doc.elements.filter((e) => ids.has(e.id));
  };

  return {
    doc: createDocument(),
    selection: [],
    history: EMPTY_HISTORY,
    dirty: false,
    editingTextId: null,
    clipboard: [],
    view: DEFAULT_VIEW,
    guides: [],
    gestureStart: null,
    measure: canvasMeasure,

    apply: (fn, key = null) => commit(fn(get().doc), key),

    beginGesture: () => set({ gestureStart: get().doc }),
    updateGesture: (fn, guides = []) => {
      const start = get().gestureStart;
      if (!start) return;
      set({ doc: fitTextHeights(get().doc, fn(start), get().measure), guides });
    },
    endGesture: () => {
      const { gestureStart, doc, history } = get();
      if (!gestureStart) return;
      const changed = gestureStart !== doc;
      set({
        gestureStart: null,
        guides: [],
        ...(changed ? { history: record(history, gestureStart, null, Date.now()), dirty: true } : {}),
      });
    },
    cancelGesture: () => {
      const { gestureStart } = get();
      if (gestureStart) set({ doc: gestureStart, gestureStart: null, guides: [] });
    },

    loadDocument: (doc) =>
      set({
        doc: fitTextHeights(null, doc, get().measure),
        selection: [],
        history: EMPTY_HISTORY,
        dirty: false,
        editingTextId: null,
        guides: [],
        gestureStart: null,
      }),
    newDocument: (doc) => get().loadDocument(doc ?? createDocument()),
    renameDocument: (name) => commit({ ...get().doc, name: name.slice(0, 120) || "Untitled design" }, "rename"),

    select: (ids) => set({ selection: keep(get().doc, ids), editingTextId: null }),
    toggleSelect: (id) => {
      const s = get().selection;
      set({ selection: s.includes(id) ? s.filter((x) => x !== id) : [...s, id] });
    },
    selectAll: () => set({ selection: get().doc.elements.filter((e) => !e.hidden).map((e) => e.id) }),
    clearSelection: () => set({ selection: [], editingTextId: null }),
    setEditingText: (id) => set({ editingTextId: id }),

    addElement: (el, select = true) =>
      commit(addElements(get().doc, [el]), null, select ? { selection: [el.id] } : {}),
    updateElement: (id, patch, key = null) => commit(updateElementOp(get().doc, id, patch), key),
    deleteSelection: () => {
      const ids = selected()
        .filter((e) => !e.locked)
        .map((e) => e.id);
      if (ids.length) commit(removeElements(get().doc, ids), null, { selection: [] });
    },
    duplicateSelection: () => {
      const { doc, selection } = get();
      if (!selection.length) return;
      const result = duplicateElements(doc, selection);
      commit(result.doc, null, { selection: result.ids });
    },
    copySelection: () => {
      const items = selected();
      if (items.length) set({ clipboard: items.map((e) => structuredClone(e)) });
    },
    cutSelection: () => {
      get().copySelection();
      get().deleteSelection();
    },
    paste: () => {
      const { clipboard, doc } = get();
      if (!clipboard.length) return;
      const copies = clipboard.map((e) => cloneElement(e, PASTE_OFFSET, PASTE_OFFSET));
      // Shift the clipboard so repeated pastes cascade.
      set({ clipboard: copies.map((e) => structuredClone(e)) });
      commit(addElements(doc, copies), null, { selection: copies.map((e) => e.id) });
    },
    nudgeSelection: (dx, dy) => {
      const { selection, doc } = get();
      if (selection.length) commit(moveElements(doc, selection, dx, dy), `nudge:${selection.join(",")}`);
    },
    reorderSelection: (move) => commit(reorderElements(get().doc, get().selection, move)),
    alignSelection: (alignment) => commit(alignElements(get().doc, get().selection, alignment)),
    distributeSelection: (axis) => commit(distributeElements(get().doc, get().selection, axis)),
    setSelectionLocked: (locked) => commit(mapElements(get().doc, get().selection, (e) => ({ ...e, locked }))),
    setElementHidden: (id, hidden) =>
      commit(updateElementOp(get().doc, id, { hidden }), null, hidden ? { selection: get().selection.filter((s) => s !== id) } : {}),

    undo: () => {
      const result = undoHistory(get().history, get().doc);
      if (result) set({ doc: result.doc, history: result.history, dirty: true, selection: keep(result.doc, get().selection), editingTextId: null });
    },
    redo: () => {
      const result = redoHistory(get().history, get().doc);
      if (result) set({ doc: result.doc, history: result.history, dirty: true, selection: keep(result.doc, get().selection), editingTextId: null });
    },
    setView: (patch) => set({ view: { ...get().view, ...patch } }),
    markSaved: () => set({ dirty: false }),
  };
});

/** Selected elements (stable when selection/doc unchanged). */
export function selectSelectedElements(state: EditorState): DesignElement[] {
  const ids = new Set(state.selection);
  return state.doc.elements.filter((e) => ids.has(e.id));
}
