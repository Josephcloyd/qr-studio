"use client";

import { useEffect, useRef } from "react";
import { fontStack } from "@/lib/fonts/registry";
import type { TextElement } from "@/lib/model/types";
import { useEditorStore } from "../store/editorStore";

/** Inline text editing: a textarea laid exactly over the text element. */
export function TextEditorOverlay({ el, zoom }: { el: TextElement; zoom: number }) {
  const ref = useRef<HTMLTextAreaElement>(null);
  const updateElement = useEditorStore((s) => s.updateElement);
  const setEditingText = useEditorStore((s) => s.setEditingText);

  useEffect(() => {
    const t = ref.current;
    if (!t) return;
    t.focus();
    t.select();
  }, []);

  const finish = () => setEditingText(null);

  return (
    <textarea
      ref={ref}
      aria-label="Edit text"
      value={el.text}
      spellCheck
      onChange={(e) => updateElement<TextElement>(el.id, { text: e.target.value }, `text:${el.id}`)}
      onBlur={finish}
      onKeyDown={(e) => {
        e.stopPropagation();
        if (e.key === "Escape" || (e.key === "Enter" && (e.metaKey || e.ctrlKey))) {
          e.preventDefault();
          finish();
        }
      }}
      onPointerDown={(e) => e.stopPropagation()}
      className="absolute resize-none overflow-hidden border-0 outline-2 outline-offset-2 outline-cobalt outline-dashed"
      style={{
        left: el.x * zoom,
        top: el.y * zoom,
        width: el.width * zoom,
        height: el.height * zoom,
        transform: el.rotation ? `rotate(${el.rotation}deg)` : undefined,
        transformOrigin: "center",
        padding: el.padding * zoom,
        fontFamily: fontStack(el.fontFamily),
        fontSize: el.fontSize * zoom,
        fontWeight: el.fontWeight,
        fontStyle: el.italic ? "italic" : "normal",
        lineHeight: el.lineHeight,
        letterSpacing: `${el.letterSpacing}em`,
        textAlign: el.align,
        textTransform: el.uppercase ? "uppercase" : "none",
        color: el.color,
        background: el.background ?? "transparent",
        borderRadius: el.cornerRadius * zoom,
        opacity: el.opacity,
        caretColor: "var(--accent)",
      }}
    />
  );
}
