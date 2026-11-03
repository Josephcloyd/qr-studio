import { layoutText, type Measure } from "@/lib/text/layout";
import type { DesignDocument, DesignElement } from "./types";

/** Text boxes auto-size vertically to their wrapped content. */
export function fitTextElement(el: DesignElement, measure: Measure): DesignElement {
  if (el.type !== "text") return el;
  const height = Math.max(1, Math.round(layoutText(el, measure).height * 100) / 100);
  return Math.abs(height - el.height) < 0.01 ? el : { ...el, height };
}

/**
 * Re-fits text elements that changed between `prev` and `next` (by
 * reference), or all of them when `prev` is null.
 */
export function fitTextHeights(
  prev: DesignDocument | null,
  next: DesignDocument,
  measure: Measure,
): DesignDocument {
  const before = new Map(prev?.elements.map((e) => [e.id, e]) ?? []);
  let changed = false;
  const elements = next.elements.map((e) => {
    if (e.type !== "text" || before.get(e.id) === e) return e;
    const fitted = fitTextElement(e, measure);
    if (fitted !== e) changed = true;
    return fitted;
  });
  return changed ? { ...next, elements } : next;
}
