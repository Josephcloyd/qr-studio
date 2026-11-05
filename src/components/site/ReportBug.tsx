"use client";

import { Bug, Copy, Mail, X } from "lucide-react";
import { Popover } from "radix-ui";
import type { MouseEvent } from "react";
import { toast } from "@/components/ui/Toaster";
import { cn } from "@/components/ui/cn";
import { BUG_REPORT_EMAIL, bugReportMailto, type BugReportContext } from "@/lib/support/bugReport";

/** Browser details read at click time (never during prerender). Path only, no query string. */
function currentContext(): BugReportContext {
  return {
    page: window.location.pathname,
    userAgent: navigator.userAgent,
    screen: `${window.screen.width}×${window.screen.height}`,
    viewport: `${window.innerWidth}×${window.innerHeight}`,
  };
}

/** Opens the person's email app with a pre-filled report. QR Studio sends nothing itself. */
export function openBugReport(): void {
  const a = document.createElement("a");
  a.href = bugReportMailto(currentContext());
  a.click();
}

/** Fills in browser details just before the mailto: link is followed. */
const withContext = (e: MouseEvent<HTMLAnchorElement>) => {
  e.currentTarget.href = bugReportMailto(currentContext());
};

export function ReportBugLink({
  className,
  withIcon = false,
}: {
  className?: string;
  withIcon?: boolean;
}) {
  return (
    <a
      href={bugReportMailto(null)}
      onClick={withContext}
      className={cn("inline-flex items-center gap-1.5", className)}
    >
      {withIcon && <Bug className="size-3.5" aria-hidden="true" />}
      Report a bug
    </a>
  );
}

async function copyAddress() {
  try {
    await navigator.clipboard.writeText(BUG_REPORT_EMAIL);
    toast.success("Email address copied", BUG_REPORT_EMAIL);
  } catch {
    toast.info("Couldn't copy automatically", `Our address is ${BUG_REPORT_EMAIL}`);
  }
}

/**
 * Chat-style bubble in the lower-right corner. `fixed` pins it to the window
 * (site pages); `absolute` pins it to the nearest positioned parent (studio canvas).
 * `className` sets the corner offset and replaces the default.
 */
export function BugReportBubble({
  position = "fixed",
  className = "right-4 bottom-4 sm:right-5 sm:bottom-5",
}: {
  position?: "fixed" | "absolute";
  className?: string;
}) {
  return (
    <Popover.Root>
      <Popover.Trigger asChild>
        <button
          type="button"
          aria-label="Report a bug"
          title="Report a bug"
          className={cn(
            position,
            "bg-primary text-on-primary shadow-pop hover:bg-primary-hover focus-visible:ring-accent z-[60] inline-flex size-12 items-center justify-center rounded-full rounded-br-md transition-transform hover:scale-105 focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none data-[state=open]:scale-95",
            className,
          )}
        >
          <Bug className="size-5" aria-hidden="true" />
        </button>
      </Popover.Trigger>
      <Popover.Portal>
        <Popover.Content
          side="top"
          align="end"
          sideOffset={10}
          collisionPadding={12}
          className="border-line bg-card shadow-pop z-[70] w-[min(320px,calc(100vw-24px))] rounded-2xl rounded-br-md border p-4 data-[state=open]:animate-[rise_0.18s_ease-out]"
        >
          <div className="flex items-start gap-3">
            <span className="bg-primary/15 text-accent-ink inline-flex size-9 shrink-0 items-center justify-center rounded-full">
              <Bug className="size-4" aria-hidden="true" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-ink text-[14px] font-semibold">Found a bug?</p>
              <p className="text-ink-2 mt-1 text-[13px] leading-snug">
                Tell us what went wrong and we&apos;ll fix it. Screenshots help a lot.
              </p>
            </div>
            <Popover.Close
              aria-label="Close"
              className="text-ink-3 hover:bg-paper-2 hover:text-ink -mt-1 -mr-1 inline-flex size-7 items-center justify-center rounded-lg"
            >
              <X className="size-4" aria-hidden="true" />
            </Popover.Close>
          </div>
          <div className="mt-4 grid gap-2">
            <a
              href={bugReportMailto(null)}
              onClick={withContext}
              className="bg-primary text-on-primary hover:bg-primary-hover inline-flex h-10 items-center justify-center gap-2 rounded-xl text-[13.5px] font-semibold"
            >
              <Mail className="size-4" aria-hidden="true" />
              Email a bug report
            </a>
            <button
              type="button"
              onClick={() => void copyAddress()}
              className="border-line text-ink-2 hover:bg-paper-2 hover:text-ink inline-flex h-9 items-center justify-center gap-2 rounded-xl border text-[12.5px] font-medium"
            >
              <Copy className="size-3.5" aria-hidden="true" />
              Copy email address
            </button>
          </div>
          <p className="text-ink-3 mt-3 text-[11.5px] leading-snug">
            Opens your email app with a draft to{" "}
            <span className="text-ink-2 break-all">{BUG_REPORT_EMAIL}</span>. Nothing is sent until
            you press send, and your design is never included.
          </p>
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  );
}
