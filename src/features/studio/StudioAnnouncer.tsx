"use client";

import { useEffect, useRef, useState } from "react";
import { useEditorStore } from "./store/editorStore";

const TYPE_NAMES = { qr: "QR code", text: "text", image: "image", shape: "shape", icon: "icon" };

/**
 * Polite screen-reader announcements for canvas changes that are otherwise
 * only visual: selection changes and keyboard moves.
 */
export function StudioAnnouncer() {
  const [message, setMessage] = useState("");
  const last = useRef("");

  useEffect(
    () =>
      useEditorStore.subscribe((state, prev) => {
        if (state.gestureStart) return; // don't chatter during drags
        const selected = state.doc.elements.filter((e) => state.selection.includes(e.id));
        let next = "";
        if (state.selection !== prev.selection) {
          if (selected.length === 1)
            next = `Selected ${TYPE_NAMES[selected[0].type]}: ${selected[0].name}`;
          else if (selected.length > 1) next = `${selected.length} elements selected`;
          else if (prev.selection.length) next = "Selection cleared";
        } else if (selected.length === 1 && state.doc !== prev.doc) {
          const before = prev.doc.elements.find((e) => e.id === selected[0].id);
          const el = selected[0];
          if (before && (before.x !== el.x || before.y !== el.y)) {
            next = `Moved to X ${Math.round(el.x)}, Y ${Math.round(el.y)}`;
          }
        }
        if (next && next !== last.current) {
          last.current = next;
          setMessage(next);
        }
      }),
    [],
  );

  return (
    <div role="status" aria-live="polite" className="sr-only">
      {message}
    </div>
  );
}
