"use client";

import { Menu, X } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { cn } from "@/components/ui/cn";
import { Brand } from "./Brand";

const NAV = [
  { href: "/create/", label: "Generator" },
  { href: "/templates/", label: "Templates" },
  { href: "/studio/", label: "Studio" },
  { href: "/privacy/", label: "Privacy" },
];

export function SiteHeader() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const isActive = (href: string) => pathname?.startsWith(href.replace(/\/$/, ""));

  return (
    <header className="sticky top-0 z-40 border-b border-line/80 bg-paper/85 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6">
        <Brand />
        <nav aria-label="Main" className="hidden items-center gap-1 md:flex">
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              aria-current={isActive(item.href) ? "page" : undefined}
              className={cn(
                "rounded-lg px-3 py-2 text-[14px] font-medium transition-colors",
                isActive(item.href) ? "text-ink" : "text-ink-3 hover:text-ink",
              )}
            >
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="flex items-center gap-2">
          <Link
            href="/create/"
            className="hidden h-10 items-center rounded-xl bg-ink px-4 text-sm font-semibold text-paper transition-colors hover:bg-ink-2 sm:inline-flex"
          >
            Create QR code
          </Link>
          <button
            type="button"
            className="inline-flex size-10 items-center justify-center rounded-xl text-ink md:hidden"
            aria-label={open ? "Close menu" : "Open menu"}
            aria-expanded={open}
            onClick={() => setOpen((o) => !o)}
          >
            {open ? <X className="size-5" /> : <Menu className="size-5" />}
          </button>
        </div>
      </div>
      {open && (
        <nav aria-label="Mobile" className="border-t border-line bg-paper px-4 pt-2 pb-4 md:hidden">
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setOpen(false)}
              className="block rounded-xl px-3 py-3 text-[15px] font-medium text-ink hover:bg-paper-2"
            >
              {item.label}
            </Link>
          ))}
          <Link href="/create/" onClick={() => setOpen(false)} className="mt-2 flex h-12 items-center justify-center rounded-xl bg-ink text-[15px] font-semibold text-paper">
            Create QR code
          </Link>
        </nav>
      )}
    </header>
  );
}
