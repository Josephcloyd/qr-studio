"use client";

import { ChevronDown } from "lucide-react";
import { useState, type ReactNode } from "react";
import { cn } from "@/components/ui/cn";

export function Section({
  title,
  children,
  defaultOpen = true,
  action,
}: {
  title: string;
  children: ReactNode;
  defaultOpen?: boolean;
  action?: ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <section className="border-line border-b last:border-b-0">
      <div className="flex items-center justify-between gap-2 px-4 pt-3.5 pb-1">
        <button
          type="button"
          aria-expanded={open}
          onClick={() => setOpen((o) => !o)}
          className="text-ink-3 hover:text-ink flex flex-1 items-center gap-1.5 text-left font-mono text-[10.5px] font-semibold tracking-[0.14em] uppercase"
        >
          <ChevronDown
            className={cn("size-3.5 transition-transform", !open && "-rotate-90")}
            aria-hidden="true"
          />
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
      <h2 className="font-display text-ink text-[19px] font-semibold tracking-tight">{title}</h2>
      {subtitle && <p className="text-ink-3 mt-0.5 text-[12.5px] leading-snug">{subtitle}</p>}
    </div>
  );
}
