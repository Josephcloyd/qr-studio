"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { afterSplash } from "@/components/site/splash";
import { cn } from "@/components/ui/cn";
import { canvasMeasure } from "@/lib/text/measure";
import { DocumentSvg } from "@/render/DocumentSvg";
import { getTemplate } from "./index";

/**
 * Live thumbnail rendered by the real engine (no screenshots). The SVG is
 * drawn only in the browser: templates get fresh random ids on every build,
 * so server-rendered markup could never match, and inlining 20 SVGs would
 * bloat the static HTML. The server renders a correctly sized placeholder.
 */
export function TemplateThumbnail({ id, className }: { id: string; className?: string }) {
  const doc = useMemo(() => getTemplate(id)?.build() ?? null, [id]);
  const [mounted, setMounted] = useState(false);
  const boxRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const box = boxRef.current;
    if (!box) return;
    let cancelled = false;
    // Draw only when near the viewport, after web fonts load (so text measures
    // right) and after the loading screen (so 20 SVGs can't stutter its intro).
    const io = new IntersectionObserver(
      (entries) => {
        if (!entries.some((e) => e.isIntersecting)) return;
        io.disconnect();
        void Promise.all([document.fonts?.ready, afterSplash()]).then(
          () => !cancelled && setMounted(true),
        );
      },
      { rootMargin: "300px" },
    );
    io.observe(box);
    return () => {
      cancelled = true;
      io.disconnect();
    };
  }, []);
  if (!doc) return null;
  // Fit inside a box: portrait layouts fill the height, landscape the width.
  const portrait = doc.height > doc.width;
  return (
    <div
      ref={boxRef}
      className={cn(
        "overflow-hidden",
        portrait ? "h-full w-auto max-w-full" : "h-auto max-h-full w-full",
        className,
      )}
      style={{
        aspectRatio: `${doc.width} / ${doc.height}`,
        borderRadius: `${(doc.cornerRadius / doc.width) * 100}% / ${(doc.cornerRadius / doc.height) * 100}%`,
      }}
    >
      {mounted ? (
        <DocumentSvg
          doc={doc}
          resolveAsset={() => null}
          measure={canvasMeasure}
          idPrefix={`tpl-${id}`}
          mode="export"
          className="block h-full w-full"
          width={doc.width}
          height={doc.height}
          title={`${doc.name} template preview`}
        />
      ) : (
        <div className="bg-paper-3 h-full w-full animate-pulse" aria-hidden="true" />
      )}
    </div>
  );
}
