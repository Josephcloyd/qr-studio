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
  const removeAsset = useAssetStore((s) => s.remove);
  const apply = useEditorStore((s) => s.apply);
  // Re-render when the design or its undo history changes, so "in use" stays accurate.
  useEditorStore((s) => s.doc);
  useEditorStore((s) => s.history);
  const remove = (id: string) => {
    if (isAssetInUse(id)) {
      toast.info("This image is in your design", "Delete it from the canvas first.");
      return;
    }
    removeAsset(id);
  };

  const addToCanvas = (a: Asset) => {
    const box = centeredBox(0.5, a.width / a.height);
    insertElements([createImageElement(a.id, box, a.name)]);
  };

  const handleFiles = async (files: FileList | null) => {
    const added = await ingest(files);
    if (added.length === 1) addToCanvas(added[0]);
    else if (added.length > 1)
      toast.success(`${added.length} images added`, "Click an image to place it on the canvas.");
  };

  return (
    <div>
      <PanelHeading title="Images" subtitle="Logos, photos and artwork from your device." />
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
          className="border-line-strong bg-paper/60 hover:border-ink hover:bg-card flex flex-col items-center gap-1.5 rounded-2xl border-2 border-dashed px-4 py-6 text-center transition-colors"
        >
          <ImagePlus className="text-ink-3 size-6" aria-hidden="true" />
          <span className="text-ink text-sm font-semibold">
            {busy ? "Reading…" : "Choose images"}
          </span>
          <span className="text-ink-3 text-[12px]">
            or drag them onto the canvas · PNG, JPEG, WebP, SVG
          </span>
        </button>
        <p className="text-ink-3 flex items-start gap-1.5 text-[12px] leading-snug">
          <LockKeyhole className="mt-px size-3.5 shrink-0" aria-hidden="true" />
          Images are opened by your browser and kept in memory on this device. They are never
          uploaded.
        </p>

        {order.length > 0 ? (
          <ul className="grid grid-cols-2 gap-2" aria-label="Your images">
            {order.map((id) => {
              const a = assets[id];
              if (!a) return null;
              const inUse = isAssetInUse(id);
              return (
                <li
                  key={id}
                  className="group border-line bg-card relative overflow-hidden rounded-xl border"
                >
                  <button
                    type="button"
                    onClick={() => addToCanvas(a)}
                    className="checkerboard block aspect-square w-full"
                    aria-label={`Add ${a.name} to the canvas`}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element -- local object URL */}
                    <img src={a.url} alt="" className="size-full object-contain p-2" />
                  </button>
                  <div className="border-line flex items-center gap-1 border-t px-2 py-1">
                    <span
                      className="text-ink-3 min-w-0 flex-1 truncate text-[11px]"
                      title={`${a.name} · ${formatBytes(a.bytes)}`}
                    >
                      {a.name}
                    </span>
                    <IconButton
                      label="Use as background"
                      size="sm"
                      onClick={() =>
                        apply((d) => ({ ...d, background: { ...d.background, imageAssetId: id } }))
                      }
                    >
                      <Wallpaper className="size-3.5" />
                    </IconButton>
                    <IconButton
                      label={inUse ? "In use in your design" : "Remove image"}
                      size="sm"
                      disabled={inUse}
                      onClick={() => remove(id)}
                    >
                      <Trash2 className="size-3.5" />
                    </IconButton>
                  </div>
                </li>
              );
            })}
          </ul>
        ) : (
          <p className="bg-paper-2 text-ink-3 rounded-xl px-3 py-4 text-center text-[12.5px]">
            No images yet.
          </p>
        )}
      </div>
    </div>
  );
}
