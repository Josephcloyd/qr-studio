"use client";

import { useEffect } from "react";
import { createImageElement } from "@/lib/model/factory";
import { useImageUpload } from "@/features/assets/useImageUpload";
import { isInteractiveTarget, isTextEntry } from "./focusContext";
import { useEditorStore } from "./store/editorStore";
import { useUiStore } from "./store/uiStore";
import { useViewportStore } from "./store/viewportStore";

export interface Shortcut {
  keys: string;
  label: string;
}

export const SHORTCUTS: { group: string; items: Shortcut[] }[] = [
  {
    group: "Edit",
    items: [
      { keys: "Ctrl Z", label: "Undo" },
      { keys: "Ctrl Shift Z / Ctrl Y", label: "Redo" },
      { keys: "Ctrl C / X / V", label: "Copy / cut / paste" },
      { keys: "Ctrl D", label: "Duplicate" },
      { keys: "Delete", label: "Delete selection" },
      { keys: "Ctrl A", label: "Select all" },
      { keys: "Esc", label: "Deselect / stop editing text" },
      { keys: "Enter", label: "Edit selected text" },
    ],
  },
  {
    group: "Arrange",
    items: [
      { keys: "Arrows", label: "Nudge 1 px (Shift: 10 px)" },
      { keys: "Ctrl ] / Ctrl [", label: "Bring forward / send backward" },
      { keys: "Ctrl Shift ] / [", label: "Bring to front / send to back" },
      { keys: "Ctrl Shift L", label: "Lock / unlock" },
      { keys: "Shift (drag)", label: "Keep proportions · rotate in 15° steps" },
      { keys: "Alt (drag)", label: "Resize from center · move without snapping" },
    ],
  },
  {
    group: "View & file",
    items: [
      { keys: "+ / −", label: "Zoom in / out" },
      { keys: "Shift 1", label: "Zoom to fit" },
      { keys: "Shift 0", label: "Zoom to 100%" },
      { keys: "Space (drag)", label: "Pan the canvas" },
      { keys: "Ctrl S", label: "Download project file" },
      { keys: "Ctrl E", label: "Export" },
      { keys: "?", label: "Show shortcuts" },
    ],
  },
];

export function useStudioShortcuts(onSaveProject: () => void): void {
  const { ingest } = useImageUpload();

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.defaultPrevented || useUiStore.getState().dialog) return;
      const s = useEditorStore.getState();
      const vp = useViewportStore.getState();
      const mod = e.ctrlKey || e.metaKey;
      const key = e.key.toLowerCase();
      const handled = () => e.preventDefault();
      const typing = isTextEntry(e.target);

      // Save/export work everywhere (and beat the browser's own Ctrl+S).
      if (mod && key === "s") return (handled(), onSaveProject());
      if (mod && key === "e") return (handled(), useUiStore.getState().openDialog("export"));
      // Everything else leaves text fields alone (native undo, copy, select-all…).
      if (typing) return;

      if (mod && key === "z") return (handled(), e.shiftKey ? s.redo() : s.undo());
      if (mod && key === "y") return (handled(), s.redo());
      if (mod && key === "c")
        return s.selection.length ? (handled(), s.copySelection()) : undefined;
      if (mod && key === "x") return s.selection.length ? (handled(), s.cutSelection()) : undefined;
      if (mod && key === "d") return (handled(), s.duplicateSelection());
      if (mod && key === "a") return (handled(), s.selectAll());
      if (mod && e.shiftKey && key === "l") {
        handled();
        const anyUnlocked = s.doc.elements.some((el) => s.selection.includes(el.id) && !el.locked);
        return s.setSelectionLocked(anyUnlocked);
      }
      if (mod && (e.key === "]" || e.key === "}"))
        return (handled(), s.reorderSelection(e.shiftKey ? "front" : "forward"));
      if (mod && (e.key === "[" || e.key === "{"))
        return (handled(), s.reorderSelection(e.shiftKey ? "back" : "backward"));
      if (mod) return;
      // Buttons, radios, menus, sliders and pickers own Enter/Space/arrows/Delete.
      if (isInteractiveTarget(e.target)) return;

      if (e.key === "Delete" || e.key === "Backspace") return (handled(), s.deleteSelection());
      if (e.key === "Escape") return s.clearSelection();
      if (e.key === "Enter" && s.selection.length === 1) {
        const el = s.doc.elements.find((x) => x.id === s.selection[0]);
        if (el?.type === "text" && !el.locked) return (handled(), s.setEditingText(el.id));
      }
      const step = e.shiftKey ? 10 : 1;
      const arrows: Record<string, [number, number]> = {
        ArrowLeft: [-step, 0],
        ArrowRight: [step, 0],
        ArrowUp: [0, -step],
        ArrowDown: [0, step],
      };
      if (arrows[e.key] && s.selection.length)
        return (handled(), s.nudgeSelection(...arrows[e.key]));
      if (e.key === "+" || e.key === "=") return (handled(), vp.zoomStep(1));
      if (e.key === "-" || e.key === "_") return (handled(), vp.zoomStep(-1));
      if (e.shiftKey && e.code === "Digit1") return (handled(), vp.fit(s.doc.width, s.doc.height));
      if (e.shiftKey && e.code === "Digit0") return (handled(), vp.zoomAt(1));
      if (e.key === "?") return (handled(), useUiStore.getState().openDialog("shortcuts"));
    };

    // Paste: images from the system clipboard become image elements (read
    // locally); otherwise paste copied design elements.
    const onPaste = async (e: ClipboardEvent) => {
      if (isTextEntry(e.target) || useUiStore.getState().dialog) return;
      const files = [...(e.clipboardData?.files ?? [])].filter((f) => f.type.startsWith("image/"));
      const s = useEditorStore.getState();
      if (!files.length) {
        if (s.clipboard.length) {
          e.preventDefault();
          s.paste();
        }
        return;
      }
      e.preventDefault();
      const added = await ingest(files);
      for (const asset of added) {
        // Read the document after the await — it may have changed meanwhile.
        const { doc, addElement } = useEditorStore.getState();
        const w = Math.min(doc.width * 0.5, asset.width);
        const h = w * (asset.height / asset.width);
        addElement(
          createImageElement(
            asset.id,
            { x: (doc.width - w) / 2, y: (doc.height - h) / 2, width: w, height: h },
            asset.name,
          ),
        );
      }
    };

    window.addEventListener("keydown", onKey);
    window.addEventListener("paste", onPaste);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("paste", onPaste);
    };
  }, [ingest, onSaveProject]);
}
