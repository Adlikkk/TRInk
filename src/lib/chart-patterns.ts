import type { Point } from "../types/drawables";

export type PitchforkVariant = "standard" | "schiff" | "modified_schiff";

export const DEFAULT_FIBONACCI_RETRACEMENT_LEVELS = [0, 0.236, 0.382, 0.5, 0.618, 0.786, 1];
export const DEFAULT_FIBONACCI_FAN_LEVELS = [0.382, 0.5, 0.618];
export const MAX_FIB_LEVELS = 20;

function roundLevel(level: number) {
  return Math.round(level * 10000) / 10000;
}

export function normalizeFibLevels(levels: unknown, fallback: number[]) {
  if (!Array.isArray(levels)) {
    return [...fallback];
  }

  const unique = new Map<string, number>();
  for (const rawLevel of levels) {
    if (typeof rawLevel !== "number" || !Number.isFinite(rawLevel)) {
      continue;
    }

    const normalized = roundLevel(Math.max(-10, Math.min(10, rawLevel)));
    unique.set(normalized.toFixed(4), normalized);
  }

  const next = [...unique.values()].sort((left, right) => left - right).slice(0, MAX_FIB_LEVELS);
  return next.length > 0 ? next : [...fallback];
}

export function formatFibLevelLabel(level: number, showPercentages = false) {
  if (showPercentages) {
    const value = roundLevel(level * 100);
    return `${value.toFixed(value % 1 === 0 ? 0 : value * 10 % 1 === 0 ? 1 : 2)}%`;
  }

  const rounded = roundLevel(level);
  return rounded.toFixed(rounded % 1 === 0 ? 0 : rounded * 10 % 1 === 0 ? 1 : rounded * 100 % 1 === 0 ? 2 : 4).replace(/\.?0+$/, "");
}

export function sanitizePitchforkVariant(value: unknown): PitchforkVariant {
  return value === "schiff" || value === "modified_schiff" ? value : "standard";
}

function midpoint(a: Point, b: Point): Point {
  return { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
}

export function getPitchforkControlPoints(points: Point[], variant: PitchforkVariant) {
  const [a, b, c] = points;
  const bcMidpoint = midpoint(b, c);

  if (variant === "schiff") {
    return {
      anchor: { x: (a.x + bcMidpoint.x) / 2, y: a.y },
      medianTarget: bcMidpoint,
      midpoint: bcMidpoint
    };
  }

  if (variant === "modified_schiff") {
    return {
      anchor: midpoint(a, bcMidpoint),
      medianTarget: bcMidpoint,
      midpoint: bcMidpoint
    };
  }

  return {
    anchor: a,
    medianTarget: bcMidpoint,
    midpoint: bcMidpoint
  };
}

export function getLineRectIntersections(origin: Point, direction: Point, width: number, height: number) {
  const points: Point[] = [];
  const candidates = [
    direction.x !== 0 ? (0 - origin.x) / direction.x : null,
    direction.x !== 0 ? (width - origin.x) / direction.x : null,
    direction.y !== 0 ? (0 - origin.y) / direction.y : null,
    direction.y !== 0 ? (height - origin.y) / direction.y : null
  ];

  for (const t of candidates) {
    if (t === null || !Number.isFinite(t)) {
      continue;
    }

    const point = {
      x: origin.x + direction.x * t,
      y: origin.y + direction.y * t
    };

    if (point.x >= 0 && point.x <= width && point.y >= 0 && point.y <= height) {
      if (!points.some((entry) => Math.abs(entry.x - point.x) < 0.5 && Math.abs(entry.y - point.y) < 0.5)) {
        points.push(point);
      }
    }
  }

  return points;
}

export function getRayEnd(start: Point, through: Point, width: number, height: number) {
  const direction = { x: through.x - start.x, y: through.y - start.y };
  const intersections = getLineRectIntersections(start, direction, width, height);
  let furthest = through;
  let furthestDistance = -1;

  for (const point of intersections) {
    const dot = (point.x - start.x) * direction.x + (point.y - start.y) * direction.y;
    if (dot < 0) {
      continue;
    }
    const distance = (point.x - start.x) ** 2 + (point.y - start.y) ** 2;
    if (distance > furthestDistance) {
      furthest = point;
      furthestDistance = distance;
    }
  }

  return furthest;
}

export function getPitchforkVisibleLines(points: Point[], variant: PitchforkVariant, width: number, height: number) {
  const { anchor, medianTarget } = getPitchforkControlPoints(points, variant);
  const direction = {
    x: medianTarget.x - anchor.x,
    y: medianTarget.y - anchor.y
  };

  const medianIntersections = getLineRectIntersections(anchor, direction, width, height);
  const parallels = [points[1], points[2]].map((pivot) =>
    getLineRectIntersections(pivot, direction, width, height)
  );

  return {
    anchor,
    medianTarget,
    medianLine:
      medianIntersections.length >= 2
        ? { start: medianIntersections[0], end: medianIntersections[1] }
        : null,
    outerLines: parallels
      .filter((line) => line.length >= 2)
      .map((line) => ({ start: line[0], end: line[1] }))
  };
}
