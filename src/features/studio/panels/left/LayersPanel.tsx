"use client";

import {
  ChevronDown,
  ChevronUp,
  Eye,
  EyeOff,
  Image as ImageIcon,
  Lock,
  LockOpen,
  QrCode,
  Shapes,
  Sticker,
  Type,
  type LucideIcon,
} from "lucide-react";
import { useState } from "react";
import { IconButton } from "@/components/ui/Button";
import { cn } from "@/components/ui/cn";
import { moveElementTo, updateElement } from "@/lib/model/ops";
import type { DesignElement } from "@/lib/model/types";
import { useEditorStore } from "../../store/editorStore";
import { PanelHeading } from "../Section";

const TYPE_ICONS: Record<DesignElement["type"], LucideIcon> = {
  qr: QrCode,
  text: Type,
  image: ImageIcon,
  shape: Shapes,
  icon: Sticker,
};

export function LayersPanel() {
  const elements = useEditorStore((s) => s.doc.elements);
  const selection = useEditorStore((s) => s.selection);
  const select = useEditorStore((s) => s.select);
  const toggleSelect = useEditorStore((s) => s.toggleSelect);
  const apply = useEditorStore((s) => s.apply);
  const setHidden = useEditorStore((s) => s.setElementHidden);
  const [dragId, setDragId] = useState<string | null>(null);
  const [renaming, setRenaming] = useState<string | null>(null);

  // Front-most first, like most design tools.
  const rows = [...elements].reverse();
  const indexOf = (id: string) => elements.findIndex((e) => e.id === id);

  return (
    <div className="pb-6">
      <PanelHeading title="Layers" subtitle="Top of the list is in front. Drag to reorder." />
      {rows.length === 0 ? (
        <p className="bg-paper-2 text-ink-3 mx-4 rounded-xl px-3 py-4 text-center text-[12.5px]">
          Nothing on the canvas yet.
        </p>
      ) : (
        <ul className="grid gap-1 px-2" aria-label="Layers">
          {rows.map((el) => {
            const Icon = TYPE_ICONS[el.type];
            const active = selection.includes(el.id);
            const idx = indexOf(el.id);
            return (
              <li
                key={el.id}
                draggable={renaming !== el.id}
                onDragStart={() => setDragId(el.id)}
                onDragOver={(e) => e.preventDefault()}
                onDrop={() => {
                  if (dragId && dragId !== el.id)
                    apply((d) => moveElementTo(d, dragId, indexOf(el.id)));
                  setDragId(null);
                }}
                className={cn(
                  "group flex items-center gap-2 rounded-xl border px-2 py-1.5 transition-colors",
                  active
                    ? "border-cobalt bg-cobalt-soft/60"
                    : "hover:bg-paper-2 border-transparent",
                  dragId === el.id && "opacity-50",
                )}
              >
                <Icon className="text-ink-3 size-4 shrink-0" aria-hidden="true" />
                {renaming === el.id ? (
                  <input
                    autoFocus
                    defaultValue={el.name}
                    aria-label="Layer name"
                    onBlur={(e) => {
                      const name = e.target.value.trim().slice(0, 120);
                      if (name && name !== el.name) apply((d) => updateElement(d, el.id, { name }));
                      setRenaming(null);
                    }}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") (e.target as HTMLInputElement).blur();
                      if (e.key === "Escape") setRenaming(null);
                    }}
                    className="border-ink bg-card h-7 min-w-0 flex-1 rounded-md border px-1.5 text-[13px] focus:outline-none"
                  />
                ) : (
                  <button
                    type="button"
                    onClick={(e) => (e.shiftKey ? toggleSelect(el.id) : select([el.id]))}
                    onDoubleClick={() => setRenaming(el.id)}
                    onKeyDown={(e) => e.key === "F2" && (e.preventDefault(), setRenaming(el.id))}
                    aria-pressed={active}
                    className={cn(
                      "min-w-0 flex-1 truncate text-left text-[13px] font-medium",
                      el.hidden ? "text-ink-3 line-through" : "text-ink",
                    )}
                    title="Click to select · double-click or F2 to rename"
                  >
                    {el.name}
                  </button>
                )}
                <div className="flex items-center opacity-70 group-hover:opacity-100">
                  <IconButton
                    label={`Move ${el.name} up`}
                    size="sm"
                    disabled={idx === elements.length - 1}
                    onClick={() => apply((d) => moveElementTo(d, el.id, idx + 1))}
                  >
                    <ChevronUp className="size-3.5" />
                  </IconButton>
                  <IconButton
                    label={`Move ${el.name} down`}
                    size="sm"
                    disabled={idx === 0}
                    onClick={() => apply((d) => moveElementTo(d, el.id, idx - 1))}
                  >
                    <ChevronDown className="size-3.5" />
                  </IconButton>
                  <IconButton
                    label={`Hide ${el.name}`}
                    active={el.hidden}
                    size="sm"
                    onClick={() => setHidden(el.id, !el.hidden)}
                  >
                    {el.hidden ? <EyeOff className="size-3.5" /> : <Eye className="size-3.5" />}
                  </IconButton>
                  <IconButton
                    label={`Lock ${el.name}`}
                    size="sm"
                    active={el.locked}
                    onClick={() => apply((d) => updateElement(d, el.id, { locked: !el.locked }))}
                  >
                    {el.locked ? <Lock className="size-3.5" /> : <LockOpen className="size-3.5" />}
                  </IconButton>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
