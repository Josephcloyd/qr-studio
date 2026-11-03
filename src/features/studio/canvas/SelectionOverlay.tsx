"use client";

import { fmt } from "@/lib/geometry/paths";
import { boundsOf, unionBounds, type HandleDir } from "@/lib/geometry/transform";
import type { Guide } from "@/lib/geometry/snap";
import type { DesignElement } from "@/lib/model/types";

interface SelectionOverlayProps {
  width: number;
  height: number;
  zoom: number;
  selected: DesignElement[];
  hovered: DesignElement | null;
  guides: Guide[];
  marquee: { x: number; y: number; width: number; height: number } | null;
  coarse: boolean;
  showGrid: boolean;
  gridSize: number;
  interacting: boolean;
}

const ALL: HandleDir[] = ["nw", "n", "ne", "e", "se", "s", "sw", "w"];
const CORNERS: HandleDir[] = ["nw", "ne", "se", "sw"];
const CURSORS: Record<HandleDir, string> = {
  n: "ns-resize",
  s: "ns-resize",
  e: "ew-resize",
  w: "ew-resize",
  ne: "nesw-resize",
  sw: "nesw-resize",
  nw: "nwse-resize",
  se: "nwse-resize",
};

export function handlesFor(el: DesignElement): HandleDir[] {
  if (el.type === "qr" || el.type === "icon") return CORNERS;
  if (el.type === "text") return ["nw", "ne", "se", "sw", "e", "w"];
  if (el.type === "shape" && (el.shape === "line" || el.shape === "arrow")) return ["e", "w"];
  return ALL;
}

function handlePos(dir: HandleDir, w: number, h: number): [number, number] {
  const x = dir.includes("w") ? 0 : dir.includes("e") ? w : w / 2;
  const y = dir.includes("n") ? 0 : dir.includes("s") ? h : h / 2;
  return [x, y];
}

/** Rotates a resize cursor to match the element's rotation. */
function cursorFor(dir: HandleDir, rotation: number): string {
  const order: HandleDir[] = ["n", "ne", "e", "se", "s", "sw", "w", "nw"];
  const steps = Math.round(rotation / 45);
  const idx = (order.indexOf(dir) + steps + 800) % 8;
  return CURSORS[order[idx]];
}

export function SelectionOverlay({ width, height, zoom, selected, hovered, guides, marquee, coarse, showGrid, gridSize, interacting }: SelectionOverlayProps) {
  const px = 1 / zoom;
  const hs = (coarse ? 18 : 9) * px;
  const single = selected.length === 1 ? selected[0] : null;
  const union = selected.length > 1 ? unionBounds(selected.map(boundsOf)) : null;

  return (
    <svg
      className="pointer-events-none absolute top-0 left-0 overflow-visible"
      width={width * zoom}
      height={height * zoom}
      viewBox={`0 0 ${fmt(width)} ${fmt(height)}`}
      aria-hidden="true"
    >
      {showGrid && gridSize * zoom >= 6 && (
        <>
          <defs>
            <pattern id="studio-grid" width={gridSize} height={gridSize} patternUnits="userSpaceOnUse">
              <path d={`M${gridSize} 0V${gridSize}H0`} fill="none" stroke="rgb(43 59 255 / 0.18)" strokeWidth={px} />
            </pattern>
          </defs>
          <rect width={width} height={height} fill="url(#studio-grid)" />
        </>
      )}

      {hovered && !selected.some((s) => s.id === hovered.id) && !interacting && (
        <rect
          x={0}
          y={0}
          width={hovered.width}
          height={hovered.height}
          transform={`translate(${fmt(hovered.x)} ${fmt(hovered.y)}) rotate(${fmt(hovered.rotation)} ${fmt(hovered.width / 2)} ${fmt(hovered.height / 2)})`}
          fill="none"
          stroke="var(--cobalt)"
          strokeWidth={1.5 * px}
        />
      )}

      {selected.map((el) => (
        <g key={el.id} transform={`translate(${fmt(el.x)} ${fmt(el.y)}) rotate(${fmt(el.rotation)} ${fmt(el.width / 2)} ${fmt(el.height / 2)})`}>
          <rect
            width={el.width}
            height={el.height}
            fill="none"
            stroke={el.locked ? "var(--ink-3)" : "var(--cobalt)"}
            strokeWidth={(single ? 1.5 : 1) * px}
            strokeDasharray={el.locked ? `${4 * px} ${3 * px}` : undefined}
          />
        </g>
      ))}

      {union && (
        <rect
          x={union.minX}
          y={union.minY}
          width={union.maxX - union.minX}
          height={union.maxY - union.minY}
          fill="none"
          stroke="var(--cobalt)"
          strokeWidth={1.5 * px}
          strokeDasharray={`${5 * px} ${4 * px}`}
        />
      )}

      {single && !single.locked && !interacting && (
        <g transform={`translate(${fmt(single.x)} ${fmt(single.y)}) rotate(${fmt(single.rotation)} ${fmt(single.width / 2)} ${fmt(single.height / 2)})`}>
          <line x1={single.width / 2} y1={0} x2={single.width / 2} y2={-28 * px} stroke="var(--cobalt)" strokeWidth={1.5 * px} />
          <circle
            data-handle="rotate"
            cx={single.width / 2}
            cy={-28 * px}
            r={hs * 0.75}
            fill="var(--card)"
            stroke="var(--cobalt)"
            strokeWidth={1.5 * px}
            style={{ pointerEvents: "all", cursor: "grab" }}
          />
          {handlesFor(single).map((dir) => {
            const [x, y] = handlePos(dir, single.width, single.height);
            const isEdge = dir.length === 1;
            const w = isEdge && (dir === "n" || dir === "s") ? hs * 1.8 : hs;
            const h = isEdge && (dir === "e" || dir === "w") ? hs * 1.8 : hs;
            return (
              <rect
                key={dir}
                data-handle={dir}
                x={x - w / 2}
                y={y - h / 2}
                width={w}
                height={h}
                rx={Math.min(w, h) / 2}
                fill="var(--card)"
                stroke="var(--cobalt)"
                strokeWidth={1.5 * px}
                style={{ pointerEvents: "all", cursor: cursorFor(dir, single.rotation) }}
              />
            );
          })}
        </g>
      )}

      {guides.map((g, i) =>
        g.axis === "x" ? (
          <line key={i} x1={g.position} x2={g.position} y1={g.start} y2={g.end} stroke="var(--accent)" strokeWidth={1 * px} />
        ) : (
          <line key={i} y1={g.position} y2={g.position} x1={g.start} x2={g.end} stroke="var(--accent)" strokeWidth={1 * px} />
        ),
      )}

      {marquee && (
        <rect
          x={marquee.x}
          y={marquee.y}
          width={marquee.width}
          height={marquee.height}
          fill="rgb(43 59 255 / 0.08)"
          stroke="var(--cobalt)"
          strokeWidth={px}
        />
      )}
    </svg>
  );
}
