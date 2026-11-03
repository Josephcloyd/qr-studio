/**
 * SVG renderers for each element type, drawn in the element's local frame
 * (0..width, 0..height). Shared by the editor canvas and every export.
 */
import { memo, useMemo } from "react";
import { fontStack } from "@/lib/fonts/registry";
import {
  ellipsePath,
  fmt,
  heartPath,
  polygonPath,
  regularPolygonPoints,
  roundedRectPath,
  starPoints,
} from "@/lib/geometry/paths";
import type {
  DesignElement,
  IconElement,
  ImageElement,
  QrElement,
  ShapeElement,
  TextElement,
} from "@/lib/model/types";
import { encodePayload } from "@/lib/qr/payloads";
import { layoutText, type Measure } from "@/lib/text/layout";
import { getIcon } from "./icons";
import { PaintDef, paintFill, safeId } from "./paint";
import { QrGraphic, type ResolvedImage } from "./QrGraphic";

export type AssetResolver = (id: string) => ResolvedImage | null;

export interface RenderContext {
  resolveAsset: AssetResolver;
  measure: Measure;
  idPrefix: string;
}

function QrElementGraphic({ el, ctx }: { el: QrElement; ctx: RenderContext }) {
  const encoded = useMemo(() => encodePayload(el.content), [el.content]);
  const logo = el.style.logo.assetId ? ctx.resolveAsset(el.style.logo.assetId) : null;
  return (
    <QrGraphic
      payload={encoded.ok ? encoded.payload : null}
      style={el.style}
      size={el.width}
      idPrefix={safeId(ctx.idPrefix, el.id)}
      logo={logo}
    />
  );
}

function TextElementGraphic({ el, ctx }: { el: TextElement; ctx: RenderContext }) {
  const layout = layoutText(el, ctx.measure);
  const anchor = el.align === "center" ? "middle" : el.align === "right" ? "end" : "start";
  const x =
    el.align === "center"
      ? el.width / 2
      : el.align === "right"
        ? el.width - el.padding
        : el.padding;
  const hasBox = el.background !== null || (el.borderColor !== null && el.borderWidth > 0);
  const inset = el.borderColor ? el.borderWidth / 2 : 0;
  return (
    <g>
      {hasBox && (
        <rect
          x={fmt(inset)}
          y={fmt(inset)}
          width={fmt(Math.max(0, el.width - inset * 2))}
          height={fmt(Math.max(0, layout.height - inset * 2))}
          rx={fmt(el.cornerRadius)}
          fill={el.background ?? "none"}
          stroke={el.borderColor && el.borderWidth > 0 ? el.borderColor : undefined}
          strokeWidth={el.borderWidth > 0 ? fmt(el.borderWidth) : undefined}
        />
      )}
      <text
        fontFamily={fontStack(el.fontFamily)}
        fontSize={fmt(el.fontSize)}
        fontWeight={el.fontWeight}
        fontStyle={el.italic ? "italic" : undefined}
        letterSpacing={el.letterSpacing ? fmt(el.letterSpacing * el.fontSize) : undefined}
        fill={el.color}
        textAnchor={anchor}
        dominantBaseline="central"
        xmlSpace="preserve"
      >
        {layout.lines.map((line, i) => (
          <tspan
            key={i}
            x={fmt(x)}
            y={fmt(el.padding + (i + 0.5) * layout.lineHeight)}
            dominantBaseline="central"
          >
            {line || " "}
          </tspan>
        ))}
      </text>
    </g>
  );
}

function ImageElementGraphic({ el, ctx }: { el: ImageElement; ctx: RenderContext }) {
  const asset = ctx.resolveAsset(el.assetId);
  const clipId = safeId(ctx.idPrefix, el.id, "clip");
  const aspect =
    el.fit === "cover" ? "xMidYMid slice" : el.fit === "contain" ? "xMidYMid meet" : "none";
  const flip = el.flipX || el.flipY;
  const transform = flip
    ? `translate(${el.flipX ? fmt(el.width) : 0} ${el.flipY ? fmt(el.height) : 0}) scale(${el.flipX ? -1 : 1} ${el.flipY ? -1 : 1})`
    : undefined;
  const inset = el.borderColor ? el.borderWidth / 2 : 0;
  return (
    <g>
      <defs>
        <clipPath id={clipId}>
          <rect width={fmt(el.width)} height={fmt(el.height)} rx={fmt(el.cornerRadius)} />
        </clipPath>
      </defs>
      <g clipPath={`url(#${clipId})`}>
        {asset ? (
          <image
            href={asset.href}
            width={fmt(el.width)}
            height={fmt(el.height)}
            preserveAspectRatio={aspect}
            transform={transform}
          />
        ) : (
          <g>
            <rect width={fmt(el.width)} height={fmt(el.height)} fill="#ece8df" />
            <path
              d={`M0 0L${fmt(el.width)} ${fmt(el.height)}M${fmt(el.width)} 0L0 ${fmt(el.height)}`}
              stroke="#c9c2b4"
              strokeWidth={2}
            />
          </g>
        )}
      </g>
      {el.borderColor && el.borderWidth > 0 && (
        <rect
          x={fmt(inset)}
          y={fmt(inset)}
          width={fmt(Math.max(0, el.width - inset * 2))}
          height={fmt(Math.max(0, el.height - inset * 2))}
          rx={fmt(Math.max(0, el.cornerRadius - inset))}
          fill="none"
          stroke={el.borderColor}
          strokeWidth={fmt(el.borderWidth)}
        />
      )}
    </g>
  );
}

