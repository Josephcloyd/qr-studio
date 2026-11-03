"use client";

import { Dialog as RDialog } from "radix-ui";
import { X } from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "./cn";

interface DialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: ReactNode;
  children: ReactNode;
  footer?: ReactNode;
  className?: string;
  wide?: boolean;
}

export function Dialog({ open, onOpenChange, title, description, children, footer, className, wide }: DialogProps) {
  return (
    <RDialog.Root open={open} onOpenChange={onOpenChange}>
      <RDialog.Portal>
        <RDialog.Overlay className="fixed inset-0 z-[80] bg-ink/40 backdrop-blur-[2px] data-[state=open]:animate-[rise_0.2s_ease-out]" />
        <RDialog.Content
          className={cn(
            "fixed inset-x-0 bottom-0 z-[81] flex max-h-[92dvh] flex-col rounded-t-3xl border border-line bg-card shadow-pop focus:outline-none sm:inset-auto sm:top-1/2 sm:left-1/2 sm:w-[calc(100vw-2rem)] sm:-translate-x-1/2 sm:-translate-y-1/2 sm:rounded-3xl",
            wide ? "sm:max-w-3xl" : "sm:max-w-lg",
            className,
          )}
        >
          <div className="flex items-start justify-between gap-4 border-b border-line px-5 pt-5 pb-4 sm:px-6">
            <div>
              <RDialog.Title className="font-display text-xl font-semibold tracking-tight text-ink">{title}</RDialog.Title>
              {description ? (
                <RDialog.Description className="mt-1 text-[13.5px] text-ink-3">{description}</RDialog.Description>
              ) : (
                <RDialog.Description className="sr-only">{title}</RDialog.Description>
              )}
            </div>
            <RDialog.Close aria-label="Close" className="rounded-lg p-1.5 text-ink-3 hover:bg-paper-2 hover:text-ink">
              <X className="size-5" />
            </RDialog.Close>
          </div>
          <div className="min-h-0 flex-1 overflow-y-auto px-5 py-5 sm:px-6">{children}</div>
          {footer && <div className="flex flex-wrap justify-end gap-2 border-t border-line px-5 py-4 sm:px-6">{footer}</div>}
        </RDialog.Content>
      </RDialog.Portal>
    </RDialog.Root>
  );
}
