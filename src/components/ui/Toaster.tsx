"use client";

import { CheckCircle2, CircleAlert, Info, X } from "lucide-react";
import { create } from "zustand";
import { cn } from "./cn";

type ToastKind = "success" | "error" | "info";

interface ToastItem {
  id: number;
  kind: ToastKind;
  title: string;
  description?: string;
}

interface ToastState {
  items: ToastItem[];
  push: (t: Omit<ToastItem, "id">) => void;
  dismiss: (id: number) => void;
}

let counter = 0;
const DURATION_MS = 4200;

/** True while the pointer or keyboard focus is on the toast stack (WCAG 2.2.1). */
let paused = false;

const useToasts = create<ToastState>((set, get) => ({
  items: [],
  push: (t) => {
    const id = ++counter;
    set({ items: [...get().items.slice(-3), { ...t, id }] });
    // Errors stay until dismissed; others time out, but never while being read.
    if (t.kind === "error") return;
    const later = () => setTimeout(() => (paused ? later() : get().dismiss(id)), DURATION_MS);
    later();
  },
  dismiss: (id) => set({ items: get().items.filter((i) => i.id !== id) }),
}));

export const toast = {
  success: (title: string, description?: string) =>
    useToasts.getState().push({ kind: "success", title, description }),
  error: (title: string, description?: string) =>
    useToasts.getState().push({ kind: "error", title, description }),
  info: (title: string, description?: string) =>
    useToasts.getState().push({ kind: "info", title, description }),
};

const ICONS = { success: CheckCircle2, error: CircleAlert, info: Info };
const TONES = { success: "text-success", error: "text-danger", info: "text-cobalt" };

export function Toaster() {
  const items = useToasts((s) => s.items);
  const dismiss = useToasts((s) => s.dismiss);
  return (
    <div
      aria-live="polite"
      onPointerEnter={() => (paused = true)}
      onPointerLeave={() => (paused = false)}
      onFocus={() => (paused = true)}
      onBlur={() => (paused = false)}
      // Top on phones so toasts never cover the studio's bottom tool dock.
      className="pointer-events-none fixed inset-x-0 top-14 z-[200] flex flex-col items-center gap-2 p-3 sm:top-auto sm:bottom-0 sm:items-end sm:p-6"
    >
      {items.map((t) => {
        const Icon = ICONS[t.kind];
        return (
          <div
            key={t.id}
            role={t.kind === "error" ? "alert" : "status"}
            className="animate-toast border-line bg-card shadow-pop pointer-events-auto flex w-full max-w-sm items-start gap-3 rounded-2xl border p-3.5"
          >
            <Icon className={cn("mt-0.5 size-5 shrink-0", TONES[t.kind])} aria-hidden="true" />
            <div className="min-w-0 flex-1">
              <p className="text-ink text-sm font-semibold">{t.title}</p>
              {t.description && <p className="text-ink-3 mt-0.5 text-[13px]">{t.description}</p>}
            </div>
            <button
              type="button"
              aria-label="Dismiss"
              onClick={() => dismiss(t.id)}
              className="text-ink-3 hover:bg-paper-2 hover:text-ink flex size-7 items-center justify-center rounded-md"
            >
              <X className="size-4" />
            </button>
          </div>
        );
      })}
    </div>
  );
}
