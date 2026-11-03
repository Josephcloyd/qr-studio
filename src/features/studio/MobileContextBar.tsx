"use client";

import { ArrowDownToLine, ArrowUpToLine, Copy, Pencil, SlidersHorizontal, Trash2 } from "lucide-react";
import { useEditorStore } from "./store/editorStore";

/** Floating, thumb-sized actions for the current selection on phones. */
export function MobileContextBar({ onEdit }: { onEdit: () => void }) {
  const selection = useEditorStore((s) => s.selection);
  const doc = useEditorStore((s) => s.doc);
  const duplicate = useEditorStore((s) => s.duplicateSelection);
  const remove = useEditorStore((s) => s.deleteSelection);
  const reorder = useEditorStore((s) => s.reorderSelection);
  const setEditingText = useEditorStore((s) => s.setEditingText);
  const single = selection.length === 1 ? doc.elements.find((e) => e.id === selection[0]) : undefined;

  const actions = [
    { label: "Edit", Icon: SlidersHorizontal, onClick: onEdit },
    ...(single?.type === "text" && !single.locked ? [{ label: "Type", Icon: Pencil, onClick: () => setEditingText(single.id) }] : []),
    { label: "Copy", Icon: Copy, onClick: duplicate },
    { label: "Front", Icon: ArrowUpToLine, onClick: () => reorder("front") },
    { label: "Back", Icon: ArrowDownToLine, onClick: () => reorder("back") },
    { label: "Delete", Icon: Trash2, onClick: remove },
  ];

  return (
    <div className="animate-rise absolute inset-x-3 bottom-3 z-20 flex justify-center">
      <div role="toolbar" aria-label="Selection actions" className="flex gap-1 rounded-2xl border border-line bg-card p-1.5 shadow-pop">
        {actions.map(({ label, Icon, onClick }) => (
          <button
            key={label}
            type="button"
            onClick={onClick}
            className="flex h-14 w-14 flex-col items-center justify-center gap-1 rounded-xl text-[10.5px] font-semibold text-ink-2 active:bg-paper-2"
          >
            <Icon className="size-5" aria-hidden="true" />
            {label}
          </button>
        ))}
      </div>
    </div>
  );
}
