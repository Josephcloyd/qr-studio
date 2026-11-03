"use client";

import {
  CircleAlert,
  CircleCheck,
  Info,
  LoaderCircle,
  ScanLine,
  TriangleAlert,
} from "lucide-react";
import { cn } from "@/components/ui/cn";
import type { ReadabilityIssue } from "@/lib/qr/readability";
import type { ScanStatus } from "./useScanCheck";

const SCAN_COPY: Record<ScanStatus, { label: string; tone: string; Icon: typeof CircleCheck }> = {
  idle: { label: "Add content to scan-check", tone: "bg-paper-2 text-ink-3", Icon: ScanLine },
  checking: { label: "Checking scan…", tone: "bg-paper-2 text-ink-2", Icon: LoaderCircle },
  pass: { label: "Scan check passed", tone: "bg-success-soft text-success", Icon: CircleCheck },
  fail: { label: "Scan check failed", tone: "bg-danger-soft text-danger", Icon: CircleAlert },
};

export function ScanBadge({ status, className }: { status: ScanStatus; className?: string }) {
  const { label, tone, Icon } = SCAN_COPY[status];
  return (
    <span
      role="status"
      aria-live="polite"
      data-scan-status={status}
      title="Decoded locally in your browser with an independent QR reader"
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[12px] font-semibold",
        tone,
        className,
      )}
    >
      <Icon
        className={cn("size-3.5", status === "checking" && "animate-spin")}
        aria-hidden="true"
      />
      {label}
    </span>
  );
}

const ISSUE_ICON = { error: CircleAlert, warning: TriangleAlert, info: Info };
const ISSUE_TONE = {
  error: "border-danger/25 bg-danger-soft/60 text-danger",
  warning: "border-warning/25 bg-warning-soft/70 text-warning",
  info: "border-line bg-paper-2/70 text-ink-2",
};

export function ReadabilityList({
  issues,
  scanStatus,
}: {
  issues: ReadabilityIssue[];
  scanStatus: ScanStatus;
}) {
  const visible =
    scanStatus === "fail"
      ? [
          {
            id: "scan-fail",
            severity: "error" as const,
            message:
              "We couldn't decode this design. Increase contrast, simplify styling, or shrink the logo.",
          },
          ...issues,
        ]
      : issues;
  if (!visible.length) {
    return (
      <p className="text-ink-3 flex items-center gap-2 text-[12.5px]">
        <CircleCheck className="text-success size-4" aria-hidden="true" />
        No readability concerns.
      </p>
    );
  }
  return (
    <ul className="grid gap-2" aria-label="Readability checks">
      {visible.map((issue) => {
        const Icon = ISSUE_ICON[issue.severity];
        return (
          <li
            key={issue.id}
            className={cn(
              "flex gap-2 rounded-xl border px-3 py-2 text-[12.5px] leading-snug",
              ISSUE_TONE[issue.severity],
            )}
          >
            <Icon className="mt-px size-4 shrink-0" aria-hidden="true" />
            <span className="text-ink-2">{issue.message}</span>
          </li>
        );
      })}
    </ul>
  );
}
