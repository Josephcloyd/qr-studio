"use client";

import { DropdownMenu } from "radix-ui";
import {
  Download,
  Eye,
  FilePlus2,
  FolderOpen,
  Keyboard,
  Maximize,
  Menu,
  Minus,
  Plus,
  Redo2,
  Save,
  Undo2,
} from "lucide-react";
import { useRef } from "react";
import { BrandMark } from "@/components/site/Brand";
import { Button, IconButton } from "@/components/ui/Button";
import { cn } from "@/components/ui/cn";
import { PROJECT_EXTENSION } from "@/lib/project/projectFile";
import { downloadProject, importProjectFile } from "@/features/project/projectIO";
import { useEditorStore } from "./store/editorStore";
import { useUiStore } from "./store/uiStore";
import { useViewportStore } from "./store/viewportStore";
import Link from "next/link";

function MenuItem({ icon: Icon, label, shortcut, onSelect }: { icon: typeof Save; label: string; shortcut?: string; onSelect: () => void }) {
  return (
    <DropdownMenu.Item
      onSelect={onSelect}
      className="flex h-9 cursor-pointer items-center gap-2.5 rounded-lg px-2.5 text-[13.5px] font-medium text-ink outline-none data-[highlighted]:bg-paper-2"
    >
      <Icon className="size-4 text-ink-3" aria-hidden="true" />
      <span className="flex-1">{label}</span>
      {shortcut && <kbd className="font-mono text-[11px] text-ink-3">{shortcut}</kbd>}
    </DropdownMenu.Item>
  );
}

export function TopBar({ compact = false }: { compact?: boolean }) {
  const fileRef = useRef<HTMLInputElement>(null);
  const name = useEditorStore((s) => s.doc.name);
  const rename = useEditorStore((s) => s.renameDocument);
  const canUndo = useEditorStore((s) => s.history.past.length > 0);
  const canRedo = useEditorStore((s) => s.history.future.length > 0);
  const undo = useEditorStore((s) => s.undo);
  const redo = useEditorStore((s) => s.redo);
  const dirty = useEditorStore((s) => s.dirty && s.doc.elements.length > 0);
  const zoom = useViewportStore((s) => s.zoom);
  const zoomStep = useViewportStore((s) => s.zoomStep);
  const openDialog = useUiStore((s) => s.openDialog);

  const fit = () => {
    const { doc } = useEditorStore.getState();
    useViewportStore.getState().fit(doc.width, doc.height);
  };
  const openProject = () => fileRef.current?.click();

  return (
    <header className="flex h-14 shrink-0 items-center gap-1.5 border-b border-line bg-card px-2 sm:gap-2 sm:px-3">
      <Link href="/" aria-label="QR Studio home" className="shrink-0 rounded-lg p-1 hover:bg-paper-2">
        <BrandMark className="size-7" />
      </Link>
      <input
        ref={fileRef}
        type="file"
        accept={`${PROJECT_EXTENSION},.json,application/json`}
        className="sr-only"
        tabIndex={-1}
        aria-hidden="true"
        onChange={(e) => {
          const file = e.target.files?.[0];
          e.target.value = "";
          if (!file) return;
          const editor = useEditorStore.getState();
          if (editor.dirty && editor.doc.elements.length > 0 && !window.confirm("Open this project and replace your current design?")) return;
          void importProjectFile(file);
        }}
      />
      <DropdownMenu.Root>
        <DropdownMenu.Trigger asChild>
          <button type="button" aria-label="File menu" className="inline-flex h-9 items-center gap-1.5 rounded-xl px-2 text-[13px] font-semibold text-ink-2 hover:bg-paper-2 hover:text-ink">
            <Menu className="size-4" aria-hidden="true" />
            {!compact && "File"}
          </button>
        </DropdownMenu.Trigger>
        <DropdownMenu.Portal>
          <DropdownMenu.Content sideOffset={6} align="start" className="z-[90] min-w-[240px] rounded-2xl border border-line bg-card p-1.5 shadow-pop">
            <MenuItem icon={FilePlus2} label="New design" onSelect={() => openDialog("new")} />
            <MenuItem icon={FolderOpen} label="Open project…" onSelect={openProject} />
            <MenuItem icon={Save} label="Download project file" shortcut="Ctrl S" onSelect={() => void downloadProject()} />
            <DropdownMenu.Separator className="my-1 h-px bg-line" />
            <MenuItem icon={Download} label="Export…" shortcut="Ctrl E" onSelect={() => openDialog("export")} />
            <MenuItem icon={Keyboard} label="Keyboard shortcuts" shortcut="?" onSelect={() => openDialog("shortcuts")} />
          </DropdownMenu.Content>
        </DropdownMenu.Portal>
      </DropdownMenu.Root>

      <div className="flex min-w-0 flex-1 items-center gap-2">
        <input
          aria-label="Design name"
          value={name}
          onChange={(e) => rename(e.target.value)}
          className="h-9 w-full max-w-[260px] min-w-0 truncate rounded-lg border border-transparent bg-transparent px-2 text-[14px] font-semibold text-ink hover:border-line focus:border-ink focus:outline-none"
        />
        {dirty && !compact && (
          <span className="hidden shrink-0 items-center gap-1.5 rounded-full bg-warning-soft px-2.5 py-1 text-[11.5px] font-semibold text-warning xl:inline-flex" title="Nothing is auto-saved. Download the project file to keep your work.">
            <span className="size-1.5 rounded-full bg-warning" aria-hidden="true" /> Not saved anywhere
          </span>
        )}
      </div>

      <div className="flex items-center">
        <IconButton label="Undo" shortcut="Ctrl Z" disabled={!canUndo} onClick={undo}>
          <Undo2 className="size-[18px]" />
        </IconButton>
        <IconButton label="Redo" shortcut="Ctrl Shift Z" disabled={!canRedo} onClick={redo}>
          <Redo2 className="size-[18px]" />
        </IconButton>
      </div>

      {!compact && (
        <div className="hidden items-center rounded-xl bg-paper-2 p-0.5 md:flex">
          <IconButton label="Zoom out" shortcut="−" size="sm" onClick={() => zoomStep(-1)}>
            <Minus className="size-4" />
          </IconButton>
          <button type="button" onClick={() => useViewportStore.getState().zoomAt(1)} title="Zoom to 100%" className="w-14 text-center font-mono text-[12px] font-semibold text-ink-2 tabular-nums hover:text-ink">
            {Math.round(zoom * 100)}%
          </button>
          <IconButton label="Zoom in" shortcut="+" size="sm" onClick={() => zoomStep(1)}>
            <Plus className="size-4" />
          </IconButton>
          <IconButton label="Fit to screen" shortcut="Shift 1" size="sm" onClick={fit}>
            <Maximize className="size-4" />
          </IconButton>
        </div>
      )}

      <IconButton label="Preview" onClick={() => openDialog("preview")} className={cn(compact && "hidden")}>
        <Eye className="size-[18px]" />
      </IconButton>
      <Button variant="primary" size="sm" className="h-9" onClick={() => openDialog("export")}>
        <Download className="size-4" aria-hidden="true" />
        <span className={cn(compact && "sr-only")}>Export</span>
      </Button>
    </header>
  );
}
