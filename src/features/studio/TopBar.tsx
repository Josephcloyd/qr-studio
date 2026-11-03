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

function MenuItem({
  icon: Icon,
  label,
  shortcut,
  onSelect,
}: {
  icon: typeof Save;
  label: string;
  shortcut?: string;
  onSelect: () => void;
}) {
  return (
    <DropdownMenu.Item
      onSelect={onSelect}
      className="text-ink data-[highlighted]:bg-paper-2 flex h-9 cursor-pointer items-center gap-2.5 rounded-lg px-2.5 text-[13.5px] font-medium outline-none"
    >
      <Icon className="text-ink-3 size-4" aria-hidden="true" />
      <span className="flex-1">{label}</span>
      {shortcut && <kbd className="text-ink-3 font-mono text-[11px]">{shortcut}</kbd>}
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
    <header className="border-line bg-card flex h-14 shrink-0 items-center gap-1.5 border-b px-2 sm:gap-2 sm:px-3">
      <Link
        href="/"
        aria-label="QR Studio home"
        className="hover:bg-paper-2 shrink-0 rounded-lg p-1"
      >
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
          if (
            editor.dirty &&
            editor.doc.elements.length > 0 &&
            !window.confirm("Open this project and replace your current design?")
          )
            return;
          void importProjectFile(file);
        }}
      />
      <DropdownMenu.Root>
        <DropdownMenu.Trigger asChild>
          <button
            type="button"
            aria-label="File menu"
            className="text-ink-2 hover:bg-paper-2 hover:text-ink inline-flex h-9 items-center gap-1.5 rounded-xl px-2 text-[13px] font-semibold"
          >
            <Menu className="size-4" aria-hidden="true" />
            {!compact && "File"}
          </button>
        </DropdownMenu.Trigger>
        <DropdownMenu.Portal>
          <DropdownMenu.Content
            sideOffset={6}
            align="start"
            className="border-line bg-card shadow-pop z-[90] min-w-[240px] rounded-2xl border p-1.5"
          >
            <MenuItem icon={FilePlus2} label="New design" onSelect={() => openDialog("new")} />
            <MenuItem icon={FolderOpen} label="Open project…" onSelect={openProject} />
            <MenuItem
              icon={Save}
              label="Download project file"
              shortcut="Ctrl S"
              onSelect={() => void downloadProject()}
            />
            <DropdownMenu.Separator className="bg-line my-1 h-px" />
            <MenuItem
              icon={Download}
              label="Export…"
              shortcut="Ctrl E"
              onSelect={() => openDialog("export")}
            />
            <MenuItem
              icon={Keyboard}
              label="Keyboard shortcuts"
              shortcut="?"
              onSelect={() => openDialog("shortcuts")}
            />
          </DropdownMenu.Content>
        </DropdownMenu.Portal>
      </DropdownMenu.Root>

      <div className="flex min-w-0 flex-1 items-center gap-2">
        <input
          aria-label="Design name"
          value={name}
          onChange={(e) => rename(e.target.value)}
          className="text-ink hover:border-line focus:border-ink h-9 w-full max-w-[260px] min-w-0 truncate rounded-lg border border-transparent bg-transparent px-2 text-[14px] font-semibold focus:outline-none"
        />
        {dirty && !compact && (
          <span
            className="bg-warning-soft text-warning hidden shrink-0 items-center gap-1.5 rounded-full px-2.5 py-1 text-[11.5px] font-semibold xl:inline-flex"
            title="Nothing is auto-saved. Download the project file to keep your work."
          >
            <span className="bg-warning size-1.5 rounded-full" aria-hidden="true" /> Not saved
            anywhere
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
        <div className="bg-paper-2 hidden items-center rounded-xl p-0.5 md:flex">
          <IconButton label="Zoom out" shortcut="−" size="sm" onClick={() => zoomStep(-1)}>
            <Minus className="size-4" />
          </IconButton>
          <button
            type="button"
            onClick={() => useViewportStore.getState().zoomAt(1)}
            title="Zoom to 100%"
            className="text-ink-2 hover:text-ink w-14 text-center font-mono text-[12px] font-semibold tabular-nums"
          >
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

      <IconButton
        label="Preview"
        onClick={() => openDialog("preview")}
        className={cn(compact && "hidden")}
      >
        <Eye className="size-[18px]" />
      </IconButton>
      <Button variant="primary" size="sm" className="h-9" onClick={() => openDialog("export")}>
        <Download className="size-4" aria-hidden="true" />
        <span className={cn(compact && "sr-only")}>Export</span>
      </Button>
    </header>
  );
}
