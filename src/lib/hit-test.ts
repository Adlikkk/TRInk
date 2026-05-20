import type { Drawable, Point } from "../types/drawables";
import { distance, normalizeRect } from "./geometry";

function pointToSegmentDistance(point: Point, a: Point, b: Point) {
  const l2 = (b.x - a.x) ** 2 + (b.y - a.y) ** 2;
  if (l2 === 0) {
    return distance(point, a);
  }

  let t = ((point.x - a.x) * (b.x - a.x) + (point.y - a.y) * (b.y - a.y)) / l2;
  t = Math.max(0, Math.min(1, t));
  const projection = {
    x: a.x + t * (b.x - a.x),
    y: a.y + t * (b.y - a.y)
  };

  return distance(point, projection);
}

export function isPointNearDrawable(point: Point, drawable: Drawable, tolerance = 10) {
  switch (drawable.type) {
    case "freehand":
    case "trend":
      return drawable.points.some((segmentPoint, index, points) => {
        if (index === 0) {
          return distance(point, segmentPoint) <= tolerance;
        }

        return pointToSegmentDistance(point, points[index - 1], segmentPoint) <= tolerance;
      });
    case "arrow":
      return pointToSegmentDistance(point, drawable.start, drawable.end) <= tolerance;
    case "rectangle":
    case "support_resistance_zone": {
      const rect = normalizeRect(drawable.start, drawable.end);
      const expanded = {
        x: rect.x - tolerance,
        y: rect.y - tolerance,
        width: rect.width + tolerance * 2,
        height: rect.height + tolerance * 2
      };

      return (
        point.x >= expanded.x &&
        point.x <= expanded.x + expanded.width &&
        point.y >= expanded.y &&
        point.y <= expanded.y + expanded.height
      );
    }
    case "text":
      return distance(point, drawable.point) <= tolerance * 2;
    case "channel":
      return (
        pointToSegmentDistance(point, drawable.baseStart, drawable.baseEnd) <= tolerance ||
        pointToSegmentDistance(
          point,
          {
            x: drawable.baseStart.x + (drawable.parallelPoint.x - drawable.baseStart.x),
            y: drawable.baseStart.y + (drawable.parallelPoint.y - drawable.baseStart.y)
          },
          {
            x: drawable.baseEnd.x + (drawable.parallelPoint.x - drawable.baseStart.x),
            y: drawable.baseEnd.y + (drawable.parallelPoint.y - drawable.baseStart.y)
          }
        ) <= tolerance
      );
    case "binary_marker":
      return drawable.points.some((markerPoint) => distance(point, markerPoint) <= tolerance * 2);
  }
}
