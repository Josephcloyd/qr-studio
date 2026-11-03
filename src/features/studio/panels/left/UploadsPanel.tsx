"use client";

import { ImagePlus, LockKeyhole, Trash2, Wallpaper } from "lucide-react";
import { useRef } from "react";
import { IconButton } from "@/components/ui/Button";
import { toast } from "@/components/ui/Toaster";
import { ACCEPT_ATTRIBUTE } from "@/lib/assets/intake";
import { createImageElement } from "@/lib/model/factory";
import { useAssetStore, type Asset } from "@/features/assets/assetStore";
import { isAssetInUse } from "@/features/assets/release";
import { useImageUpload } from "@/features/assets/useImageUpload";
import { formatBytes } from "@/features/export/download";
import { useEditorStore } from "../../store/editorStore";
import { PanelHeading } from "../Section";
import { centeredBox, insertElements } from "./insert";

export function UploadsPanel() {
  const inputRef = useRef<HTMLInputElement>(null);
  const { ingest, busy } = useImageUpload();
  const assets = useAssetStore((s) => s.assets);
  const order = useAssetStore((s) => s.order);
  const remove = useAssetStore((s) => s.remove);
  const apply = useEditorStore((s) => s.apply);

  const addToCanvas = (a: Asset) => {
    const box = centeredBox(0.5, a.width / a.height);
    insertElements([createImageElement(a.id, box, a.name)]);
  };

  const handleFiles = async (files: FileList | null) => {
    const added = await ingest(files);
    if (added.length === 1) addToCanvas(added[0]);
    else if (added.length > 1) toast.success(`${added.length} images added`, "Click an image to place it on the canvas.");
  };

  return (
    <div>
      <PanelHeading title="Uploads" subtitle="Logos, photos and artwork for your design." />
      <div className="grid gap-4 px-4 pb-6">
        <input
          ref={inputRef}
          type="file"
          multiple
          accept={ACCEPT_ATTRIBUTE}
          className="sr-only"
          tabIndex={-1}
          aria-hidden="true"
          onChange={(e) => {
            void handleFiles(e.target.files);
            e.target.value = "";
          }}
        />
        <button
          type="button"
          disabled={busy}
          onClick={() => inputRef.current?.click()}
          className="flex flex-col items-center gap-1.5 rounded-2xl border-2 border-dashed border-line-strong bg-paper/60 px-4 py-6 text-center transition-colors hover:border-ink hover:bg-card"
        >
          <ImagePlus className="size-6 text-ink-3" aria-hidden="true" />
          <span className="text-sm font-semibold text-ink">{busy ? "Reading…" : "Choose images"}</span>
          <span className="text-[12px] text-ink-3">or drag them onto the canvas · PNG, JPEG, WebP, SVG</span>
        </button>
        <p className="flex items-start gap-1.5 text-[12px] leading-snug text-ink-3">
          <LockKeyhole className="mt-px size-3.5 shrink-0" aria-hidden="true" />
          Images are opened by your browser and kept in memory on this device. They are never uploaded.
        </p>

        {order.length > 0 ? (
          <ul className="grid grid-cols-2 gap-2" aria-label="Your images">
            {order.map((id) => {
              const a = assets[id];
              if (!a) return null;
              const inUse = isAssetInUse(id);
              return (
                <li key={id} className="group relative overflow-hidden rounded-xl border border-line bg-card">
                  <button type="button" onClick={() => addToCanvas(a)} className="checkerboard block aspect-square w-full" aria-label={`Add ${a.name} to the canvas`}>
                    {/* eslint-disable-next-line @next/next/no-img-element -- local object URL */}
                    <img src={a.url} alt="" className="size-full object-contain p-2" />
                  </button>
                  <div className="flex items-center gap-1 border-t border-line px-2 py-1">
                    <span className="min-w-0 flex-1 truncate text-[11px] text-ink-3" title={`${a.name} · ${formatBytes(a.bytes)}`}>
                      {a.name}
                    </span>
                    <IconButton label="Use as background" size="sm" onClick={() => apply((d) => ({ ...d, background: { ...d.background, imageAssetId: id } }))}>
                      <Wallpaper className="size-3.5" />
                    </IconButton>
                    <IconButton label={inUse ? "In use in your design" : "Remove image"} size="sm" disabled={inUse} onClick={() => remove(id)}>
                      <Trash2 className="size-3.5" />
                    </IconButton>
                  </div>
                </li>
              );
            })}
          </ul>
        ) : (
          <p className="rounded-xl bg-paper-2 px-3 py-4 text-center text-[12.5px] text-ink-3">No images yet.</p>
        )}
      </div>
    </div>
  );
}
