/** SVG path-string builders. Coordinates are rounded to keep paths compact. */

export const fmt = (n: number): string => {
  const v = Math.round(n * 1000) / 1000;
  return Object.is(v, -0) ? "0" : String(v);
};

/** Corner radii in order: top-left, top-right, bottom-right, bottom-left. */
export type Radii = [number, number, number, number];

export function roundedRectPath(x: number, y: number, w: number, h: number, radii: Radii): string {
  const max = Math.min(w, h) / 2;
  const [tl, tr, br, bl] = radii.map((r) => Math.max(0, Math.min(r, max)));
  const arc = (r: number, ex: number, ey: number) =>
    r > 0 ? `A${fmt(r)} ${fmt(r)} 0 0 1 ${fmt(ex)} ${fmt(ey)}` : `L${fmt(ex)} ${fmt(ey)}`;
  return [
    `M${fmt(x + tl)} ${fmt(y)}`,
    `H${fmt(x + w - tr)}`,
    arc(tr, x + w, y + tr),
    `V${fmt(y + h - br)}`,
    arc(br, x + w - br, y + h),
    `H${fmt(x + bl)}`,
    arc(bl, x, y + h - bl),
    `V${fmt(y + tl)}`,
    arc(tl, x + tl, y),
    "Z",
  ].join("");
}

export function rectPath(x: number, y: number, w: number, h: number): string {
  return `M${fmt(x)} ${fmt(y)}h${fmt(w)}v${fmt(h)}h${fmt(-w)}Z`;
}

export function circlePath(cx: number, cy: number, r: number): string {
  return (
    `M${fmt(cx - r)} ${fmt(cy)}` +
    `A${fmt(r)} ${fmt(r)} 0 1 0 ${fmt(cx + r)} ${fmt(cy)}` +
    `A${fmt(r)} ${fmt(r)} 0 1 0 ${fmt(cx - r)} ${fmt(cy)}Z`
  );
}

export function ellipsePath(cx: number, cy: number, rx: number, ry: number): string {
  return (
    `M${fmt(cx - rx)} ${fmt(cy)}` +
    `A${fmt(rx)} ${fmt(ry)} 0 1 0 ${fmt(cx + rx)} ${fmt(cy)}` +
    `A${fmt(rx)} ${fmt(ry)} 0 1 0 ${fmt(cx - rx)} ${fmt(cy)}Z`
  );
}

export function diamondPath(cx: number, cy: number, half: number): string {
  return `M${fmt(cx)} ${fmt(cy - half)}L${fmt(cx + half)} ${fmt(cy)}L${fmt(cx)} ${fmt(cy + half)}L${fmt(cx - half)} ${fmt(cy)}Z`;
}

export function polygonPath(points: { x: number; y: number }[]): string {
  if (points.length === 0) return "";
  const [first, ...rest] = points;
  return `M${fmt(first.x)} ${fmt(first.y)}${rest.map((p) => `L${fmt(p.x)} ${fmt(p.y)}`).join("")}Z`;
}

/** Regular polygon inscribed in the w×h box, first vertex at the top. */
export function regularPolygonPoints(
  w: number,
  h: number,
  sides: number,
): { x: number; y: number }[] {
  const n = Math.max(3, Math.round(sides));
  return Array.from({ length: n }, (_, i) => {
    const a = -Math.PI / 2 + (i * 2 * Math.PI) / n;
    return { x: w / 2 + (Math.cos(a) * w) / 2, y: h / 2 + (Math.sin(a) * h) / 2 };
  });
}

export function starPoints(
  w: number,
  h: number,
  points: number,
  innerRatio: number,
): { x: number; y: number }[] {
  const n = Math.max(3, Math.round(points));
  return Array.from({ length: n * 2 }, (_, i) => {
    const a = -Math.PI / 2 + (i * Math.PI) / n;
    const r = i % 2 === 0 ? 1 : innerRatio;
    return { x: w / 2 + (Math.cos(a) * w * r) / 2, y: h / 2 + (Math.sin(a) * h * r) / 2 };
  });
}

export function heartPath(w: number, h: number): string {
  const p = (x: number, y: number) => `${fmt(x * w)} ${fmt(y * h)}`;
  return (
    `M${p(0.5, 0.92)}` +
    `C${p(0.18, 0.7)} ${p(0, 0.5)} ${p(0, 0.3)}` +
    `C${p(0, 0.12)} ${p(0.14, 0)} ${p(0.29, 0)}` +
    `C${p(0.4, 0)} ${p(0.47, 0.06)} ${p(0.5, 0.14)}` +
    `C${p(0.53, 0.06)} ${p(0.6, 0)} ${p(0.71, 0)}` +
    `C${p(0.86, 0)} ${p(1, 0.12)} ${p(1, 0.3)}` +
    `C${p(1, 0.5)} ${p(0.82, 0.7)} ${p(0.5, 0.92)}Z`
  );
}
