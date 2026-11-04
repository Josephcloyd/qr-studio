"use client";

import { ArrowUpRight } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/components/ui/cn";
import { Brand } from "./Brand";
import { SupportButton } from "./Support";
import { ThemeToggle } from "./ThemeToggle";

export const NAV = [
  { href: "/", label: "Generator", match: (p: string) => p === "/" },
  { href: "/templates/", label: "Templates", match: (p: string) => p.startsWith("/templates") },
  { href: "/studio/", label: "Studio", match: (p: string) => p.startsWith("/studio") },
];

/** Segmented product navigation shared by the site header and the studio top bar. */
export function ProductNav({ className }: { className?: string }) {
  const pathname = usePathname() ?? "/";
  return (
    <nav
      aria-label="Main"
      className={cn(
        "border-line bg-paper-2 flex items-center gap-0.5 rounded-xl border p-1",
        className,
      )}
    >
      {NAV.map((item) => {
        const active = item.match(pathname);
        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={active ? "page" : undefined}
            className={cn(
              "rounded-lg px-3 py-1.5 text-[13.5px] font-semibold whitespace-nowrap transition-colors",
              active ? "bg-paper-3 text-accent-ink" : "text-ink-2 hover:text-ink",
            )}
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}

export function SiteHeader() {
  return (
    <header className="border-line bg-card/95 sticky top-0 z-40 border-b backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-[1440px] items-center gap-3 px-3 sm:px-5">
        <Brand />
        <ProductNav className="ml-2 hidden md:flex" />
        <div className="ml-auto flex items-center gap-2">
          <ThemeToggle />
          <span className="hidden sm:contents">
            <SupportButton />
          </span>
          <span className="contents sm:hidden">
            <SupportButton compact />
          </span>
          <Link
            href="/studio/"
            className="bg-primary text-on-primary hover:bg-primary-hover hidden h-9 items-center gap-1.5 rounded-lg px-3.5 text-[13.5px] font-semibold transition-colors sm:inline-flex"
          >
            Open studio
            <ArrowUpRight className="size-4" aria-hidden="true" />
          </Link>
        </div>
      </div>
      <div className="border-line border-t px-3 py-2 md:hidden">
        <ProductNav className="w-full justify-between [&>a]:flex-1 [&>a]:text-center" />
      </div>
    </header>
  );
}
