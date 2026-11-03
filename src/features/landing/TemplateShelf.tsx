"use client";

import { ArrowUpRight } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { cn } from "@/components/ui/cn";
import { TEMPLATE_CATEGORIES, TEMPLATES, type TemplateCategory } from "@/features/templates";
import { TemplateThumbnail } from "@/features/templates/TemplateThumbnail";

export function TemplateShelf({
  limit = 8,
  showTabs = true,
}: {
  limit?: number;
  showTabs?: boolean;
}) {
  const [category, setCategory] = useState<TemplateCategory | "All">("All");
  const list = (
    category === "All" ? TEMPLATES : TEMPLATES.filter((t) => t.category === category)
  ).slice(0, limit);
  return (
    <div>
      {showTabs && (
        <div className="mb-6 flex flex-wrap gap-2" role="tablist" aria-label="Template categories">
          {(["All", ...TEMPLATE_CATEGORIES] as const).map((c) => (
            <button
              key={c}
              type="button"
              role="tab"
              aria-selected={category === c}
              onClick={() => setCategory(c)}
              className={cn(
                "h-9 rounded-full border px-4 text-[13.5px] font-semibold transition-colors",
                category === c
                  ? "border-ink bg-ink text-paper"
                  : "border-line-strong bg-card text-ink-2 hover:border-ink hover:text-ink",
              )}
            >
              {c}
            </button>
          ))}
        </div>
      )}
      <ul className="grid grid-cols-2 gap-x-4 gap-y-8 sm:grid-cols-3 lg:grid-cols-4">
        {list.map((t, i) => (
          <li key={t.id}>
            <Link
              href={`/studio/?template=${t.id}`}
              className="group block"
              aria-label={`Customize the ${t.name} template`}
            >
              <div
                className={cn(
                  "paper-grain border-line bg-paper-2 group-hover:border-ink group-hover:shadow-sheet relative flex aspect-[4/5] items-center justify-center overflow-hidden rounded-2xl border p-5 transition-all duration-300 group-hover:-translate-y-1",
                  i % 3 === 1 && "bg-[#efe8da]",
                )}
              >
                <TemplateThumbnail
                  id={t.id}
                  className="shadow-[0_14px_30px_-14px_rgb(22_19_15/0.55)] transition-transform duration-300 group-hover:scale-[1.03]"
                />
                <span
                  className="bg-ink text-paper absolute top-3 right-3 flex size-8 items-center justify-center rounded-full opacity-0 transition-opacity group-hover:opacity-100"
                  aria-hidden="true"
                >
                  <ArrowUpRight className="size-4" />
                </span>
              </div>
              <div className="mt-3 flex items-baseline justify-between gap-2">
                <span className="text-ink text-[14px] font-semibold">{t.name}</span>
                <span className="text-ink-3 font-mono text-[10.5px] tracking-wider uppercase">
                  {t.category}
                </span>
              </div>
              <p className="text-ink-3 mt-0.5 line-clamp-2 text-[12.5px]">{t.description}</p>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
