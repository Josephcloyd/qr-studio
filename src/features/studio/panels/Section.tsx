"use client";

import { ChevronDown } from "lucide-react";
import { useState, type ReactNode } from "react";
import { cn } from "@/components/ui/cn";

export function Section({ title, children, defaultOpen = true, action }: { title: string; children: ReactNode; defaultOpen?: boolean; action?: ReactNode }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <section className="border-b border-line last:border-b-0">
      <div className="flex items-center justify-between gap-2 px-4 pt-3.5 pb-1">
        <button
          type="button"
          aria-expanded={open}
          onClick={() => setOpen((o) => !o)}
          className="flex flex-1 items-center gap-1.5 text-left font-mono text-[10.5px] font-semibold tracking-[0.14em] text-ink-3 uppercase hover:text-ink"
        >
          <ChevronDown className={cn("size-3.5 transition-transform", !open && "-rotate-90")} aria-hidden="true" />
          {title}
        </button>
        {action}
      </div>
      {open && <div className="grid gap-3.5 px-4 pt-2 pb-4">{children}</div>}
    </section>
  );
}

export function PanelHeading({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div className="px-4 pt-4 pb-3">
      <h2 className="font-display text-[19px] font-semibold tracking-tight text-ink">{title}</h2>
      {subtitle && <p className="mt-0.5 text-[12.5px] leading-snug text-ink-3">{subtitle}</p>}
    </div>
  );
}
