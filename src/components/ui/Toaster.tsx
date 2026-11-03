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

const useToasts = create<ToastState>((set, get) => ({
  items: [],
  push: (t) => {
    const id = ++counter;
    set({ items: [...get().items.slice(-3), { ...t, id }] });
    setTimeout(() => get().dismiss(id), DURATION_MS);
  },
  dismiss: (id) => set({ items: get().items.filter((i) => i.id !== id) }),
}));

export const toast = {
  success: (title: string, description?: string) => useToasts.getState().push({ kind: "success", title, description }),
  error: (title: string, description?: string) => useToasts.getState().push({ kind: "error", title, description }),
  info: (title: string, description?: string) => useToasts.getState().push({ kind: "info", title, description }),
};

const ICONS = { success: CheckCircle2, error: CircleAlert, info: Info };
const TONES = { success: "text-success", error: "text-danger", info: "text-cobalt" };

export function Toaster() {
  const items = useToasts((s) => s.items);
  const dismiss = useToasts((s) => s.dismiss);
  return (
    <div
      aria-live="polite"
      className="pointer-events-none fixed inset-x-0 bottom-0 z-[200] flex flex-col items-center gap-2 p-4 sm:items-end sm:p-6"
    >
      {items.map((t) => {
        const Icon = ICONS[t.kind];
        return (
          <div
            key={t.id}
            role={t.kind === "error" ? "alert" : "status"}
            className="animate-toast pointer-events-auto flex w-full max-w-sm items-start gap-3 rounded-2xl border border-line bg-card p-3.5 shadow-pop"
          >
            <Icon className={cn("mt-0.5 size-5 shrink-0", TONES[t.kind])} aria-hidden="true" />
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-ink">{t.title}</p>
              {t.description && <p className="mt-0.5 text-[13px] text-ink-3">{t.description}</p>}
            </div>
            <button
              type="button"
              aria-label="Dismiss"
              onClick={() => dismiss(t.id)}
              className="rounded-md p-0.5 text-ink-3 hover:bg-paper-2 hover:text-ink"
            >
              <X className="size-4" />
            </button>
          </div>
        );
      })}
    </div>
  );
}
