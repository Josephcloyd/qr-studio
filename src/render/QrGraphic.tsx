/**
 * Renders a styled QR code as SVG. Pure and deterministic, so it can render
 * in the editor, in exports (renderToStaticMarkup), and in Node tests.
 */
import { useMemo } from "react";
import { fmt } from "@/lib/geometry/paths";
import { computeQrLayout, type QrLayout } from "@/lib/qr/layout";
import { buildMatrix } from "@/lib/qr/matrix";
import { effectiveEcLevel, hasActiveLogo, sanitizeQrStyle, type QrStyle } from "@/lib/qr/style";
import { PaintDef, paintFill, safeId } from "./paint";

export interface ResolvedImage {
  href: string;
  width: number;
  height: number;
}

export interface QrGraphicProps {
  payload: string | null;
  style: QrStyle;
  /** Rendered side length in the parent's units. */
  size: number;
  idPrefix: string;
  logo?: ResolvedImage | null;
}

export function useQrLayout(
  payload: string | null,
  style: QrStyle,
  logo?: ResolvedImage | null,
): QrLayout | null {
  return useMemo(() => qrLayoutFor(payload, style, logo), [payload, style, logo]);
}

export function qrLayoutFor(
  payload: string | null,
  style: QrStyle,
  logo?: ResolvedImage | null,
): QrLayout | null {
  if (!payload) return null;
  const effective = logo ? style : { ...style, logo: { ...style.logo, assetId: null } };
  const result = buildMatrix(payload, effectiveEcLevel(effective));
  if (!result.ok) return null;
  const aspect = logo && logo.height > 0 ? logo.width / logo.height : 1;
  return computeQrLayout(result.matrix, effective, { logoAspect: aspect });
}

/** Neutral placeholder shown while content is empty or invalid. */
function QrPlaceholder({ size }: { size: number }) {
  const s = size / 29;
  const block = (x: number, y: number) => (
    <g key={`${x}-${y}`}>
      <rect
        x={x * s}
        y={y * s}
        width={7 * s}
        height={7 * s}
        rx={s}
        fill="none"
        stroke="#c9c4ba"
        strokeWidth={s}
      />
      <rect
        x={(x + 2) * s}
        y={(y + 2) * s}
        width={3 * s}
        height={3 * s}
        rx={s * 0.5}
        fill="#c9c4ba"
      />
    </g>
  );
  return (
    <g>
      <rect width={size} height={size} fill="#f4f1ea" />
      {block(2.5, 2.5)}
      {block(19.5, 2.5)}
      {block(2.5, 19.5)}
      <rect x={12 * s} y={12 * s} width={5 * s} height={5 * s} rx={s} fill="#ddd8ce" />
    </g>
  );
}

export function QrGraphic({ payload, style: rawStyle, size, idPrefix, logo }: QrGraphicProps) {
  const style = useMemo(() => sanitizeQrStyle(rawStyle), [rawStyle]);
  const activeLogo = hasActiveLogo(style) && logo ? logo : null;
  const layout = useQrLayout(payload, style, activeLogo);
  if (!layout) return <QrPlaceholder size={size} />;

  const scale = size / layout.total;
  const box = { x: 0, y: 0, width: layout.total, height: layout.total };
  const fgId = safeId(idPrefix, "fg");
  const bgId = safeId(idPrefix, "bg");
  const fgFill = paintFill(style.foreground, fgId);
  const { logo: logoBox, plate } = layout;
  const plateRadius =
    style.logo.plate === "circle"
      ? (plate?.width ?? 0) / 2
      : style.logo.plate === "rounded"
        ? 1.4
        : 0;

  return (
    <g transform={`scale(${fmt(scale)})`}>
      <defs>
        <PaintDef id={fgId} paint={style.foreground} box={box} />
        <PaintDef id={bgId} paint={style.background} box={box} />
      </defs>
      {style.background.kind !== "none" && (
        <rect width={layout.total} height={layout.total} fill={paintFill(style.background, bgId)} />
      )}
      <path d={layout.modulesPath} fill={fgFill} />
      {layout.finders.map((f, i) => (
        <g key={i}>
          <path d={f.frame} fill={style.finderFrameColor ?? fgFill} fillRule="evenodd" />
          <path d={f.dot} fill={style.finderDotColor ?? fgFill} />
        </g>
      ))}
      {plate && (
        <rect
          x={fmt(plate.x)}
          y={fmt(plate.y)}
          width={fmt(plate.width)}
          height={fmt(plate.height)}
          rx={fmt(plateRadius)}
          fill={style.logo.plateColor}
        />
      )}
      {activeLogo && logoBox && (
        <image
          href={activeLogo.href}
          x={fmt(logoBox.x)}
          y={fmt(logoBox.y)}
          width={fmt(logoBox.width)}
          height={fmt(logoBox.height)}
          opacity={style.logo.opacity}
          preserveAspectRatio="xMidYMid meet"
        />
      )}
    </g>
  );
}

/** Standalone <svg> wrapper (generator preview, landing page, QR-only export). */
export function QrSvg(props: QrGraphicProps & { className?: string; title?: string }) {
  const { className, title, size, ...rest } = props;
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox={`0 0 ${size} ${size}`}
      width={size}
      height={size}
      className={className}
      role="img"
      aria-label={title ?? "QR code"}
    >
      <QrGraphic size={size} {...rest} />
    </svg>
  );
}
