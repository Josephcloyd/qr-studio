"use client";

import { useEffect } from "react";
import { FONTS } from "@/lib/fonts/registry";
import { fitTextHeights } from "@/lib/model/textFit";
import { canvasMeasure, clearMeasureCache } from "@/lib/text/measure";
import { useEditorStore } from "./store/editorStore";

/**
 * Loads the bundled fonts (from our own origin), then re-measures text so
 * wrapping uses real glyph widths. Doesn't touch undo history.
 */
export function useFontsReady(): void {
  useEffect(() => {
    if (typeof document === "undefined" || !document.fonts) return;
    let cancelled = false;
    const loads = FONTS.filter((f) => f.file).flatMap((f) => [
      document.fonts.load(`400 16px '${f.family}'`),
      document.fonts.load(`700 16px '${f.family}'`),
    ]);
    Promise.allSettled(loads).then(() => {
      if (cancelled) return;
      clearMeasureCache();
      // A new measure identity forces every element to re-render with real metrics.
      const measure: typeof canvasMeasure = (text, spec) => canvasMeasure(text, spec);
      const { doc } = useEditorStore.getState();
      useEditorStore.setState({ measure, doc: fitTextHeights(null, doc, measure) });
    });
    return () => {
      cancelled = true;
    };
  }, []);
}