function dashArray(el: ShapeElement): string | undefined {
  if (el.strokeStyle === "dashed") return `${fmt(el.strokeWidth * 3)} ${fmt(el.strokeWidth * 2)}`;
  if (el.strokeStyle === "dotted") return `0 ${fmt(el.strokeWidth * 2)}`;
  return undefined;
}

function shapePath(el: ShapeElement, inset: number): string {
  const w = el.width - inset * 2;
  const h = el.height - inset * 2;
  const shift = (pts: { x: number; y: number }[]) =>
    pts.map((p) => ({ x: p.x + inset, y: p.y + inset }));
  switch (el.shape) {
    case "rect": {
      const r = el.cornerRadius;
      return roundedRectPath(inset, inset, w, h, [r, r, r, r]);
    }
    case "ellipse":
      return ellipsePath(el.width / 2, el.height / 2, w / 2, h / 2);
    case "triangle":
      return polygonPath(
        shift([
          { x: w / 2, y: 0 },
          { x: w, y: h },
          { x: 0, y: h },
        ]),
      );
    case "polygon":
      return polygonPath(shift(regularPolygonPoints(w, h, el.sides)));
    case "star":
      return polygonPath(shift(starPoints(w, h, el.sides, el.innerRatio)));
    case "heart":
      return heartPath(w, h).replace(
        /(-?\d+(?:\.\d+)?) (-?\d+(?:\.\d+)?)/g,
        (_, x, y) => `${fmt(+x + inset)} ${fmt(+y + inset)}`,
      );
    default:
      return "";
  }
}

function ShapeElementGraphic({ el, ctx }: { el: ShapeElement; ctx: RenderContext }) {
  const stroke = el.stroke && el.strokeWidth > 0 ? el.stroke : undefined;
  const sw = stroke ? el.strokeWidth : 0;
  const lineCap = el.strokeStyle === "dotted" ? "round" : "butt";
  if (el.shape === "line" || el.shape === "arrow") {
    const y = el.height / 2;
    const head = el.shape === "arrow" ? Math.min(el.width / 2, Math.max(10, sw * 3.2)) : 0;
    return (
      <g>
        <line
          x1={0}
          y1={fmt(y)}
          x2={fmt(el.width - head * 0.6)}
          y2={fmt(y)}
          stroke={el.stroke ?? "#16130f"}
          strokeWidth={fmt(Math.max(0.5, el.strokeWidth))}
          strokeDasharray={dashArray(el)}
          strokeLinecap={lineCap}
        />
        {head > 0 && (
          <path
            d={`M${fmt(el.width - head)} ${fmt(y - head * 0.6)}L${fmt(el.width)} ${fmt(y)}L${fmt(el.width - head)} ${fmt(y + head * 0.6)}Z`}
            fill={el.stroke ?? "#16130f"}
          />
        )}
      </g>
    );
  }
  const fillId = safeId(ctx.idPrefix, el.id, "fill");
  return (
    <g>
      <defs>
        <PaintDef
          id={fillId}
          paint={el.fill}
          box={{ x: 0, y: 0, width: el.width, height: el.height }}
        />
      </defs>
      <path
        d={shapePath(el, sw / 2)}
        fill={paintFill(el.fill, fillId)}
        stroke={stroke}
        strokeWidth={stroke ? fmt(sw) : undefined}
        strokeDasharray={stroke ? dashArray(el) : undefined}
        strokeLinecap={lineCap}
        strokeLinejoin="round"
      />
    </g>
  );
}

function IconElementGraphic({ el }: { el: IconElement }) {
  const { Icon } = getIcon(el.icon);
  return (
    <Icon
      x={0}
      y={0}
      width={fmt(el.width)}
      height={fmt(el.height)}
      color={el.color}
      strokeWidth={el.strokeWidth}
      aria-hidden="true"
    />
  );
}

export function ElementBody({ el, ctx }: { el: DesignElement; ctx: RenderContext }) {
  switch (el.type) {
    case "qr":
      return <QrElementGraphic el={el} ctx={ctx} />;
    case "text":
      return <TextElementGraphic el={el} ctx={ctx} />;
    case "image":
      return <ImageElementGraphic el={el} ctx={ctx} />;
    case "shape":
      return <ShapeElementGraphic el={el} ctx={ctx} />;
    case "icon":
      return <IconElementGraphic el={el} />;
  }
}

export function elementTransform(el: DesignElement): string {
  const rotation = el.rotation
    ? ` rotate(${fmt(el.rotation)} ${fmt(el.width / 2)} ${fmt(el.height / 2)})`
    : "";
  return `translate(${fmt(el.x)} ${fmt(el.y)})${rotation}`;
}

/** One positioned element. Memoized: unchanged elements skip re-render during drags. */
export const PositionedElement = memo(function PositionedElement({
  el,
  ctx,
  interactive,
}: {
  el: DesignElement;
  ctx: RenderContext;
  interactive: boolean;
}) {
  return (
    <g
      transform={elementTransform(el)}
      opacity={el.opacity < 1 ? el.opacity : undefined}
      data-element-id={interactive ? el.id : undefined}
      style={interactive ? { cursor: el.locked ? "default" : "move" } : undefined}
    >
      <ElementBody el={el} ctx={ctx} />
    </g>
  );
});
