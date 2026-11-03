import Link from "next/link";
import { cn } from "@/components/ui/cn";

export function BrandMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" className={cn("size-8", className)} aria-hidden="true">
      <rect width="32" height="32" rx="9" fill="var(--ink)" />
      <g fill="var(--paper)">
        <path
          fillRule="evenodd"
          d="M6 6h8v8H6zm2 2v4h4V8zM18 6h8v8h-8zm2 2v4h4V8zM6 18h8v8H6zm2 2v4h4v-4z"
        />
        <rect x="9" y="9" width="2" height="2" />
        <rect x="21" y="9" width="2" height="2" />
        <rect x="9" y="21" width="2" height="2" />
        <rect x="18" y="18" width="3" height="3" />
        <rect x="23" y="23" width="3" height="3" />
      </g>
      <circle cx="24.5" cy="19.5" r="2.5" fill="var(--accent)" />
    </svg>
  );
}

export function Brand({ className, compact = false }: { className?: string; compact?: boolean }) {
  return (
    <Link
      href="/"
      className={cn("group inline-flex items-center gap-2.5 rounded-lg", className)}
      aria-label="QR Studio home"
    >
      <BrandMark className="transition-transform duration-300 group-hover:-rotate-6" />
      {!compact && (
        <span className="flex flex-col leading-none">
          <span className="font-display text-ink text-[19px] font-semibold tracking-tight">
            QR Studio
          </span>
          <span className="text-ink-3 mt-0.5 font-mono text-[9.5px] tracking-[0.14em] uppercase">
            by GetLaunch Ph
          </span>
        </span>
      )}
    </Link>
  );
}
