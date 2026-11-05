"use client";

import { Maximize, Minus, PanelLeftClose, Plus, SlidersHorizontal, X } from "lucide-react";
import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { useShallow } from "zustand/react/shallow";
import { BugReportBubble } from "@/components/site/ReportBug";
import { finishSplash } from "@/components/site/splash";
import { cn } from "@/components/ui/cn";
import { IconButton, TooltipProvider } from "@/components/ui/Button";
import { toast } from "@/components/ui/Toaster";
import { downloadProject } from "@/features/project/projectIO";
import { getTemplate } from "@/features/templates";
import { CanvasViewport } from "./canvas/CanvasViewport";
import { ExportDialog } from "./dialogs/ExportDialog";
import { NewDesignDialog, PreviewDialog, ShortcutsDialog } from "./dialogs/OtherDialogs";
import { MobileContextBar } from "./MobileContextBar";
import { loadTemplate } from "./panels/left/TemplatesPanel";
import { PropertiesPanel } from "./panels/right/PropertiesPanel";
import { selectSelectedElements, useEditorStore } from "./store/editorStore";
import { useUiStore } from "./store/uiStore";
import { useViewportStore } from "./store/viewportStore";
import { StudioAnnouncer } from "./StudioAnnouncer";
import { ActivePanel, TOOLS } from "./ToolPanels";
import { TopBar } from "./TopBar";
import { useFontsReady } from "./useFontsReady";
import { useStudioShortcuts } from "./useStudioShortcuts";

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
    if (!id) return;
    window.history.replaceState(null, "", window.location.pathname);
    if (!/^[a-z0-9-]{1,60}$/.test(id) || !getTemplate(id)) {
      toast.error("Template not found", "Pick one from the Templates tab instead.");
      return;
    }
    loadTemplate(id, true);
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
          : "border-line h-[68px] [scrollbar-width:none] items-stretch gap-0.5 overflow-x-auto border-t px-1 py-1",
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
              active
                ? "bg-accent-soft text-accent-ink"
                : "text-ink-3 hover:bg-paper-2 hover:text-ink",
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
          <BugReportBubble position="absolute" />
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

/**
 * Non-modal sheet for phones: moves focus in when opened, closes on Escape
 * and returns focus to whatever opened it.
 */
function BottomSheet({
  title,
  onClose,
  children,
}: {
  title: string;
  onClose: () => void;
  children: ReactNode;
}) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const opener = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    ref.current?.focus({ preventScroll: true });
    return () => {
      if (opener && document.contains(opener)) opener.focus({ preventScroll: true });
    };
  }, []);
  return (
    <div className="absolute inset-x-0 bottom-0 z-30 flex max-h-[62%] flex-col">
      <div
        ref={ref}
        tabIndex={-1}
        role="dialog"
        aria-label={title}
        onKeyDown={(e) => {
          if (e.key === "Escape") {
            e.stopPropagation();
            onClose();
          }
        }}
        className="animate-sheet border-line bg-card flex min-h-0 flex-col rounded-t-3xl border-t shadow-[0_-12px_40px_-12px_rgb(22_19_15/0.35)] focus:outline-none"
      >
        <div className="flex items-center justify-between px-3 pt-2">
          <span className="bg-line-strong mx-auto h-1.5 w-10 rounded-full" aria-hidden="true" />
        </div>
        <div className="flex items-center justify-end px-3">
          <IconButton label={`Close ${title}`} size="md" onClick={onClose}>
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

/** Zoom buttons for touch screens — pinch is not the only way to zoom (WCAG 2.5.1). */
function MobileZoom() {
  const zoomStep = useViewportStore((s) => s.zoomStep);
  const fit = () => {
    const { doc } = useEditorStore.getState();
    useViewportStore.getState().fit(doc.width, doc.height);
  };
  return (
    <div className="border-line bg-card shadow-sheet absolute top-3 left-3 flex rounded-xl border p-0.5">
      <IconButton label="Zoom out" size="md" onClick={() => zoomStep(-1)}>
        <Minus className="size-4" />
      </IconButton>
      <IconButton label="Zoom to fit" size="md" onClick={fit}>
        <Maximize className="size-4" />
      </IconButton>
      <IconButton label="Zoom in" size="md" onClick={() => zoomStep(1)}>
        <Plus className="size-4" />
      </IconButton>
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

  useEffect(() => {
    if (!selected.length) setPropertiesOpen(false);
  }, [selected.length, setPropertiesOpen]);

  return (
    <div className="bg-paper flex h-dvh flex-col overflow-hidden">
      <TopBar compact />
      <main className="relative min-h-0 flex-1" aria-label="Canvas">
        <CanvasViewport />
        {!tool && !propertiesOpen && <MobileZoom />}
        {selected.length > 0 && !panel && !propertiesOpen && (
          <MobileContextBar onEdit={() => setPropertiesOpen(true)} />
        )}
        {!selected.length && !panel && (
          <button
            type="button"
            onClick={() => setPropertiesOpen(true)}
            className="border-line bg-card text-ink shadow-sheet absolute top-3 right-3 inline-flex h-11 items-center gap-2 rounded-xl border px-3 text-[13px] font-semibold"
          >
            <SlidersHorizontal className="size-4" aria-hidden="true" /> Canvas
          </button>
        )}
        {/* Only on an empty selection, so it never covers the context bar or a sheet. */}
        {!selected.length && !panel && !propertiesOpen && (
          <BugReportBubble position="absolute" className="right-3 bottom-3" />
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
  // Keep the GetLaunch PH loading screen up until the editor layout is known.
  useEffect(() => {
    if (desktop !== null) finishSplash();
  }, [desktop]);
  useFontsReady();
  useStudioShortcuts(save);
  useTemplateParam();

  return (
    <TooltipProvider delayDuration={350}>
      <h1 className="sr-only">QR Studio design editor</h1>
      {desktop === null ? (
        <div className="bg-paper text-ink-3 flex h-dvh items-center justify-center text-sm">
          Opening the studio…
        </div>
      ) : desktop ? (
        <DesktopStudio />
      ) : (
        <MobileStudio />
      )}
      <StudioAnnouncer />
      <ExportDialog />
      <PreviewDialog />
      <ShortcutsDialog />
      <NewDesignDialog />
    </TooltipProvider>
  );
}
