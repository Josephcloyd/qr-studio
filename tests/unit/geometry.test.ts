import { describe, expect, it } from "vitest";
import { snapMove, snapToGrid } from "@/lib/geometry/snap";
import {
  boundsIntersect,
  boundsOf,
  center,
  containsPoint,
  corners,
  normalizeAngle,
  resizeBox,
  rotate,
  rotationFor,
  unionBounds,
} from "@/lib/geometry/transform";
import {
  circlePath,
  heartPath,
  polygonPath,
  regularPolygonPoints,
  roundedRectPath,
  starPoints,
  fmt,
} from "@/lib/geometry/paths";
import type { Box } from "@/lib/model/types";

const box = (patch: Partial<Box> = {}): Box => ({
  x: 100,
  y: 100,
  width: 200,
  height: 100,
  rotation: 0,
  ...patch,
});
const close = (a: number, b: number) => expect(a).toBeCloseTo(b, 6);

describe("transform basics", () => {
  it("rotates points clockwise in y-down space", () => {
    const p = rotate({ x: 1, y: 0 }, 90);
    close(p.x, 0);
    close(p.y, 1);
  });
  it("computes rotated bounds", () => {
    const b = boundsOf(box({ rotation: 90 }));
    close(b.maxX - b.minX, 100);
    close(b.maxY - b.minY, 200);
    expect(corners(box())).toHaveLength(4);
  });
  it("hit-tests rotated boxes", () => {
    const b = box({ rotation: 45 });
    expect(containsPoint(b, center(b))).toBe(true);
    expect(containsPoint(b, { x: 100, y: 100 })).toBe(false);
  });
  it("unions and intersects bounds", () => {
    const u = unionBounds([boundsOf(box()), boundsOf(box({ x: 400 }))])!;
    expect(u.maxX).toBe(600);
    expect(unionBounds([])).toBeNull();
    expect(boundsIntersect(boundsOf(box()), boundsOf(box({ x: 250 })))).toBe(true);
    expect(boundsIntersect(boundsOf(box()), boundsOf(box({ x: 500 })))).toBe(false);
  });
  it("normalizes angles to (-180, 180]", () => {
    expect(normalizeAngle(370)).toBe(10);
    expect(normalizeAngle(-190)).toBe(170);
  });
});

describe("resizeBox", () => {
  it("keeps the opposite corner fixed (unrotated)", () => {
    const r = resizeBox(box(), "se", { x: 400, y: 300 });
    expect(r).toMatchObject({ x: 100, y: 100, width: 300, height: 200 });
  });
  it("resizes from the west edge", () => {
    const r = resizeBox(box(), "w", { x: 50, y: 999 });
    expect(r.x).toBeCloseTo(50);
    expect(r.width).toBeCloseTo(250);
    expect(r.height).toBe(100);
  });
  it("keeps the anchor fixed in world space when rotated", () => {
    const b = box({ rotation: 30 });
    const anchorBefore = corners(b)[0]; // nw corner is the anchor for se
    const r = resizeBox(b, "se", { x: 420, y: 330 });
    const anchorAfter = corners(r)[0];
    close(anchorAfter.x, anchorBefore.x);
    close(anchorAfter.y, anchorBefore.y);
  });
  it("locks aspect ratio on corners and edges", () => {
    const corner = resizeBox(box(), "se", { x: 500, y: 150 }, { keepAspect: true });
    expect(corner.width / corner.height).toBeCloseTo(2);
    const edge = resizeBox(box(), "e", { x: 500, y: 0 }, { keepAspect: true });
    expect(edge.width / edge.height).toBeCloseTo(2);
    const vertical = resizeBox(box(), "s", { x: 0, y: 300 }, { keepAspect: true });
    expect(vertical.width / vertical.height).toBeCloseTo(2);
  });
  it("resizes from center", () => {
    const r = resizeBox(box(), "e", { x: 350, y: 150 }, { fromCenter: true });
    expect(center(r).x).toBeCloseTo(200);
    expect(r.width).toBeCloseTo(300);
  });
  it("enforces a minimum size", () => {
    const r = resizeBox(box(), "se", { x: 0, y: 0 }, { minSize: 10 });
    expect(r.width).toBe(10);
    expect(r.height).toBe(10);
  });
});

describe("rotationFor", () => {
  const b = box();
  it("points the handle up at 0°", () => {
    expect(rotationFor(b, { x: 200, y: 0 }, null)).toBe(0);
    expect(rotationFor(b, { x: 400, y: 150 }, null)).toBe(90);
  });
  it("snaps to increments and magnetizes to right angles", () => {
    expect(rotationFor(b, { x: 260, y: 40 }, 15) % 15).toBe(0);
    expect(rotationFor(b, { x: 202, y: 0 }, null)).toBe(0);
  });
});

describe("snapping", () => {
  const canvas = { width: 1000, height: 800 };
  it("snaps to the canvas center with a guide", () => {
    const r = snapMove({ minX: 397, minY: 10, maxX: 597, maxY: 60 }, [], canvas, 6);
    expect(r.dx).toBe(3);
    expect(r.guides.some((g) => g.axis === "x" && g.position === 500)).toBe(true);
  });
  it("snaps to other elements' edges", () => {
    const r = snapMove(
      { minX: 0, minY: 205, maxX: 50, maxY: 255 },
      [{ minX: 300, minY: 100, maxX: 400, maxY: 200 }],
      canvas,
      8,
    );
    expect(r.dy).toBe(-5);
  });
  it("does nothing outside the threshold", () => {
    const r = snapMove({ minX: 120, minY: 130, maxX: 170, maxY: 170 }, [], canvas, 4);
    expect(r).toEqual({ dx: 0, dy: 0, guides: [] });
  });
  it("snaps values to a grid", () => {
    expect(snapToGrid(37, 24)).toBe(48);
    expect(snapToGrid(37, 0)).toBe(37);
  });
});

describe("paths", () => {
  it("formats numbers compactly", () => {
    expect(fmt(1.23456)).toBe("1.235");
    expect(fmt(-0.0001)).toBe("0");
  });
  it("builds shape paths", () => {
    expect(roundedRectPath(0, 0, 10, 10, [2, 0, 2, 0])).toContain("A2 2");
    expect(roundedRectPath(0, 0, 10, 10, [0, 0, 0, 0])).not.toContain("A");
    expect(circlePath(5, 5, 5).startsWith("M0 5")).toBe(true);
    expect(regularPolygonPoints(100, 100, 6)).toHaveLength(6);
    expect(starPoints(100, 100, 5, 0.5)).toHaveLength(10);
    expect(polygonPath([])).toBe("");
    expect(heartPath(100, 100).endsWith("Z")).toBe(true);
  });
});
