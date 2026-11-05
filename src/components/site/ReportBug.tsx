"use client";

import { Bug } from "lucide-react";
import type { MouseEvent } from "react";
import { bugReportMailto, type BugReportContext } from "@/lib/support/bugReport";
import { cn } from "@/components/ui/cn";

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

export function ReportBugLink({
  className,
  withIcon = false,
}: {
  className?: string;
  withIcon?: boolean;
}) {
  // Static fallback href for prerender / no-JS; details are filled in on click.
  const onClick = (e: MouseEvent<HTMLAnchorElement>) => {
    e.currentTarget.href = bugReportMailto(currentContext());
  };
  return (
    <a
      href={bugReportMailto(null)}
      onClick={onClick}
      className={cn("inline-flex items-center gap-1.5", className)}
    >
      {withIcon && <Bug className="size-3.5" aria-hidden="true" />}
      Report a bug
    </a>
  );
}
