"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { cn } from "@/components/ui/cn";
import { Dialog } from "@/components/ui/Dialog";
import { createDocument } from "@/lib/model/factory";
import { CANVAS_PRESETS } from "@/lib/model/presets";
import { formatLength } from "@/lib/model/units";
import { DocumentSvg } from "@/render/DocumentSvg";
import { useAssetResolver } from "@/features/assets/assetStore";
import { pruneUnusedAssets } from "@/features/assets/release";
import { useEditorStore } from "../store/editorStore";
import { useUiStore } from "../store/uiStore";
import { SHORTCUTS } from "../useStudioShortcuts";

export function ShortcutsDialog() {
  const open = useUiStore((s) => s.dialog === "shortcuts");
  const openDialog = useUiStore((s) => s.openDialog);
  return (
    <Dialog
      open={open}
      onOpenChange={(o) => openDialog(o ? "shortcuts" : null)}
      title="Keyboard shortcuts"
      description="On a Mac, use ⌘ instead of Ctrl."
      wide
    >
      <div className="grid gap-6 sm:grid-cols-3">
        {SHORTCUTS.map((g) => (
          <div key={g.group}>
            <h3 className="text-ink-3 mb-2 font-mono text-[11px] font-semibold tracking-[0.14em] uppercase">
              {g.group}
            </h3>
            <dl className="grid gap-1.5">
              {g.items.map((s) => (
                <div
                  key={s.label}
                  className="flex items-baseline justify-between gap-3 text-[13px]"
                >
                  <dt className="text-ink-2">{s.label}</dt>
                  <dd>
                    <kbd className="border-line-strong bg-paper-2 text-ink rounded-md border px-1.5 py-0.5 font-mono text-[11px] whitespace-nowrap">
                      {s.keys}
                    </kbd>
                  </dd>
                </div>
              ))}
            </dl>
          </div>
        ))}
      </div>
    </Dialog>
  );
}

export function PreviewDialog() {
  const open = useUiStore((s) => s.dialog === "preview");
  const openDialog = useUiStore((s) => s.openDialog);
  const doc = useEditorStore((s) => s.doc);
  const measure = useEditorStore((s) => s.measure);
  const resolve = useAssetResolver();
  const physical =
    doc.unit !== "px"
      ? `${formatLength(doc.width, doc.unit)} × ${formatLength(doc.height, doc.unit)}`
      : `${doc.width} × ${doc.height}px`;
  return (
    <Dialog
      open={open}
      onOpenChange={(o) => openDialog(o ? "preview" : null)}
      title="Preview"
      description={`${doc.name} · ${physical}`}
      wide
    >
      <div className="workspace-dots flex min-h-[50vh] items-center justify-center rounded-2xl p-6">
        <div
          className="w-full max-w-[min(100%,70vh)]"
          style={{ aspectRatio: `${doc.width} / ${doc.height}` }}
        >
          <DocumentSvg
            doc={doc}
            resolveAsset={resolve}
            measure={measure}
            idPrefix="pv"
            mode="export"
            className="shadow-pop block h-auto w-full"
            width={doc.width}
            height={doc.height}
          />
        </div>
      </div>
      <p className="text-ink-3 mt-3 text-center text-[12.5px]">
        Tip: hold your phone up to the screen to test-scan your codes.
      </p>
    </Dialog>
  );
}

export function NewDesignDialog() {
  const open = useUiStore((s) => s.dialog === "new");
  const openDialog = useUiStore((s) => s.openDialog);
  const dirty = useEditorStore((s) => s.dirty && s.doc.elements.length > 0);
  const [presetId, setPresetId] = useState(CANVAS_PRESETS[0].id);

  const create = () => {
    const preset = CANVAS_PRESETS.find((p) => p.id === presetId) ?? CANVAS_PRESETS[0];
    useEditorStore.getState().loadDocument(createDocument(preset));
    pruneUnusedAssets();
    useUiStore.getState().setPanel("templates");
    openDialog(null);
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => openDialog(o ? "new" : null)}
      title="New design"
      description={
        dirty
          ? "Your current design isn't saved anywhere — download the project first if you want to keep it."
          : "Pick a size. You can change it later."
      }
      wide
      footer={
        <>
          <Button variant="ghost" onClick={() => openDialog(null)}>
            Cancel
          </Button>
          <Button variant="primary" onClick={create}>
            Create blank design
          </Button>
        </>
      }
    >
      <div
        role="radiogroup"
        aria-label="Canvas size"
        className="grid grid-cols-2 gap-2 sm:grid-cols-3"
      >
        {CANVAS_PRESETS.map((p) => {
          const ratio = p.width / p.height;
          return (
            <button
              key={p.id}
              type="button"
              role="radio"
              aria-checked={presetId === p.id}
              onClick={() => setPresetId(p.id)}
              className={cn(
                "flex items-center gap-3 rounded-2xl border p-3 text-left transition-all",
                presetId === p.id
                  ? "border-ink shadow-[0_0_0_1px_var(--ink)]"
                  : "border-line hover:border-ink-3",
              )}
            >
              <span className="flex size-10 shrink-0 items-center justify-center">
                <span
                  className="border-ink bg-card block border-2"
                  style={{
                    width: ratio >= 1 ? 36 : 36 * ratio,
                    height: ratio >= 1 ? 36 / ratio : 36,
                    borderRadius: p.cornerRadius ? 6 : 2,
                  }}
                />
              </span>
              <span className="min-w-0">
                <span className="text-ink block truncate text-[13px] font-semibold">{p.label}</span>
                <span className="text-ink-3 block truncate text-[11.5px]">{p.description}</span>
              </span>
            </button>
          );
        })}
      </div>
    </Dialog>
  );
}
