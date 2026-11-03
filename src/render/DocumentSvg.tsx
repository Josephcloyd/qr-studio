/**
 * Renders a complete design document as one SVG. The editor, thumbnails and
 * every export (SVG/PNG/PDF) use this exact component, so they always match.
 */
import { useMemo } from "react";
import { fmt } from "@/lib/geometry/paths";
import type { DesignDocument, DocumentBackground } from "@/lib/model/types";
import type { Measure } from "@/lib/text/layout";
import { PositionedElement, type AssetResolver, type RenderContext } from "./elements";
import { PaintDef, paintFill, safeId } from "./paint";

export interface DocumentSvgProps {
  doc: DesignDocument;
  resolveAsset: AssetResolver;
  measure: Measure;
  idPrefix: string;
  /** "edit" adds data attributes for hit-testing. */
  mode: "edit" | "export";
  /** Skip the background fill (transparent PNG). */
  transparent?: boolean;
  /** @font-face rules embedded for portable exports. */
  fontCss?: string | null;
  /** Rendered pixel size; defaults to document size. */
  width?: number;
  height?: number;
  /** Elements to hide (e.g. text being edited inline). */
  hiddenIds?: ReadonlySet<string>;
  className?: string;
  title?: string;
}

function BackgroundPattern({ bg, id, width, height }: { bg: DocumentBackground; id: string; width: number; height: number }) {
  if (bg.pattern === "none") return null;
  const s = bg.patternScale;
  const stroke = { stroke: bg.patternColor, strokeWidth: fmt(Math.max(0.5, s * 0.05)), fill: "none" };
  const tile = {
    dots: <circle cx={fmt(s / 2)} cy={fmt(s / 2)} r={fmt(s * 0.12)} fill={bg.patternColor} />,
    grid: <path d={`M${fmt(s)} 0V${fmt(s)}H0`} {...stroke} />,
    diagonal: <path d={`M0 ${fmt(s)}L${fmt(s)} 0`} {...stroke} />,
    waves: <path d={`M0 ${fmt(s / 2)}Q${fmt(s / 4)} ${fmt(s * 0.2)} ${fmt(s / 2)} ${fmt(s / 2)}T${fmt(s)} ${fmt(s / 2)}`} {...stroke} />,
  }[bg.pattern];
  return (
    <>
      <defs>
        <pattern id={id} patternUnits="userSpaceOnUse" width={fmt(s)} height={fmt(s)}>
          {tile}
        </pattern>
      </defs>
      <rect width={fmt(width)} height={fmt(height)} fill={`url(#${id})`} opacity={bg.patternOpacity} />
    </>
  );
}

export function DocumentSvg({
  doc,
  resolveAsset,
  measure,
  idPrefix,
  mode,
  transparent = false,
  fontCss,
  width,
  height,
  hiddenIds,
  className,
  title,
}: DocumentSvgProps) {
  // Stable context so memoized elements skip re-rendering when unchanged.
  const ctx = useMemo<RenderContext>(() => ({ resolveAsset, measure, idPrefix }), [resolveAsset, measure, idPrefix]);
  const { background: bg } = doc;
  const box = { x: 0, y: 0, width: doc.width, height: doc.height };
  const clipId = safeId(idPrefix, "artboard");
  const bgId = safeId(idPrefix, "bgpaint");
  const patternId = safeId(idPrefix, "pattern");
  const bgImage = bg.imageAssetId ? resolveAsset(bg.imageAssetId) : null;
  const interactive = mode === "edit";

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox={`0 0 ${fmt(doc.width)} ${fmt(doc.height)}`}
      width={fmt(width ?? doc.width)}
      height={fmt(height ?? doc.height)}
      className={className}
      role="img"
      aria-label={title ?? doc.name}
    >
      <defs>
        {fontCss ? <style>{fontCss}</style> : null}
        <clipPath id={clipId}>
          <rect width={fmt(doc.width)} height={fmt(doc.height)} rx={fmt(doc.cornerRadius)} />
        </clipPath>
        <PaintDef id={bgId} paint={bg.paint} box={box} />
      </defs>
      <g clipPath={`url(#${clipId})`}>
        {!transparent && bg.paint.kind !== "none" && (
          <rect width={fmt(doc.width)} height={fmt(doc.height)} fill={paintFill(bg.paint, bgId)} data-role="background" />
        )}
        {bgImage && (
          <image
            href={bgImage.href}
            width={fmt(doc.width)}
            height={fmt(doc.height)}
            preserveAspectRatio={bg.imageFit === "cover" ? "xMidYMid slice" : "xMidYMid meet"}
            opacity={bg.imageOpacity}
          />
        )}
        <BackgroundPattern bg={bg} id={patternId} width={doc.width} height={doc.height} />
        {doc.elements.map((el) =>
          el.hidden || hiddenIds?.has(el.id) ? null : (
            <PositionedElement key={el.id} el={el} ctx={ctx} interactive={interactive} />
          ),
        )}
        {doc.border.width > 0 && (
          <rect
            x={fmt(doc.border.width / 2)}
            y={fmt(doc.border.width / 2)}
            width={fmt(doc.width - doc.border.width)}
            height={fmt(doc.height - doc.border.width)}
            rx={fmt(Math.max(0, doc.cornerRadius - doc.border.width / 2))}
            fill="none"
            stroke={doc.border.color}
            strokeWidth={fmt(doc.border.width)}
          />
        )}
      </g>
    </svg>
  );
}
