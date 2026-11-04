import Link from "next/link";
import { cn } from "@/components/ui/cn";

/** GetLaunch Ph family mark: a light hexagon badge with the product glyph in brand green. */
export function BrandMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 40 40" className={cn("size-9", className)} aria-hidden="true">
      <path
        d="M20 2.5 35.2 11.25v17.5L20 37.5 4.8 28.75v-17.5Z"
        fill="#f1f5f2"
        stroke="#d5e1da"
        strokeWidth="1"
        strokeLinejoin="round"
      />
      <g fill="#2f8a5f">
        <path
          fillRule="evenodd"
          d="M11.5 11.5h6.5V18h-6.5Zm1.6 1.6v3.3h3.3v-3.3ZM22 11.5h6.5V18H22Zm1.6 1.6v3.3h3.3v-3.3ZM11.5 22h6.5v6.5h-6.5Zm1.6 1.6v3.3h3.3v-3.3Z"
        />
        <rect x="22" y="22" width="2.6" height="2.6" rx="0.6" />
        <rect x="25.9" y="25.9" width="2.6" height="2.6" rx="0.6" />
        <rect x="25.9" y="22" width="2.6" height="2.6" rx="1.3" />
        <rect x="22" y="25.9" width="2.6" height="2.6" rx="0.6" />
      </g>
    </svg>
  );
}

export function Brand({ className, compact = false }: { className?: string; compact?: boolean }) {
  return (
    <Link
      href="/"
      className={cn("group inline-flex items-center gap-2.5 rounded-lg", className)}
      aria-label="QR Studio by GetLaunch Ph — home"
    >
      <BrandMark className="transition-transform duration-300 group-hover:scale-105" />
      {!compact && (
        <span className="flex flex-col leading-none">
          <span className="text-ink text-[17px] font-bold tracking-tight">QR Studio</span>
          <span className="text-ink-3 mt-1 text-[9px] font-semibold tracking-[0.18em] uppercase">
            by GetLaunchPh
          </span>
        </span>
      )}
    </Link>
  );
}
