"use client";

import { useEffect, useMemo, useState } from "react";
import { cn } from "@/components/ui/cn";
import { approximateMeasure } from "@/lib/text/layout";
import { canvasMeasure } from "@/lib/text/measure";
import { DocumentSvg } from "@/render/DocumentSvg";
import { getTemplate } from "./index";

/**
 * Live thumbnail rendered by the real engine (no screenshots). Text is
 * measured after mount so server and client markup match.
 */
export function TemplateThumbnail({ id, className }: { id: string; className?: string }) {
  const doc = useMemo(() => getTemplate(id)?.build() ?? null, [id]);
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    let cancelled = false;
    // Re-measure once web fonts are available.
    const ready =
      typeof document !== "undefined" && document.fonts ? document.fonts.ready : Promise.resolve();
    ready.then(() => !cancelled && setMounted(true));
    return () => {
      cancelled = true;
    };
  }, []);
  if (!doc) return null;
  // Fit inside a box: portrait layouts fill the height, landscape the width.
  const portrait = doc.height > doc.width;
  return (
    <div
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
      <DocumentSvg
        doc={doc}
        resolveAsset={() => null}
        measure={mounted ? canvasMeasure : approximateMeasure}
        idPrefix={`tpl-${id}`}
        mode="export"
        className="block h-full w-full"
        width={doc.width}
        height={doc.height}
        title={`${doc.name} template preview`}
      />
    </div>
  );
}
