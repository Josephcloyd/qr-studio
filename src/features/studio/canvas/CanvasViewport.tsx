"use client";

import { ImagePlus, LayoutTemplate, QrCode } from "lucide-react";
import { useEffect, useMemo, useRef, useState, useSyncExternalStore, type DragEvent } from "react";
import { useShallow } from "zustand/react/shallow";
import { cn } from "@/components/ui/cn";
import { createImageElement } from "@/lib/model/factory";
import type { TextElement } from "@/lib/model/types";
import { DocumentSvg } from "@/render/DocumentSvg";
import { useAssetResolver } from "@/features/assets/assetStore";
import { useImageUpload } from "@/features/assets/useImageUpload";
import { selectSelectedElements, useEditorStore } from "../store/editorStore";
import { useUiStore } from "../store/uiStore";
import { useViewportStore } from "../store/viewportStore";
import { SelectionOverlay } from "./SelectionOverlay";
import { TextEditorOverlay } from "./TextEditorOverlay";
import { useCanvasGestures } from "./useCanvasGestures";

const COARSE = "(pointer: coarse)";
function subscribeCoarse(onChange: () => void) {
  const mq = window.matchMedia(COARSE);
  mq.addEventListener("change", onChange);
  return () => mq.removeEventListener("change", onChange);
}

export function CanvasViewport({ className }: { className?: string }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const doc = useEditorStore((s) => s.doc);
  const measure = useEditorStore((s) => s.measure);
  const guides = useEditorStore((s) => s.guides);
  const view = useEditorStore((s) => s.view);
  const editingTextId = useEditorStore((s) => s.editingTextId);
  const selected = useEditorStore(useShallow(selectSelectedElements));
  const { zoom, panX, panY } = useViewportStore(
    useShallow((s) => ({ zoom: s.zoom, panX: s.panX, panY: s.panY })),
  );
  const resolveAsset = useAssetResolver();
  const { ingest } = useImageUpload();
  const setPanel = useUiStore((s) => s.setPanel);
  const { handlers, marquee, hoveredId, interacting, panning } = useCanvasGestures(containerRef);
  const coarse = useSyncExternalStore(
    subscribeCoarse,
    () => window.matchMedia(COARSE).matches,
    () => false,
  );
  const [dragOver, setDragOver] = useState(false);

  // Track viewport size; fit the artboard when the document size changes.
  const fitKey = `${doc.id}:${doc.width}x${doc.height}`;
  const lastFit = useRef<string | null>(null);
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const observer = new ResizeObserver(([entry]) => {
      const { width, height } = entry.contentRect;
      const vp = useViewportStore.getState();
      vp.setSize(width, height);
      const { doc: current } = useEditorStore.getState();
      const key = `${current.id}:${current.width}x${current.height}`;
      if (lastFit.current !== key) {
        lastFit.current = key;
        vp.fit(current.width, current.height);
      }
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);
  useEffect(() => {
    if (lastFit.current === fitKey) return;
    const vp = useViewportStore.getState();
    if (!vp.width) return;
    lastFit.current = fitKey;
    vp.fit(doc.width, doc.height);
  }, [fitKey, doc.width, doc.height]);

  const hovered = hoveredId ? (doc.elements.find((e) => e.id === hoveredId) ?? null) : null;
  const editing = editingTextId
    ? doc.elements.find((e): e is TextElement => e.id === editingTextId && e.type === "text")
    : undefined;
  const hiddenIds = useMemo(() => new Set(editing ? [editing.id] : []), [editing]);

  const onDrop = async (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragOver(false);
    const files = [...e.dataTransfer.files].filter((f) => f.type.startsWith("image/"));
    if (!files.length) return;
    const rect = containerRef.current!.getBoundingClientRect();
    const x = (e.clientX - rect.left - panX) / zoom;
    const y = (e.clientY - rect.top - panY) / zoom;
    const added = await ingest(files);
    const editor = useEditorStore.getState();
    added.forEach((asset, i) => {
      const w = Math.min(doc.width * 0.5, asset.width);
      const h = w * (asset.height / asset.width);
      editor.addElement(
        createImageElement(
          asset.id,
          { x: x - w / 2 + i * 16, y: y - h / 2 + i * 16, width: w, height: h },
          asset.name,
        ),
      );
    });
  };

  return (
    <div
      ref={containerRef}
      data-testid="canvas-viewport"
      className={cn(
        "workspace-dots relative h-full w-full touch-none overflow-hidden select-none",
        panning && "cursor-grab",
        className,
      )}
      {...handlers}
      onDragOver={(e) => {
        e.preventDefault();
        setDragOver(true);
      }}
      onDragLeave={() => setDragOver(false)}
      onDrop={onDrop}
    >
      <div
        className="absolute top-0 left-0 will-change-transform"
        style={{ transform: `translate3d(${panX}px, ${panY}px, 0)` }}
      >
        <div
          className="relative shadow-[0_1px_2px_rgb(22_19_15/0.1),0_24px_60px_-24px_rgb(22_19_15/0.45)]"
          style={{
            width: doc.width * zoom,
            height: doc.height * zoom,
            borderRadius: doc.cornerRadius * zoom,
          }}
        >
          <div
            className="checkerboard absolute inset-0 -z-10"
            style={{ borderRadius: doc.cornerRadius * zoom }}
          />
          <DocumentSvg
            doc={doc}
            resolveAsset={resolveAsset}
            measure={measure}
            idPrefix="ed"
            mode="edit"
            width={doc.width * zoom}
            height={doc.height * zoom}
            hiddenIds={hiddenIds}
            className="block"
            title={`Design canvas: ${doc.name}`}
          />
        </div>
        <SelectionOverlay
          width={doc.width}
          height={doc.height}
          zoom={zoom}
          selected={editing ? [] : selected}
          hovered={hovered}
          guides={guides}
          marquee={marquee}
          coarse={coarse}
          showGrid={view.showGrid}
          gridSize={view.gridSize}
          interacting={interacting}
        />
        {editing && <TextEditorOverlay el={editing} zoom={zoom} />}
      </div>

      {doc.elements.length === 0 && (
        <div className="pointer-events-none absolute inset-x-0 bottom-6 flex justify-center px-4">
          <div className="animate-rise border-line bg-card/95 shadow-pop pointer-events-auto flex flex-wrap items-center justify-center gap-2 rounded-2xl border p-2 backdrop-blur">
            <span className="text-ink-2 px-2 text-[13px] font-medium">Start your design:</span>
            <EmptyAction
              icon={LayoutTemplate}
              label="Pick a template"
              onClick={() => setPanel("templates")}
            />
            <EmptyAction icon={QrCode} label="Add a QR code" onClick={() => setPanel("qr")} />
            <EmptyAction
              icon={ImagePlus}
              label="Add an image"
              onClick={() => setPanel("uploads")}
            />
          </div>
        </div>
      )}

      {dragOver && (
        <div className="border-cobalt bg-cobalt-soft/40 pointer-events-none absolute inset-3 flex items-center justify-center rounded-3xl border-2 border-dashed">
          <span className="bg-card text-ink shadow-pop rounded-full px-4 py-2 text-sm font-semibold">
            Drop images to add them — they stay on your device
          </span>
        </div>
      )}
    </div>
  );
}

function EmptyAction({
  icon: Icon,
  label,
  onClick,
}: {
  icon: typeof QrCode;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="bg-paper-2 text-ink hover:bg-ink hover:text-paper inline-flex h-9 items-center gap-2 rounded-xl px-3 text-[13px] font-semibold transition-colors"
    >
      <Icon className="size-4" aria-hidden="true" />
      {label}
    </button>
  );
}
