"use client";

import { useState } from "react";
import { cn } from "@/components/ui/cn";
import { toast } from "@/components/ui/Toaster";
import { pruneUnusedAssets } from "@/features/assets/release";
import {
  instantiateTemplate,
  TEMPLATE_CATEGORIES,
  TEMPLATES,
  type TemplateCategory,
} from "@/features/templates";
import { TemplateThumbnail } from "@/features/templates/TemplateThumbnail";
import { useEditorStore } from "../../store/editorStore";
import { useUiStore } from "../../store/uiStore";
import { PanelHeading } from "../Section";

export function loadTemplate(id: string, confirmReplace = true): boolean {
  const editor = useEditorStore.getState();
  if (confirmReplace && editor.dirty && editor.doc.elements.length > 0) {
    const ok = window.confirm(
      "Replace your current design with this template? Download your project first if you want to keep it.",
    );
    if (!ok) return false;
  }
  const doc = instantiateTemplate(id);
  if (!doc) return false;
  editor.loadDocument(doc);
  pruneUnusedAssets();
  toast.success(`“${doc.name}” loaded`, "Everything is editable — click any element to change it.");
  return true;
}

export function TemplatesPanel() {
  const [category, setCategory] = useState<TemplateCategory | "All">("All");
  const list = category === "All" ? TEMPLATES : TEMPLATES.filter((t) => t.category === category);
  const setPanel = useUiStore((s) => s.setPanel);
  return (
    <div className="pb-6">
      <PanelHeading title="Templates" subtitle="Starting points — every element stays editable." />
      <div
        className="flex [scrollbar-width:none] gap-1.5 overflow-x-auto px-4 pb-3"
        role="tablist"
        aria-label="Template categories"
      >
        {(["All", ...TEMPLATE_CATEGORIES] as const).map((c) => (
          <button
            key={c}
            type="button"
            role="tab"
            aria-selected={category === c}
            onClick={() => setCategory(c)}
            className={cn(
              "h-8 shrink-0 rounded-full px-3 text-[12.5px] font-semibold transition-colors",
              category === c ? "bg-ink text-paper" : "bg-paper-2 text-ink-2 hover:text-ink",
            )}
          >
            {c}
          </button>
        ))}
      </div>
      <ul className="grid grid-cols-2 gap-3 px-4">
        {list.map((t) => (
          <li key={t.id}>
            <button
              type="button"
              onClick={() => {
                if (loadTemplate(t.id) && window.matchMedia("(max-width: 1023px)").matches)
                  setPanel(null);
              }}
              className="group grid w-full gap-1.5 text-left"
              aria-label={`Use template: ${t.name}`}
            >
              <div className="border-line bg-paper-2 group-hover:border-ink flex aspect-square w-full items-center justify-center rounded-xl border p-2 transition-colors">
                <TemplateThumbnail
                  id={t.id}
                  className="shadow-[0_6px_16px_-8px_rgb(22_19_15/0.45)]"
                />
              </div>
              <span className="text-ink truncate text-[12px] font-semibold">{t.name}</span>
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
