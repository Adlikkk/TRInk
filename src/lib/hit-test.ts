import type { Drawable, Point } from "../types/drawables";
import { getPitchforkVisibleLines, getRayEnd } from "./chart-patterns";
import { sanitizeDrawable } from "./drawable-validation";
import { distance, normalizeRect } from "./geometry";
import { isLegacyVerticalMarker } from "./legacy-markers";
import { estimateTextLayout } from "./text-drawable";

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

function getViewportSize() {
  return {
    width: typeof window !== "undefined" ? window.innerWidth : 1920,
    height: typeof window !== "undefined" ? window.innerHeight : 1080
  };
}

export function isPointNearDrawable(point: Point, drawable: Drawable, tolerance = 10) {
  const safeDrawable = sanitizeDrawable(drawable);
  if (!safeDrawable) {
    return false;
  }

  switch (safeDrawable.type) {
    case "freehand":
    case "trend":
      return safeDrawable.points.some((segmentPoint, index, points) => {
        if (index === 0) {
          return distance(point, segmentPoint) <= tolerance;
        }

        return pointToSegmentDistance(point, points[index - 1], segmentPoint) <= tolerance;
      });
    case "line":
    case "arrow":
      return pointToSegmentDistance(point, safeDrawable.start, safeDrawable.end) <= tolerance;
    case "rectangle":
    case "support_resistance_zone": {
      const rect = normalizeRect(safeDrawable.start, safeDrawable.end);
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
      {
        const bounds = estimateTextLayout(safeDrawable);
        return (
          point.x >= bounds.x - tolerance &&
          point.x <= bounds.x + bounds.width + tolerance &&
          point.y >= bounds.y - tolerance &&
          point.y <= bounds.y + bounds.height + tolerance
        );
      }
    case "horizontal_line":
      return Math.abs(point.y - safeDrawable.y) <= tolerance;
    case "vertical_marker":
      return Math.abs(point.x - safeDrawable.x) <= tolerance;
    case "ray": {
      const [start, through] = safeDrawable.points;
      const { width, height } = getViewportSize();
      const end = getRayEnd(start, through, width, height);
      return pointToSegmentDistance(point, start, end) <= tolerance;
    }
    case "channel":
      return (
        pointToSegmentDistance(point, safeDrawable.baseStart, safeDrawable.baseEnd) <= tolerance ||
        pointToSegmentDistance(
          point,
          {
            x: safeDrawable.baseStart.x + (safeDrawable.parallelPoint.x - safeDrawable.baseStart.x),
            y: safeDrawable.baseStart.y + (safeDrawable.parallelPoint.y - safeDrawable.baseStart.y)
          },
          {
            x: safeDrawable.baseEnd.x + (safeDrawable.parallelPoint.x - safeDrawable.baseStart.x),
            y: safeDrawable.baseEnd.y + (safeDrawable.parallelPoint.y - safeDrawable.baseStart.y)
          }
        ) <= tolerance
      );
    case "qm_bullish":
    case "qm_bearish": {
      const nearPath = safeDrawable.points.some((segmentPoint, index, points) => {
        if (index === 0) {
          return distance(point, segmentPoint) <= tolerance;
        }

        return pointToSegmentDistance(point, points[index - 1], segmentPoint) <= tolerance;
      });

      if (nearPath) {
        return true;
      }

      if (safeDrawable.showRetestZone) {
        const anchor = safeDrawable.points[4];
        const reference = safeDrawable.points[3] ?? anchor;
        const zoneWidth = Math.max(48, Math.abs(anchor.x - reference.x) * 0.35);
        const zoneHeight = Math.max(14, safeDrawable.style.strokeWidth * 4);
        return (
          point.x >= anchor.x - zoneWidth / 2 &&
          point.x <= anchor.x + zoneWidth / 2 &&
          point.y >= anchor.y - zoneHeight / 2 &&
          point.y <= anchor.y + zoneHeight / 2
        );
      }

      return false;
    }
    case "bos":
    case "choch":
      return pointToSegmentDistance(point, safeDrawable.points[0], safeDrawable.points[1]) <= tolerance;
    case "fvg": {
      const rect = normalizeRect(safeDrawable.points[0], safeDrawable.points[1]);
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
    case "fibonacci_retracement": {
      const [start, end] = safeDrawable.points;
      const { width } = getViewportSize();
      const left = safeDrawable.extendLeft ? 0 : Math.min(start.x, end.x);
      const right = safeDrawable.extendRight ? width : Math.max(start.x, end.x);
      const top = Math.min(start.y, end.y);
      const bottom = Math.max(start.y, end.y);
      return safeDrawable.levels.some((level) => {
        const y = top + (bottom - top) * level;
        return point.x >= left - tolerance && point.x <= right + tolerance && Math.abs(point.y - y) <= tolerance;
      });
    }
    case "fibonacci_fan": {
      const [start, end] = safeDrawable.points;
      const { width, height } = getViewportSize();
      return safeDrawable.levels.some((level) => {
        const through = { x: end.x, y: start.y + (end.y - start.y) * level };
        return pointToSegmentDistance(point, start, getRayEnd(start, through, width, height)) <= tolerance;
      });
    }
    case "andrews_pitchfork": {
      const { width, height } = getViewportSize();
      const geometry = getPitchforkVisibleLines(
        safeDrawable.points,
        safeDrawable.variant ?? "standard",
        width,
        height
      );
      const visibleLines = [
        ...(safeDrawable.showMedianLine !== false && geometry.medianLine ? [geometry.medianLine] : []),
        ...(safeDrawable.showOuterLines !== false ? geometry.outerLines : []),
        ...(safeDrawable.showAnchorLine === true
          ? [{ start: geometry.anchor, end: geometry.medianTarget }]
          : [])
      ];
      return visibleLines.some((line) => pointToSegmentDistance(point, line.start, line.end) <= tolerance);
    }
    case "liquidity_sweep":
      return (
        pointToSegmentDistance(point, safeDrawable.points[0], safeDrawable.points[1]) <= tolerance ||
        pointToSegmentDistance(
          point,
          {
            x: (safeDrawable.points[0].x + safeDrawable.points[1].x) / 2,
            y: (safeDrawable.points[0].y + safeDrawable.points[1].y) / 2
          },
          safeDrawable.points[2]
        ) <= tolerance ||
        distance(point, safeDrawable.points[2]) <= tolerance * 1.5
      );
    case "binary_marker":
      if (isLegacyVerticalMarker(safeDrawable)) {
        const anchor = safeDrawable.points[0];
        return anchor ? Math.abs(point.x - anchor.x) <= tolerance : false;
      }

      if (safeDrawable.markerType === "call_marker" || safeDrawable.markerType === "put_marker") {
        const anchor = safeDrawable.points[0];
        if (!anchor) {
          return false;
        }
        const direction = safeDrawable.markerType === "call_marker" ? -1 : 1;
        return (
          pointToSegmentDistance(point, anchor, { x: anchor.x, y: anchor.y + direction * 42 }) <= tolerance ||
          distance(point, anchor) <= tolerance * 2
        );
      }

      return safeDrawable.points.some((markerPoint) => distance(point, markerPoint) <= tolerance * 2);
  }
}
