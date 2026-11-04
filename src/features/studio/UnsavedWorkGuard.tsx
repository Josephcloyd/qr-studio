"use client";

import { useEffect } from "react";
import { useEditorStore } from "./store/editorStore";

/**
 * Warns before the tab closes while an unsaved design exists. Mounted app-wide
 * (not just in the studio) because the design survives in-app navigation in
 * memory — leaving /studio for / must not silently drop the warning.
 */
export function UnsavedWorkGuard() {
  const dirty = useEditorStore((s) => s.dirty && s.doc.elements.length > 0);
  useEffect(() => {
    if (!dirty) return;
    const handler = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = "";
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [dirty]);
  return null;
}
