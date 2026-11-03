"use client";

import { PanelLeftClose, SlidersHorizontal, X } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { useShallow } from "zustand/react/shallow";
import { cn } from "@/components/ui/cn";
import { IconButton, TooltipProvider } from "@/components/ui/Button";
import { downloadProject } from "@/features/project/projectIO";
import { CanvasViewport } from "./canvas/CanvasViewport";
import { ExportDialog } from "./dialogs/ExportDialog";
import { NewDesignDialog, PreviewDialog, ShortcutsDialog } from "./dialogs/OtherDialogs";
import { MobileContextBar } from "./MobileContextBar";
import { PropertiesPanel } from "./panels/right/PropertiesPanel";
import { selectSelectedElements, useEditorStore } from "./store/editorStore";
import { useUiStore } from "./store/uiStore";
import { ActivePanel, TOOLS } from "./ToolPanels";
import { TopBar } from "./TopBar";
import { useFontsReady } from "./useFontsReady";
import { useStudioShortcuts, useUnsavedWarning } from "./useStudioShortcuts";
import { loadTemplate } from "./panels/left/TemplatesPanel";

function useIsDesktop(): boolean | null {
  const [desktop, setDesktop] = useState<boolean | null>(null);
  useEffect(() => {
    const mq = window.matchMedia("(min-width: 1024px)");
    const update = () => setDesktop(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);
  return desktop;
}

/** `/studio/?template=<id>` opens a template directly (links from the gallery). */
function useTemplateParam() {
  useEffect(() => {
    const id = new URLSearchParams(window.location.search).get("template");
    if (!id || !/^[a-z0-9-]{1,60}$/.test(id)) return;
    loadTemplate(id, true);
    window.history.replaceState(null, "", window.location.pathname);
  }, []);
}

function ToolRail({ vertical }: { vertical: boolean }) {
  const panel = useUiStore((s) => s.panel);
  const toggle = useUiStore((s) => s.togglePanel);
  return (
    <nav
      aria-label="Tools"
      className={cn(
        "bg-card flex shrink-0",
        vertical
          ? "border-line w-[76px] flex-col gap-0.5 border-r px-1.5 py-2"
          : "border-line h-[68px] [scrollbar-width:none] items-stretch gap-0.5 overflow-x-auto border-t px-1",
      )}
    >
      {TOOLS.map(({ id, label, Icon }) => {
        const active = panel === id;
        return (
          <button
            key={id}
            type="button"
            aria-pressed={active}
            onClick={() => toggle(id)}
            className={cn(
              "flex shrink-0 flex-col items-center justify-center gap-1 rounded-xl font-medium transition-colors",
              vertical ? "h-[62px] text-[10.5px]" : "w-[68px] text-[10.5px]",
              active ? "bg-ink text-paper" : "text-ink-3 hover:bg-paper-2 hover:text-ink",
            )}
          >
            <Icon className={cn("size-[20px]", active && "text-accent")} aria-hidden="true" />
            {label}
          </button>
        );
      })}
    </nav>
  );
}

function DesktopStudio() {
  const panel = useUiStore((s) => s.panel);
  const setPanel = useUiStore((s) => s.setPanel);
  return (
    <div className="bg-paper flex h-dvh flex-col overflow-hidden">
      <TopBar />
      <div className="flex min-h-0 flex-1">
        <ToolRail vertical />
        {panel && (
          <aside
            aria-label="Tool panel"
            className="border-line bg-card relative w-[320px] shrink-0 overflow-y-auto border-r"
          >
            <IconButton
              label="Close panel"
              size="sm"
              className="absolute top-3 right-2 z-10"
              onClick={() => setPanel(null)}
            >
              <PanelLeftClose className="size-4" />
            </IconButton>
            <ActivePanel id={panel} />
          </aside>
        )}
        <main className="relative min-w-0 flex-1" aria-label="Canvas">
          <CanvasViewport />
        </main>
        <aside
          aria-label="Properties"
          className="border-line bg-card w-[320px] shrink-0 overflow-y-auto border-l"
        >
          <PropertiesPanel />
        </aside>
      </div>
    </div>
  );
}

function BottomSheet({
  title,
  onClose,
  children,
}: {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className="absolute inset-x-0 bottom-0 z-30 flex max-h-[62%] flex-col">
      <div
        className="animate-sheet border-line bg-card flex min-h-0 flex-col rounded-t-3xl border-t shadow-[0_-12px_40px_-12px_rgb(22_19_15/0.35)]"
        role="dialog"
        aria-label={title}
      >
        <div className="flex items-center justify-between px-4 pt-2">
          <span
            className="bg-line-strong mx-auto mb-1 h-1.5 w-10 rounded-full"
            aria-hidden="true"
          />
        </div>
        <div className="flex items-center justify-between px-3">
          <span className="sr-only">{title}</span>
          <IconButton label={`Close ${title}`} size="sm" className="ml-auto" onClick={onClose}>
            <X className="size-4" />
          </IconButton>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain pb-[env(safe-area-inset-bottom)]">
          {children}
        </div>
      </div>
    </div>
  );
}

function MobileStudio() {
  const panel = useUiStore((s) => s.panel);
  const setPanel = useUiStore((s) => s.setPanel);
  const propertiesOpen = useUiStore((s) => s.propertiesOpen);
  const setPropertiesOpen = useUiStore((s) => s.setPropertiesOpen);
  const selected = useEditorStore(useShallow(selectSelectedElements));
  const tool = TOOLS.find((t) => t.id === panel);

  // Start with the canvas visible on phones.
  useEffect(() => setPanel(null), [setPanel]);
  useEffect(() => {
    if (!selected.length) setPropertiesOpen(false);
  }, [selected.length, setPropertiesOpen]);

  return (
    <div className="bg-paper flex h-dvh flex-col overflow-hidden">
      <TopBar compact />
      <main className="relative min-h-0 flex-1" aria-label="Canvas">
        <CanvasViewport />
        {selected.length > 0 && !panel && !propertiesOpen && (
          <MobileContextBar onEdit={() => setPropertiesOpen(true)} />
        )}
        {!selected.length && !panel && (
          <button
            type="button"
            onClick={() => setPropertiesOpen(true)}
            className="border-line bg-card text-ink shadow-sheet absolute top-3 right-3 inline-flex h-10 items-center gap-2 rounded-xl border px-3 text-[13px] font-semibold"
          >
            <SlidersHorizontal className="size-4" aria-hidden="true" /> Canvas
          </button>
        )}
        {tool && (
          <BottomSheet title={tool.label} onClose={() => setPanel(null)}>
            <ActivePanel id={tool.id} />
          </BottomSheet>
        )}
        {propertiesOpen && !tool && (
          <BottomSheet title="Properties" onClose={() => setPropertiesOpen(false)}>
            <PropertiesPanel />
          </BottomSheet>
        )}
      </main>
      <ToolRail vertical={false} />
    </div>
  );
}

export function StudioApp() {
  const desktop = useIsDesktop();
  const save = useCallback(() => void downloadProject(), []);
  useFontsReady();
  useStudioShortcuts(save);
  useUnsavedWarning();
  useTemplateParam();

  return (
    <TooltipProvider delayDuration={350}>
      {desktop === null ? (
        <div className="bg-paper text-ink-3 flex h-dvh items-center justify-center text-sm">
          Opening the studio…
        </div>
      ) : desktop ? (
        <DesktopStudio />
      ) : (
        <MobileStudio />
      )}
      <ExportDialog />
      <PreviewDialog />
      <ShortcutsDialog />
      <NewDesignDialog />
    </TooltipProvider>
  );
}
