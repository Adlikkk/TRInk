import type { Point } from "../types/drawables";

export function clampPoint(point: Point, width: number, height: number): Point {
  return {
    x: Math.max(0, Math.min(width, point.x)),
    y: Math.max(0, Math.min(height, point.y))
  };
}

export function distance(a: Point, b: Point): number {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

export function normalizeRect(a: Point, b: Point) {
  return {
    x: Math.min(a.x, b.x),
    y: Math.min(a.y, b.y),
    width: Math.abs(a.x - b.x),
    height: Math.abs(a.y - b.y)
  };
}

export function constrainAngle(from: Point, to: Point): Point {
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  const angle = Math.atan2(dy, dx);
  const snap = Math.PI / 4;
  const snapped = Math.round(angle / snap) * snap;
  const length = Math.hypot(dx, dy);

  return {
    x: from.x + Math.cos(snapped) * length,
    y: from.y + Math.sin(snapped) * length
  };
}
